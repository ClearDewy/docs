<script setup>
import { onMounted, ref, watch } from 'vue'
import PhotographySeeingLesson from './PhotographySeeingLesson.vue'
import { withBase } from 'vitepress'
import { safeUrl, sampleCredit, validateBoard } from '../../../visualizations/photography/pixels.mjs'
const STORAGE='dewyx-photography-board-v1'
const backupText=ref('')
function recordObservation(note){let item=items.value.find(i=>i.url===sampleCredit.url);if(!item){if(items.value.length>=100){status.value='图板已满，本次观察仍在上方，请先导出备份。';return}example();item=items.value[items.value.length-1]}item.observation=note.observation;item.idea=note.idea;status.value='已将图上区域与观察写入山景参考。'}
const items=ref([]), status=ref(''), initialized=ref(false)
const draft=ref({title:'',url:'',author:'',observation:'',idea:'',license:'',licenseUrl:'',conditions:'',image:''})
function save(){try{const data=JSON.stringify({schema:'photography-board-v1',items:items.value});if(data.length>3500000)throw new Error();localStorage.setItem(STORAGE,data);status.value='参考图板已保存到此浏览器。'}catch{status.value='本地空间不足或存储不可用，请导出 JSON 备份。'}}
function checkSize(rows){if(JSON.stringify({schema:'photography-board-v1',items:rows}).length>3500000)throw new Error('合并后超过 3.5MB 图板上限；请先导出现有图板并删除部分条目')}
function add(){try{if(items.value.length>=100)throw new Error('最多保存 100 条');const row=validateBoard({schema:'photography-board-v1',items:[draft.value]})[0];checkSize([...items.value,row]);items.value.push(row);draft.value={title:'',url:'',author:'',observation:'',idea:'',license:'',licenseUrl:'',conditions:'',image:''}}catch(e){status.value=e.message}}
function exportBoard(){const url=URL.createObjectURL(new Blob([JSON.stringify({schema:'photography-board-v1',items:items.value},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='photography-board.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importBoard(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;if(file.size>4*1024*1024){status.value='文件超过 4MB，当前图板未变更';return}try{restoreText(await file.text())}catch{status.value='无法读取文件，当前图板未变更'}}
function restoreText(source){try{if(typeof source!=='string'||source.length>4*1024*1024)throw new Error('文本超过 4MB');const raw=JSON.parse(source);const rows=validateBoard(raw);if(items.value.length+rows.length>100)throw new Error('合并后超过 100 条');checkSize([...items.value,...rows]);items.value.push(...rows);status.value=`已合并 ${rows.length} 条。重复条目可单独删除。`}catch(e){status.value=`导入失败：${e.message}；当前图板未变更。`}}
function prepareText(){backupText.value=JSON.stringify({schema:'photography-board-v1',items:items.value},null,2);status.value='图板文本已生成，可复制并保存为本地 .json 文件。'}

async function thumbnail(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024){status.value='缩略图需为 12MB 以内 JPEG / PNG / WebP';return}const url=URL.createObjectURL(file);try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});if(img.naturalWidth*img.naturalHeight>40000000)throw new Error();const c=document.createElement('canvas');const s=Math.min(1,480/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);draft.value.image=c.toDataURL('image/jpeg',.8);status.value='已附加本地缩略图，填写来源后点击加入图板。'}catch{status.value='缩略图解码失败或超过 4000 万像素；当前图板未变更'}finally{URL.revokeObjectURL(url)}}
function example(){items.value.push(...validateBoard({schema:'photography-board-v1',items:[{...sampleCredit,observation:'中央山体的浅色岩壁与深色林地形成对比；绿色草坡、蓝天白云占大面积。',idea:'下次拍山景先寻找岩壁与林地的明暗关系，再比较清凉与温暖两种感觉。',conditions:'署名、注明修改，衍生图片遵循 CC BY-SA 3.0 或兼容许可。'}]}))}
watch(items,()=>{if(initialized.value)save()},{deep:true})
onMounted(()=>{try{const raw=localStorage.getItem(STORAGE);if(raw)items.value=validateBoard(JSON.parse(raw));else example()}catch{status.value='本地记录无法恢复；可重新导入备份。'}initialized.value=true})
</script>

<template>
<section class="reference-board" aria-label="摄影参考图板">
  <header><span>PHOTOGRAPHY / REFERENCE NOTES</span><h3>先指出一处，再留下一条观察</h3><p>在示例图上点一个位置，跟着看一遍，再换一处写自己的观察。</p></header>
  <PhotographySeeingLesson @observation="recordObservation" />
  <details class="new-reference"><summary>收藏新参考（来源、照片与观察）</summary>
  <form @submit.prevent="add" class="entry-form">
    <label>作品标题<input v-model="draft.title" maxlength="300" placeholder="例如：山景的前中后景" required /></label>
    <label>来源页面链接<input v-model="draft.url" type="url" maxlength="2048" placeholder="https://…（必填）" required /></label>
    <label>摄影师 / 作者<input v-model="draft.author" maxlength="300" placeholder="按来源署名" required /></label>
    <label>许可 / 使用条件<input v-model="draft.license" maxlength="300" placeholder="例如 CC BY-SA 3.0；未知则写待核验" /></label>
    <label>许可链接<input v-model="draft.licenseUrl" type="url" maxlength="2048" placeholder="https://…" /></label>
    <label>附加条件<input v-model="draft.conditions" maxlength="1000" placeholder="署名、修改说明、人物和商标限制等" /></label>
    <label>观察到什么<textarea v-model="draft.observation" maxlength="3000" placeholder="只写可见事实：光从哪来？哪块最亮？主色是什么？" required /></label>
    <label>下一次借鉴什么<textarea v-model="draft.idea" maxlength="3000" placeholder="写一个可执行动作，不只写“高级感”" required /></label>
    <label>可选：本地缩略图<input type="file" accept="image/jpeg,image/png,image/webp" @change="thumbnail" /><small>需有权保存；缩至 480px，只存本地。</small><img v-if="draft.image" :src="draft.image" alt="待添加的本地参考缩略图" class="draft-image" /></label>
    <div class="actions"><button type="submit">加入参考图板</button><button type="button" @click="draft.image=''">移除待添加缩略图</button></div>
  </form>
  </details>
  <div class="actions"><button @click="exportBoard">导出图板 JSON</button><label class="import">导入图板 / 采集清单（合并）<input type="file" accept="application/json,.json" @change="importBoard" /></label></div>
  <details class="text-backup"><summary>无法下载文件？复制 / 粘贴图板 JSON</summary><p>生成完整备份后全选复制；粘贴导入会合并条目，不替换当前图板。</p><div class="actions"><button @click="prepareText">生成图板备份文本</button><button @click="restoreText(backupText)">从粘贴文本合并</button></div><label>图板 JSON<textarea v-model="backupText" rows="5" maxlength="4194304" aria-label="摄影参考图板 JSON 备份文本" placeholder="点击生成，或粘贴图板 / 采集清单 JSON" /></label></details>
  <p role="status">{{ status }}</p>
  <div class="cards">
    <article v-for="(item,index) in items" :key="item.id">
      <img v-if="item.image" :src="item.image" :alt="`${item.title} 的本地参考缩略图`" />
      <img v-else-if="item.url===sampleCredit.url" :src="withBase('/photography/fronalpstock.jpg')" alt="Hannes Röst 拍摄的 Fronalpstock 山景全景" />
      <div class="card-top"><h4>{{ item.title || '未命名参考' }}</h4><button @click="items.splice(index,1)" :aria-label="`删除${item.title || '参考条目'}`">删除</button></div>
      <details class="source-details"><summary>查看作者、来源与使用条件</summary><p><a :href="item.url" target="_blank" rel="noopener noreferrer">来源页面 ↗</a> · {{ item.author || '作者待核验' }}</p>
      <p v-if="item.provider || item.collectedAt" class="conditions">{{ item.provider }} · {{ item.collectedAt }} · 检索：{{ item.query }}</p>
      <p v-if="item.license">{{ item.license }} <a v-if="safeUrl(item.licenseUrl)" :href="item.licenseUrl" target="_blank" rel="noopener noreferrer">许可说明 ↗</a></p><p v-if="item.conditions" class="conditions">{{ item.conditions }}</p></details>
      <label>我的观察<textarea v-model="item.observation" maxlength="3000" /></label><label>实践想法<textarea v-model="item.idea" maxlength="3000" /></label>
    </article>
  </div>
  <p v-if="!items.length">还没有参考记录。先观察本页示例，或导入脚本生成的清单。</p>
  <p class="note">外部清单只导入署名与来源，不自动抓取远程图片。需要带图清单时，使用采集脚本的 --download 选项；手动新建条目可附加获授权的本地缩略图。导出含缩略图，请勿把无权分享的素材备份公开发布。</p>
</section>
</template>

<style scoped>
.reference-board{border:1px solid var(--vp-c-divider);border-radius:16px;padding:22px;margin:28px 0;background:var(--vp-c-bg-soft)}header span{font-size:11px;letter-spacing:.14em;color:var(--vp-c-brand-1)}h3{font-size:24px;margin:8px 0}p{font-size:13px;line-height:1.65}.entry-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}label{display:block;font-size:12px;font-weight:600}input,textarea{display:block;box-sizing:border-box;width:100%;background:var(--vp-c-bg);border:1px solid var(--vp-c-divider);border-radius:6px;margin-top:6px;padding:8px;font-size:13px;color:var(--vp-c-text-1)}textarea{min-height:80px;resize:vertical}input:focus-visible,textarea:focus-visible,button:focus-visible{outline:3px solid var(--vp-c-brand-1);outline-offset:2px}.actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}button,.import{padding:8px 12px;border:1px solid var(--vp-c-divider);border-radius:7px;background:var(--vp-c-bg);font-size:12px;cursor:pointer}.import input{max-width:240px;font-size:11px}.cards{display:grid;grid-template-columns:1fr;gap:18px}.cards article{background:var(--vp-c-bg);border:1px solid var(--vp-c-divider);border-radius:10px;padding:16px;min-width:0}.cards article>img{display:block;width:100%;max-height:440px;object-fit:contain;border-radius:5px}.card-top{display:flex;justify-content:space-between;align-items:center;gap:12px}.card-top h4{margin:14px 0;font-size:17px}.card-top button{padding:4px 8px}.cards label{margin-top:12px}.conditions,.note,small{font-size:11px;color:var(--vp-c-text-2)}.draft-image{max-width:140px;margin-top:8px}a{overflow-wrap:anywhere}.text-backup{margin-top:15px}.text-backup textarea{font:12px monospace;max-height:180px}.text-backup summary{cursor:pointer;font-size:13px}@media(max-width:650px){.entry-form,.cards{grid-template-columns:1fr}.reference-board{padding:14px}}
summary{cursor:pointer;font-size:14px;padding:10px 0}.new-reference{margin:20px 0;border-top:1px solid var(--vp-c-divider);border-bottom:1px solid var(--vp-c-divider)}button{min-height:44px}.reference-board>.seeing-lesson{padding:0;border:0}.cards article>img{max-height:320px}.source-details{margin-bottom:12px}</style>
