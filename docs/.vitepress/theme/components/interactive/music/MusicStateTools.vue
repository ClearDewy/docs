<script setup lang="ts">
import { ref } from 'vue';
import { decodeState, encodeState } from '../../../visualizations/music/theory.mjs';
const props = defineProps<{ kind: string; state: unknown; message: string }>();
const emit = defineEmits<{ import: [state: unknown]; reset: [] }>();
const json = ref('');
const feedback = ref('');
function exportJson() {
  json.value = encodeState(props.kind, props.state);
  const url = URL.createObjectURL(new Blob([json.value], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `music-${props.kind}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback.value = '已生成 JSON；也可复制下方文字保存。';
}
function importJson() {
  try { emit('import', decodeState(props.kind, json.value)); feedback.value = '已导入，播放已停止。'; }
  catch (error) { feedback.value = error instanceof Error ? error.message : '无法读取 JSON'; }
}
async function readFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 10000) { feedback.value = '请选择 10 KB 以内的实验 JSON。'; input.value = ''; return; }
  try { json.value = await file.text(); importJson(); }
  catch { feedback.value = '无法读取文件，请粘贴 JSON。'; }
  input.value = '';
}
</script>
<template>
  <details class="music-state"><summary>保存与恢复实验</summary>
    <p>{{ message }}</p>
    <div class="music-actions"><button @click="exportJson">导出 JSON</button><button @click="emit('reset')">恢复默认</button></div>
    <label>导入实验文件 <input type="file" accept=".json,application/json" @change="readFile" /></label>
    <label>或粘贴导出的 JSON<textarea v-model="json" rows="4" spellcheck="false" /></label>
    <button @click="importJson">导入 JSON</button><p role="status">{{ feedback }}</p>
  </details>
</template>
