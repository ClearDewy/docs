<script setup lang="ts">
import { computed, watch } from 'vue';
import MusicStateTools from './MusicStateTools.vue';
import { DEFAULT_TRANSPOSE, MELODY, noteName, rangeFits, ROOTS, spelledMelody, transposeMelody } from '../../../visualizations/music/theory.mjs';
import { useMusicState } from '../../../visualizations/music/use-music-state';
import { useMusicAudio } from '../../../visualizations/music/use-music-audio';
import './music.css';
const { state, storageMessage, replace, reset } = useMusicState('transpose', DEFAULT_TRANSPOSE);
const audio = useMusicAudio();
const melody = computed(() => transposeMelody(state.value.shift));
const fits = computed(() => rangeFits(melody.value, state.value.low, state.value.high));
const options = Array.from({ length: 49 }, (_, i) => i + 36);
const keyName = computed(() => ROOTS[(state.value.shift % 12 + 12) % 12]);
function rangeChange(bound: 'low' | 'high', event: Event) {
  audio.stop(); const next = Number((event.target as HTMLSelectElement).value);
  state.value[bound] = next;
  if (state.value.low > state.value.high) state.value[bound === 'low' ? 'high' : 'low'] = next;
}
function importState(value: unknown) { audio.stop(); replace(value); }
watch(() => state.value.shift, () => audio.stop());
</script>
<template>
  <section class="music-lab" aria-label="原创旋律移调与选调实验">
    <p class="music-eyebrow">03 / 从旋律到自己的调</p><h3>整句一起移动，音程保持原样</h3>
    <p>原创练习句：C4 D4 E4 G4 ｜ F4 E4 D4 C4。每音一拍，试听固定 120 BPM；原调为 C 大调，音域 C4–G4。</p>
    <label>整体移动 {{ state.shift > 0 ? '+' : '' }}{{ state.shift }} 半音 <input v-model.number="state.shift" type="range" min="-12" max="12" step="1" aria-label="整体移动半音数" /></label>
    <div class="music-result"><p><strong>{{ keyName }} 大调 · {{ spelledMelody(state.shift).join(' · ') }}</strong></p><p>音域 {{ spelledMelody(state.shift)[0] }}–{{ spelledMelody(state.shift)[3] }}；相邻距离仍是 +2、+2、+3、−2、−1、−2、−2 半音。</p></div>
    <div class="music-actions"><button @click="audio.notes(MELODY)">听原调</button><button @click="audio.notes(melody)">听移调后</button><button @click="audio.stop">停止</button></div>
    <p role="status">{{ audio.playing.value ? '正在播放合成旋律' : '已停止 · 点击试听才出声' }}</p>
    <div class="music-controls">
      <label>练习舒适下界 <select :value="state.low" @change="rangeChange('low', $event)"><option v-for="note in options" :key="note" :value="note">{{ noteName(note) }}</option></select></label>
      <label>练习舒适上界 <select :value="state.high" @change="rangeChange('high', $event)"><option v-for="note in options" :key="note" :value="note">{{ noteName(note) }}</option></select></label>
    </div>
    <p aria-live="polite">{{ fits ? '这句的全部音高落在输入范围内。' : '这句有音超出输入范围；尝试整体升降，再核对高低两端。' }}</p>
    <p class="music-note">默认 C4–G4 仅用于算例，不能据此判断你的音域。这里比较音高范围，不评估持续高音、换声区、元音或发声质量。升高下界超过上界时，上界会随之调整，反之亦然。</p>
    <p v-if="audio.error.value" class="music-error" role="alert">{{ audio.error.value }}</p>
    <MusicStateTools kind="transpose" :state="state" :message="storageMessage" @import="importState" @reset="audio.stop(); reset()" />
  </section>
</template>
