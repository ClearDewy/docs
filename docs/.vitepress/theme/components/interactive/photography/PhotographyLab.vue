<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { withBase } from 'vitepress'
import { baseline, controls, histogram, processPixels, sampleCredit, validateProject } from '../../../visualizations/photography/pixels.mjs'
const STORAGE = 'dewyx-photography-lab-v1'
const image = ref(''), name = ref(''), credit = ref(null), original = shallowRef(null)
const versions = ref({ A: { intent: '清凉、安静，保留山景层次', settings: baseline() }, B: { intent: '温暖、明快，让前景山坡更亲近', settings: baseline() } })
const backupText = ref(''), loading = ref(false)
const active = ref('A'), compare = ref('original'), status = ref('正在准备内置示例…'), ready = ref(false)
const slider = shallowRef(null), renderA = ref(''), renderB = ref(''), hist = ref(null), originalHist = ref(null)
let disposed = false, saveTimer, renderTimer, generation = 0, worker, workerBusy = false, pendingJob = null, renderGeneration = 0
const histA = ref(null), histB = ref(null)
const current = computed(() => versions.value[active.value])
const leftImage = computed(() => compare.value === 'original' ? image.value : renderA.value)
const rightImage = computed(() => compare.value === 'original' ? (active.value === 'A' ? renderA.value : renderB.value) : renderB.value)
const title = computed(() => compare.value === 'original' ? `左：原图 / 右：版本 ${active.value}` : '左：版本 A / 右：版本 B')
const summary = h => h ? `可见像素 ${h.count.toLocaleString()}；平均明度 ${h.mean.toFixed(1)} / 255；近黑 ${ (100 * h.dark / Math.max(1,h.count)).toFixed(1)}%；近白 ${(100 * h.bright / Math.max(1,h.count)).toFixed(1)}%` : ''
function canvasFor(pixels) { const c = document.createElement('canvas'); c.width = original.value.width; c.height = original.value.height; c.getContext('2d').putImageData(new ImageData(pixels, c.width, c.height), 0, 0); return c }
function showResult(result) {
  if (disposed || result.id !== renderGeneration) return
  if (result.error) { status.value = `调色失败：${result.error}`; return }
  const type = 'image/png'
  renderA.value = canvasFor(result.a).toDataURL(type, .94); renderB.value = canvasFor(result.b).toDataURL(type, .94)
  histA.value = result.histA; histB.value = result.histB; hist.value = active.value === 'A' ? result.histA : result.histB
}
function sendJob(job) { workerBusy = true; worker.postMessage(job) }
function render() {
  if (!original.value || disposed) return
  const job = { id: ++renderGeneration, pixels: original.value.data, versions: JSON.parse(JSON.stringify(versions.value)) }
  if (worker) { if (workerBusy) pendingJob = job; else sendJob(job) }
  else {
    const a = processPixels(job.pixels, job.versions.A.settings), b = processPixels(job.pixels, job.versions.B.settings)
    showResult({ id: job.id, a, b, histA: histogram(a), histB: histogram(b) })
  }
}
function snapshot() { return { schema: 'photography-lab-v1', active: active.value, compare: compare.value, image: image.value, name: name.value, credit: credit.value, versions: JSON.parse(JSON.stringify(versions.value)) } }
function persist() { if (!ready.value) return; try { localStorage.setItem(STORAGE, JSON.stringify(snapshot())); status.value = '已保存到此浏览器；建议导出 JSON 备份。' } catch { status.value = '浏览器存储不可用或空间不足。编辑仍保留在本页，请立即导出 JSON 备份。' } }
async function decode(source) {
  const img = new Image(); img.decoding = 'async'
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('图片无法解码，当前编辑未变更')); img.src = source })
  if (img.naturalWidth * img.naturalHeight > 40000000) throw new Error('图片超过 4000 万像素，请先缩小后导入')
  let edge = 1200, c, data
  do {
    const ratio = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight))
    c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth * ratio)); c.height = Math.max(1, Math.round(img.naturalHeight * ratio))
    const ctx = c.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true }); ctx.drawImage(img, 0, 0, c.width, c.height)
    data = c.toDataURL(/^data:image\/(png|webp)/.test(source) ? 'image/png' : 'image/jpeg', .9)
    edge = Math.floor(edge * .75)
  } while (data.length > 3400000 && edge > 250)
  if (data.length > 3400000) throw new Error('图片仍过大，请先缩小')
  // Read from exactly the encoded working image so refresh / JSON import reproduce identical pixels.
  const normalized = new Image(); await new Promise((resolve, reject) => { normalized.onload = resolve; normalized.onerror = reject; normalized.src = data })
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(normalized, 0, 0)
  return { image: data, pixels: ctx.getImageData(0, 0, c.width, c.height) }
}
async function decodeBackup(source) {
  const img = new Image(); await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('备份中的图片无法解码')); img.src = source })
  if (!img.naturalWidth || Math.max(img.naturalWidth, img.naturalHeight) > 1200) throw new Error('备份工作图最长边不能超过 1200px')
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
  const ctx = c.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true }); ctx.drawImage(img, 0, 0)
  return { image: source, pixels: ctx.getImageData(0, 0, c.width, c.height) }
}
function apply(decoded, project) { renderA.value = decoded.image; renderB.value = decoded.image; image.value = decoded.image; original.value = decoded.pixels; name.value = project.name; credit.value = project.credit; versions.value = project.versions; active.value = project.active || 'A'; compare.value = project.compare || 'original'; originalHist.value = histogram(decoded.pixels.data); ready.value = true; render(); persist() }
async function sample() {
  if (loading.value) return
  loading.value = true
  const token = ++generation
  try { const decoded = await decode(withBase('/photography/fronalpstock.jpg')); if (token !== generation || disposed) return; apply(decoded, { name: 'Fronalpstock 山景全景', credit: sampleCredit, versions: { A: { intent: '清凉、安静，保留山景层次', settings: baseline() }, B: { intent: '温暖、明快，让前景山坡更亲近', settings: baseline() } } }) } catch (e) { status.value = e.message } finally { loading.value = false }
}
async function upload(event) {
  if (loading.value) return
  const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) { status.value = '请选择 12MB 以内 JPEG / PNG / WebP；当前编辑未变更。'; return }
  loading.value = true
  const token = ++generation
  try { const source = await new Promise((resolve,reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file) }); const decoded = await decode(source); if (token !== generation || disposed) return; apply(decoded, { name: file.name, credit: null, versions: { A: { intent: '', settings: baseline() }, B: { intent: '', settings: baseline() } } }) } catch (e) { status.value = e.message || '导入失败，当前编辑未变更' } finally { loading.value = false }
}
async function importProject(event) {
  if (loading.value) return
  const f = event.target.files?.[0]; event.target.value = ''; if (!f) return
  if (f.size > 4 * 1024 * 1024) { status.value = 'JSON 超过 4MB，当前编辑未变更'; return }
  loading.value = true
  try { await restoreText(await f.text(), true) } catch { status.value = '无法读取文件，当前编辑未变更' } finally { loading.value = false }
}
async function restoreText(source, fromFile = false) {
  if (loading.value && !fromFile) return
  if (typeof source !== 'string' || source.length > 4 * 1024 * 1024) { status.value = 'JSON 超过 4MB，当前编辑未变更'; return }
  loading.value = true
  const token = ++generation
  try { const project = validateProject(JSON.parse(source)); const decoded = await decodeBackup(project.image); if (token !== generation || disposed) return; apply(decoded, project) } catch (e) { status.value = `导入失败：${e.message}；当前编辑未变更。` } finally { loading.value = false }
}
function prepareText() { backupText.value = JSON.stringify(snapshot(), null, 2); status.value = '备份文本已生成，包含照片。可全选复制到本地文本文件，保存为 .json。' }

