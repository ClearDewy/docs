---
title: 智能算法知识地图
date: 2026-09-04
updated: 2026-09-06
article: false
type: overview
status: verified
track: ai
description: 智能算法专栏的依赖关系、学习顺序、内容边界和建设成熟度。
---

# 智能算法知识地图

知识地图负责回答“在哪里、依赖什么、下一步是什么”，不承担具体教学。章节编号表示主依赖，不表示所有主题只能线性学习。

## 主依赖

<ClientOnly>
  <MermaidDiagram
    title="智能算法的学习依赖"
    :code="`flowchart LR\n A[0 模型计算基础] --> B[1 机器学习、树模型与泛化评估]\n A --> C[2 神经网络]\n B --> C\n C --> D[3 Transformer]\n D --> E[4 基础模型]\n E --> F[5 数据与训练]\n F --> G[6 推理与评测]\n G --> H[7 RAG 与 Agent]\n L[实验与案例] -.持续验证.-> B\n L -.持续验证.-> D\n L -.持续验证.-> G`"
  />
</ClientOnly>

## 当前可执行主线

1. [矩阵乘法](/ai/foundations/matrix-multiplication)：理解一行和一列如何生成一个标量。
2. [张量的轴与形状](/ai/foundations/tensor-shapes)：把矩阵规则推广到 batch、token、head。
3. [最小训练循环](/ai/foundations/optimization-loop)：连接损失、梯度和参数更新。
4. [模型是真的学会，还是偷看了答案？](/ai/machine-learning/problem-and-evaluation)：先学会识别记忆、泄漏和虚假高分。
5. [机器学习基线实验](/ai/machine-learning/baseline-lab)：用简单模型暴露数据和指标问题；接着完成下方第 1 章树模型路线，再进入神经网络。
6. [MLP 如何学习表示](/ai/deep-learning/mlp-representation)：从线性层进入非线性组合。
7. [反向传播](/ai/deep-learning/backpropagation)：沿计算图追踪梯度。
8. [QKV 是一次可学习检索](/ai/transformers/qkv-retrieval)：理解 attention 的语义。
9. [完整注意力流水线](/ai/transformers/attention-pipeline)：连接缩放、mask、softmax 和加权读取。
10. [单头因果注意力实验](/ai/transformers/attention-lab)：运行同一组数值并用断言验证完整闭环。
11. [多头注意力的形状](/ai/transformers/multi-head-shapes)：在单头闭环之上增加 batch、head、拆分与合并。
12. [Decoder Block](/ai/transformers/decoder-block)：把注意力、残差、归一化和逐 token FFN 放回完整结构。
13. [文本与 next-token 样本](/ai/foundation-models/tokenization-and-samples)：连接 tokenizer、Embedding、输入与标签。
14. [批次与因果遮罩](/ai/foundation-models/data-batches-and-causal-mask)：从 token 流构造 `[B,T]` 并阻止未来泄漏。
15. [完整语言模型结构](/ai/foundation-models/language-model-architecture)：组装 Embedding、Decoder Blocks、Norm 与词表头。
16. [Next-token 前向计算](/ai/foundation-models/next-token-prediction)：从隐藏表示推导词表 logits、概率和 loss。
17. [语言模型训练循环](/ai/foundation-models/training-loop)：把 batch loss、反向传播与 optimizer step 闭环。
18. [参数、显存与计算量](/ai/foundation-models/parameters-memory-compute)：估算模型权重、训练状态、激活和 KV Cache。
19. [训练与生成](/ai/foundation-models/training-vs-generation)：区分并行训练和逐 token 生成。
20. [Prefill 与 KV Cache](/ai/foundation-models/prefill-kv-cache)：理解增量推理怎样复用历史 K/V。
21. [采样策略](/ai/foundation-models/sampling)：操作 temperature、top-k 和 top-p。
22. [最小语言模型实验](/ai/foundation-models/language-model-lab)：训练可更新 logits 并复现生成。
23. [tiny Transformer 实操](/ai/foundation-models/tiny-transformer-lab)：在 CPU 上训练、保存、重新加载并验证恢复。
24. [模型架构家族](/ai/foundation-models/model-families)：区分 Encoder-only、Encoder–Decoder 与 Decoder-only。
25. [Scaling 与 MoE](/ai/foundation-models/scaling-and-moe)：区分参数、数据、计算与稀疏专家。
26. [多模态与扩散](/ai/foundation-models/multimodal-and-diffusion)：连接视觉语言理解与去噪生成。
27. [能力来源与边界](/ai/foundation-models/capability-boundaries)：区分参数、上下文、检索和工具结果。
28. [数据谱系与切分](/ai/data-training-alignment/data-lineage-and-splits)：记录来源、版本、去重簇与无泄漏 split。
29. [预训练证据](/ai/data-training-alignment/pretraining-evidence)：从单 batch 过拟合推进到可恢复基线。
30. [SFT 与 Chat Template](/ai/data-training-alignment/sft-and-chat-template)：连接结构化消息、token 和 loss mask。
31. [LoRA 适配](/ai/data-training-alignment/lora-adaptation)：区分冻结基座与低秩可训练增量。
32. [偏好数据与 DPO](/ai/data-training-alignment/preference-alignment)：理解 chosen/rejected、参考策略和回归。
33. [训练审计实验](/ai/data-training-alignment/training-evidence-lab)：用断言检查重复、SFT mask 和偏好对。
34. [推理服务请求](/ai/inference-evaluation-safety/inference-serving)：区分 API、调度、runtime、cache 与输出。
35. [性能指标](/ai/inference-evaluation-safety/performance-metrics)：测量 TTFT、TPOT、吞吐、显存和成本。
36. [可信评测设计](/ai/inference-evaluation-safety/evaluation-design)：从用户任务建立数据、rubric、指标和基线。
37. [错误分类与归因](/ai/inference-evaluation-safety/error-analysis)：用 oracle 对照定位模型、检索、工具和评分错误。
38. [模型外安全控制](/ai/inference-evaluation-safety/safety-controls)：落实权限、schema、审批、隔离与审计。
39. [评测与安全实验](/ai/inference-evaluation-safety/evaluation-safety-lab)：保留逐样本证据并注入高风险动作。
40. [RAG 证据链](/ai/agents-and-systems/rag-pipeline)：从文档解析到引用建立可追踪路径。
41. [检索与回答评测](/ai/agents-and-systems/retrieval-evaluation)：分开测 corpus、retrieval、context 和 answer。
42. [工具调用协议](/ai/agents-and-systems/tool-protocol)：定义 schema、权限、错误、副作用与幂等。
43. [Agent 状态机](/ai/agents-and-systems/agent-state-machine)：闭合成功、失败、等待、取消和恢复路径。
44. [上下文与记忆](/ai/agents-and-systems/memory-and-context)：区分本轮 token、任务状态和长期事实。
45. [可靠性与多 Agent](/ai/agents-and-systems/reliability-and-multi-agent)：控制重试、审批、预算和合并责任。
46. [Agent 状态机实验](/ai/agents-and-systems/agent-loop-lab)：运行成功、超时与写入审批路径。

