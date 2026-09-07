// ADUGAME G1R2 production-input fallback v1.0.
// Normal play must never show a tool that is completely inert. The canonical v17 input
// remains primary. This capture-phase fallback activates only when that handler did not
// claim the pointer, then routes release through the original gameplay validators.
(() => {
  if (typeof G1R2 !== 'function') return;

  function attach(scene) {
    if (scene.scene?.key !== 'G1R2' || scene.__g1r2ProductionInputCleanup) return;
    const canvas = scene.game?.canvas;
    if (!canvas) return;

    let fallback = null;
    let pointerId = null;
    const count = {
      pasteDown:0,pasteMove:0,pasteUp:0,
      brushDown:0,brushMove:0,brushUp:0,
      clothDown:0,clothMove:0,clothUp:0,
      clipperDown:0,clipperMove:0,clipperUp:0
    };

    const logical = e => {
      const r = canvas.getBoundingClientRect();
      return {
        x:(e.clientX-r.left)*1280/Math.max(1,r.width),
        y:(e.clientY-r.top)*720/Math.max(1,r.height),
        inside:e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom
      };
    };
    const hit = (p,o) => !!o && Math.abs(p.x-o.x)<=92 && Math.abs(p.y-o.y)<=80;
    const visibleCandidates = () => {
      const step = Number(scene.step)||0;
      if (step===0) return [['paste',scene.paste],['brush',scene.brush]];
      if (step===1) return [['brush',scene.brush]];
      if (step===2) return [['cloth',scene.cloth]];
      if (step===3) return [['clipper',scene.clipper]];
      return [];
    };
    const canonicalActive = () => scene.debugState?.()?.g1r2V17Input?.active || null;

    const onDown = e => {
      if (pointerId!==null || scene.roundComplete || scene.interactionLocked) return;
      // The canonical v17 listener is registered first. If it claimed this pointer, do nothing.
      if (canonicalActive()) return;
      const p = logical(e);
      if (!p.inside) return;
      const found = visibleCandidates().find(([,o]) => hit(p,o));
      if (!found) return;
      const [kind,o] = found;
      fallback = {kind,o};
      pointerId = e.pointerId;
      count[`${kind}Down`]++;
      scene.markMeaningfulInput?.('drag_start',{id:kind,source:'production-fallback'});
      o.setDepth?.(1000);
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    };

    const onMove = e => {
      if (pointerId===null || e.pointerId!==pointerId || !fallback) return;
      const p = logical(e);
      if (!p.inside) return;
      const {kind,o} = fallback;
      o.setPosition(p.x,p.y);
      count[`${kind}Move`]++;
      if (kind==='brush') scene.brushMove(o,{x:p.x,y:p.y,isDown:true});
      else if (kind==='cloth') scene.clothMove(o,{x:p.x,y:p.y,isDown:true});
      e.preventDefault();
    };

    const finish = e => {
      if (pointerId===null || e.pointerId!==pointerId || !fallback) return;
      const a = fallback;
      fallback = null;
      pointerId = null;
      count[`${a.kind}Up`]++;
      if (a.kind==='paste') scene.dropPaste(a.o);
      else if (a.kind==='brush') scene.brushEnd(a.o);
      else if (a.kind==='cloth') scene.clothEnd(a.o);
      else if (a.kind==='clipper') scene.clipEnd(a.o);
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    };

    // Make later UX layers see the fallback as the active real tool so they do not pin it home.
    const priorDebug = scene.debugState?.bind(scene);
    if (priorDebug) {
      scene.debugState = () => {
        const d = priorDebug() || {};
        const base = d.g1r2V17Input || {};
        const merged = {...base};
        for (const [k,v] of Object.entries(count)) merged[k] = (Number(base[k])||0) + v;
        merged.active = fallback?.kind || base.active || null;
        return {...d,g1r2V17Input:merged,productionInputFallback:{...count,active:fallback?.kind||null}};
      };
    }

    window.addEventListener('pointerdown',onDown,{capture:true,passive:false});
    window.addEventListener('pointermove',onMove,{capture:true,passive:false});
    window.addEventListener('pointerup',finish,{capture:true,passive:false});
    window.addEventListener('pointercancel',finish,{capture:true,passive:false});

    const cleanup = () => {
      window.removeEventListener('pointerdown',onDown,true);
      window.removeEventListener('pointermove',onMove,true);
      window.removeEventListener('pointerup',finish,true);
      window.removeEventListener('pointercancel',finish,true);
      scene.__g1r2ProductionInputCleanup = null;
    };
    scene.__g1r2ProductionInputCleanup = cleanup;
    scene.events?.once?.('shutdown',cleanup);
    scene.events?.once?.('destroy',cleanup);
  }

  const priorCreate = G1R2.prototype.create;
  G1R2.prototype.create = function (...args) {
    const result = priorCreate.apply(this,args);
    const tryAttach = () => {
      if (this.scene?.key!=='G1R2' || this.__g1r2ProductionInputCleanup) return;
      if (this.__g1v17InputCleanup) attach(this);
      else this.time?.delayedCall?.(80,tryAttach);
    };
    this.time?.delayedCall?.(760,tryAttach);
    return result;
  };

  window.__ADUGAME_G1R2_PRODUCTION_INPUT_FIX__ = {
    loaded:true,
    version:'1.0',
    canonicalInputPrimary:true,
    visibleToolFallback:true,
    normalPlayCovered:true,
    generatedVisualAssets:0
  };
})();
