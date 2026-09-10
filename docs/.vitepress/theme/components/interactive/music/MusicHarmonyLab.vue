<script setup lang="ts">
import { computed, ref } from 'vue';
import MusicHarmonyExplorer from './MusicHarmonyExplorer.vue';
import { C_STRINGS, guidedCVoicing, G_TRANSFER } from '../../../visualizations/music/guided.mjs';
import { noteName } from '../../../visualizations/music/theory.mjs';
import { useMusicAudio } from '../../../visualizations/music/use-music-audio';
import './music.css';
const audio = useMusicAudio();
const step = ref(0);
const keepC = ref(true);
const keepE = ref(true);
const prediction = ref<number | null>(null);
const transfer = ref<number | null>(null);
const exploring = ref(false);
const steps = ['看五根弦发声', '把同名音归组', '换一组音验证'];
const selected = computed(() => guidedCVoicing(step.value === 0 || keepC.value, step.value === 0 || keepE.value));
const midis = computed(() => selected.value.map((string) => string.midi));
const colors = { C: '#3b82c4', E: '#b45b21', G: '#6d53b5' };
const isOn = (string: typeof C_STRINGS[number]) => selected.value.some((item) => item.string === string.string);
const sounding = (midi: number | null) => midi !== null && audio.activeNotes.value.includes(midi);
function navigate(value: number) { audio.stop(); step.value = value; }
function toggle(which: 'C' | 'E') { audio.stop(); if (which === 'C') keepC.value = !keepC.value; else keepE.value = !keepE.value; }
function setRepeats(value: boolean) { audio.stop(); keepC.value = value; keepE.value = value; audio.notes(midis.value, false); }
function toggleExplorer(event: Event) { audio.stop(); exploring.value = (event.target as HTMLDetailsElement).open; }
</script>
<template>
  <section v-show="!exploring" class="music-lab music-guided" aria-label="C 和弦五根弦与三个音引导课">
    <p class="music-eyebrow">C 和弦实验 · {{ step + 1 }} / 3</p>
    <h3>{{ step === 0 ? '五根弦，会听到几个音？' : step === 1 ? '去掉重复的音，C、E、G 还在吗？' : '换成六个音：有几种名字？' }}</h3>
    <div class="music-step-strip" aria-label="学习步骤"><button v-for="(label, i) in steps" :key="label" :aria-pressed="step === i" @click="navigate(i)">{{ i + 1 }} {{ label }}</button></div>
    <p class="music-instruction">{{ step === 0 ? '先点「逐弦听一遍」。从左往右看亮圈经过哪五根弦；带 X 的最粗弦跳过。' : step === 1 ? '先把五个声音按字母归到三组，再关闭高一层的 C 和 E，比较留下的声音。' : '下面给出另一个和弦的六个实际音高。不需要会新的指法，只沿用刚才的归组方法。' }}</p>
    <template v-if="step < 2">
      <div class="music-actions"><button class="music-primary" @click="audio.notes(midis)">▶ {{ step === 0 ? '逐弦听一遍' : `逐弦听当前 ${midis.length} 根` }}</button><button @click="audio.stop">停止</button></div>
      <div class="chord-stage">
        <div class="chord-diagram">
          <svg viewBox="0 0 380 320" role="img" aria-label="C 指型正面图，从左到右为六弦到一弦：不弹、三品、二品、空弦、一品、空弦。指板上实心圆为按弦位置，空心圆为空弦。">
            <rect x="62" y="105" width="250" height="182" rx="6" class="fret-wood" />
            <line x1="62" x2="312" y1="105" y2="105" class="fret-nut" />
            <g v-for="fret in 3" :key="fret"><line x1="62" x2="312" :y1="105 + fret * 58" :y2="105 + fret * 58" class="fret-wire" /><text x="30" :y="82 + fret * 58" class="fret-label">{{ fret }} 品</text></g>
            <g v-for="(string, index) in C_STRINGS" :key="string.string" :class="{ 'string-sounding': sounding(string.midi), 'string-off': !isOn(string) }">
              <text :x="62 + index * 50" y="33" text-anchor="middle" class="string-label">{{ string.string }} 弦</text>
              <line :x1="62 + index * 50" :x2="62 + index * 50" y1="104" y2="287" :stroke-width="4 - index * .45" class="guitar-wire" />
              <text v-if="string.fret < 0" :x="62 + index * 50" y="82" text-anchor="middle" class="mute-cross">×</text>
              <template v-else>
                <circle :cx="62 + index * 50" :cy="string.fret === 0 ? 74 : 76 + string.fret * 58" r="19" :style="{ fill: string.fret === 0 ? 'var(--vp-c-bg)' : colors[string.group], stroke: colors[string.group] }" class="finger-dot" />
                <text :x="62 + index * 50" :y="(string.fret === 0 ? 74 : 76 + string.fret * 58) + 5" text-anchor="middle" :fill="string.fret === 0 ? 'var(--vp-c-text-1)' : '#fff'" class="finger-label">{{ string.fret === 0 ? '0' : string.fret }}</text>
                <circle v-if="sounding(string.midi)" :cx="62 + index * 50" :cy="string.fret === 0 ? 74 : 76 + string.fret * 58" r="25" class="playing-ring" />
              </template>
            </g>
            <text x="62" y="313" class="fret-label">粗弦</text><text x="312" y="313" text-anchor="end" class="fret-label">细弦</text>
          </svg>
          <p class="diagram-key">X 不弹 · 0 不按弦 · 实心圆里的数字是品位</p>
        </div>
        <div class="chord-listening">
          <p class="string-readout" aria-live="polite">{{ audio.activeNotes.value.length ? `正在响：${audio.activeNotes.value.map(noteName).join(' · ')}` : `当前 ${midis.length} 根发声弦` }}</p>
          <div class="string-notes" aria-label="按发声顺序的弦，点击可单独重听"><button v-for="string in C_STRINGS.filter(s => s.midi !== null)" :key="string.string" :disabled="!isOn(string)" :class="{ 'is-sounding': sounding(string.midi) }" :aria-label="`${string.string} 弦 ${string.name}，单独试听`" @click="audio.notes([string.midi])"><span>{{ string.string }} 弦</span><strong>{{ string.name }}</strong><small>{{ !isOn(string) ? '已关闭' : sounding(string.midi) ? '正在响' : '点试听' }}</small></button></div>
          <p v-if="step === 0" class="music-note">声音依次是 C3、E3、G3、C4、E4。C3 和 C4 都姓 C，但 C4 更高；数字帮助区分高低，不是弦号。</p>
          <div v-else class="note-groups" aria-label="三个音名分组"><div v-for="group in ['C', 'E', 'G']" :key="group" :style="{ borderColor: colors[group] }"><strong>{{ group }} 组</strong><span>{{ selected.filter(s => s.group === group).map(s => s.name).join(' + ') }}</span></div></div>
        </div>
      </div>
      <template v-if="step === 1">
        <fieldset class="music-question"><legend>先预测：只关掉 C4、E4，会少掉哪种音名？</legend><button :aria-pressed="prediction === 0" @click="prediction = 0">三种名字都还在</button><button :aria-pressed="prediction === 1" @click="prediction = 1">只剩一种名字</button></fieldset>
        <div v-if="prediction !== null" class="music-result" role="status"><p><strong>{{ prediction === 0 ? '对，较低的 C3、E3 和 G3 都还在。' : '关闭两根弦，不等于删除两种名字。' }}</strong></p><p>C4 关闭后还有 C3，E4 关闭后还有 E3，G3 保留。少了两个高处的声音，但 C、E、G 这三种名字一个都没少。</p></div>
        <div class="music-actions"><button :aria-pressed="keepC" @click="toggle('C')">{{ keepC ? '关闭' : '恢复' }} 2 弦 C4</button><button :aria-pressed="keepE" @click="toggle('E')">{{ keepE ? '关闭' : '恢复' }} 1 弦 E4</button></div>
        <div class="music-actions"><button class="music-primary" @click="setRepeats(true)">▶ A：完整五根一起响</button><button @click="setRepeats(false)">▶ B：只留 C3、E3、G3</button><button @click="audio.stop">停止</button></div>
        <p class="music-note">A / B 会同时更新指板和发声状态。少音后的厚度与高低分布可以改变；判断是否仍有三种音名，要看三个分组，不靠“更响”猜答案。</p>
      </template>
    </template>
    <template v-else>
      <div class="transfer-notes" aria-label="新例子的六个音"><span v-for="(midi, i) in G_TRANSFER" :key="midi" :class="{ 'is-sounding': sounding(midi) }"><small>第 {{ i + 1 }} 个</small><strong>{{ noteName(midi) }}</strong></span></div>
      <div class="music-actions"><button class="music-primary" @click="audio.notes(G_TRANSFER)">▶ 逐个听这六个音</button><button @click="audio.stop">停止</button></div>
      <fieldset class="music-question"><legend>忽略高低数字，一共几种音名？</legend><button v-for="n in [3, 4, 6]" :key="n" :aria-pressed="transfer === n" @click="transfer = n">{{ n }} 种</button></fieldset>
      <div v-if="transfer !== null" class="music-result" role="status"><p><strong>{{ transfer === 3 ? '对，你把同名的高低版本合并了。' : '先把所有 G 圈成一组，再把两个 B 圈成一组。' }}</strong></p><p>G2、G3、G4 归 G；B2、B3 归 B；D3 归 D。六个实际音高，只含 G、B、D 三种音名，组成 G 三和弦。三和弦的“三”不是发声弦数。</p></div>
    </template>
    <p v-if="audio.error.value" class="music-error" role="alert">{{ audio.error.value }}</p>
    <p class="music-note">点击才出声 · 合成音用于比较音高，不模拟真实吉他的音色、指力或闷音。</p>
    <div class="music-lesson-footer"><button v-if="step > 0" @click="navigate(step - 1)">上一步</button><button v-if="step < 2" @click="navigate(step + 1)">下一步：{{ steps[step + 1] }} →</button><p v-else>试着解释：五根弦变成三根，什么变了？什么保持不变？</p></div>
  </section>
  <details class="music-explorer" @toggle="toggleExplorer"><summary>自由探索：理论和弦 / 独立指板（完成三步后再打开）</summary><MusicHarmonyExplorer v-if="exploring" /></details>
