---
title: 第 4 章复习与验收
date: 2026-09-05
updated: 2026-09-06
type: review
status: learnable
track: ai
chapter: foundation-models
prerequisites:
  - /ai/foundation-models/multimodal-and-diffusion
  - /ai/foundation-models/capability-boundaries
outcomes:
  - 能从原始文本独立画出训练样本、模型前向、训练更新与生成推理闭环
  - 能估算参数、权重、KV Cache 和上下文增长的数量级
  - 能比较三类 Transformer、Dense/MoE、自回归/扩散模型
  - 能诊断数据对齐、遮罩、缓存、采样与能力归因错误
estimated: 90min
categories: [智能算法]
tags: [Review, Language Model, Foundation Model, Assessment]
description: 通过问答、shape 推导、资源估算、故障诊断和可运行实验验收基础模型与生成系统知识。
---

# 第 4 章复习与验收

本页不再教授新概念，而是检查你能否离开正文独立完成四件事：画出完整链路、推导关键 shape、估算资源数量级、定位典型错误。

建议先关闭其他课程页面完成第一轮，再根据补学链接修正。开放题先写自己的答案，提交后才查看 rubric。

## 覆盖范围

```text
文本 → token/ID → batch/labels/masks
→ embedding → L × Decoder Block → norm → vocab logits
→ masked next-token loss → backward → optimizer step
→ Prefill → KV Cache → Decode → sampling → stop
→ 模型家族 / Scaling / MoE / 多模态 / 扩散 / 能力来源
```

## 交互自测

<KnowledgeQuiz
  storage-key="foundation-models-review-v2"
  title="第 4 章综合自测"
  :questions="[
    { id:'review-shift', type:'fill', prompt:'tokens=[BOS,我,喜欢,猫,EOS]，input=[BOS,我,喜欢,猫] 时 labels 是什么？', answer:['[我,喜欢,猫,EOS]','我,喜欢,猫,EOS','[我, 喜欢, 猫, EOS]'], explanation:'标签沿原 token 流向右移动一位。', remediation:'/ai/foundation-models/tokenization-and-samples' },
    { id:'review-mask', type:'boolean', prompt:'causal mask 与 loss mask 都只是决定哪些标签参与交叉熵。', answer:false, explanation:'causal mask 控制注意力可见性，loss mask 控制哪些输出位置计分。', remediation:'/ai/foundation-models/data-batches-and-causal-mask' },
    { id:'review-shape', type:'single', prompt:'H=[2,8,512]、W_vocab=[512,32000] 时 logits shape 是什么？', options:['[2,8,32000]','[2,512,32000]','[8,512]','[2,8,512]'], answer:'[2,8,32000]', explanation:'矩阵乘法消去 C=512，保留 B、T 并产生 V。', remediation:'/ai/foundation-models/language-model-architecture' },
    { id:'review-step', type:'single', prompt:'哪个调用真正更新模型参数？', options:['forward','loss.backward()','optimizer.step()','zero_grad()'], answer:'optimizer.step()', explanation:'backward 只产生/累积梯度。', remediation:'/ai/foundation-models/training-loop' },
    { id:'review-memory', type:'boolean', prompt:'上下文 T 翻倍时，模型参数量通常也翻倍。', answer:false, explanation:'权重可以不变；KV Cache 线性增长，标准注意力配对项可能平方增长。', remediation:'/ai/foundation-models/parameters-memory-compute' },
    { id:'review-cache', type:'fill', prompt:'增量 Decode 中长期缓存的是哪两个注意力对象？', answer:['K和V','K、V','K 和 V','KV','key value'], explanation:'未来 Query 仍需匹配历史 K 并读取历史 V。', remediation:'/ai/foundation-models/prefill-kv-cache' },
    { id:'review-family', type:'single', prompt:'来源序列双向编码、目标序列因果生成并读取来源，属于哪类架构？', options:['Encoder-only','Encoder–Decoder','Decoder-only'], answer:'Encoder–Decoder', explanation:'Decoder 通过 cross-attention 读取 Encoder 表示。', remediation:'/ai/foundation-models/model-families' },
    { id:'review-moe', type:'boolean', prompt:'MoE 的 total parameters 可以直接当作每个 token 的 active parameters。', answer:false, explanation:'每个 token 通常只路由到少数专家。', remediation:'/ai/foundation-models/scaling-and-moe' },
    { id:'review-diffusion', type:'single', prompt:'典型扩散生成的一步更接近哪种变化？', options:['追加一个词表 token','更新整个带噪/潜变量状态','执行 optimizer.step()'], answer:'更新整个带噪/潜变量状态', explanation:'扩散的时间步不是语言 token 位置。', remediation:'/ai/foundation-models/multimodal-and-diffusion' },
    { id:'review-open', type:'open', prompt:'从“我喜欢”开始，完整描述模型怎样生成“猫”并准备下一轮。', rubric:['token ID 经 embedding 和位置机制得到表示','经过所有因果 Decoder Block、final norm 与词表头','最后有效位置 logits 经温度/截断形成采样分布','选择“猫”并检查停止条件','未停止则把“猫”追加到上下文','每层追加“猫”的 K/V，参数通常不更新'], reference:'Prompt 先 Prefill，最后位置 logits 经过采样处理选出“猫”；若未停止，“猫”作为新位置完成 Decode，其 K/V 写入每层缓存，随后得到下一 token logits。', remediation:'/ai/foundation-models/prefill-kv-cache' }
  ]"
