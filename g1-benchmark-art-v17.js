// ADUGAME G1R2 v17.6 — actual HabitV5 mechanic: toothpaste -> brush -> face wash -> nails.
// ZERO generated/drawn image assets. Only existing Openclipart CC0/public-domain images + CSS layout.
(() => {
  if (typeof G1R2 !== 'function') return;

  const SRC={
    scene:'https://openclipart.org/image/800px/326445',
    paste:'https://openclipart.org/image/800px/158803',
    brush:'https://openclipart.org/image/800px/172856',
    cloth:'https://openclipart.org/image/800px/246477',
    clipper:'https://openclipart.org/image/800px/318550'
  };
  const STEPS=[
    ['치약','치약을 칫솔 위로 가져가 적당히 묻혀요'],
    ['양치','칫솔을 움직여 위·아래·양쪽 이를 골고루 닦아요'],
    ['세수','세안천으로 얼굴을 부드럽게 닦아요'],
    ['손톱','손톱 5개를 하나씩 정리해요']
  ];
  const NAIL_POS=[[665,568],[680,558],[695,554],[710,558],[725,568]];

  function img(src,cls,alt=''){
    const e=document.createElement('img');e.src=src;e.className=cls;e.alt=alt;e.draggable=false;
    Object.assign(e.style,{position:'absolute',pointerEvents:'none',userSelect:'none',objectFit:'contain'});return e;
  }
  function place(e,x,y,w,h=null,rot=0){e.style.left=`${x/12.8}%`;e.style.top=`${y/7.2}%`;e.style.width=`${w/12.8}%`;if(h!=null)e.style.height=`${h/7.2}%`;else e.style.height='auto';e.style.transform=`translate(-50%,-50%) rotate(${rot}deg)`;}
  function syncRoot(scene,root){const c=scene.game?.canvas;if(!c)return;const r=c.getBoundingClientRect();Object.assign(root.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});}
  function waitImage(e){return new Promise(resolve=>{if(e.complete)return resolve(e.naturalWidth>0);const t=setTimeout(()=>resolve(false),12000);e.onload=()=>{clearTimeout(t);resolve(true)};e.onerror=()=>{clearTimeout(t);resolve(false)};});}
  function pill(text){const d=document.createElement('div');d.textContent=text;Object.assign(d.style,{padding:'9px 14px',borderRadius:'999px',fontWeight:'900',fontSize:'15px',lineHeight:'1',whiteSpace:'nowrap',transition:'all .16s ease'});return d;}

  function hardenInput(scene){
    if(scene.__g1v17InputCleanup)return;
    const canvas=scene.game?.canvas;if(!canvas)return;
    [scene.paste,scene.brush,scene.cloth,scene.clipper].filter(Boolean).forEach(o=>{if(o.input)o.disableInteractive();});
    const count={pasteDown:0,pasteMove:0,pasteUp:0,brushDown:0,brushMove:0,brushUp:0,clothDown:0,clothMove:0,clothUp:0,clipperDown:0,clipperMove:0,clipperUp:0};
    let active=null,pid=null;
    const logical=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*1280/Math.max(1,r.width),y:(e.clientY-r.top)*720/Math.max(1,r.height),inside:e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};};
    const current=()=>scene.step===0?['paste',scene.paste]:scene.step===1?['brush',scene.brush]:scene.step===2?['cloth',scene.cloth]:scene.step===3?['clipper',scene.clipper]:[null,null];
    const hit=(p,o)=>o&&Math.abs(p.x-o.x)<=90&&Math.abs(p.y-o.y)<=78;
    const down=e=>{
      if(pid!==null||scene.roundComplete||scene.interactionLocked)return;
      const p=logical(e);if(!p.inside)return;const [kind,o]=current();if(!kind||!hit(p,o))return;
      active={kind,o};pid=e.pointerId;count[`${kind}Down`]++;scene.markMeaningfulInput?.('drag_start',{id:kind});o.setDepth?.(1000);try{canvas.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();
    };
    const move=e=>{
      if(pid===null||e.pointerId!==pid||!active)return;const p=logical(e);if(!p.inside)return;
      const {kind,o}=active;o.setPosition(p.x,p.y);count[`${kind}Move`]++;
      if(kind==='brush')scene.brushMove(o,{x:p.x,y:p.y,isDown:true});
      else if(kind==='cloth')scene.clothMove(o,{x:p.x,y:p.y,isDown:true});
      e.preventDefault();
    };
    const up=e=>{
      if(pid===null||e.pointerId!==pid||!active)return;const a=active;active=null;pid=null;count[`${a.kind}Up`]++;
      if(a.kind==='paste')scene.dropPaste(a.o);else if(a.kind==='brush')scene.brushEnd(a.o);else if(a.kind==='cloth')scene.clothEnd(a.o);else if(a.kind==='clipper')scene.clipEnd(a.o);
      try{canvas.releasePointerCapture(e.pointerId);}catch(_){}e.preventDefault();
    };
    window.addEventListener('pointerdown',down,{capture:true,passive:false});window.addEventListener('pointermove',move,{capture:true,passive:false});window.addEventListener('pointerup',up,{capture:true,passive:false});window.addEventListener('pointercancel',up,{capture:true,passive:false});
    const prior=scene.debugState?.bind(scene);if(prior)scene.debugState=()=>({...prior(),g1r2V17Input:{...count,active:active?.kind||null}});
    const cleanup=()=>{window.removeEventListener('pointerdown',down,true);window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',up,true);scene.__g1v17InputCleanup=null;};
    scene.__g1v17InputCleanup=cleanup;scene.events.once('shutdown',cleanup);scene.events.once('destroy',cleanup);
  }

  function mount(scene){
    if(scene.scene?.key!=='G1R2'||scene.__g1v17Root)return;
    const old=scene.__g1v14Dom?.root;if(old)old.style.display='none';
    if(scene.brush){scene.brush.setPosition(1040,570);scene.brush.home={x:1040,y:570};scene.brush.setAlpha(.001).setVisible(true);}
    if(scene.paste){scene.paste.setPosition(880,570);scene.paste.home={x:880,y:570};scene.paste.setAlpha(.001).setVisible(true);}
    if(scene.cloth){scene.cloth.setPosition(1110,420);scene.cloth.home={x:1110,y:420};scene.cloth.setAlpha(.001).setVisible(true);}
    if(scene.clipper){scene.clipper.setPosition(1110,270);scene.clipper.home={x:1110,y:270};scene.clipper.setAlpha(.001).setVisible(true);}
    if(scene.mouth)scene.mouth.setAlpha(.001).setVisible(true);(scene.stains||[]).forEach(s=>s.setAlpha(.001).setVisible(true));if(scene.hand)scene.hand.setAlpha(.001).setVisible(true);
    (scene.nails||[]).forEach((n,i)=>{const p=NAIL_POS[i]||NAIL_POS[2];n.setPosition(p[0],p[1]).setAlpha(.001).setVisible(true);});
    hardenInput(scene);

    const root=document.createElement('div');root.id='g1r2-v17-overlay';root.dataset.generatedVisualAssets='0';root.dataset.ready='0';root.dataset.version='17.6';Object.assign(root.style,{position:'fixed',overflow:'hidden',pointerEvents:'none',zIndex:'82',background:'#dff5fa',fontFamily:'Arial, sans-serif',color:'#24314a'});document.querySelector('.stage-shell')?.style.setProperty('background','#dff5fa');
    const room=document.createElement('div');Object.assign(room.style,{position:'absolute',left:'2.2%',right:'2.2%',top:'8.7%',bottom:'6%',overflow:'hidden',borderRadius:'26px',background:'linear-gradient(180deg,#eefbfe 0%,#fffdf8 72%,#f7e9c9 100%)',border:'3px solid rgba(36,49,74,.07)',boxShadow:'0 18px 42px rgba(36,49,74,.10)'});root.appendChild(room);
    const title=document.createElement('div');title.textContent='양치 · 세수 · 손톱 정리';Object.assign(title.style,{position:'absolute',left:'2.8%',top:'2.3%',fontSize:'30px',fontWeight:'900',letterSpacing:'-1.1px',zIndex:'9'});root.appendChild(title);
    const stepbar=document.createElement('div');Object.assign(stepbar.style,{position:'absolute',right:'2.7%',top:'2.45%',display:'flex',gap:'8px',zIndex:'9'});const pills=STEPS.map((s,i)=>{const p=pill(`${i+1} ${s[0]}`);stepbar.appendChild(p);return p;});root.appendChild(stepbar);
    const people=img(SRC.scene,'g1v17-scene','children brushing teeth');people.style.zIndex='2';people.style.transition='left .24s ease,top .24s ease,width .24s ease,filter .18s ease,opacity .18s ease,clip-path .18s ease';root.appendChild(people);
    const paste=img(SRC.paste,'g1v17-paste','toothpaste');const brush=img(SRC.brush,'g1v17-brush','toothbrush');const cloth=img(SRC.cloth,'g1v17-cloth','face sponge');const clipper=img(SRC.clipper,'g1v17-clipper','nail clipper');[paste,brush,cloth,clipper].forEach((e,i)=>{e.style.zIndex=6+i;root.appendChild(e);});
    const focus=document.createElement('div');Object.assign(focus.style,{position:'absolute',transform:'translate(-50%,-50%)',border:'5px solid rgba(52,180,205,.72)',boxShadow:'0 0 0 10px rgba(123,223,242,.15)',borderRadius:'38px',zIndex:'5',transition:'all .16s ease',opacity:'0'});root.appendChild(focus);const setFocus=(x,y,w,h,on=true)=>{focus.style.left=`${x/12.8}%`;focus.style.top=`${y/7.2}%`;focus.style.width=`${w/12.8}%`;focus.style.height=`${h/7.2}%`;focus.style.opacity=on?'1':'0';};
    const progress=document.createElement('div');Object.assign(progress.style,{position:'absolute',left:'50%',bottom:'7.4%',transform:'translateX(-50%)',fontSize:'15px',fontWeight:'900',color:'#42657a',zIndex:'9',background:'rgba(255,255,255,.9)',padding:'8px 14px',borderRadius:'999px',opacity:'0',transition:'opacity .15s ease'});root.appendChild(progress);
    const status=document.createElement('div');Object.assign(status.style,{position:'absolute',left:'50%',bottom:'1%',transform:'translateX(-50%)',minWidth:'500px',maxWidth:'76%',textAlign:'center',padding:'13px 24px',borderRadius:'20px',background:'rgba(36,49,74,.94)',color:'#fff',fontSize:'18px',fontWeight:'900',boxShadow:'0 10px 24px rgba(36,49,74,.17)',zIndex:'10'});root.appendChild(status);
    document.body.appendChild(root);syncRoot(scene,root);scene.__g1v17Root=root;scene.v17Art='actual-brush-face-nails-public-domain';Promise.all([people,paste,brush,cloth,clipper].map(waitImage)).then(ok=>{root.dataset.ready=ok.every(Boolean)?'1':'fallback';});

    const sync=()=>{
      if(!scene.sys?.isActive()||scene.scene?.key!=='G1R2'||!root.isConnected)return;syncRoot(scene,root);const st=Math.max(0,Math.min(4,Number(scene.step)||0));
      pills.forEach((p,i)=>{const active=i===Math.min(st,3),done=i<st||st>=4;p.style.background=active?'#24314a':done?'#b2f7ef':'rgba(255,255,255,.9)';p.style.color=active?'#fff':'#24314a';p.style.border=active?'2px solid #24314a':'2px solid rgba(36,49,74,.11)';p.style.transform=active?'translateY(-2px) scale(1.03)':'none';});status.textContent=st>=4?'양치·세수·손톱 정리까지 모두 끝냈어요':STEPS[st][1];
      if(st===0||st>=4){people.style.clipPath='none';place(people,565,374,940);}
      else if(st===1){people.style.clipPath='inset(0 48% 0 0)';place(people,1080,300,1040);}
      else if(st===2){people.style.clipPath='inset(0 0 0 48%)';place(people,425,274,900);}
      else{people.style.clipPath='inset(0 48% 0 0)';place(people,1080,300,1040);}
      people.style.filter=st===2?'saturate(.95) brightness(1.03)':'none';people.style.opacity=st>=4?'.96':'1';
      paste.style.display=st===0?'block':'none';brush.style.display=(st===0||st===1)?'block':'none';cloth.style.display=st===2?'block':'none';clipper.style.display=st===3?'block':'none';
      if(scene.paste&&st===0)place(paste,scene.paste.x,scene.paste.y,118,118,-8);if(scene.brush&&(st===0||st===1))place(brush,scene.brush.x,scene.brush.y,146,98,-10);if(scene.cloth&&st===2)place(cloth,scene.cloth.x,scene.cloth.y,138,138,5);if(scene.clipper&&st===3)place(clipper,scene.clipper.x,scene.clipper.y,138,138,18);
      progress.style.opacity='1';if(st===0){setFocus(scene.paste?.x||880,scene.paste?.y||570,150,132,true);progress.textContent='치약을 칫솔까지 드래그';scene.hintTarget={x:scene.paste?.x||880,y:scene.paste?.y||570};}else if(st===1){setFocus(790,365,224,154,true);const q=(scene.mouthProgress||[0,0,0,0]).filter(v=>v>=115).length;progress.textContent=`양치 구역 ${q}/4`;scene.hintTarget={x:scene.brush?.x||1040,y:scene.brush?.y||570};}else if(st===2){setFocus(790,330,250,220,true);const n=Math.min(100,Math.round((scene.faceWash||0)/360*100));progress.textContent=`세수 ${n}%`;scene.hintTarget={x:scene.cloth?.x||1110,y:scene.cloth?.y||420};}else if(st===3){setFocus(695,562,170,104,true);progress.textContent=`손톱 ${scene.clipped?.size||0}/5`;scene.hintTarget={x:scene.clipper?.x||1110,y:scene.clipper?.y||270};}else{setFocus(790,365,220,150,false);progress.textContent='모두 완료';}
    };
    sync();scene.events.on('postupdate',sync);scene.scale?.on?.('resize',sync);const cleanup=()=>{root.remove();if(old)old.style.display='';scene.__g1v17Root=null;};scene.events.once('shutdown',cleanup);scene.events.once('destroy',cleanup);
    window.__ADUGAME_ART_SOURCE__=window.__ADUGAME_ART_SOURCE__||{};window.__ADUGAME_ART_SOURCE__.G1R2={scene:{name:'Children Brushing Teeth',author:'oksmith',source:'Openclipart / publicdomainq.net',license:'CC0/Public Domain'},paste:{name:'Toothpaste tube',author:'jhnri4',source:'Openclipart',license:'CC0/Public Domain'},brush:{name:'toothbrush',author:'bpcomp',source:'Openclipart',license:'CC0/Public Domain'},cloth:{name:'Schwamm col (sponge)',author:'Ilex',source:'Openclipart',license:'CC0/Public Domain'},clipper:{name:'Nail Clipper',author:'algotruneman',source:'Openclipart',license:'CC0/Public Domain'},mechanic:'toothpaste -> 4-zone brushing -> face wash -> 5 nail clips',version:'v17.6',generatedVisualAssets:0,rendering:'authored images + CSS layout only',input:'capture-phase direct mechanic routing'};
  }

  const priorCreate=G1R2.prototype.create;G1R2.prototype.create=function(){priorCreate.call(this);mount(this);this.time.delayedCall(650,()=>{if(!this.__g1v17Root)mount(this);});};
  window.__ADUGAME_G1_BENCHMARK_ART_V17__={loaded:true,version:'17.6',generatedVisualAssets:0,directInput:true};
})();
