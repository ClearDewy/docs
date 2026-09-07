"""CPU 教学 Decoder：显式 QKV/causal mask、右移标签、训练与可恢复 checkpoint。"""
import argparse
import copy
import hashlib
from pathlib import Path
import tempfile

import torch
from torch import nn
from torch.nn import functional as F

CONFIG = dict(vocab_size=8, context=8, width=32, heads=4, layers=2)
VOCAB = '_^pqabc$'  # _ 为 PAD，^/$ 为序列边界；字符 ID 只是查表索引。
TRAIN_TEXTS = ['^pab$', '^qac$']
EVAL_TEXTS = ['^paab$', '^qaac$']  # 新长度，独立字符串；不保证模型能泛化。


def batch(texts, context=8):
    if any(len(text) - 1 > context for text in texts):
        raise ValueError('样本超出 context；请缩短文本或重建模型配置')
    ids = [[VOCAB.index(char) for char in text] for text in texts]
    length = max(len(row) - 1 for row in ids)
    inputs = [row[:-1] + [0] * (length - len(row) + 1) for row in ids]
    labels = [row[1:] + [0] * (length - len(row) + 1) for row in ids]
    return torch.tensor(inputs), torch.tensor(labels)


class Block(nn.Module):
    def __init__(self, width, heads):
        super().__init__()
        self.heads, self.dim = heads, width // heads
        self.norm1, self.norm2 = nn.LayerNorm(width), nn.LayerNorm(width)
        self.qkv, self.out = nn.Linear(width, 3 * width), nn.Linear(width, width)
        self.ffn = nn.Sequential(nn.Linear(width, 4 * width), nn.GELU(), nn.Linear(4 * width, width))

    def forward(self, x):
        b, t, c = x.shape
        q, k, v = self.qkv(self.norm1(x)).chunk(3, dim=-1)
        q, k, v = [a.reshape(b, t, self.heads, self.dim).transpose(1, 2) for a in (q, k, v)]
        scores = (q @ k.transpose(-2, -1)) / self.dim ** 0.5
        future = torch.ones(t, t, dtype=torch.bool, device=x.device).triu(1)
        weights = scores.masked_fill(future, float('-inf')).softmax(dim=-1)
        read = (weights @ v).transpose(1, 2).contiguous().reshape(b, t, c)
        x = x + self.out(read)
        return x + self.ffn(self.norm2(x))


class TinyLM(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.config = config
        self.token = nn.Embedding(config['vocab_size'], config['width'])
        self.position = nn.Embedding(config['context'], config['width'])
        self.blocks = nn.Sequential(*[Block(config['width'], config['heads']) for _ in range(config['layers'])])
        self.norm = nn.LayerNorm(config['width'])
        self.head = nn.Linear(config['width'], config['vocab_size'])

    def forward(self, ids):
        if ids.size(1) > self.config['context']:
            raise ValueError('输入长度超过模型 context')
        x = self.token(ids) + self.position(torch.arange(ids.size(1), device=ids.device))
        return self.head(self.norm(self.blocks(x)))


def loss_for(model, x, y):
    # 右侧 PAD 只能被后续 PAD 读取；有效 query 看不到右侧 PAD。
    # flatten 明确将 [B,T,V] 转成 cross_entropy 需要的 [N,V]。
    return F.cross_entropy(model(x).reshape(-1, len(VOCAB)), y.reshape(-1), ignore_index=0)


def update(model, optimizer, x, y):
    model.train()
    optimizer.zero_grad(set_to_none=True)
    loss = loss_for(model, x, y)
    if not torch.isfinite(loss):
        raise ValueError('非有限 loss：先检查数据、标签和学习率')
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    optimizer.step()
    return loss.item()


@torch.no_grad()
def evaluate(model, texts):
    model.eval()
    return loss_for(model, *batch(texts, model.config['context'])).item()


@torch.no_grad()
def generate(model, prompt, max_new_tokens=6):
    if not prompt or any(char not in VOCAB or char in '_$' for char in prompt):
        raise ValueError('prompt 必须非空，且只含词表中的非 PAD/EOS 字符')
    model.eval()
    ids = torch.tensor([[VOCAB.index(char) for char in prompt]])
    for _ in range(max_new_tokens):
        if ids.size(1) >= model.config['context']:
            return ''.join(VOCAB[i] for i in ids[0].tolist()), 'context_limit'
        scores = model(ids)[:, -1, :].clone()
        scores[:, [VOCAB.index('_'), VOCAB.index('^')]] = float('-inf')
        chosen = scores.argmax(-1, keepdim=True)  # greedy，无随机采样。
        ids = torch.cat((ids, chosen), dim=1)
        if chosen.item() == VOCAB.index('$'):
            return ''.join(VOCAB[i] for i in ids[0].tolist()), 'eos'
    return ''.join(VOCAB[i] for i in ids[0].tolist()), 'max_new_tokens'


def audit_causality(model):
    # 相同前缀、不同未来：前两位置 logits 必须相同。
    model.eval()
    a, _ = batch(['^pab$'])
    b = a.clone()
    b[0, 2:] = torch.tensor([VOCAB.index('q'), VOCAB.index('c')])
    with torch.no_grad():
        torch.testing.assert_close(model(a)[:, :2], model(b)[:, :2], rtol=0, atol=1e-6)


def load_checkpoint(path):
    # 只加载自己生成的文件；weights_only 限定反序列化范围。
    state = torch.load(path, map_location='cpu', weights_only=True)
    if state['vocab'] != VOCAB or state['train_texts'] != TRAIN_TEXTS:
        raise ValueError('词表/训练数据身份不匹配，请使用配套脚本与 checkpoint')
    model = TinyLM(state['config'])
    model.load_state_dict(state['model'])
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.01)
    optimizer.load_state_dict(state['optimizer'])
    torch.set_rng_state(state['rng'])
    return model, optimizer, state


