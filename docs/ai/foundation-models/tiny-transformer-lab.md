---
title: 在 CPU 上训练、保存并重新加载 tiny Transformer
date: 2026-09-06
updated: 2026-09-06
type: lab
status: verified
track: ai
chapter: foundation-models
prerequisites:
  - /ai/foundation-models/language-model-lab
  - /systems/python-project-workflow
outcomes:
  - 能将字符、标签、因果注意力和优化器接成真实 Decoder 训练
  - 能保存并加载参数与优化器状态
  - 能用未来扰动和重新加载对照诊断实现错误
estimated: 90min
categories: [智能算法]
tags: [Transformer, PyTorch, CPU, Checkpoint]
description: 用两层四头 Decoder 跑通样本、训练、生成、保存与恢复，连接公式演示和真实模型项目。
---

# 在 CPU 上训练、保存并重新加载 tiny Transformer

上一实验用一张 logits 表学习当前字符到下个字符的关系。这次把表替换成**字符 Embedding、位置 Embedding、两层四头因果注意力、FFN、Norm 和词表头**。它是实际参与反向传播的 Transformer，但只有小型教学数据，不具有通用语言能力。

学习任务是固定小 batch 过拟合：前文为 `^pa` 时预测 `b`，为 `^qa` 时预测 `c`。两者当前字符都为 `a`，bigram 无法区分；Transformer 可以读取更早的 `p/q`。

预计学习、运行与故障练习共 90 分钟，首次环境下载另计。

## 环境与准备

先完成[本地 Python 项目准备](/systems/python-project-workflow)。固定 Python 3.12、PyTorch 2.13.0、CPU、单线程、seed=7；不需要显卡，不下载语料或模型。训练只做 200 次小 batch 更新；不同机器耗时不同，首次依赖下载不计入训练时间。

从仓库根目录运行。Windows/Linux 使用：

```bash
uv run --extra cpu --frozen python examples/python/tiny_transformer.py
```

Apple Silicon Mac 使用：

```bash
uv run --extra mps --frozen python examples/python/tiny_transformer.py
```

以下命令的 `--extra cpu` 在该 Mac 上替换为 `--extra mps`，脚本计算设备仍是 CPU。

## 先写出本次会计算什么

固定词表 `_^pqabc$`：`_` 为 PAD，`^` 是开始，`$` 是结束。训练字符串只有 `^pab$`、`^qac$`；字符级 tokenization 是确定性查表。

```text
input[0] = [^, p, a, b]     labels[0] = [p, a, b, $]
input[1] = [^, q, a, c]     labels[1] = [q, a, c, $]
```

| 阶段 | 本例 shape | 代码入口 |
| --- | --- | --- |
| input / labels | `[2,4]` | `batch` |
| token + position | `[2,4,32]` | `TinyLM.forward` |
| Q/K/V 拆头 | `[2,4,4,8]`，轴为 B/H/T/D | `Block.forward` |
| 注意力分数 | `[2,4,4,4]`，轴为 B/H/query/key | `scores` |
| 两个 Block 后 | `[2,4,32]` | `self.blocks` |
| 词表 logits | `[2,4,8]` | `self.head` |
| 交叉熵输入 | `[8,8]` 与 `[8]` | `loss_for` 的 flatten |
| loss | 单个标量 | 所有非 PAD 目标平均 |

这里 H 恰好等于 T，不能只看数字判断转置正确。`nn.Linear` 内部保存 `[out,in]` 权重；其前向等价于 `x @ weight.T + bias`，与课程行向量约定一致。

训练 loss 不必降到 0：两个样本都以 `^` 开头，却分别要求下一个字符为 `p/q`，这个位置存在真实不确定性。不要为了把 loss 压到 0 而取消 causal mask。

## 完整代码与阅读顺序

代码直接由仓库文件嵌入，文章和命令行使用同一份实现。先读 `batch → Block → TinyLM → loss_for → update`，再读 checkpoint 部分。

<details><summary>展开完整、可运行源码</summary>

<<< @/../examples/python/tiny_transformer.py

</details>

右侧 padding 只出现在有效 token 之后，causal mask 已阻止有效 query 读取 PAD；loss 忽略 PAD 标签。若改成左 padding 或混入中间 PAD，就必须同时重做位置与 attention padding mask，不能只改 `ignore_index`。

这个实现省略 dropout、KV Cache、混合精度和分布式。生成每一步重算完整前缀，先验证正确性；缓存优化应在它之上做等价性对照。

## 一次运行应留下什么

程序打印参数量、input/logits shape、step 1/50/100/200 的训练与保留样本 loss、两个前缀的生成结果，以及五项检查结果：

```text
PASS: shift / causal mask / parameter update / reload / resume
checkpoint: artifacts/tiny-transformer.pt
```

通过条件是：训练 loss 低于初始值的一半、Embedding 确实改变、未来扰动不改变前缀 logits、重新加载输出一致、恢复优化器后继续一步参数一致。固定字符串的生成应分别指向 `^pab$` 与 `^qac$`；检查停止原因应为 `eos`。

