---
title: 偏好数据与 DPO 怎样改变相对概率
date: 2026-09-05
updated: 2026-09-06
type: lesson
status: learnable
track: ai
chapter: data-training-alignment
prerequisites: [/ai/data-training-alignment/lora-adaptation]
outcomes:
  - 能构造同 Prompt 下的 chosen/rejected 偏好样本
  - 能解释 DPO 优化相对 log-prob 且受参考策略约束
  - 能识别标签噪声、长度偏好和 reward hacking 风险
estimated: 45min
categories: [智能算法]
tags: [Preference, DPO, RLHF]
description: 从成对偏好样本出发理解 DPO 的相对概率目标、参考模型和对齐评测边界。
---

# 偏好数据与 DPO 怎样改变相对概率

SFT 告诉模型“模仿这份回答”。偏好数据则给同一个 Prompt 的两个回答，告诉模型哪一个相对更好。

```text
prompt: 2+3 等于多少？
chosen: 5
rejected: 6
```

## 数据 schema

chosen/rejected 必须共享完全相同的 Prompt 与模板。标签应依据明确 rubric，例如正确性、相关性、风格或安全；如果把多个标准混成“整体更好”，后续很难解释改善来源。

## DPO 的直觉

策略模型对整段响应的 log-prob 是响应 token log-prob 之和。DPO 希望策略相对参考模型更偏向 chosen，而不是无限提高所有 chosen 概率：

$$
\Delta_\pi=\log\pi(y_w|x)-\log\pi(y_l|x)
$$

再与参考策略的差值比较并进入 logistic loss。`β` 控制偏好强度与偏离参考模型的权衡。初学者要抓住：它优化**相对优势**，参考模型提供锚点。

## 用一组数算完整损失

设同一个问题为 `2+3?`，chosen 为 `5`，rejected 为 `6`。下面的数是教学构造的**整段回答条件 log-prob**，不是把数字 5、6 当成概率：

| 模型状态 | chosen log-prob | rejected log-prob | 两者之差 |
| --- | ---: | ---: | ---: |
| 固定参考模型 | -2 | -3 | 1 |
| 更新前策略 | -2 | -3 | 1 |
| 更偏向 chosen 的策略 | -1.5 | -3.5 | 2 |
| 更偏向 rejected 的策略 | -2.5 | -2.5 | 0 |

完整的单对样本损失为：

$$
z=\beta(\Delta_\pi-\Delta_{ref}),\qquad
L_{DPO}=-\log\sigma(z)=\log(1+e^{-z})
$$

取 `β=0.1`。更新前 `z=0.1×(1−1)=0`，loss 为 `log(2)≈0.6931`。更偏向 chosen 时，`z=0.1×(2−1)=0.1`，loss 降为 `0.6444`。反方向时 `z=-0.1`，loss 升为 `0.7444`。

局部梯度 `∂L/∂Δπ = -βσ(-z)` 为负，所以降低损失会推动策略的相对偏好差值增大。参考模型在本步骤冻结；不是先把它与策略模型的权重相减。

<ClientOnly>
  <PythonPlayground title="手算与代码核对 DPO 损失" :code="`from math import exp, log1p
def dpo_loss(chosen, rejected, ref_chosen=-2, ref_rejected=-3, beta=0.1):
    z = beta * ((chosen-rejected)-(ref_chosen-ref_rejected))
    return max(-z, 0) + log1p(exp(-abs(z)))
base = dpo_loss(-2, -3)
better = dpo_loss(-1.5, -3.5)
worse = dpo_loss(-2.5, -2.5)
assert better < base < worse
print([round(x, 4) for x in [base, better, worse]])`" />
</ClientOnly>

一段多 token 响应时，先取每个**实际目标 token**的 log-prob，再沿有效响应位置求和；Prompt 和 PAD 不计入本例响应分数。策略与参考模型必须使用同一 tokenizer、模板和响应边界，否则相减的不是同一个事件。

自测：若策略 chosen/rejected 同时增加 `0.2`，DPO loss 会变吗？先算再展开答案。

<details><summary>答案与迁移任务</summary>

不会，两者之差不变。把参考模型两列改成 `-2,-4`，而策略保持 `-1.5,-3.5`，此时两个差值都为 2，loss 又回到 `0.6931`。这说明不能只看策略 chosen 的绝对概率。

</details>

这个实验验证目标函数的方向，没有执行模型微调。真正训练还需将这些标量连接到模型 logits 和反向传播；[tiny Transformer](/ai/foundation-models/tiny-transformer-lab)先提供这条可运行计算链。

## 为什么不能只看训练准确率

偏好准确率 100% 可能只是记住模板、长度或标注者习惯。必须在独立 Prompt 上评估正确性、帮助性、安全、长度、格式和通用能力回归。

## 数据风险

- chosen/rejected 写反；
- rejected 明显更短，模型学到长度偏好；
- 两者差异包含格式噪声而非目标属性；
- 同一回答对出现在训练与评测；
- 标注者对 rubric 理解不一致；
- 单一自动评分器被模型利用。

RLHF 的奖励模型 + PPO 路线会显式学习奖励并在线采样优化策略；DPO 直接使用离线偏好对。二者流程不同，但都不能超越偏好数据和评测定义本身。

## 最小对照

保持基座、SFT checkpoint、数据和评测固定，比较无偏好优化与 DPO。报告总体偏好胜率，同时按正确性、长度、安全类别分层，并检查通用任务回归。

## 自测

<KnowledgeQuiz storage-key="dpo-v1" :questions="[
 {id:'dpo-1',type:'boolean',prompt:'偏好样本中的 chosen 与 rejected 可以使用不同 Prompt。',answer:false,explanation:'成对比较必须共享条件，否则差异不可归因。'},
 {id:'dpo-2',type:'single',prompt:'DPO 的参考模型主要提供什么？',options:['随机标签','限制策略偏离的锚点','新的 tokenizer'],answer:'限制策略偏离的锚点',explanation:'目标比较策略与参考策略的相对偏好变化。'},
 {id:'dpo-3',type:'open',prompt:'偏好胜率提高后还要检查哪些回归？',rubric:['正确性/事实性','长度与格式偏置','安全类别','通用任务能力','独立数据与人工一致性'],reference:'分维度评测并检查是否只迎合评分器或长度，而非真实改善。'}
]" />

打印版答案：1. 错；2. 限制策略偏离的锚点；3. 分解质量维度与通用回归。

来源：[Direct Preference Optimization](https://arxiv.org/abs/2305.18290)、[Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)。

## 下一步

进入[训练目标与数据审计实验](/ai/data-training-alignment/training-evidence-lab)，把数据身份、loss mask 和偏好对检查写成断言。
