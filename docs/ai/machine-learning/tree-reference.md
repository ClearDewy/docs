---
title: 树模型与 LightGBM 速查
date: 2026-09-07
updated: 2026-09-07
type: reference
status: learnable
track: ai
chapter: machine-learning
categories: [智能算法]
tags: [CART, GBDT, LightGBM, Reference]
description: 集中查询树模型公式、LightGBM 4.6.0 参数约束、接口差异与本章可执行入口。
---

# 树模型与 LightGBM 速查

适用范围：本章标准库 CART、平方损失 GBDT 和 LightGBM 4.6.0 原生 Python API，CPU、常数叶。此页供查找；首次学习从 [决策树](/ai/machine-learning/decision-tree) 开始。

## 符号与公式

| 符号 | 含义 |
| --- | --- |
| X、y | 样本 × 特征矩阵、逐样本标签 |
| Fₘ、fₘ | 第 m 轮后的完整模型、本轮修正树 |
| η、M | 学习率、提升轮数 |
| gᵢ、hᵢ | 损失关于当前原始分数的一阶、二阶导数 |
| G、H | 一片叶子的梯度和、Hessian 和 |
| λ、α | 叶子 L2、L1 正则强度 |

$$
\text{CART leaf}=\bar y_S,\quad
\text{SSE gain}=\operatorname{SSE}(S)-\operatorname{SSE}(L)-\operatorname{SSE}(R)
$$

$$
F_M=F_0+\eta\sum_{m=1}^Mf_m,\quad
r_i=y_i-F_{m-1}(x_i)\quad\text{（平方损失）}
$$

$$
w=-\frac{G}{H+\lambda},\quad
\text{gain}_{\mathrm{LGB}}=
\frac{G_L^2}{H_L+\lambda}+\frac{G_R^2}{H_R+\lambda}-\frac{G^2}{H+\lambda}
$$

最后一式限定本章无 L1、无额外输出约束的通常分支，且未扣最小增益门槛；它是理论二阶目标下降的两倍。不要与 metric 的 MSE 混用。

## 参数按作用位置查找

下表是 4.6.0 原生参数；实验取值不是推荐默认配置。默认值与精确定义以 [官方参数页](https://lightgbm.readthedocs.io/en/v4.6.0/Parameters.html) 为准。

| 参数 | 默认 | 本章较大实验 | 作用与检查 |
| --- | --- | --- | --- |
| `objective` | `regression` | `regression` | 定义训练目标及梯度 |
| `metric` | 随目标选择 | `l2` | 验证及报告指标 |
| `learning_rate` | 0.1 | 0.05 | 每轮贡献缩放，与轮数一起判断 |
| `num_leaves` | 31 | 7 | 每棵树叶子上限 |
| `max_depth` | -1 | 3 | 路径深度限制；非正值表示不限制 |
| `min_data_in_leaf` | 20 | 20 | 叶子支持量限制；库实现存在基于 Hessian 的近似 |
| `min_sum_hessian_in_leaf` | 0.001 | 默认 | 最小 Hessian 和，不等于所有目标下的行数 |
| `lambda_l1`、`lambda_l2` | 0、0 | 0、1 | 进入叶子输出与增益优化 |
| `min_gain_to_split` | 0 | 默认 | 增益门槛，按库内尺度 |
| `max_bin` | 255 | 63 | 分箱数上限，影响表示与候选 |
| `feature_fraction` | 1 | 默认 | 每棵树使用的特征比例 |
| `bagging_fraction`、`bagging_freq` | 1、0 | 默认 | 普通行采样需要比例小于 1 且频率为正 |
| `data_sample_strategy` | `bagging` | 默认 | 选择普通采样或 `goss` |
| `enable_bundle` | true | 默认 | 允许 EFB，不保证任意特征都能有效打包 |

数值特征通常不需要为了树切分单独做尺度标准化；数据语义、异常值和稳定变换仍需按任务判断。对数变换等严格单调变换在精确搜索中保留训练排序，但分箱和有限精度会影响实现结果，不能承诺位级一致。

## API 约定与最小正确入口

| 场景 | 本章用法 | 易混淆项 |
| --- | --- | --- |
| 训练 | `lgb.train(params, train, ...)` | 原生 API 与 sklearn wrapper 参数位置不同 |
| 最大轮数 | `num_boost_round=400` | 不与别名同时传冲突值 |
| 早停 | `callbacks=[lgb.early_stopping(30)]` | 这里使用 4.6.0 回调接口 |
| 预测 | `predict(X, num_iteration=best)` | 输入列的语义与顺序须一致 |
| 保存 | `save_model(path, num_iteration=best)` | 不重复对已缩放叶子乘学习率 |
| 重载 | `lgb.Booster(model_file=path)` | 模型文件不包含完整特征工程流程 |

最小可复现命令：

```bash
python3 examples/python/tree_boosting.py
npm run check:trees
```

完整可运行接口示例来自 [LightGBM 实验](/ai/machine-learning/lightgbm-lab)，无需拼凑独立代码片段。

## 三个不变量

1. 同一次切分的左右样本不交叠，且合起来等于父样本；同一统计口径下 G、H 守恒。
2. 手写提升模型预测必须等于初始常数加全部已学习修正；成熟库模型产物可能已经合并初始值和缩放。
3. 验证数据选择轮数；最后测试数据不参与训练梯度或早停选择。

## 进一步核查

- [叶子与增益推导](/ai/machine-learning/lightgbm-objective)：检查符号、尺度、正则条件。
- [直方图与数据语义](/ai/machine-learning/lightgbm-tree-learning)：检查分箱、缺失和类别输入。
- [固定版本源码路径](/ai/machine-learning/lightgbm-source)：检查 Python 到 C++ 的实际职责。
- [参数调优文档](https://lightgbm.readthedocs.io/en/v4.6.0/Parameters-Tuning.html)：检查容量、时间与过拟合之间的取舍。