### 本次实际运行记录

2026-09-06，macOS arm64、Python 3.12、PyTorch 2.13.0、CPU 单线程，参数量 **26,248**，输入 `[2,4]`、logits `[2,4,8]`：

| step | train loss | heldout loss |
| --- | ---: | ---: |
| 1 | 1.0589 | 1.7894 |
| 50 | 0.1739 | 3.2388 |
| 100 | 0.1737 | 3.3662 |
| 200 | 0.1735 | 3.5135 |

生成分别为 `^pab$` 和 `^qac$`，均以 EOS 停止；保存、重新启动加载与恢复一步参数对照通过。删除 causal mask、取消标签右移两种故障均在训练前被断言拒绝。数字为本环境观察，其他平台应检查误差与因果条件，不逐位要求日志相同。

训练 loss 的约 `0.1733` 下限来自两个样本的首个预测：`p/q` 等概率时，平均到每条 4 个目标位置得到 `log(2)/4`。保留集 loss 反而上升，是本实验必须保留的结果，说明记住两条训练样本没有自动学会长度泛化。

保留样本为更长的 `^paab$`、`^qaac$`。它们没有加入优化器更新；这里故意不要求它们的 loss 下降。训练集只有两条，保留集也很小，这些数据只用于观察长度迁移失败，不能给出可信的泛化评测结论。

## 关掉训练进程，再加载

重新运行一个命令，只读取 checkpoint 并生成：

```bash
uv run --extra cpu --frozen python examples/python/tiny_transformer.py --generate-only --prompt '^qa'
```

与同一 checkpoint 生成结果应相同。文件保存模型配置、词表、训练/保留文本、数据哈希、权重、优化器状态、step 和随机状态。恢复测试使用固定全 batch、无 dropout；不需要额外恢复数据游标。改成随机 DataLoader 时，必须补上采样状态。

## 三个调试实验

按顺序做，每次只改一处，并在下一次前恢复源码：

1. **删除未来遮罩**：把 `masked_fill` 去掉。程序训练前的 `audit_causality` 应失败，因为相同前缀读取了不同未来。loss 更低也不能使实验通过。
2. **标签不右移**：把 `batch` 中 labels 改成 inputs。开头标签断言应失败；模型此时在抄当前字符，而非预测后继。
3. **换新长度**：比较训练样本与 `EVAL_TEXTS` 的 loss，并用 `--prompt '^qaa'` 生成。即便结果碰巧正确，也要说明这只有两个保留字符串。

<details><summary>定位提示</summary>

第一题回看 `Block.forward` 的 query/key 轴；第二题回看 `batch` 的 `[:-1]` 和 `[1:]`。第三题不存在预设“必须泛化成功”的答案，合格报告应保留实际输出，并区分优化成功与未见长度上的表现。

</details>

## 失败排查与清理

| 现象 | 优先检查 |
| --- | --- |
| `Failed to initialize NumPy` 警告 | 本实验只使用纯 torch Tensor，不依赖 NumPy；若后续练习使用 `.numpy()` 再加入相应依赖 |
| 导入 torch 失败 | 是否运行了对应依赖组的环境命令 |
| `KeyError/ValueError` 或词表字符错误 | prompt 是否只使用当前字符词表，是否包含 PAD/EOS |
| loss 不能明显下降 | 标签右移、因果方向、是否执行 step、学习率 |
| 训练好但加载后不同 | 配置、词表、dtype、是否加载了刚保存的文件 |
| 恢复一步后不同 | 是否恢复 optimizer 状态，而不仅是参数 |
| 停止原因为 `context_limit` | 已到最多 8 个位置；缩短 prompt，不把它当 EOS |

重新运行训练会覆盖指定 checkpoint。需要对照时传不同 `--checkpoint artifacts/experiment-b.pt`；清理只删除自己的实验产物。`--self-test` 在临时目录执行同一实验并自动清理，适合 CI。

## 实现验收与下一步

不看正文，补完以下说明：为什么 `a` 后面可以根据 `p/q` 选择不同字符？哪个断言能阻止未来泄漏？为什么只加载权重不足以恢复 AdamW？

答案应分别指向历史 K/V 的读取、未来扰动前缀不变、优化器动量状态。再独立完成一个故障实验，保存报错与修复前后结果。完成这些才记录“实现通过”；点击运行一次只能记录“基线运行通过”。

下一步：[模型架构家族](/ai/foundation-models/model-families)。完成整章后再用[MiniMind 案例](/ai/minimind-practice)对照真实项目的 tokenizer、GQA 和训练流水线。

实现接口参照 [PyTorch Linear](https://docs.pytorch.org/docs/stable/generated/torch.nn.Linear.html)、[CrossEntropyLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html) 与 [保存/加载教程](https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html)。本页的小数据、模型和故障实验是本站教学设计。
