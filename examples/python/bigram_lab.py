"""浏览器与命令行共用的 bigram 实验；改变数据不改变概率不变量。"""
from math import exp, log
from random import Random


def softmax(row, temperature=1.0):
    if temperature <= 0:
        raise ValueError('temperature 必须大于 0')
    scaled = [value / temperature for value in row]
    peak = max(scaled)
    values = [exp(value - peak) for value in scaled]
    return [value / sum(values) for value in values]


def train(sequences, shuffle_targets=False, epochs=401):
    vocab = sorted(set(''.join(sequences)))
    ids = {token: index for index, token in enumerate(vocab)}
    pairs = [(a, b) for text in sequences for a, b in zip(text, text[1:])]
    if shuffle_targets:
        targets = [b for _, b in pairs]
        Random(7).shuffle(targets)
        pairs = [(a, b) for (a, _), b in zip(pairs, targets)]
    logits = [[0.0] * len(vocab) for _ in vocab]
    history = []
    for epoch in range(epochs):
        gradients = [[0.0] * len(vocab) for _ in vocab]
        loss = 0.0
        for current, target in pairs:
            row, target_id = ids[current], ids[target]
            probabilities = softmax(logits[row])
            loss -= log(probabilities[target_id])
            for candidate in range(len(vocab)):
                gradients[row][candidate] += probabilities[candidate] - (candidate == target_id)
        history.append(loss / len(pairs))
        for row in range(len(vocab)):
            for col in range(len(vocab)):
                logits[row][col] -= 0.8 * gradients[row][col] / len(pairs)
    return vocab, logits, history


def generate(vocab, logits, seed=7, temperature=0.7, max_tokens=12):
    rng, current, output = Random(seed), '^', []
    for _ in range(max_tokens):
        probabilities = softmax(logits[vocab.index(current)], temperature)
        token = rng.choices(vocab, weights=probabilities, k=1)[0]
        if token == '$':
            break
        output.append(token)
        current = token
    return ''.join(output)


def main():
    # 实验二只改此处；实验一改 shuffle_targets；实验三只改 temperature。
    extra_a_sequences = 0
    shuffle_targets = False
    temperature = 0.7
    sequences = ['^abab$', '^abab$', '^ab$', '^abab$'] + ['^aaaa$'] * extra_a_sequences
    vocab, logits, losses = train(sequences, shuffle_targets)
    for epoch in (0, 100, 200, 400):
        print(f'epoch={epoch:3d} loss={losses[epoch]:.4f}')
    print('概率列顺序:', vocab)
    for token, row in zip(vocab, logits):
        probabilities = softmax(row)
        assert abs(sum(probabilities) - 1.0) < 1e-12
        print(token, '->', vocab[max(range(len(vocab)), key=lambda i: probabilities[i])],
              [round(value, 3) for value in probabilities])
    sample = generate(vocab, logits, temperature=temperature)
    assert sample == generate(vocab, logits, temperature=temperature)
    assert len(sample) <= 12 and set(sample) <= set(vocab)
    assert losses[-1] < losses[0]
    print('sample:', sample)
    print('概率、优化和复现检查通过；数据规律需比较转移分布，不限定某一句输出。')


if __name__ == '__main__':
    main()
