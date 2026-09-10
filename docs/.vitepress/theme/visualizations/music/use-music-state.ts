import { onMounted, ref, watch } from 'vue';
import { decodeState, encodeState, validateState } from './theory.mjs';

export function useMusicState<T>(kind: string, initial: T) {
  const state = ref(JSON.parse(JSON.stringify(initial))) as { value: T };
  const storageMessage = ref('设置保存在此浏览器；可导出备份，不会上传。');
  const key = `dewyx-music-${kind}-v1`;
  let mounted = false;
  onMounted(() => {
    try { const old = localStorage.getItem(key); if (old) state.value = decodeState(kind, old); }
    catch { storageMessage.value = '本地记录不可用，已使用默认值；仍可手动导出。'; }
    mounted = true;
  });
  watch(() => state.value, (value) => {
    if (!mounted) return;
    try { localStorage.setItem(key, encodeState(kind, value)); }
    catch { storageMessage.value = '未能保存到浏览器；请导出 JSON 保存当前设置。'; }
  }, { deep: true });
  function replace(value: unknown) { state.value = validateState(kind, value); }
  function reset() { state.value = JSON.parse(JSON.stringify(initial)); }
  return { state, storageMessage, replace, reset };
}
