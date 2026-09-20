export const SUPPORT_RULES={
 fire:['multi','haste','pierce','duration'],arrow:['multi','haste','pierce','duration'],slash:['multi','haste','pierce','duration'],
 nova:['haste'],meteor:['multi','haste'],rain:['multi','haste','duration'],juggernaut:['multi','haste','duration'],healing:['haste'],blink:['haste','duration']
};
export function linkedSupports(gear,index,type){
 let first=index,last=index;while(first>0&&gear.links?.[first-1]!==false)first--;while(last<gear.sockets.length-1&&gear.links?.[last]!==false)last++;
 return [...new Set(gear.sockets.slice(first,last+1).filter(g=>g?.kind==='support'&&SUPPORT_RULES[type]?.includes(g.type)).map(g=>g.type))];
}
export function skillModifiers(skill,upgrades={}){
 return Object.fromEntries(['multi','haste','pierce','duration'].map(type=>[type,skill.supports?.includes(type)?1+(upgrades[type]||0):0]));
}
export function isActiveSkill(skill){return skill?.kind==='skill'&&skill.activeOnly===true;}
