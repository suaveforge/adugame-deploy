// ADUGAME G1 benchmark art pass v9.0
// Final scene-native visual pass for G1R3 only. G1R2 is owned exclusively by the v17 production layer.
(() => {
  if (typeof G1R3 !== 'function') return;
  const P={ink:0x31546a,deep:0x4b7890,sky:0xdff6fb,sky2:0xbfe9f2,cream:0xfff7e5,floor:0xffe7bd,white:0xffffff,
    mint:0x9ee2c4,mint2:0x6fc7a0,pink:0xffa9c2,pink2:0xf47fa1,yellow:0xffd76a,blue:0x69bce4,peach:0xffc2a6,brown:0xb97854,orange:0xf2a65a,red:0xe96464};
  const kill=(scene,name)=>scene.children.list.filter(o=>o?.name===name).forEach(o=>o.destroy());
  const clear=c=>{ if(c?.removeAll)c.removeAll(true); };
  const txt=(scene,x,y,t,size=14,depth=25)=>scene.add.text(x,y,t,{fontFamily:'Arial, sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:'#31546a'}).setOrigin(.5).setDepth(depth);

  function hideChrome(scene){
    scene.children.list.forEach(o=>{
      if(o?.type!=='Text') return;
      const t=String(o.text||'').trim();
      if(t.startsWith('생활도구') || t==='도구 보기') o.setVisible(false);
      if(t.startsWith('생활 실습') && t.includes('ROUND')) o.setVisible(false);
      if(t===scene.meta?.title) o.setVisible(false);
    });
    if(scene.status) scene.status.setPosition(650,630).setFontSize('20px').setColor('#31546a').setBackgroundColor('#ffffffee').setPadding(18,10,18,10).setDepth(340);
  }

  function bathroomWorld(scene){
    kill(scene,'g1v9_r2_world');
    const c=scene.add.container(0,0).setDepth(2.7).setName('g1v9_r2_world');
    const g=scene.add.graphics();
    g.fillStyle(P.white,1).fillRoundedRect(88,145,1104,457,34);
    g.fillStyle(P.sky,1).fillRoundedRect(101,158,1078,278,25);
    g.fillStyle(P.floor,1).fillRect(101,408,1078,181);
    g.lineStyle(2,P.white,.75);for(let x=118;x<1170;x+=74)g.lineBetween(x,158,x,408);for(let y=204;y<408;y+=48)g.lineBetween(101,y,1179,y);
    g.lineStyle(4,P.deep,.18).strokeRoundedRect(88,145,1104,457,34);
    g.fillStyle(P.white,.95).fillRoundedRect(126,188,205,360,27);g.lineStyle(4,P.blue,.26).strokeRoundedRect(126,188,205,360,27);
    g.fillStyle(P.deep,.13).fillRoundedRect(145,212,167,13,7).fillRoundedRect(145,325,167,13,7).fillRoundedRect(145,438,167,13,7).fillRoundedRect(145,535,167,13,7);
    g.fillStyle(P.white,1).fillRoundedRect(594,171,395,384,34);g.lineStyle(7,P.blue,.38).strokeRoundedRect(594,171,395,384,34);
    g.fillStyle(0xcdf2fa,.72).fillRoundedRect(613,190,357,346,27);
    g.fillStyle(P.white,.6).fillRoundedRect(638,212,122,14,7);
    g.fillStyle(P.white,1).fillRoundedRect(615,521,350,58,28);g.lineStyle(4,P.deep,.2).strokeRoundedRect(615,521,350,58,28);g.fillStyle(P.sky2,1).fillEllipse(790,548,230,37);
    g.fillStyle(P.mint,.72).fillRoundedRect(988,390,151,171,24);g.fillStyle(P.white,.86).fillRoundedRect(1004,406,119,139,18);
    g.fillStyle(P.yellow,1).fillCircle(1078,231,17);g.fillStyle(P.mint2,.8).fillEllipse(1110,239,39,24);
    g.fillStyle(P.pink,.45).fillRoundedRect(1035,270,74,62,13);
    c.add(g);
    txt(scene,228,171,'세면도구',15,4);txt(scene,790,164,'거울',14,4);txt(scene,1064,372,'손톱 정리',14,4);
  }

  function tool(scene,c,kind){
    if(!c)return; clear(c);const g=scene.add.graphics();
    g.fillStyle(P.ink,.06).fillEllipse(0,34,100,18);
    if(kind==='toothpaste'){
      g.fillStyle(P.white,1).fillRoundedRect(-52,-22,91,44,12);g.lineStyle(4,P.blue,.55).strokeRoundedRect(-52,-22,91,44,12);g.fillStyle(P.mint2,1).fillRoundedRect(-34,-10,47,20,7);g.fillStyle(P.blue,1).fillRoundedRect(39,-14,20,28,7);
    }else if(kind==='toothbrush'){
      g.fillStyle(P.blue,1).fillRoundedRect(-54,-7,95,14,7);g.fillStyle(P.deep,1).fillRoundedRect(33,-13,31,26,8);for(let x=38;x<59;x+=6)g.fillStyle(P.white,1).fillRoundedRect(x,-20,4,12,2);
    }else if(kind==='cloth'){
      g.fillStyle(P.mint,1).fillRoundedRect(-44,-31,88,62,15);g.lineStyle(4,P.mint2,.5).strokeRoundedRect(-44,-31,88,62,15);g.lineStyle(3,P.white,.6).lineBetween(-30,-15,30,17).lineBetween(-28,5,14,26);
    }else if(kind==='clipper'){
      g.lineStyle(12,0x889aa5,1).beginPath().moveTo(-37,20).lineTo(31,-22).strokePath();g.lineStyle(8,0xe1e9ed,1).beginPath().moveTo(-31,27).lineTo(37,-15).strokePath();g.lineStyle(5,P.deep,.75).strokeCircle(35,-18,9);g.fillStyle(P.deep,1).fillRoundedRect(-43,12,26,15,6);
    }
    c.add(g);c.visualIdentity='illustrated';c.semanticLabel={toothpaste:'치약',toothbrush:'칫솔',cloth:'세안천',clipper:'손톱깎이'}[kind];c.setDepth(20);
  }

  function faceStation(scene){
    const face=scene.face;if(face){clear(face);const g=scene.add.graphics();g.fillStyle(P.peach,1).fillCircle(0,-12,86);g.lineStyle(5,P.brown,.28).strokeCircle(0,-12,86);g.fillStyle(P.brown,1).fillEllipse(0,-79,141,48);g.fillStyle(P.ink,.85).fillCircle(-28,-27,6).fillCircle(28,-27,6);g.fillStyle(P.pink,.35).fillCircle(-51,-2,12).fillCircle(51,-2,12);face.add(g);face.setDepth(7);face.visualIdentity='illustrated';}
    if(scene.mouth){scene.mouth.setFillStyle(0x7f4052,1).setStrokeStyle(5,0x9f6876,.38).setDepth(8);}
    const hand=scene.hand;if(hand){clear(hand);const g=scene.add.graphics();g.fillStyle(P.ink,.06).fillEllipse(0,48,190,24);g.fillStyle(P.peach,1).fillRoundedRect(-78,-2,156,61,28);[-52,-26,0,26,52].forEach((x,i)=>g.fillRoundedRect(x-10,-48+(i%2)*4,20,53,10));hand.add(g);hand.setDepth(10);hand.visualIdentity='illustrated';}
    (scene.nails||[]).forEach(n=>n.setDepth(12).setFillStyle(0xfff9f4,1).setStrokeStyle(2,0xd89082,.55));
  }

  function applyR2(scene){
    if(scene.scene?.key!=='G1R2')return;
    bathroomWorld(scene);tool(scene,scene.paste,'toothpaste');tool(scene,scene.brush,'toothbrush');tool(scene,scene.cloth,'cloth');tool(scene,scene.clipper,'clipper');faceStation(scene);hideChrome(scene);
    scene.v9Art='benchmark-r2-bathroom';
  }

  function roomWorld(scene){
    kill(scene,'g1v9_r3_world');
    const c=scene.add.container(0,0).setDepth(2.6).setName('g1v9_r3_world');const g=scene.add.graphics();
    g.fillStyle(P.white,1).fillRoundedRect(80,145,1115,462,34);g.fillStyle(0xfff3df,1).fillRoundedRect(94,158,1087,286,25);g.fillStyle(0xe7c18f,1).fillRect(94,414,1087,178);g.lineStyle(4,P.brown,.16).strokeRoundedRect(80,145,1115,462,34);
    g.fillStyle(P.sky2,.72).fillRoundedRect(120,188,360,174,28);g.fillStyle(P.blue,.14).fillEllipse(300,360,340,72);g.fillStyle(P.brown,1).fillRoundedRect(160,424,190,112,22);g.fillStyle(0xd5965f,1).fillRoundedRect(150,412,210,30,12);g.fillStyle(P.yellow,.45).fillCircle(188,460,10).fillCircle(322,460,10);
    g.fillStyle(P.mint,.55).fillRoundedRect(505,188,520,174,28);g.fillStyle(P.brown,1).fillRoundedRect(590,426,350,30,13);g.fillStyle(0xd59b66,1).fillRoundedRect(610,454,26,86,8).fillRoundedRect(894,454,26,86,8);
    g.fillStyle(P.white,.9).fillRoundedRect(1037,190,105,86,18);g.lineStyle(5,P.pink2,.28).strokeRoundedRect(1037,190,105,86,18);g.fillStyle(P.yellow,.75).fillCircle(1070,222,15);g.fillStyle(P.mint2,.7).fillEllipse(1104,232,33,22);
    g.fillStyle(P.mint2,1).fillEllipse(1093,457,27,57).fillEllipse(1120,462,28,62);g.fillStyle(P.white,1).fillRoundedRect(1080,489,55,45,12);
    c.add(g);txt(scene,300,203,'장난감 정리',16,4);txt(scene,765,203,'건강한 한 끼',16,4);
  }

  function applyR3(scene){
    if(scene.scene?.key!=='G1R3')return;
    roomWorld(scene);hideChrome(scene);
    [...(scene.toys||[]),...(scene.foods||[])].forEach(o=>{o.setDepth(20);o.visualIdentity='illustrated';});
    if(scene.box)scene.box.setDepth(8);if(scene.plate)scene.plate.setDepth(8);if(scene.face)scene.face.setDepth(12);
    scene.v9Art='benchmark-r3-room';
  }

  const oldR3=G1R3.prototype.create;G1R3.prototype.create=function(){oldR3.call(this);this.time.delayedCall(190,()=>applyR3(this));};
  window.__ADUGAME_G1_BENCHMARK_ART_V9__={loaded:true,version:'9.1',r2SceneNative:false,r3SceneNative:true};
})();
