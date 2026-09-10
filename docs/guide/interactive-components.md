---
title: 交互式知识组件
date: 2026-09-02
article: false
updated: 2026-09-09
type: reference
status: draft
track: guide
categories:
  - 关于本站
tags:
  - 交互组件
  - 可视化
description: 博客内置的数学公式、图表、模型计算动画、音乐练习、摄影对照和其他可视化能力及代码架构。
---

# 交互式知识组件

这些组件服务于知识解释，而不是页面装饰。所有重量级引擎均采用异步加载；演示滚动到视口附近时会自动下载，无需手动点击，也不会在首屏一次装载全部引擎。

| 能力 | 开源实现 | 适合内容 |
| --- | --- | --- |
| 数学公式 | MathJax / VitePress | 推导、损失函数、复杂度 |
| 文本图表 | Mermaid | 流程图、时序图、架构图 |
| 数据图表 | Apache ECharts | 训练曲线、指标、实验对比 |
| 自定义 SVG | D3 | 树、图、知识结构和数据绑定 |
| 代码编辑 | CodeMirror 6 | 可编辑代码、语法高亮 |
| 问答与复习 | Vue + localStorage | 判断、单选、填空、开放题、自评与补学 |
| Canvas | 原生 Canvas / Konva + Vue Konva | 矩阵运算、模型层和高频二维动画 |
| 小动画 | Motion for Vue | 状态变化、步骤和手势反馈 |
| 状态图 | Vue Flow | Agent、分布式系统和工作流 |
| 数字波形 | WaveDrom | UART、SPI、I²C 和数字逻辑 |
| 三维场景 | Three.js + TresJS | 机器人、坐标系和空间算法 |
| 音乐听辨 | Tone.js + Tonal | 音高、和弦、节奏和移调练习 |
| 图片对照与引导观察 | img-comparison-slider + Canvas | 摄影版本比较、区域标注、影调观察和参考复盘 |

## 数学公式

Markdown 可以直接书写行内公式 $O(n \log n)$ 和块级公式：

$$
\operatorname{Attention}(Q,K,V)
= \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

## Mermaid 图

<LazyDemo title="Mermaid 流程图">
  <ClientOnly>
    <MermaidDiagram />
  </ClientOnly>
</LazyDemo>

## ECharts 数据图

<LazyDemo title="ECharts 训练曲线">
  <ClientOnly>
    <InteractiveChart />
  </ClientOnly>
</LazyDemo>

## D3 知识树

<LazyDemo title="D3 知识树">
  <ClientOnly>
    <D3Tree />
  </ClientOnly>
</LazyDemo>

## CodeMirror 编辑器

<LazyDemo title="CodeMirror 编辑器">
  <ClientOnly>
    <CodeEditor
      language="python"
      :model-value="`def attention(q, k, v):\n    scores = q @ k.T\n    return softmax(scores) @ v`"
      label="算法代码示例"
    />
  </ClientOnly>
</LazyDemo>

需要执行 Python 时，继续使用集成 CodeMirror 和 Pyodide 的完整组件：

<LazyDemo title="浏览器 Python" description="编辑器滚动到附近时，Pyodide 与默认机器学习依赖会在后台异步加载。">
  <ClientOnly>
    <PythonPlayground title="可运行的 Python 示例" />
  </ClientOnly>
</LazyDemo>

## 问答与复习

`KnowledgeQuiz` 用于 `review` 页面。答案默认不渲染；学习者提交回答或选择“暂时不会”后，组件才显示参考答案、解释、评分要点和补学链接。进度只写入当前浏览器的 `localStorage`，不会上传。

```vue
<KnowledgeQuiz
  storage-key="chapter-review-v1"
  :questions="[
    {
      id: 'shape-1',
      type: 'boolean',
      prompt: 'reshape 会重新计算张量中的数值。',
      answer: false,
      explanation: 'reshape 只改变元素的分组方式。',
      remediation: '/ai/foundations/tensor-shapes'
    }
  ]"
/>
```

题型为 `boolean`、`single`、`fill`、`open`。填空题的 `answer` 可以是等价答案数组；开放题使用 `rubric` 和 `reference` 引导自评，不做伪精确的自动判分。修改题目或答案语义后应递增 `storage-key` 版本，避免旧作答状态错误复用。

## 模型计算可视化的代码架构

矩阵乘法、MLP、卷积、注意力、归一化和残差层会反复使用矩阵、箭头、阶段控制和行列高亮，但每一课的学习问题并不相同。代码复用应停在稳定的“计算与绘制原语”，不能把所有课程塞进一个充满条件分支的万能组件。

### 分层边界

| 层 | 负责 | 不负责 |
| --- | --- | --- |
| 数学事实层 | 输入、参数、shape、精确计算和预期结果 | 颜色、坐标、动画时长 |
| 场景层 | 学习问题、对象布局、阶段顺序、每步高亮与说明 | Canvas 生命周期和通用控件 |
| 渲染原语层 | 矩阵格、轴、箭头、运算符、路径与高 DPI 绘制 | 决定课程讲解顺序 |
| 播放器层 | 上一步、下一步、播放、暂停、重置、减少动态效果 | 修改数学事实 |
| 页面包装层 | 标题、正文衔接、静态回退和页面专属交互 | 重复实现通用绘制 |

