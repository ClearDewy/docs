#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const CONDITIONS = '供个人摄影观察与练习。保留摄影师及 Pexels 来源；不得出售未经修改的复制品、冒充背书、损害可识别人物，或转售到图库/壁纸平台。人物、商标及其他权利另行核验。使用前复核当前许可与 API 条款。'
export function allowedUrl(value, host) {
  try { const u = new URL(value); if (u.protocol !== 'https:' || u.hostname !== host || u.username || u.password || (u.port && u.port !== '443')) throw new Error(); return u.href } catch { throw new Error(`响应含非预期 ${host} 地址`) }
}
export function normalizeResponse(raw, { query, now = new Date().toISOString(), fixture = false } = {}) {
  if (!raw || !Array.isArray(raw.photos) || raw.photos.length > 30) throw new Error('API 响应 photos 无效或超过本工具 30 条限制')
  const seen = new Set()
  const items = raw.photos.map(photo => {
    if (!Number.isSafeInteger(photo.id) || photo.id < 1 || seen.has(photo.id) || typeof photo.photographer !== 'string' || !photo.photographer.trim()) throw new Error('API 响应照片 id / 作者无效或重复')
    if (![photo.width, photo.height].every(v => Number.isSafeInteger(v) && v > 0 && v <= 100000)) throw new Error('API 响应照片尺寸无效')
    seen.add(photo.id)
    return { id: `pexels-${photo.id}`, title: String(photo.alt || `Pexels ${photo.id}`).slice(0, 500), author: photo.photographer.slice(0, 300), url: allowedUrl(photo.url, 'www.pexels.com'), authorUrl: allowedUrl(photo.photographer_url, 'www.pexels.com'), imageUrl: allowedUrl(photo.src?.medium, 'images.pexels.com'), width: photo.width, height: photo.height, observation: '', idea: '', license: 'Pexels License', licenseUrl: 'https://www.pexels.com/license/', conditions: CONDITIONS }
  })
  return { schema: 'photography-materials-v1', provider: 'Pexels', providerUrl: 'https://www.pexels.com', query, collectedAt: now, fixture, documentation: 'https://www.pexels.com/api/documentation/', items }
}
export function parseArgs(args) {
  const options = { query: 'mountain lake', limit: 6, out: './photography-materials', fixture: '', download: false }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--download') { options.download = true; continue }
    const key = { '--query': 'query', '--limit': 'limit', '--out': 'out', '--fixture': 'fixture' }[arg]
    if (!key || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`未知参数或缺少值：${arg}`)
    options[key] = args[++i]
  }
  options.limit = Number(options.limit)
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 30) throw new Error('--limit 必须为 1–30 整数')
  if (!options.query.trim() || options.query.length > 200) throw new Error('--query 需为 1–200 字符')
  if (options.download && options.limit > 6) throw new Error('--download 模式最多 6 条，以保证含图片清单可导入浏览器；请分批使用不同输出目录')
  if (options.fixture && options.download) throw new Error('fixture 模式禁止网络下载，使用真实 API 时再加 --download')
  return options
}
async function boundedBody(response, max) {
  const reader = response.body?.getReader(); if (!reader) throw new Error('响应没有正文')
  const chunks = []; let bytes = 0
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > max) { await reader.cancel(); throw new Error('响应超过大小限制') } chunks.push(Buffer.from(value)) }
  return Buffer.concat(chunks)
}
export async function collect(options, { fetcher = fetch, key = process.env.PEXELS_API_KEY } = {}) {
  let raw
  if (options.fixture) raw = JSON.parse(await readFile(resolve(options.fixture), 'utf8'))
  else {
    if (!key?.trim()) throw new Error('缺少环境变量 PEXELS_API_KEY；可先使用 --fixture 离线验证')
    const url = new URL('https://api.pexels.com/v1/search'); url.searchParams.set('query', options.query); url.searchParams.set('per_page', String(options.limit)); url.searchParams.set('page', '1')
    const response = await fetcher(url, { headers: { Authorization: key }, redirect: 'error', signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw new Error(response.status === 429 ? 'Pexels 限流（429）：停止本次采集，稍后按配额重试' : `Pexels API 返回 HTTP ${response.status}`)
    raw = JSON.parse((await boundedBody(response, 2 * 1024 * 1024)).toString('utf8'))
  }
  const manifest = normalizeResponse(raw, { query: options.query, fixture: Boolean(options.fixture) })
  manifest.items = manifest.items.slice(0, options.limit)
  const out = resolve(options.out); await mkdir(out, { recursive: true })
  if (options.download) {
    for (const item of manifest.items) {
      // The Authorization header is never forwarded to the image host. No pagination, redirects or arbitrary URLs.
      const response = await fetcher(item.imageUrl, { redirect: 'error', signal: AbortSignal.timeout(20000) })
      if (!response.ok) throw new Error(`缩略图下载失败 HTTP ${response.status}`)
      const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[response.headers.get('content-type')?.split(';')[0]]
      if (!ext) throw new Error('缩略图响应不是 JPEG / PNG / WebP')
      const body = await boundedBody(response, 2 * 1024 * 1024)
      if (body.length > 400000) throw new Error('单张缩略图超过 400KB 内嵌上限；停止下载，请在来源页面选择更小图片后手动添加')
      const filename = `${item.id}.${ext}`; await writeFile(join(out, filename), body, { flag: 'wx' }); item.localFile = filename
      item.image = `data:${response.headers.get('content-type').split(';')[0]};base64,${body.toString('base64')}`
    }
  }
  await writeFile(join(out, 'materials.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' })
  await writeFile(join(out, 'ATTRIBUTION.md'), ['# Photos provided by Pexels', '', 'https://www.pexels.com', '', `检索：${options.query}`, `采集时间：${manifest.collectedAt}`, `离线 fixture：${manifest.fixture}`, '', CONDITIONS, '', ...manifest.items.map(i => `- ${i.title} / ${i.author}\n  来源：${i.url}\n  作者：${i.authorUrl}\n  许可：${i.licenseUrl}\n  文件：${i.localFile || '仅记录来源链接'}`)].join('\n'), { flag: 'wx' })
  return manifest
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { const opts = parseArgs(process.argv.slice(2)); const result = await collect(opts); console.log(`已保存 ${result.items.length} 条${result.fixture ? '离线示例' : 'Pexels 参考'}至 ${resolve(opts.out)}；来源和许可见 ATTRIBUTION.md`) } catch (error) { console.error(`采集失败：${error.message}`); process.exitCode = 1 }
}