</template>
<style scoped>
.chord-stage { display: grid; grid-template-columns: minmax(240px, .9fr) minmax(240px, 1.1fr); gap: 24px; align-items: center; }
.chord-diagram svg { width: 100%; max-height: 340px; overflow: visible; }
.fret-wood { fill: var(--vp-c-bg); stroke: var(--vp-c-divider); }
.fret-wire { stroke: var(--vp-c-text-3); stroke-width: 2; }
.fret-nut { stroke: var(--vp-c-text-1); stroke-width: 7; }
.guitar-wire { stroke: var(--vp-c-text-2); }
.fret-label, .string-label, .mute-cross { fill: var(--vp-c-text-1); font-size: 15px; }
.finger-dot { stroke-width: 3; }
.finger-label { font-size: 15px; font-weight: 700; }
.mute-cross { font-size: 32px; }
.string-off { opacity: .4; }
.playing-ring { fill: none; stroke: var(--vp-c-brand-1); stroke-width: 4; }
.string-sounding .guitar-wire { stroke: var(--vp-c-brand-1); stroke-width: 6; }
.diagram-key { margin: 0; font-size: 12px; text-align: center; color: var(--vp-c-text-2); }
.string-notes { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.string-notes button { display: flex; flex-direction: column; align-items: center; padding: 10px 2px; gap: 4px; }
.string-notes span, .string-notes small { font-size: 11px; }
.string-notes strong { font-size: 18px; }
.string-notes .is-sounding, .transfer-notes .is-sounding { outline: 3px solid var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.string-readout { font-weight: 700; min-height: 28px; }
.note-groups { display: flex; gap: 8px; margin-top: 20px; }
.note-groups div { flex: 1; display: flex; flex-direction: column; padding: 8px; border-top: 4px solid; background: var(--vp-c-bg); border-radius: 4px; font-size: 13px; }
.transfer-notes { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin: 24px 0; }
.transfer-notes span { display: flex; flex-direction: column; padding: 16px 4px; gap: 12px; text-align: center; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 8px; }
.transfer-notes strong { font-size: 23px; }.transfer-notes small { font-size: 12px; }
.music-explorer { border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 14px; margin: 28px 0; }
.music-explorer summary { cursor: pointer; font-weight: 600; padding: 8px 0; }
@media (max-width: 760px) { .chord-stage { grid-template-columns: 1fr; gap: 8px; } .chord-diagram svg { max-height: 300px; } .chord-listening .music-actions { margin-top: 4px; } }
@media (max-width: 480px) { .transfer-notes { grid-template-columns: repeat(3, 1fr); } }
</style>
