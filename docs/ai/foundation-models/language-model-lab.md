---
title: 训练一个最小 next-token 模型
date: 2026-09-05
updated: 2026-09-06
type: lab
status: verified
track: ai
chapter: foundation-models
prerequisites:
  - /ai/foundation-models/sampling
outcomes:
  - 能用交叉熵训练一组可更新的 next-token logits
  - 能验证 loss 下降和每行概率和为 1
  - 能用固定随机种子复现逐 token 生成
  - 能说明 bigram 实验与 Transformer 语言模型的共同接口和能力边界
estimated: 50 分钟
categories: [智能算法]
tags: [Language Model, Python, Bigram, Experiment]
description: 仅用 Python 标准库训练一个字符 bigram 模型，观察参数更新、交叉熵下降和自回归生成。
---

# 训练一个最小 next-token 模型

## 实验目标与边界

本实验不用 Transformer，而用最小的 bigram 模型：当前 token 的一行可学习 logits 决定下一个 token 分布。它保留语言模型最核心的接口：

```text
当前上下文状态 → next-token logits → Softmax → loss / sampling
```

它不能理解长上下文，也没有 attention。选择它是为了先看清“哪些数值被训练更新、哪些设置只影响生成”。

## 环境与固定数据

- Python 3.10+；只使用 `math` 和 `random`；
- 无网络、无文件写入、CPU 运行通常低于 1 秒；
- 训练序列固定为 `^abab$` 和 `^ab$` 的重复样本；
- `^` 表示 BOS，`$` 表示 EOS；
- 随机种子固定为 7。

## 基线实现

先预测：训练后 `^` 后面最可能是什么？`a` 后面最可能是什么？再运行代码。

<ClientOnly>
  <LanguageModelLabPlayground />
</ClientOnly>

## 需要解释的证据

运行成功至少应看到：

- loss 从接近均匀分布的基线下降；
- `^ → a`、`a → b` 成为最高概率转移；
- 每一行 Softmax 概率和约为 1；
- 固定种子下重复运行得到相同 sample；
- `b` 后面可能是 `a` 或 EOS，因为训练数据中两种后继都出现过。

## 实验一：破坏标签

将代码中 `shuffle_targets = False` 改为 `True`。代码固定 seed=7，只打乱 target，保持 current 不变。观察 loss 能否继续下降、生成是否仍保持 `ab` 结构。这个对照验证训练目标来自当前—后继配对，而不是代码自动知道语言规律。

## 实验二：改变训练分布

把 `extra_a_sequences = 0` 改为 `20`，增加 20 条 `^aaaa$`。重新训练后检查 `a` 的后继分布。预期 `a→a` 概率上升；这是数据分布改变参数的例子。

## 实验三：只改变温度

不重新训练，把 `main` 中的 `temperature` 改成 `0.3` 和 `1.5`。Logits 保持完全相同，但抽样分布改变。记录多个 seed，不能只比较一条输出。

## 验收条件随问题改变

三类实验都检查概率和、有限生成长度、固定 seed 复现；不能继续要求生成结果只能属于 `ab` 系列。改变数据后生成 `a`、`aaaa` 等是允许的，应检查 `P(a|a)` 是否上升。比较多个 seed 的频率时先固定 logits；不要把一个随机句子当作分布。

本地也能运行同一份代码：`python3 examples/python/bigram_lab.py`（先进入博客仓库）。页面直接引用此文件，变式测试运行同一份实现。

## 实验记录

| 条件 | 必须记录 | 通过条件 |
| --- | --- | --- |
| 基线 | epoch loss、转移概率、sample | loss 下降，断言通过 |
| 标签破坏 | 新 loss 与 sample | 记录转移分布差异；loss 仍可能下降 |
| 数据改变 | `a` 的后继概率 | 概率随计数方向变化 |
| 温度改变 | 相同 logits、多 seed 输出 | 参数不变，采样分布变化 |

## 常见失败

- loss 变成 `nan`：检查稳定 Softmax 和 `log(0)`。
- 概率行和不为 1：检查归一化分母。
- 每次结果不同：确认 seed、候选顺序和随机调用次数都固定。
- 永不停止：训练数据中需要 EOS，生成还要设置最大长度。
- 把 bigram 结果解释成长程理解：该模型只看当前一个 token。

## 清理与复现

浏览器内代码只在 Python 运行时的内存中执行，不写文件。复现记录包含 Python 版本、数据序列、epoch、学习率、temperature、seed 与实际输出。下一步进入[从训练到重新加载的 tiny Transformer 实验](/ai/foundation-models/tiny-transformer-lab)，把本页的 logits 表替换为真实 Decoder 网络。
