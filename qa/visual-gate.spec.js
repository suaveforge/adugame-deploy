const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT=path.join(__dirname,'reports','visual-gate');
fs.mkdirSync(OUT,{recursive:true});
const frames=[];

async function rect(page){return page.locator('canvas').boundingBox();}
function map(r,x,y){return {x:r.x+x/1280*r.width,y:r.y+y/720*r.height};}
async function clickL(page,r,x,y){const p=map(r,x,y);await page.mouse.click(p.x,p.y);}
async function livePoint(page,key){return page.evaluate(k=>{const s=window.__ADUGAME_SCENE__?.(),o=s?.[k];return o?{x:o.x,y:o.y}:null;},key);}
async function liveKind(page,collection,kind){return page.evaluate(({collection,kind})=>{const s=window.__ADUGAME_SCENE__?.(),o=(s?.[collection]||[]).find(x=>x?.kind===kind&&x?.active!==false);return o?{x:o.x,y:o.y}:null;},{collection,kind});}
async function liveNails(page){return page.evaluate(()=>{const s=window.__ADUGAME_SCENE__?.();return (s?.nails||[]).filter(n=>n?.active!==false).map(n=>({x:n.x,y:n.y,index:n.nailIndex}));});}
async function dragL(page,r,points,duration=240){
  const ps=points.map(([x,y])=>map(r,x,y));
  await page.mouse.move(ps[0].x,ps[0].y);await page.mouse.down();
  const pause=Math.max(12,Math.floor(duration/Math.max(1,ps.length-1)));
  for(let i=1;i<ps.length;i++){await page.mouse.move(ps[i].x,ps[i].y);await page.waitForTimeout(pause);}
  await page.mouse.up();
}
function circle(cx,cy,r,turns=3,steps=4,start=-Math.PI/2){const pts=[];for(let i=0;i<=turns*steps;i++){const a=start+2*Math.PI*i/steps;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return pts;}
async function waitFor(page,fn,timeout=12000,arg=null){return page.waitForFunction(fn,arg,{timeout});}
async function waitG1R2Final(page){await waitFor(page,()=>{const r=document.getElementById('g1r2-v17-overlay');return r?.dataset.ready==='1'&&r?.dataset.uxReady==='1'&&r?.dataset.uxAlignmentReady==='1'&&r?.dataset.finalAlertReady==='1'&&r?.dataset.gameFeelReady==='1'&&r?.dataset.version==='17.32'&&window.__ADUGAME_ART_SOURCE__?.G1R2?.version==='v17.32';},18000);}
async function openRound(page,g,r){
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`/index.html?game=${g}&round=${r}&e2e=1`,{waitUntil:'networkidle'});
  await waitFor(page,()=>window.__ADUGAME_DEBUG__&&window.__ADUGAME_DEBUG__()?.key);
  const rct=await rect(page);expect(rct).toBeTruthy();return {rct,errors};
}
function inter(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),r=Math.min(a.x+a.w,b.x+b.w),bt=Math.min(a.y+a.h,b.y+b.h);return r<=x||bt<=y?0:(r-x)*(bt-y);}
function ratio(a,b){return inter(a,b)/Math.max(1,Math.min(a.w*a.h,b.w*b.h));}
function related(a,b){if(a.id===b.id)return true;if(a.parent!==null&&a.parent===b.parent)return true;return a.anc.includes(b.id)||b.anc.includes(a.id);}
function decorativeText(n){const s=(n.text||'').trim();return !s||/^[✦★✧☝]+$/.test(s);}
function resource(n){
  if(n.type==='Text'||!n.hasBounds||n.depth>=9997)return false;
  const name=n.name||'';
  if(n.type==='Zone'||name==='slime_tactile_zone'||name.startsWith('color_hit_'))return false;
  if(name==='tidy_box'||name==='meal_plate'||name.startsWith('fixture_'))return false;
  if(n.type==='Rectangle'&&!name&&!n.kind)return false;
  return n.interactive||!!name||!!n.kind;
}
function instruction(n){
  if(n.type!=='Text'||n.parent!==null||decorativeText(n)||n.depth>=9997)return false;
  const s=(n.text||'').trim();
  if(s==='⌂'||/ROUND \d/.test(s)||s.startsWith('생활 실습')||s.startsWith('인터랙티브 하우스')||s.startsWith('크래프트 스토어'))return false;
  return n.y>105;
}

