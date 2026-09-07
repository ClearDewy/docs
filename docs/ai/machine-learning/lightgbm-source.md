---
title: 从 Python 调用追踪到 LightGBM 的一次分裂
date: 2026-09-07
updated: 2026-09-07
type: lesson
status: learnable
track: ai
chapter: machine-learning
prerequisites: [/ai/machine-learning/lightgbm-lab]
outcomes: [追踪一轮原生训练的调用路径, 在源码定位梯度与叶子选择, 解释模型文件中的叶子值]
estimated: 60 分钟
categories: [智能算法]
tags: [LightGBM, Source Code, C++]
description: 固定 v4.6.0 源码，将 Python 训练循环、C API、GBDT、目标函数和树学习器对应到前面的四行实验。
---

# 从 Python 调用追踪到 LightGBM 的一次分裂

完成训练实验后，再读源码就有了可验证的问题：梯度在哪里生成，阈值由谁选择，学习率在哪里应用，为什么导出的第一棵树叶子不是残差？

本页只跟踪 v4.6.0、CPU、单机、内置平方损失、普通 GBDT 的路径。你需要能阅读函数调用、循环和数组；不要求先理解所有 C++ 模板，也不要求本地编译。

## 1. 先画出职责，而不是打开整个仓库

```text
Python engine.train：管理轮次和回调
  → Python Booster.update：请求训练一轮
  → C API LGBM_BoosterUpdateOneIter：跨语言入口
  → GBDT::TrainOneIter：计算梯度、训练新树、更新总分数
       → 目标函数 GetGradients：每行的 g、h
       → SerialTreeLearner::Train：一棵树内部的叶子生长
            → 直方图候选搜索：统计、叶子输出、增益
       → Shrinkage、UpdateScore、AddBias
  → Python 验证指标与早停回调
```

这里两个循环不能混淆：外层每次增加一轮模型，内层不断增加当前树的叶子。在本页回归设置下一轮对应一棵树；多分类等设置不能机械沿用“一轮就是一棵”的说法。

## 2. Python 控制一轮何时开始和结束