/>

## 任务一：从文本画出数据批次

给定：

```text
<BOS> 机器 学习 很 有趣 <EOS>
```

使用上下文长度 `T=4`，完成：

1. 写出第一个窗口的 input 和 labels；
2. 画出 `4×4` causal mask；
3. 说明第 1 行可以读取哪些列；
4. 若最后两个位置是 PAD，分别写出 padding attention mask 和 loss mask；
5. 解释为什么 attention mask 与 loss mask 不能互相替代。

<details><summary>参考答案</summary>

```text
input  = [BOS, 机器, 学习, 很]
labels = [机器, 学习, 很, 有趣]

causal mask（0 表示允许，-∞ 表示禁止）
0  -∞ -∞ -∞
0   0  -∞ -∞
0   0   0  -∞
0   0   0   0
```

第 1 行读取列 0、1。若某样本后两格为 PAD，简化有效位置 mask 可写 `[1,1,0,0]`；attention 侧阻止 PAD 成为 K/V，loss 侧阻止对应标签计分。

</details>

## 任务二：追踪完整模型 shape

设：

```text
B=2, T=8, C=512, L=6, V=32000, H=8, d_h=64
```

写出：

1. `input_ids`；
2. embedding 输出；
3. 拆 head 后的 Q；
4. 每个 head 的注意力分数；
5. 合并 heads 后的 Block 输出；
6. 最终 logits；
7. labels 和 token loss。

<details><summary>参考答案</summary>

| 对象 | shape |
| --- | --- |
| input_ids | `[2,8]` |
| embedding / hidden | `[2,8,512]` |
| Q（拆 head） | `[2,8,8,64]`，若实现转置为 `[B,H,T,d_h]` 则 `[2,8,8,64]` 数字恰巧相同，必须仍标轴 |
| score / head | `[8,8]`；完整为 `[2,8,8,8]` |
| 合并 heads | `[2,8,512]` |
| logits | `[2,8,32000]` |
| labels / token loss | `[2,8]` / `[2,8]` |

注意：数字相同不能省略轴名。本题 `H=T=8`，错误 transpose 可能仅看 shape 无法发现，必须检查轴语义。

</details>

## 任务三：估算参数与显存

设 `V=32000,C=768,L=12,r=4`，使用标准注意力、输入输出 embedding 共享并忽略小项：

1. 估算 embedding 参数；
2. 估算每层 attention 与 MLP 参数；
3. 估算总参数；
4. 估算 BF16 权重显存；
5. 说明为什么该显存不能代表训练总显存；
6. 预测把 `T` 从 2048 增到 4096 时哪些量不变、线性变化、平方变化。

可以在[规模计算器](/ai/foundation-models/parameters-memory-compute)中核对，但先手算。

<details><summary>参考数量级</summary>

```text
embedding = 32000×768 ≈ 24.6M
attention/layer = 4×768² ≈ 2.36M
MLP/layer = 8×768² ≈ 4.72M
blocks = 12×(2.36M+4.72M) ≈ 84.9M
total ≈ 109.5M parameters
BF16 weights ≈ 219MB（十进制）≈ 209MiB
```

训练还需要梯度、优化器状态和激活。`T` 翻倍：参数不变，标准 KV Cache 约翻倍，朴素注意力分数元素约四倍。

</details>

## 任务四：写出两阶段生成时间线

Prompt 是 `<BOS> 我 喜欢`，模型依次生成 `猫`、`<EOS>`。必须写出：

- Prefill 输入与输出；
- 每层缓存初始包含哪些位置；
- Decode “猫”时新计算什么、复用什么；
- “猫”的 position id；
- `<EOS>` 在哪里触发停止；
- 训练参数是否变化。

<details><summary>评分要点</summary>

合格答案应说明：Prefill 并行计算三个 Prompt token并缓存每层 K/V；首轮 logits 选择“猫”；“猫”的 position id 为 3，只计算它的新 Q/K/V并读取历史 K/V，然后追加缓存；下一轮选择 `<EOS>` 并停止；常规推理没有 backward 和 optimizer step，参数不变。

</details>

## 任务五：四类故障诊断

### A. 训练 loss 很低，自由生成完全失败

至少列出四个检查：label shift、causal mask 方向、训练/验证泄漏、生成时是否接回自己的输出、停止条件。

### B. 开启 KV Cache 后结果明显变化

至少列出：position id、缓存拼接轴、不同 batch 有效长度、mask 长度、dropout/eval 模式。

### C. 8K 上下文可以运行，32K 突然 OOM

