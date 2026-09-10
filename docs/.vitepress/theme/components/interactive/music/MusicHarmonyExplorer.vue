<script setup lang="ts">
import { computed, watch } from 'vue';
import MusicStateTools from './MusicStateTools.vue';
import { chordNotes, DEFAULT_HARMONY, degree, fretMidi, noteName, pitchClass, ROOTS, SHAPES, shapeName, triadMidi, voicing } from '../../../visualizations/music/theory.mjs';
import { useMusicState } from '../../../visualizations/music/use-music-state';
import { useMusicAudio } from '../../../visualizations/music/use-music-audio';
import './music.css';
const { state, storageMessage, replace, reset } = useMusicState('harmony', DEFAULT_HARMONY);
const audio = useMusicAudio();
const symbol = computed(() => state.value.root + (state.value.quality === 'minor' ? 'm' : ''));
const tones = computed(() => chordNotes(state.value.root, state.value.quality));
const triad = computed(() => triadMidi(state.value.root, state.value.quality));
const sounding = computed(() => voicing(state.value.frets));
const preset = computed(() => shapeName(state.value.frets));
const inChord = (midi: number) => triad.value.some((note: number) => pitchClass(note) === pitchClass(midi));
const matchesChord = computed(() => {
  const pcs = new Set(sounding.value.map(pitchClass));
  return pcs.size === 3 && triad.value.every((midi: number) => pcs.has(pitchClass(midi)));
});
function loadShape(name: 'C' | 'Cm') {
  audio.stop();
  state.value = { root: 'C', quality: name === 'Cm' ? 'minor' : 'major', labels: state.value.labels, frets: [...SHAPES[name]] };
}
function choose(i: number, fret: number) {
  audio.stop(); state.value.frets[i] = fret;
  const midi = fretMidi(i, fret);
  if (midi !== null) audio.notes([midi]);
}
function importState(value: unknown) { audio.stop(); replace(value); }
watch(() => [state.value.root, state.value.quality], () => audio.stop());
</script>
<template>
  <section class="music-lab" aria-label="音程、三和弦与吉他指板实验">
    <p class="music-eyebrow">自由探索 / 两个独立实验</p>
    <h3>先选理论音组，再另行探索手指位置</h3>
    <p>这里有两个独立发声区。上半区按根音生成理论三和弦，下半区只播放实际选中的品位。改根音不等于换指型。</p>
    <h4>理论音组：声音由根音与性质生成</h4>
    <div class="music-controls">
      <label>根音 <select v-model="state.root"><option v-for="root in ROOTS" :key="root">{{ root }}</option></select></label>
      <label>性质 <select v-model="state.quality"><option value="major">大三和弦 · 1 3 5</option><option value="minor">小三和弦 · 1 ♭3 5</option></select></label>
    </div>
    <div class="music-result">
      <p><strong>{{ symbol }} = {{ tones.join(' · ') }}</strong></p>
      <p>从根音数半音：0 → {{ state.quality === 'minor' ? 3 : 4 }} → 7。三音降低半音，大三和弦变为小三和弦。</p>
    </div>
    <div class="music-actions">
      <button @click="audio.notes(triad)">逐音听 {{ symbol }}</button>
      <button @click="audio.notes(triad, false)">合奏听 {{ symbol }}</button>
      <button @click="audio.notes(triad.slice(0, 2))">只听根音 → 三音</button>
      <button @click="audio.stop">停止</button>
    </div>
    <p class="music-note" role="status">{{ audio.playing.value ? '正在播放合成音' : '已停止 · 点击试听才出声' }}</p>
    <h4>独立指板：声音只取决于下面的品位</h4>
    <div class="music-controls">
      <button @click="loadShape('C')">载入 C 指型</button><button @click="loadShape('Cm')">载入 Cm 指型</button>
      <label>指板标记 <select v-model="state.labels"><option value="names">音名与八度</option><option value="degrees">相对根音的级数</option></select></label>
    </div>
    <p class="music-note">点击品位会选中并试听该弦；X 表示不弹，0 表示空弦。带「·」的格子属于上方目标和弦；实色按钮才是实际所选位置。手机可横向滚动指板。</p>
    <div class="music-scroll" tabindex="0" aria-label="六弦指板，可横向滚动">
      <table class="music-fretboard"><caption>标准调弦，0–5 品（6 弦 → 1 弦）</caption>
        <thead><tr><th scope="col">弦</th><th scope="col">静音</th><th v-for="fret in 6" :key="fret" scope="col">{{ fret - 1 }}{{ fret === 1 ? ' 空弦' : ' 品' }}</th></tr></thead>
        <tbody><tr v-for="(_, i) in state.frets" :key="i">
          <th scope="row">{{ 6 - i }} 弦</th>
          <td><button :aria-pressed="state.frets[i] === -1" :aria-label="`${6 - i} 弦静音`" @click="choose(i, -1)">X</button></td>
          <td v-for="fret in 6" :key="fret"><button :aria-pressed="state.frets[i] === fret - 1" :aria-label="`${6-i} 弦 ${fret-1} 品，${noteName(fretMidi(i, fret-1))}，级数 ${degree(fretMidi(i, fret-1), state.root)}`" @click="choose(i, fret - 1)">{{ state.labels === 'names' ? noteName(fretMidi(i, fret - 1)) : degree(fretMidi(i, fret - 1), state.root) }}{{ inChord(fretMidi(i, fret - 1)) ? ' ·' : '' }}</button></td>
        </tr></tbody>
      </table>
    </div>
    <div class="music-result" aria-live="polite">
      <p><strong>{{ preset ? `${preset} 常见可按指型` : '自由音组（未验证可按指型）' }}</strong> · {{ state.frets.map((f: number) => f === -1 ? 'X' : f).join(' ') }}</p>
      <p>实际发声：{{ sounding.length ? sounding.map(noteName).join(' · ') : '全部静音' }}</p>
      <p>{{ matchesChord ? `这些音完整覆盖 ${symbol} 的三个音级。` : `当前音组与目标 ${symbol} 不完全一致；改根音不会自动搬动手指。` }}</p>
    </div>
    <div class="music-actions"><button @click="audio.notes(sounding)">从 6 弦起逐弦听</button><button @click="audio.notes(sounding, false)">听所选音组合奏</button><button @click="audio.stop">停止</button></div>
    <p class="music-note">C 的 X 3 2 0 1 0 = 静音、C3、E3、G3、C4、E4。Cm 的 X 3 5 5 4 3 通常需要食指横按；合成音不模拟真实吉他的闷音或指力。</p>
    <p v-if="audio.error.value" class="music-error" role="alert">{{ audio.error.value }}</p>
    <MusicStateTools kind="harmony" :state="state" :message="storageMessage" @import="importState" @reset="audio.stop(); reset()" />
  </section>
</template>
<style scoped>
.music-fretboard { min-width: 615px; font-size: 13px; border-collapse: separate; border-spacing: 3px; }
.music-fretboard th, .music-fretboard td { padding: 2px; border: 0; white-space: nowrap; background: none; }
.music-fretboard button { width: 100%; min-width: 54px; font-size: 13px; padding: 8px 5px; }
.music-fretboard caption { text-align: left; padding-bottom: 8px; color: var(--vp-c-text-2); }
</style>
