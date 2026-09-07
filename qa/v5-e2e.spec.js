const { test, expect } = require('@playwright/test');

async function rect(page){ return page.locator('canvas').boundingBox(); }
function map(r,x,y){ return {x:r.x + x/1280*r.width, y:r.y + y/720*r.height}; }
async function clickL(page,r,x,y){ const p=map(r,x,y); await page.mouse.click(p.x,p.y); }
async function livePoint(page,key){ return page.evaluate(k=>{const s=window.__ADUGAME_SCENE__?.(),o=s?.[k];return o?{x:o.x,y:o.y}:null;},key); }
async function liveNails(page){ return page.evaluate(()=>{const s=window.__ADUGAME_SCENE__?.();return (s?.nails||[]).filter(n=>n?.active!==false).map(n=>({x:n.x,y:n.y,index:n.nailIndex}));}); }
async function dragL(page,r,points,duration=240){
  const ps=points.map(([x,y])=>map(r,x,y));
  await page.mouse.move(ps[0].x,ps[0].y); await page.mouse.down();
  const pause=Math.max(12,Math.floor(duration/Math.max(1,ps.length-1)));
  for(let k=1;k<ps.length;k++){await page.mouse.move(ps[k].x,ps[k].y);await page.waitForTimeout(pause);}
  await page.mouse.up();
}
function circle(cx,cy,r,turns=3,steps=4,start=-Math.PI/2){const pts=[];for(let i=0;i<=turns*steps;i++){const a=start+2*Math.PI*i/steps;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return pts;}
async function waitFor(page,fn,timeout=12000,arg=null){return page.waitForFunction(fn,arg,{timeout});}
async function waitG1R2Final(page){await waitFor(page,()=>{const r=document.getElementById('g1r2-v17-overlay');return r?.dataset.ready==='1'&&r?.dataset.uxReady==='1'&&r?.dataset.uxAlignmentReady==='1'&&r?.dataset.finalAlertReady==='1'&&r?.dataset.gameFeelReady==='1'&&r?.dataset.version==='17.32'&&window.__ADUGAME_ART_SOURCE__?.G1R2?.version==='v17.32';},18000);}
async function openRound(page,g,r){
  const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`/index.html?game=${g}&round=${r}&e2e=1`,{waitUntil:'networkidle'});
  await waitFor(page,()=>window.__ADUGAME_DEBUG__ && window.__ADUGAME_DEBUG__()?.key);
  const rct=await rect(page); expect(rct).toBeTruthy(); return {rct,errors};
}
async function expectComplete(page,errors){
  try{await waitFor(page,()=>window.__ADUGAME_DEBUG__()?.roundComplete===true,18000);}catch(e){console.log('V5_WAIT_FAIL',JSON.stringify(await page.evaluate(()=>window.__ADUGAME_DEBUG__?.())));throw e;}
  const st=await page.evaluate(()=>window.__ADUGAME_DEBUG__());expect(st.roundComplete).toBe(true);expect(errors).toEqual([]);return st;
}
async function mixBase(p,r,colorX){
  const color=colorX===210?'blue':colorX===325?'green':'pink';
  await dragL(p,r,[[230,230],[650,420]],180);
  await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.ingredients?.includes('base'),7000);
  await dragL(p,r,[[360,230],[650,420]],180);
  await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.ingredients?.includes('activator'),7000);
  await clickL(p,r,colorX,355);
  await waitFor(p,c=>window.__ADUGAME_DEBUG__()?.chosen?.color===c,5000,color);
  await dragL(p,r,circle(650,420,90,3.2,4),1900);
  try{await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.mixed===true,7000);}catch(e){console.log('V5_MIX_FAIL',JSON.stringify(await p.evaluate(()=>window.__ADUGAME_DEBUG__?.())));throw e;}
}
async function craftOrder(p,r,{colorX,decoX,containerX=null,extraX=null},served){
  await mixBase(p,r,colorX);
  await dragL(p,r,[[decoX,485],[650,420]],190);
  if(extraX!==null)await dragL(p,r,[[extraX,485],[690,440]],190);
  if(containerX!==null)await clickL(p,r,containerX,585);
  await clickL(p,r,870,630);
  await waitFor(p,n=>window.__ADUGAME_DEBUG__()?.ordersServed>=n||window.__ADUGAME_DEBUG__()?.roundComplete===true,9000,served);
  const done=await p.evaluate(()=>window.__ADUGAME_DEBUG__()?.roundComplete===true);
  if(!done){
    await waitFor(p,n=>{const s=window.__ADUGAME_DEBUG__(),sc=window.__ADUGAME_SCENE__();return s.orderIndex===n&&s.ingredients.length===0&&!s.mixed&&!sc.interactionLocked&&!!sc.mixZone?.input?.enabled;},7000,served);
  }
}

