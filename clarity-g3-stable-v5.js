// ADUGAME strict G3 stable guidance.
// Re-evaluate commands after legacy callbacks and reject invalid order choices so
// every visible instruction points at an action that can actually advance the order.
(() => {
  if(typeof CraftRound==='undefined')return;
  const decoX={star:210,flower:305,heart:400,banana:495};
  const colorX={blue:210,green:325,pink:440};
  const colorLabel={blue:'파랑',green:'초록',pink:'분홍'};
  const center=o=>o?{x:o.x,y:o.y}:null;
  function syncGuidance(s){
    if(!s?.scene?.isActive?.()||s.roundComplete)return;
    if((s.ingredients?.size||0)<2){
      const next=s.ingredients?.has('base')?s.activator:s.base;
      s.status?.setText(`${s.ingredients?.size?'이제 ':'먼저 '}베이스와 활성액을 그릇에 넣어요`);
      s.hintTarget=center(next);return;
    }
    if(s.chosen?.color!==s.order?.color){
      const want=s.order?.color;
      s.status?.setText(`주문은 ${colorLabel[want]||'표시된'} 색이에요. 주문 색을 선택해요`);
      s.hintTarget={x:colorX[want]||325,y:355};return;
    }
    if(!s.mixed){
      s.status?.setText('그릇 안을 원을 그리며 충분히 섞어요');
      s.hintTarget={x:650,y:420};return;
    }
    const requested=s.order?.deco,hasRequested=!!requested&&s.chosen?.decos?.includes(requested);
    if(!hasRequested){
      const x=decoX[requested];
      s.status?.setText(`주문 장식 ${requested==='flower'?'꽃':requested==='heart'?'하트':'별'}을 올려요`);
      if(x)s.hintTarget={x,y:485};return;
    }
    if(s.order?.container&&s.chosen?.container!==s.order.container){
      const round=s.order.container==='round',x=round?230:380;
      s.status?.setText(`주문은 ${round?'동그란':'네모난'} 용기예요. ${round?'동그란':'네모난'} 용기를 선택해요`);
      s.hintTarget={x,y:585};return;
    }
    s.status?.setText('주문 조건을 모두 맞췄어요. 손님에게 주기를 눌러요');
    if(s.serveButton)s.hintTarget={x:s.serveButton.x,y:s.serveButton.y};
  }

  const oldCreate=CraftRound.prototype.create;
  CraftRound.prototype.create=function(){
    oldCreate.call(this);
    this.children.list.filter(o=>o?.name==='container_round'||o?.name==='container_square').forEach(o=>o.on('pointerup',()=>syncGuidance(this)));
  };

  const oldDropIngredient=CraftRound.prototype.dropIngredient;
  CraftRound.prototype.dropIngredient=function(o){
    // Decorate the exact snap completion callback used by the legacy implementation.
    // This removes timing guesses: guidance is recalculated immediately after the
    // ingredient is actually inserted into the Set, then once more after legacy
    // return/snap callbacks settle.
    const originalSnap=this.snap;
    this.snap=(obj,x,y,cb,...rest)=>originalSnap.call(this,obj,x,y,(...args)=>{
      const r=cb?.(...args);
      syncGuidance(this);
      this.time.delayedCall(320,()=>syncGuidance(this));
      return r;
    },...rest);
    try{return oldDropIngredient.call(this,o);}finally{this.snap=originalSnap;}
  };

  const oldPickColor=CraftRound.prototype.pickColor;
  CraftRound.prototype.pickColor=function(k,c,b){
    if(this.ingredients?.size>=2&&k!==this.order?.color){
      this.curious?.(b);
      const want=this.order?.color;
      this.status?.setText(`주문은 ${colorLabel[want]||'표시된'} 색이에요. 주문 색을 선택해요`);
      this.hintTarget={x:colorX[want]||325,y:355};
      return;
    }
    return oldPickColor.call(this,k,c,b);
  };

  const oldDrop=CraftRound.prototype.dropDeco;
  CraftRound.prototype.dropDeco=function(o){
    // The legacy snap callback writes a generic SERVE instruction after the decoration
    // lands. Decorate that exact callback and restore strict order-aware guidance
    // immediately after the legacy write, rather than racing it with a fixed timeout.
    const originalSnap=this.snap;
    this.snap=(obj,x,y,cb,...rest)=>originalSnap.call(this,obj,x,y,(...args)=>{
      const r=cb?.(...args);
      syncGuidance(this);
      this.time.delayedCall(320,()=>syncGuidance(this));
      return r;
    },...rest);
    try{return oldDrop.call(this,o);}finally{this.snap=originalSnap;}
  };

  const oldServe=CraftRound.prototype.serve;
  CraftRound.prototype.serve=function(){
    const valid=this.chosen?.color===this.order?.color&&this.chosen?.decos?.includes(this.order?.deco)&&(!this.order?.container||this.chosen?.container===this.order.container)&&this.mixed;
    const result=oldServe.call(this);
    if(!valid)this.time.delayedCall(60,()=>syncGuidance(this));
    return result;
  };

  window.__ADUGAME_CLARITY_G3_STABLE_V5__={loaded:true,version:'5.2.15',stableConditionChain:true,ingredientSnapCallbackGuard:true,decoSnapCallbackGuard:true,wrongContainerGuard:true,wrongColorGuard:true,failedServeRecovery:true};
})();