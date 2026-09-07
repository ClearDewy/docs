---
title: 系统工程
article: false
description: 从计算机基础到分布式系统、软件架构与可靠性工程的系统知识库。
---

# 系统工程

这个专栏关注传统软件系统如何设计、实现、运行和演进，强调系统边界、工程权衡与可验证性。

## 学习主线

系统工程不是从底到顶走完一次的流水线，而是一组相互约束的层次；可靠性、安全、可观测性和交付能力必须贯穿每一层。

<ClientOnly>
  <MermaidDiagram
    title="系统分层与横切工程能力"
    :code="`flowchart LR
      subgraph Stack[系统分层]
        direction TB
        A[应用与产品] --- B[服务与软件架构]
        B --- C[数据库、存储与消息]
        C --- D[操作系统、网络与运行时]
        D --- E[基础设施与计算资源]
      end
      Q[可靠性、安全、可观测性] -. 贯穿各层 .-> A
      Q -.-> C
      Q -.-> E
      P[测试、交付与自动化] -. 持续演进 .-> B
      P -.-> D`"
  />
</ClientOnly>

## 当前内容

- [本地 Python 项目准备](/systems/python-project-workflow)
- [在浏览器运行 Python](/systems/browser-python)
- [可复现的代码示例](/systems/reproducible-examples)

从[系统工程知识地图](/systems/roadmap)开始查看完整结构。
