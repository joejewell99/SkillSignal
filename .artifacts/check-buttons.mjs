import { writeFile } from 'node:fs/promises';
const page = await fetch('http://127.0.0.1:9224/json/new?http://localhost:5173/', {method:'PUT'}).then(r=>r.json());
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true})).result.value;
await call('Page.enable');await call('DOM.enable');await call('CSS.enable');
await new Promise(r=>setTimeout(r,1800));
console.log(await evaluate(`JSON.stringify({url:location.href,hover:matchMedia('(hover:hover)').matches,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,theme:document.documentElement.dataset.theme,buttons:[...document.querySelectorAll('.hero-actions a,.hero-copy-frame a')].map(e=>({text:e.textContent,class:e.className}))})`));
const {root}=await call('DOM.getDocument');
for(const selector of ['.hero-copy-frame .primary-button','.hero-copy-frame .secondary-button']){
 const {nodeId}=await call('DOM.querySelector',{nodeId:root.nodeId,selector});
 if(!nodeId){console.log('missing',selector);continue;}
 for(const state of [[],['hover'],['hover','active']]){
 await call('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:state});await new Promise(r=>setTimeout(r,250));
 console.log(selector,state,await evaluate(`JSON.stringify((()=>{let s=getComputedStyle(document.querySelector('${selector}'));return {color:s.color,shadow:s.boxShadow,transform:s.transform,border:s.borderColor,transition:s.transition}})())`));
 }
 await call('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]});
}
await writeFile('.artifacts/button-audit-page.json',JSON.stringify(page));
ws.close();
