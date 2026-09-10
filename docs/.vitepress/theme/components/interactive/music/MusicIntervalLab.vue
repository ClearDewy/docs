<script setup lang="ts">
import { computed, ref } from 'vue';
import { semitonePath } from '../../../visualizations/music/guided.mjs';
import { noteName } from '../../../visualizations/music/theory.mjs';
import { useMusicAudio } from '../../../visualizations/music/use-music-audio';
import './music.css';
const audio = useMusicAudio();
const step = ref(0);
const position = ref(0);
const answer = ref<number | null>(null);
const transfer = ref<number | null>(null);
const steps = ['听见一格', '比较三步与四步', '换个起点'];
const start = computed(() => step.value === 2 ? 62 : 60);
const keys = computed(() => semitonePath(start.value, 4));
const current = computed(() => audio.activeNotes.value[0] ?? start.value + position.value);
function moveTo(value: number) { position.value = value; audio.notes([start.value + value]); }
function nextPitch() {
  if (position.value >= 4) return;
  const previous = position.value;
  position.value += 1;
  audio.notes([60 + previous, 60 + position.value]);
}
function navigate(value: number) { audio.stop(); step.value = value; position.value = 0; }
function compare(distance: number) { position.value = distance; audio.notes([60, 60 + distance]); }
</script>
<template>
  <section class="music-lab music-guided" aria-label="音高台阶引导课">
    <p class="music-eyebrow">声音实验 · {{ step + 1 }} / 3</p>
    <h3>{{ step === 0 ? '一个声音，向上挪一格会怎样？' : step === 1 ? '同一个起点，哪个终点更近？' : '起点换成 D，还会数吗？' }}</h3>
    <div class="music-step-strip" aria-label="学习步骤"><button v-for="(label, i) in steps" :key="label" :aria-pressed="step === i" @click="navigate(i)">{{ i + 1 }} {{ label }}</button></div>
    <p class="music-instruction">{{ step === 0 ? '先点「听起点，再升一格」。亮框会从左边移向右边，听后一个音有没有变高。' : step === 1 ? '先预测：A 走 3 步，B 走 4 步，哪组两音更靠近？再各听一次。' : '现在从 D4 开始，终点是 F4。不要数音名字母；数两个位置之间的移动。' }}</p>

    <div v-if="step === 0" class="music-actions"><button class="music-primary" @click="position = 1; audio.notes([60, 61])">▶ 听起点，再升一格</button><button @click="nextPitch" :disabled="position === 4">再向上移一格</button><button @click="audio.stop">停止</button></div>
    <div v-else-if="step === 1" class="music-actions"><button class="music-primary" @click="compare(3)">▶ A：C → Eb · 3 步</button><button @click="compare(4)">▶ B：C → E · 4 步</button><button @click="audio.stop">停止</button></div>
    <div v-else class="music-actions"><button class="music-primary" @click="position = 3; audio.notes([62, 65])">▶ 听 D → F</button><button @click="audio.stop">停止</button></div>
    <div class="pitch-stairs" aria-label="每一格代表一个半音，音高向右升高">
      <button v-for="(midi, i) in keys" :key="midi" :style="{ '--rise': `${i * 13}px` }" :class="{ 'is-sounding': audio.playing.value && current === midi, 'is-endpoint': position === i }" :aria-label="`${noteName(midi)}，从起点走 ${i} 步，点击试听`" :aria-pressed="position === i" @click="moveTo(i)">
        <span class="pitch-step">{{ i === 0 ? '起点' : `${i} 步` }}</span><strong>{{ noteName(midi) }}</strong><span class="pitch-dot">{{ audio.playing.value && current === midi ? '正在响' : i === position ? '所选音' : '点试听' }}</span>
      </button>
    </div>
    <p class="pitch-direction">低音 <span aria-hidden="true">⟶</span> 高音 · 相邻两个位置只隔一格</p>
    <template v-if="step === 0">
      
      <div class="music-result"><p><strong>刚才的一小格，就叫一个「半音」。</strong></p><p>C4 是起点的名字。隔壁的 Db4（读作降 D）是另一个声音的名字。先认位置，不必背完名字。点任意台阶，可以重听那一个音。</p></div>
    </template>
    <template v-else-if="step === 1">
      
      <fieldset class="music-question"><legend>预测：哪组两音的距离更小？</legend><button :aria-pressed="answer === 3" @click="answer = 3">A：3 步</button><button :aria-pressed="answer === 4" @click="answer = 4">B：4 步</button></fieldset>
      <div v-if="answer !== null" class="music-result" role="status"><p><strong>{{ answer === 3 ? '对，A 的终点比 B 低一格。' : '再看右边两个位置：E 在第 4 步，Eb 在第 3 步。' }}</strong></p><p>起点 C 没变，Eb 比 E 更靠近 C，所以 A 的距离更小。要数「移动了几次」，起点算 0 步。点下面按钮，把中间的每一步也听出来。</p><button @click="position = 3; audio.notes(semitonePath(60, 3))">▶ 一步一步走到 Eb</button></div>
    </template>
    <template v-else>
      
      <fieldset class="music-question"><legend>D4 到 F4，一共向上走了几步？</legend><button v-for="n in [2, 3, 4]" :key="n" :aria-pressed="transfer === n" @click="transfer = n">{{ n }} 步</button></fieldset>
      <div v-if="transfer !== null" class="music-result" role="status"><p><strong>{{ transfer === 3 ? '对，换了起点，仍然可以数移动。' : transfer === 2 ? '你可能只数了中间两个位置。到终点的最后一次移动也要算。' : '起点只标位置，不算一次移动，所以从 0 开始数。' }}</strong></p><p>D → Eb 是第 1 步，Eb → E 是第 2 步，E → F 是第 3 步。D → F 与刚才的 C → Eb 都相隔 3 半音。</p><button @click="position = 3; audio.notes(semitonePath(62, 3))">▶ 核对这三步</button></div>
    </template>
    <p class="music-note" role="status">{{ audio.playing.value ? `当前合成音：${audio.activeNotes.value.map(noteName).join('、') || '准备播放'}` : '点击才出声 · 三角波合成参考音，不是实琴录音' }}</p>
    <p v-if="audio.error.value" class="music-error" role="alert">{{ audio.error.value }}</p>
    <div class="music-lesson-footer"><button v-if="step > 0" @click="navigate(step - 1)">上一步</button><button v-if="step < 2" @click="navigate(step + 1)">下一步：{{ steps[step + 1] }} →</button><p v-else>最后用自己的话说：为什么数距离时，起点不算一步？</p></div>
  </section>
</template>
<style scoped>
.pitch-stairs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: end; gap: 8px; padding: 16px 0 0; min-height: 172px; }
.pitch-stairs button { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; height: calc(110px + var(--rise)); padding: 10px 3px; border-radius: 10px 10px 4px 4px; }
.pitch-stairs strong { font-size: clamp(16px, 3vw, 24px); }
.pitch-step, .pitch-dot { font-size: 12px; }
.pitch-stairs button.is-sounding { outline: 4px solid var(--vp-c-brand-1); outline-offset: 3px; box-shadow: inset 0 0 0 3px var(--vp-c-bg); }
.pitch-direction { display: flex; gap: 10px; align-items: center; font-size: 13px; color: var(--vp-c-text-2); }
.pitch-direction span { flex: 1; }
@media (max-width: 480px) { .pitch-stairs { gap: 5px; } .pitch-dot { font-size: 10px; } }
</style>
