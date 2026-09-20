import {applyEnemyMods,drawEnemyBadges} from '../src/enemy-modifiers.js';
// Dev-only fixture: main.save disables persistence for inspect/smoke URLs.
import {state,openPanel,closePanel} from '../src/main.js';
import {newProfile,item,put} from '../src/core.js';
while(!state.scene?.hero||!state.scene?.ui)await new Promise(r=>setTimeout(r,100));
state.profile=newProfile();state.panel=null;const s=state.scene,kind=new URLSearchParams(location.search).get('inspect');
if(kind==='raid'||kind==='death'){state.mode='raid';s.startRaid();s.invincible=kind==='raid'?9999:0;if(kind==='death'){s.hp=1;s.enemyBullets.push({sprite:s.add.image(s.hero.x,s.hero.y,'hs-archer-projectile-0'),vx:0,vy:0,life:1,damage:50});}}
else {state.mode='hub';s.startHub();if(kind==='vendor'||kind==='stash'){const o=s.objects.find(o=>o.type===kind);s.hero.setPosition(o.x,o.y+58);s.cameras.main.centerOn(s.hero.x,s.hero.y);if(kind==='vendor')s.activeVendor=o;openPanel(kind);}}

if(kind==='interaction'){
 const toolbar=document.createElement('div');toolbar.style.cssText='position:fixed;top:0;left:280px;z-index:9999;background:#fff;padding:8px';
 const add=(title,action)=>{const b=document.createElement('button');b.textContent=title;b.onclick=action;toolbar.append(b);};document.body.append(toolbar);
 const move=o=>{s.hero.setPosition(o.x,o.y+40);s.cameras.main.centerOn(s.hero.x,s.hero.y);s.fogStamp=-1;s.updateFog();};
 add('Проверить выход',()=>{closePanel();state.mode='raid';s.startRaid();s.invincible=99999;put(state.profile.bag,item('key'));move(s.objects.find(o=>o.type==='exit'&&o.exitType===0));});
 add('Получить смертельный урон',()=>{closePanel();state.mode='raid';s.startRaid();s.hp=1;s.invincible=0;s.enemyBullets.push({sprite:s.add.image(s.hero.x,s.hero.y,'original-archer-arrow-0'),vx:0,vy:0,life:1,damage:50});});
 add('Подойти к тайнику',()=>{if(state.mode==='hub'){closePanel();move(s.objects.find(o=>o.type==='stash'));}});
 add('Подойти к картографу',()=>{if(state.mode==='hub'){closePanel();move(s.objects.find(o=>o.merchantId==='cartographer'));}});
 add('Подойти к проводнику',()=>{if(state.mode==='hub'){closePanel();move(s.objects.find(o=>o.type==='expedition'));}});
}

if(kind==='expansion'){
 const toolbar=document.createElement('div');toolbar.style.cssText='position:fixed;top:0;left:8px;top:90px;z-index:9999;background:#fff;padding:8px;display:flex;flex-direction:column';document.body.append(toolbar);
 const add=(title,action)=>{const b=document.createElement('button');b.textContent=title;b.onclick=action;toolbar.append(b);};
 state.mode='raid';s.startRaid();s.invincible=99999;s.hp=65;s.xp=5;const heal=item('healing'),blink=item('blink');state.profile.equipment.ring=item('ring');state.profile.equipment.ring.sockets=[heal];state.profile.equipment.boots.sockets=[blink];state.profile.activeSlots=[heal.id,blink.id,null];s.renderOverlay(true);
 for(const [type,weapon]of [['meteor','staff'],['rain','bow'],['juggernaut','sword']])add(type,()=>{closePanel();const gear=item(weapon),gem=item(type);gear.sockets=[gem,item('duration')];state.profile.equipment.weapon=gear;state.profile.activeSlots=[heal.id,blink.id,null];s.renderOverlay(true);s.castExpansionSkill({...gem,supports:['duration','multi']},{x:s.hero.x+90,y:s.hero.y},{multi:2,duration:1,haste:0});});
 add('Портал и модификаторы',()=>{s.spawnEnemy();const e=s.enemies.at(-1);e.sprite.setPosition(s.hero.x+145,s.hero.y-80);e.spawnPortal.setPosition(e.sprite.x,e.sprite.y-12);e.buffIcons?.destroy();applyEnemyMods(e,['swift','armored','regenerating']);drawEnemyBadges(s,e);});
 add('Босс 3:00',()=>{closePanel();s.elapsed=180;s.bossStages.clear();});add('Босс 6:00',()=>{closePanel();s.elapsed=360;});add('Босс 9:00',()=>{closePanel();s.elapsed=540;});
}
