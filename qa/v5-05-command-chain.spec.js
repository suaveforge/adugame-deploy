const {test,expect}=require('@playwright/test');
function map(r,x,y){return{x:r.x+x/1280*r.width,y:r.y+y/720*r.height};}
async function clickL(p,r,x,y){const q=map(r,x,y);await p.mouse.click(q.x,q.y);}
async function dragL(p,r,pts,duration=220){const a=pts.map(([x,y])=>map(r,x,y));await p.mouse.move(a[0].x,a[0].y);await p.mouse.down();const dt=Math.max(14,Math.floor(duration/Math.max(1,a.length-1)));for(let i=1;i<a.length;i++){await p.mouse.move(a[i].x,a[i].y);await p.waitForTimeout(dt);}await p.mouse.up();}
async function waitFor(p,fn,timeout=8000,arg=null){return p.waitForFunction(fn,arg,{timeout});}
async function open(p,g,r){await p.goto(`/index.html?game=${g}&round=${r}&e2e=1`,{waitUntil:'networkidle'});await waitFor(p,()=>window.__ADUGAME_DEBUG__?.()?.key);return p.locator('canvas').boundingBox();}
async function guide(p){return p.evaluate(()=>{const s=window.__ADUGAME_SCENE__();return{status:String(s.status?.text||s.missionText?.text||''),hint:s.hintTarget?{x:s.hintTarget.x,y:s.hintTarget.y}:null};});}
async function expectGuide(p,text,x,y,tol=3){const g=await guide(p);expect(g.status).toContain(text);expect(g.hint,`missing hint for ${g.status}`).toBeTruthy();expect(Math.abs(g.hint.x-x),JSON.stringify(g)).toBeLessThanOrEqual(tol);expect(Math.abs(g.hint.y-y),JSON.stringify(g)).toBeLessThanOrEqual(tol);}
async function objectPoint(p,name){return p.evaluate(n=>{const s=window.__ADUGAME_SCENE__(),o=s?.[n];return o&&{x:o.x,y:o.y};},name);}
async function expectGuideObject(p,text,name,tol=3){const q=await objectPoint(p,name);expect(q,`missing ${name}`).toBeTruthy();await expectGuide(p,text,q.x,q.y,tol);return q;}
async function waitG1R2Final(p){await waitFor(p,()=>{const r=document.getElementById('g1r2-v17-overlay');return r?.dataset.ready==='1'&&r?.dataset.uxReady==='1'&&r?.dataset.uxAlignmentReady==='1'&&r?.dataset.finalAlertReady==='1'&&r?.dataset.gameFeelReady==='1'&&r?.dataset.version==='17.32'&&window.__ADUGAME_ART_SOURCE__?.G1R2?.version==='v17.32';},15000);}

