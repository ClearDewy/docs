---
title: 任务状态与调度器怎样选择运行者
date: 2026-09-05
updated: 2026-09-06
type: lesson
status: learnable
track: embedded
chapter: rtos-concurrency
prerequisites: [/embedded/interrupts-and-realtime/timer-dma-deadline]
outcomes:
  - 能区分运行、就绪、阻塞与挂起状态
  - 能解释抢占、时间片和周期唤醒的时间行为
estimated: 50min
categories: [嵌入式]
tags: [RTOS, Task, Scheduler]
description: 用采样、处理和通信任务追踪单核优先级调度及其状态转移。
---

# 任务状态与调度器怎样选择运行者

## 任务不是函数列表

每个任务有自己的栈、寄存器现场、状态和调度属性。单核任一时刻只有一个任务处于 RUNNING：

```text
READY --被选中--> RUNNING --等待队列/时间--> BLOCKED
  ↑                    │                     │
  └────抢占/时间片─────┘        事件/超时────┘
```

BLOCKED 不是“低优先级”，而是当前没有资格运行；READY 表示有资格但 CPU 被别人占用。挂起通常由显式管理动作造成，与等待事件不同。

<ClientOnly><RtosSchedulerDemo /></ClientOnly>

本演示有处理、通信和 Idle 三个任务；“ADC 新样本”按钮模拟任务外的采样事件。事件和挂起操作立即触发调度；每次“下一 tick”让当前任务完成一个工作单元，再选择运行者。处理任务等待样本，通信任务等待处理结果。调度器总从 READY 集合选择最高优先级，不应让等待任务忙循环消耗 CPU。

## 延时与周期唤醒

“执行后延时 10 ms”会把执行时间加入周期，产生漂移；“延时到绝对下一个释放时刻”更适合稳定周期。Tick 分辨率、唤醒抖动和时钟源仍要计入时间预算。

## 优先级不是业务地位

优先级表达实时紧迫性和阻塞关系，而非模块的重要性。过多最高优先级任务会让系统难以分析；持续 READY 的高优先级任务会饿死低优先级任务。

## 常见误解

- 创建更多任务能提高单核吞吐；上下文切换反而有成本；
- `delay` 是精确执行时刻；它通常只保证在某时刻后重新就绪；
- 空闲任务运行说明系统“没有工作”；它也可能执行回收和低功耗入口；
- 优先级设置正确就没有数据竞争；调度和数据所有权是两类问题。

下一步：[同步、通信与内存](/embedded/rtos-concurrency/synchronization-memory)。
