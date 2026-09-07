// Final live visual spacing/guidance guard for v6.2.
(() => {
  const suppressHiddenVocabInput = scene => {
    const sync = () => {
      for (const o of scene.children?.list || []) {
        if (o?.type !== 'Text' || Number(o.depth) !== 320 || !String(o.text || '').startsWith('생활도구') || !o.input) continue;
        const shown = o.visible !== false && Number(o.alpha ?? 1) > .02;
        if (!shown && o.input.enabled) {
          o.input.enabled = false;
          o.__v6HiddenInputSuppressed = true;
        } else if (shown && o.__v6HiddenInputSuppressed) {
          o.input.enabled = true;
          o.__v6HiddenInputSuppressed = false;
        }
      }
    };
    scene.events?.on?.('postupdate', sync);
    sync();
  };

  if(typeof G1R2!=='undefined'){
    const oldCreate=G1R2.prototype.create;
    G1R2.prototype.create=function(){
      oldCreate.call(this);
      // The illustrated Korean label extends the clipper container below the activity panel.
      // Lift the live object (and its drag return home) rather than weakening the layout gate.
      if(this.clipper){
        this.clipper.setY(570);
        if(this.clipper.home)this.clipper.home={...this.clipper.home,y:570};
      }
      // Late authored layers intentionally hide the vocabulary chip. Hidden controls must
      // stop accepting pointer input until they become visible again.
      suppressHiddenVocabInput(this);
    };
  }

  if(typeof G1R3!=='undefined'){
    const HEALTHY=new Set(['apple','carrot','wholegrain']);
    const FOOD_X={apple:520,carrot:630,wholegrain:740,cookie:850,soda:960};
    const center=o=>o?{x:o.x,y:o.y}:null;
    const nextToy=scene=>(scene.toys||[]).find(o=>o?.input?.enabled&&!scene.tidied?.has(o.kind)&&o.visible!==false);
    const nextHealthy=scene=>(scene.foods||[]).find(o=>HEALTHY.has(o.kind)&&o.visible!==false&&!scene.chosen?.includes(o));
    const hideChildLabels=o=>(o?.list||[]).filter(x=>x?.type==='Text').forEach(x=>x.setVisible(false));

    const oldCreate=G1R3.prototype.create;
    G1R3.prototype.create=function(){
      oldCreate.call(this);

      // Keep the five real food targets evenly spaced. The previous soda-only correction
      // collapsed cookie and soda into one hit/visual area.
      for(const o of this.foods||[]){
        const x=FOOD_X[o.kind];
        if(Number.isFinite(x)){
          o.setPosition(x,270);
          o.home={x,y:270};
          o.setDepth(18);
        }
      }

      // visual-v6-polish headings are superseded by the later authored headings.
      // Remove the duplicate text instead of tolerating overlapping copies.
      this.children.list
        .filter(o=>o?.type==='Text'&&(o.text==='정리할 장난감'||o.text==='오늘 먹을 음식'))
        .forEach(o=>o.destroy());

      // visual-v6-polish moves the live objects after the habit scene created its old hint.
      // Rebind guidance to the final live object center, never to a pre-polish coordinate.
      const first=nextToy(this);
      if(this.step===0&&first)this.hintTarget=center(first);
      suppressHiddenVocabInput(this);
    };

    // Keep state, visible object and hint aligned. For intermediate successes the next
    // target is known at drop time, so switch guidance immediately while snap feedback plays.
    G1R3.prototype.dropToy=function(o){
      if(this.step!==0||dist(o.x,o.y,255,465)>145){this.wrongReturn(o,'tidy_miss',this.box);return;}
      this.tidied.add(o.kind);
      if(this.tidied.size<3)this.hintTarget=center(nextToy(this));
      this.snap(o,210+(this.tidied.size-1)*45,470,()=>{
        o.setScale(.72);
        if(o.input)o.input.enabled=false;
        // Once a toy is visibly inside the storage box, its floating shelf label is no
        // longer useful and collides with the box label. The toy itself remains visible.
        hideChildLabels(o);
        this.v5SetStep(this.tidied.size);
        if(this.tidied.size===3){
          this.step=1;
          this.status.setText('정리 완료! 사과·당근·통곡물처럼 균형 잡힌 음식 3가지를 접시에 골라요');
          this.hintTarget=center(nextHealthy(this));
          this.sparkle(255,465,6);
        }else{
          this.hintTarget=center(nextToy(this));
        }
      });
    };

    G1R3.prototype.dropFood=function(o){
      if(this.step!==1){if(this.step===2&&this.chosen.includes(o))return this.feedFood(o);this.wrongReturn(o,'meal_order',this.plate);return;}
      if(dist(o.x,o.y,735,475)>190){this.wrongReturn(o,'meal_plate',this.plate);return;}
      if(!HEALTHY.has(o.kind)){this.curious(this.face);this.wrongReturn(o,'balanced_choice',this.plate);this.status.setText('매일 먹는 식사는 과일·채소·통곡물처럼 몸에 좋은 조합으로 골라봐요');this.hintTarget=center(nextHealthy(this));return;}
      if(this.chosen.includes(o))return;
      const idx=this.chosen.length;this.chosen.push(o);
      if(this.chosen.length<3)this.hintTarget=center(nextHealthy(this));
      this.snap(o,660+idx*75,470-idx*5,()=>{
        o.setScale(.72);o.home={x:o.x,y:o.y};this.v5SetStep(4+this.chosen.length);
        if(this.chosen.length===3){
          this.step=2;
          this.status.setText('좋은 조합이에요. 접시의 음식을 하나씩 캐릭터에게 가져가 먹여요');
          this.hintTarget=center(this.chosen[0]);
          this.happy(this.face);
        }else{
          this.hintTarget=center(nextHealthy(this));
        }
      });
    };
  }

  if(typeof G2R1!=='undefined'){
    const setFixtureLabelVisible=(fixture,visible)=>{
      (fixture?.list||[]).filter(o=>o?.type==='Text').forEach(o=>o.setVisible(visible));
    };
    [G2R1,G2R2,G2R3].forEach(K=>{
      const oldCreate=K.prototype.create;
      K.prototype.create=function(){
        oldCreate.call(this);
        const sync=()=>{
          // A label belongs behind the object once the real item is visibly occupying
          // that fixture. Hide only the redundant label; do not alter the live target.
          if(this.focusRound===1&&this.stove){
            const occupied=(this.items||[]).some(o=>o?.visible!==false&&o?.state==='cooked'&&dist(o.x,o.y,this.stove.x,this.stove.y)<135);
            setFixtureLabelVisible(this.stove,!occupied);
          }
          if(this.focusRound===2&&this.rack){
            const occupied=(this.items||[]).some(o=>o?.visible!==false&&o?.state==='dry'&&dist(o.x,o.y,this.rack.x,this.rack.y)<175);
            setFixtureLabelVisible(this.rack,!occupied);
          }
        };
        this.events?.on?.('postupdate',sync);
        sync();
      };

      const oldDiscover=K.prototype.discover;
      K.prototype.discover=function(id,x,y,msg){
        // Keep transient discovery feedback near the action while out of the inventory/
        // workbench label band. These are presentation coordinates only; the real action,
        // discovery id and state transition are unchanged.
        if(id==='feed_character')x=1120;
        if(String(id||'').startsWith('repair_')||id==='wrench_free')y=360;
        return oldDiscover.call(this,id,x,y,msg);
      };
    });
  }

  window.__ADUGAME_VISUAL_V6_GUARD__={
    loaded:true,
    version:'6.2.9',
    r2ClipperSpacing:true,
    r3CharacterSpacing:true,
    r3LiveGuidance:true,
    r3AtomicGuidance:true,
    r3ImmediateNextTarget:true,
    hiddenInputHygiene:true,
    r3DuplicateHeadingRemoved:true,
    r3FoodSpacing:true,
    occupiedFixtureLabelHygiene:true,
    houseDiscoverySpacing:true
  };
})();
