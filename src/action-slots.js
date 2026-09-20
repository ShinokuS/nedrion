import {isActiveSkill} from './skill-rules.js';
import {equippedSkills} from './core.js';

export const ACTION_KEYS=['Q','E','R','F'];
export function actionSlots(profile){
 const available=new Set(equippedSkills(profile.equipment).filter(isActiveSkill).map(s=>s.id));
 let previous=profile.activeSlots||[profile.active,null,null,null];if(previous.length===3)previous=[previous[0],null,previous[1],previous[2]];
 profile.activeSlots=ACTION_KEYS.map((_,i)=>available.has(previous[i])?previous[i]:null);
 profile.active=null;
 return profile.activeSlots;
}
export function assignAction(profile,index,id){
 if(index<0||index>=ACTION_KEYS.length||id&&!equippedSkills(profile.equipment).some(s=>s.id===id&&isActiveSkill(s)))return false;
 const slots=actionSlots(profile);
 profile.activeSlots=slots.map((value,i)=>i===index?id:value===id?null:value);
 return true;
}
