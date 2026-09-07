---
title: 从常数基线到线性模型
date: 2026-09-04
updated: 2026-09-04
type: lab
status: learnable
track: ai
prerequisites: [/ai/machine-learning/problem-and-evaluation, Python 基础]
outcomes: [建立常数基线, 比较训练与测试误差, 识别可疑高分]
estimated: 40 分钟
description: 用固定的一维数据手写常数基线和线性回归，观察泛化与异常样本。
---

# 从常数基线到线性模型

## 目标与命题

命题：复杂度只有相对基线才有意义；同一个平均误差可能隐藏不同失败。实验使用一维房屋面积预测价格，不依赖第三方包。

## 环境与固定数据

Python 3.10+。训练数据：`x=[1,2,3,4]`、`y=[3,5,7,9]`；测试数据：`x=[5,6]`、`y=[11,20]`。最后一个测试标签故意偏离线性规律，用于误差分析。

## 步骤

1. 常数基线始终预测训练标签均值 `6`。
2. 使用已知线性候选 `ŷ=2x+1`，不要先引入库。
3. 分别计算训练和测试 MAE。
4. 打印逐样本误差，不只看均值。

<ClientOnly>
  <PythonPlayground
    title="比较常数基线与线性候选"
    :code="`def mae(y_true, y_pred):\n    assert len(y_true) == len(y_pred)\n    return sum(abs(a - b) for a, b in zip(y_true, y_pred)) / len(y_true)\n\nx_train, y_train = [1, 2, 3, 4], [3, 5, 7, 9]\nx_test, y_test = [5, 6], [11, 20]\nbaseline = sum(y_train) / len(y_train)\nlinear = lambda x: 2 * x + 1\n\nassert mae(y_train, [baseline] * 4) == 2\nassert mae(y_train, [linear(x) for x in x_train]) == 0\nassert mae(y_test, [linear(x) for x in x_test]) == 3.5\nprint('逐样本误差:')\nprint([(x, y, linear(x), abs(y-linear(x))) for x, y in zip(x_test, y_test)])`"
  />
</ClientOnly>

## 预期与实际解释

线性模型训练误差为 0，但测试 MAE 为 3.5；错误完全来自第二个样本。证据支持“模型捕获了训练数据中的线性规律”，不支持“现实价格只由面积决定”。

## 失败注入

把测试标签误填成由 `2x+1` 生成，分数会完美，但这只是目标泄漏。再把训练和测试行随机混合，观察无法代表未来时间切片的问题。记录每次只改变了什么。

## 常见失败与复现

- `zip` 长度不同时会静默截断：先断言输入长度一致。
- 只看平均 MAE 会漏掉第二个样本的集中失败：必须打印逐样本误差。
- 此固定例子不是房价模型，只验证评测思路。

脚本不产生文件，无需清理。保存 Python 版本、代码与输出；下一步学习[决策树如何从数据中学出规则](/ai/machine-learning/decision-tree)，把一条线性候选扩展为可以学习分区规则的模型。
