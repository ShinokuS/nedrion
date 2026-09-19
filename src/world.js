import Phaser from 'phaser';
import assets from './original-assets.json';
import {state,save,toast,closePanel} from './main.js';
import {grid,put,rollLoot,rng} from './core.js';

// World and interface have separate cameras: world zoom never moves UI hit areas.
export function installWorld(Scene, simulationRaid) {
 const baseCreate=Scene.prototype.create,baseReset=Scene.prototype.resetWorld,baseUpdate=Scene.prototype.update,baseObject=Scene.prototype.addObject,baseInteract=Scene.prototype.interact;
 Object.assign(Scene.prototype,{
  create(){
   this.uiScale=Math.max(.75,this.scale.height/720);this.uiWidth=this.scale.width/this.uiScale;this.uiHeight=720;
   this.uiCamera=this.cameras.add(0,0,this.scale.width,this.scale.height,false,'interface').setOrigin(0).setZoom(this.uiScale);
   this.cameras.main.setZoom(2);
   this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE,o=>{o.cameraFilter=this.uiCamera.id;});
   for(const [key,frames]of Object.entries(assets))if(key.startsWith('knight-')||key.startsWith('mob-'))this.anims.create({key,frames:frames.map((_,n)=>({key:`original-${key}-${n}`})),frameRate:key.includes('walk')?10:key.includes('attack')?14:7,repeat:key.includes('attack')||key.includes('dies')?0:-1});
   for(let n=0;n<6;n++){const t=this.textures.get(`hs-pitfire-${n}`),im=t.getSourceImage();t.add('hearth',0,0,im.height-56,im.width,56);}this.anims.create({key:'hearth',frames:Array.from({length:6},(_,n)=>({key:`hs-pitfire-${n}`,frame:'hearth'})),frameRate:9,repeat:-1});const bookshelf=this.textures.get('original-books-0'),bookImage=bookshelf.getSourceImage();bookshelf.add('shelf',0,0,50,bookImage.width,bookImage.height-50);this.textures.get('original-knight-idle-down-0').add('portrait',0,18,0,36,32);baseCreate.call(this);this.input.removeAllListeners('pointerdown');
  },
  resetWorld(){baseReset.call(this);this.hoverObject=null;this.occluders=[];this.navigationMap=null;},
  markUI(parent){if(!parent)return;parent.cameraFilter=this.cameras.main.id;for(const child of parent.list||[]){child.setScrollFactor(0);child.cameraFilter=this.cameras.main.id;}},
  startHub(){
   this.resetWorld();state.mode='hub';const w=96,h=80;
   this.map={w,h,rooms:[],tiles:Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x>25&&x<71&&y>25&&y<60?1:0))};
   this.drawMap(true);
   this.addObject('stash',1392,1450,'stash-0','Тайник');
   this.addObject('vendor',1680,1450,'trader-0','Торговец');
   const guide=this.addObject('expedition',1536,1360,'hero-0','Вход в катакомбы');guide.sprite.setVisible(false);
   this.portal(1536,1360,0xffffff);
   this.makeHero(1536,1480);
   this.cameras.main.setBounds(0,0,w*32,h*32).setZoom(2).startFollow(this.hero,true,.14,.14).centerOn(this.hero.x,this.hero.y);
   this.addVignette();this.vignette.setAlpha(.4);this.createCanvasHud();this.renderOverlay(true);
  },
  startRaid(){
   simulationRaid.call(this);this.cameras.main.setZoom(2).centerOn(this.hero.x,this.hero.y);this.vignette.setAlpha(.35);
   const themes=[['rack','rack','chest-closed'],['cage','bed','barrel'],['books','books','chest'],['coffin','coffin','body'],['barrel','barrel','chest']];
   for(const [index,r]of this.map.rooms.entries()){
    const kinds=themes[r.theme];
    kinds.forEach((kind,n)=>{
     const x=(r.x+3+n*3)*32+16,y=(r.y+r.h-3)*32;
     if(x>(r.x+r.w-2)*32)return;
     const o=this.addObject('container',x,y,`original-${kind}-0`,{rack:'Стойка оружия',cage:'Клетка',bed:'Койка',barrel:'Бочка',books:'Книжный шкаф',coffin:'Саркофаг',body:'Останки',chest:'Сундук','chest-closed':'Железный сундук'}[kind]);
     o.grid=grid(kind==='rack'?5:4,4);o.revealed=0;o.progress=0;
     for(let i=0;i<2+Math.floor(this.random()*3);i++)put(o.grid,rollLoot(this.random));
     for(let i=0;i<2;i++){const lx=x-22+i*38,ly=y+35;if(!this.canWalk(lx,ly,4))continue;const it=rollLoot(this.random),loose=this.addObject('pickup',lx,ly,this.itemTexture(it),it.name);loose.item=it;const source=loose.sprite.texture.getSourceImage();loose.sprite.setScale(Math.min(1,24/source.height));}
    });
   }
   this.updateFog();
  },
  drawMap(hub){
   const random=rng(hub?927:this.seed),map=this.map;
   this.navigationMap={...map,tiles:map.tiles.map(row=>[...row])};
   if(this.textures.exists('world-ground'))this.textures.remove('world-ground');
   const texture=this.textures.createCanvas('world-ground',map.w*32,map.h*32),ctx=texture.context;
   const floor=this.textures.get(hub?'original-fall-0':'original-floor-0').getSourceImage(),paving=this.textures.get('original-cobble-0').getSourceImage(),wall=this.textures.get('original-wall-0').getSourceImage();
   const roomAt=new Map();for(const r of map.rooms)for(let y=r.y+2;y<r.y+r.h-2;y++)for(let x=r.x+2;x<r.x+r.w-2;x++)roomAt.set(y*map.w+x,r);
   for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++){
    if(hub||map.tiles[y][x]){
     ctx.drawImage(floor,(2+x%12)*32,(y%4)*32,32,32,x*32,y*32,32,32);
     const room=roomAt.get(y*map.w+x),isPath=hub?Math.abs(x-48)<2&&y>34&&y<54||Math.abs(y-43)<2&&x>38&&x<58:room&&(room.theme===0||room.theme===2);
     if(isPath){if(hub){const road=(xx,yy)=>Math.abs(xx-48)<2&&yy>34&&yy<54||Math.abs(yy-43)<2&&xx>38&&xx<58;const fx=!road(x-1,y)?0:!road(x+1,y)?2:1,fy=!road(x,y-1)?0:!road(x,y+1)?2:1;ctx.drawImage(paving,160+fx*32,fy*32,32,32,x*32,y*32,32,32);}else ctx.drawImage(paving,192,32,32,32,x*32,y*32,32,32);}
    }else if(map.tiles[y+1]?.[x]){ctx.drawImage(wall,0,24,48,72,x*32,y*32-20,32,52);ctx.drawImage(wall,0,0,64,24,x*32,y*32-28,32,12);}
    else if(map.tiles[y]?.[x-1]||map.tiles[y]?.[x+1])ctx.drawImage(wall,0,0,64,24,x*32,y*32,32,32);
   }
   texture.refresh();this.add.image(0,0,'world-ground').setOrigin(0).setDepth(-100);
   if(hub){
    this.placeSolid(1536,1296,'hs-town-hall-0',1,{w:360,h:110,offsetY:-40});
    const hearth=this.add.sprite(1536,1430,'hs-pitfire-0','hearth').setOrigin(.5,1).setDepth(1430).play('hearth');this.registerSolid(hearth,1536,1430,{w:26,h:20});
    for(const [x,y]of [[1280,1370],[1792,1370],[1344,1552],[1728,1552]])this.placeSolid(x,y,'hs-street-lamp-0',1,{w:12,h:16});
    for(let n=0;n<150;n++){
     const a=random()*Math.PI*2,rx=630+random()*260,ry=460+random()*240,x=1536+Math.cos(a)*rx,y=1390+Math.sin(a)*ry;
     this.placeSolid(x,y,n%3?'hs-dead-tree-0':'hs-dead-tree2-0',1,{w:24,h:18});
    }
    for(let n=0;n<75;n++){const x=900+random()*1300,y=920+random()*1000;if(Math.abs(x-1536)<350&&Math.abs(y-1390)<350)continue;this.add.image(x,y,n%4?'hs-bush-0':'original-rubble-0').setOrigin(.5,.8).setDepth(y).setScale(n%4?1:.5);}
   }else for(const r of map.rooms){
    for(const [x,y]of [[r.x+2,r.y+2],[r.x+r.w-2,r.y+r.h-2]])this.torch(x*32,y*32);
    if(r.w>15)for(const x of [r.x+3,r.x+r.w-3])if(map.tiles[r.y+4]?.[x])this.placeSolid(x*32,(r.y+4)*32,'original-pillar-0',1,{w:20,h:20});
    const kind=['rack','bed','books','coffin','table'][r.theme];
    this.placeSolid((map.tiles[r.y+3]?.[r.x+r.w-4]?r.x+r.w-4:r.x+4)*32,(r.y+3)*32,`original-${kind}-0`,['books','rack'].includes(kind)?.5:1);
    if(r.theme===2)this.add.image(r.cx*32,r.cy*32,'original-carpet-0').setDepth(-40).setScale(.5);
    for(let n=0;n<5;n++){const x=(r.x+1+random()*(r.w-2))*32,y=(r.y+1+random()*(r.h-2))*32;if(Math.hypot(x-r.cx*32,y-r.cy*32)<65)continue;this.add.image(x,y,n%2?'original-rubble-0':'original-body-0').setOrigin(.5).setDepth(-30).setScale(n%2?.5:1);}
   }
  },
  placeSolid(x,y,key,scale=1,footprint){const sprite=this.add.image(x,y,key).setOrigin(.5,1).setScale(scale).setDepth(y);if(key==='original-books-0')sprite.setFrame('shelf');this.registerSolid(sprite,x,y,footprint);return sprite;},
  registerSolid(sprite,x,y,footprint={}){
   const w=footprint.w??Math.min(80,sprite.displayWidth*.65),h=footprint.h??Math.min(25,sprite.displayHeight*.25),cy=y+(footprint.offsetY||0)-h/2;
   const box={sprite,x:x-w/2,y:cy-h/2,w,h};this.solidProps.push(box);this.occluders.push(sprite);
   if(this.navigationMap)for(let ty=Math.floor(box.y/32);ty<=Math.floor((box.y+h)/32);ty++)for(let tx=Math.floor(box.x/32);tx<=Math.floor((box.x+w)/32);tx++)if(this.navigationMap.tiles[ty]?.[tx]!==undefined)this.navigationMap.tiles[ty][tx]=0;
  },
  canWalk(x,y,r=10){return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([dx,dy])=>this.map.tiles[Math.floor((y+dy)/32)]?.[Math.floor((x+dx)/32)])&&!this.solidProps.some(b=>x+r>b.x&&x-r<b.x+b.w&&y+r>b.y&&y-r<b.y+b.h);},
  addObject(type,x,y,texture,title){
   // Build the object without the old hub-specific coordinate override.
   const o={type,x,y,label:null,title};this.objects.push(o);
   if(texture){o.sprite=this.add.image(x,y,texture).setOrigin(.5,1).setDepth(y);const scale=texture.includes('books')||texture.includes('rack')?.5:1;o.sprite.setScale(scale);if(texture==='original-books-0')o.sprite.setFrame('shelf');if(type==='container'||type==='stash')this.registerSolid(o.sprite,x,y);this.bindHover(o,o.sprite);}
   o.label=this.add.text(x,y-42,title,{fontFamily:'Georgia',fontSize:'11px',color:'#e4d7ac',resolution:2,backgroundColor:'#09080bdd',padding:{x:4,y:2}}).setOrigin(.5).setDepth(6800).setVisible(false);return o;
  },
  bindHover(o,sprite){sprite.setInteractive({useHandCursor:true}).on('pointerover',()=>{if(!state.panel)this.hoverObject=o;}).on('pointerout',()=>{if(this.hoverObject===o)this.hoverObject=null;});},
  portal(x,y,color){const sprite=this.add.sprite(x,y,'hs-portal-0').play('hs-portal').setOrigin(.5,.85).setDepth(y);const o=this.objects.find(o=>Math.hypot(o.x-x,o.y-y)<60&&['expedition','exit'].includes(o.type));if(o){o.sprite?.destroy();o.sprite=sprite;this.bindHover(o,sprite);}},
  interact(o){if(!o||state.panel||Math.hypot(o.x-this.hero.x,o.y-this.hero.y)>88)return;baseInteract.call(this,o);},
  setInteractionText(){},
  makeHero(x,y){
   this.hero=this.add.sprite(x,y,'original-knight-idle-down-0').setOrigin(.5,1).setScale(.5).play('knight-idle-down');
   this.shadow=this.add.ellipse(x,y,26,9,0x000000,.35);this.heroRing=this.add.ellipse(x,y,24,8).setStrokeStyle(1,0x96834c,.3);this.heroLight=this.add.circle(x,y,1,0,0);this.heroModel=null;this.heroParts=null;this.heroDirection='down';this.heroFacing=1;
  },
  setHeroDirection(dx,dy){if(!dx&&!dy)return;this.heroDirection=Math.abs(dx)>Math.abs(dy)?'left':dy<0?'up':'down';this.heroFacing=dx>0?-1:1;},
  updateHeroAppearance(){},
  animateHero(_time,moving){if(!this.hero)return;const motion=this.attackUntil>this.clock?'attack':moving?'walk':'idle',key=`knight-${motion}-${this.heroDirection}`;if(this.hero.anims.currentAnim?.key!==key)this.hero.play(key);this.hero.setFlipX(this.heroDirection==='left'&&this.heroFacing<0);},
  update(time,delta){
   this.pendingInteraction=null;baseUpdate.call(this,time,delta);if(!this.hero)return;
   const hx=this.hero.x,hy=this.hero.y;
   this.shadow.setPosition(hx,hy).setDepth(hy-2);this.heroRing.setPosition(hx,hy).setDepth(hy-1);
   for(const sprite of this.occluders){if(!sprite.active)continue;const b=sprite.getBounds(),covered=hy<sprite.y&&hx>b.left-12&&hx<b.right+12&&hy>b.top;sprite.setAlpha(covered?.35:1);}
   for(const o of this.objects){const visible=state.mode!=='raid'||this.visibleTiles.has(Math.floor(o.y/32)*this.map.w+Math.floor(o.x/32)),hover=this.hoverObject===o&&!state.panel;const near=Math.hypot(o.x-hx,o.y-hy)<76;o.label?.setVisible(visible&&hover).setText(`${near?'[E]  ':''}${o.title}`);if(o.sprite?.active){if(hover)o.sprite.setTint(0xffe4a0);else o.sprite.clearTint();}}
   if(this.searchItemFill&&state.search)this.searchItemFill.setScale(Math.max(.001,Math.min(1,state.search.progress/.9)),1);if(state.panel==='container'&&state.search&&this.searchFill){this.searchFill.setScale(Math.max(.001,Math.min(1,state.search.progress/.9)),1);this.searchFill.setVisible(state.search.revealed<state.search.grid.items.length);}
  },
 });
}
