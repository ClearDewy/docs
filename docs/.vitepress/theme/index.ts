import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";
import { defineAsyncComponent } from "vue";
import Layout from "./Layout.vue";
import "./styles/custom.css";

const components = {
  PythonPlayground: () => import("./components/PythonPlayground.vue"),
  MermaidDiagram: () => import("./components/interactive/MermaidDiagram.vue"),
  InteractiveChart: () => import("./components/interactive/InteractiveChart.vue"),
  D3Tree: () => import("./components/interactive/D3Tree.vue"),
  CodeEditor: () => import("./components/interactive/CodeEditor.vue"),
  AlgorithmCanvas: () => import("./components/interactive/AlgorithmCanvas.vue"),
  AttentionShapeDemo: () => import("./components/interactive/AttentionShapeDemo.vue"),
  BackpropagationDemo: () => import("./components/interactive/BackpropagationDemo.vue"),
  MatrixMultiplicationDemo: () => import("./components/interactive/MatrixMultiplicationDemo.vue"),
  MlpDotMatrixDemo: () => import("./components/interactive/MlpDotMatrixDemo.vue"),
  QkvRetrievalDemo: () => import("./components/interactive/QkvRetrievalDemo.vue"),
  TransformerBlockDemo: () => import("./components/interactive/TransformerBlockDemo.vue"),
  NextTokenPredictionDemo: () => import("./components/interactive/NextTokenPredictionDemo.vue"),
  SamplingDemo: () => import("./components/interactive/SamplingDemo.vue"),
  LanguageModelLabPlayground: () => import("./components/interactive/LanguageModelLabPlayground.vue"),
  CausalMaskDemo: () => import("./components/interactive/CausalMaskDemo.vue"),
  LanguageModelArchitectureDemo: () => import("./components/interactive/LanguageModelArchitectureDemo.vue"),
  KvCacheDemo: () => import("./components/interactive/KvCacheDemo.vue"),
  ModelScaleCalculator: () => import("./components/interactive/ModelScaleCalculator.vue"),
  TrainingObjectiveDemo: () => import("./components/interactive/TrainingObjectiveDemo.vue"),
  TrainingEvidenceLabPlayground: () => import("./components/interactive/TrainingEvidenceLabPlayground.vue"),
  EvaluationEvidenceDemo: () => import("./components/interactive/EvaluationEvidenceDemo.vue"),
  EvaluationSafetyLabPlayground: () => import("./components/interactive/EvaluationSafetyLabPlayground.vue"),
  AgentLoopDemo: () => import("./components/interactive/AgentLoopDemo.vue"),
  AgentLoopLabPlayground: () => import("./components/interactive/AgentLoopLabPlayground.vue"),
  CircuitMeasurementDemo: () => import("./components/interactive/CircuitMeasurementDemo.vue"),
  SignalSamplingDemo: () => import("./components/interactive/SignalSamplingDemo.vue"),
  DigitalLogicDemo: () => import("./components/interactive/DigitalLogicDemo.vue"),
  McuStartupDemo: () => import("./components/interactive/McuStartupDemo.vue"),
  InterruptTimelineDemo: () => import("./components/interactive/InterruptTimelineDemo.vue"),
  RtosSchedulerDemo: () => import("./components/interactive/RtosSchedulerDemo.vue"),
  PowerBudgetDemo: () => import("./components/interactive/PowerBudgetDemo.vue"),
  FirmwareRecoveryDemo: () => import("./components/interactive/FirmwareRecoveryDemo.vue"),
  KnowledgeQuiz: () => import("./components/interactive/KnowledgeQuiz.vue"),
  MotionSequence: () => import("./components/interactive/MotionSequence.vue"),
  ThreeScene: () => import("./components/interactive/ThreeScene.vue"),
  FlowDiagram: () => import("./components/interactive/FlowDiagram.vue"),
  WaveformDiagram: () => import("./components/interactive/WaveformDiagram.vue"),
  MusicIntervalLab: () => import("./components/interactive/music/MusicIntervalLab.vue"),
  MusicHarmonyLab: () => import("./components/interactive/music/MusicHarmonyLab.vue"),
  MusicRhythmLab: () => import("./components/interactive/music/MusicRhythmLab.vue"),
  MusicSongLab: () => import("./components/interactive/music/MusicSongLab.vue"),
  MusicTransposeLab: () => import("./components/interactive/music/MusicTransposeLab.vue"),
  PhotographyLab: () => import("./components/interactive/photography/PhotographyLab.vue"),
  PhotographySeeingLesson: () => import("./components/interactive/photography/PhotographySeeingLesson.vue"),
  PhotographyToneLesson: () => import("./components/interactive/photography/PhotographyToneLesson.vue"),
  PhotographyReferenceBoard: () => import("./components/interactive/photography/PhotographyReferenceBoard.vue"),
  LazyDemo: () => import("./components/interactive/LazyDemo.vue"),
};

export default {
  extends: Teek,
  Layout,
  enhanceApp({ app }) {
    Object.entries(components).forEach(([name, loader]) => {
      app.component(name, defineAsyncComponent(loader));
    });
  },
};