async function audit(page,label,{complete=false}={}){
  if(complete)await page.waitForTimeout(1950);
  const snap=await page.evaluate(()=>{
    const s=window.__ADUGAME_SCENE__?.();if(!s)return {nodes:[],state:null};
    let id=0;const nodes=[];
    const walk=(o,parent=null,anc=[],pv=true,pa=1)=>{
      if(!o)return;const my=id++;const ownVisible=o.visible!==false;const alpha=Number.isFinite(Number(o.alpha))?Number(o.alpha):1;const effectiveVisible=pv&&ownVisible&&pa*alpha>.02;
      let b=null;try{b=o.getBounds?.();}catch(_){}
      const hasBounds=!!(b&&Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isFinite(b.width)&&Number.isFinite(b.height));
      nodes.push({id:my,parent,anc,name:o.name||'',kind:o.kind||'',state:o.state||'',type:o.type||o.constructor?.name||'unknown',text:(o.type==='Text'||o.constructor?.name==='Text')?String(o.text||''):'',interactive:!!o.input?.enabled,effectiveVisible,depth:Number(o.depth)||0,hasBounds,x:hasBounds?b.x:0,y:hasBounds?b.y:0,w:hasBounds?b.width:0,h:hasBounds?b.height:0});
      if(Array.isArray(o.list))for(const c of o.list)walk(c,my,[...anc,my],effectiveVisible,pa*alpha);
    };
    for(const o of s.children.list)walk(o);
    return {nodes,state:s.debugState?.()||null,interactionLocked:!!s.interactionLocked};
  });
  const issues=[];
  const visible=snap.nodes.filter(n=>n.effectiveVisible&&n.hasBounds&&n.w>1&&n.h>1);

  for(const n of snap.nodes){
    if(n.interactive&&!n.effectiveVisible)issues.push({kind:'hidden-interactive',target:n.name||n.kind||n.type,depth:n.depth});
  }

  if(!complete){
    const texts=visible.filter(n=>n.type==='Text'&&!decorativeText(n));
    const resources=visible.filter(resource);
    for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
      const a=texts[i],b=texts[j];if(related(a,b))continue;const q=ratio(a,b);
      if(q>.08)issues.push({kind:'text-text',a:a.text,b:b.text,ratio:+q.toFixed(3)});
    }
    for(const t of texts)for(const o of resources){
      if(related(t,o))continue;const area=inter(t,o);if(!area)continue;const q=area/Math.max(1,t.w*t.h);
      if(q>.28){
        issues.push({kind:'text-resource',text:t.text,target:o.name||o.kind||o.type,ratio:+q.toFixed(3)});
        if(instruction(t)&&o.interactive)issues.push({kind:'instruction-target',text:t.text,target:o.name||o.kind||o.type,ratio:+q.toFixed(3)});
      }
    }
    const active=resources.filter(n=>n.interactive);
    for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
      const a=active[i],b=active[j];if(related(a,b))continue;
      const tasted=(a.state==='tasted'&&b.kind==='character')||(b.state==='tasted'&&a.kind==='character');if(tasted)continue;
      const q=ratio(a,b);if(q>.35)issues.push({kind:'resource-resource',a:a.name||a.kind||a.type,b:b.name||b.kind||b.type,ratio:+q.toFixed(3)});
    }
  }

  if(complete&&snap.state?.roundComplete){
    const overlay=visible.find(n=>n.interactive&&n.depth===9997&&n.w>=1200&&n.h>=680);
    if(!overlay)issues.push({kind:'modal-world-interference',reason:'missing full-screen result overlay'});
    const worldInputs=snap.nodes.filter(n=>n.interactive&&n.depth<9997);
    if(worldInputs.length)issues.push({kind:'modal-world-interference',reason:'world input enabled behind modal',targets:worldInputs.map(n=>n.name||n.kind||n.type)});
    const leftovers=visible.filter(n=>n.depth>=1000&&n.depth<9997&&!decorativeText(n)&&(n.type==='Text'||n.interactive||n.name||n.kind));
    for(const n of leftovers)issues.push({kind:'leftover-after-complete',target:n.text||n.name||n.kind||n.type,depth:n.depth});
  }

  await page.locator('canvas').screenshot({path:path.join(OUT,label.replace(/[^A-Za-z0-9_-]/g,'_')+'.png')});
  frames.push({label,state:snap.state,interactionLocked:snap.interactionLocked,issues});
}
async function completeAndAudit(page,errors,label){await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.roundComplete===true,18000);await waitFor(page,()=>{const s=window.__ADUGAME_SCENE__?.();return !!s?.children?.list?.find(o=>o?.depth===9997&&o?.input?.enabled&&o?.width>=1200&&o?.height>=680);},5000);expect(errors).toEqual([]);await audit(page,label,{complete:true});}

