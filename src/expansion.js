import {applyEnemyMods,drawEnemyBadges,ENEMY_MODS} from './enemy-modifiers.js';
import {BASE_COOLDOWN} from './skill-stats.js';
import Phaser from 'phaser';
import assets from './original-assets.json';
import {state,finishRaid} from './main.js';
import {pursuitTarget, crowdSeparation} from './navigation.js';

export const bossThresholds=[180,360,540];
export const effectDuration=(skill,bonus={})=>(skill.duration||1)*(1+(bonus.duration??(skill.supports.includes('duration')?1:0))*.25);

export function installExpansion(Scene){
 const baseCreate=Scene.prototype.create,baseReset=Scene.prototype.resetWorld,baseCombat=Scene.prototype.updateCombat,baseEnemies=Scene.prototype.updateEnemies,baseSpawn=Scene.prototype.spawnEnemy,baseHUD=Scene.prototype.renderOverlay,baseHit=Scene.prototype.hitEnemy;
 Object.assign(Scene.prototype,{
  create(){for(const key of ['meteor-fx','meteor-impact','heal-fx','boss-reaper','boss-reaper-cast','boss-gurag','boss-gurag-cast','boss-shadow','boss-shadow-cast','boss-scythe','impact-fire','reaper-flame','shadow-impact','spawn-rift'])this.anims.create({key,frames:assets[key].map((_,n)=>({key:`original-${key}-${n}`})),frameRate:key.endsWith('-cast')?assets[key].length/1.6:12,repeat:['boss-reaper','boss-gurag','boss-shadow','boss-scythe','reaper-flame'].includes(key)?-1:0});baseCreate.call(this);},
  resetWorld(){baseReset.call(this);this.areaEffects=[];this.bossStages=new Set();this.bossHUD=null;this.bossRows=[];},
  renderOverlay(force){
   baseHUD.call(this,force);const bosses=(this.enemies||[]).filter(e=>e.boss&&e.hp>0);
   if(!this.bossHUD?.active){this.bossHUD=this.add.container(0,0).setDepth(9000);this.bossRows=[];this.markUI(this.bossHUD);}
   this.bossHUD.setVisible(state.mode==='raid'&&!state.panel&&bosses.length>0).setPosition(Math.round(this.uiWidth/2),36);
   while(this.bossRows.length<bosses.length){const row=this.add.container(0,this.bossRows.length*54),fill=this.add.image(-163,0,'original-boss-fill-0').setOrigin(0,.5),title=this.add.text(0,0,'',{fontFamily:'Georgia',fontSize:'16px',resolution:3,color:'#ffe3a2'}).setOrigin(.5);row.add([fill,this.add.image(0,0,'original-boss-frame-0'),title]);this.bossHUD.add(row);this.bossRows.push({row,fill,title});this.markUI(row);}
   this.bossRows.forEach(({row,fill,title},i)=>{const boss=bosses[i];row.setVisible(!!boss);if(!boss)return;fill.setDisplaySize(Math.max(1,Math.round(326*boss.hp/boss.maxHP)),22);title.setText(boss.type==='gurag'?'ГУРАГ':boss.type==='shadow'?'ТЕНЬ СМЕРТИ':'ЖНЕЦ');});
  },
  effectArt(key,x,y){const s=this.add.sprite(x,y,`original-${key}-0`).setDepth(y+30).setBlendMode(Phaser.BlendModes.ADD).play(key);s.once('animationcomplete',()=>s.destroy());return s;},
  castExpansionSkill(skill,target,bonus){
   if(!['meteor','rain','juggernaut','healing','blink'].includes(skill.type))return false;const cooldown=BASE_COOLDOWN[skill.type];
   this.shotTimes[skill.id]=cooldown/(1+(bonus.haste||0)*.18);this.shotDurations[skill.id]=this.shotTimes[skill.id];
   const damage=this.damage(skill),duration=effectDuration(skill,bonus);
   if(skill.type==='healing'){const extra=Object.values(state.profile.equipment).reduce((n,g)=>n+(g?.healingBonus||0),0);this.hp=Math.min(this.maxHP,this.hp+35*(1+extra));this.effectArt('heal-fx',this.hero.x,this.hero.y-20);return true;}
   if(skill.type==='blink'){const angle=Math.atan2(target.y-this.hero.y,target.x-this.hero.x);for(let n=0;n<40;n++){const x=this.hero.x+Math.cos(angle)*5,y=this.hero.y+Math.sin(angle)*5;if(!this.canWalk(x,y,10))break;this.hero.setPosition(x,y);}this.invincible=Math.max(this.invincible,.35*duration);this.effectArt('heal-fx',this.hero.x,this.hero.y-20);return true;}
   const count=1+Math.min(7,bonus.multi||0);
   if(skill.type==='meteor'){
    const targets=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.sprite.x-target.x,e.sprite.y-target.y)<210);
    for(let n=0;n<count;n++){const at=targets[n]?.sprite||target,x=at.x+(n&&!targets[n]?Math.cos(n*2.4)*45:0),y=at.y+(n&&!targets[n]?Math.sin(n*2.4)*35:0);
     const art=this.add.sprite(x-60,y-360,'original-meteor-fx-0').play('meteor-fx').setDepth(5000),trail=this.add.sprite(x,y-400,'original-fireball-0').play('original-fireball').setRotation(Math.PI/2).setScale(.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(4999);
     const marker=this.add.ellipse(x,y,70,32,0xfb923c,.15).setStrokeStyle(1,0xf0a051,.4).setDepth(y-1);
     this.areaEffects.push({type:'meteor',x,y,life:.8+n*.12,total:.8+n*.12,delay:n*.12,damage:damage*3,radius:85,art,trail,marker});
    }
   }else if(skill.type==='rain')this.areaEffects.push({type:'rain',x:target.x,y:target.y,life:duration,total:duration,damage:damage*.4*count,radius:110,tick:0,count});
   else {const arts=Array.from({length:count},()=>this.add.image(this.hero.x+75,this.hero.y,'original-weapon-0').setDepth(5000));this.areaEffects.push({type:'juggernaut',life:duration,total:duration,damage:damage*.6*count,radius:100,tick:0,arts});}
   return true;
  },
  updateCombat(dt){
   baseCombat.call(this,dt);if(state.mode!=='raid')return;
   this.areaEffects=this.areaEffects.filter(f=>{
    f.life-=dt;
    if(f.type==='meteor'){const t=Math.max(0,Math.min(1,1-f.life/.8));f.art.setPosition(f.x-60*(1-t),f.y-360*(1-t*t));f.trail.setPosition(f.art.x-5,f.art.y-24);if(f.life<=0){this.effectArt('impact-fire',f.x,f.y);for(const e of this.enemies)if(e.hp>0&&Math.hypot(e.sprite.x-f.x,e.sprite.y-f.y)<f.radius)this.hitEnemy(e,f.damage,0xffb36b);}}
    else if(f.type==='boulder'){const t=Math.max(0,Math.min(1,1-f.life/f.total));f.art.setPosition(Phaser.Math.Linear(f.startX,f.x,t),Phaser.Math.Linear(f.startY,f.y,t)-Math.sin(t*Math.PI)*100).setRotation(t*3);if(f.life<=0){this.bossImpact(f);if(Math.hypot(this.hero.x-f.x,this.hero.y-f.y)<f.radius)this.takeHeroDamage(f.damage);}}
    else if(f.hostile){
     const progress=Math.max(0,Math.min(1,1-f.life/f.total));
     f.art.clear().lineStyle(2,f.color,.85).strokeCircle(f.x,f.y,f.radius).lineStyle(2,f.color,.55).strokeCircle(f.x,f.y,f.radius*(1-progress));
     f.marker?.setAlpha(.15+.4*progress).setRotation(progress*.7);
     if(f.life<=0){this.bossImpact(f);if(Math.hypot(this.hero.x-f.x,this.hero.y-f.y)<f.radius&&this.invincible<=0){this.takeHeroDamage(f.damage);}}
    }
    else {
     if(f.type==='juggernaut'){f.x=this.hero.x;f.y=this.hero.y;f.arts.forEach((art,i)=>{const a=this.clock*5+i*Math.PI*2/f.arts.length;art.setPosition(f.x+Math.cos(a)*78,f.y+Math.sin(a)*48-15).setRotation(a+Math.PI/2);});}
     f.tick-=dt;if(f.tick<=0){f.tick=.35;for(const e of this.enemies)if(Math.hypot(e.sprite.x-f.x,e.sprite.y-f.y)<f.radius)this.hitEnemy(e,f.damage,0xd2dbaa);
      if(f.type==='rain')for(let n=0;n<Math.min(18,4*f.count);n++){const a=this.random()*Math.PI*2,r=Math.sqrt(this.random())*f.radius,x=f.x+Math.cos(a)*r,y=f.y+Math.sin(a)*r;const arrow=this.add.image(x-40,y-180,'original-friendly-arrow-0').setRotation(Math.atan2(180,40)).setDepth(5000);this.tweens.add({targets:arrow,x,y,duration:280,onComplete:()=>arrow.destroy()});}
     }
    }
    if(f.life<=0){f.art?.destroy();f.trail?.destroy();f.marker?.destroy();f.arts?.forEach(a=>a.destroy());return false;}return true;
   });
  },
  hitEnemy(e,damage,color){baseHit.call(this,e,damage,color);if(e.boss)e.sprite.clearTint().setTint(0xffeed4);},
  spawnEnemy(){const count=this.enemies.length;baseSpawn.call(this);if(this.enemies.length===count)return;const e=this.enemies.at(-1);e.hp*=this.raidModifiers?.health||1;e.maxHP=e.hp;e.speed*=this.raidModifiers?.speed||1;
   e.spawning=.85;e.sprite.setAlpha(0);const portal=this.add.sprite(e.sprite.x,e.sprite.y-12,'original-spawn-rift-0').play('spawn-rift').setDepth(e.sprite.y+1).setScale(.25);e.spawnPortal=portal;
   this.tweens.add({targets:portal,scaleX:1,scaleY:1,duration:300,yoyo:true,hold:600,onComplete:()=>portal.destroy()});
   if(this.elapsed<45||this.random()>.1)return;const available=Object.keys(ENEMY_MODS),mods=[];const amount=Math.min(3,1+Math.floor(this.elapsed/180));for(let n=0;n<amount;n++)mods.push(available.splice(Math.floor(this.random()*available.length),1)[0]);applyEnemyMods(e,mods);drawEnemyBadges(this,e);
  },
  spawnBoss(stage){
   if(this.enemies.length>=160){const e=this.enemies.find(e=>!e.boss);if(!e)return false;e.sprite.destroy();e.healthBar?.destroy();e.aura?.destroy();e.nameLabel?.destroy();e.buffIcons?.destroy();e.buffTip?.destroy();e.spawnPortal?.destroy();this.enemies.splice(this.enemies.indexOf(e),1);}
   const count=this.enemies.length;baseSpawn.call(this);if(this.enemies.length===count)return false;const e=this.enemies.at(-1),x=e.sprite.x,y=e.sprite.y;e.sprite.destroy();e.boss=stage;e.type=stage===1?'gurag':stage===2?'reaper':'shadow';const key=`boss-${e.type}`;e.sprite=this.add.sprite(x,y,`original-${key}-0`);
   e.sprite.setOrigin(.5,1).play(key);e.maxHP=900*stage*(this.raidModifiers?.health||1);e.hp=e.maxHP;e.speed=(45+stage*6)*(this.raidModifiers?.speed||1);e.cast=3;e.phase=0;
   return true;
  },
  updateEnemies(dt){
   for(let i=0;i<bossThresholds.length;i++)if(this.elapsed>=bossThresholds[i]&&!this.bossStages.has(i)&&this.spawnBoss(i+1))this.bossStages.add(i);
   const forming=this.enemies.filter(e=>e.spawning>0);for(const e of forming){e.spawning=Math.max(0,e.spawning-dt);e.sprite.setAlpha(1-e.spawning/.85);}const bosses=this.enemies.filter(e=>e.boss);this.enemies=this.enemies.filter(e=>!e.boss&&!forming.includes(e));baseEnemies.call(this,dt);for(const [e,force]of crowdSeparation(this.enemies)){if(e.hp>0)this.moveBody(e.sprite,force.x*dt,force.y*dt,8);}this.enemies.push(...bosses,...forming);if(state.mode!=="raid")return;
   for(const e of this.enemies){e.buffIcons?.setPosition(e.sprite.x,e.sprite.y-(e.barHeight||e.sprite.displayHeight)-20).setVisible(e.sprite.visible&&!e.spawning);if(e.buffTip&&!e.sprite.visible)e.buffTip.setVisible(false);e.aura?.setPosition(e.sprite.x,e.sprite.y).setDepth(e.sprite.y-1).setVisible(e.sprite.visible);e.nameLabel?.setPosition(e.sprite.x,e.sprite.y-e.sprite.displayHeight-18).setVisible(e.sprite.visible);if(e.hp>0&&e.mods?.includes('regenerating'))e.hp=Math.min(e.maxHP,e.hp+e.maxHP*.015*dt);}
   for(const e of bosses){
    if(e.hp<=0)continue;const s=e.sprite;if(Math.hypot(s.x-this.hero.x,s.y-this.hero.y)<32)this.takeHeroDamage((12+e.boss*3)*dt);if(state.mode!=='raid')return;
    e.hit=Math.max(0,(e.hit||0)-dt);if(!e.hit)s.clearTint();
    e.casting=Math.max(0,(e.casting||0)-dt);
    // Frame canvases include spell effects above the head. Keep the feet anchored
    // while the source animation plays, and give floating bosses a visible hover.
    e.hoverTime=(e.hoverTime||0)+dt;const hover=e.type==='gurag'?Math.sin(e.hoverTime*3)*2:Math.sin(e.hoverTime*2.6)*5;
    s.setOrigin(.5,1+hover/s.height).setDepth(s.y+15);
    if(e.pendingAttack){e.pendingAttack.left-=dt;if(e.pendingAttack.left<=0){this.releaseBossAttack(e,e.pendingAttack);e.pendingAttack=null;}}
    if(!e.casting){
     if(s.anims.currentAnim?.key!==`boss-${e.type}`)s.play(`boss-${e.type}`);
     const target=this.navigationMap?.links?pursuitTarget(e,this.hero,this.flow,this.navigationMap,this.canWalk.bind(this)):this.hero,a=Math.atan2(target.y-s.y,target.x-s.x),step=Math.min(e.speed*dt,Math.hypot(target.x-s.x,target.y-s.y));
     this.moveBody(s,Math.cos(a)*step,Math.sin(a)*step,10);
    }
    e.cast-=dt;if(e.cast>0)continue;e.cast=5.5;e.casting=1.6;e.phase++;
    s.play(`boss-${e.type}-cast`);
    const attack={left:1.05,x:this.hero.x,y:this.hero.y,phase:e.phase};
    e.pendingAttack=attack;
    if(e.phase%2 && !(e.type!=='gurag'&&e.phase%3===0)){
     const radius=e.type==='gurag'?95:125,color=e.type==='gurag'?0xdcb580:e.type==='shadow'?0xb66aff:0x65e3dc;
     const art=this.add.graphics().setDepth(4),marker=this.add.image(attack.x,attack.y,'original-waypoint-glow-0').setDisplaySize(radius*2,radius*2).setTint(color).setAlpha(.15).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
     this.areaEffects.push({type:'slam',bossType:e.type,hostile:true,x:attack.x,y:attack.y,radius,life:1.05,total:1.05,damage:20+e.boss*5,color,art,marker});
    }
   }
  },
  releaseBossAttack(e,attack){
   const s=e.sprite;if(!s.active||e.hp<=0)return;
   if(e.type!=='gurag'&&attack.phase%3===0){for(let n=0;n<4;n++){const a=Math.PI/4+n*Math.PI/2,sx=attack.x+Math.cos(a)*180,sy=attack.y+Math.sin(a)*180;const art=this.add.sprite(sx,sy,'original-boss-scythe-0').play('boss-scythe').setScale(.65).setRotation(a+Math.PI).setDepth(5000);this.enemyBullets.push({sprite:art,vx:-Math.cos(a)*160,vy:-Math.sin(a)*160,life:2.3,damage:24});}return;}
   if(attack.phase%2)return;
   if(e.type==='gurag'){
    for(let n=0;n<8;n++){const a=n*Math.PI/4,delay=n*.065,x=s.x+Math.cos(a)*130,y=s.y+Math.sin(a)*100;
     const art=this.add.sprite(s.x,s.y-35,'original-boss-rock-0').setScale(.65).setDepth(5000),marker=this.add.ellipse(x,y,46,24,0xf4ab59,.2).setStrokeStyle(1,0xffd198).setDepth(3);
     this.areaEffects.push({type:'boulder',hostile:true,x,y,startX:s.x,startY:s.y-35,life:1.05+delay,total:1.05+delay,damage:20,radius:27,art,marker,bossType:'gurag'});
    }return;
   }
   for(let n=0;n<12;n++){const angle=n*Math.PI/6+attack.phase*.3,art=this.add.sprite(s.x,s.y-35,'original-boss-scythe-0').play('boss-scythe').setScale(.3).setRotation(angle).setDepth(5000);this.enemyBullets.push({sprite:art,vx:Math.cos(angle)*145,vy:Math.sin(angle)*145,life:3,damage:14+e.boss*3});}
  },
  bossDeath(e){
   const s=e.sprite;e.pendingAttack=null;s.clearTint().setBlendMode(Phaser.BlendModes.ADD);this.effectArt('shadow-impact',s.x,s.y-50).setScale(2).setTint(e.type==='gurag'?0xffd8a1:0x9ceaff);
   for(let n=0;n<18;n++){const a=n*Math.PI*2/18,art=this.add.image(s.x,s.y-35,e.type==='gurag'?'original-boss-rock-0':'original-experience-0').setScale(e.type==='gurag'?.25:.8).setDepth(s.y+40);this.tweens.add({targets:art,x:s.x+Math.cos(a)*110,y:s.y-45+Math.sin(a)*65,alpha:0,angle:n*45,duration:850+n*15,onComplete:()=>art.destroy()});}
   this.tweens.add({targets:s,y:s.y-45,alpha:0,duration:1100,onComplete:()=>s.destroy()});
  },
  bossImpact(f){
   if(f.bossType==='gurag'){
    const crack=this.add.image(f.x,f.y,'original-ground-crack-0').setDisplaySize(f.radius*2,f.radius*1.1).setDepth(2);this.tweens.add({targets:crack,alpha:0,delay:650,duration:750,onComplete:()=>crack.destroy()});
    for(let n=0;n<10;n++){const a=n*Math.PI/5,rock=this.add.image(f.x,f.y,'original-boss-rock-0').setScale(.3).setDepth(f.y+20);this.tweens.add({targets:rock,x:f.x+Math.cos(a)*f.radius,y:f.y+Math.sin(a)*f.radius*.65,angle:180,alpha:0,duration:500,onComplete:()=>rock.destroy()});}
   }else{
    this.effectArt('shadow-impact',f.x,f.y).setDisplaySize(f.radius*2,f.radius*2).setTint(f.bossType==='shadow'?0xffffff:0x78ffe5);
    for(let n=0;n<7;n++){const a=n*Math.PI*2/7,flame=this.add.sprite(f.x+Math.cos(a)*f.radius*.65,f.y+Math.sin(a)*f.radius*.65,'original-reaper-flame-0').setOrigin(.5,.8).setScale(.4).setDepth(f.y+30).setBlendMode(Phaser.BlendModes.ADD).play('reaper-flame');if(f.bossType==='shadow')flame.setTint(0xca70ff);this.tweens.add({targets:flame,alpha:0,delay:250,duration:500,onComplete:()=>flame.destroy()});}
   }

  }
 });
}
