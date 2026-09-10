<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import MusicStateTools from './MusicStateTools.vue';
import { DEFAULT_RHYTHM, rhythmSteps } from '../../../visualizations/music/theory.mjs';
import { useMusicState } from '../../../visualizations/music/use-music-state';
import { useMusicAudio } from '../../../visualizations/music/use-music-audio';
import './music.css';
const { state, storageMessage, replace, reset } = useMusicState('rhythm', DEFAULT_RHYTHM);
const audio = useMusicAudio();
const active = ref(-1);
const steps = computed(() => rhythmSteps(state.value.bpm, state.value.subdivision, state.value.pattern));
const names = ['休止', '轻拍', '重音'];
function stop() { audio.stop(); active.value = -1; }
function subdivide(event: Event) {
  stop(); const subdivision = Number((event.target as HTMLSelectElement).value);
  state.value.subdivision = subdivision;
  state.value.pattern = Array.from({ length: 4 * subdivision }, (_, i) => i === 0 ? 2 : i % subdivision === 0 ? 1 : 0);
}
function toggle(i: number) { stop(); state.value.pattern[i] = (state.value.pattern[i] + 1) % 3; }
function start() { active.value = -1; audio.rhythm(state.value.bpm, state.value.subdivision, [...state.value.pattern], (i) => active.value = i); }
function importState(value: unknown) { stop(); replace(value); }
watch(() => state.value.bpm, stop);
watch(audio.playing, (playing) => { if (!playing) active.value = -1; });
</script>
<template>
  <section class="music-lab" aria-label="四四拍节奏实验">
    <p class="music-eyebrow">02 / 时间与节奏</p><h3>一拍没变，拍内可以多几个落点</h3>
    <p>这里固定为 4/4：一小节四拍，以四分音符为一拍。BPM 是每分钟的拍数；细分决定一拍切成几格。</p>
    <div class="music-controls">
      <label>速度 {{ state.bpm }} BPM <input v-model.number="state.bpm" aria-label="速度 BPM" type="range" min="40" max="180" step="1" /></label>
      <label>每拍细分 <select :value="state.subdivision" @change="subdivide"><option :value="1">1 格 · 四分音符</option><option :value="2">2 格 · 八分音符</option><option :value="4">4 格 · 十六分音符</option></select></label>
    </div>
    <p class="music-note">点每格循环「休止 → 轻拍 → 重音」。编辑会停止播放，再按播放从第 1 拍开始。细分切换会恢复每拍一下的基线。</p>
    <div class="music-beats">
      <div v-for="beat in 4" :key="beat" class="music-beat"><strong>第 {{ beat }} 拍</strong>
        <button v-for="part in state.subdivision" :key="part" :class="{ sounding: active === (beat - 1) * state.subdivision + part - 1 }" :aria-label="`第 ${beat} 拍，第 ${part} 格，${names[state.pattern[(beat-1)*state.subdivision+part-1]]}，点击切换`" @click="toggle((beat - 1) * state.subdivision + part - 1)"><span>{{ names[state.pattern[(beat-1)*state.subdivision+part-1]] }}</span><small>{{ active === (beat-1)*state.subdivision+part-1 ? '▶ 当前' : `${beat}${part > 1 ? `·${part}` : ''}` }}</small></button>
      </div>
    </div>
    <div class="music-actions"><button class="music-primary" @click="start">{{ audio.playing.value ? '从头播放' : '播放循环' }}</button><button @click="stop">停止</button></div>
    <p role="status">{{ audio.playing.value ? '循环播放中' : '已停止' }} · 一拍 {{ (60 / state.bpm).toFixed(3) }} 秒 · 一格 {{ (60 / state.bpm / state.subdivision).toFixed(3) }} 秒 · 一小节 {{ (240 / state.bpm).toFixed(3) }} 秒</p>
    <details><summary>查看拍点时间（无声时也可核对）</summary><p>{{ steps.map((step: any) => `${step.time.toFixed(3)}s ${names[step.accent]}`).join(' / ') }}</p></details>
    <p class="music-note">重音用更高、更响的合成点击表示。视觉位置按音频时钟同步，设备输出延迟仍可能影响人耳与画面的感觉。减少动态效果模式下不使用过渡动画，保留当前格文字。</p>
    <p v-if="audio.error.value" class="music-error" role="alert">{{ audio.error.value }}</p>
    <MusicStateTools kind="rhythm" :state="state" :message="storageMessage" @import="importState" @reset="stop(); reset()" />
  </section>
</template>
<style scoped>
.music-beats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
.music-beat { display: grid; gap: 6px; align-content: start; }
.music-beat strong { font-size: 13px; }
.music-beat button { display: grid; padding: 8px 2px; font-size: 13px; min-height: 58px; }
.music-beat small { color: var(--vp-c-text-2); }
.music-beat .sounding { outline: 3px solid var(--vp-c-brand-1); outline-offset: 0; }
@media (max-width: 400px) { .music-beats { gap: 6px; } }
</style>
