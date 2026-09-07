<script setup lang="ts">
import { computed, reactive, toRefs } from "vue";
import { createScheduler, taskState, addSample as publish, nextTick, suspendProcessing } from "./rtos-model.mjs";
const model = reactive(createScheduler());
const { tick, samples, results, running, log, dropped } = toRefs(model);
const pauseProcessing = computed({ get: () => model.paused, set: (value) => suspendProcessing(model, value) });
const tasks = computed(() => [
  { name: "处理", priority: 3, state: taskState(model, "处理"), wait: "样本可读且结果队列有空间" },
  { name: "通信", priority: 2, state: taskState(model, "通信"), wait: "结果队列" },
  { name: "Idle", priority: 0, state: taskState(model, "Idle"), wait: "—" },
]);
function addSample() { publish(model); }
function next() { nextTick(model); }
function reset() { Object.assign(model, createScheduler()); }
</script>
<template>
  <section class="rtos-demo" aria-labelledby="rtos-title">
    <header><div><strong id="rtos-title">单核三任务调度器</strong><p>事件或挂起立即触发调度；下一 tick 让当前任务完成一个工作单元。</p></div><button type="button" @click="reset">重置</button></header>
    <div class="tasks"><div v-for="task in tasks" :key="task.name" class="task" :class="{running:task.name===running}"><b>{{ task.name }}</b><span>P{{ task.priority }}</span><strong>{{ task.state }}</strong><small>等待：{{ task.wait }}</small></div></div>
    <div class="queues"><span>样本队列 <b>{{ samples }} / 8</b></span><span>结果队列 <b>{{ results }} / 8</b></span><span>拒收样本 <b>{{ dropped }}</b></span><label><input v-model="pauseProcessing" type="checkbox"> 挂起处理任务</label></div>
    <div class="actions"><button type="button" @click="addSample">+ ADC 新样本</button><button type="button" class="primary" @click="next">下一 tick</button><b aria-live="polite">tick {{ tick }} · {{ running }} RUNNING</b></div>
    <ol><li v-for="(item, index) in log" :key="index">{{ item }}</li><li v-if="!log.length">操作后显示最近状态转移。</li></ol>
  </section>
</template>
<style scoped>
.rtos-demo{margin:1.2rem 0;border:1px solid var(--vp-c-divider);border-radius:16px;overflow:hidden;background:var(--vp-c-bg-soft)}header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.1rem;gap:1rem;border-bottom:1px solid var(--vp-c-divider)}header p{margin:.2rem 0 0;color:var(--vp-c-text-2);font-size:.85rem}button{border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg);color:var(--vp-c-text-1);padding:.4rem .7rem;cursor:pointer}.tasks{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;padding:1rem}.task{display:grid;grid-template-columns:1fr auto;gap:.35rem;padding:.8rem;border:2px solid var(--vp-c-divider);border-radius:11px;background:var(--vp-c-bg)}.task strong,.task small{grid-column:1/-1}.task strong{color:var(--vp-c-text-2)}.task.running{border-color:#49a55c;box-shadow:0 0 0 2px #49a55c22}.task.running strong{color:#308342}.queues,.actions{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;padding:.8rem 1rem;border-top:1px solid var(--vp-c-divider);background:var(--vp-c-bg)}.primary{background:#3f424a;color:white}.actions b{margin-left:auto}ol{margin:0;padding:.8rem 1rem .8rem 2.5rem;color:var(--vp-c-text-2);font: .82rem/1.5 ui-monospace,monospace}@media(max-width:650px){.tasks{grid-template-columns:1fr}.actions b{width:100%;margin:0}}
</style>
