---
title: 4. 基础模型与生成系统
date: 2026-09-05
updated: 2026-09-06
type: overview
status: learnable
track: ai
categories: [智能算法]
tags: [Language Model, Foundation Model, Generation]
description: 从训练样本出发组装、训练和推理完整语言模型，再理解架构家族、Scaling、MoE、多模态与扩散模型。
---

# 4. 基础模型与生成系统

前 3 章已经回答：矩阵怎样计算、神经网络怎样学习、Transformer Block 怎样更新 token 表示。本章继续完成从“一个 Block”到“可以训练和生成的基础模型”的跨越。

```text
文本与图片等原始对象
→ 训练样本与遮罩
→ 完整模型结构
→ loss、反向传播与参数更新
→ 规模、显存与计算预算
→ Prefill、KV Cache 与采样
→ 架构家族、MoE 和多模态生成
```

本章不是模型名词表。每个新概念都必须能定位到一个输入、一段计算、一个输出和一个验证任务。

## 目标读者与前置知识

适合已经完成：

- [模型计算与优化基础](/ai/foundations)；
- [神经网络](/ai/deep-learning)；
- [Transformer](/ai/transformers)。

不要求读者知道 GPT、BERT、T5、MoE 或扩散模型内部实现。本章会先完成 Decoder-only 语言模型闭环，再比较其他家族。

## 全章固定例子

核心主线使用同一段教学 token：

```text
<BOS>  我  喜欢  猫  <EOS>
```

固定符号：

| 符号 | 含义 | 教学值 |
| --- | --- | ---: |
| `B` | batch 中的序列数 | 1 或 2 |
| `T` | 每条序列的位置数 | 4 |
| `C` | 隐藏宽度 | 4 |
| `L` | Decoder Block 层数 | 2 |
| `V` | 教学候选词表大小 | 4 |

候选 token 统一使用 `猫、狗、书、<EOS>`。这些数字是人为缩小的教学坐标，不代表真实 tokenizer 或模型规模；进入规模课程后才切换到真实数量级。

## 唯一学习顺序

不要按侧边栏随意跳读。具备数学与线性代数基础、首次学习模型的读者按下表顺序完成，每页末尾的“下一步”也与此一致。

### 第一轮：组装并运行语言模型

| 顺序 | 页面 | 本页只解决 | 完成证据 |
| ---: | --- | --- | --- |
| 1 | [文本怎样变成 next-token 训练样本](/ai/foundation-models/tokenization-and-samples) | token、ID、右移标签从哪里来 | 能手写 input 与 label |
| 2 | [训练文本怎样变成批次与因果遮罩](/ai/foundation-models/data-batches-and-causal-mask) | 文本流如何组成 `[B,T]` 且不泄漏未来 | 能画下三角 mask 并区分三类 mask |
| 3 | [完整 Decoder 语言模型怎样组装](/ai/foundation-models/language-model-architecture) | Embedding、Block、Norm、词表头如何连接 | 能追踪 `[B,T] → [B,T,V]` |
| 4 | [Decoder 怎样预测下一个 token](/ai/foundation-models/next-token-prediction) | 单位置 logits、概率和交叉熵 | 能修改 logits 并预测 loss 变化 |
| 5 | [语言模型怎样从一个 batch 学习](/ai/foundation-models/training-loop) | 一次训练 step 如何更新参数 | 能区分 backward、step 和 zero_grad |
| 6 | [参数量、显存与计算量怎样估算](/ai/foundation-models/parameters-memory-compute) | 模型规模如何转成资源数量级 | 能预测 `C/L/T/B` 翻倍的影响 |
| 7 | [训练与生成为什么不同](/ai/foundation-models/training-vs-generation) | 并行训练与逐 token 生成为什么不矛盾 | 能写出两条执行时间线 |
| 8 | [Prefill、Decode 与 KV Cache 怎样工作](/ai/foundation-models/prefill-kv-cache) | 增量推理如何复用历史中间结果 | 能解释缓存内容与时间—显存交换 |
| 9 | [采样参数怎样改变生成结果](/ai/foundation-models/sampling) | 最后位置分布如何选出 token | 能区分 temperature、top-k、top-p |
| 10 | [训练一个最小 next-token 模型](/ai/foundation-models/language-model-lab) | 亲手观察 loss 与生成变化 | 运行基线并完成三组反事实实验 |
| 11 | [CPU 上的 tiny Transformer](/ai/foundation-models/tiny-transformer-lab) | 把完整 Decoder 真正训练、保存与加载 | 通过因果性、更新、重载和继续训练检查 |

