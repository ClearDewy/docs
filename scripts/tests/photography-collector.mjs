import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { allowedUrl, collect, normalizeResponse, parseArgs } from '../photography/collect-pexels.mjs'
import { validateBoard } from '../../docs/.vitepress/theme/visualizations/photography/pixels.mjs'
const fixture='scripts/photography/fixtures/pexels-search.json'
const raw=JSON.parse(await readFile(fixture,'utf8'))
assert.equal(normalizeResponse(raw,{query:'rock'}).items[0].author,'Joey Farina')
assert.throws(()=>allowedUrl('https://images.pexels.com.evil.test/a','images.pexels.com'))
assert.throws(()=>allowedUrl('http://images.pexels.com/a','images.pexels.com'))
assert.throws(()=>parseArgs(['--limit','1000']));assert.throws(()=>parseArgs(['--limit','7','--download']));assert.throws(()=>parseArgs(['--fixture',fixture,'--download']))
assert.throws(()=>normalizeResponse({photos:[raw.photos[0],raw.photos[0]]}))
const dir=await mkdtemp(join(tmpdir(),'photography-test-'))
try {
  const manifest=await collect(parseArgs(['--fixture',fixture,'--out',join(dir,'offline')]),{fetcher:()=>{throw new Error('offline fixture attempted network')},key:undefined})
  assert.equal(manifest.fixture,true);assert.equal(validateBoard(manifest).length,1);assert.match(await readFile(join(dir,'offline/ATTRIBUTION.md'),'utf8'),/Joey Farina/)
  const calls=[]
  await collect(parseArgs(['--query','golden hour','--out',join(dir,'api')]),{key:'test-key',fetcher:async(url,opts)=>{calls.push({url:String(url),opts});return new Response(JSON.stringify(raw),{status:200})}})
  assert.equal(calls.length,1);assert.equal(new URL(calls[0].url).hostname,'api.pexels.com');assert.equal(calls[0].opts.headers.Authorization,'test-key');assert.equal(calls[0].opts.redirect,'error')
  assert(!JSON.stringify(JSON.parse(await readFile(join(dir,'api/materials.json'),'utf8'))).includes('test-key'))
  const downloadCalls=[]
  const downloaded=await collect(parseArgs(['--limit','1','--download','--out',join(dir,'images')]),{key:'download-key',fetcher:async(url,opts)=>{
    downloadCalls.push({url:String(url),opts});
    if(new URL(url).hostname==='api.pexels.com')return new Response(JSON.stringify(raw),{status:200});
    return new Response(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX2sAAAAASUVORK5CYII=','base64'),{status:200,headers:{'content-type':'image/png'}})
  }})
  assert.equal(downloadCalls.length,2);assert.equal(downloadCalls[1].opts.headers,undefined,'API key must not reach image host');assert.match(downloaded.items[0].image,/^data:image\/png;base64,/)
  const imported=validateBoard(downloaded);assert.equal(imported[0].provider,'Pexels');assert.equal(imported[0].collectedAt,downloaded.collectedAt);assert.equal(imported[0].sourceId,'pexels-2014422');assert(imported[0].image)
  const roundtrip=validateBoard({schema:'photography-board-v1',items:imported});assert.equal(roundtrip[0].sourceId,'pexels-2014422');assert.equal(roundtrip[0].collectedAt,downloaded.collectedAt)
  await assert.rejects(()=>collect(parseArgs(['--out',join(dir,'limit')]),{key:'test',fetcher:async()=>new Response('',{status:429})}),/限流/)
  await assert.rejects(()=>collect(parseArgs([]),{key:''}),/PEXELS_API_KEY/)
}finally{await rm(dir,{recursive:true,force:true})}
console.log('photography collector: offline fixture, source/author, manifest roundtrip, bounded API, no secret output, 429 and input validation passed')
