// ADUGAME benchmark-v5 house QA fixes.
// Keeps the free-play world, but prevents the 25-item floor inventories from sitting
// on top of fixtures and each other. Nine shelf objects are exposed at a time; objects
// dragged into the room become persistent world objects and are no longer paged away.
(() => {
  window.__ADUGAME_HOUSE_V5_FIXES__={version:'5.0.1',loaded:true};
  const FLOOR_NAMES=['차고·마당','주방·거실','욕실·세탁실','아이방·테라스'];
  const CLASSES=[G2R1,G2R2,G2R3];

  // Keep the feed discovery sparkle on the character, but render its long toast in
  // the clear header lane. The world-relative toast could cover the sink label and
  // elevator cargo count when a character was fed on the right side of the room.
  const originalDiscover=DiscoveryRound.prototype.discover;
  DiscoveryRound.prototype.discover=function(id,x,y,msg){
    if(id!=='feed_character'||!this.focusRound)return originalDiscover.call(this,id,x,y,msg);
    if(this.discoveries.has(id))return;
    this.discoveries.add(id);
    this.sparkle(x,y,7);
    const note=this.add.text(650,52,'발견! '+msg,{fontFamily:'Arial',fontSize:'15px',fontStyle:'bold',color:'#ffffff',backgroundColor:'#6c63ff',padding:{left:10,right:10,top:6,bottom:6}}).setOrigin(.5).setDepth(2500);
    this.tweens.add({targets:note,y:28,alpha:0,duration:1050,hold:420,onComplete:()=>note.destroy()});
    audio.pop();telemetry('discovery',{id,round:this.scene.key});
  };

  for(const Klass of CLASSES){
    const originalCreate=Klass.prototype.create;
    const originalShowFloor=Klass.prototype.showFloor;
    const originalDropItem=Klass.prototype.dropItem;

    Klass.prototype.create=function(){
      originalCreate.call(this);
      this.inventoryPage=0;
      this.inventoryPageCount=3;

      // Original inventory has exactly 25 items per floor. Reuse the old logical x
      // coordinates for the first nine mission-relevant objects, but collapse every
      // later page onto the same clean top shelf instead of overlaying the room.
      this.items.forEach((o,globalIndex)=>{
        const localIndex=globalIndex%25;
        o.shelfPage=Math.floor(localIndex/9);
        o.shelfSlot=localIndex%9;
        o.inShelf=true;
        o.x=330+o.shelfSlot*82;
        o.y=205;
        o.home={x:o.x,y:o.y};
        o.on('dragstart',()=>{
          if(o.inShelf){o.inShelf=false;telemetry('house_shelf_pick',{kind:o.kind,page:o.shelfPage,floor:o.floor});}
        });
      });

      this.inventoryHud=this.add.container(1065,188).setDepth(245).setName('inventory_pager');
      const bg=this.add.graphics();bg.fillStyle(0xffffff,.94).fillRoundedRect(-82,-25,164,50,16);bg.lineStyle(2,COLORS.ink,.12).strokeRoundedRect(-82,-25,164,50,16);
      const prev=this.add.text(-55,0,'‹',{fontFamily:'Arial',fontSize:'27px',fontStyle:'bold',color:'#24314a'}).setOrigin(.5).setInteractive({useHandCursor:true});
      const next=this.add.text(55,0,'›',{fontFamily:'Arial',fontSize:'27px',fontStyle:'bold',color:'#24314a'}).setOrigin(.5).setInteractive({useHandCursor:true});
      this.inventoryPageText=this.add.text(0,0,'물건 1/3',{fontFamily:'Arial',fontSize:'12px',fontStyle:'bold',color:'#607086'}).setOrigin(.5);
      prev.on('pointerup',()=>this.setInventoryPage((this.inventoryPage+this.inventoryPageCount-1)%this.inventoryPageCount));
      next.on('pointerup',()=>this.setInventoryPage((this.inventoryPage+1)%this.inventoryPageCount));
      this.inventoryHud.add([bg,prev,next,this.inventoryPageText]);

      // Correct the physical floor numbering: garage/yard is 1F, children/patio is 4F.
      this.floorRail?.list?.forEach((b,i)=>b.setText(`${i+1}F\n${FLOOR_NAMES[i]}`));
      this.refreshInventoryShelf();
      telemetry('house_inventory_pager_ready',{pageSize:9,pages:3});
    };

    Klass.prototype.setInventoryPage=function(page){
      this.inventoryPage=Math.max(0,Math.min(this.inventoryPageCount-1,page));
      this.inventoryPageText?.setText(`물건 ${this.inventoryPage+1}/${this.inventoryPageCount}`);
      this.refreshInventoryShelf();
      audio.click();
      telemetry('house_inventory_page',{floor:this.currentFloor,page:this.inventoryPage});
    };

    Klass.prototype.refreshInventoryShelf=function(){
      if(!this.items)return;
      this.items.forEach(o=>{
        const stateHidden=o.state==='washer_loaded';
        let visible=false;
        if(!stateHidden&&!o.inElevator&&o.floor===this.currentFloor){
          visible=!o.inShelf||o.shelfPage===this.inventoryPage;
        }
        o.setVisible(visible);
        if(o.input)o.input.enabled=visible;
        if(o.inShelf){
          o.x=330+o.shelfSlot*82;
          o.y=205;
          o.home={x:o.x,y:o.y};
        }
      });
    };

    Klass.prototype.showFloor=function(f,initial=false){
      originalShowFloor.call(this,f,initial);
      // Give each floor its own shelf page context and immediately disable the hidden
      // hit areas. This is important: invisible objects must never steal a pointer.
      this.inventoryPage=0;
      this.inventoryPageText?.setText('물건 1/3');
      this.refreshInventoryShelf?.();
    };

    Klass.prototype.dropItem=function(o){
      o.inShelf=false;
      const result=originalDropItem.call(this,o);
      this.refreshInventoryShelf?.();
      return result;
    };

    const originalDebug=Klass.prototype.debugState;
    Klass.prototype.debugState=function(){
      const st=originalDebug.call(this);
      return {...st,inventoryPage:this.inventoryPage??0,visibleShelfItems:this.items?.filter(o=>o.inShelf&&o.floor===this.currentFloor&&o.visible).length??0};
    };
  }
})();