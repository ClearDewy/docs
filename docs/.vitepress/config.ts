import { defineConfig } from "vitepress";
import { templateCompilerOptions } from "@tresjs/core";
import { fileURLToPath, URL } from "node:url";
import { teekConfig } from "./teek-config";

const siteUrl = "https://docs.dewyx.cn";
const description = "围绕智能算法、系统工程、嵌入式与量化研究持续整理的个人知识库。";
const avatarUrl = "https://avatars.githubusercontent.com/u/93588007?s=512&v=4";

export default defineConfig({
  extends: teekConfig,
  title: "Dewyx Docs",
  titleTemplate: ":title · Dewyx Docs",
  description,
  lang: "zh-CN",
  cleanUrls: true,
  lastUpdated: true,
  vue: {
    ...templateCompilerOptions,
  },
  head: [
    ["link", { rel: "icon", type: "image/jpeg", href: avatarUrl }],
    ["link", { rel: "apple-touch-icon", href: avatarUrl }],
    ["meta", { name: "author", content: "Dewyx" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:locale", content: "zh-CN" }],
    ["meta", { property: "og:site_name", content: "Dewyx Docs" }],
    ["meta", { property: "og:image", content: avatarUrl }],
    ["meta", { property: "og:url", content: siteUrl }],
    ["meta", { property: "og:description", content: description }],
  ],
  markdown: {
    math: true,
    lineNumbers: true,
    image: { lazyLoading: true },
    container: {
      tipLabel: "提示",
      warningLabel: "注意",
      dangerLabel: "危险",
      infoLabel: "信息",
      detailsLabel: "详细信息",
    },
  },
  sitemap: { hostname: siteUrl },
  vite: {
    server: {
      watch: {
        // 允许开发服务运行时执行生产构建，避免 dist 变化触发数千次 HMR。
        ignored: ["**/.vitepress/dist/**"],
      },
    },
    optimizeDeps: {
      // 重型演示库仅在文章实际使用时转换，避免开发服务器启动时一次性预构建。
      exclude: [
        "@codemirror/lang-javascript",
        "@codemirror/lang-python",
        "@codemirror/theme-one-dark",
        "@tresjs/core",
        "@vue-flow/core",
        "codemirror",
        "d3",
        "echarts",
        "konva",
        "motion-v",
        "three",
        "vue-echarts",
        "vue-konva",
        "wavedrom",
      ],
    },
    resolve: {
      alias: {
        "@wavedrom/render-any": fileURLToPath(
          new URL("../../node_modules/wavedrom/lib/render-any.js", import.meta.url),
        ),
      },
    },
  },
  themeConfig: {
    logo: avatarUrl,
    nav: [
      { text: "智能算法", link: "/ai/" },
      { text: "系统工程", link: "/systems/" },
      { text: "嵌入式", link: "/embedded/" },
      { text: "量化研究", link: "/quant/" },
      {
        text: "索引",
        items: [
          { text: "文章清单", link: "/article-overview" },
          { text: "归档", link: "/archives" },
          { text: "分类", link: "/categories" },
          { text: "标签", link: "/tags" },
        ],
      },
      {
        text: "更多",
        items: [
          { text: "使用指南", link: "/guide/start" },
          { text: "交互组件", link: "/guide/interactive-components" },
          { text: "关于", link: "/about" },
        ],
      },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "知识库",
          items: [
            { text: "使用这个知识库", link: "/guide/start" },
            { text: "知识文档体系规范", link: "/guide/knowledge-documentation-standard" },
            { text: "交互组件", link: "/guide/interactive-components" },
          ],
        },
      ],
      "/ai/": [
        {
          text: "智能算法",
          items: [
            { text: "专栏总览", link: "/ai/" },
            { text: "知识地图", link: "/ai/roadmap" },
          ],
        },
        {
          text: "0. 模型计算与优化基础",
          link: "/ai/foundations",
          collapsed: true,
          items: [
            { text: "矩阵乘法", link: "/ai/foundations/matrix-multiplication" },
            { text: "张量的轴与形状", link: "/ai/foundations/tensor-shapes" },
            { text: "最小优化循环", link: "/ai/foundations/optimization-loop" },
            { text: "基础计算实验", link: "/ai/foundations/lab" },
            { text: "符号与 shape 速查", link: "/ai/foundations/reference" },
            { text: "复习与验收", link: "/ai/foundations/review" },
          ],
        },
        {
          text: "1. 机器学习、树模型与泛化评估",
          link: "/ai/machine-learning",
          collapsed: true,
          items: [
            { text: "模型真的学会了吗", link: "/ai/machine-learning/problem-and-evaluation" },
            { text: "基线实验", link: "/ai/machine-learning/baseline-lab" },
            { text: "决策树如何从数据中学出规则", link: "/ai/machine-learning/decision-tree" },
            { text: "从零实现 CART 回归树", link: "/ai/machine-learning/cart-lab" },
            { text: "梯度提升为什么逐轮拟合修正量", link: "/ai/machine-learning/gradient-boosting" },
            { text: "从零实现平方损失 GBDT", link: "/ai/machine-learning/gbdt-lab" },
            { text: "LightGBM 如何计算叶子值与分裂增益", link: "/ai/machine-learning/lightgbm-objective" },
            { text: "LightGBM 如何用直方图生长一棵树", link: "/ai/machine-learning/lightgbm-tree-learning" },
            { text: "训练、早停与重载一个 LightGBM 模型", link: "/ai/machine-learning/lightgbm-lab" },
            { text: "从 Python 调用追踪到一次分裂", link: "/ai/machine-learning/lightgbm-source" },
            { text: "树模型与 LightGBM 速查", link: "/ai/machine-learning/tree-reference" },
            { text: "复习与验收", link: "/ai/machine-learning/review" },
          ],
        },
        {
          text: "2. 神经网络",
          link: "/ai/deep-learning",
          collapsed: true,
          items: [
            { text: "MLP 与表示", link: "/ai/deep-learning/mlp-representation" },
            { text: "反向传播", link: "/ai/deep-learning/backpropagation" },
            { text: "MLP 实验", link: "/ai/deep-learning/mlp-lab" },
            { text: "复习与验收", link: "/ai/deep-learning/review" },
          ],
        },
        {
          text: "3. Transformer",
          link: "/ai/transformers",
          collapsed: true,
          items: [
            { text: "QKV 检索", link: "/ai/transformers/qkv-retrieval" },
            { text: "注意力流水线", link: "/ai/transformers/attention-pipeline" },
            { text: "单头注意力实验", link: "/ai/transformers/attention-lab" },
            { text: "多头 shape", link: "/ai/transformers/multi-head-shapes" },
            { text: "Decoder Block", link: "/ai/transformers/decoder-block" },
            { text: "注意力速查", link: "/ai/transformers/reference" },
            { text: "复习与验收", link: "/ai/transformers/review" },
          ],
        },
        {
          text: "4. 基础模型与生成",
          link: "/ai/foundation-models",
          collapsed: true,
          items: [
            { text: "文本与训练样本", link: "/ai/foundation-models/tokenization-and-samples" },
            { text: "批次与因果遮罩", link: "/ai/foundation-models/data-batches-and-causal-mask" },
            { text: "完整语言模型结构", link: "/ai/foundation-models/language-model-architecture" },
            { text: "Next-token 前向", link: "/ai/foundation-models/next-token-prediction" },
            { text: "语言模型训练循环", link: "/ai/foundation-models/training-loop" },
            { text: "参数、显存与计算", link: "/ai/foundation-models/parameters-memory-compute" },
            { text: "训练与生成", link: "/ai/foundation-models/training-vs-generation" },
            { text: "Prefill 与 KV Cache", link: "/ai/foundation-models/prefill-kv-cache" },
            { text: "采样策略", link: "/ai/foundation-models/sampling" },
            { text: "最小语言模型实验", link: "/ai/foundation-models/language-model-lab" },
            { text: "tiny Transformer 实操", link: "/ai/foundation-models/tiny-transformer-lab" },
            { text: "BERT、T5 与 GPT", link: "/ai/foundation-models/model-families" },
            { text: "Scaling 与 MoE", link: "/ai/foundation-models/scaling-and-moe" },
            { text: "多模态与扩散", link: "/ai/foundation-models/multimodal-and-diffusion" },
            { text: "能力来源与边界", link: "/ai/foundation-models/capability-boundaries" },
            { text: "基础模型速查", link: "/ai/foundation-models/reference" },
            { text: "复习与验收", link: "/ai/foundation-models/review" },
          ],
        },
        {
          text: "5. 数据、训练与对齐",
          link: "/ai/data-training-alignment",
          collapsed: true,
          items: [
            { text: "数据谱系与切分", link: "/ai/data-training-alignment/data-lineage-and-splits" },
            { text: "预训练证据", link: "/ai/data-training-alignment/pretraining-evidence" },
            { text: "SFT 与 Chat Template", link: "/ai/data-training-alignment/sft-and-chat-template" },
            { text: "LoRA 适配", link: "/ai/data-training-alignment/lora-adaptation" },
            { text: "偏好数据与 DPO", link: "/ai/data-training-alignment/preference-alignment" },
            { text: "训练审计实验", link: "/ai/data-training-alignment/training-evidence-lab" },
            { text: "训练与对齐速查", link: "/ai/data-training-alignment/reference" },
            { text: "复习与验收", link: "/ai/data-training-alignment/review" },
          ],
        },
        {
          text: "6. 推理、评测与安全",
          link: "/ai/inference-evaluation-safety",
          collapsed: true,
          items: [
            { text: "推理服务请求", link: "/ai/inference-evaluation-safety/inference-serving" },
            { text: "性能指标", link: "/ai/inference-evaluation-safety/performance-metrics" },
            { text: "可信评测设计", link: "/ai/inference-evaluation-safety/evaluation-design" },
            { text: "错误分类与归因", link: "/ai/inference-evaluation-safety/error-analysis" },
            { text: "模型外安全控制", link: "/ai/inference-evaluation-safety/safety-controls" },
            { text: "评测与安全实验", link: "/ai/inference-evaluation-safety/evaluation-safety-lab" },
            { text: "推理与评测速查", link: "/ai/inference-evaluation-safety/reference" },
            { text: "复习与验收", link: "/ai/inference-evaluation-safety/review" },
          ],
        },
        {
          text: "7. 检索、Agent 与系统",
          link: "/ai/agents-and-systems",
          collapsed: true,
          items: [
            { text: "RAG 证据链", link: "/ai/agents-and-systems/rag-pipeline" },
            { text: "检索与回答评测", link: "/ai/agents-and-systems/retrieval-evaluation" },
            { text: "工具调用协议", link: "/ai/agents-and-systems/tool-protocol" },
            { text: "Agent 状态机", link: "/ai/agents-and-systems/agent-state-machine" },
            { text: "上下文与记忆", link: "/ai/agents-and-systems/memory-and-context" },
            { text: "可靠性与多 Agent", link: "/ai/agents-and-systems/reliability-and-multi-agent" },
            { text: "Agent 状态机实验", link: "/ai/agents-and-systems/agent-loop-lab" },
            { text: "系统速查", link: "/ai/agents-and-systems/reference" },
            { text: "复习与验收", link: "/ai/agents-and-systems/review" },
          ],
        },
        {
          text: "项目实战",
          items: [
            { text: "MiniMind 全链路实践", link: "/ai/minimind-practice" },
          ],
        },
      ],
      "/systems/": [
        {
          text: "系统工程",
          items: [
            { text: "专栏总览", link: "/systems/" },
            { text: "知识地图", link: "/systems/roadmap" },
          ],
        },
        {
          text: "工程方法",
          items: [
            { text: "在浏览器运行 Python", link: "/systems/browser-python" },
            { text: "本地 Python 项目准备", link: "/systems/python-project-workflow" },
            { text: "可复现的代码示例", link: "/systems/reproducible-examples" },
          ],
        },
      ],
      "/embedded/": [
        {
          text: "嵌入式",
          items: [
            { text: "专栏总览", link: "/embedded/" },
            { text: "知识地图", link: "/embedded/roadmap" },
          ],
        },
        {
          text: "0. 电、信号与测量",
          link: "/embedded/electronics-foundations",
          collapsed: false,
          items: [
            { text: "电压、电流与参考地", link: "/embedded/electronics-foundations/voltage-current-and-ground" },
            { text: "电阻、功率与发热", link: "/embedded/electronics-foundations/resistance-power-and-heat" },
            { text: "模拟、数字与采样", link: "/embedded/electronics-foundations/analog-digital-and-sampling" },
            { text: "虚拟测量实验", link: "/embedded/electronics-foundations/measurement-lab" },
            { text: "电路与测量速查", link: "/embedded/electronics-foundations/reference" },
            { text: "复习与验收", link: "/embedded/electronics-foundations/review" },
          ],
        },
        {
          text: "1. 数字逻辑与计算机组成", link: "/embedded/digital-systems", collapsed: true,
          items: [
            { text: "比特与组合逻辑", link: "/embedded/digital-systems/bits-and-combinational-logic" },
            { text: "状态、时钟与 CPU", link: "/embedded/digital-systems/state-clock-cpu-memory" },
            { text: "数字状态机实验", link: "/embedded/digital-systems/logic-state-lab" },
            { text: "速查", link: "/embedded/digital-systems/reference" },
            { text: "复习与验收", link: "/embedded/digital-systems/review" },
          ],
        },
        {
          text: "2. MCU、启动与裸机固件", link: "/embedded/mcu-bare-metal", collapsed: true,
          items: [
            { text: "C 与构建衔接", link: "/embedded/mcu-bare-metal/c-build-bridge" },
            { text: "资源地图与数据手册", link: "/embedded/mcu-bare-metal/mcu-map-and-datasheet" },
            { text: "启动、链接与 GPIO", link: "/embedded/mcu-bare-metal/startup-linking-and-gpio" },
            { text: "裸机固件实验", link: "/embedded/mcu-bare-metal/firmware-evidence-lab" },
            { text: "Pico 编译烧录与测量", link: "/embedded/mcu-bare-metal/pico-blink-lab" },
            { text: "速查", link: "/embedded/mcu-bare-metal/reference" },
            { text: "复习与验收", link: "/embedded/mcu-bare-metal/review" },
          ],
        },
        {
          text: "3. 外设、采样与串行通信", link: "/embedded/peripherals-and-buses", collapsed: true,
          items: [
            { text: "GPIO、Timer、PWM 与 ADC", link: "/embedded/peripherals-and-buses/gpio-timer-pwm-adc" },
            { text: "UART、I²C 与 SPI", link: "/embedded/peripherals-and-buses/uart-i2c-spi" },
            { text: "协议波形实验", link: "/embedded/peripherals-and-buses/protocol-waveform-lab" },
            { text: "速查", link: "/embedded/peripherals-and-buses/reference" },
            { text: "复习与验收", link: "/embedded/peripherals-and-buses/review" },
          ],
        },
        {
          text: "4. 中断、DMA 与实时性", link: "/embedded/interrupts-and-realtime", collapsed: true,
          items: [
            { text: "轮询、中断与优先级", link: "/embedded/interrupts-and-realtime/polling-interrupt-priority" },
            { text: "Timer、DMA 与截止期", link: "/embedded/interrupts-and-realtime/timer-dma-deadline" },
            { text: "中断与截止期实验", link: "/embedded/interrupts-and-realtime/interrupt-timing-lab" },
            { text: "速查", link: "/embedded/interrupts-and-realtime/reference" },
            { text: "复习与验收", link: "/embedded/interrupts-and-realtime/review" },
          ],
        },
        {
          text: "5. RTOS、并发与资源管理", link: "/embedded/rtos-concurrency", collapsed: true,
          items: [
            { text: "任务状态与调度器", link: "/embedded/rtos-concurrency/tasks-and-scheduler" },
            { text: "同步、通信与内存", link: "/embedded/rtos-concurrency/synchronization-memory" },
            { text: "RTOS 调度实验", link: "/embedded/rtos-concurrency/rtos-scheduling-lab" },
            { text: "速查", link: "/embedded/rtos-concurrency/reference" },
            { text: "复习与验收", link: "/embedded/rtos-concurrency/review" },
          ],
        },
        {
          text: "6. 原理图、PCB 与硬件边界", link: "/embedded/hardware-design", collapsed: true,
          items: [
            { text: "电源、复位与时钟", link: "/embedded/hardware-design/schematic-power-reset-clock" },
            { text: "接口、PCB、EMC 与热", link: "/embedded/hardware-design/interfaces-pcb-emc-thermal" },
            { text: "硬件设计审查实验", link: "/embedded/hardware-design/design-review-lab" },
            { text: "速查", link: "/embedded/hardware-design/reference" },
            { text: "复习与验收", link: "/embedded/hardware-design/review" },
          ],
        },
        {
          text: "7. 调试、升级与设备可靠性", link: "/embedded/device-reliability", collapsed: true,
          items: [
            { text: "Fault 与 Watchdog", link: "/embedded/device-reliability/observability-fault-watchdog" },
            { text: "升级、测试与量产", link: "/embedded/device-reliability/update-test-production" },
            { text: "故障恢复实验", link: "/embedded/device-reliability/fault-recovery-lab" },
            { text: "速查", link: "/embedded/device-reliability/reference" },
            { text: "全主线验收", link: "/embedded/device-reliability/review" },
          ],
        },
      ],
      "/quant/": [
        {
          text: "量化研究",
          items: [
            { text: "专栏总览", link: "/quant/" },
            { text: "知识地图", link: "/quant/roadmap" },
          ],
        },
      ],
    },
    outline: { level: [2, 4], label: "本页目录" },
    docFooter: { prev: "上一篇", next: "下一篇" },
    darkModeSwitchLabel: "主题",
    sidebarMenuLabel: "目录",
    returnToTopLabel: "返回顶部",
    lastUpdatedText: "最后更新",
    search: { provider: "local" },
    socialLinks: [{ icon: "github", link: "https://github.com/ClearDewy" }],
    editLink: {
      text: "在 GitHub 上编辑此页",
      pattern: "https://github.com/ClearDewy/docs/edit/master/docs/:path",
    },
  },
});
