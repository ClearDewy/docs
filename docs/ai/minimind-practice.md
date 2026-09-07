---
title: MiniMind 全链路实践
date: 2026-09-04
updated: 2026-09-06
type: case-study
status: draft
track: ai
categories:
  - 智能算法
tags:
  - MiniMind
  - PyTorch
  - LLM
  - Practice
description: 把 MiniMind 作为实践样本，对照验证模型、数据、训练、对齐、推理和评测知识。
---

# MiniMind 全链路实践

[MiniMind](https://github.com/jingyaogong/minimind) 是本知识库的第一个贯穿式实践项目。它的价值是规模较小、核心实现集中、训练阶段较完整；它不是知识体系本身，也不代表所有生产实现的最佳选择。

本文基于 `2026-09-04` 获取的主线提交 `7a6fddd`。项目会持续变化，后续实验必须记录实际提交和配置。

::: warning 案例状态
以下内容是基于上述时间与提交的源码阅读路线，不是当前上游状态声明，也不是已完成的实验报告。执行前必须重新确认提交、依赖、数据许可和硬件条件；观察不能跨版本直接外推。
:::

## 先完成本站的小模型实现

先运行[tiny Transformer 实验](/ai/foundation-models/tiny-transformer-lab)，亲手完成一次前向 shape 追踪、标签检查、训练、保存、加载与故障修复，再使用下表读 MiniMind。本站小模型提供固定、可执行的学习闭环；本页仍是指定旧提交的源码阅读案例，没有据此宣称 MiniMind 的全阶段训练已经复现。

迁移时逐项找出本地 `batch / Block / TinyLM / update / checkpoint` 在 MiniMind 中对应的位置；先只比较 Dense 路径，不一次加入 GQA、MoE、SFT 和 DPO。

## 1. 项目映射到知识体系

| 知识问题 | MiniMind 入口 | 阅读重点 |
| --- | --- | --- |
| token 怎样表示 | `model/tokenizer*`、`trainer/train_tokenizer.py` | BPE + ByteLevel、特殊 token、chat template |
| 样本怎样构造 | `dataset/lm_dataset.py` | input、label、mask、截断和各训练阶段格式 |
| Transformer 怎样计算 | `model/model_minimind.py` | RMSNorm、RoPE、GQA、SwiGLU、残差、MoE |
| 怎样从零训练 | `trainer/train_pretrain.py` | next-token loss、优化器、学习率和 checkpoint |
| 怎样遵循指令 | `trainer/train_full_sft.py` | 对话序列化、目标 mask 和全参数更新 |
| 怎样低成本适配 | `model/model_lora.py`、`trainer/train_lora.py` | 注入位置、低秩参数和权重合并 |
| 怎样学习偏好 | `trainer/train_dpo.py` | chosen/rejected、参考模型和 log-prob |
| 怎样做在线优化 | `train_ppo.py`、`train_grpo.py`、`train_agent.py` | rollout、reward、KL 与策略更新 |
| 怎样蒸馏 | `trainer/train_distillation.py` | teacher/student、温度、CE + KL |
| 怎样生成和服务 | `eval_llm.py`、`scripts/serve_openai_api.py` | sampling、cache、协议和服务边界 |

这个表是双向索引：学习概念时找到项目案例，阅读代码时回到概念章节。不要按文件列表从头读到尾。

## 2. 实践顺序

### 阶段 A：只读模型，不训练

1. 用极小配置实例化模型；
2. 统计参数量；
3. 给每个模块注册 shape 观察；
4. 从 `input_ids` 追踪到 logits；
5. 对照[序列、注意力与 Transformer](/ai/transformers)解释每次投影、拆头、转置和残差。

验收：能够画出调用链，并说明 Dense/GQA 配置改变了哪些 shape 和资源。

### 阶段 B：验证数据与目标

1. 读取少量 pretrain、SFT、DPO 样本；
2. 查看 tokenization 前后长度；
3. 可视化 attention mask 和 loss mask；
4. 手工检查 label shift、padding 和截断；
5. 构造边界样本验证特殊 token。

验收：任取一个 loss 位置，都能指出它在原始文本中预测什么。

### 阶段 C：跑通最小预训练

先单 batch 过拟合，再用微型语料训练 tiny 模型。固定随机种子，记录训练/验证 loss、token 吞吐、内存、配置和 checkpoint 恢复。

验收：恢复训练后状态连续；改变一个变量时有明确对照；不把 loss 下降包装成通用语言能力。

### 阶段 D：SFT 与生成

在固定提示词集上比较预训练与 SFT 权重，分别检查格式、角色边界、停止条件和基础续写能力。对 greedy、temperature、top-k/top-p 做控制变量实验。

验收：报告改善、无变化和退化样本，并能区分训练变化与采样变化。

### 阶段 E：LoRA 与 DPO

先验证 LoRA 只有目标增量参数可训练，再用极小偏好集验证 DPO loss 的方向。比较基础、SFT、LoRA、DPO 四个检查点。

验收：行为变化能追溯到数据与目标，不只展示挑选出的最好回答。

### 阶段 F：选修专题

蒸馏、MoE、PPO、GRPO/CISPO、Agentic RL、分布式和 API 服务分别独立实验。每次只引入一个新机制；没有稳定基线和评测时，不进入在线 RL。

## 3. 每次实验的记录格式

```text
问题：这次想验证什么？
知识位置：对应哪一章、哪一个概念？
代码身份：仓库、commit、是否有本地修改？
数据：来源、版本、范围、样本数、token 数？
配置：模型、优化器、序列长度、batch、精度、设备？
基线：与什么比较？只改变了什么？
结果：指标、曲线、资源、成功和失败样本？
结论：观察支持什么？
边界：不能据此声称什么？
```

## 4. 第一轮明确不做

- 不先下载全部数据或追求复现仓库宣传结果；
- 不从 PPO、GRPO 或 Agentic RL 倒着猜 Transformer；
- 不把能运行脚本当作理解实现；
- 不逐行背代码，优先追踪数据流、shape、状态和不变量；
- 不因示例输出流畅就声称模型拥有知识、推理或可靠工具能力；
- 不让 MiniMind 的目录变化迫使知识库目录跟着变化。

## 5. 与其他实践的关系

MiniMind 用于观察完整小模型链路；从零最小实现用于消除框架遮蔽；Hugging Face 工具链用于学习生态兼容；更大的开源模型用于研究规模化推理和服务。它们可以共享概念和评测，但实验结论不能跨模型、数据与硬件直接外推。

