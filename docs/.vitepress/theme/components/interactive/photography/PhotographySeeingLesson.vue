<script setup>
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { sampleCredit } from '../../../visualizations/photography/pixels.mjs'
const emit=defineEmits(['observation'])
const region=ref(''), mask=ref(''), practice=ref(false), fact=ref(''), action=ref(''), feedback=ref(false)
const regions=[
{id:'rock',name:'中央岩壁',x:46,y:42, fact:'中央岩壁比紧贴着它的树林更亮。', meaning:'这一明一暗把岩壁的轮廓分开，中央山体容易被看见。', action:'下次取景时，把受光岩壁和旁边的暗树林一起留下，比较主体是否更清楚。'},
{id:'sky',name:'上方天空',x:52,y:15, fact:'上方是一片蓝天和白云，白云比蓝天更亮。',meaning:'大面积天空给山峰留出空间，亮云也可能让目光向上移动。',action:'下次在同一位置拍两张：一张多留天空，一张少留天空，比较哪张更突出山体。'},
{id:'foreground',name:'下方草坡',x:57,y:91, fact:'下方浅绿色草坡贴着深色树林，延伸到画面下边缘。',meaning:'草坡与更远的山体重叠，提供了从近到远的参照。',action:'下次拍远山，试着把脚边一小块草坡放进画面，再拍一张不带前景的版本。'}]
const current=computed(()=>regions.find(r=>r.id===region.value))
function select(r){region.value=r.id;feedback.value=false}
function startPractice(){practice.value=true;region.value='';fact.value='';action.value='';feedback.value=false;mask.value=''}
function record(){emit('observation',{observation:`【${current.value.name}】${fact.value}`,idea:action.value});feedback.value=true}
</script>
<template>
<section class="seeing-lesson" aria-label="在照片上观察与遮挡实验">
  <div class="heading"><strong>{{practice?'换一个区域，你来描述':'先在图上点一处'}}</strong><button v-if="practice" @click="practice=false;region='';mask=''">回到示范</button></div>
  <p>{{practice?'请选一个刚才没重点看的区域。先写可见事实，再写下一次拍摄会做什么。':'点中央岩壁、天空或草坡，看看一句观察怎样从具体位置长出来。'}}</p>
  <div class="image-stage">
    <img :src="withBase('/photography/fronalpstock.jpg')" alt="中央有浅色岩壁，下方深色树林和草坡，上方蓝天白云的 Fronalpstock 山景" />
    <div v-if="mask==='sky'" class="mask sky-mask">天空已遮挡</div><div v-if="mask==='foreground'" class="mask foreground-mask">前景已遮挡</div>
    <button v-for="r in regions" :key="r.id" class="hotspot" :style="{left:r.x+'%',top:r.y+'%'}" :aria-pressed="region===r.id" @click="select(r)">{{r.name}}</button>
  </div>
  <div class="actions" role="group" aria-label="遮挡对照"><button :aria-pressed="mask==='sky'" @click="mask=mask==='sky'?'':'sky'">{{mask==='sky'?'恢复天空':'遮住天空'}}</button><button :aria-pressed="mask==='foreground'" @click="mask=mask==='foreground'?'':'foreground'">{{mask==='foreground'?'恢复前景':'遮住前景'}}</button><button @click="mask=''">显示全图</button></div>
  <p class="mask-note" v-if="mask">{{mask==='sky'?'天空不见后，岩壁是否更容易抓住你的目光？恢复全图，比较你的观看顺序。':'下方草坡不见后，远近参照是否变少？恢复全图，看看空间感怎样变化。'}} 遮挡只帮助比较取景信息，不是修图效果。</p>
  <div v-if="current&&!practice" class="observation" aria-live="polite"><p><span>① 看见的事实</span>{{current.fact}}</p><p><span>② 对效果的解释</span>{{current.meaning}}</p><p><span>③ 下次做一个动作</span>{{current.action}}</p><button @click="startPractice">换一个区域，自己试一次 →</button></div>
  <div v-else-if="!current" class="empty">{{practice?'先点图上的区域，笔记会带上它的位置。':'试着点击「中央岩壁」。先看图里的差别，再读下面出现的解释。'}}</div>
  <div v-if="practice&&current" class="practice"><label>在「{{current.name}}」看见了什么？<textarea v-model="fact" maxlength="1000" placeholder="指出位置与关系，例如：这里比旁边……，两块之间……" /></label><label>下一次只做哪个动作？<textarea v-model="action" maxlength="1000" placeholder="写能拍两张来比较的动作，例如：移动位置，让……" /></label><button :disabled="!fact.trim()||!action.trim()" @click="record">留下观察，核对要点</button><p v-if="feedback" class="feedback">已留下这次观察。检查：你是否写了能指出的区域和可见差别？行动能否拍两张来比较？参考事实：{{current.fact}} 解释可以不同，不需要猜作者的心理。</p></div>
  <details><summary>图片来源与许可</summary><p><a :href="sampleCredit.url" target="_blank" rel="noopener noreferrer">{{sampleCredit.title}}</a> · {{sampleCredit.author}} · <a :href="sampleCredit.licenseUrl">{{sampleCredit.license}}</a>。原作是拼接全景；本站缩放展示，并叠加观察标记与可撤销遮挡。</p></details>
