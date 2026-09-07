---
title: LightGBM 如何计算叶子值与分裂增益
date: 2026-09-07
updated: 2026-09-07
type: lesson
status: learnable
track: ai
chapter: machine-learning
prerequisites: [/ai/machine-learning/gbdt-lab]
outcomes: [从二阶展开推导叶子输出, 用梯度和 Hessian 计算增益, 区分理论目标下降与源码分数]
estimated: 50 分钟
categories: [智能算法]
tags: [LightGBM, Gradient, Hessian]
description: 从四个样本推导二阶目标、叶子输出和正则化增益，解释它们与残差均值及 LightGBM 源码的对应。
---

# LightGBM 如何计算叶子值与分裂增益

手写 GBDT 用残差均值作为叶子值。现在把问题推广为：损失不一定是平方误差时，一片叶子应该修正多少？

本页固定 LightGBM 4.6.0 的普通常数叶、平滑目标语境。先推导无权重、仅 L2 正则的情形，再补 L1；不把这个公式强行套到所有非光滑目标、线性叶或约束变体。

## 1. 梯度和 Hessian 属于谁

第 $m$ 轮开始时，当前模型已经为每个样本生成原始分数 $F_i$。目标函数根据 $y_i,F_i$ 生成两个数：

$$
g_i=\frac{\partial\ell(y_i,F_i)}{\partial F_i},\qquad
h_i=\frac{\partial^2\ell(y_i,F_i)}{\partial F_i^2}.
$$

它们描述“这个样本的预测值再移动一点，损失怎样变”。这里的 Hessian 是每个标量预测的二阶导数；不是对离散阈值求导，也不是一个神经网络参数矩阵。

延续本章四个样本和 $F_0=2$，采用 $\ell=\frac12(y-F)^2$：

| 样本 | y | F₀ | g=F₀−y | h |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1 | 2 | 1 | 1 |
| 2 | 1 | 2 | 1 | 1 |
| 3 | 3 | 2 | -1 | 1 |
| 4 | 3 | 2 | -1 | 1 |

这是本版 [RegressionL2loss 的无权重梯度规则](https://github.com/microsoft/LightGBM/blob/v4.6.0/src/objective/regression_objective.hpp#L127)。有样本权重时，梯度与 Hessian 都乘相应权重。

## 2. 用局部二阶式描述一片叶子

一片叶子 $S$ 给自己的样本统一增加 $w$。在当前预测附近展开：

$$
\ell(y_i,F_i+w)\approx\ell(y_i,F_i)+g_iw+\frac12h_iw^2.
$$

舍去不随 $w$ 改变的原损失，并加上 $\frac12\lambda w^2$ 正则项。定义 $G=\sum_{i\in S}g_i$、$H=\sum_{i\in S}h_i$，就得到：

$$
Q_S(w)=Gw+\frac12(H+\lambda)w^2.
$$

当 $H+\lambda>0$ 时，令导数为零：

$$
w^*=-\frac{G}{H+\lambda},\qquad
Q_S(w^*)=-\frac12\frac{G^2}{H+\lambda}.
$$

这两式分别回答“叶子输出什么”和“这片叶子能让局部目标下降多少”。平方损失的二阶展开是精确的；一般损失这里只是局部近似。

## 3. 回到数值，连接之前的残差树

在阈值 2.5 处，左边 $G_L=2,H_L=2$，右边 $G_R=-2,H_R=2$。

若 $\lambda=0$，左右输出为 -1 和 1，正好等于残差均值。原因是：

$$
-\frac{\sum(F_i-y_i)}{|S|}=\operatorname{mean}_{i\in S}(y_i-F_i).
$$

若 $\lambda=1$，输出变为 $-2/3$ 与 $2/3$。分母增大使修正幅度缩小；这与学习率是两个不同位置的控制：L2 进入叶子优化，学习率在树学好后缩放贡献。

本例再取 $\eta=0.5$，第一轮预测是 $[5/3,5/3,7/3,7/3]$。其未经正则化的训练 MSE 为 $4/9$。不要把这个预测误差与带正则的近似目标混作同一个指标。

## 4. 一刀值不值得切

父叶变为两个子叶，局部正则化目标的下降量为：

$$
\Delta Q=\frac12\left[
\frac{G_L^2}{H_L+\lambda}+
\frac{G_R^2}{H_R+\lambda}-
\frac{(G_L+G_R)^2}{H_L+H_R+\lambda}
\right].
$$

这里没有另外加入每片叶子的固定复杂度罚项。父叶 $G=0$，所以本例 $\lambda=1$ 时 $\Delta Q=\frac12(4/3+4/3)=4/3$。

**源码的 gain 尺度需要单独核对。** LightGBM 4.6.0 常规未约束分支用 $G^2/(H+\lambda)$ 作为叶子分数，省略公共的 $1/2$，再计算左右减父的差。于是上述切分的库内增益是 $8/3$，不是 $4/3$。其最小增益参数也按库内尺度比较。见 [GetLeafGain](https://github.com/microsoft/LightGBM/blob/v4.6.0/src/treelearner/feature_histogram.hpp#L800)。

当 $\lambda=0$ 时，本章例子的理论半平方损失下降是 2，库的 `split_gain` 是 4，而最初 CART 的 SSE 下降也是 4。它们在这个特例中有明确的换算关系，不能推广为所有目标都等于 SSE 下降。

## 5. L1 和二分类怎样连接

加入 $\alpha|w|$ 后，最优输出变为：

$$
w^*=-\frac{\operatorname{sign}(G)\max(|G|-\alpha,0)}{H+\lambda}.
$$

它会让一部分小梯度和对应的输出直接归零。带输出限制、路径平滑、单调约束时，还需要相应分支的计算，不能只背这一式。

二分类交叉熵中，$g=p-y$，$h=p(1-p)$。如果一个正类样本当前 $p=0.5$，则 $g=-0.5,h=0.25$；无正则的单叶 Newton 修正是 +2，增加的是原始分数，不是概率。过于自信时 $h$ 可能很小，叶子支持量、正则与其他约束就更值得检查。

## 6. 自己验证一次

核心脚本已有 $\lambda=1$ 的理论增益断言。用纸笔或 Python 依次计算四行 `g,h`，再分别求左右 `G,H`；如果左右 $G$ 相加不等于父 $G$，优先检查分组或符号。

第三方实验打印 `dump_model()` 的第一棵树，并检查 $\lambda=0$ 时 `split_gain=4`。还单独验证 $\lambda=1$ 的一轮预测及增益约 $8/3$；模型增益元数据的输出精度低于预测值，因此增益比较采用 $10^{-5}$ 容差。这把数值推导和真实模型产物连接起来。

## 小结、自测与下一步

1. 为什么本例的 h 都是 1？
2. λ 从 0 增到 1，左叶输出如何改变？
3. 为什么公式算 2、模型打印 4，可以同时正确？

::: details 参考答案
1. 对半平方误差关于 F 求二阶导数为 1；它不是所有目标的固定值。
2. 从 -1 缩小为 -2/3；乘学习率是后续步骤。
3. 在本例无正则情形，公式使用半平方损失下降；源码增益省略公共 1/2。应先统一目标和尺度再比较。
:::

下一步：[LightGBM 如何用直方图生长一棵树](/ai/machine-learning/lightgbm-tree-learning)。