打开 [engine.py 的训练循环](https://github.com/microsoft/LightGBM/blob/v4.6.0/python-package/lightgbm/engine.py#L309)，定位 `booster.update`。它的前后分别是迭代前回调、验证计算和迭代后回调。

因此，早停不是“树长到某个叶子就触发验证”。在本实验的 Python 训练接口中，它在轮次边界检查验证结果。`record_evaluation` 记录的也是逐轮指标。

再读 [basic.py 的 Booster.update](https://github.com/microsoft/LightGBM/blob/v4.6.0/python-package/lightgbm/basic.py#L4092)。内置目标使用 `LGBM_BoosterUpdateOneIter`；自定义目标有另外的梯度入口。先只跟踪本实验选中的分支。

## 3. C API 把请求交给提升模型

在 [c_api.cpp](https://github.com/microsoft/LightGBM/blob/v4.6.0/src/c_api.cpp#L2062) 找到同名入口，沿内部对象调用到 `TrainOneIter`。这一层处理跨语言接口，最优阈值不在这里计算。

进入 [GBDT::TrainOneIter](https://github.com/microsoft/LightGBM/blob/v4.6.0/src/boosting/gbdt.cpp#L344)，依次识别：初始分数、梯度生成、采样分支、树学习器、新树输出调整、学习率与累计分数更新。

把前面的手写实现放在旁边，做如下对应：

| 手写对象或动作 | 成熟实现中的职责 |
| --- | --- |
| `base=mean(y)` | 初始化分数，内置回归目标给出初始值 |
| `residual=y-prediction` | 目标函数按当前 score 产生梯度与 Hessian |
| `CARTRegressor.fit` | 树学习器根据梯度统计训练结构 |
| `learning_rate * correction` | 新树输出 shrinkage |
| `prediction += ...` | 累计训练及验证分数更新 |

表中是语义对应，不代表代码行数、数据布局或全部目标行为相同。

## 4. 在目标函数里找回四个数

打开 [RegressionL2loss::GetGradients](https://github.com/microsoft/LightGBM/blob/v4.6.0/src/objective/regression_objective.hpp#L127)。在无权重分支，score 减 label 生成梯度，Hessian 为 1。

对本例初始 score=2，必须得到 `g=[1,1,-1,-1]`、`h=[1,1,1,1]`。如果你把梯度解释为 `y-score`，这里就会与源码相反；负号在叶子输出公式里出现，不能在两个位置重复反转。

## 5. 找到“选哪个叶子”的确切位置

在 [SerialTreeLearner::Train](https://github.com/microsoft/LightGBM/blob/v4.6.0/src/treelearner/serial_tree_learner.cpp#L216)，循环次数受叶子预算控制。`FindBestSplits` 更新候选，然后 `ArgMax(best_split_per_leaf_)` 挑出最佳叶子；没有正增益时停止，否则调用 `Split`。

这是“leaf-wise”的可核查证据。只看类名，或者看到 `max_depth` 参数，都不足以推断它是逐层生长。

继续到 [feature_histogram.hpp 的叶子输出](https://github.com/microsoft/LightGBM/blob/v4.6.0/src/treelearner/feature_histogram.hpp#L717) 和 [GetLeafGain](https://github.com/microsoft/LightGBM/blob/v4.6.0/src/treelearner/feature_histogram.hpp#L800)，对应 $-G/(H+\lambda)$ 和 $G^2/(H+\lambda)$。候选还要满足最小支持量等约束，最大原始分数未必就是最大合法分数。

## 6. 为什么 dump 的第一棵树已经是 1.5 和 2.5

回到 [新树更新段](https://github.com/microsoft/LightGBM/blob/v4.6.0/src/boosting/gbdt.cpp#L406)，观察顺序：输出更新、`Shrinkage`、`UpdateScore`，随后必要时 `AddBias`。

本例的第一棵修正树是 -1、1。乘学习率 0.5 后为 -0.5、0.5，再吸收初始常数 2，保存为 1.5、2.5。第二棵树保存的贡献是 -0.25、0.25；两树相加得到 1.25、2.75。

所以解释模型文件时，不能再次给每片已缩放的叶子乘学习率，也不能再额外加一遍初始常数。这是本实验路径的存储行为，不应脱离初始化配置推广到所有模型。

## 7. 源码阅读实验

重新运行上一页脚本，保存打印的第一棵树。只回答五个问题，并在上述固定 tag 链接中圈出依据：

1. 一轮训练在哪个 Python 循环开始？
2. 无权重平方损失的 h 在哪里设为 1？
3. 哪一步选择所有叶子中的最佳候选？
4. 学习率和初始常数分别在哪一步进入树值？
5. `split_gain=4` 为什么不等于半平方损失下降 2？

::: details 评分与参考答案
每题 2 分：必须同时说清职责和找到函数，只有函数名给 1 分。

1. `engine.train` 的轮次循环调用 `booster.update`。
2. `RegressionL2loss::GetGradients` 的无权重分支。
3. `SerialTreeLearner::Train` 对 `best_split_per_leaf_` 求 ArgMax。
4. `GBDT::TrainOneIter` 中 `Shrinkage` 缩放，随后相应初始化分支的 `AddBias` 加常数。
5. 普通叶子增益分数省略公共 1/2；需要统一损失尺度。
:::

以上路径在 2026-09-07 对照 v4.6.0 源码核查，数字由本章脚本验证；本次没有编译或逐指令调试 C++。升级版本后应复核函数和分支，不把行号当永久接口。

下一步：[第 1 章复习与验收](/ai/machine-learning/review)。参数和公式随时查 [树模型与 LightGBM 速查](/ai/machine-learning/tree-reference)。