新增或重构时按以下目标目录组织：

~~~text
docs/.vitepress/theme/
├── components/interactive/
│   ├── model-visualization/
│   │   ├── ModelVisualizationShell.vue
│   │   ├── MatrixCanvas.vue
│   │   └── StageTimeline.vue
│   ├── QkvRetrievalDemo.vue
│   └── ...
└── visualizations/model/
    ├── contracts.ts
    ├── matrix-math.ts
    ├── canvas-runtime.ts
    ├── palette.ts
    ├── use-stage-player.ts
    └── scenes/
        ├── qkv-retrieval.ts
        ├── dense-layer.ts
        └── ...
~~~

页面专属的 <code>*Demo.vue</code> 应当是薄包装：导入一个场景，连接少量页面参数，再交给公共壳层渲染。只有点阵编辑、拖拽建图等确实超出矩阵流水线的交互，才保留专属渲染器；它们仍应复用播放器、主题和无障碍契约。

### 场景契约

场景是静态、可测试的数据，不直接持有 DOM 或 Canvas context。建议最小契约如下：

~~~ts
type ModelScene = {
  id: string
  title: string
  question: string
  viewport: { width: number; height: number }
  tensors: TensorSpec[]
  operations: OperationSpec[]
  stages: StageSpec[]
  facts: {
    inputs: Record<string, number[][]>
    outputs: Record<string, number[][]>
    precision: number
  }
}

type StageSpec = {
  id: string
  label: string
  title: string
  formula: string
  explanation: string
  active: string[]
  highlights?: {
    tensor: string
    row?: number
    column?: number
    cell?: [number, number]
  }[]
}
~~~

这不是要求把任何动画都声明式化。契约只覆盖反复出现的稳定字段；特殊动画可以增加局部绘制回调，但数学事实、阶段说明和静态结果仍要留在可测试数据中。

### 单一数值事实来源

- 输入、参数和结果必须从数学事实层导出，不能在正文、组件和测试里分别手抄三份；
- 可推导结果应由纯函数计算，例如 <code>matmul</code>、<code>transpose</code>、<code>softmaxRows</code> 和 <code>applyCausalMask</code>；
- 场景只决定展示精度，内部计算不得先截断再进入下一步；
- 正文需要的数值表应从同一 fixture 生成，或由自动检查与场景结果逐项比较；
- 教学简化必须显式建模，例如 <code>useScale: false</code>，不能通过偷偷换数字实现；
- 随机示例必须固定种子，并提供重置到基线的路径。
- 可编辑矩阵使用语义化 DOM 输入框，不在 Canvas 内模拟文本框；编辑源输入或参数后调用同一组纯函数重算结果。
- 播放中开始编辑时应暂停播放器；空值、非数字和超出范围的输入不能污染当前有效计算状态。

### 渲染器选择

| 需求 | 默认实现 | 原因 |
| --- | --- | --- |
| 固定布局、几十个格子、连续重绘 | 原生 Canvas | 依赖少，绘制路径短，适合矩阵扫描 |
| 节点拖拽、命中检测、复杂场景树 | Konva | 内建节点模型和事件系统 |
| 需要选择、复制或被辅助技术逐项读取 | DOM 表格 / SVG | 原生语义优于 Canvas |
| 网络拓扑、依赖路径、少量节点动画 | SVG / Vue Flow | 连线与节点关系更容易维护 |
| 指标、分布和坐标轴数据 | ECharts | 不重复实现图表系统 |

Canvas 不是“更高级”的默认选项。选择依据是认知任务、更新频率和语义需求，而不是视觉效果。

### 公共运行时

公共运行时至少统一以下能力：

- 逻辑坐标与 CSS 尺寸分离，并按 <code>devicePixelRatio</code> 生成清晰画布；
- 亮暗主题语义色，而不是各组件散落十六进制颜色；
- 阶段播放器的 <code>go / play / pause / reset</code> 状态机；
- <code>requestAnimationFrame</code> 的启动、暂停和卸载清理；
- 页面隐藏、组件离开视口或减少动态效果时停止非必要重绘；
- 键盘操作、焦点样式、动态 <code>aria-label</code> 与静态回退；
- 响应式布局测量和最小可读尺寸判断。

播放器与 Canvas 渲染必须解耦。点击阶段按钮更新语义状态；渲染器只是把当前状态画出来。这样同一场景才能在静态截图、减少动态效果和未来的测试工具中复用。

### 直接操作

- 数值矩阵优先在原图矩阵格中叠加原生 <code>input[type=number]</code>，坐标跟随逻辑画布缩放；
- DOM 输入框负责键盘、焦点、校验和输入法，Canvas 只绘制标签、关系与派生结果；
- 可编辑对象使用输入或参数语义，派生对象保持只读；
- 同源对象的多个视图绑定同一响应式状态，不复制数值；
- 恢复基线放在标题或图形工具区，“回到开头”只重置播放阶段，两者职责分开；
- 不在底部追加独立参数面板，除非原位编辑无法支持批量输入或高维数据；
- 不显示与正文、阶段说明完全重复的静态路径；保留视觉隐藏的等价说明供辅助技术读取。

