# Dewyx Docs

Dewyx 的个人学习知识库，使用 VitePress 1.6 与 VitePress Theme Teek 构建，发布到 <https://docs.dewyx.cn>。

这个博客写给作者自己。目标不是持续生产零散帖子，而是把学习、实验和工程经验沉淀为可以反复查阅、逐步连接、能够验证的系统知识。

> 本 README 是项目结构和内容边界的设计基准。后续维护、自动化工具和其他 Codex 会话应先遵循这里的约定，不应自行增加一级专栏或改变内容归属。

## 总体结构

站点保留四个一级知识专栏：三个通用模块学习专栏和一个自洽的应用专栏。

| 专栏 | 路径 | 核心范围 |
| --- | --- | --- |
| 智能算法 | `/ai/` | 传统算法与模型、深度学习、LLM、训练、推理、Agent、Harness、评测 |
| 系统工程 | `/systems/` | 编程语言、操作系统、网络、数据库、分布式系统、软件架构、DevOps、可靠性 |
| 嵌入式 | `/embedded/` | 电子基础、MCU/SoC、固件、RTOS、驱动、通信协议、PCB、机器人与边缘智能 |
| 量化研究 | `/quant/` | 市场与统计、点时数据、因子证据、样本外验证、预测、风险成本、组合、执行与生命周期 |

首页、文章清单、归档、分类、标签和关于页面属于浏览与管理入口，不是新的知识专栏。

首页采用 Teek 支持的 VitePress 原生 Hero + Features 布局，延续旧站“标题、标识和入口卡片”的知识门户结构，不展示普通文章流。导航栏使用作者头像作为站点图标，Hero 右侧知识轨道以作者头像为中心。桌面端导航将四个一级专栏放在左侧，将搜索、主题和外部链接放在右侧。更换主题前应优先通过 Teek 原生配置和少量样式解决，不为单一页面效果引入第二套主题。

主题增强面板默认使用“双宽度可调”布局、页面宽度 90%、正文宽度 95%、Element Plus 蓝色主色、关闭颜色扩散，并开启侧边聚光灯。Teek 1.6.2 的 `ep-primary` 选择器存在上游笔误，兼容样式保留在 `custom.css`；其文章目录组件在 SPA 路由切换时还可能访问尚未挂载的 marker，空引用保护保存在 `patches/vitepress-theme-teek+1.6.2.patch` 并由 `postinstall` 自动应用。升级主题时应分别验证并决定是否删除这些兼容处理。

### 智能算法

按“模型原理主线 + 智能系统生命周期”组织，不按热门模型或单个开源项目的目录堆放文章：

```text
模型计算与优化基础
  → 机器学习与泛化评估
  → 神经网络与表示学习
  → 序列、注意力与 Transformer
  → 基础模型与生成模型
  → 数据、训练与对齐
  → 推理、评测与安全
  → 检索、Agent 与智能系统
```

智能算法采用“章节导览 + 学习单元”的两级结构：稳定的章节 URL 负责范围、依赖和过关标准；lesson、lab、reference、case-study、review 分别承担教学、验证、查询、案例和验收。MiniMind 等项目位于实战层，用于验证多个章节中的概念，不作为知识目录。Harness 工程包含上下文管理、Tool Calling、Memory、RAG、状态机、工作流、多 Agent、权限与沙箱、人工审批、任务调度、Tracing 和 Evals。

### 系统工程

记录不依赖某个 AI 模型也能成立的通用计算机系统知识：

```text
语言与运行时
  → 操作系统与网络
  → 数据库、存储与后端服务
  → 分布式系统与软件架构
  → 云原生、交付与自动化
  → 性能、可靠性、安全与可观测性
```

### 嵌入式

从物理约束出发连接硬件、固件和完整设备：

```text
电子与数字电路
  → MCU、SoC 与处理器
  → 裸机程序、驱动与 RTOS
  → 通信协议与系统集成
  → PCB、调试与可靠性
  → 机器人与边缘智能
```

### 量化研究

量化研究是自洽的应用知识体系，不是智能算法或系统工程下的单个子主题：

```text
市场、收益与统计基础
  → 点时数据与研究总体
  → 因子、特征与研究证据
  → 样本外验证、预测与信心
  → 风险、成本、容量与组合
  → 执行、归因与策略生命周期
  → Nova 实践
```

专栏内可以按量化语境完整讲解所需的统计模型、机器学习、数据工程和平台实现；智能算法与系统工程继续维护这些技术的通用主线，跨专栏通过链接连接，不强制把一篇完整的量化文章拆散。

## 内容归属规则

一篇文章只选择一个主要归属，跨领域关系使用标签和链接表达，不复制多份正文。

