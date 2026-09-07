---
title: 从零实现 CART 回归树
date: 2026-09-07
updated: 2026-09-07
type: lab
status: learnable
track: ai
chapter: machine-learning
prerequisites: [/ai/machine-learning/decision-tree, /systems/python-project-workflow]
outcomes: [实现数值切分与递归预测, 检查停止条件和重复值, 用成熟库核对学习结果]
estimated: 60 分钟
categories: [智能算法]
tags: [CART, Python, Experiment]
description: 用标准库实现多特征回归树，并用边界输入和 scikit-learn 对照验证训练与预测。
---

# 从零实现 CART 回归树

## 实验目标与环境

把上一节的阈值表变成一个能训练、能预测的对象。待验证命题是：同一套平方误差规则应当同时解释手算答案、递归代码和成熟库在受控样本上的结果。

核心实验使用 Python 3.9+ 标准库，无网络、无输出文件，四行输入来自上一节。第三方对照固定 Python 3.12 和 scikit-learn 1.6.1，使用后文的独立运行命令。2026-09-07 的实际结果见实验记录。

## 1. 先规定接口和状态

`fit(X,y)` 生成树，`predict(X)` 只沿树查询。节点保存：

| 字段 | 含义 |
| --- | --- |
| `value`、`count` | 当前区域的均值、样本数 |
| `feature`、`threshold` | 内部节点采用的特征列和阈值 |
| `gain` | 这次切分减少的 SSE |
| `left`、`right` | 两个子节点 |

`feature is None` 表示叶子。所有节点先按叶子建立，只有找到合法且严格改善的切分，才增加孩子。这样停止分支自然保留一个合法预测。

根节点深度为 0：`max_depth=0` 只有根叶，`max_depth=1` 最多问一次问题。深度是路径长度，不是叶子数量。

## 2. 自己写之前，先描述算法

```text
build(当前样本索引, 当前深度):
    计算均值和父节点 SSE
    如果深度或样本数不允许切分，返回叶子
    遍历每一列：
        对当前样本的该列数值排序并去重
        遍历相邻值中点：
            按 <= 和 > 分成左右索引
            任一边不足 min_samples_leaf，跳过
            计算父 SSE - 左 SSE - 右 SSE
            如果严格超过当前最好增益，记住候选
    如果没有候选，返回叶子
    否则递归建立两个孩子，返回内部节点
```

同增益时保留最先遇到的候选，便于复现。这里直接重算每个候选的误差，一节点最坏约为 $O(dn^2)$：每列最多 $n-1$ 个阈值，每次扫描 $n$ 行。这不是高性能实现。排序加前缀统计可以把每列的候选扫描降到线性，之后再学习 LightGBM 的分箱。

## 3. 阅读并运行完整源码

以下是仓库中实际运行的源码；本节重点读到 `CARTRegressor.predict` 为止。`SquaredGBDT` 留到后两节。

<<< @/../examples/python/tree_boosting.py{python}

在仓库根目录运行：

```bash
python3 examples/python/tree_boosting.py
```

应看到：

```text
CART split=2.5, gain(SSE)=4.0, prediction=[1.0, 1.0, 3.0, 3.0]
```

程序还输出后面 GBDT 单元的两轮结果。先只解释本行：根节点切分列 0、阈值 2.5、左叶为 1、右叶为 3。

## 4. 沿一个样本走完预测

对 `[[2.5]]`，循环检查 `2.5 <= 2.5`，进入左叶，返回 1。对 `[[5]]`，进入右叶，返回 3。预测不会重新计算阈值，也不需要标签；训练结束后，原训练样本没有被保存在模型中。

先自行实现 `predict`，再用上述两个输入调试。常见错误是训练用 `<=`、预测却用 `<`，使边界点走到另一边。

## 5. 必做变式

| 变化 | 验收条件 | 解释 |
| --- | --- | --- |
| `max_depth=0` | 所有预测为 2 | 容量限制确实生效 |
| `min_samples_leaf=3` | 四行数据无法分成两个合法叶子 | 限制作用于两个孩子 |
| 特征全相同 | 返回一个叶子 | 不能凭标签强拆相同输入 |
| 标签变为 `2*y+5` | 叶子值为 7、11 | 预测由数据学出 |
| 增加一列全零特征放在第一列 | 学到的切分列为 1 | 搜索覆盖全部特征 |
| 输入 NaN 或不等长行 | 明确抛出 `ValueError` | 本实现未实现缺失值路由 |

这些变式已放在同一源码的 `self_check` 中。独立实现验收时先不看答案，写完自己的类，再用同样的输入和不变量检查；运行作者代码只证明环境和示例正常。

## 6. 与 scikit-learn 对照

安装好 [uv](https://docs.astral.sh/uv/getting-started/installation/) 后，在仓库根目录运行：

```bash
uv run --extra trees --frozen python examples/python/lightgbm_lab.py
```

此命令使用 uv 管理的隔离环境，不修改仓库已有的 PyTorch 依赖环境。首次下载需要网络；后续执行使用缓存。macOS 如果报告缺少 `libomp`，按 [LightGBM 安装说明](https://lightgbm.readthedocs.io/en/v4.6.0/Installation-Guide.html#macos)安装 OpenMP 运行库后重试。

对照程序比较四行数据上的阈值与预测，还比较固定 seed=13 的 80 行、三特征数据上的深度 3 回归树预测。它也运行后续 GBDT 和 LightGBM 实验。

不要要求任意数据上的树结构都逐字相同。并列候选的选择、阈值精度、缺失处理和实现约束都可能不同。本次受控对照的结论仅是这些输入下预测一致。

## 实验记录、失败与清理

2026-09-07 核心脚本实测：阈值 2.5，SSE 下降 4，所有变式通过。完整第三方对照记录见 [LightGBM 训练实验](/ai/machine-learning/lightgbm-lab)。

如果出现无穷递归，先检查是否允许空孩子，或是否把同一组索引原样传回自己；如果均值异常，检查左右样本是否丢失或重复。不要通过忽略异常让错误输入继续训练。

核心脚本不产生文件；第三方实验的临时模型自动删除，依赖缓存可保留。记录自己的 Python 版本、修改内容与输出，即可复现。

## 自测与下一步

为什么模型在预测时不用保存全部训练数据？

::: details 参考答案
分组规则已经编码为特征和阈值，区域内最优常数已经编码为叶子值。常规预测只需要这些学习结果。重新训练和审计可能需要原始数据，但它们不属于这份最小预测对象的必要状态。
:::

下一步：[梯度提升为什么逐轮拟合修正量](/ai/machine-learning/gradient-boosting)。
