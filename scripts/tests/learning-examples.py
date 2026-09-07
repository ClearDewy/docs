"""针对课程要求的变式与拒绝路径；直接验证页面引用的同一份代码。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'examples/python'))
from bigram_lab import train, softmax, generate
from agent_state_lab import Run, drive

texts = ['^abab$', '^abab$', '^ab$', '^abab$']
vocab, base, _ = train(texts)
changed_vocab, changed, _ = train(texts + ['^aaaa$'] * 20)
p_base = softmax(base[vocab.index('a')])[vocab.index('a')]
p_changed = softmax(changed[changed_vocab.index('a')])[changed_vocab.index('a')]
assert p_changed > p_base + 0.3
assert generate(changed_vocab, changed) == generate(changed_vocab, changed)
_, shuffled, loss = train(texts, shuffle_targets=True)
assert loss[-1] < loss[0]  # 标签破坏不等于不能优化。
assert all(abs(sum(softmax(row)) - 1) < 1e-12 for row in shuffled)
for decision, expected in [(None, 'WAITING_APPROVAL'), ('approve', 'COMPLETED'), ('reject', 'FAILED'), ('cancel', 'CANCELLED')]:
    run = drive(Run('write'))
    drive(run, decision)
    assert run.state == expected and run.attempts == (1 if decision == 'approve' else 0)
    if decision is not None:
        before = (run.state, run.attempts, list(run.events))
        drive(run, 'approve')
        assert before == (run.state, run.attempts, run.events)
assert drive(Run('forbidden')).attempts == 0
assert drive(Run('always-timeout')).state == 'FAILED'
assert drive(Run('timeout')).attempts == 2
print('learning variants and approval boundaries passed')