- 模型训练、模型推理、Agent、RAG、Harness 和 AI 评测归入“智能算法”。
- 通用数据库、后端、分布式系统、基础设施和工程方法归入“系统工程”。
- 芯片、电路、固件、驱动、设备通信和实体设备归入“嵌入式”。
- 市场机制、点时数据、因子研究、回测验证、风险成本、组合、执行和归因归入“量化研究”。
- 量化专栏可以包含完成论述所需的模型与工程基础；当内容主要解决可迁移的通用算法或系统问题时，仍归入对应基础专栏。
- 端侧 AI 的模型方法归入“智能算法”，设备部署、功耗、驱动和硬件集成归入“嵌入式”，双方互相链接。
- Python、C++、Rust、Linux、Docker 等是技术标签或二级主题，不新增为一级专栏。
- 无法确定归属时，按文章要解决的主要问题决定，而不是按使用的编程语言决定。

## 读者与学习验收

默认读者具备数学与线性代数基础，不从基础算术开始。首次学习模型或硬件时，需要补齐对象来源、编程工具和完整操作路径：Python 环境归入系统工程；C/交叉编译与固定 Pico 实操归入 MCU 章节；tiny Transformer 串接 LLM 原理与项目案例。

概念自测、模拟实验、独立实现、真实硬件实测分别记录。目录中的 `learnable` 不能代替真实任务验收，未连接硬件的教程不得写成已完成板级实测。页面中可运行源码优先直接引用 `examples/`，CI 对相同实现运行基线与课程要求的变式，避免网页和测试各维护一份答案。

## 内容组织规则

- 详细的信息架构、内容类型、教学闭环、动画、成熟度和质量门禁以[知识文档体系规范](docs/guide/knowledge-documentation-standard.md)为准。
- 新内容应先在对应专栏的 `roadmap.md` 中找到位置；没有位置时先更新知识地图。
- `index.md` 说明专栏定位和边界，`roadmap.md` 维护长期知识结构，具体文章承载结论和实践。
- 智能算法保留稳定章节导览；当一个主题有独立问题、先修、目标和验收方式时，拆成可在一次连续学习中完成的学习单元，并由章节页串回主线。
- 优先补齐概念之间的连接、前置知识和验证方法，避免只生成孤立的“入门介绍”。
- 文章应尽量说明问题、结论、推导或验证方式、适用条件和失效边界。
- 事实观察、实验结果和个人判断应明确区分；环境相关结论注明版本与日期。
- 旧 VuePress 内容完整保存在 `graduate` 分支，除非作者明确要求，不自动迁回 `master`。

推荐的文章 frontmatter：

```yaml
---
title: 文章标题
date: YYYY-MM-DD
type: lesson # overview / lesson / lab / reference / case-study / review
status: draft # outline / draft / learnable / verified / stale
track: ai # systems / embedded / quant / guide
categories:
  - 智能算法 # 或：系统工程、嵌入式、量化研究
tags:
  - 具体技术标签
description: 一句话说明文章解决的问题。
---
```

`lesson`、`lab`、`review` 还必须声明 `prerequisites`、`outcomes` 和 `estimated`；完整含义与模板以规范页为准。

四个专栏总览和知识地图使用 `article: false`，避免作为普通文章进入首页信息流。

## 目录约定

```text
docs/
├── ai/                  # 智能算法
│   ├── index.md
│   ├── roadmap.md
│   ├── foundations.md   # 稳定章节导览 URL
│   ├── foundations/     # lesson / lab / reference / review
│   └── transformers/    # 其他章节按同样方式扩展
├── systems/             # 系统工程
│   ├── index.md
│   └── roadmap.md
├── embedded/            # 嵌入式
│   ├── index.md
│   └── roadmap.md
├── quant/               # 量化研究
│   ├── index.md
│   └── roadmap.md
├── guide/               # 知识库自身的使用说明
├── public/              # 静态资源
└── .vitepress/          # VitePress 与 Teek 配置
    └── theme/components/interactive/ # 可复用交互组件
examples/                # 可由 CI 执行的完整示例
```

当某个专栏内容增多时，可以在专栏内按知识地图增加二级目录，但 URL 应保持语义清晰，避免按日期或临时项目名建立长期目录。

## 量化专栏与 Nova

- `/Users/dewyxiang/project/nova` 是量化项目实现、当前状态和研究证据的权威来源；博客不是 Nova 的镜像或运行账本。
- 博客只提炼可长期复用的原理、方法和经过选择的案例，不通过子模块、软链接或构建脚本自动导入 Nova 文档。
- Nova 案例应注明来源文件、日期、代码身份、数据范围、证据阶段和不能据此声称的结论。
- 不发布密钥、账户信息、私有行情、机器路径或未经选择的原始报告；不把观察、回测和当前截面包装为预测、推荐或交易建议。
- Nova 的状态与结果可能持续变化。时效性事实应链接回其当前权威文件，而不是在博客维护第二份状态。

## 可运行示例

- `examples/` 中的脚本必须在 GitHub Actions 构建前执行。
- 关键示例应确定性运行，固定外部依赖，不依赖随机网络响应或私密凭据。
- 文章可以使用全局组件 `<PythonPlayground />` 在浏览器内运行轻量 Python 代码。
- Pyodide 只适合演示、标准库练习和轻量计算；系统服务、驱动、私有数据和长任务应使用仓库脚本或独立环境验证。
- 文章展示的输出应与仓库中被 CI 验证的脚本保持一致。

## 交互式知识组件