完成第 10 页可记录“概率模型实验通过”；完成第 11 页并独立修复故障，才记录“Transformer 实现通过”。本地工具操作见[Python 项目准备](/systems/python-project-workflow)。

### 第二轮：理解基础模型扩展

| 顺序 | 页面 | 本页只解决 | 完成证据 |
| ---: | --- | --- | --- |
| 12 | [BERT、T5 与 GPT 为什么是三种结构](/ai/foundation-models/model-families) | 三类 Transformer 的信息流与目标 | 能为三类任务选择架构并说明理由 |
| 13 | [Scaling 与 MoE 怎样扩展模型容量](/ai/foundation-models/scaling-and-moe) | 参数、数据、计算与稀疏专家的关系 | 能区分 total 与 active parameters |
| 14 | [多模态与扩散模型怎样连接语言模型](/ai/foundation-models/multimodal-and-diffusion) | 视觉如何进入语言模型、扩散如何生成图像 | 能画出两条不同生成闭环 |
| 15 | [模型回答中的能力来自哪里](/ai/foundation-models/capability-boundaries) | 参数、上下文、检索与工具怎样区分 | 能为回答建立信息来源记录 |
| 16 | [基础模型公式与术语速查](/ai/foundation-models/reference) | 统一查询 shape、资源和推理术语 | 能独立定位一个 shape 或资源公式 |
| 17 | [第 4 章复习与验收](/ai/foundation-models/review) | 判断是否真正掌握整章 | 完成客观题、推导、调试和结构说明 |

第二轮不是独立支线，它建立在第一轮的完整语言模型上。扩展模型出现的新结构会明确指出复用了什么、改变了什么。

## 关键交互分别回答什么

| 组件 | 要观察的变化 | 可以直接修改 |
| --- | --- | --- |
| 因果遮罩 | Query 行怎样逐渐获得更多历史列 | 输入 token |
| 模型组装 | `[B,T,C]` 怎样穿过多层并投影到 `V` | Block 层数 |
| next-token | logits 怎样改变概率、预测与 loss | 候选 logits |
| KV Cache | 历史 K/V 怎样保留，新 token 怎样追加 | Prompt token |
| 规模计算器 | 参数、权重、训练状态、KV 和 `T²` 怎样增长 | `V/T/C/L/r/B/dtype` |
| 采样 | 截断和随机位置怎样选中 token | logits、温度、k、p、随机位置 |

动画是观察实验，正文仍保留公式、手算、静态结论和自测。任何组件无法运行时，不影响获得核心知识。

## 本章不展开的内容

为了保持责任边界，以下内容只建立接口，不在本章假装讲完：

- 语料许可、去重、质量配比与数据治理：进入[数据、训练与对齐](/ai/data-training-alignment)；
- 指令微调、偏好优化、安全训练：进入第 5 章；
- 服务端连续批处理、张量并行、分页缓存和量化内核：进入[推理、评测与安全](/ai/inference-evaluation-safety)；
- RAG、工具调用与 Agent 状态机：进入[检索、Agent 与系统](/ai/agents-and-systems)；
- 完整小模型实现先完成 tiny Transformer；真实项目源码再进入[MiniMind 全链路实践](/ai/minimind-practice)。

## 分层过关标准

### 核心闭环合格

不查资料能够：

1. 从文本写出 token、input、label 和 mask；
2. 从 `[B,T]` 追踪到 `[B,T,V]`；
3. 计算一个位置的 Softmax 与交叉熵；
4. 解释一次训练 step 中梯度和参数何时变化；
5. 区分权重、激活和 KV Cache；
6. 解释 Prefill、Decode 与采样；
7. 运行最小模型并根据证据判断是否学到规律。

### 完整章节合格

在核心闭环上继续做到：

1. 比较 Encoder-only、Encoder–Decoder 与 Decoder-only；
2. 区分参数、训练 token 和计算预算；
3. 区分 MoE 总参数与每 token 激活参数；
4. 画出图片理解与扩散生成的数据流；
5. 区分模型参数知识、当前上下文、检索证据和工具结果；
6. 完成[复习与验收](/ai/foundation-models/review)中的推导与故障诊断。

完成整章后，再进入[数据、训练与对齐](/ai/data-training-alignment)。
