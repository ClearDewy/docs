---
title: 第 7 章复习与验收
date: 2026-09-05
updated: 2026-09-06
type: review
status: learnable
track: ai
chapter: agents-and-systems
prerequisites: [/ai/agents-and-systems/agent-loop-lab]
outcomes:
  - 能设计可引用 RAG、工具协议和显式 Agent 状态机
  - 能处理权限、重试、记忆、恢复与多 Agent 责任边界
estimated: 90min
categories: [智能算法]
tags: [Review, RAG, Agent, Systems]
description: 通过检索分层、工具契约、状态路径和失败恢复任务验收智能系统知识。
---

# 第 7 章复习与验收

<KnowledgeQuiz storage-key="agent-systems-review-v1" :questions="[
 {id:'r7-1',type:'boolean',prompt:'最终答案正确足以证明 RAG 召回了正确文档。',answer:false,explanation:'模型可能依靠参数或猜测。'},
 {id:'r7-2',type:'single',prompt:'模型生成工具 JSON 后谁负责权限校验？',options:['模型自己','Harness/确定性应用层','文档内容'],answer:'Harness/确定性应用层',explanation:'模型不是授权来源。'},
 {id:'r7-3',type:'fill',prompt:'写工具超时后用于避免重复副作用的关键身份是什么？',answer:['幂等键','idempotency key','idempotency_key'],explanation:'还应查询首次调用状态。'},
 {id:'r7-4',type:'boolean',prompt:'把全部对话永久保存就是可靠长期记忆。',answer:false,explanation:'还缺来源、版本、过期、权限与删除。'},
 {id:'r7-5',type:'open',prompt:'设计一个可恢复的日历 Agent 路径。',rubric:['显式状态与事件','schema/对象权限','写入前精确审批','幂等调用与超时查询','持久化结果/取消','终止状态和审计'],reference:'模型提出动作，Harness 验证和等待审批，工具按幂等身份执行，结果成为带身份 observation 并关闭状态。'}
]" />

## 综合设计任务

为“检索政策并可选创建提醒”画出：

1. 文档 manifest、切块、索引、权限与版本；
2. corpus/retrieval/context/answer 四层评测；
3. search 与 calendar.create 两份工具 schema；
4. 只读成功、无证据拒答、工具超时、写入审批、取消五条状态路径；
5. 上下文、任务状态、长期记忆和外部知识存储边界；
6. run/call/attempt/event 身份与 trace；
7. 多 Agent 如确有必要时的任务卡与合并 owner；
8. 运行[状态机实验](/ai/agents-and-systems/agent-loop-lab)并独立验证禁止、拒绝、取消与迟到批准事件。

## 不照抄的代码迁移

1. 用 [RAG 实验](/ai/agents-and-systems/rag-pipeline)问“餐饮报销上限是多少”，在运行前写下当前版本、数值与引用；
2. 只将身份改成 guest，确认候选与引用都不能泄漏 staff 内容；
3. 将 Agent 停在等待审批，重复调用 `drive(run)` 三次，再输入 reject；工具次数必须始终为 0；
4. 给拒绝后的同一任务发送 approve，确认终态和事件记录不变。

参考：第 1 题为 `100 元/日`、`travel-2026:s2`；第 2 题无可用证据；第 3、4 题可以用 `run.attempts == 0` 与状态/日志快照比较验收。通过只表示确定性检索与 mock 状态机实现正确，真实模型、工具副作用和跨进程持久化另做集成验收。

## 评分

RAG 与引用 2 分、工具协议 2 分、状态闭环 2 分、权限审批 2 分、记忆恢复 2 分、实验 2 分。10/12 以上且不存在模型自主授权或开放循环视为合格。

完成后进入[MiniMind 全链路实践](/ai/minimind-practice)，或按项目需要转向系统工程专题。