</section>
</template>
<style scoped>
.seeing-lesson{border:1px solid var(--vp-c-divider);border-radius:16px;background:var(--vp-c-bg-soft);padding:20px;margin:24px 0}.heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.heading strong{font-size:21px}p{font-size:15px;line-height:1.7}.image-stage{position:relative;border-radius:10px;overflow:hidden}.image-stage img{display:block;width:100%;margin:0;max-width:none}.hotspot{position:absolute;transform:translate(-50%,-50%);z-index:2;background:#142d38!important;color:white!important;border:2px solid white!important;box-shadow:0 2px 8px #0007;white-space:nowrap}.hotspot[aria-pressed=true]{background:#08746a!important;box-shadow:0 0 0 4px #fff8}.mask{position:absolute;left:0;width:100%;background:#162a33;opacity:.98;z-index:1;color:#cbd5e1;font-size:12px;display:flex;align-items:center;justify-content:flex-end;padding-right:12px}.sky-mask{top:0;height:25%}.foreground-mask{bottom:0;height:18%}button{padding:8px 12px;min-height:44px;border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg);color:var(--vp-c-text-1);cursor:pointer}button:focus-visible,textarea:focus-visible{outline:3px solid var(--vp-c-brand-1);outline-offset:3px}button:disabled{opacity:.5;cursor:not-allowed}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.actions [aria-pressed=true]{border-color:var(--vp-c-brand-1)}.observation{border-left:3px solid var(--vp-c-brand-1);padding:0 16px;margin:16px 0}.observation p{margin:10px 0}.observation span{display:block;font-size:12px;color:var(--vp-c-brand-1);font-weight:700;margin-bottom:3px}.empty,.mask-note,.feedback{padding:12px;border-radius:8px;background:var(--vp-c-bg);font-size:14px;margin-top:12px}.practice label{display:block;font-size:14px;font-weight:600;margin:14px 0}.practice textarea{display:block;width:100%;padding:12px;margin-top:7px;min-height:72px;border-radius:8px;background:var(--vp-c-bg);border:1px solid var(--vp-c-divider);resize:vertical}details{margin-top:18px;font-size:12px}details p{font-size:12px}summary{cursor:pointer}@media(max-width:560px){.seeing-lesson{padding:12px}.hotspot{font-size:11px;min-height:38px;padding:5px 8px}.heading strong{font-size:18px}.image-stage{overflow:visible}.mask{font-size:10px}.observation{padding-left:10px}}
</style>