站点已经提供统一的开源可视化能力。新增文章应优先复用现有组件，不为同一用途重复引入另一套库。

| Vue 组件 | 开源实现 | 主要用途 |
| --- | --- | --- |
| `MermaidDiagram` | Mermaid | 流程图、时序图、状态图、架构图 |
| `InteractiveChart` | Apache ECharts + Vue ECharts | 训练曲线、实验指标和数据对比 |
| `D3Tree` | D3 | 自定义树、图和数据驱动 SVG |
| `CodeEditor` | CodeMirror 6 | 可编辑代码与语法高亮 |
| `PythonPlayground` | CodeMirror 6 + Pyodide | 浏览器内运行轻量 Python |
| `AlgorithmCanvas` | Konva + Vue Konva | 需要场景节点与命中检测的二维动画 |
| `MotionSequence` | Motion for Vue | 状态变化、步骤和轻量交互动画 |
| `MatrixMultiplicationDemo` | Vue | 行列乘加的逐项教学演示 |
| `AttentionShapeDemo` | Motion for Vue | 投影、拆头、转置的 shape 演示 |
| `AttentionPipelineDemo` | Vue | QKᵀ、缩放、mask、softmax、加权读取 |
| `QkvRetrievalDemo` | 原生 Canvas | 固定矩阵位置的 QKV 投影与注意力读取 |
| `KnowledgeQuiz` | Vue + localStorage | 判断、单选、填空、开放题与本地复习进度 |
| `FlowDiagram` | Vue Flow | Agent Harness、协议和分布式工作流 |
| `WaveformDiagram` | WaveDrom | 数字逻辑与嵌入式通信时序 |
| `ThreeScene` | Three.js + TresJS | 三维结构、机器人和空间算法 |

Markdown 数学公式使用 VitePress 的 MathJax 支持。组件实例和效果集中在 `docs/guide/interactive-components.md`。

使用约束：

- 交互组件已在主题中异步注册，不要改成全量同步导入。
- 汇总演示页使用 `LazyDemo` 在组件接近视口时自动异步装载，不能改回同页首屏同时挂载所有重量级引擎。
- 在 Markdown 中使用浏览器交互组件时包裹 `<ClientOnly>`。
- 公式和静态关系优先用 MathJax 或 Mermaid，普通统计图优先用 ECharts。
- D3 用于需要自定义数据绑定的 SVG；固定矩阵流水线优先使用原生 Canvas，需要命中检测或复杂场景树时使用 Konva。
- 模型层、矩阵和张量动画必须遵循知识文档体系规范中的“模型计算与矩阵动画”契约；代码分层与复用规则见交互组件指南。
- Agent 和系统状态图优先用 Vue Flow，硬件数字时序优先用 WaveDrom。
- Three.js 只用于空间关系确实影响理解的内容。
- 动画必须尊重 `prefers-reduced-motion`，并提供文字解释或静态回退，不能成为唯一信息来源。
- 传给 Mermaid、WaveDrom 或图表组件的定义应来自仓库内可信内容，不渲染访客提交的任意文本。

## 修改导航时

任何结构调整都应同时检查：

1. `docs/.vitepress/config.ts` 中的导航和侧边栏；
2. 对应专栏的 `index.md` 与 `roadmap.md`；
3. 首页、文章分类和已有内部链接；
4. 本 README 的总体设计；
5. 旧 URL 是否需要保留迁移提示。

不要仅修改菜单名称而不更新内容边界，也不要只创建文章文件而不把它接入知识地图。

路由保持以下约束：

- 一级专栏使用 VitePress 原生目录地址 `/ai/`、`/systems/`、`/embedded/`、`/quant/`，链接保留末尾斜杠。
- 不在 frontmatter 中增加与文件原生路径等价的 `permalink`。
- `vitePlugins.permalink` 与 `vitePlugins.sidebar` 保持关闭；前者会在 SPA 路由钩子中产生嵌套跳转，后者会覆盖手写侧边栏。
- 专栏侧边栏只在 `docs/.vitepress/config.ts` 维护，避免自动配置与手写配置并存。

## 本地开发

```bash
npm ci
npm run docs:dev
```

发布前验证：

```bash
npm run check:python
npm run check:content
npm run check:learning
npm run check:tiny # 自动选择本机依赖组，计算固定 CPU
npm run docs:build
npm run docs:preview
```

日常写作和新增文章始终使用 `npm run docs:dev`。`docs:preview` 只读取启动时已有的生产构建快照；如果它运行期间再次执行 `docs:build`，必须停止并重新启动预览进程，否则旧路由表和新 `dist` 会混在一起，表现为文章列表刷新后才出现或新文章 404。

`docs/.vitepress/dist` 已从开发服务器监听范围中排除，因此开发服务运行时执行生产构建不会触发构建产物的 HMR 风暴。检查最终构建时应先完成 `docs:build`，再启动一次全新的 `docs:preview`，验证结束后回到 `docs:dev`。

GitHub Actions 从 `master` 构建并发布站点。GitHub Pages 的 Source 必须保持为 **GitHub Actions**，不能切换回 `gh-pages` 分支发布。
