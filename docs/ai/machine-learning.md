---
title: 1. 机器学习、树模型与泛化评估
date: 2026-09-04
updated: 2026-09-07
type: overview
status: learnable
track: ai
categories: [智能算法]
tags: [Machine Learning, CART, GBDT, LightGBM, Evaluation]
description: 从可信评估和简单基线出发，手算并实现 CART 与 GBDT，再完成 LightGBM 训练和源码对照。
---

# 1. 机器学习、树模型与泛化评估

本章连接两个问题：模型怎样从数据中学到规则，又凭什么认为这些规则对未见数据有效？先理解数据与考试方式，再从一棵树走到梯度提升和 LightGBM。

适合具备基本数学、刚开始学习模型实现的读者。已知道 LightGBM 概念但无法解释一次分裂时，可以从“决策树如何学出规则”进入，并确认自己已掌握训练、验证、测试职责。

## 前置与范围

- 数学：平均数、平方误差、一阶和二阶导数；优化可回看[最小训练循环](/ai/foundations/optimization-loop)。
- 编程：Python 列表、函数、循环和类；运行环境见 [Python 项目工作流](/systems/python-project-workflow)。
- 不要求先学神经网络或 Transformer。量化等具体应用在应用专栏单独展开，本章使用确定的教学数据和合成回归任务。

## 唯一推荐学习顺序

| 类型 | 学习单元 | 预计 | 完成后能做什么 |
| --- | --- | ---: | --- |
| lesson | [模型是真的学会，还是偷看了答案？](/ai/machine-learning/problem-and-evaluation) | 35 分钟 | 识别泄漏并安排训练、验证、测试 |
| lab | [从常数基线到线性模型](/ai/machine-learning/baseline-lab) | 40 分钟 | 比较简单候选和常数基线 |
| lesson | [决策树如何从数据中学出规则](/ai/machine-learning/decision-tree) | 45 分钟 | 手算阈值、叶子值和误差下降 |
| lab | [从零实现 CART 回归树](/ai/machine-learning/cart-lab) | 60 分钟 | 实现数值切分、递归建树与预测 |
| lesson | [梯度提升为什么逐轮拟合修正量](/ai/machine-learning/gradient-boosting) | 45 分钟 | 手算两轮修正与累计预测 |
| lab | [从零实现平方损失 GBDT](/ai/machine-learning/gbdt-lab) | 45 分钟 | 复用 CART 实现最小提升循环 |
| lesson | [LightGBM 如何计算叶子值与分裂增益](/ai/machine-learning/lightgbm-objective) | 50 分钟 | 推导梯度、Hessian、正则与增益 |
| lesson | [LightGBM 如何用直方图生长一棵树](/ai/machine-learning/lightgbm-tree-learning) | 45 分钟 | 解释分箱、叶子选择、缺失与类别路由 |
| lab | [训练、早停与重载一个 LightGBM 模型](/ai/machine-learning/lightgbm-lab) | 60 分钟 | 运行固定环境并验证重载一致 |
| lesson | [从 Python 调用追踪到一次分裂](/ai/machine-learning/lightgbm-source) | 60 分钟 | 在固定版本源码中定位各步职责 |
| review | [第 1 章复习与验收](/ai/machine-learning/review) | 45 分钟 | 综合完成手算、实现和实验审查 |

查询入口：[树模型与 LightGBM 速查](/ai/machine-learning/tree-reference)。GOSS、EFB、分类与约束变体作为进阶理解，不要求先实现才能完成主线。

## 贯穿全章的计算例子

```text
X = [[1], [2], [3], [4]]
y = [1, 1, 3, 3]

一棵树：在 2.5 切分，左右预测 1、3
两轮提升：初始值 2，学习率 0.5，最终预测 1.25、2.75
LightGBM：在匹配的算例配置下对照预测和分裂产物
```

所有阶段共享这一组输入；较大合成数据只在成熟库实验中引入。源码和页面引用同一份可运行文件，避免数学、网页和测试各维护一套答案。

## 过关标准与建设状态

新增单元为 `learnable`：具备教学、代码或数值验证、自测与边界。标准库变式、成熟库对照和存盘恢复可通过本地检查按需验证。运行作者示例、能独立实现、能迁移到实际任务，是不同层次的证据。

完成本章应能：独立实现数值 CART 和平方损失 GBDT；手算一刀和两轮提升；解释 LightGBM 的分箱、叶子输出和增益尺度；在源码中找到计算位置；最后说明测试分数证明了什么、还没有证明什么。

下一步：[模型是真的学会，还是偷看了答案？](/ai/machine-learning/problem-and-evaluation)。