const cases=[
  [1,1,async(p,r)=>{
    const toilet=await livePoint(p,'toilet');expect(toilet).toBeTruthy();
    await clickL(p,r,toilet.x,toilet.y); await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.step===0.5,8000);
    const flush=await livePoint(p,'flush');expect(flush).toBeTruthy();
    await clickL(p,r,flush.x,flush.y); await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.step===1,8000);
    const faucet=await livePoint(p,'faucet');expect(faucet).toBeTruthy();
    await clickL(p,r,faucet.x,faucet.y); await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.step===2,8000);
    const soap=await livePoint(p,'soap'),hands=await livePoint(p,'hands');expect(soap).toBeTruthy();expect(hands).toBeTruthy();
    await dragL(p,r,[[soap.x,soap.y],[hands.x,hands.y]],220); await p.waitForTimeout(260); await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.step===3,8000);
    const h=await livePoint(p,'hands');expect(h).toBeTruthy();
    await dragL(p,r,[[h.x-70,h.y],[h.x,h.y],[h.x+70,h.y],[h.x,h.y],[h.x-70,h.y],[h.x,h.y],[h.x+70,h.y],[h.x,h.y],[h.x-70,h.y]],760);
    await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.step===4,8000);
    const rinse=await livePoint(p,'faucet');expect(rinse).toBeTruthy();
    await clickL(p,r,rinse.x,rinse.y); await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.roundComplete===true,8000);
  }],
  [1,2,async(p,r)=>{
    await waitG1R2Final(p); await p.waitForTimeout(120);
    const paste=await livePoint(p,'paste'),pasteTarget=await livePoint(p,'brush');expect(paste).toBeTruthy();expect(pasteTarget).toBeTruthy();
    await dragL(p,r,[[paste.x,paste.y],[pasteTarget.x,pasteTarget.y]],360);await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.step===1,8000);await p.waitForTimeout(120);
    const brushPaths=[
      [[765,485],[800,485],[755,500],[800,500],[755,485],[800,485],[755,500]],
      [[850,485],[895,485],[845,500],[895,500],[845,485],[895,485],[845,500]],
      [[765,535],[800,535],[755,555],[800,555],[755,535],[800,535],[755,555]],
      [[850,535],[895,535],[845,555],[895,555],[845,535],[895,535],[845,555]]
    ];
    for(let i=0;i<brushPaths.length;i++){
      const brush=await livePoint(p,'brush');expect(brush).toBeTruthy();
      await dragL(p,r,[[brush.x,brush.y],...brushPaths[i]],620);
      if(i<3)await waitFor(p,n=>(window.__ADUGAME_SCENE__().mouthProgress?.[n]||0)>=115,8000,i);
    }
    await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.step===2,8000);await p.waitForTimeout(120);
    const cloth=await livePoint(p,'cloth');expect(cloth).toBeTruthy();
    const faceLoop=[[790,330],[735,330],[845,330],[735,345],[845,345],[735,315],[845,315],[790,330]],facePts=[[cloth.x,cloth.y]];
    for(let i=0;i<4;i++)facePts.push(...faceLoop);
    await dragL(p,r,facePts,1500);await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.step===3,8000);await p.waitForTimeout(120);
    const nails=await liveNails(p);expect(nails.length).toBe(5);
    for(let i=0;i<nails.length;i++){
      const clipper=await livePoint(p,'clipper');expect(clipper).toBeTruthy();
      await dragL(p,r,[[clipper.x,clipper.y],[nails[i].x,nails[i].y]],260);
      await waitFor(p,n=>window.__ADUGAME_SCENE__().clipped?.size>=n,8000,i+1);
      await p.waitForTimeout(80);
    }
    await waitFor(p,()=>window.__ADUGAME_DEBUG__()?.roundComplete===true,8000);
  }],
  [1,3,async(p,r)=>{
    for(const q of [[180,235],[315,235],[450,235]]){await dragL(p,r,[q,[255,465]],160);await p.waitForTimeout(150);}
    for(const q of [[560,250],[680,250],[800,250]]){await dragL(p,r,[q,[735,475]],170);await p.waitForTimeout(160);}
    for(const q of [[660,470],[735,465],[810,460]]){await dragL(p,r,[q,[1040,330]],170);await p.waitForTimeout(160);}
  }],
  [2,1,async(p,r)=>{
    await dragL(p,r,[[315,628],[980,500]],180); await p.waitForTimeout(160);
    await dragL(p,r,[[330,205],[690,330]],170); await p.waitForTimeout(180);
    await dragL(p,r,[[690,330],[980,500]],170); await p.waitForTimeout(180);
    await clickL(p,r,650,555);
  }],
  [2,2,async(p,r)=>{
    await clickL(p,r,650,345);
    for(const q of [[330,205],[412,205],[494,205]]){await dragL(p,r,[q,[650,345]],160);await p.waitForTimeout(150);}
    await clickL(p,r,650,345); await clickL(p,r,650,345); await p.waitForTimeout(1450);
    for(const q of [[760,520],[818,520],[876,520]]){await dragL(p,r,[q,[930,420]],160);await p.waitForTimeout(150);}
    await clickL(p,r,650,555);
  }],
  [2,3,async(p,r)=>{for(const q of [[330,205],[412,205],[494,205]]){await dragL(p,r,[q,[720,405]],160);await p.waitForTimeout(160);}await clickL(p,r,650,555);}],
  [3,1,async(p,r)=>{await craftOrder(p,r,{colorX:210,decoX:210},1);await craftOrder(p,r,{colorX:440,decoX:400},2);}],
  [3,2,async(p,r)=>{await craftOrder(p,r,{colorX:325,decoX:305,containerX:230},1);await craftOrder(p,r,{colorX:210,decoX:210,containerX:380},2);await craftOrder(p,r,{colorX:440,decoX:400,containerX:230},3);}],
  [3,3,async(p,r)=>{await craftOrder(p,r,{colorX:210,decoX:210,extraX:495},1);await craftOrder(p,r,{colorX:325,decoX:305},2);await craftOrder(p,r,{colorX:440,decoX:400},3);}]
];

