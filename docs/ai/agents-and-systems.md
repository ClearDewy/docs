---
title: 7. 检索、Agent 与智能系统
date: 2026-09-05
updated: 2026-09-06
type: overview
status: learnable
track: ai
categories: [智能算法]
tags: [RAG, Tools, Agent, Systems]
description: 从检索证据和工具协议出发，构建具有显式状态、权限、恢复与评测的可控 Agent 系统。
---

# 7. 检索、Agent 与智能系统

Agent 不是“更长的 Prompt”。它是模型处于一个软件控制循环中：读取显式状态、提出动作、调用外部工具、接收观察并决定下一步。

```text
目标 → 状态/上下文 → 模型决策 → 结构化动作
→ 权限与参数校验 → 工具执行 → observation
→ 状态转移 → 完成 / 继续 / 等待 / 失败
```

模型负责不确定判断；Harness 负责状态、权限、预算、重试、审批和恢复。

## 固定案例

“根据内部政策回答生效日期；必要时检索文档；若用户要求修改日历，先展示计划并等待审批。”该案例包含只读检索和有副作用工具，适合逐步加入边界。

## 学习顺序

| 顺序 | 页面 | 完成证据 |
| ---: | --- | --- |
| 1 | [RAG 怎样从文档得到可引用证据](/ai/agents-and-systems/rag-pipeline) | 能追踪解析、切块、召回、重排与引用 |
| 2 | [怎样分别评测检索与回答](/ai/agents-and-systems/retrieval-evaluation) | 能区分 recall、context 和 grounded answer 错误 |
| 3 | [工具调用为什么是一份协议](/ai/agents-and-systems/tool-protocol) | 能定义 schema、错误和副作用 |
| 4 | [Agent Loop 怎样成为显式状态机](/ai/agents-and-systems/agent-state-machine) | 能画出状态、事件、动作和终止条件 |
| 5 | [上下文、会话状态与长期记忆怎样区分](/ai/agents-and-systems/memory-and-context) | 能为事实定义来源、过期与删除 |
| 6 | [重试、审批与多 Agent 怎样保持可控](/ai/agents-and-systems/reliability-and-multi-agent) | 能设计幂等、恢复、预算和责任边界 |
| 7 | [单工具 Agent 状态机实验](/ai/agents-and-systems/agent-loop-lab) | 运行成功、超时、等待、批准、拒绝和取消路径 |
| 8 | [检索与 Agent 系统速查](/ai/agents-and-systems/reference) | 查询协议和不变量 |
| 9 | [第 7 章复习与验收](/ai/agents-and-systems/review) | 完成端到端系统设计与故障归因 |

## 什么时候不需要 Agent

- 规则明确且步骤固定：确定性程序；
- 只需一次语言理解：单次模型调用 + schema；
- 只缺外部事实：检索 + 一次生成；
- 只有需要根据中间 observation 选择下一步时，才引入循环；
- 高风险动作不因“使用 Agent”获得更大权限。

## 过关标准

能把模型调用、检索、工具副作用、持久状态、权限审批、重试恢复和评测证据分开；任意状态变化有明确事件、唯一 owner 和可重放记录。

完成本章后可进入[MiniMind 全链路实践](/ai/minimind-practice)，或转向具体系统专题。