async function mixBase(p,r,colorX,label){
  const color=colorX===210?'blue':colorX===325?'green':'pink';
  await dragL(p,r,[[230,230],[650,420]],180);await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.ingredients?.includes('base'),7000);
  await dragL(p,r,[[360,230],[650,420]],180);await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.ingredients?.includes('activator'),7000);await audit(p,`${label}_ingredients`);
  await clickL(p,r,colorX,355);await waitFor(p,c=>window.__ADUGAME_DEBUG__()?.chosen?.color===c,5000,color);await audit(p,`${label}_color`);
  await dragL(p,r,circle(650,420,90,3.2,4),1900);await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.mixed===true,7000);await audit(p,`${label}_mixed`);
}
async function craftOrder(p,r,{colorX,decoX,containerX=null,extraX=null},served,label){
  await mixBase(p,r,colorX,label);await dragL(p,r,[[decoX,485],[650,420]],190);if(extraX!==null)await dragL(p,r,[[extraX,485],[690,440]],190);if(containerX!==null)await clickL(p,r,containerX,585);await audit(p,`${label}_decorated`);
  await clickL(p,r,870,630);await waitFor(p,n=>window.__ADUGAME_DEBUG__()?.ordersServed>=n||window.__ADUGAME_DEBUG__()?.roundComplete===true,9000,served);await p.waitForTimeout(250);await audit(p,`${label}_served`);
  if(!(await p.evaluate(()=>window.__ADUGAME_DEBUG__()?.roundComplete===true)))await waitFor(p,n=>{const s=window.__ADUGAME_DEBUG__(),sc=window.__ADUGAME_SCENE__();return s.orderIndex===n&&s.ingredients.length===0&&!s.mixed&&!sc.interactionLocked&&!!sc.mixZone?.input?.enabled;},7000,served);
}

test('visual-gate G1R1',async({page})=>{
  const {rct:r,errors}=await openRound(page,1,1);await audit(page,'G1R1_initial');
  const toilet=await livePoint(page,'toilet');expect(toilet).toBeTruthy();await clickL(page,r,toilet.x,toilet.y);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===.5,8000);await audit(page,'G1R1_toilet');
  const flush=await livePoint(page,'flush');expect(flush).toBeTruthy();await clickL(page,r,flush.x,flush.y);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===1,8000);
  const faucet=await livePoint(page,'faucet');expect(faucet).toBeTruthy();await clickL(page,r,faucet.x,faucet.y);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===2,8000);
  const soap=await livePoint(page,'soap'),hands=await livePoint(page,'hands');expect(soap).toBeTruthy();expect(hands).toBeTruthy();await dragL(page,r,[[soap.x,soap.y],[hands.x,hands.y]],220);await page.waitForTimeout(260);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===3,8000);await audit(page,'G1R1_soap');
  const h=await livePoint(page,'hands');expect(h).toBeTruthy();await dragL(page,r,[[h.x-70,h.y],[h.x,h.y],[h.x+70,h.y],[h.x,h.y],[h.x-70,h.y],[h.x,h.y],[h.x+70,h.y],[h.x,h.y],[h.x-70,h.y]],760);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===4,8000);await audit(page,'G1R1_scrub');
  const rinse=await livePoint(page,'faucet');expect(rinse).toBeTruthy();await clickL(page,r,rinse.x,rinse.y);await completeAndAudit(page,errors,'G1R1_complete');
});

