---
title: 训练、早停与重载一个 LightGBM 模型
date: 2026-09-07
updated: 2026-09-07
type: lab
status: learnable
track: ai
chapter: machine-learning
prerequisites: [/ai/machine-learning/lightgbm-tree-learning]
outcomes: [运行固定版本原生训练, 区分目标与验证指标, 检查最佳轮数, 保存重载并验证预测一致]
estimated: 60 分钟
categories: [智能算法]
tags: [LightGBM, Python, Experiment]
description: 用固定合成数据完成数据集构建、验证早停、测试、模型保存与重载，并对照前面的手写实现。
---

# 训练、早停与重载一个 LightGBM 模型

## 实验目标与边界

把前面的原理接到一个完整可运行流程：构造数据、训练、按验证指标选轮数、最后测试、保存和重载。先检查四行例子与手写模型一致，再处理一个稍大的非线性回归问题。

这里全部使用合成数据，没有行情、因子或交易任务。结果只验证训练工具链和当前构造任务。

## 1. 固定环境

Python 3.12、LightGBM 4.6.0、NumPy 2.2.6、SciPy 1.15.3、scikit-learn 1.6.1。依赖统一在根目录 `pyproject.toml` 的 `trees` 可选依赖组声明，由根目录 `uv.lock` 锁定，使用根目录 `.venv`。

在仓库根目录执行：

```bash
uv run --extra trees --frozen python examples/python/lightgbm_lab.py
```

首次运行需要下载依赖；运行本身只使用 CPU、单线程，不访问外部数据。macOS 如缺少 `libomp.dylib`，安装 `brew install libomp` 后重试，原理是补齐原生库依赖的 OpenMP 运行时。Windows/Linux 的安装差异查 [官方安装说明](https://lightgbm.readthedocs.io/en/v4.6.0/Installation-Guide.html)。

也可以运行 `npm run check:trees`，它通过根目录的 `trees` 依赖组调用同一脚本，在本地按需验证。

## 2. 先做小样本对照

脚本 `oracle_checks()` 完成三组检查：

1. 手写 CART 与 scikit-learn 回归树的预测、特定样本阈值一致。
2. 手写平方损失 GBDT 与 scikit-learn 两轮提升的预测一致。
3. 将 LightGBM 的叶子样本限制、分箱最小样本、正则等调整到四行教学条件，检查预测 `[1.25,1.25,2.75,2.75]`。

四行样本无法直接套用面向较大数据的默认叶子限制。这里的小参数专为算例服务，不是实际任务的通用配置。

第一棵 LightGBM 树还应打印 `split_feature=0`、阈值约 2.5、`split_gain=4`。注意模型产物中的叶子已经包含学习率缩放；本例第一棵树还吸收初始常数，因此叶子为 1.5 与 2.5，而不是手写修正树的 -1 与 1。下一页会在源码中找到这两步。

## 3. 稍大的固定输入

固定 seed=7，独立生成 900 行、3 列均匀随机输入，标签为：

$$
y=2\mathbf1[x_0>0]+0.5x_1^2+\epsilon,
\qquad\epsilon\sim\mathcal N(0,0.15^2).
$$

第一列提供阶跃，第二列提供曲线，第三列是无关特征。前 500 行训练，接着 200 行验证，最后 200 行测试。本例各行独立同分布，行序没有业务时间含义；这种切片方式不能原样当成真实时序任务的划分方案。

基线始终预测**训练标签均值**。不能从测试标签重新计算一个更有利的基线常数。

## 4. 顺着接口读完整实现

<<< @/../examples/python/lightgbm_lab.py{python}

`Dataset` 包装训练输入并建立内部数据表示。验证数据使用 `reference=train` 复用训练数据的相关表示约束。`objective='regression'` 决定训练梯度，`metric='l2'` 决定记录和早停使用的 MSE，它们承担不同职责。[train 接口](https://lightgbm.readthedocs.io/en/v4.6.0/pythonapi/lightgbm.train.html)定义训练参数与 callbacks 的位置。

`record_evaluation` 保存完整验证轨迹；`early_stopping(30)` 在验证指标连续若干轮没有足够改善时停止。选择结果保存在 `best_iteration`。训练集不承担这里的早停判断；本实验只传一个验证集和一个指标。见 [早停回调](https://lightgbm.readthedocs.io/en/v4.6.0/pythonapi/lightgbm.early_stopping.html)。

## 5. 检查证据，而不是只看运行成功

程序检查：

- 最佳轮数在合法范围内，并对应记录轨迹的最低验证 MSE；
- 在这个固定合成任务上，模型测试 MSE 小于常数基线的 20%；
- 保存到最佳轮数后重载，预测差异不超过 $10^{-12}$。

测试集只在训练与轮数选择完成后评估。如果随后根据测试结果调参，该数据就不再能承担原先的最终测试职责。

`num_iteration=best` 在预测和保存时都显式传入，避免读者依赖隐含行为。模型文件保存树结构和参数结果；它不是训练数据、特征生成方法与依赖环境的完整替代。接口细节见 [Booster 的预测与保存](https://lightgbm.readthedocs.io/en/v4.6.0/pythonapi/lightgbm.Booster.html)。

## 6. 实验记录

2026-09-07，macOS ARM64、Python 3.12.9、上面的固定 Python 包、Homebrew libomp 23.1.0，CPU 单线程实际运行：

| 证据 | 结果 |
| --- | ---: |
| CART / sklearn、GBDT / sklearn、GBDT / LightGBM 对照 | 全部通过 |
| 最佳轮数 | 155 |
| 已评估轮数 | 185 |
| 常数基线测试 MSE | 1.3691432484 |
| 模型测试 MSE | 0.0279659873 |
| 保存重载最大预测差异 | 0 |

这些数值是固定合成数据上的实测，不是实际项目效果。验收条件使用上面的数值关系和容差；不同平台不要求最佳轮数逐字一致，也不把 `deterministic` 解释为跨版本、跨硬件的永久位级一致。

## 7. 变式与失败排查

| 观察或改动 | 检查与预期 |
| --- | --- |
| 提示没有正增益切分 | 检查样本数量、特征常量、叶子限制；也可能是正常停止 |
| 最佳轮数是 400 | 预算内仍在改善；不应声称一定触发了提前停止 |
| 学习率改为 0.01 | 保持其他条件，检查验证曲线是否需要更多轮；不保证测试分数更好 |
| 保存后预测不同 | 对照特征顺序、使用轮数、预处理与版本 |
| 没有 LightGBM 模块 | 确认使用上述 uv 命令而非系统 Python |

做变式时先记录验证变化，新的测试结论需要明确标成探索；不能将多次看测试后的最好结果称为一次闭卷考试。

## 自测、清理与下一步

为什么训练到第 200 轮才停止，最终模型却可能只保存到第 170 轮？

::: details 参考答案
第 170 轮可能是最佳验证轮数，之后继续训练是为了等待足够长的无改善窗口。实际执行轮数与最终采用的轮数承担不同职责。
:::

示例使用临时目录保存模型，重载检查后自动删除；依赖缓存保留。若要保留模型，应同时记录配置、数据来源和特征顺序。下一步：[从 Python 调用追踪到 LightGBM 的一次分裂](/ai/machine-learning/lightgbm-source)。
