/** Educational sRGB pipeline. No RAW decoding, local masks or camera profiles. */
export const controls = [
  { key: 'exposure', label: '曝光增益', min: -2, max: 2, step: 0.05, unit: '档（近似）' },
  { key: 'contrast', label: '对比度', min: -60, max: 60, step: 1, unit: '' },
  { key: 'shadows', label: '暗部', min: -60, max: 60, step: 1, unit: '' },
  { key: 'highlights', label: '亮部', min: -60, max: 60, step: 1, unit: '' },
  { key: 'temperature', label: '冷暖（正值偏暖）', min: -60, max: 60, step: 1, unit: '' },
  { key: 'tint', label: '绿 / 洋红（正值）', min: -60, max: 60, step: 1, unit: '' },
  { key: 'saturation', label: '饱和度', min: -100, max: 60, step: 1, unit: '' },
  { key: 'hue', label: '全局色相旋转', min: -30, max: 30, step: 1, unit: '°' },
]
export const baseline = () => Object.fromEntries(controls.map(c => [c.key, { value: 0, enabled: true }]))
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))
export const decodeSRGB = v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4
export const encodeSRGB = v => v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055
export function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2
  if (!d) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [((h / 6) + 1) % 1, s, l]
}
export function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l)
  return [0, 8, 4].map(n => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)) })
}
export function processPixels(input, settings) {
  const out = new Uint8ClampedArray(input.length)
  const p = Object.fromEntries(controls.map(c => [c.key, settings[c.key]?.enabled ? clamp(Number(settings[c.key].value) || 0, c.min, c.max) : 0]))
  if (Object.values(p).every(v => v === 0)) return new Uint8ClampedArray(input)
  for (let i = 0; i < input.length; i += 4) {
    let rgb = [input[i], input[i + 1], input[i + 2]].map(v => decodeSRGB(v / 255) * 2 ** p.exposure)
    const y = clamp(.2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2])
    const offset = p.shadows / 100 * .3 * (1 - y) ** 2 + p.highlights / 100 * .3 * y ** 2
    const gains = [1 + p.temperature / 200 + p.tint / 400, 1 - p.tint / 200, 1 - p.temperature / 200 + p.tint / 400]
    rgb = rgb.map((v, j) => encodeSRGB(clamp(((v - .18) * (1 + p.contrast / 100) + .18 + offset) * gains[j])))
    if (p.hue || p.saturation) {
      const [h, s, l] = rgbToHsl(...rgb)
      rgb = hslToRgb((h + p.hue / 360 + 1) % 1, clamp(s * (1 + p.saturation / 100)), l)
    }
    rgb.forEach((v, j) => { out[i + j] = Math.round(clamp(v) * 255) })
    out[i + 3] = input[i + 3]
  }
  return out
}
export function histogram(data) {
  const bins = Array(32).fill(0); let count = 0, dark = 0, bright = 0, sum = 0
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue
    const y = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2]
    bins[Math.min(31, Math.floor(y / 8))]++; count++; sum += y
    if (y <= 3) dark++; if (y >= 252) bright++
  }
  return { bins, count, dark, bright, mean: count ? sum / count : 0 }
}
export const sampleCredit = {
  title: 'Fronalpstock 山景全景', author: 'Hannes Röst',
  url: 'https://commons.wikimedia.org/wiki/File:Fronalpstock_big.jpg',
  license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  changes: '使用 Commons 1280px 缩略图；实验导出会缩放及调色。原作已由 12 张照片拼接，并非相机 RAW。',
}
export function validateSettings(value) {
  if (!value || typeof value !== 'object') throw new Error('缺少调色参数')
  const result = baseline()
  for (const c of controls) {
    const v = value[c.key]
    if (!v || typeof v.enabled !== 'boolean' || typeof v.value !== 'number' || !Number.isFinite(v.value) || v.value < c.min || v.value > c.max) throw new Error(`无效参数：${c.label}`)
    result[c.key] = { value: v.value, enabled: v.enabled }
  }
  return result
}
export function safeUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return ''
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : '' } catch { return '' }
}
export function validateProject(raw) {
  if (raw?.schema !== 'photography-lab-v1' || typeof raw.image !== 'string' || raw.image.length > 3500000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(raw.image)) throw new Error('不是有效的摄影实验备份（需要内嵌 JPEG / PNG / WebP）')
  const versions = {}
  for (const k of ['A', 'B']) {
    if (typeof raw.versions?.[k]?.intent !== 'string' || raw.versions[k].intent.length > 2000) throw new Error('意图字段无效')
    versions[k] = { intent: raw.versions[k].intent, settings: validateSettings(raw.versions[k].settings) }
  }
  const credit = raw.credit && typeof raw.credit === 'object' ? Object.fromEntries(['title', 'author', 'license', 'changes'].map(k => [k, String(raw.credit[k] || '').slice(0, 1000)])) : null
  if (credit) { credit.url = safeUrl(raw.credit.url); credit.licenseUrl = safeUrl(raw.credit.licenseUrl) }
  return { active: raw.active === 'B' ? 'B' : 'A', compare: raw.compare === 'ab' ? 'ab' : 'original', schema: raw.schema, image: raw.image, name: String(raw.name || '导入图片').slice(0, 200), versions, credit }
}
export function validateBoard(raw) {
  if (!['photography-board-v1', 'photography-materials-v1'].includes(raw?.schema) || !Array.isArray(raw.items) || raw.items.length > 100) throw new Error('清单需为摄影参考图板或素材清单，最多 100 条')
  return raw.items.map((item, index) => {
    if (!item || typeof item !== 'object' || !safeUrl(item.url)) throw new Error(`第 ${index + 1} 条缺少有效来源链接`)
    const result = { sourceId: String(item.sourceId || item.id || '').slice(0, 200), provider: String(item.provider || raw.provider || '').slice(0, 100), collectedAt: String(item.collectedAt || raw.collectedAt || '').slice(0, 100), query: String(item.query || raw.query || '').slice(0, 200), id: `reference-${index}-${Date.now()}`, url: safeUrl(item.url), authorUrl: safeUrl(item.authorUrl), licenseUrl: safeUrl(item.licenseUrl) }
    for (const k of ['title', 'author', 'observation', 'idea', 'license', 'conditions']) result[k] = typeof item[k] === 'string' ? item[k].slice(0, 3000) : ''
    result.image = typeof item.image === 'string' && item.image.length <= 600000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(item.image) ? item.image : ''
    return result
  })
}
