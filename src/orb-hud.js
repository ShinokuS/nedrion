import {toggleFullscreen} from './game-input.js';
import {state,openPanel,closePanel} from './main.js';
import {equippedSkills} from './core.js';
import {ACTION_KEYS,actionSlots} from './action-slots.js';
import {isActiveSkill} from './skill-rules.js';

function text(s,x,y,value,size=12){const t=s.add.text(Math.round(x),Math.round(y),value,{fontFamily:'Arial',fontSize:`${Math.max(13,size)}px`,resolution:3,color:'#e5d6b4',stroke:'#090709',strokeThickness:0}).setOrigin(.5);s.ui.add(t);return t;}
function liquidTexture(s,key,color){
 if(s.textures.exists(key))return;
 const tex=s.textures.createCanvas(key,96,96),c=tex.context;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){const d=Math.hypot(x-47.5,y-47.5)/47;if(d>1)continue;
  const shine=Math.max(0,1-Math.hypot(x-31,y-26)/27),v=.36+.58*(1-d*d)+shine*.6+(((x*13+y*7)%11)-5)*.007;
  c.fillStyle=`rgb(${color.map(a=>Math.min(255,Math.round(a*v))).join(',')})`;c.fillRect(x,y,1,1);
 }tex.refresh();
}
export function drawOrbHUD(s){
 const fullscreen=text(s,16,18,'⛶',24).setOrigin(0,.5).setInteractive();fullscreen.on('pointerdown',()=>toggleFullscreen(s));
 const hudStart=s.ui.list.length;const w=s.uiWidth,h=s.uiHeight,cx=Math.round(w/2),cy=h-90;
 liquidTexture(s,'orb-red',[230,22,38]);liquidTexture(s,'orb-violet',[137,49,235]);liquidTexture(s,'orb-empty',[28,25,31]);
 for(const [x,key,field]of [[cx-215,'orb-red','healthOrb'],[cx+216,'orb-violet','experienceOrb']]){s.ui.add(s.add.image(x,cy,'orb-empty'));const fill=s.add.image(x,cy,key);s.ui.add(fill);s[field]=fill;}
 s.ui.add(s.add.image(cx-360,h-238,'gothic-hud').setOrigin(0).setDisplaySize(720,288));
 s.uiTexts.hp=text(s,cx-215,cy+3,'',14);text(s,cx-215,cy+21,'ЖИЗНЬ',9);
 s.uiTexts.experience=text(s,cx+216,cy+3,'',13);text(s,cx+216,cy+21,'ОПЫТ',9);
 s.ui.add(s.add.image(cx+216,h-25,'original-socket-ring-0').setDisplaySize(34,34));s.uiTexts.level=text(s,cx+216,h-25,'',14);
 const skills=equippedSkills(state.profile.equipment),assigned=actionSlots(state.profile);s.actionCooldowns=[];
 ACTION_KEYS.forEach((key,i)=>{const x=cx-89+i*47,y=h-89,skill=skills.find(g=>g.id===assigned[i]);
  const frame=s.add.image(x,y,'hs-skill-frame-0').setOrigin(0).setDisplaySize(43,43).setInteractive();s.ui.add(frame);
  if(skill)s.ui.add(s.add.image(x+21,y+21,`original-skill-icon-${skill.type}-0`).setDisplaySize(37,37));
  const shade=s.add.rectangle(x+3,y+3,37,37,0x06060b,.75).setOrigin(0);s.ui.add(shade);s.actionCooldowns.push({shade,id:skill?.id});text(s,x+21,y+44,key,11);
  frame.on('pointerover',p=>{if(skill)s.showItemTooltip(skill,p.x/s.uiScale,p.y/s.uiScale);}).on('pointerout',()=>{s.tooltip?.destroy();s.tooltip=null;});frame.on('pointerdown',(_p,_x,_y,e)=>{e.stopPropagation();s.openActionPicker(i);});
 });
 const automatic=skills.filter(g=>!isActiveSkill(g));automatic.forEach((skill,i)=>{const x=cx+(i-(automatic.length-1)/2)*35;const icon=s.add.image(x,h-117,`original-skill-icon-${skill.type}-0`).setDisplaySize(31,31).setInteractive();icon.on('pointerover',p=>s.showItemTooltip(skill,p.x/s.uiScale,p.y/s.uiScale)).on('pointerout',()=>{s.tooltip?.destroy();s.tooltip=null;});s.ui.add(icon);});
 s.hudScale=.85;for(const child of s.ui.list.slice(hudStart)){child.setPosition(cx+(child.x-cx)*s.hudScale,h+(child.y-h)*s.hudScale).setScale(child.scaleX*s.hudScale,child.scaleY*s.hudScale);}
 s.uiTexts.hint=text(s,cx,h-173,'',13);
 s.uiTexts.timer=text(s,w-95,183,'',13).setOrigin(.5,0);s.uiTexts.wave=text(s,w-95,202,'',11).setOrigin(.5,0);
 s.ui.add(s.add.rectangle(w-157,12,146,146,0x07070b,.95).setOrigin(0));s.mapFrame=s.add.image(w-284,6,'original-map-frame-12').setOrigin(0);s.ui.add(s.mapFrame);s.mapStamp=null;s.hudMap=s.add.graphics();s.ui.add(s.hudMap);
}
export function updateOrbHUD(s){
 const hp=Math.max(0,s.hp??100),max=s.maxHP||100,xp=s.xp||0,threshold=(s.level||1)*10;
 const fill=(orb,ratio)=>{const n=Math.round(96*Math.max(0,Math.min(1,ratio)));orb.setVisible(n>0).setCrop(0,96-n,96,n);};
 fill(s.healthOrb,hp/max);fill(s.experienceOrb,xp/threshold);s.uiTexts.hp.setText(`${Math.ceil(hp)} / ${max}`);s.uiTexts.experience.setText(`${xp} / ${threshold}`);s.uiTexts.level.setText(String(s.level||1));
 for(const {shade,id}of s.actionCooldowns){const left=Math.max(0,s.shotTimes?.[id]||0);shade.setVisible(!!id&&left>0).setScale(s.hudScale,s.hudScale*Math.min(1,left/(s.shotDurations?.[id]||1)));}
 const left=Math.max(0,600-(s.elapsed||0));s.uiTexts.timer.setText(state.mode==='raid'?`До тьмы ${Math.floor(left/60)}:${String(Math.floor(left%60)).padStart(2,'0')}`:'Последний огонь');s.uiTexts.wave.setText(state.mode==='raid'?`Волна ${s.wave} · Убито ${s.kills}`:'Убежище странников');
}
