"""同步 mock 工具；审批由外部事件提供，等待本身不会授权。"""
from dataclasses import dataclass, field

TERMINAL = {'COMPLETED', 'FAILED', 'CANCELLED'}


@dataclass
class Run:
    scenario: str
    state: str = 'READY'
    attempts: int = 0
    approved: bool = False
    events: list = field(default_factory=lambda: ['READY'])


def move(run, state):
    run.state = state
    run.events.append(state)


def drive(run, event=None):
    """一次调用运行到等待或终态；同一 Run 对象可以携带明确事件恢复。"""
    if run.state in TERMINAL:
        return run  # 重复完成或迟到审批不能重新启动工具。
    if event == 'cancel':
        move(run, 'CANCELLED')
        return run
    if run.state == 'WAITING_APPROVAL':
        if event is None:
            return run
        if event == 'reject':
            move(run, 'FAILED')
            return run
        if event != 'approve':
            raise ValueError('等待 approve、reject 或 cancel')
        run.approved = True
        move(run, 'RUNNING')
    elif event is not None:
        raise ValueError('审批事件只能作用于等待审批的任务')

    for _ in range(8):
        if run.state == 'READY':
            move(run, 'VALIDATING')
        elif run.state == 'VALIDATING':
            if run.scenario == 'forbidden':
                move(run, 'FAILED')
            elif run.scenario == 'write' and not run.approved:
                move(run, 'WAITING_APPROVAL')
            else:
                move(run, 'RUNNING')
        elif run.state == 'RUNNING':
            assert run.scenario != 'write' or run.approved
            run.attempts += 1
            failed = run.scenario == 'always-timeout' or (run.scenario == 'timeout' and run.attempts == 1)
            move(run, ('FAILED' if run.attempts >= 2 else 'RETRY_WAIT') if failed else 'COMPLETED')
        elif run.state == 'RETRY_WAIT':
            move(run, 'RUNNING')
        if run.state in TERMINAL or run.state == 'WAITING_APPROVAL':
            return run
    raise AssertionError('状态机没有在预算内停下')


def main():
    for scenario in ('read', 'timeout', 'forbidden', 'always-timeout'):
        run = drive(Run(scenario))
        print(scenario + ':', ' -> '.join(run.events), 'attempts=', run.attempts)
    write = drive(Run('write'))
    assert write.state == 'WAITING_APPROVAL' and write.attempts == 0
    drive(write)  # 没有外部决定，仍然等待。
    assert not write.approved and write.attempts == 0
    print('write pending:', ' -> '.join(write.events))
    drive(write, 'approve')  # 测试程序显式扮演外部批准者。
    assert write.state == 'COMPLETED' and write.attempts == 1
    print('write approved:', ' -> '.join(write.events))
    for event in ('reject', 'cancel'):
        run = drive(Run('write'))
        drive(run, event)
        assert run.attempts == 0 and run.state in TERMINAL
        print(event + ':', ' -> '.join(run.events))
    print('等待、批准、拒绝、取消与有限重试检查通过')


if __name__ == '__main__':
    main()