### 命名与注册

- 公共原语按能力命名，例如 <code>MatrixCanvas</code>、<code>StageTimeline</code>；
- 页面动画按学习问题命名，例如 <code>QkvRetrievalDemo</code>，不用 <code>CoolAnimation2</code>；
- 全局主题只异步注册 Markdown 需要直接使用的页面组件，不注册内部原语；
- 一个场景被三处以上使用时转入 <code>scenes/</code>，页面通过薄包装选择展示范围；
- 场景 ID、测试 fixture 和文档锚点应稳定，视觉标题可以迭代。

### 验证门禁

模型计算动画至少检查：

1. 纯函数数值结果与文档预期一致；
2. 每个阶段 ID 唯一，并有标签、公式和解释；
3. Canvas 具有可访问名称和静态回退；
4. 有连续动画时处理 <code>prefers-reduced-motion</code>；
5. 播放结束、重置和组件卸载后没有遗留计时器；
6. 亮暗主题、桌面与窄屏均无裁切；
7. 行列乘法阶段同时显示源行、源列和目标格；
8. 生产构建与内容契约检查通过。

当前迁移顺序为：先从 QKV、矩阵乘法和注意力流水线提取数学函数、播放器与矩阵绘制原语；再迁移 MLP、卷积和归一化。不要在原语尚未经过三个真实场景验证前设计庞大的可视化 DSL。

## Canvas 算法演示

<LazyDemo title="Konva 算法动画">
  <ClientOnly>
    <AlgorithmCanvas />
  </ClientOnly>
</LazyDemo>

## 小型步骤动画

<LazyDemo title="Motion 步骤动画">
  <ClientOnly>
    <MotionSequence />
  </ClientOnly>
</LazyDemo>

## Agent 与系统状态图

<LazyDemo title="Vue Flow 工作流">
  <ClientOnly>
    <FlowDiagram />
  </ClientOnly>
</LazyDemo>

## 嵌入式数字波形

<LazyDemo title="WaveDrom 数字波形">
  <ClientOnly>
    <WaveformDiagram />
  </ClientOnly>
</LazyDemo>

## 三维场景

<LazyDemo title="TresJS 三维场景">
  <ClientOnly>
    <ThreeScene />
  </ClientOnly>
</LazyDemo>

## 音乐听辨与练习

Tone.js 只在用户点击试听后启动浏览器音频，Tonal 提供音名、和弦与移调的确定性事实层。合成音用于听辨和练习提示，不代表本人已经完成真实演奏。

<LazyDemo title="音高与音程听辨">
  <ClientOnly>
    <MusicIntervalLab />
  </ClientOnly>
</LazyDemo>

<LazyDemo title="和弦、音程与吉他指板">
  <ClientOnly>
    <MusicHarmonyLab />
  </ClientOnly>
</LazyDemo>

<LazyDemo title="节拍与节奏型">
  <ClientOnly>
    <MusicRhythmLab />
  </ClientOnly>
</LazyDemo>

<LazyDemo title="旋律、和弦与拍点对齐">
  <ClientOnly>
    <MusicSongLab />
  </ClientOnly>
</LazyDemo>

<LazyDemo title="旋律移调与练习音域">
  <ClientOnly>
    <MusicTransposeLab />
  </ClientOnly>
</LazyDemo>

## 摄影影调与参考图板

摄影实验使用浏览器 Canvas 生成可复现的处理结果，并用 img-comparison-slider 做原图与版本对照。直方图只描述像素分布，不为构图、情绪或审美质量自动评分。

<LazyDemo title="影调、色彩与双版本比较">
  <ClientOnly>
    <PhotographyLab />
  </ClientOnly>
</LazyDemo>

<LazyDemo title="参考来源与实践想法图板">
  <ClientOnly>
    <PhotographyReferenceBoard />
  </ClientOnly>
</LazyDemo>

## 使用原则

- 公式和静态关系优先使用 MathJax 或 Mermaid。
- 训练数据和实验指标优先使用 ECharts。
- 需要自定义节点、数据绑定或精细 SVG 交互时使用 D3。
- 固定矩阵流水线优先使用原生 Canvas；需要拖拽、命中检测或复杂场景树时使用 Konva。
- 模型动画先遵循[知识文档体系规范中的矩阵动画契约](/guide/knowledge-documentation-standard#模型计算与矩阵动画)，再选择渲染器。
- 不要用 Canvas 替代可以访问、复制和检索的普通文本或表格。
- Agent、协议与分布式状态使用 Vue Flow，硬件时序使用 WaveDrom。
- 只有空间关系确实重要时才使用 Three.js，避免无意义的三维装饰。
- 每个交互组件都应提供正文解释，不能让动画成为唯一的信息载体。
- 问答组件必须保留打印版或无脚本题目；正误反馈不能只依赖颜色；开放题先填写再显示参考答案。
