---
title: 一个 Decoder Block 如何更新 token 表示
date: 2026-09-04
updated: 2026-09-06
type: lesson
status: learnable
track: ai
chapter: transformers
prerequisites:
  - /ai/transformers/multi-head-shapes
  - /ai/deep-learning/mlp-representation
outcomes:
  - 能画出 pre-norm Decoder Block 的两条残差路径
  - 能区分 attention 的跨 token 通信与 FFN 的逐 token 变换
  - 能解释位置、归一化和 residual 分别解决什么问题
  - 能从 Block 输入追踪到下一 token logits
estimated: 45 分钟
categories: [智能算法]
tags: [Transformer, Decoder, Residual, FFN]
description: 把因果注意力放回完整 Decoder Block，追踪位置、Norm、两次 residual、FFN 与下一 token 预测。
---

# 一个 Decoder Block 如何更新 token 表示

注意力不是完整 Transformer。一个常见的 Decoder Block 还包含 normalization、两条 residual 和逐 token FFN。它们反复组合两种能力：

- **attention**：让一个 token 读取其他合法位置，完成跨位置通信；
- **FFN**：对每个 token 独立做非线性变换，完成位置内部加工。

本页采用常见的 **pre-norm** 结构。不同模型可能调整 norm 类型、位置、FFN 激活与门控，但先把这条主线看清。

## 两行公式概括一个 Block

输入第 `l` 层表示 `Hˡ`：

$$
U=H^l+Attention(Norm_1(H^l))
$$

$$
H^{l+1}=U+FFN(Norm_2(U))
$$

两次 `+` 都是 residual。每个子层只计算“应该补充什么”，原表示可以沿旁路直接保留。

## 分步动画：三个 token 怎样经过一个 Block

<ClientOnly>
  <TransformerBlockDemo />
</ClientOnly>

观察动画时重点比较：

1. 只有 causal attention 会让不同 token 的信息发生混合；
2. Norm 和 FFN 对各 token 独立应用，但参数在位置之间共享；
3. Block 入口和出口始终保持 `[B,T,C]`，从而可以连续堆叠；
4. residual 的输入绕过子层，与子层输出做逐元素相加。

## 输入：token、embedding 与位置

文本先被 tokenizer 转成 token id，再查 embedding 表：

$$E=Embedding(token\_ids)\in\mathbb{R}^{B\times T\times C}$$

仅有 token embedding 时，attention 的点积本身不知道“谁在前、谁在后”。模型还需要位置信息，例如绝对位置 embedding、RoPE 或其他位置机制。

为建立结构直觉，可先写成：

$$H^0_i=E_i+P_i$$

RoPE 并非简单相加位置向量，但承担的核心任务相同：让顺序或相对位置影响注意力计算。本页不展开具体位置编码推导。

## Norm：控制进入子层的尺度

pre-norm 先归一化，再送入 attention 或 FFN：

```text
H [B,T,C] → Norm → [B,T,C]
```

Norm 通常沿每个 token 的特征维工作，不混合 token 位置，也不改变 shape。它改善数值尺度和深层优化条件，但不能修复错误数据、错误 mask 或错误目标。

`Norm1` 与 `Norm2` 处于不同子层，通常拥有不同可学习缩放参数。不要因为 shape 相同就把它们当成同一个模块。

## Causal Attention：跨 token 通信

对 Norm 后的表示生成 Q/K/V，再执行：

$$A=CausalAttention(Norm_1(H^l))$$

对于三个位置：

| Query 位置 | 可读取 Key/Value 位置 |
| ---: | --- |
| 1 | 1 |
| 2 | 1、2 |
| 3 | 1、2、3 |

因此位置 3 的输出已经包含对前两个位置的加权信息。它仍然对应位置 3，不是把三个 token 合并成一个 token。

attention 子层输入、输出都为 `[B,T,C]`，内部则经历：

```text
[B,T,C]
→ Q/K/V [B,H,T,D]
→ scores [B,H,T,T]
→ heads [B,H,T,D]
→ merge + Wo [B,T,C]
```

## 第一条 Residual：保留旧表示

$$U=H^l+A$$

这要求 `Hˡ` 和 attention 输出 shape 相同。Residual 的作用包括：

- 原表示可以沿恒等路径向深层传递；
- 子层只需学习相对输入的修正；
- 梯度拥有更短路径，有利于深层优化。

Residual 不是无条件保证训练稳定，也不是拼接。若使用 dropout，通常作用于子层分支后再与 residual 相加，具体顺序以模型实现为准。

## FFN：每个 token 使用同一套 MLP

常见两层 FFN：

$$
FFN(x)=\phi(xW_1+b_1)W_2+b_2
$$

假设模型维 `C=8`、FFN 中间维 `Cff=32`：

```text
[B,T,8] @ W1 [8,32]  → [B,T,32]
激活函数               → [B,T,32]
@ W2 [32,8]           → [B,T,8]
```

相同 `W1/W2` 被应用到所有 token，但每个位置独立计算。FFN 不会让位置 1 直接读取位置 2；跨位置信息已经由 attention 写进各自表示。

现代模型常使用 GELU、SiLU 或 gated FFN（如 SwiGLU）。结构细节会变，但“先扩张并做非线性，再投回 C”的基本角色相近。

## 第二条 Residual：得到下一层表示

