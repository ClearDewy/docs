<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ original: String, current: String, originalHist: Object, currentHist: Object, label: { default: '当前调整' }, transfer: Boolean, busy: Boolean })
const showingOriginal = ref(false), selected = ref(''), zoomed = ref(false)
const regions = computed(() => props.transfer ? [{id:'sky',name:'远处雪山',x:89,y:22,w:9,h:10},{id:'trees',name:'右侧树林',x:73,y:43,w:16,h:25}] : [{id:'sky',name:'天空云纹',x:42,y:7,w:18,h:17},{id:'rock',name:'浅色岩壁',x:37,y:36,w:16,h:13},{id:'trees',name:'深色树林',x:27,y:60,w:15,h:23}])
const region = computed(() => regions.value.find(r=>r.id===selected.value))
const fullView = computed(() => props.transfer ? '650 0 630 575' : '0 0 1280 575')
const viewbox = computed(() => zoomed.value && region.value ? `${region.value.x*12.8-25} ${region.value.y*5.75-25} ${region.value.w*12.8+50} ${region.value.h*5.75+50}` : fullView.value)
const max = computed(()=>Math.max(1,...(props.originalHist?.bins||[]),...(props.currentHist?.bins||[])))
function choose(r){selected.value=r.id;zoomed.value=true}
</script>
<template>
<div class="study-view" :aria-busy="busy">
  <div class="tools"><button :aria-pressed="showingOriginal" @click="showingOriginal=!showingOriginal">{{ showingOriginal ? '显示调整后' : '显示原图' }}</button><strong aria-live="polite">{{ showingOriginal ? '原图 · 未调整' : label }}</strong><button v-if="zoomed" @click="zoomed=false;selected=''">回到全图</button></div>
  <svg class="photo" :viewBox="viewbox" role="img" :aria-label="`${showingOriginal?'原图':label}；${zoomed ? region?.name+'局部放大' : '山景全图'}`">
    <image :href="showingOriginal ? original : current || original" width="1280" height="575" />
    <template v-if="!zoomed"><g v-for="r in regions" :key="r.id"><rect :x="r.x*12.8" :y="r.y*5.75" :width="r.w*12.8" :height="r.h*5.75" rx="8" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 5" /><rect :x="r.x*12.8" :y="r.y*5.75" :width="r.name.length*22+18" height="34" fill="#142d38" rx="5"/><text :x="r.x*12.8+9" :y="r.y*5.75+25" fill="white" font-size="22">{{r.name}}</text></g></template>
  </svg>
  <div class="tools region-buttons"><button :aria-pressed="showingOriginal" @click="showingOriginal=!showingOriginal">{{ showingOriginal ? '回看调整后' : '对照原图' }}</button><button v-if="zoomed" @click="zoomed=false;selected=''">回到全图</button><span>放大观察：</span><button v-for="r in regions" :key="r.id" :aria-pressed="zoomed && selected===r.id" @click="choose(r)">{{r.name}}</button></div>
  <div v-if="originalHist && currentHist" class="histogram">
    <svg viewBox="0 0 320 64" role="img" aria-label="同一比例叠加的原图与当前明度直方图，左黑右白">
      <rect v-for="(n,i) in originalHist.bins" :key="`o${i}`" :x="i*10" :y="52-n/max*50" width="9" :height="n/max*50" fill="#94a3b8" opacity=".65" />
      <rect v-for="(n,i) in currentHist.bins" :key="`c${i}`" :x="i*10+2" :y="52-n/max*50" width="5" :height="n/max*50" fill="#14b8a6" />
      <text x="0" y="63">黑</text><text x="303" y="63">白</text>
    </svg>
    <p><span class="original-key">■</span> 灰：原图　<span class="current-key">■</span> 绿：{{label}}<br />横轴从暗到亮；柱越高，这种亮度的像素越多。{{ zoomed || transfer ? '统计完整工作图，不仅是眼前区域。' : '' }}</p>
  </div>
</div>
</template>
<style scoped>
.study-view{min-width:0}.photo{display:block;width:100%;height:auto;max-height:52vh;background:#17252d;border-radius:10px;margin:10px 0}.tools{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:14px}.tools button{min-height:44px;padding:8px 13px;border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg);color:var(--vp-c-text-1);cursor:pointer}.tools [aria-pressed=true]{border-color:var(--vp-c-brand-1);box-shadow:inset 0 0 0 1px var(--vp-c-brand-1)}button:focus-visible{outline:3px solid var(--vp-c-brand-1);outline-offset:2px}.histogram{display:flex;align-items:center;gap:16px;margin:10px 0}.histogram svg{width:50%;max-width:320px;height:76px}.histogram p{font-size:12px;line-height:1.6;margin:0}.histogram text{fill:var(--vp-c-text-2);font-size:9px}.original-key{color:#94a3b8}.current-key{color:#14b8a6}@media(max-width:560px){.photo{min-height:190px;max-height:40vh}.histogram{gap:8px}.histogram p{font-size:11px}.region-buttons{gap:6px}.region-buttons span{width:100%}}
</style>