## 第 1 章树模型路线

完成机器学习基线实验后，按以下顺序学习；它不依赖神经网络章节。下面全部为 `learnable`，实现与原生库对照由构建前脚本验证；独立实现需读者完成实验。

1. [决策树如何从数据中学出规则](/ai/machine-learning/decision-tree)：手算阈值、叶子值和误差下降。
2. [从零实现 CART 回归树](/ai/machine-learning/cart-lab)：实现数值切分、递归建树与预测。
3. [梯度提升为什么逐轮拟合修正量](/ai/machine-learning/gradient-boosting)：手算两轮修正与累计预测。
4. [从零实现平方损失 GBDT](/ai/machine-learning/gbdt-lab)：复用 CART 实现最小提升循环。
5. [LightGBM 如何计算叶子值与分裂增益](/ai/machine-learning/lightgbm-objective)：推导梯度、Hessian、正则与增益。
6. [LightGBM 如何用直方图生长一棵树](/ai/machine-learning/lightgbm-tree-learning)：解释分箱、叶子选择、缺失与类别路由。
7. [训练、早停与重载一个 LightGBM 模型](/ai/machine-learning/lightgbm-lab)：运行固定环境并验证重载一致。
8. [从 Python 调用追踪到一次分裂](/ai/machine-learning/lightgbm-source)：在固定版本源码中定位各步职责。

最后完成[第 1 章复习](/ai/machine-learning/review)，公式与参数查[速查页](/ai/machine-learning/tree-reference)。量化具体应用另行建设。

## 章节边界

| 章 | 核心问题 | 不在本章解决 |
| --- | --- | --- |
| 0 | 数字如何表示对象、参与计算并被优化 | 特定网络为何适合特定任务 |
| 1 | 树与提升模型怎样学习，以及什么证据说明泛化有效 | 深层网络内部怎样学习表示 |
| 2 | 多层可微变换怎样形成表示 | token 间全局通信的具体机制 |
| 3 | 序列位置怎样选择并汇总其他位置 | 大规模数据治理与产品可靠性 |
| 4 | 预训练目标怎样形成可复用生成能力 | 训练流水线的具体治理 |
| 5 | 数据、目标和系统怎样塑造模型行为 | 线上系统的全部安全控制 |
| 6 | 怎样运行、测量并限制系统 | 具体 Agent 编排框架 |
| 7 | 怎样组合模型、检索、工具和状态 | 把框架 API 当成模型能力 |

## 建设看板

| 状态 | 页面范围 | 含义 |
| --- | --- | --- |
| `verified` | 本地图、规范页 | 结构和链接已校验 |
| `learnable` | 第 0–7 章核心单元 | 概念/模拟可学习；实现能力需完成 tiny Transformer 与迁移题 |
| `draft` | MiniMind 案例与后续专题 | 可导航且边界明确，仍缺完整学习闭环 |

下一轮优先把第 0–7 章知识应用到 MiniMind 案例，并补充强化学习、推荐与时间序列专题；专题不得破坏当前唯一主路径。

## 资料的角色

- [Dive into Deep Learning](https://github.com/d2l-ai/d2l-en)：数学、网络、优化与 attention 的教材参照。
- [Hugging Face Course](https://github.com/huggingface/course)：tokenizer、模型与生态实践参照。
- [Microsoft ML for Beginners](https://github.com/microsoft/ML-For-Beginners)：以课程目标、练习和测验构成闭环的参照。
- [MiniMind](https://github.com/jingyaogong/minimind)：小型 Decoder LLM 的工程案例，不作为本站目录模板。

引用开放资料时必须区分：来源事实、本站推导、实验观察和个人判断。
