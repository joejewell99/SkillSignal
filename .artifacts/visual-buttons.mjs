import {readFile,writeFile} from 'node:fs/promises';
const page=JSON.parse(await readFile('.artifacts/button-audit-page.json','utf8'));
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m.result);pending.delete(m.id)}});
const call=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}))});
const evalJS=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true})).result.value;
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
for(const theme of ['dark','light']){
await evalJS(`document.documentElement.dataset.theme='${theme}'`);
for(const selector of ['.hero-copy-frame .primary-button','.hero-copy-frame .secondary-button']){
const box=await evalJS(`(()=>{let e=document.querySelector('${selector}');e.scrollIntoView({block:'center',behavior:'instant'});let r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
await call('Input.dispatchMouseEvent',{type:'mouseMoved',...box});await new Promise(r=>setTimeout(r,250));
console.log(theme,selector,await evalJS(`(()=>{let e=document.querySelector('${selector}'),s=getComputedStyle(e);return {hover:e.matches(':hover'),shadow:s.boxShadow,transform:s.transform}})()`));
if(theme==='dark'){
const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile('.artifacts/'+(selector.includes('secondary')?'secondary-hover':'primary-hover')+'.png',Buffer.from(shot.data,'base64'));
}
}
}
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
console.log('reduced',await evalJS(`getComputedStyle(document.querySelector('.hero-copy-frame .secondary-button')).transform`));
await call('Emulation.setEmulatedMedia',{features:[]});await evalJS("document.documentElement.dataset.theme='dark'");
ws.close();

