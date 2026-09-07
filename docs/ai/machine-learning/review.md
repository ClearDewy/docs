---
title: 第 1 章复习与验收
date: 2026-09-04
updated: 2026-09-07
type: review
status: learnable
track: ai
prerequisites: [/ai/machine-learning/lightgbm-source]
outcomes: [审查实验设计, 手算切分与提升, 独立实现树模型, 解释 LightGBM 源码与产物]
estimated: 45 分钟
description: 通过实验审查、数值推导、实现变式和源码追踪验收树模型及泛化评估。
---

# 第 1 章复习与验收

## 覆盖范围

训练/验证/测试职责、泄漏、基线与指标；CART 切分、叶子均值与递归；GBDT 残差及累加；LightGBM 的二阶目标、直方图、叶子生长、早停、重载与源码路径。GOSS/EFB 不纳入本轮必修评分。

<KnowledgeQuiz
  storage-key="ai-machine-learning-review-v2"
  title="第 1 章交互自测"
  :questions="[
    { id: 'tree-split', type: 'single', prompt: 'x=[1,2,3,4]、y=[1,1,3,3]，平方误差下最优根阈值是多少？', options: ['1.5', '2.5', '3.5', '没有合法阈值'], answer: '2.5', explanation: '根 SSE=4，阈值 2.5 使左右 SSE 都为零。', remediation: '/ai/machine-learning/decision-tree' },
    { id: 'boost-target', type: 'boolean', prompt: '平方损失 GBDT 每轮都可以用最初的 y-F0 训练新树。', answer: false, explanation: '必须用当前整个模型的预测重算残差。', remediation: '/ai/machine-learning/gradient-boosting' },
    { id: 'tree-newton', type: 'single', prompt: 'G=2、H=2、lambda_l2=1，无 L1 和其他约束时，学习率缩放前的叶子值是？', options: ['2/3', '-2/3', '-1', '1'], answer: '-2/3', explanation: 'w=-G/(H+lambda)=-2/3。', remediation: '/ai/machine-learning/lightgbm-objective' },
    { id: 'tree-source', type: 'open', prompt: '解释四行算例为什么第一棵 LightGBM 树保存的叶子是 1.5 和 2.5，而不是 -1 和 1。', rubric: ['先算出残差修正树为 -1 和 1', '应用学习率 0.5 得到 -0.5 和 0.5', '指出第一棵树吸收初始常数 2', '说明预测时不能重复缩放或再加一次初始常数'], reference: '该实验路径先 Shrinkage，再吸收初始化偏置；保存树叶为 1.5 和 2.5。', remediation: '/ai/machine-learning/lightgbm-source' },
    { id: 'ml-boolean', type: 'boolean', prompt: '只要使用交叉验证，就能自动避免时间穿越和实体泄漏。', answer: false, explanation: '切分策略必须显式尊重时间、用户、设备等边界；普通随机交叉验证不会自动知道这些语义。', remediation: '/ai/machine-learning/problem-and-evaluation' },
    { id: 'ml-single', type: 'single', prompt: '正例只有 1%，全部预测为负例时 accuracy 是多少？', options: ['1%', '50%', '99%', '无法计算'], answer: '99%', explanation: '高 accuracy 可能完全没有识别正例，因此还要查看 recall、precision 和业务代价。', remediation: '/ai/machine-learning/problem-and-evaluation' },
    { id: 'ml-fill', type: 'fill', prompt: '用于选择模型和决策阈值的数据集叫什么？', answer: ['验证集', 'validation set', 'validation'], explanation: '训练集拟合参数，验证集选择模型和阈值，测试集用于最后的无偏估计。', remediation: '/ai/machine-learning/problem-and-evaluation' },
    { id: 'ml-leak', type: 'single', prompt: '预测交易是否欺诈时，哪个特征最明显地泄漏未来？', options: ['交易金额', '交易发生小时', '退款完成时间', '商户类别'], answer: '退款完成时间', explanation: '预测时退款尚未完成，该字段包含结果发生后的信息。', remediation: '/ai/machine-learning/problem-and-evaluation' },
    { id: 'ml-open', type: 'open', prompt: '为预测用户明天是否流失设计一个可信的数据划分与评测方案。', rubric: ['按时间切分，测试集晚于训练与验证数据', '同一用户不会以泄漏方式跨越边界', '包含简单基线和与业务决策相符的指标', '报告错误类型、数据范围与结论边界'], reference: '使用较早时间窗训练、较近时间窗验证、未来时间窗测试，并按用户处理重复事件；比较多数类或规则基线，结合排序、召回和联系成本分析逐类错误。', remediation: '/ai/machine-learning/problem-and-evaluation' }
  ]"
/>

<noscript>浏览器未启用 JavaScript，请使用下面的打印版题目与评分准则。</noscript>

