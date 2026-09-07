---
title: BERT、T5 与 GPT 为什么是三种结构
date: 2026-09-05
updated: 2026-09-06
type: lesson
status: learnable
track: ai
chapter: foundation-models
prerequisites:
  - /ai/foundation-models/tiny-transformer-lab
outcomes:
  - 能从信息可见性和训练目标区分 Encoder-only、Encoder–Decoder 与 Decoder-only
  - 能为表示理解、条件转换和开放式生成选择合适架构家族
  - 能解释模型名称、架构和训练目标为什么不能互相替代
estimated: 40min
categories: [智能算法]
tags: [BERT, T5, GPT, Architecture]
description: 以同一句文本比较三类 Transformer 的可见性、训练目标和典型输出，建立模型架构谱系。
---

# BERT、T5 与 GPT 为什么是三种结构

到目前为止我们一直学习 Decoder-only 自回归语言模型，因为它最直接地支持逐 token 生成。但 Transformer 不只有这一种组装方式。

本页用同一个问题区分三大家族：**模型在每个位置能看到什么，训练时被要求输出什么？**

## 三句话先建立直觉

- **Encoder-only**：整段输入互相可见，重点是得到适合理解任务的上下文表示。
- **Encoder–Decoder**：Encoder 先完整理解来源，Decoder 再因果地生成目标，并通过 cross-attention 读取来源。
- **Decoder-only**：把所有条件和输出放进一条序列，只用因果遮罩继续预测下一个 token。

这不是“旧模型、新模型、最新模型”的时间排名，而是信息流和目标不同的结构选择。

## 固定任务：把“我喜欢猫”翻译成英文

### Encoder-only

输入可能是：

```text
[CLS] 我 喜欢 猫 [SEP]
```

每个 token 可以双向读取整段输入。模型输出每个位置的上下文表示，随后接分类头、序列标注头或其他任务头。

它本身没有一个天然的“逐 token 英文生成循环”。可以额外设计生成系统，但这不是标准 Encoder-only 预训练的直接接口。

典型预训练目标是遮住部分 token 再恢复：

```text
我 [MASK] 猫 → 预测“喜欢”
```

### Encoder–Decoder

Encoder 输入中文：

```text
我 喜欢 猫
```

Decoder 逐步生成：

```text
<BOS> → I → like → cats → <EOS>
```

Decoder 有两类注意力：

1. masked self-attention：只能读取已生成的英文；
2. cross-attention：可以读取 Encoder 的全部中文表示。

输入和输出天然分区，适合翻译、摘要等“给定来源 → 生成目标”的任务。

### Decoder-only

把任务写进同一条上下文：

```text
翻译成英文：我喜欢猫
答案：I like cats
```

模型从左到右预测每个 token。生成答案时，后面的英文可以读取前面的指令与中文，但前面的内容不能读取尚未出现的答案。

这种统一 next-token 接口很容易把问答、翻译、代码和对话都表示成文本序列。

## 对照表

| 维度 | Encoder-only | Encoder–Decoder | Decoder-only |
| --- | --- | --- | --- |
| 代表性模型 | BERT | T5、原始 Transformer | GPT 类 |
| 主体可见性 | 输入内双向 | Encoder 双向；Decoder 因果 | 全序列因果 |
| 输入/输出 | 输入表示 → 任务头 | 来源序列 → 目标序列 | 一个前缀后继续生成 |
| 常见预训练目标 | masked token | 去噪/文本到文本 | next-token |
| 擅长接口 | 分类、抽取、检索表示 | 翻译、摘要、条件生成 | 开放生成、对话、代码 |
| 生成时是否逐 token | 通常不是核心接口 | Decoder 是 | 是 |

“擅长”不等于“只能”。现代系统可以改变目标、增加头或组合模型；选择仍要从信息流和任务接口出发。

## Mask 决定的不是模型名字，而是信息边界

同一个注意力公式，通过不同 mask 可以产生不同信息流：