test('visual-gate G1R2',async({page},testInfo)=>{
  testInfo.setTimeout(300000);
  const {rct:r,errors}=await openRound(page,1,2);await waitG1R2Final(page);await page.waitForTimeout(120);await audit(page,'G1R2_initial');
  const paste=await livePoint(page,'paste'),pasteTarget=await livePoint(page,'brush');expect(paste).toBeTruthy();expect(pasteTarget).toBeTruthy();await dragL(page,r,[[paste.x,paste.y],[pasteTarget.x,pasteTarget.y]],360);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===1,8000);await page.waitForTimeout(120);await audit(page,'G1R2_paste');
  const brushPaths=[[[765,485],[800,485],[755,500],[800,500],[755,485],[800,485],[755,500]],[[850,485],[895,485],[845,500],[895,500],[845,485],[895,485],[845,500]],[[765,535],[800,535],[755,555],[800,555],[755,535],[800,535],[755,555]],[[850,535],[895,535],[845,555],[895,555],[845,535],[895,535],[845,555]]];
  for(let i=0;i<brushPaths.length;i++){const brush=await livePoint(page,'brush');expect(brush).toBeTruthy();await dragL(page,r,[[brush.x,brush.y],...brushPaths[i]],620);if(i<3)await waitFor(page,n=>(window.__ADUGAME_SCENE__().mouthProgress?.[n]||0)>=115,8000,i);}
  await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===2,8000);await page.waitForTimeout(120);await audit(page,'G1R2_brushed');
  const cloth=await livePoint(page,'cloth');expect(cloth).toBeTruthy();const faceLoop=[[790,330],[735,330],[845,330],[735,345],[845,345],[735,315],[845,315],[790,330]],facePts=[[cloth.x,cloth.y]];for(let i=0;i<4;i++)facePts.push(...faceLoop);await dragL(page,r,facePts,1500);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===3,8000);await page.waitForTimeout(120);await audit(page,'G1R2_face');
  const nails=await liveNails(page);expect(nails.length).toBe(5);for(let i=0;i<nails.length;i++){const clipper=await livePoint(page,'clipper');expect(clipper).toBeTruthy();await dragL(page,r,[[clipper.x,clipper.y],[nails[i].x,nails[i].y]],260);await waitFor(page,n=>window.__ADUGAME_SCENE__().clipped?.size>=n,8000,i+1);await page.waitForTimeout(80);}await completeAndAudit(page,errors,'G1R2_complete');
});

test('visual-gate G1R3',async({page})=>{
  const {rct:r,errors}=await openRound(page,1,3);await audit(page,'G1R3_initial');
  const toyKinds=['ball','book','block'];
  for(const kind of toyKinds){const q=await liveKind(page,'toys',kind);expect(q,`missing live toy ${kind}`).toBeTruthy();await dragL(page,r,[[q.x,q.y],[255,465]],160);await waitFor(page,k=>window.__ADUGAME_DEBUG__()?.tidied?.includes(k),8000,kind);}
  await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===1,8000);await audit(page,'G1R3_toys');
  const foodKinds=['apple','carrot','wholegrain'];
  for(const kind of foodKinds){const q=await liveKind(page,'foods',kind);expect(q,`missing live food ${kind}`).toBeTruthy();await dragL(page,r,[[q.x,q.y],[735,475]],170);await waitFor(page,k=>window.__ADUGAME_DEBUG__()?.chosen?.includes(k),8000,kind);}
  await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.step===2,8000);await audit(page,'G1R3_food');
  for(const kind of foodKinds){const q=await liveKind(page,'foods',kind);expect(q,`missing chosen food ${kind}`).toBeTruthy();await dragL(page,r,[[q.x,q.y],[1040,330]],170);await waitFor(page,k=>window.__ADUGAME_DEBUG__()?.fed?.includes(k),8000,kind);}
  await completeAndAudit(page,errors,'G1R3_complete');
});

