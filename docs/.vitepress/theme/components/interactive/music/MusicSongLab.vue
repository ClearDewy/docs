<script setup lang="ts">
import { ref, watch } from 'vue';
import { MELODY, noteName, SONG_CHORDS, songEvents } from '../../../visualizations/music/theory.mjs';
import { useMusicAudio } from '../../../visualizations/music/use-music-audio';
import './music.css';
const audio = useMusicAudio();
const active = ref(-1);
watch(audio.playing, (playing) => { if (!playing) active.value = -1; });
function play(chords: boolean) { active.value = -1; audio.song(songEvents(), chords, (i) => active.value = i); }
</script>
<template>
  <section class="music-lab" aria-label="两小节原创旋律与和弦对齐试听">
    <p class="music-eyebrow">原创练习 / 两小节</p><h3>先听一句，再听和弦怎样托住它</h3>
    <p>4/4 · 72 BPM · 每音一拍。第一小节 C C C C，第二小节 F F G C。</p>
    <div class="song-grid"><div v-for="(midi, i) in MELODY" :key="i" :class="{ active: active === i }"><small>{{ Math.floor(i / 4) + 1 }} 小节 · {{ i % 4 + 1 }} 拍</small><strong>{{ noteName(midi) }}</strong><span>{{ SONG_CHORDS[i] }} 和弦</span><small>{{ active === i ? '▶ 当前拍' : '·' }}</small></div></div>
    <div class="music-actions"><button @click="play(false)">只听旋律</button><button @click="play(true)">旋律 + 和弦</button><button @click="audio.stop">停止</button></div>
    <p role="status">{{ audio.playing.value ? '正在播放 · 结束自动停止' : '已停止' }}</p>
    <p class="music-note">和弦以较轻的合成音按拍奏出；不是吉他音色，也不代表实琴演奏。表格中的音名与和弦构成提供无声回退。</p>
    <p v-if="audio.error.value" class="music-error" role="alert">{{ audio.error.value }}</p>
  </section>
</template>
<style scoped>
.song-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.song-grid > div { display: flex; flex-direction: column; padding: 10px 6px; background: var(--vp-c-bg); border: 2px solid transparent; border-radius: 8px; font-size: 13px; text-align: center; }
.song-grid strong { font-size: 18px; }
.song-grid small { font-size: 10px; color: var(--vp-c-text-2); }
.song-grid .active { border-color: var(--vp-c-brand-1); }
</style>
