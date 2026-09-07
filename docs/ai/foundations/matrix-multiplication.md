---
title: 矩阵乘法：一行怎样读取一列
date: 2026-09-04
updated: 2026-09-06
type: lesson
status: learnable
track: ai
prerequisites: [基础代数, 向量加权和]
outcomes: [手算矩阵乘法, 解释中间维, 从输出定位输入行列]
estimated: 25 分钟
description: 用一个 2×3 乘 3×2 的例子逐项理解矩阵乘法，而不是只背 shape 规则。
---

# 矩阵乘法：一行怎样读取一列

## 问题与目标

线性层和 attention 都依赖矩阵乘法。真正要理解的不是“前内后外”，而是：**输出中的一个数从哪里来？** 学完后你应能手算结果、说明共享维为何消失，并定位 shape 错误。

## 贯穿例子

$$
A=\begin{bmatrix}1&2&3\\4&5&6\end{bmatrix},\quad
B=\begin{bmatrix}7&8\\9&10\\11&12\end{bmatrix}
$$

`A` 有 2 行 3 列，`B` 有 3 行 2 列。输出 `C` 有 2 行 2 列。

<ClientOnly>
  <MatrixMultiplicationDemo />
</ClientOnly>

动画中的蓝色整行、整列是一个输出的全部输入；深色方格只是当前正在相乘的一对。若关闭动画，按下面的静态式子也能得到同一结论：

$$
C_{0,0}=1\times7+2\times9+3\times11=58
$$

## 心智模型：输出位置先选行列

要计算 $C_{i,j}$：

1. 用 `i` 选择 `A` 的第 `i` 行；
2. 用 `j` 选择 `B` 的第 `j` 列；
3. 沿共享的中间维 `k` 对齐元素；
4. 逐项相乘后求和。

$$
C_{i,j}=\sum_{k=0}^{K-1} A_{i,k}B_{k,j}
$$

所以 `[M,K] @ [K,N] → [M,N]`。`K` 不是凭规则“消失”，而是被求和汇总了；`M,N` 留下来索引输出位置。

## 推广到模型张量

将一句话分成若干文本片段（token），为每个片段安排一个特征向量；多句话组成一批样本。记样本数为 B、每句片段数为 T，特征数为 Cin，线性层对每个位置应用同一组权重：

```text
X [B,T,Cin] @ W [Cin,Cout] → Y [B,T,Cout]
```

库把前面的 `B,T` 当作批次位置。对每个样本、每个 token，都独立执行 `[Cin] @ [Cin,Cout]`。因此 `Cin` 被汇总，`Cout` 成为新特征轴。

## 最小验证

<ClientOnly>
  <PythonPlayground
    title="验证矩阵乘法的行列乘加"
    :code="`A = [[1, 2, 3], [4, 5, 6]]\nB = [[7, 8], [9, 10], [11, 12]]\nC = [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(2)] for i in range(2)]\nassert C == [[58, 64], [139, 154]]\nprint('C =', C)\nprint('断言通过')`"
  />
</ClientOnly>

## 常见误解与边界

- 逐元素乘法 `A * B` 要求位置可对齐；矩阵乘法 `A @ B` 沿共享维做乘加。
- `A @ B` 通常不等于 `B @ A`，甚至后者可能 shape 不合法。
- shape 合法只证明运算能执行，不证明轴语义正确。
- 转置会换轴；矩阵乘法会产生新的加权组合，两者不是一件事。

## 小结与自测

矩阵乘法的原子动作是“选一行、选一列、对应相乘、全部求和”。请不看上文回答：`[5,7] @ [7,3]` 的输出是什么 shape？`C[4,2]` 读取哪一行和哪一列？共享的 7 去了哪里？

下一步：[张量的轴、reshape 与 transpose](/ai/foundations/tensor-shapes)。