for(const [g,r,play] of cases){
  test(`v5 full-cycle G${g}R${r}`,async({page},testInfo)=>{if(g===1&&r===2)testInfo.setTimeout(240000);if(g===3&&r>=2)testInfo.setTimeout(180000);const {rct,errors}=await openRound(page,g,r);await play(page,rct);const st=await expectComplete(page,errors);expect(st.score).toBeGreaterThanOrEqual(60);});
}

test('v5 guided habits expose routine identities',async({page})=>{
  for(const [r,id] of [[1,'toilet-handwash'],[2,'brush-face-nails'],[3,'tidy-balanced-meal']]){await page.goto(`/index.html?game=1&round=${r}&e2e=1`,{waitUntil:'domcontentloaded'});await waitFor(page,()=>window.__ADUGAME_DEBUG__?.()?.benchmarkV5,5000);expect((await page.evaluate(()=>window.__ADUGAME_DEBUG__().benchmarkV5))).toBe(id);}
});

test('v5 house has four-floor transport semantics, 100 portable items, and 10 characters',async({page})=>{
  const {rct}=await openRound(page,2,1);let st=await page.evaluate(()=>window.__ADUGAME_DEBUG__());expect(st.benchmarkV5).toBe('four-floor-free-house');expect(st.itemCount).toBe(100);expect(st.characterCount).toBe(10);expect(st.currentFloor).toBe(1);
  await dragL(page,rct,[[904,205],[1130,355]],180);await page.waitForTimeout(120);st=await page.evaluate(()=>window.__ADUGAME_DEBUG__());expect(st.elevatorCargo).toBe(1);
  await clickL(page,rct,62,225);await page.waitForTimeout(180);st=await page.evaluate(()=>window.__ADUGAME_DEBUG__());expect(st.currentFloor).toBe(0);expect(st.elevatorCargo).toBe(0);
});