def experiment(path, steps=200):
    torch.manual_seed(7)
    torch.set_num_threads(1)
    model = TinyLM(CONFIG)
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.01)
    x, y = batch(TRAIN_TEXTS)
    assert x[0].tolist() == [VOCAB.index(c) for c in '^pab']
    assert y[0].tolist() == [VOCAB.index(c) for c in 'pab$']
    audit_causality(model)
    initial = evaluate(model, TRAIN_TEXTS)
    initial_embedding = model.token.weight.detach().clone()
    print('torch=', torch.__version__, 'device=cpu seed=7 threads=1')
    print('parameters=', sum(p.numel() for p in model.parameters()), 'input=', list(x.shape), 'logits=', list(model(x).shape))
    for step in range(1, steps + 1):
        update(model, optimizer, x, y)
        if step in (1, 50, 100, steps):
            print(f'step={step} train_loss={evaluate(model, TRAIN_TEXTS):.4f} heldout_loss={evaluate(model, EVAL_TEXTS):.4f}')
    final = evaluate(model, TRAIN_TEXTS)
    assert final < initial * 0.5, '固定小 batch 未学会：检查 loss、mask 与梯度'
    assert not torch.equal(initial_embedding, model.token.weight)
    audit_causality(model)
    state = dict(config=CONFIG, vocab=VOCAB, train_texts=TRAIN_TEXTS, eval_texts=EVAL_TEXTS,
                 model=model.state_dict(), optimizer=optimizer.state_dict(), step=steps,
                 rng=torch.get_rng_state(), torch_version=str(torch.__version__),
                 data_hash=hashlib.sha256('\n'.join(TRAIN_TEXTS).encode()).hexdigest())
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(state, path)
    loaded, restored_optimizer, restored = load_checkpoint(path)
    with torch.no_grad():
        torch.testing.assert_close(model(x), loaded(x), rtol=0, atol=0)
    for prompt, expected in (('^pa', '^pab$'), ('^qa', '^qac$')):
        print('generate:', generate(loaded, prompt))
        assert generate(loaded, prompt) == (expected, 'eos')
        assert generate(model, prompt) == generate(loaded, prompt)
    # 相同 batch 上各继续一步，验证优化器状态也恢复，而非只验证权重。
    original_optimizer = copy.deepcopy(optimizer.state_dict())
    update(model, optimizer, x, y)
    update(loaded, restored_optimizer, x, y)
    for a, b in zip(model.parameters(), loaded.parameters()):
        torch.testing.assert_close(a, b, rtol=0, atol=0)
    assert restored['step'] == steps and original_optimizer['state']
    print('PASS: shift / causal mask / parameter update / reload / resume')
    print('checkpoint:', path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkpoint', type=Path, default=Path('artifacts/tiny-transformer.pt'))
    parser.add_argument('--steps', type=int, default=200)
    parser.add_argument('--generate-only', action='store_true')
    parser.add_argument('--prompt', default='^pa')
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.generate_only:
        model, _, _ = load_checkpoint(args.checkpoint)
        print(generate(model, args.prompt))
    elif args.self_test:
        with tempfile.TemporaryDirectory() as folder:
            experiment(Path(folder) / 'tiny.pt', args.steps)
    else:
        experiment(args.checkpoint, args.steps)


if __name__ == '__main__':
    main()
