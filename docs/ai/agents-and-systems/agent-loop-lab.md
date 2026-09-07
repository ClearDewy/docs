---
title: 单工具 Agent 状态机实验
date: 2026-09-05
updated: 2026-09-06
type: lab
status: verified
track: ai
chapter: agents-and-systems
prerequisites: [/ai/agents-and-systems/reliability-and-multi-agent]
outcomes:
  - 能运行成功、一次超时重试和写入审批三条路径
  - 能用断言保证循环上限、终止状态和审批条件
  - 能扩展取消和永久失败而不产生开放状态
estimated: 50min
categories: [智能算法]
tags: [Agent, State Machine, Python]
description: 用标准库实现单工具状态机，并以断言验证成功、重试和审批路径全部闭环。
---

# 单工具 Agent 状态机实验

## 命题

模型可替换，但 Harness 的状态、审批、重试和终止不变量必须由确定性代码保证。实验使用 mock 场景，不访问外部系统、不产生副作用。

<ClientOnly><AgentLoopLabPlayground /></ClientOnly>

先找到代码中的 `drive(write, 'approve')`：这是测试程序显式输入的外部批准事件。删去这一行时，写任务必须一直停在 `WAITING_APPROVAL`，`attempts=0`。等待不是授权。

| 输入路径 | 停止状态 | 工具次数 |
| --- | --- | ---: |
| read | COMPLETED | 1 |
| timeout | COMPLETED | 2 |
| write，未给决定 | WAITING_APPROVAL，可恢复 | 0 |
| write + approve | COMPLETED | 1 |
| write + reject | FAILED | 0 |
| write + cancel | CANCELLED | 0 |
| forbidden | FAILED | 0 |
| always-timeout | FAILED | 2 |

真实系统应从有身份验证的 UI/API 收取审批，并持久化待办状态。本实验用同一个 `Run` 对象和显式事件模拟接口，不包含真实工具、异步执行和跨进程恢复。命令行运行同一份源码：`python3 examples/python/agent_state_lab.py`。

## 反事实任务

1. 暂不看实现，为 `forbidden` 写一个 attempts 为 0 的断言；
2. 为等待审批的任务输入 `cancel`，再发送迟到的 `approve`，确认不会执行工具；
3. 删除循环上限，解释工具持续失败时的风险；
4. 为每次工具 attempt 增加唯一 ID 与共享幂等键；
5. 故意让重复完成事件到达，保证不会二次转移。

## 记录与通过条件

保存状态图、事件序列、断言结果和失败注入。每次调用必须在预算内进入终态或可恢复等待态；等待态收到决定后必须闭环；审批前不得进入写工具；重试次数和总步数有上限。

## 常见失败

- while 循环只有成功出口；
- approval 是布尔变量但未持久化；
- 重试创建新的业务幂等身份；
- terminal state 仍接受工具结果；
- 事件日志没有 run/call/attempt 身份。

## 下一步

查阅[系统速查](/ai/agents-and-systems/reference)，完成[章节验收](/ai/agents-and-systems/review)。
