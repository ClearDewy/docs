---
title: LoRA 怎样进行参数高效适配
date: 2026-09-05
updated: 2026-09-06
type: lesson
status: learnable
track: ai
chapter: data-training-alignment
prerequisites: [/ai/data-training-alignment/sft-and-chat-template]
outcomes:
  - 能从矩阵 shape 推导 LoRA 的低秩增量
  - 能区分冻结参数、可训练参数、优化器状态和合并权重
  - 能判断 LoRA 降低了哪些成本而没有降低哪些风险
estimated: 40min
categories: [智能算法]
tags: [LoRA, PEFT, Fine-tuning]
description: 通过 W 加低秩增量 BA 理解 LoRA 的参数量、训练状态、合并与能力边界。
---

# LoRA 怎样进行参数高效适配

全参数微调会为每个目标任务更新整个模型。LoRA 冻结原权重，只学习低秩增量，让同一个基础模型可以挂接较小的适配权重。

## 从一个线性层开始

原层：

$$y=xW,\quad W\in\mathbb{R}^{d_{in}\times d_{out}}$$

LoRA 增加：

$$y=x(W+\Delta W),\quad \Delta W=AB$$

$$A\in\mathbb{R}^{d_{in}\times r},\quad B\in\mathbb{R}^{r\times d_{out}},\quad r\ll d$$

原参数量 `d_in×d_out`，LoRA 可训练参数量 `r(d_in+d_out)`。例如 1024×1024 层、`r=8`：原层约 1.05M 参数，增量约 16K。

实现中常见缩放 `α/r`，初始化一侧为零以让初始增量为零；具体 A/B 方向和记号可能因库而异，应以实际权重 shape 为准。

## 用一个输入看见低秩分支的输出

先不处理 1024 维，取行向量 `x=[2,1]`、`W` 为二阶单位阵、rank=1：

$$A=\begin{bmatrix}1\\2\end{bmatrix},\quad B=\begin{bmatrix}0.1&-0.2\end{bmatrix}$$

按前向顺序算：`xW=[2,1]`；`xA=2×1+1×2=4`；`(xA)B=[0.4,-0.8]`；所以在缩放 `α/r=1` 时，最终输出为 `[2.4,0.2]`。

也可以先算 `ΔW=AB=[[0.1,-0.2],[0.2,-0.4]]`，再算 `x(W+ΔW)`，应得到相同结果。这就是合并前后的前向等价关系；量化和浮点舍入下应使用误差容限比较。

<ClientOnly><PythonPlayground title="验证 LoRA 分支与合并权重" :code="`x = [2, 1]
W = [[1, 0], [0, 1]]
A = [1, 2]
B = [0.1, -0.2]
low = sum(x[i]*A[i] for i in range(2))
separate = [sum(x[i]*W[i][j] for i in range(2))+low*B[j] for j in range(2)]
merged = [[W[i][j]+A[i]*B[j] for j in range(2)] for i in range(2)]
together = [sum(x[i]*merged[i][j] for i in range(2)) for j in range(2)]
assert all(abs(a-b)<1e-12 for a,b in zip(separate,together))
print([round(v, 4) for v in separate])`" /></ClientOnly>

自测：将 B 改成全零，初始输出是否等于基座？答案是等于；但“当前增量为零”并不等于 B 的梯度也为零。训练时冻结的是 W，梯度仍能经过基座路径到达可训练分支。本例只验证一次前向，没有执行 adapter 微调。

## 四类状态

| 状态 | 是否更新 | 是否保存到 adapter |
| --- | --- | --- |
| 基础模型 W | 通常冻结 | 通常只记录基座身份 |
| LoRA A/B | 更新 | 是 |
| A/B 的梯度与优化器状态 | 训练期间更新 | checkpoint 需要，推理不需要 |
| 激活 | 每步产生 | 不作为 adapter 权重保存 |

冻结参数仍要参与前向和反向到 LoRA 分支，因此 LoRA 大幅减少可训练参数和优化器状态，却不会让基础模型计算消失。

## 注入哪里

常见目标包括注意力 Q/K/V/O 投影与 MLP 投影。选择更多模块增加容量和状态，也改变适配行为。必须保存 target modules、rank、alpha、dropout 和基座精确版本。

## 合并与不合并

推理前可以计算 `W_merged=W+ΔW`，避免独立 LoRA 分支；也可以运行时挂载 adapter 便于切换。合并后要记录不可逆操作和数值 dtype，不能把 adapter 错配到另一基座。

## LoRA 没有解决什么

- 错误、污染或许可不清的数据；
- 模板和 loss mask 错误；
- 领域提升伴随的通用回归；
- 基础模型缺失的上下文窗口和架构能力；
- 可靠评测、隐私和安全责任。

## 自测

<KnowledgeQuiz storage-key="lora-v1" :questions="[
 {id:'lora-1',type:'fill',prompt:'1024×1024 线性层使用 rank=8 的 LoRA，A/B 合计约多少参数？',answer:['16384','16,384'],explanation:'1024×8+8×1024=16384。'},
 {id:'lora-2',type:'boolean',prompt:'冻结基础权重意味着基础模型不参与前向计算。',answer:false,explanation:'W 仍参与计算，只是不由优化器更新。'},
 {id:'lora-3',type:'open',prompt:'部署一个 adapter 至少要记录哪些身份？',rubric:['精确基座模型/提交','target modules','rank/alpha','tokenizer/template','训练数据和评测版本','是否合并及 dtype'],reference:'adapter 不能脱离精确基座与配置独立解释。'}
]" />

打印版答案：1. 16384；2. 错；3. 基座、LoRA 配置、数据模板、评测和合并状态。

来源：[LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)。

## 下一步

LoRA 只是参数更新方式，下一课[偏好数据与 DPO](/ai/data-training-alignment/preference-alignment)研究不同训练目标。