- 双向：所有有效输入位置互相可见；
- 因果：位置 `t` 只能看 `≤t`；
- Prefix/分块：一部分位置双向，后续位置因果；
- Cross-attention：Query 来自 Decoder，K/V 来自 Encoder。

因此看到模型实现时，不要只找类名 `Transformer`；要检查 Q、K、V 分别来自哪里，以及 mask 允许哪些位置连接。

## 训练目标与架构要一起看

两个模型即使都使用 Decoder Block，只要训练数据和目标不同，最终行为也可能不同。同样，Encoder 与 Decoder 的结构差异不会自动告诉你数据质量、参数规模或是否经过指令对齐。

至少分开记录：

```text
架构：Encoder-only / Encoder–Decoder / Decoder-only
目标：masked token / span corruption / next-token / 其他
数据：哪些语料与任务混合
后训练：是否微调、偏好优化或工具训练
接口：输出表示、类别还是 token 分布
```

## 怎样选择

### 需要固定表示或分类

例如文本检索向量、情感分类、实体标注。Encoder-only 能让每个位置综合左右文，通常是自然起点。

### 输入与输出边界非常明确

例如翻译、摘要、语音转文本中的编码—解码。Encoder–Decoder 让来源表示只算一次，目标 Decoder 通过 cross-attention 读取。

### 希望统一成提示词并开放生成

例如对话、续写、代码生成和 in-context learning。Decoder-only 的单一 next-token 接口更直接。

选择还要考虑可用预训练权重、数据、延迟、部署生态与评测结果，不能只凭架构标签。

## 常见误解

- **BERT 没有 Decoder，所以不是 Transformer**：错误。Transformer 是一组注意力与前馈结构，BERT使用其 Encoder 家族。
- **双向一定比因果更强**：取决于任务。生成时未来 token 不存在，不能依赖双向读取未来答案。
- **T5 的 Decoder 不需要 causal mask**：错误。它对目标序列仍然自回归，只是还能 cross-attend Encoder。
- **GPT 只能续写，不能分类**：可以把分类表示成 next-token 或读取隐藏表示；这是接口设计问题。
- **架构决定全部能力**：数据、规模、目标和后训练同样重要。

## 本节自测

<KnowledgeQuiz
  storage-key="foundation-model-families-v1"
  :questions="[
    { id:'family-1', type:'single', prompt:'哪个家族通常让来源序列双向编码、目标序列因果解码？', options:['Encoder-only','Encoder–Decoder','Decoder-only'], answer:'Encoder–Decoder', explanation:'目标 Decoder 还会通过 cross-attention 读取来源 Encoder。' },
    { id:'family-2', type:'boolean', prompt:'Decoder-only 中，答案 token 可以读取排在它前面的指令 token。', answer:true, explanation:'因果遮罩允许读取当前位置和更早位置。' },
    { id:'family-3', type:'fill', prompt:'BERT 的代表性预训练目标通常叫什么？', answer:['masked language modeling','MLM','遮罩语言模型','掩码语言模型'], explanation:'遮住一部分输入 token，再利用双向上下文恢复。' },
    { id:'family-4', type:'open', prompt:'为“长文档输入，输出一段摘要”比较 Encoder–Decoder 与 Decoder-only 的建模方式。', rubric:['Encoder–Decoder 将来源和目标分开','Decoder-only 将文档、指令、摘要放进同一因果序列','指出两者都可生成但信息流和缓存方式不同','不脱离数据、模型和评测武断宣布绝对赢家'], reference:'Encoder–Decoder 先编码完整文档，再由目标 Decoder cross-attend；Decoder-only 把文档作为前缀并继续生成摘要。最终选择需结合实际模型、上下文和部署评测。' }
  ]"
/>

打印版答案：1. Encoder–Decoder；2. 对；3. masked language modeling；4. 按来源/目标是否分区及注意力来源比较。

## 来源与下一步

- [BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805)
- [Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683)
- [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)

下一课[Scaling 与 MoE 怎样扩展模型容量](/ai/foundation-models/scaling-and-moe)解释“结构确定之后，模型怎样继续扩大”。