test('v5 slime store persists finished jars and advances customers',async({page})=>{
  const {rct}=await openRound(page,3,1);let st=await page.evaluate(()=>window.__ADUGAME_DEBUG__());expect(st.benchmarkV5).toBe('persistent-slime-store');expect(st.totalOrders).toBe(2);
  await craftOrder(page,rct,{colorX:210,decoX:210},1);st=await page.evaluate(()=>window.__ADUGAME_DEBUG__());expect(st.ordersServed).toBe(1);expect(st.shelfCount).toBe(1);expect(st.orderIndex).toBe(1);
});

test('v5 slime tactile pull deforms independent vertices and springs back',async({page})=>{
  const {rct,errors}=await openRound(page,3,1);await mixBase(page,rct,210);
  let st=await page.evaluate(()=>window.__ADUGAME_DEBUG__());expect(st.tactileEnabled).toBe(true);
  const before=await page.evaluate(()=>Math.max(...window.__ADUGAME_SCENE__().slimeBlob.points.map(p=>Math.hypot(p.x-p.bx,p.y-p.by))));expect(before).toBeLessThan(2);
  const a=map(rct,755,420),b=map(rct,815,420);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:2});await page.waitForTimeout(80);
  const pulled=await page.evaluate(()=>Math.max(...window.__ADUGAME_SCENE__().slimeBlob.points.map(p=>Math.hypot(p.x-p.bx,p.y-p.by))));expect(pulled).toBeGreaterThan(18);
  await page.mouse.up();await page.waitForTimeout(900);
  const relaxed=await page.evaluate(()=>Math.max(...window.__ADUGAME_SCENE__().slimeBlob.points.map(p=>Math.hypot(p.x-p.bx,p.y-p.by))));expect(relaxed).toBeLessThan(pulled);expect(errors).toEqual([]);
});

test('v5 wrong slime serve preserves craft state instead of resetting',async({page})=>{
  const {rct}=await openRound(page,3,1);await mixBase(page,rct,210);await dragL(page,rct,[[400,485],[650,420]],170);await clickL(page,rct,870,630);await page.waitForTimeout(300);
  const st=await page.evaluate(()=>window.__ADUGAME_DEBUG__());expect(st.roundComplete).toBe(false);expect(st.mixed).toBe(true);expect(st.chosen.color).toBe('blue');expect(st.chosen.decos).toContain('heart');
});

test('v5 all nine rounds boot without runtime errors',async({page})=>{
  for(let g=1;g<=3;g++)for(let r=1;r<=3;r++){
    const errs=[];page.removeAllListeners('pageerror');page.removeAllListeners('console');page.on('pageerror',e=>errs.push(String(e)));page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await page.goto(`/index.html?game=${g}&round=${r}&e2e=1`,{waitUntil:'domcontentloaded'});await waitFor(page,()=>window.__ADUGAME_DEBUG__ && window.__ADUGAME_DEBUG__()?.key,5000);expect(errs).toEqual([]);const box=await page.locator('canvas').boundingBox();expect(box.width).toBeGreaterThan(600);expect(box.height).toBeGreaterThan(300);
  }
});