function download(blob, filename) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
function exportProject() { download(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }), 'photography-project.json') }
function exportImage() { const c = canvasFor(processPixels(original.value.data, current.value.settings)); c.toBlob(blob => { if (blob) download(blob, `photography-${active.value}.png`) }) }
function exportCredit() { if (credit.value) download(new Blob([JSON.stringify({ ...credit.value, version: active.value, intent: current.value.intent, settings: current.value.settings }, null, 2)], { type: 'application/json' }), `photography-${active.value}-credit.json`) }

function setControl(control,value,input) { const n=Number(value); const normalized=Number.isFinite(n)?Math.max(control.min,Math.min(control.max,n)):0; current.value.settings[control.key].value=normalized; if(input)input.value=String(normalized) }
function preset() { versions.value.A.settings = baseline(); versions.value.B.settings = baseline(); Object.assign(versions.value.A.settings, { exposure: {value:-.15,enabled:true}, temperature:{value:-25,enabled:true}, saturation:{value:-15,enabled:true}, highlights:{value:-20,enabled:true} }); Object.assign(versions.value.B.settings, { exposure:{value:.15,enabled:true}, temperature:{value:25,enabled:true}, shadows:{value:15,enabled:true}, saturation:{value:10,enabled:true} }); versions.value.A.intent = '清凉、安静，保留山景层次'; versions.value.B.intent = '温暖、明快，让前景山坡更亲近'; compare.value = 'ab' }
watch(versions, () => { if (!ready.value) return; clearTimeout(renderTimer); renderTimer = setTimeout(render, 80); clearTimeout(saveTimer); saveTimer = setTimeout(persist, 450) }, { deep: true })
watch(active, () => { hist.value = active.value === 'A' ? histA.value : histB.value; persist() })
watch(compare, () => { if (ready.value) persist() })
onMounted(async () => {
  try {
    worker = new Worker(new URL('../../../visualizations/photography/pixel-worker.mjs', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => { workerBusy = false; showResult(data); if (pendingJob) { const job = pendingJob; pendingJob = null; sendJob(job) } }
    worker.onerror = () => { worker?.terminate(); worker = null; workerBusy = false; pendingJob = null; render() }
  } catch { /* Browser without workers uses bounded synchronous fallback. */ }
  import('@img-comparison-slider/vue').then(m => { if (!disposed) slider.value = m.ImgComparisonSlider }).catch(() => { status.value = '比较滑杆未加载；下方并排图片仍可比较。' })
  let saved
  try { saved = localStorage.getItem(STORAGE) } catch { /* sample remains available */ }
  if (saved) { loading.value = true; try { const project = validateProject(JSON.parse(saved)); const decoded = await decodeBackup(project.image); if (!disposed) apply(decoded, project); return } catch { status.value = '已有本地记录无法恢复，载入内置示例。' } finally { loading.value = false } }
  await sample()
})
onBeforeUnmount(() => { if (ready.value) persist(); disposed = true; generation++; worker?.terminate(); pendingJob = null; clearTimeout(renderTimer); clearTimeout(saveTimer) })
</script>

<template>
  <section class="photo-lab" aria-label="摄影调色实验台">
    <header><span class="eyebrow">PHOTOGRAPHY / EDITING ROOM</span><h3>把意图变成看得见的调整</h3><p>从内置山景照片开始，或导入自己的照片。每次只动一个变量，再比较。</p></header>
    <fieldset :disabled="loading" :aria-busy="loading">
    <div class="toolbar"><label class="file-button">导入照片<input type="file" accept="image/jpeg,image/png,image/webp" @change="upload" /></label><button @click="sample">载入内置山景（重置两版）</button><label class="file-button">导入 JSON<input type="file" accept="application/json,.json" @change="importProject" /></label></div>
    <p class="status" role="status">{{ loading ? '正在加载照片或恢复项目，请稍候；完成前暂不可编辑或重复导入。' : status }}</p>
    <template v-if="ready">
      <p class="filename">{{ name }} · 工作图 {{ original.width }} × {{ original.height }}px</p>
      <div class="workspace">
        <div class="viewer">
          <div class="toolbar"><label>比较方式 <select v-model="compare"><option value="original">原图 / 当前版本</option><option value="ab">A / B 两版</option></select></label><strong>{{ title }}</strong></div>
          <component :is="slider" v-if="slider" class="comparison" tabindex="0" :aria-label="`${title}；左右方向键移动分界线`">
            <img slot="first" :src="leftImage" :alt="compare === 'original' ? '原始工作图' : '调色版本 A'" />
            <img slot="second" :src="rightImage" :alt="compare === 'original' ? `调色版本 ${active}` : '调色版本 B'" />
          </component>
          <div v-else class="fallback"><img :src="leftImage" alt="比较左图" /><img :src="rightImage" alt="比较右图" /></div>
          <p class="hint">拖动分界线；也可聚焦图片后按左右方向键。原图始终保留。</p>

        </div>
        <div class="adjustments"><div class="versions" role="group" aria-label="选择编辑版本"><button v-for="v in ['A','B']" :key="v" :aria-pressed="active===v" @click="active=v">编辑 {{ v }}</button></div><label class="intent">版本 {{ active }} 的意图<textarea v-model="current.intent" maxlength="2000" placeholder="主体是什么？想让人感到什么？哪些细节必须保留？" /></label>
          <div v-for="control in controls" :key="control.key" class="control"><div><label><input v-model="current.settings[control.key].enabled" type="checkbox" :aria-label="`启用${control.label}`" />{{ control.label }}</label><input class="precise-value" type="number" :value="current.settings[control.key].value" :min="control.min" :max="control.max" :step="control.step" :aria-label="`${control.label}数值`" :disabled="!current.settings[control.key].enabled" @input="setControl(control, $event.target.value)" @change="setControl(control, $event.target.value, $event.target)" @blur="setControl(control, $event.target.value, $event.target)" /><span>{{ control.unit }}</span><button :aria-label="`重置${control.label}`" @click="current.settings[control.key].value=0">↺</button></div><input v-model.number="current.settings[control.key].value" type="range" :min="control.min" :max="control.max" :step="control.step" :disabled="!current.settings[control.key].enabled" :aria-label="control.label" /></div>
          <div class="toolbar"><button @click="current.settings=baseline()">重置当前版参数</button><button @click="preset">应用课文 A/B 参数</button></div>
        </div>
      </div>
      <div class="inspection">
          <details><summary>原图、A、B 并排查看（无需滑杆）</summary><div class="triptych"><figure v-for="(src,i) in [image,renderA,renderB]" :key="i"><img :src="src" :alt="['原图','版本 A','版本 B'][i]" /><figcaption>{{ ['原图','版本 A','版本 B'][i] }}</figcaption></figure></div></details>
          <details class="histogram" v-if="hist"><summary>展开明度直方图 · 当前 {{ active }}</summary><svg viewBox="0 0 320 90" role="img" :aria-label="`左黑右白的明度分布。${summary(hist)}`"><rect v-for="(count,i) in hist.bins" :key="i" :x="i*10" :y="80-count/Math.max(1,...hist.bins)*72" width="8" :height="count/Math.max(1,...hist.bins)*72" fill="currentColor"/><text x="0" y="90">黑 0</text><text x="275" y="90">白 255</text></svg><p>原图：{{ summary(originalHist) }}<br />当前：{{ summary(hist) }}</p></details>
      </div>
      <div class="toolbar bottom"><button @click="persist">立即保存</button><button @click="exportProject">导出 JSON 备份（含照片）</button><button @click="exportImage">导出当前 {{ active }} PNG</button><button v-if="credit" @click="exportCredit">下载素材署名 JSON</button></div>
      <details class="text-backup"><summary>无法下载文件？复制 / 粘贴 JSON 备份</summary><p>先生成文本，点击文本框全选复制并保存到本地文件；恢复时粘贴完整 JSON，再点击恢复。含照片的文本较长，请勿发到公共聊天或公开仓库。</p><div class="toolbar"><button @click="prepareText">生成备份文本</button><button @click="restoreText(backupText)">从粘贴文本恢复</button></div><label>项目 JSON（含工作照片）<textarea v-model="backupText" rows="5" maxlength="4194304" aria-label="摄影项目 JSON 备份文本" placeholder="点击生成，或在此粘贴完整备份" /></label></details>
      <p v-if="credit" class="credit">示例：<a :href="credit.url" target="_blank" rel="noopener noreferrer">{{ credit.title }}</a> / {{ credit.author }} · <a :href="credit.licenseUrl" target="_blank" rel="noopener noreferrer">{{ credit.license }}</a>。{{ credit.changes }} 再分发前请下载素材署名 JSON；再分发图片需保留署名、标明修改并遵循相同许可。</p>
      <p class="hint">本地处理，不上传。最长边 1200px，导出为工作分辨率且不保留 EXIF。此处是浏览器 sRGB 近似调色，不是 RAW 显影；冷暖不是 Kelvin，曝光档不是重新拍摄。缓存可能被清理，请下载 JSON。</p>
    </template>
    </fieldset>
  </section>
</template>

<style scoped>
.photo-lab{margin:28px 0;border:1px solid var(--vp-c-divider);border-radius:16px;overflow:visible;background:var(--vp-c-bg-soft);padding:22px;color:var(--vp-c-text-1)}fieldset{border:0;margin:0;padding:0;min-width:0}fieldset:disabled button,fieldset:disabled input,fieldset:disabled textarea,fieldset:disabled select{cursor:wait;opacity:.6}header h3{margin:8px 0;font-size:24px}.eyebrow{font-size:11px;letter-spacing:.16em;color:var(--vp-c-brand-1)}p{font-size:13px;line-height:1.65;margin:10px 0}.toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}button,.file-button,select{border:1px solid var(--vp-c-divider);background:var(--vp-c-bg);padding:7px 10px;border-radius:7px;font-size:12px;cursor:pointer}button:hover{border-color:var(--vp-c-brand-1)}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,.comparison:focus-visible{outline:3px solid var(--vp-c-brand-1);outline-offset:3px}.file-button{position:relative}.file-button input{display:block;font-size:11px;max-width:200px;margin-top:5px}.status{color:var(--vp-c-text-2)}.filename{font-weight:600}.workspace{display:block}.adjustments{display:grid;grid-template-columns:1fr 1fr;gap:0 22px;margin-top:20px}.versions,.intent,.adjustments>.toolbar{grid-column:1/-1}.viewer{position:relative;top:auto;align-self:start;min-width:0;background:var(--vp-c-bg-soft);z-index:2}.comparison{display:block;width:100%;margin-top:14px;--divider-width:2px;--default-handle-opacity:1}.comparison img{display:block;width:100%;max-width:none}.fallback,.triptych{display:flex;gap:8px}.fallback img{width:48%}.triptych figure{margin:10px 0;width:33%}.triptych img{width:100%}.triptych figcaption{font-size:12px}.hint,.credit{font-size:12px;color:var(--vp-c-text-2)}.histogram{margin-top:20px;border-top:1px solid var(--vp-c-divider);padding-top:14px}.histogram h4{font-size:13px;margin:0 0 8px}.histogram svg{width:100%;height:110px;color:var(--vp-c-brand-1)}.histogram text{fill:var(--vp-c-text-2);font-size:9px}.versions{display:flex;gap:8px}.versions button{flex:1}.versions [aria-pressed=true]{background:var(--vp-c-brand-1);color:#fff}.intent{display:block;font-size:13px;margin:14px 0}.intent textarea{display:block;box-sizing:border-box;width:100%;min-height:78px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg);border-radius:6px;padding:8px;margin-top:7px;font:inherit;resize:vertical}.control{margin:11px 0}.control>div{display:flex;align-items:center;gap:5px;font-size:12px}.control label{flex:1}.control label input{margin-right:5px}.control output{font-size:11px}.control button{padding:0 8px;min-width:36px;min-height:36px}.control>input{min-height:32px;width:100%;accent-color:var(--vp-c-brand-1)}.bottom{margin-top:20px}details{font-size:12px;margin-top:12px}summary{cursor:pointer}a{overflow-wrap:anywhere}.text-backup textarea{box-sizing:border-box;width:100%;max-height:180px;margin-top:8px;padding:10px;border:1px solid var(--vp-c-divider);border-radius:6px;background:var(--vp-c-bg);font:12px monospace;resize:vertical}.text-backup label{display:block;margin-top:12px;font-size:12px}@media(max-width:1100px){.workspace{display:block}.viewer{top:auto;padding:8px 0;border-bottom:1px solid var(--vp-c-divider)}.viewer .hint{display:none}.comparison img{max-height:none;object-fit:contain}.comparison{margin-top:8px}.adjustments{margin-top:18px}.adjustments{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.versions,.intent,.adjustments>.toolbar{grid-column:1/-1}}@media(max-width:560px){button,select{min-height:44px}.control button{min-width:44px;min-height:44px}.control label{min-height:44px;display:flex;align-items:center}.control>input{min-height:44px}.photo-lab{padding:13px}.adjustments{grid-template-columns:1fr}.toolbar{align-items:stretch}.toolbar>button{flex-grow:1}.triptych{flex-direction:column}.triptych figure{width:100%}}
.precise-value{width:74px;min-height:40px;padding:6px;border:1px solid var(--vp-c-divider);border-radius:6px;background:var(--vp-c-bg);color:var(--vp-c-text-1)}.control>div>span{font-size:11px}.control>div{flex-wrap:wrap}.control label{min-width:100px}</style>