## 不查资料回答

1. 为什么训练误差不是最终目标？
2. 哪些决策属于验证集，为什么不能反复看测试集？
3. 同一患者多次就诊记录为什么不能按行随机切分？
4. 正例只有 1% 时，99% accuracy 说明了什么？
5. 为什么要同时报告平均指标和错误类别？
6. 为什么回归树的叶子取均值？两个子节点的 MSE 为什么需要加权？
7. 负梯度为什么只有在平方损失下等于通常的数值残差？
8. 分箱与叶子优先分别回答什么问题？

::: details 打印版参考答案
1. 训练误差只度量见过的样本；未见数据表现才支持泛化判断。
2. 配置、阈值和早停轮数由验证数据选择；反复按测试结果修改会把测试用于选择。
3. 相关或重复记录可能让模型利用跨集合的信息关系；需要按实际预测任务设计时间和实体边界。
4. 永远猜负类也能达到 99%，没有证明能识别正类。
5. 平均分会掩盖少数群体或场景中的集中错误。
6. 平方误差对常数求导得到均值；按节点样本数加权才能还原整体误差。
7. 一般目标使用损失关于当前原始分数的负导数；平方损失的导数才给出 y-F。
8. 分箱减少数值候选的处理成本；叶子优先决定下一次分裂哪片叶子。

交互题的纸面答案：最优阈值 2.5；固定初始残差的说法错误；Newton 叶子值 -2/3；第一棵树吸收学习率缩放和初始常数。原有评估题：交叉验证不能自动防泄漏；全负预测 accuracy=99%；选择模型用验证集；退款完成时间泄漏未来。
:::

## 审查任务

某团队随机切分全部交易记录，加入“退款完成时间”特征预测欺诈，测试 accuracy 99.8%，没有基线，只报告总分。至少指出四个问题，并给出新的划分、基线、指标和错误分析方案。

## 评分准则

- 识别未来信息泄漏：2 分；识别同一用户/商户实体泄漏：2 分；
- 提出时间/实体分组切分：2 分；
- 提出多数类或规则基线：1 分；
- 使用 precision/recall、PR-AUC、业务代价和混淆矩阵：2 分；
- 陈述数据范围与未知结论：1 分。

至少 8 分为通过。泄漏相关失分时回看[问题与评测](/ai/machine-learning/problem-and-evaluation)；基线或误差分析不足时重做[实验](/ai/machine-learning/baseline-lab)。建议一周后换一个任务重写任务定义和评测方案。

## 树模型综合验收

不复制作者答案，使用 `X=[[1],[2],[3],[4]]`、`y=[1,1,3,3]` 完成：

1. 手算三个候选的 SSE，写出最优阈值和两个叶子值。
2. 初始预测 2、学习率 0.5、树深度 1，写出两轮残差和最终预测。
3. 固定第一轮梯度，取 L2=1，计算左右叶子的 G、H、输出与理论增益；注明与库内增益的关系。
4. 独立实现 CART 与平方损失 GBDT，验证全常量特征、重复值、第二列有效特征、改变标签、重新 fit 和第三轮提升。
5. 运行 LightGBM 实验，解释验证轮数、保存轮数和重载结果；在固定 tag 源码中指出梯度、叶子选择及学习率的位置。

::: details 答案与评分
每项 2 分，共 10 分。

1. 子 SSE 分别为 8/3、0、8/3；阈值 2.5，叶子 1 和 3。
2. 残差先是 [-1,-1,1,1]，再是 [-0.5,-0.5,0.5,0.5]；最终 [1.25,1.25,2.75,2.75]。
3. 左 G=2、H=2，右 G=-2、H=2；输出 -2/3、2/3，理论增益 4/3，库内尺度 8/3。
4. 必须有自己实现的代码和变式输出；仅运行作者脚本此项不得分。第三轮 MSE 为 0.015625，重新 fit 不应追加旧树。
5. 必须说明先按验证集选轮数，最后用测试集评估，重载按同样特征和轮数比较；源码对应 GetGradients、ArgMax(best_split_per_leaf_)、Shrinkage。

总分至少 8 分且第 4 项通过，才记为“已完成最小独立实现”。评估审查部分还需单独至少 8 分。运行现成脚本通过仅记为“已复现示例”。
:::

典型补学：符号反转回看[梯度提升](/ai/machine-learning/gradient-boosting)；增益差一倍回看[二阶目标](/ai/machine-learning/lightgbm-objective)；叶子值重复缩放回看[源码追踪](/ai/machine-learning/lightgbm-source)。

复习记录请填写：完成日期、评估审查得分、树模型得分、是否独立实现、尚未解释的输出。建议一周后更换标签再做一次，随后进入[第 2 章神经网络](/ai/deep-learning)。
