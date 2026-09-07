---
title: 0. 模型计算与优化基础
date: 2026-09-04
updated: 2026-09-06
type: overview
status: learnable
track: ai
categories: [智能算法]
tags: [Mathematics, Tensor, Optimization]
description: 建立读懂模型计算所需的最小数学语言，并用实验验证矩阵、张量、梯度和优化。
---

# 0. 模型计算与优化基础

本章只建立后续反复使用的语言：**对象怎样表示、shape 怎样约束计算、误差怎样沿计算图传播、参数怎样更新**。它不是线性代数和概率论的压缩百科。

## 前置与目标

前置：数学与线性代数基础，能阅读 Python 列表和简单函数。本章将已有数学连接到模型计算，不重教基础算术；本地运行工具见[Python 项目准备](/systems/python-project-workflow)。完成后应能：

- 从输出元素反推矩阵乘法的输入行和列；
- 为 `[B,T,C]`、`[B,H,T,D]` 的每个轴写出语义；
- 区分 reshape、transpose、broadcast 和矩阵乘法；
- 用最小训练循环解释 loss、gradient、learning rate 的关系。

## 推荐顺序

| 类型 | 学习单元 | 预计 | 产出 |
| --- | --- | ---: | --- |
| lesson | [矩阵乘法：一行怎样读取一列](/ai/foundations/matrix-multiplication) | 25 分钟 | 能手算并解释中间维 |
| lesson | [张量的轴、reshape 与 transpose](/ai/foundations/tensor-shapes) | 30 分钟 | 能追踪 shape 和元素不变量 |
| lesson | [损失、梯度与最小优化循环](/ai/foundations/optimization-loop) | 30 分钟 | 能手算一次参数更新 |
| lab | [基础计算实验](/ai/foundations/lab) | 35 分钟 | 可执行断言与实验记录 |
| reference | [符号与 shape 速查](/ai/foundations/reference) | 查询用 | 统一全专栏符号 |
| review | [第 0 章复习与验收](/ai/foundations/review) | 20 分钟 | 纸笔题 + 调试任务 |

## 贯穿例子

先计算 `A[2,3] @ B[3,2] → C[2,2]`，再把行看成 token、列看成 feature，将规则推广到 `[B,T,C] @ [C,Cout]`。之后只引入一个标量参数，用同一条“前向计算 → 损失 → 梯度 → 更新”链解释训练。

## 本章边界与过关标准

本章不讨论某个网络为什么适合图像或语言，也不展开统计学习理论。过关标准是：不依赖框架提示，完成矩阵计算和 shape 推导；运行实验断言；说明一次错误 reshape 或错误学习率会怎样暴露。

下一章：[机器学习与泛化评估](/ai/machine-learning)。