test('strict command chain: G1 every guided state points to the next valid action',async({page})=>{
  test.setTimeout(360000);
  let r=await open(page,1,1);await expectGuide(page,'변기',740,380);
  await clickL(page,r,740,380);await waitFor(page,()=>window.__ADUGAME_DEBUG__().step===.5);await expectGuide(page,'물',790,275);
  await clickL(page,r,790,275);await waitFor(page,()=>String(window.__ADUGAME_SCENE__().status.text).includes('수도꼭지'));await expectGuide(page,'수도꼭지',400,300);
  await clickL(page,r,400,300);await waitFor(page,()=>window.__ADUGAME_DEBUG__().step===2);await expectGuide(page,'비누',270,395);
  await dragL(page,r,[[270,395],[400,475]]);await waitFor(page,()=>window.__ADUGAME_DEBUG__().step===3);await expectGuide(page,'문질러',400,475);
  await dragL(page,r,[[330,475],[410,475],[330,475],[410,475],[330,475],[410,475],[330,475]],650);await waitFor(page,()=>window.__ADUGAME_DEBUG__().step===4);await expectGuide(page,'헹궈',400,300);

  r=await open(page,1,2);await waitG1R2Final(page);await page.waitForTimeout(100);
  const paste=await expectGuideObject(page,'치약','paste');
  const pasteTarget=await objectPoint(page,'brush');expect(pasteTarget,'missing brush paste target').toBeTruthy();
  await dragL(page,r,[[paste.x,paste.y],[pasteTarget.x,pasteTarget.y]],360);await waitFor(page,()=>window.__ADUGAME_DEBUG__().step===1);await page.waitForTimeout(120);
  await expectGuideObject(page,'칫솔','brush');
  const brushPaths=[
    [[765,485],[800,485],[755,500],[800,500],[755,485],[800,485],[755,500]],
    [[850,485],[895,485],[845,500],[895,500],[845,485],[895,485],[845,500]],
    [[765,535],[800,535],[755,555],[800,555],[755,535],[800,535],[755,555]],
    [[850,535],[895,535],[845,555],[895,555],[845,535],[895,535],[845,555]]
  ];
  for(let i=0;i<brushPaths.length;i++){
    const b=await objectPoint(page,'brush');expect(b,'missing brush').toBeTruthy();
    await dragL(page,r,[[b.x,b.y],...brushPaths[i]],620);
    if(i<3)await waitFor(page,n=>(window.__ADUGAME_SCENE__().mouthProgress?.[n]||0)>=115,8000,i);
  }
  await waitFor(page,()=>window.__ADUGAME_DEBUG__().step===2);await page.waitForTimeout(120);await expectGuideObject(page,'세안천','cloth');
  const cloth=await objectPoint(page,'cloth');expect(cloth,'missing cloth').toBeTruthy();
  const faceLoop=[[790,330],[735,330],[845,330],[735,345],[845,345],[735,315],[845,315],[790,330]];
  const facePts=[[cloth.x,cloth.y]];for(let i=0;i<4;i++)facePts.push(...faceLoop);
  await dragL(page,r,facePts,1500);await waitFor(page,()=>window.__ADUGAME_DEBUG__().step===3);await page.waitForTimeout(120);await expectGuideObject(page,'손톱','clipper');

  r=await open(page,1,3);await expectGuide(page,'장난감',190,270);
  const toys=[[190,270],[305,270],[420,270]];
  for(let i=0;i<toys.length;i++){
    await dragL(page,r,[toys[i],[255,465]],170);
    if(i<2){await waitFor(page,n=>window.__ADUGAME_DEBUG__().tidied.length===n,8000,i+1);await expectGuide(page,'장난감',toys[i+1][0],toys[i+1][1]);}
    else await waitFor(page,()=>window.__ADUGAME_DEBUG__().step===1);
  }
  await expectGuide(page,'균형',510,270);
  const healthy=[[510,270],[625,270],[740,270]];
  for(let i=0;i<healthy.length;i++){
    await dragL(page,r,[healthy[i],[735,475]],180);
    if(i<2){await waitFor(page,n=>window.__ADUGAME_DEBUG__().chosen.length===n,8000,i+1);await expectGuide(page,'균형',healthy[i+1][0],healthy[i+1][1]);}
    else await waitFor(page,()=>window.__ADUGAME_DEBUG__().step===2);
  }
  const first=await page.evaluate(()=>{const s=window.__ADUGAME_SCENE__(),o=s.chosen[0];return{x:o.x,y:o.y,kind:o.kind};});await expectGuide(page,'캐릭터',first.x,first.y);
  await dragL(page,r,[[first.x,first.y],[1040,330]],190);await waitFor(page,()=>window.__ADUGAME_DEBUG__().fed.length===1);await page.waitForTimeout(80);
  const after=await page.evaluate(()=>{const s=window.__ADUGAME_SCENE__(),next=s.chosen.find(o=>!s.fed.has(o.kind));return{hint:s.hintTarget,status:s.status.text,next:next&&{x:next.x,y:next.y,kind:next.kind},fed:[...s.fed]};});
  expect(after.fed).toContain(first.kind);expect(after.status).toContain('다음');expect(after.next).toBeTruthy();expect(after.next.kind).not.toBe(first.kind);expect(Math.abs(after.hint.x-after.next.x)).toBeLessThanOrEqual(3);expect(Math.abs(after.hint.y-after.next.y)).toBeLessThanOrEqual(3);
});

