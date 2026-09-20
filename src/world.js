import {REFUGE} from './refuge-layout.js';
import {uiScaleFor,worldScaleFor} from './ui-metrics.js';
import {MERCHANTS} from './merchants.js';
import {installGameInput} from './game-input.js';
import {navigationMap} from './navigation.js';
import Phaser from 'phaser';
import {paintAutumnGround,plantForest,furnishDistricts} from './autumn-world.js';
import {isOccluding} from './cartography.js';
import assets from './original-assets.json';
import {state,save,toast,closePanel,openPanel} from './main.js';
import {grid,put,rollLoot,rng,flowField} from './core.js';

// World and interface have separate cameras: world zoom never moves UI hit areas.
export function installWorld(Scene, simulationRaid) {
 const baseCreate=Scene.prototype.create,baseReset=Scene.prototype.resetWorld,baseUpdate=Scene.prototype.update,baseObject=Scene.prototype.addObject,baseInteract=Scene.prototype.interact;
 Object.assign(Scene.prototype,{
  create(){
   this.uiScale=uiScaleFor(this.scale.width,this.scale.height);this.uiWidth=Math.floor(this.scale.width/this.uiScale);this.uiHeight=Math.floor(this.scale.height/this.uiScale);
   this.uiCamera=this.cameras.add(0,0,this.scale.width,this.scale.height,false,'interface').setOrigin(0).setZoom(this.uiScale);
   this.cameras.main.setZoom(worldScaleFor(this.scale.height)).setRoundPixels(true);this.uiCamera.setRoundPixels(true);
   this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE,o=>{o.cameraFilter=this.uiCamera.id;});
   for(const [key,frames]of Object.entries(assets))if(key.startsWith('hero-')||key.startsWith('knight-')||key.startsWith('mob-')||key.startsWith('merchant-'))this.anims.create({key,frames:frames.map((_,n)=>({key:`original-${key}-${n}`})),frameRate:key.includes('walk')?Math.min(20,frames.length/(key.startsWith('hero-')?.5:.65)):key.includes('attack')?14:7,repeat:key.includes('attack')||key.includes('dies')?0:-1});
   this.anims.create({key:'ice-nova',frames:assets['ice-nova'].map((_,n)=>({key:`original-ice-nova-${n}`})),frameRate:20,repeat:0});
   for(const key of ['camp','fountain','waypoint-glow'])this.anims.create({key:`ambient-${key}`,frames:assets[key].map((_,n)=>({key:`original-${key}-${n}`})),frameRate:8,repeat:-1});
   for(let n=0;n<6;n++){const t=this.textures.get(`hs-pitfire-${n}`),im=t.getSourceImage();t.add('hearth',0,0,im.height-56,im.width,56);}this.anims.create({key:'hearth',frames:Array.from({length:6},(_,n)=>({key:`hs-pitfire-${n}`,frame:'hearth'})),frameRate:9,repeat:-1});const bookshelf=this.textures.get('original-books-0'),bookImage=bookshelf.getSourceImage();bookshelf.add('shelf',0,0,50,bookImage.width,bookImage.height-50);this.textures.get('original-enemy-bar-back-0').add('compact',0,16,0,64,12);this.textures.get('original-hero-idle-down-0').add('portrait',0,5,0,20,20);this.input.setDefaultCursor(`url(${import.meta.env.BASE_URL}assets/original/cursor-0.png) 4 3, auto`);baseCreate.call(this);installGameInput(this);this.input.removeAllListeners('pointerdown');this.input.on('pointerdown',p=>{if(p.leftButtonDown()&&this.held&&this.outsideItemPanels(p))this.dropHeldItem();});this.input.keyboard.addCapture('TAB');this.input.keyboard.on('keydown-TAB',e=>{e.preventDefault();if(state.mode!=='result'&&!state.panel){this.mapExpanded=!this.mapExpanded;this.mapStamp=null;this.drawMinimap();}});
  },
  resetWorld(){this.closeCanvasPanel();state.panel=null;state.selected=null;this.pendingInteraction=null;this.interactionPath=null;this.actionPicker=null;this.input.enabled=true;this.input.resetPointers();this.input.keyboard.resetKeys();state.search=null;baseReset.call(this);this.hoverObject=null;this.attackUntil=0;this.mapExpanded=false;this.mapStamp=null;this.occluders=[];this.navigationMap=null;this.collisionCells=new Map();},
  markUI(parent){if(!parent)return;parent.cameraFilter=this.cameras.main.id;for(const child of parent.list||[]){child.setScrollFactor(0);this.markUI(child);}},
  startHub(){
   this.resetWorld();state.mode='hub';const w=96,h=80;
   this.map={w,h,rooms:[],tiles:Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>Math.pow((x-48)/23,2)+Math.pow((y-43)/21,2)<1?1:0))};
   this.drawMap(true);
   this.addObject('stash',...REFUGE.stash,'stash-0','Тайник');
   this.activeVendor=null;this.vendorStocks={};for(const [id,m] of Object.entries(MERCHANTS)){const o=this.addObject('vendor',m.x,m.y,`original-${m.sprite}-0`,m.title);o.merchantId=id;o.sprite.destroy();o.sprite=this.add.sprite(m.x,m.y,`original-${m.sprite}-0`).setOrigin(.5,1).setDepth(m.y).play(m.sprite);this.bindHover(o,o.sprite);}
   const guide=this.addObject('expedition',...REFUGE.atlas,'hero-0','Атлас');guide.sprite.setVisible(false);
   this.portal(...REFUGE.atlas,0xffffff);
   this.makeHero(...REFUGE.hero);
   this.cameras.main.setBounds(0,0,w*32,h*32).setZoom(worldScaleFor(this.scale.height)).startFollow(this.hero,true,.14,.14).centerOn(this.hero.x,this.hero.y);
   this.addVignette();this.vignette.setAlpha(1);this.createCanvasHud();this.renderOverlay(true);
  },
  startRaid(){
   simulationRaid.call(this);this.cameras.main.setZoom(worldScaleFor(this.scale.height)).centerOn(this.hero.x,this.hero.y);this.vignette.setAlpha(.35);
   furnishDistricts(this);
   this.navigationMap=navigationMap(this.map,this.canWalk.bind(this));
   for(const o of this.objects.filter(o=>o.grid)){const count=o.grid.items.length;for(let n=0;n<count;n++)if(this.random()<(this.raidModifiers?.loot||0))put(o.grid,rollLoot(this.random));}
   this.updateFog();
  },
  drawMap(hub){
   const random=rng(hub?927:this.seed),map=this.map;
   this.navigationMap={...map,tiles:map.tiles.map(row=>[...row])};
   this.clearRoutes=new Set();if(map.rooms.length){const first=map.rooms[0],field=flowField(map,first.cx,first.cy);for(const r of map.rooms){let x=r.cx,y=r.cy;for(let n=0;n<map.w*map.h;n++){this.clearRoutes.add(y*map.w+x);if(field[y][x]===0)break;const next=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].find(([nx,ny])=>field[ny]?.[nx]<field[y][x]);if(!next)break;[x,y]=next;}}}
   paintAutumnGround(this,hub);
   if(hub){
    // The chapel is a closed building, not a walk-through roof over the square.
    // The exported canvas also contains unrelated fragments in its upper corners.
    // Slice only the chapel's spire, nave and foundation; retain source pixel scale.
    const chapelTexture=this.textures.get('original-chapel-top-0'),chapel=[];
    for(const [name,x,y,w,h]of [['spire',196,0,152,180],['nave',80,180,335,140],['foundation',0,320,415,181]]){
     if(!chapelTexture.has(name))chapelTexture.add(name,0,x,y,w,h);
     chapel.push(this.add.image(Math.round(REFUGE.chapel.top[0]-415/2)+x,REFUGE.chapel.top[1]-501+y,chapelTexture.key,name).setOrigin(0).setDepth(1390));
    }
    const front=this.add.image(...REFUGE.chapel.front,'original-chapel-gate-0').setOrigin(.5,1).setDepth(1495);
    this.refugeArchitecture=[...chapel,front];
    for(const [x,y,w,h]of REFUGE.chapel.walls)this.registerSolid(this.add.zone(x+w/2,y+h,1,1),x+w/2,y+h,{w,h});
    const building=(x,y,key,w,h)=>{const house=this.placeSolid(x,y,key,1,{w,h,offsetY:-18});house.fixedArchitecture=true;house.setAlpha(1);this.refugeArchitecture.push(house);return house;};
    building(1070,1520,'original-house-tall-0',196,135);
    building(2040,1500,'original-town-house-0',252,145);
    // Supply piles are against workshop walls, never scattered through the paths.
    for(const [x,y,key,w,h]of [[2180,1570,'logs',62,28],[2160,1630,'town-barrel',22,16],[2110,1660,'town-barrel',22,16],[990,1590,'wood-crate',30,22],[990,1650,'town-barrel',22,16]])this.placeSolid(x,y,`original-${key}-0`,1,{w,h});
    this.placeSolid(1820,1410,'original-bounty-board-0',1,{w:74,h:22});
    this.placeSolid(1510,1860,'original-well-0',1,{w:64,h:40});
    for(const [x,y]of [[1350,1540],[1810,1600],[1340,1830],[1770,1810]]){this.placeSolid(x,y,'hs-street-lamp-0',1,{w:12,h:12});this.warmLight(x,y-60,105);}
    const forge=this.add.sprite(1980,1610,'hs-pitfire-0','hearth').setOrigin(.5,1).setDepth(1610).play('hearth');this.registerSolid(forge,1980,1610,{w:26,h:20});this.warmLight(1980,1585,100);
    this.warmLight(1580,1240,95);
    // A small enclosed graveyard belongs to the chapel, north-east of the square.
    for(const [x,y]of [[1850,1190],[1910,1190],[1850,1260],[1910,1260]])this.placeSolid(x,y,'original-grave-0',1,{w:20,h:16});
    for(const x of [1820,1890,1960])this.placeSolid(x,1340,'original-wood-fence-0',1,{w:64,h:10});
    // Deliberate forest bands, with clear entrances at the roads, replace the random prop cloud.
    for(let row=0;row<4;row++)for(let col=0;col<17;col++){
     const x=930+col*78+(row%2)*34+(random()-.5)*24,y=1020+row*54+(random()-.5)*24;
     if(x>1270&&x<1770&&y>1070)continue;
     this.forestTree(x,y,(row+col)%3);
    }
    for(const side of [-1,1])for(let row=0;row<12;row++)for(let col=0;col<2;col++){
     const x=1536+side*(620+col*65+Math.sin(row*.6)*50),y=1220+row*64;
     if(side<0&&y>1380&&y<1520||side>0&&y>1320&&y<1490)continue;this.forestTree(x+(random()-.5)*22,y+(random()-.5)*22,(row+col)%3);
    }
    for(let col=0;col<15;col++){const x=1010+col*72;if(Math.abs(x-1510)<85)continue;this.forestTree(x,2150+Math.sin(col)*35,col%3);}
    for(const [cx,cy]of [[960,1740],[2180,1740],[1290,1980],[1900,1100]])for(let n=0;n<7;n++){const x=cx+(random()-.5)*120,y=cy+(random()-.5)*70;if(Object.values(MERCHANTS).some(m=>Math.abs(x-m.x)<110&&y>m.y-30&&y<m.y+150))continue;this.add.image(x,y,'hs-bush-0').setOrigin(.5,1).setDepth(y);}
   }else plantForest(this);
  },
  placeSolid(x,y,key,scale=1,footprint){const sprite=this.add.sprite(x,y,key).setOrigin(.5,1).setScale(scale).setDepth(y);const ambient='ambient-'+key.replace(/^original-|-0$/g,'');if(this.anims.exists(ambient))sprite.play(ambient);if(key==='original-books-0')sprite.setFrame('shelf');this.registerSolid(sprite,x,y,footprint);if(sprite.active&&key==='original-town-house-0'){const t=this.textures.get('original-cobble-0');if(!t.has('landing'))t.add('landing',0,32,0,96,96);this.add.image(sprite.x,sprite.y+20,t.key,'landing').setDepth(-50);}return sprite;},
  registerSolid(sprite,x,y,footprint={}){
   const w=footprint.w??Math.min(80,sprite.displayWidth*.65),h=footprint.h??Math.min(25,sprite.displayHeight*.25),offset=footprint.offsetY||0;
   const occupied=(px,py)=>{const cells=[];for(let ty=Math.floor((py+offset-h)/32);ty<=Math.floor((py+offset)/32);ty++)for(let tx=Math.floor((px-w/2)/32);tx<=Math.floor((px+w/2)/32);tx++)cells.push([tx,ty]);return cells;};
   if(this.clearRoutes?.size){
    const safe=(px,py)=>occupied(px,py).every(([tx,ty])=>this.navigationMap.tiles[ty]?.[tx]&&!this.clearRoutes.has(ty*this.map.w+tx));
    if(!safe(x,y)){let found=false;for(let radius=1;radius<=3&&!found;radius++)for(let dy=-radius;dy<=radius&&!found;dy++)for(let dx=-radius;dx<=radius;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;if(safe(x+dx*32,y+dy*32)){x+=dx*32;y+=dy*32;found=true;break;}}if(!found){sprite.destroy();return false;}}
    sprite.setPosition(x,y).setDepth(y);
   }
   const box={sprite,x:x-w/2,y:y+offset-h,w,h};this.solidProps.push(box);for(let cy=Math.floor(box.y/64);cy<=Math.floor((box.y+box.h)/64);cy++)for(let cx=Math.floor(box.x/64);cx<=Math.floor((box.x+box.w)/64);cx++){const id=`${cx},${cy}`;if(!this.collisionCells.has(id))this.collisionCells.set(id,[]);this.collisionCells.get(id).push(box);}sprite.occlusionY=y+offset;sprite.setDepth(y+offset);if(sprite.texture)this.occluders.push(sprite);
   if(this.navigationMap)for(const [tx,ty]of occupied(x,y))if(this.navigationMap.tiles[ty]?.[tx]!==undefined)this.navigationMap.tiles[ty][tx]=0;return true;
  },
  canWalk(x,y,r=10){
   if(![[-r,0],[r,0],[0,-r],[0,r]].every(([dx,dy])=>this.map.tiles[Math.floor((y+dy)/32)]?.[Math.floor((x+dx)/32)]))return false;
   for(let cy=Math.floor((y-r)/64);cy<=Math.floor((y+r)/64);cy++)for(let cx=Math.floor((x-r)/64);cx<=Math.floor((x+r)/64);cx++)for(const b of this.collisionCells.get(`${cx},${cy}`)||[]){
    const dx=x-Math.max(b.x,Math.min(x,b.x+b.w)),dy=y-Math.max(b.y,Math.min(y,b.y+b.h));if(dx*dx+dy*dy<r*r)return false;
   }return true;
  },
  addObject(type,x,y,texture,title){
   // Build the object without the old hub-specific coordinate override.
   const o={type,x,y,label:null,title};this.objects.push(o);
   if(texture){o.sprite=this.add.image(x,y,texture).setOrigin(.5,1).setDepth(y);const scale=1;o.sprite.setScale(scale);if(texture==='original-books-0')o.sprite.setFrame('shelf');if((type==='container'||type==='stash')&&!texture.includes('corpse-')&&!this.registerSolid(o.sprite,x,y,texture.includes('coffin-')?{w:Math.min(56,o.sprite.width*.7),h:Math.min(46,o.sprite.height*.65)}:texture.includes('chest-')?{w:24,h:16}:texture.includes('crate-')?{w:24,h:18}:texture.includes('handcart')?{w:36,h:26}:texture.includes('chest-closed')?{w:46,h:24}:texture.includes('town-barrel')?{w:22,h:18}:{})){this.objects.pop();o.sprite=null;return o;}o.x=o.sprite.x;o.y=o.sprite.y;this.bindHover(o,o.sprite);}
   o.label=this.add.text(o.x,o.y-42,title,{fontFamily:'Georgia',fontSize:'16px',color:'#e4d7ac',resolution:4,backgroundColor:'#09080bdd',padding:{x:4,y:2}}).setOrigin(.5).setDepth(6800).setVisible(false);return o;
  },
  bindHover(o,sprite){sprite.setInteractive({useHandCursor:false}).on('pointerover',()=>{if(!state.panel||['inventory','container','stash','vendor'].includes(state.panel))this.hoverObject=o;}).on('pointerout',()=>{if(this.hoverObject===o)this.hoverObject=null;}).on('pointerdown',(p,_x,_y,event)=>{if(p.leftButtonDown()){event.stopPropagation();if(this.held){if(this.outsideItemPanels(p))this.dropHeldItem();return;}this.interact(o);}});},
  portal(x,y,color){
   const sprite=this.add.image(x,y,'original-waypoint-0').setOrigin(.5).setDepth(-20);
   this.add.sprite(x,y-8,'original-waypoint-glow-0').play('ambient-waypoint-glow').setDepth(-19).setBlendMode(Phaser.BlendModes.ADD);
   const o=this.objects.find(o=>Math.hypot(o.x-x,o.y-y)<60&&['expedition','exit'].includes(o.type));if(o){o.sprite?.destroy();o.sprite=sprite;this.bindHover(o,sprite);}
  },
  forestTree(x,y,variant){if(state.mode==='hub'&&Object.values(MERCHANTS).some(m=>y>m.y&&y-m.y<360&&Math.abs(x-m.x)<210))return;
   const key=['tree-a','tree-b','tree-c'][variant];this.placeSolid(x,y,`original-${key}-0`,1,{w:22,h:18});
   if(variant!==2){const foliage=this.add.image(x,y-30,'original-tree-leaves-0').setOrigin(.5,1).setScale(1).setDepth(y+1);foliage.occlusionY=y;this.occluders.push(foliage);}
  },
  warmLight(x,y,radius=120){
   if(!this.textures.exists('warm-light')){const t=this.textures.createCanvas('warm-light',256,256),c=t.context,g=c.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(255,143,50,.38)');g.addColorStop(.35,'rgba(208,74,22,.16)');g.addColorStop(1,'rgba(125,36,12,0)');c.fillStyle=g;c.fillRect(0,0,256,256);t.refresh();}
   this.add.image(x,y,'warm-light').setDisplaySize(radius*2,radius*2).setBlendMode(Phaser.BlendModes.ADD).setDepth(6800);
  },
  torch(x,y){this.add.sprite(x,y,'torch-0').play('torch').setOrigin(.5,.8).setDepth(y);this.warmLight(x,y-16,110);},
  interact(o){if(!o||this.held||state.panel&&!['inventory','container','stash','vendor'].includes(state.panel)||Math.hypot(o.x-this.hero.x,o.y-this.hero.y)>76)return;const restoreBag=state.panel==='inventory'&&o.type==='pickup';if(state.panel)closePanel();if(o.type==='vendor')this.activeVendor=o;baseInteract.call(this,o);if(restoreBag)openPanel('inventory');},
  setInteractionText(t){if(this.extraction)this.uiTexts?.hint?.setText(t);else this.uiTexts?.hint?.setText('');},
  makeHero(x,y){
   this.hero=this.add.sprite(x,y,'original-hero-idle-down-0').setOrigin(.5,1).setScale(1).play('hero-idle-down');
   this.shadow=this.add.ellipse(x,y,26,9,0x000000,.35);this.heroRing=this.add.ellipse(x,y,24,8).setStrokeStyle(1,0x96834c,.3);this.heroLight=this.add.circle(x,y,1,0,0);this.heroModel=null;this.heroParts=null;this.heroDirection='down';this.heroFacing=1;this.heroEquipmentKey=null;this.updateHeroAppearance();
  },
  setHeroDirection(dx,dy){if(!dx&&!dy)return;this.heroDirection=Math.abs(dx)>Math.abs(dy)?'left':dy<0?'up':'down';this.heroFacing=dx>0?-1:1;},
  // Equipment changes gameplay only. The complete source sprite includes its own gear.
  updateHeroAppearance(){},
  animateHero(_time,moving){
   if(!this.hero)return;
   const motion=moving?'walk':this.attackUntil>this.clock?'attack':'idle';
   const key=`hero-${motion}-${this.heroDirection}`;
   if(this.hero.anims.currentAnim?.key!==key)this.hero.play(key);
   // Whole human sprite: shared canvas dimensions keep the feet stable across frames.
   const anchors={idle:{down:[15,46],left:[8,46],up:[15,46]},walk:{down:[16,50],left:[12,47],up:[15,50]},attack:{down:[19,52],left:[30,45],up:[16,52]}};
   const [x,y]=anchors[motion][this.heroDirection];
   const flipped=this.heroDirection==='left'&&this.heroFacing<0;
   this.hero.setOrigin(flipped?1-x/this.hero.width:x/this.hero.width,y/this.hero.height).setDepth(this.hero.y).setFlipX(flipped);
  },
  updateWorldHover(){
   this.hoverObject=null;if(state.panel&&!['inventory','container','stash','vendor'].includes(state.panel)||!this.hero)return;const ux=this.input.activePointer.x/this.uiScale,uy=this.input.activePointer.y/this.uiScale;if(state.panel&&uy<640&&(ux>=this.panelX+40||state.panel!=='inventory'&&ux>=this.sidePanelX&&ux<this.sidePanelX+396))return;
   const p=this.input.activePointer,point=this.cameras.main.getWorldPoint(p.x,p.y);
   // Recompute each frame: a stationary cursor must work after changing scenes and camera positions.
   this.hoverObject=this.objects.filter(o=>o.sprite?.active&&o.sprite.visible&&o.sprite.getBounds().contains(point.x,point.y)).sort((a,b)=>b.sprite.depth-a.sprite.depth)[0]||null;
  },
  update(time,delta){
   this.pendingInteraction=null;this.updateWorldHover();baseUpdate.call(this,time,delta);if(!this.hero)return;
   this.updateSocketVisibility?.();if(!this.damageEdge?.active){this.damageEdge=this.add.graphics().setDepth(9400);this.markUI(this.damageEdge);}this.damageEdge.clear();if(this.hurtFlash>0){for(let n=0;n<6;n++)this.damageEdge.lineStyle(10,0xc52228,(this.hurtFlash/.22)*(.15-n*.02)).strokeRect(5+n*10,5+n*10,this.uiWidth-10-n*20,this.uiHeight-10-n*20);}const hx=this.hero.x,hy=this.hero.y;
   this.shadow.setPosition(hx,hy).setDepth(hy-2);this.heroRing.setPosition(hx,hy).setDepth(hy-1);
   for(const sprite of this.occluders){if(!sprite.active)continue;if(sprite.fixedArchitecture){sprite.setAlpha(1);continue;}const npcCovered=state.mode==='hub'&&this.objects.some(o=>o.type==='vendor'&&o.sprite?.active&&sprite.depth>o.y&&sprite.getBounds().contains(o.x,o.y-20));const covered=npcCovered||isOccluding(sprite,this.hero,(x,y)=>this.textures.getPixelAlpha(x,y,sprite.texture.key,sprite.frame.name)||0);if(covered)sprite.coveredUntil=time+180;const target=(covered||time<(sprite.coveredUntil||0)) ? .35 : 1;sprite.setAlpha(Phaser.Math.Linear(sprite.alpha,target,Math.min(1,delta/100)));}

   for(const o of this.objects){const visible=state.mode!=='raid'||this.visibleTiles.has(Math.floor(o.y/32)*this.map.w+Math.floor(o.x/32)),hover=this.hoverObject===o;const near=Math.hypot(o.x-hx,o.y-hy)<76;o.label?.setDepth(7000).setVisible(visible&&(hover||(this.keys.ALT.isDown||this.lootLabelsPinned)&&['container','pickup'].includes(o.type))).setText(`${o.title}${o.type==='exit'?'\n'+this.exitCondition(o.exitType):''}`);if(o.sprite?.active){if(hover||(this.keys.ALT.isDown||this.lootLabelsPinned)&&visible&&['container','pickup'].includes(o.type))o.sprite.setTint(0xffe4a0);else if(o.type==='rune'&&o.order<this.runes)o.sprite.setTint(0x8afac2);else o.sprite.clearTint();}}
   for(const e of this.enemies){
    e.spawnPortal?.setVisible(e.sprite.visible);
    if(e.boss){e.healthBar?.destroy();e.healthBar=null;continue;}
    if(!e.healthBar){e.healthBar=this.add.container(0,0).setDepth(6500);e.healthBar.add(this.add.image(0,0,'original-enemy-bar-back-0','compact').setOrigin(.5,1).setScale(.5));e.healthFill=this.add.image(-14,-5,'original-vitals-fill-0').setOrigin(0);e.healthBar.add(e.healthFill);}
    e.barHeight??=assets[`mob-${e.type}-walk-down`]?.[0]?.height||e.sprite.displayHeight;e.healthBar.setPosition(Math.round(e.sprite.x),Math.round(e.sprite.y-e.barHeight-5)).setVisible(e.sprite.visible&&!e.spawning);e.healthFill.setDisplaySize(Math.max(1,Math.round(28*e.hp/e.maxHP)),4);
   }
   if(this.searchItemFill&&state.search)this.searchItemFill.setScale(Math.max(.001,Math.min(1,state.search.progress/.9)),1);if(state.panel==='container'&&state.search&&this.searchFill){this.searchFill.setScale(Math.max(.001,Math.min(1,state.search.progress/.9)),1);this.searchFill.setVisible(state.search.revealed<state.search.grid.items.length);}
  },
 });
}
