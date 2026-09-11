// ADUGAME v5 strict clarity patch.
// Goal: every required object is identifiable without reading an English code word,
// and every instruction/hint points at the actual accepted target for that state.
(() => {
  const ITEM_ICON={
    wheel:'🛞',screw:'🔩',driver:'🪛',wrench:'🔧',hammer:'🔨',paint:'🎨',cloth:'🧽',pump:'💨',ball:'⚽',cone:'🚧',helmet:'⛑',rake:'🧹',shovel:'🪏',hose:'🚿',plant:'🪴',wateringcan:'💧',picnic:'🧺',box:'📦',kite:'🪁',skateboard:'🛹',bucket:'🪣',brush:'🧹',oil:'🛢',sparewheel:'🛞',gloves:'🧤',
    bread:'🍞',cheese:'🧀',lettuce:'🥬',tomato:'🍅',apple:'🍎',banana:'🍌',carrot:'🥕',cup:'🥤',plate:'🍽',spoon:'🥄',pan:'🍳',pot:'🥘',towel:'🧻',book:'📕',cushion:'🛋',remote:'🎛',mug:'☕',cereal:'🥣',egg:'🥚',milk:'🥛',bowl:'🥣',fork:'🍴',knife:'🔪',napkin:'🧻',bottle:'🧴',
    shirt:'👕',pants:'👖',sock:'🧦',dress:'👗',soap:'🧼',detergent:'🧴',toothbrush:'🪥',toothpaste:'🧴',duck:'🦆',sponge:'🧽',basket:'🧺',hanger:'👚',shampoo:'🧴',comb:'🪮',toiletpaper:'🧻',slipper:'👟',robe:'🥋',toyboat:'⛵',hairdryer:'💨',washcloth:'🧽',
    blocks:'🧱',doll:'🪆',toycar:'🚗',pencil:'✏',paper:'📄',drum:'🥁',guitar:'🎸',train:'🚂',puzzle:'🧩',hat:'🧢',shoes:'👟',teddy:'🧸',snack:'🍪',pillow:'🛏',blanket:'🛌',robot:'🤖',cube:'◆',crayon:'🖍'
  };
  const ITEM_LABEL={
    wheel:'바퀴',screw:'나사',driver:'드라이버',wrench:'렌치',hammer:'망치',paint:'페인트',cloth:'천',pump:'펌프',ball:'공',cone:'안전콘',helmet:'헬멧',rake:'갈퀴',shovel:'삽',hose:'호스',plant:'화분',wateringcan:'물뿌리개',picnic:'돗자리',box:'상자',kite:'연',skateboard:'보드',bucket:'양동이',brush:'솔',oil:'오일',sparewheel:'예비바퀴',gloves:'장갑',
    bread:'빵',cheese:'치즈',lettuce:'상추',tomato:'토마토',apple:'사과',banana:'바나나',carrot:'당근',cup:'컵',plate:'접시',spoon:'숟가락',pan:'팬',pot:'냄비',towel:'수건',book:'책',cushion:'쿠션',remote:'리모컨',mug:'머그',cereal:'시리얼',egg:'달걀',milk:'우유',bowl:'그릇',fork:'포크',knife:'나이프',napkin:'냅킨',bottle:'병',
    shirt:'셔츠',pants:'바지',sock:'양말',dress:'원피스',soap:'비누',detergent:'세제',toothbrush:'칫솔',toothpaste:'치약',duck:'오리장난감',sponge:'스펀지',basket:'바구니',hanger:'옷걸이',shampoo:'샴푸',comb:'빗',toiletpaper:'휴지',slipper:'슬리퍼',robe:'가운',toyboat:'장난감배',hairdryer:'드라이어',washcloth:'세안천',
    blocks:'블록',doll:'인형',toycar:'자동차',pencil:'연필',paper:'종이',drum:'북',guitar:'기타',train:'기차',puzzle:'퍼즐',hat:'모자',shoes:'신발',teddy:'곰인형',snack:'간식',pillow:'베개',blanket:'담요',robot:'로봇',cube:'큐브',crayon:'크레용'
  };
  const FIXTURE={
    CAR:['🚗','자동차'], 'TOOL BOX':['🧰','공구함'], 'YARD BOX':['📦','마당 상자'], STOVE:['🍳','조리대'], SINK:['🚰','싱크대'], FRIDGE:['🧊','냉장고'], SOFA:['🛋','소파'], WASHER:['🧺','세탁기'], 'DRY RACK':['👕','건조대'], BATH:['🛁','욕조'], 'TOY BOX':['🧸','장난감 상자'], BED:['🛏','침대'], PATIO:['🪴','테라스']
  };
  const TOOL_ICON={soap:'🧼',toothbrush:'🪥',toothpaste:'🧴',cloth:'🧽',clipper:'✂',ball:'⚽',book:'📕',block:'🧱',apple:'🍎',carrot:'🥕',wholegrain:'🍞',cookie:'🍪',soda:'🥤'};

  function enhanceCard(c,icon,label){
    if(!c||!Array.isArray(c.list))return;
    const texts=c.list.filter(o=>o?.type==='Text');
    if(texts[0]){texts[0].setText(icon).setFontSize(27).setY(-10);}
    if(texts[1]){texts[1].setText(label||texts[1].text).setFontSize(12).setY(25);}
    c.visualIdentity='pictogram';c.semanticLabel=label||c.kind||c.name||'';c.pictogram=icon;
  }
  function wrapHabit(Klass,after){const original=Klass.prototype.create;Klass.prototype.create=function(){original.call(this);after.call(this);};}

  wrapHabit(G1R1,function(){
    enhanceCard(this.soap,'🧼','비누');
    if(this.flush){this.flush.setText('↻').setName('flush');this.flush.semanticLabel='물내림';this.flush.visualIdentity='pictogram';this.flush.pictogram='↻';}
    this.add.text(790,238,'물내림',{fontFamily:'Arial',fontSize:'11px',fontStyle:'bold',color:'#607086',backgroundColor:'#ffffffcc',padding:{left:5,right:5,top:2,bottom:2}}).setOrigin(.5).setDepth(12).setName('flush_label');
  });
  wrapHabit(G1R2,function(){
    [['brush','toothbrush','칫솔'],['paste','toothpaste','치약'],['cloth','cloth','세안천'],['clipper','clipper','손톱깎이']].forEach(([prop,kind,label])=>enhanceCard(this[prop],TOOL_ICON[kind],label));
    // Keep the fourth tool fully inside the activity panel and away from the status line.
    if(this.clipper){this.clipper.setY(545);this.clipper.home={x:this.clipper.x,y:545};}
  });
  wrapHabit(G1R3,function(){
    [...(this.toys||[]),...(this.foods||[])].forEach(c=>enhanceCard(c,TOOL_ICON[c.kind]||'◆',c.list?.filter(o=>o?.type==='Text')?.[1]?.text||c.kind));
    this.add.text(255,420,'🧺',{fontSize:'28px'}).setOrigin(.5).setDepth(1).setName('tidy_box_icon');
    this.add.text(255,515,'정리함',{fontFamily:'Arial',fontSize:'12px',fontStyle:'bold',color:'#5d3b1f'}).setOrigin(.5).setDepth(1).setName('tidy_box_label');
  });

  function patchHouse(Klass){
    const originalMakeItem=Klass.prototype.makeItem;
    Klass.prototype.makeItem=function(kind,x,y,f,i){
      const c=originalMakeItem.call(this,kind,x,y,f,i),icon=ITEM_ICON[kind],label=ITEM_LABEL[kind]||kind;
      if(!icon)throw new Error(`missing pictogram for house item: ${kind}`);
      const old=c.list?.find(o=>o?.type==='Text');if(old)old.setText(label.length>5?label.slice(0,5):label).setFontSize(9).setY(17);
      const pic=this.add.text(0,-8,icon,{fontSize:'25px'}).setOrigin(.5);c.add(pic);c.visualIdentity='pictogram';c.semanticLabel=label;c.pictogram=icon;return c;
    };
    const originalFixture=Klass.prototype.fixture;
    Klass.prototype.fixture=function(f,x,y,label,w,h,color){
      const c=originalFixture.call(this,f,x,y,label,w,h,color),info=FIXTURE[label];
      if(info){const t=c.list?.find(o=>o?.type==='Text');if(t)t.setText(`${info[0]}\n${info[1]}`).setAlign('center').setFontSize('14px');c.visualIdentity='pictogram';c.semanticLabel=info[1];c.pictogram=info[0];}
      return c;
    };
    const originalCreate=Klass.prototype.create;
    Klass.prototype.create=function(){
      originalCreate.call(this);
      this.items.forEach(o=>{if(!o.visualIdentity)throw new Error(`house item lacks visual identity: ${o.kind}`);});
      const dock=this.children.list.find(o=>o?.type==='Text'&&String(o.text).includes('CHARACTER'));if(dock)dock.setText('가족·친구');
    };
  }
  [G2R1,G2R2,G2R3].forEach(patchHouse);

  function renderOrderBadges(scene){
    if(!scene.orderBubble)return;
    scene.clarityOrderBadges?.destroy(true);scene.orderIcons?.setVisible(false);scene.orderLabel?.setText('주문 조건');
    const colorInfo={blue:[COLORS.blue,'파랑'],green:[COLORS.green,'초록'],pink:[0xff8fab,'분홍']}[scene.order.color];
    const decoInfo={star:['★','별'],flower:['✿','꽃'],heart:['♥','하트']}[scene.order.deco];
    const conds=[];
    if(colorInfo)conds.push({key:`color:${scene.order.color}`,kind:'color',value:colorInfo[0],label:colorInfo[1]});
    if(decoInfo)conds.push({key:`deco:${scene.order.deco}`,kind:'deco',value:decoInfo[0],label:decoInfo[1]});
    if(scene.order.container)conds.push({key:`container:${scene.order.container}`,kind:'container',value:scene.order.container,label:scene.order.container==='round'?'원형':'네모'});
    const root=scene.add.container(0,12).setName('clarity_order_badges');
    conds.forEach((c,i)=>{
      const x=(i-(conds.length-1)/2)*86,badge=scene.add.container(x,0).setName(`order_badge_${c.key}`),bg=scene.add.graphics();
      bg.fillStyle(0xf7f9fc,1).fillRoundedRect(-36,-31,72,62,12);bg.lineStyle(2,COLORS.ink,.12).strokeRoundedRect(-36,-31,72,62,12);badge.add(bg);
      if(c.kind==='color'){const g=scene.add.graphics();g.fillStyle(c.value,1).fillCircle(0,-7,15);g.lineStyle(2,COLORS.ink,.18).strokeCircle(0,-7,15);badge.add(g);}
      if(c.kind==='deco')badge.add(scene.add.text(0,-8,c.value,{fontFamily:'Arial',fontSize:'25px',fontStyle:'bold',color:c.value==='♥'?'#ff6b8a':'#6c63ff'}).setOrigin(.5));
      if(c.kind==='container'){const g=scene.add.graphics();g.lineStyle(4,0x607086,1);if(c.value==='round')g.strokeEllipse(0,-7,31,23);else g.strokeRoundedRect(-15,-19,30,24,4);badge.add(g);}
      badge.add(scene.add.text(0,20,c.label,{fontFamily:'Arial',fontSize:'10px',fontStyle:'bold',color:'#607086'}).setOrigin(.5));root.add(badge);
    });
    scene.orderBubble.add(root);scene.clarityOrderBadges=root;scene.clarityOrderConditionKeys=conds.map(c=>c.key);
  }

  CraftRound.prototype.orderText=function(){
    const color={blue:'🔵',green:'🟢',pink:'🩷'}[this.order.color]||'',deco={star:'★',flower:'✿',heart:'♥'}[this.order.deco]||'',container=this.order.container==='round'?'  ◯':this.order.container==='square'?'  ▢':'';
    return `${color}  ${deco}${container}`;
  };
  CraftRound.prototype.renderClarityOrderBadges=function(){renderOrderBadges(this);};
  const originalCraftCreate=CraftRound.prototype.create;
  CraftRound.prototype.create=function(){
    originalCraftCreate.call(this);
    const relabel=(c,text,icon)=>{if(!c)return;const t=c.list?.find(o=>o?.type==='Text');if(t)t.setText(`${icon}\n${text}`).setAlign('center').setFontSize('12px');c.visualIdentity='pictogram';c.semanticLabel=text;c.pictogram=icon;};
    relabel(this.base,'베이스','🧴');relabel(this.activator,'활성액','💧');
    this.serveButton?.setText('손님에게 주기');
    this.status?.setText('베이스와 활성액을 그릇에 넣고 주문 색을 고른 뒤 섞어요');
    if(this.base)this.hintTarget={x:this.base.x,y:this.base.y};
    this.children.list.filter(o=>o?.name==='container_round'||o?.name==='container_square').forEach(o=>o.on('pointerup',()=>{
      const selected=this.chosen.container;
      const wanted=this.order?.container;
      if(wanted&&selected!==wanted){
        const round=wanted==='round',x=round?230:380;
        this.status.setText(`주문은 ${round?'동그란':'네모난'} 용기예요. ${round?'동그란':'네모난'} 용기를 선택해요`);
        this.hintTarget={x,y:585};
      }else if(!wanted||selected===wanted){
        this.status.setText('주문 조건을 모두 맞췄어요. 손님에게 주기를 눌러요');
        this.hintTarget={x:this.serveButton.x,y:this.serveButton.y};
      }
    }));
    renderOrderBadges(this);
  };
  const originalCompleteMix=CraftRound.prototype.completeMix;
  CraftRound.prototype.completeMix=function(){
    const result=originalCompleteMix.call(this);const x={star:210,flower:305,heart:400,banana:495}[this.order.deco];if(x)this.hintTarget={x,y:485};return result;
  };
  const originalDropDeco=CraftRound.prototype.dropDeco;
  CraftRound.prototype.dropDeco=function(o){
    const result=originalDropDeco.call(this,o);
    this.time.delayedCall(230,()=>{
      if(!this.mixed||!this.chosen.decos.includes(o.kind))return;
      if(this.order.container&&this.chosen.container!==this.order.container){
        const round=this.order.container==='round',x=round?230:380;
        this.status.setText(`주문은 ${round?'동그란':'네모난'} 용기예요. ${round?'동그란':'네모난'} 용기를 선택해요`);
        this.hintTarget={x,y:585};
      }else{
        this.status.setText('주문 조건을 확인하고 손님에게 주기를 눌러요');
        this.hintTarget={x:this.serveButton.x,y:this.serveButton.y};
      }
    });
    return result;
  };
  const originalNext=CraftRound.prototype.prepareNextOrder;
  CraftRound.prototype.prepareNextOrder=function(){const result=originalNext.call(this);this.status?.setText('다음 손님이에요. 베이스와 활성액부터 다시 넣어요');if(this.base)this.hintTarget={x:this.base.x,y:this.base.y};renderOrderBadges(this);return result;};

  window.__ADUGAME_CLARITY_V5__={loaded:true,version:'5.2.1',houseIcons:Object.keys(ITEM_ICON).length,strictCommandMapping:true,orderBadges:true};
})();
