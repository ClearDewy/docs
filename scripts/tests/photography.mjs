import assert from 'node:assert/strict'
import { baseline, controls, decodeSRGB, encodeSRGB, histogram, hslToRgb, processPixels, rgbToHsl, validateBoard, validateProject } from '../../docs/.vitepress/theme/visualizations/photography/pixels.mjs'
const input = new Uint8ClampedArray([0,0,0,255, 64,64,64,255, 128,128,128,255, 255,0,0,255, 255,255,255,255, 50,80,30,0])
assert.deepEqual(processPixels(input,baseline()),input,'identity must retain every channel and alpha exactly')
const settings=baseline();settings.exposure.value=1
const bright=processPixels(input,settings)
assert(bright[4]>input[4]);assert.equal(bright[4],Math.round(255*encodeSRGB(2*decodeSRGB(64/255))));assert.equal(bright[19],255)
settings.exposure.enabled=false;assert.deepEqual(processPixels(input,settings),input)
const warm=baseline();warm.temperature.value=40;const warmed=processPixels(input,warm);assert(warmed[8]>warmed[10],'warm neutral must gain red vs blue')
const gray=baseline();gray.saturation.value=-100;const grayed=processPixels(input,gray);assert.equal(grayed[12],grayed[13]);assert.equal(grayed[13],grayed[14]);assert.equal(grayed[23],0)
for(const rgb of [[1,0,0],[0,1,0],[0,0,1],[.2,.4,.7],[.6,.6,.6]]) { const roundtrip=hslToRgb(...rgbToHsl(...rgb));roundtrip.forEach((v,i)=>assert(Math.abs(v-rgb[i])<1e-10)) }
const hist=histogram(input);assert.equal(hist.count,5);assert.equal(hist.bins.reduce((a,b)=>a+b,0),5);assert.equal(hist.dark,1);assert.equal(hist.bright,1)
const project={schema:'photography-lab-v1',image:'data:image/png;base64,aGVsbG8=',name:'test',versions:{A:{intent:'calm',settings:baseline()},B:{intent:'warm',settings:baseline()}}}
assert.equal(validateProject(JSON.parse(JSON.stringify(project))).versions.A.intent,'calm');assert.equal(validateProject({...project,active:'B',compare:'ab'}).active,'B');assert.equal(validateProject({...project,active:'B',compare:'ab'}).compare,'ab');assert.throws(()=>validateProject({...project,image:'https://evil.test/image.png'}));project.versions.A.settings.hue.value=Infinity;assert.throws(()=>validateProject(project))
assert.throws(()=>validateBoard({schema:'photography-board-v1',items:[{url:'javascript:alert(1)'}]}));assert.throws(()=>validateBoard({schema:'photography-board-v1',items:[{url:'https://user:secret@example.com'}]}))
assert.equal(validateBoard({schema:'photography-materials-v1',items:[{url:'https://www.pexels.com/photo/1/',author:'A'}]})[0].author,'A')
for(const control of controls){
  const maxed=baseline();maxed[control.key]={value:control.max,enabled:false};assert.deepEqual(processPixels(input,maxed),input,`disabled ${control.key} must preserve original`)
  maxed[control.key].enabled=true;const output=processPixels(input,maxed);for(let i=3;i<output.length;i+=4)assert.equal(output[i],input[i],'all stages must retain alpha')
}
assert.equal(histogram(new Uint8ClampedArray([255,255,255,0])).count,0)
for(const value of [0,.01,.04,.18,.5,1])assert(Math.abs(decodeSRGB(encodeSRGB(value))-value)<1e-12)
console.log('photography: identity, linear gain, disabled stage, warm balance, HSL roundtrip, alpha, histogram and import boundaries passed')