test('strict command chain: G2 missions update target and progress at every action',async({page})=>{
  test.setTimeout(150000);
  let r=await open(page,2,1);await expectGuide(page,'가족·친구',315,628);
  await dragL(page,r,[[315,628],[980,500]],190);await expectGuide(page,'빵',330,205);
  await dragL(page,r,[[330,205],[690,330]],190);await waitFor(page,()=>window.__ADUGAME_DEBUG__().cooked===true);
  const cooked=await page.evaluate(()=>{const s=window.__ADUGAME_SCENE__(),o=s.items.find(x=>x.kind==='bread'&&x.state==='cooked'&&x.visible);return o&&{x:o.x,y:o.y};});
  expect(cooked).toBeTruthy();await expectGuide(page,'조리한 음식',cooked.x,cooked.y,3);
  await dragL(page,r,[[cooked.x,cooked.y],[980,500]],190);await waitFor(page,()=>window.__ADUGAME_DEBUG__().milestone===true);await expectGuide(page,'완료 버튼',650,555);

  r=await open(page,2,2);await expectGuide(page,'세탁기 문',650,345);
  await clickL(page,r,650,345);await expectGuide(page,'(0/3)',330,205);
  const clothes=[[330,205],[412,205],[494,205]];
  for(let i=0;i<3;i++){await dragL(page,r,[clothes[i],[650,345]],180);const g=await guide(page);if(i<2){expect(g.status).toContain(`(${i+1}/3)`);}else{expect(g.status).toContain('문을 닫아요');expect(Math.abs(g.hint.x-650)).toBeLessThanOrEqual(3);}}
  await clickL(page,r,650,345);await expectGuide(page,'세탁을 시작',650,345);
  await clickL(page,r,650,345);let g=await guide(page);expect(g.status).toContain('세탁 중');expect(g.hint).toBeNull();
  await waitFor(page,()=>[...window.__ADUGAME_SCENE__().mission.loaded].every(o=>o.state==='clean'),5000);await page.waitForTimeout(80);g=await guide(page);expect(g.status).toContain('(0/3)');expect(g.hint).toBeTruthy();
  const clean=await page.evaluate(()=>{const s=window.__ADUGAME_SCENE__(),o=[...s.mission.loaded].find(x=>x.state==='clean');return{x:o.x,y:o.y};});await dragL(page,r,[[clean.x,clean.y],[930,420]],180);await waitFor(page,()=>window.__ADUGAME_DEBUG__().dried===1);g=await guide(page);expect(g.status).toContain('(1/3)');expect(g.hint).toBeTruthy();

  r=await open(page,2,3);await expectGuide(page,'바퀴',330,205);
  await dragL(page,r,[[330,205],[720,405]],180);await waitFor(page,()=>window.__ADUGAME_DEBUG__().repair===1);await expectGuide(page,'나사',412,205);
  await dragL(page,r,[[412,205],[720,405]],180);await waitFor(page,()=>window.__ADUGAME_DEBUG__().repair===2);await expectGuide(page,'드라이버',494,205);
  await dragL(page,r,[[494,205],[720,405]],180);await waitFor(page,()=>window.__ADUGAME_DEBUG__().repair===3);await expectGuide(page,'완료 버튼',650,555);
});

test('strict command chain: G3 ingredient hint never points to an invalid duplicate',async({page})=>{
  test.setTimeout(150000);
  const r=await open(page,3,2);await expectGuide(page,'베이스',230,230);
  await dragL(page,r,[[230,230],[650,420]],190);await waitFor(page,()=>window.__ADUGAME_DEBUG__().ingredients.length===1);await page.waitForTimeout(300);await expectGuide(page,'활성액',360,230);
  await dragL(page,r,[[360,230],[650,420]],190);await waitFor(page,()=>window.__ADUGAME_DEBUG__().ingredients.length===2);await page.waitForTimeout(220);await expectGuide(page,'색',325,355);
});
