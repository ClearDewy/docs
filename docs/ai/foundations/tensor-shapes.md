---
title: 张量的轴、reshape 与 transpose
date: 2026-09-04
updated: 2026-09-06
type: lesson
status: learnable
track: ai
prerequisites: [矩阵乘法, 乘法原理]
outcomes: [标注张量轴语义, 检查 reshape 不变量, 解释 transpose 的计算目的]
estimated: 30 分钟
description: 从一批 token 表示出发，理解 shape 是带语义的类型，而非尺寸数字串。
---

# 张量的轴、reshape 与 transpose

## 问题与目标

同一个 `[2,4,8]` 既可能是两张图片，也可能是两条序列。**shape 只给长度，轴名才给语义。** 本课用 `[B,T,C]=[2,4,8]` 贯穿 reshape、transpose 和 broadcast。

这里暂把一句话拆成若干文本片段，每个片段叫一个 token；为每个 token 放一组数作为特征向量。两句话组成一个 batch。比如每句 4 个 token、每个 token 8 个数，就得到 `[2,4,8]`。本页只研究容器的轴；这些数字怎样由 tokenizer 与可学习 Embedding 得到，在基础模型章展开。

## 心智模型：先写轴，再写数

| 轴 | 本例 | 含义 |
| --- | ---: | --- |
| `B` | 2 | 相互独立的样本 |
| `T` | 4 | 每条序列的 token 位置 |
| `C` | 8 | 每个 token 的隐藏特征 |

一个元素 `X[b,t,c]` 必须能读成一句话：第 `b` 条序列、第 `t` 个 token、第 `c` 个特征。

## reshape：重新分组，不重新计算

若 `C=H×D=2×4`：

```text
[B,T,C] = [2,4,8]
reshape
[B,T,H,D] = [2,4,2,4]
```

前后都是 64 个元素。reshape 的不变量是元素数和线性顺序；改变的是我们把最后 8 个数解释为“2 组，每组 4 个”。它没有学出新的头，也没有完成 attention。

## transpose：交换索引顺序

```text
[B,T,H,D] → [B,H,T,D]
```

一个元素的值不变，但地址从 `x[b,t,h,d]` 对应到 `y[b,h,t,d]`。这样最后两个轴成为 `[T,D]`，便于对每个 `B,H` 独立做 `[T,D] @ [D,T]`。

<ClientOnly>
  <AttentionShapeDemo />
</ClientOnly>

这个演示只回答“轴为什么重排”。完整的数值计算在[注意力流水线](/ai/transformers/attention-pipeline)。

## broadcast：逻辑扩展

给 `X[B,T,C]` 加 `bias[C]` 时，同一 bias 被逻辑应用到每个 `b,t`。广播常不复制存储，但会让一些语义错误仍能运行；因此检查标准不是“没报错”，而是“每个对齐轴表达了预期对象”。

## 最小验证

<ClientOnly>
  <PythonPlayground
    title="验证 reshape 的元素数与索引对应"
    :code="`B, T, C, H = 2, 4, 8, 2\nD = C // H\nassert B * T * C == B * T * H * D\n\n# 索引对应关系，不依赖任何张量库\nflat = list(range(B * T * C))\ndef old_index(b, t, c): return (b * T + t) * C + c\ndef new_index(b, t, h, d): return ((b * T + t) * H + h) * D + d\nassert flat[old_index(1, 2, 5)] == flat[new_index(1, 2, 1, 1)]\nprint('元素数:', B * T * C)\nprint('索引对应检查通过')`"
  />
</ClientOnly>

## 常见误解

- reshape 不会让不同头学到不同关系；投影参数和训练才会。
- transpose 不必然复制数据，但后续某些算子可能要求连续内存。
- 元素数相等是 reshape 的必要条件，不是语义正确的充分条件。
- `[B,T,C]` 的 `T` 与 `[B,H,T,T]` 中两个 `T` 角色不同：后者分别是 query 和 key。

## 小结与自测

shape 是“轴长度 + 轴语义”。请解释 `[3,5,12] → [3,5,3,4] → [3,3,5,4]` 每一步改变了什么、没改变什么，以及为什么第二步有助于矩阵乘法。

下一步：[损失、梯度与最小优化循环](/ai/foundations/optimization-loop)。
