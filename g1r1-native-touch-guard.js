// ADUGAME G1R1 native touch guard v1.0.
// Mobile Safari/WebKit can deliver a real canvas touchend without Phaser emitting the
// late-created flush container's pointerup. Route only a genuine touch inside the visible
// flush target through the canonical flushToilet() method; never mutate step/state here.
(() => {
  if (typeof G1R1 !== 'function') return;

  function attach(scene){
    if(scene.__g1r1NativeTouchGuard || scene.scene?.key !== 'G1R1') return;
    const canvas=scene.game?.canvas;
    if(!canvas) return;
    scene.__g1r1NativeTouchGuard=true;

    const toLogical=(touch)=>{
      const r=canvas.getBoundingClientRect();
      if(!touch || !r.width || !r.height) return null;
      if(touch.clientX<r.left || touch.clientX>r.right || touch.clientY<r.top || touch.clientY>r.bottom) return null;
      return {x:(touch.clientX-r.left)*1280/r.width,y:(touch.clientY-r.top)*720/r.height};
    };
    const hitsFlush=(p)=>{
      if(!p || scene.step!==.5 || scene.roundComplete || scene.interactionLocked) return false;
      const target=scene.flushInputTarget;
      if(!target || target.visible===false || target.active===false) return false;
      try{
        const b=target.getBounds?.();
        if(b && Phaser.Geom.Rectangle.Contains(b,p.x,p.y)) return true;
      }catch(_){ }
      return Math.abs(p.x-(target.x??790))<=34 && Math.abs(p.y-(target.y??275))<=27;
    };
    const onTouchEnd=(e)=>{
      if(scene.step!==.5 || scene.roundComplete || scene.interactionLocked) return;
      const touches=Array.from(e.changedTouches||[]);
      const matched=touches.map(toLogical).find(hitsFlush);
      if(!matched) return;
      scene.__g1r1NativeFlushTouchCount=(scene.__g1r1NativeFlushTouchCount||0)+1;
      scene.__g1r1NativeFlushLast={x:Math.round(matched.x),y:Math.round(matched.y)};
      scene.markMeaningfulInput?.('flush_touch',{x:Math.round(matched.x),y:Math.round(matched.y),source:'canvas-touchend'});
      scene.flushToilet();
    };
    canvas.addEventListener('touchend',onTouchEnd,{capture:true,passive:true});

    const priorDebug=scene.debugState?.bind(scene);
    if(priorDebug && !scene.__g1r1NativeTouchDebugWrapped){
      scene.__g1r1NativeTouchDebugWrapped=true;
      scene.debugState=function(){
        return {...priorDebug(),g1r1NativeTouch:{ready:true,flushTouchCount:scene.__g1r1NativeFlushTouchCount||0,last:scene.__g1r1NativeFlushLast||null}};
      };
    }
    const cleanup=()=>{
      canvas.removeEventListener('touchend',onTouchEnd,true);
      scene.__g1r1NativeTouchGuard=false;
    };
    scene.events.once('shutdown',cleanup);
    scene.events.once('destroy',cleanup);
  }

  const priorCreate=G1R1.prototype.create;
  G1R1.prototype.create=function(){
    priorCreate.call(this);
    const scene=this;
    this.time?.delayedCall?.(300,()=>attach(scene));
    window.setTimeout(()=>{if(scene.sys?.isActive?.())attach(scene);},420);
  };

  window.__ADUGAME_G1R1_NATIVE_TOUCH_GUARD__={loaded:true,version:'1.0',canonicalFlushOnly:true,realCanvasTouchOnly:true,generatedVisualAssets:0};
})();
