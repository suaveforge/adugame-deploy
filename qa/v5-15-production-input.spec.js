const { test, expect } = require('@playwright/test');

async function logical(page,x,y){
  return page.evaluate(({x,y})=>{
    const c=document.querySelector('canvas');
    const r=c.getBoundingClientRect();
    return {x:r.left+x/1280*r.width,y:r.top+y/720*r.height};
  },{x,y});
}
async function state(page){
  return page.evaluate(()=>{
    const s=window.__ADUGAME_SCENE__?.();
    const d=window.__ADUGAME_DEBUG__?.()||{};
    return {
      step:d.step,
      input:d.g1r2V17Input,
      fallback:d.productionInputFallback,
      errors:d.errors,
      paste:s?.paste?{x:s.paste.x,y:s.paste.y}:null,
      brush:s?.brush?{x:s.brush.x,y:s.brush.y}:null,
      mouth:s?.mouth?{x:s.mouth.x,y:s.mouth.y}:null,
      ready:document.querySelector('#g1r2-v17-overlay')?.dataset.ready,
      alignment:document.querySelector('#g1r2-v17-overlay')?.dataset.toolHitAlignmentReady,
      prodFix:window.__ADUGAME_G1R2_PRODUCTION_INPUT_FIX__||null
    };
  });
}
async function drag(page,from,to,hold=false){
  const a=await logical(page,from.x,from.y),b=await logical(page,to.x,to.y);
  await page.mouse.move(a.x,a.y);
  await page.mouse.down();
  await page.mouse.move(b.x,b.y,{steps:3});
  if(!hold) await page.mouse.up();
}

test('normal play: visible G1R2 tools are draggable and canonical sequence still works',async({page})=>{
  test.setTimeout(90000);
  await page.goto('/index.html?game=1&round=2',{waitUntil:'domcontentloaded'});
  expect(await page.evaluate(()=>new URLSearchParams(location.search).has('e2e'))).toBe(false);
  await page.waitForFunction(()=>{
    const r=document.querySelector('#g1r2-v17-overlay');
    return r?.dataset.ready==='1'&&r?.dataset.toolHitAlignmentReady==='1'&&
      window.__ADUGAME_G1R2_PRODUCTION_INPUT_FIX__?.loaded===true&&
      !!window.__ADUGAME_DEBUG__?.()?.g1r2V17Input;
  },null,{timeout:30000});

  let s=await state(page);
  expect(s.step).toBe(0);
  expect(s.prodFix.normalPlayCovered).toBe(true);

  // The toothbrush is already visible at step 0. It must feel like a real object even
  // though toothpaste is the required first action. Dragging it moves it, then canonical
  // brushEnd validation returns it because the order is not ready yet.
  const brushStart={...s.brush};
  await drag(page,brushStart,{x:brushStart.x-120,y:brushStart.y-85},true);
  await page.waitForTimeout(120);
  let moving=await state(page);
  expect(moving.input.active).toBe('brush');
  expect(moving.fallback.active).toBe('brush');
  expect(moving.fallback.brushDown).toBeGreaterThanOrEqual(1);
  expect(moving.fallback.brushMove).toBeGreaterThanOrEqual(1);
  expect(Math.hypot(moving.brush.x-brushStart.x,moving.brush.y-brushStart.y)).toBeGreaterThan(35);
  await page.mouse.up();
  await page.waitForTimeout(420);
  s=await state(page);
  expect(s.step).toBe(0);
  expect(s.fallback.brushUp).toBeGreaterThanOrEqual(1);

  // Required action still uses the canonical validator: move toothpaste onto the brush.
  await drag(page,s.paste,s.brush);
  await page.waitForFunction(()=>window.__ADUGAME_DEBUG__?.()?.step===1,null,{timeout:12000});
  await page.waitForTimeout(180);
  s=await state(page);
  expect(s.step).toBe(1);

  // In normal play, the active toothbrush itself must move under the real mouse pointer.
  const activeBrush={...s.brush};
  const mouth={...s.mouth};
  await drag(page,activeBrush,{x:mouth.x-35,y:mouth.y-20},true);
  await page.waitForTimeout(100);
  moving=await state(page);
  expect(moving.input.active).toBe('brush');
  expect(moving.input.brushMove).toBeGreaterThan(0);
  expect(Math.hypot(moving.brush.x-activeBrush.x,moving.brush.y-activeBrush.y)).toBeGreaterThan(35);
  await page.mouse.up();
});