$$
H^{l+1}=U+FFN(Norm_2(U))
$$

输出恢复 `[B,T,C]`，因此下一层可以重复相同接口。多层堆叠不是把 token 数越变越少，而是持续更新每个位置的 C 维表示。

## Shape 全链路

固定 `B=2,T=4,C=8,H=2,D=4,Cff=32`：

| 阶段 | shape | 是否混合 token |
| --- | --- | --- |
| embedding + position | `[2,4,8]` | 否 |
| Norm1 | `[2,4,8]` | 否 |
| Q/K/V 拆头 | `[2,2,4,4]` | 尚未，只有投影与重组 |
| causal attention scores | `[2,2,4,4]` | 建立位置间权重 |
| attention 输出合并 | `[2,4,8]` | 是 |
| residual 1 | `[2,4,8]` | 合并旧表示和上下文 |
| Norm2 | `[2,4,8]` | 否 |
| FFN 中间层 | `[2,4,32]` | 否 |
| FFN 投回 + residual 2 | `[2,4,8]` | 否 |

“shape 不变”不代表数值或语义不变。一个 Block 的主要接口保持 `[B,T,C]`，内部却已经进行检索、非线性变换和残差合并。

## 多层之后怎样预测下一个 token

经过 `L` 个 Decoder Block 后，通常还有 final norm 与词表输出头：

$$
logits=Norm(H^L)W_{vocab}
$$

shape：

```text
H [B,T,C] @ Wvocab [C,Vocab] → logits [B,T,Vocab]
```

训练时可并行计算每个位置的 next-token loss，但 causal mask 保证位置 `i` 的表示不能读取未来。推理时通常取最后一个位置的 logits，采样或选择下一个 token，再把新 token 接到序列后继续。

KV cache 只缓存历史层的 K/V，避免历史 token 重复投影；新 token 仍要依次经过所有 Block，并与历史 Key 打分。

## Pre-Norm 与 Post-Norm

两种常见排列：

```text
Pre-Norm:  x + Sublayer(Norm(x))
Post-Norm: Norm(x + Sublayer(x))
```

二者不能只看名称混用。它们的前向位置和梯度路径不同，加载已有权重时必须与模型定义一致。本章动画使用 pre-norm，不声称所有 Transformer 都采用相同排列。

## 常见误解与边界

- **attention 就是 Transformer**：错误；Block 还包含 Norm、residual、FFN 和位置机制。
- **FFN 会混合 token**：错误；它对每个位置独立使用共享参数。
- **residual 是拼接**：错误；常见结构是同 shape 逐元素相加。
- **causal mask 使训练不能并行**：错误；整段可并行前向，只是访问矩阵受限。
- **位置编码只需加一次固定序号**：不同架构实现不同，RoPE 等会直接影响 Q/K。
- **Block 输出最后一个位置才有用**：训练时所有位置通常都参与 next-token loss；自回归推理时才重点使用当前最后位置。
- **结构正确就代表模型有效**：仍需检查数据、目标、优化和未知数据表现。

## 本节自测

<ClientOnly>
  <KnowledgeQuiz
    title="Decoder Block 自测"
    storage-key="ai-transformers-decoder-block"
    :questions="[
      {
        id: 'block-ffn-mix',
        type: 'boolean',
        prompt: 'FFN 子层通过同一个矩阵乘法让不同 token 直接交换信息。',
        answer: false,
        explanation: 'FFN 对每个 token 独立应用共享参数；token 间通信发生在 attention。',
        remediation: '/ai/transformers/decoder-block#ffn每个-token-使用同一套-mlp'
      },
      {
        id: 'block-ffn-shape',
        type: 'single',
        prompt: '输入 [B,T,C]=[2,4,8]，FFN 中间维为 32，第一层线性变换输出 shape 是什么？',
        options: ['[2,4,32]', '[2,32,8]', '[2,4,8]', '[2,8,32]'],
        answer: '[2,4,32]',
        explanation: '线性层只变换最后的特征维，B 和 T 保留。',
        remediation: '/ai/transformers/decoder-block#ffn每个-token-使用同一套-mlp'
      },
      {
        id: 'block-residual',
        type: 'open',
        prompt: '解释为什么 attention 输出和 FFN 输出都要投回 C，才能进入常见 residual 路径。',
        rubric: [
          '指出 residual 是逐元素相加而非拼接',
          '指出相加两侧 shape 必须兼容',
          '说明 Block 入口和出口保持 [B,T,C] 便于堆叠'
        ],
        reference: '两个子层都将结果投回 C，与各自 residual 输入逐元素相加；输出继续保持 [B,T,C]。'
      }
    ]"
  />
</ClientOnly>

<details>
<summary>静态答案与检查点</summary>

1. 错误；FFN 不直接混合 token。
2. `[2,4,32]`。
3. residual 要求同 shape 相加，投回 C 后 Block 才能保持 `[B,T,C]` 接口。

</details>

## 小结与下一步

一个 pre-norm Decoder Block 执行：

```text
x → Norm → causal attention → +x
  → Norm → per-token FFN → +residual
```

attention 负责跨位置通信，FFN 负责位置内部非线性加工，位置机制提供顺序，Norm 和 residual 改善深层信息与梯度通路。至此主线已经从输入表示、单头计算、多头组织走到完整 Block；下一步使用[章节复习](/ai/transformers/review)串起整条路径。