不能只回答“参数太大”。应检查 KV Cache、batch/并发、dtype、激活、注意力内核是否物化 `T²` 分数。

### D. MoE 总参数很大，但吞吐没有预期高

检查 active experts、路由负载、专家容量、all-to-all 通信、batch 是否足够以及权重布局。

## 任务六：比较四种模型闭环

不用背模型名，完成下表：

| 闭环 | 输入可见性 | 训练目标 | 生成/输出状态 |
| --- | --- | --- | --- |
| Encoder-only | ？ | ？ | ？ |
| Encoder–Decoder | ？ | ？ | ？ |
| Decoder-only | ？ | ？ | ？ |
| 文本条件扩散 | ？ | ？ | ？ |

<details><summary>参考答案</summary>

| 闭环 | 输入可见性 | 训练目标 | 生成/输出状态 |
| --- | --- | --- | --- |
| Encoder-only | 输入 token 通常双向 | masked token 等 | 上下文表示或任务头输出 |
| Encoder–Decoder | 来源双向；目标因果并 cross-attend 来源 | 条件序列/去噪文本目标 | 逐 token 目标序列 |
| Decoder-only | 全序列因果 | next-token | 逐 token 追加前缀 |
| 文本条件扩散 | 去噪状态读取文本条件 | 预测噪声/速度等 | 整个噪声/潜变量状态逐步更新 |

</details>

## 任务七：运行并扩展最小实验

进入[最小 next-token 实验](/ai/foundation-models/language-model-lab)，提交一份记录：

- 初始与最终 loss；
- 每行概率和为 1 的断言；
- 固定 seed 的生成结果；
- 修改训练分布后的转移概率变化；
- 只改 temperature 时参数未变、样本分布变化的证据；
- 说明 bigram 模型与 Transformer 的共同接口及关键差异。

## 任务七：独立实现与故障验收

完成 [tiny Transformer 实验](/ai/foundation-models/tiny-transformer-lab)，提供一次 CPU 训练日志、一个重新加载生成结果、一个继续训练等价检查。然后不看正文，选择“取消 causal mask”或“标签不右移”注入故障，保存触发断言、定位与修复后的结果。

评分要点：不是凭 loss 判断因果性；正确指出首个坏对象；恢复正确实现后再运行。只运行基线记“运行通过”，能独立修复故障才记“实现通过”。这项状态与下方概念分数分别记录。

## 评分标准

| 部分 | 分值 | 合格证据 |
| --- | ---: | --- |
| 交互自测 | 2 | 客观题至少 8/9，开放题覆盖 5 个要点 |
| 数据与 mask | 2 | 右移、三类 mask 与轴方向正确 |
| 模型与 shape | 2 | 能标清 `[B,T,C]`、heads 和 `[B,T,V]` |
| 参数与资源 | 2 | 数量级正确，区分权重/训练状态/KV/`T²` |
| 推理与诊断 | 2 | Prefill/Decode 完整，至少三类故障可定位 |
| 架构扩展 | 2 | 三类 Transformer、MoE、扩散边界清楚 |
| 实验 | 2 | 基线、反事实、断言和解释完整 |

总分 14 分：

- `0–7`：回到对应课程补学；
- `8–10`：核心闭环基本建立，但资源或扩展部分仍薄弱；
- `11–12`：章节合格；
- `13–14`：概念与模拟部分充分；任务七另记实现状态后进入下一章。

## 补学索引

| 薄弱点 | 返回 |
| --- | --- |
| token 与 labels | [文本怎样变成训练样本](/ai/foundation-models/tokenization-and-samples) |
| batch、PAD 与 mask | [批次与因果遮罩](/ai/foundation-models/data-batches-and-causal-mask) |
| 完整网络结构 | [Decoder 语言模型组装](/ai/foundation-models/language-model-architecture) |
| logits 与 loss | [next-token 前向](/ai/foundation-models/next-token-prediction) |
| 梯度与 step | [训练循环](/ai/foundation-models/training-loop) |
| 参数和显存 | [资源估算](/ai/foundation-models/parameters-memory-compute) |
| KV Cache | [Prefill 与 Decode](/ai/foundation-models/prefill-kv-cache) |
| 采样 | [采样策略](/ai/foundation-models/sampling) |
| 模型家族 | [BERT、T5 与 GPT](/ai/foundation-models/model-families) |
| Scaling 与 MoE | [容量扩展](/ai/foundation-models/scaling-and-moe) |
| 多模态与扩散 | [跨模态生成](/ai/foundation-models/multimodal-and-diffusion) |
| 能力归因 | [参数、上下文、检索与工具](/ai/foundation-models/capability-boundaries) |

## 完成后的下一步

记录完成日期、得分和仍不确定的三点。然后进入[数据、训练与对齐](/ai/data-training-alignment)，学习语料治理、预训练、监督微调和偏好目标怎样塑造模型行为；若更想先落地代码，则进入[MiniMind 全链路实践](/ai/minimind-practice)。