test('visual-gate G2R1',async({page})=>{
  const {rct:r,errors}=await openRound(page,2,1);await audit(page,'G2R1_initial');await dragL(page,r,[[315,628],[980,500]],180);await page.waitForTimeout(160);await audit(page,'G2R1_character');await dragL(page,r,[[330,205],[690,330]],170);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.cooked===true,5000);await page.waitForTimeout(150);await audit(page,'G2R1_cooked');const pos=await page.evaluate(()=>{const s=window.__ADUGAME_SCENE__();const b=s.items.find(o=>o.kind==='bread'&&o.floor===1);const c=s.characters.find(o=>!o.inDock&&!o.inElevator&&o.floor===1);return {b:[b.x,b.y],c:[c.x,c.y]};});await dragL(page,r,[pos.b,pos.c],170);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.milestone===true,5000);await audit(page,'G2R1_fed');await clickL(page,r,650,555);await completeAndAudit(page,errors,'G2R1_complete');
});

test('visual-gate G2R2',async({page})=>{
  const {rct:r,errors}=await openRound(page,2,2);await audit(page,'G2R2_initial');await clickL(page,r,650,345);await page.waitForTimeout(120);await audit(page,'G2R2_open');for(const q of [[330,205],[412,205],[494,205]]){await dragL(page,r,[q,[650,345]],160);await page.waitForTimeout(150);}await audit(page,'G2R2_loaded');await clickL(page,r,650,345);await clickL(page,r,650,345);await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.loaded===3,6000);await page.waitForTimeout(1450);await audit(page,'G2R2_washed');for(const q of [[760,520],[818,520],[876,520]]){await dragL(page,r,[q,[930,420]],160);await page.waitForTimeout(150);}await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.milestone===true,5000);await audit(page,'G2R2_dried');await clickL(page,r,650,555);await completeAndAudit(page,errors,'G2R2_complete');
});

test('visual-gate G2R3',async({page})=>{
  const {rct:r,errors}=await openRound(page,2,3);await audit(page,'G2R3_initial');let i=0;for(const q of [[330,205],[412,205],[494,205]]){await dragL(page,r,[q,[720,405]],160);await page.waitForTimeout(160);i++;await audit(page,`G2R3_part${i}`);}await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.milestone===true,5000);await clickL(page,r,650,555);await completeAndAudit(page,errors,'G2R3_complete');
});

for(const [rnd,orders] of [[1,[{colorX:210,decoX:210},{colorX:440,decoX:400}]],[2,[{colorX:325,decoX:305,containerX:230},{colorX:210,decoX:210,containerX:380},{colorX:440,decoX:400,containerX:230}]],[3,[{colorX:210,decoX:210,extraX:495},{colorX:325,decoX:305},{colorX:440,decoX:400}]]]){
  test(`visual-gate G3R${rnd}`,async({page})=>{
    const {rct:r,errors}=await openRound(page,3,rnd);await audit(page,`G3R${rnd}_initial`);let served=0;for(const order of orders){served++;await craftOrder(page,r,order,served,`G3R${rnd}_O${served}`);}await completeAndAudit(page,errors,`G3R${rnd}_complete`);
  });
}

test.afterAll(async()=>{
  const all=frames.flatMap(f=>f.issues.map(i=>({label:f.label,...i})));
  const summary=all.reduce((m,i)=>{m[i.kind]=(m[i.kind]||0)+1;return m;},{});
  fs.mkdirSync(path.join(__dirname,'reports'),{recursive:true});fs.writeFileSync(path.join(__dirname,'reports','visual-gate.json'),JSON.stringify({summary,frames},null,2));
  console.log('ADUGAME_VISUAL_GATE_SUMMARY',JSON.stringify(summary));
  if(all.length)console.log('ADUGAME_VISUAL_GATE_ISSUES',JSON.stringify(all.slice(0,120)));
  expect(all,'unintended visual/input conflicts must be zero').toEqual([]);
});