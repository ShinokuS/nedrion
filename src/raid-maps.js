export const RAID_MAPS={
 forestmap:{name:'Карта проклятого леса',mapMods:{health:1,damage:1,speed:1,loot:0},description:'Проклятый лес • обычная вылазка.'},
 hauntedmap:{name:'Карта беспокойных душ',mapMods:{health:1.3,damage:1.2,speed:1.08,loot:.35},description:'Враги: +30% здоровья, +20% урона, +8% скорости. +35% дополнительных предметов.'},
 ravagedmap:{name:'Карта разорённого леса',mapMods:{health:1.7,damage:1.4,speed:1.15,loot:.8},description:'Враги: +70% здоровья, +40% урона, +15% скорости. +80% дополнительных предметов.'}
};
export function consumeRaidMap(profile,id){const i=profile.bag.items.findIndex(it=>it.id===id&&it.kind==='map');if(i<0)return null;return profile.bag.items.splice(i,1)[0];}
export function contactDamage(wave,defense,dt){return Math.max(1.5,8+wave*.6-defense*.45)*dt;}
export function detachHeld(profile,h,search){
 if(!h?.it||h.source==='vendor')return null;const it=h.it;
 if(h.source==='equipment'){if(profile.equipment[h.slot]?.id!==it.id)return null;profile.equipment[h.slot]=null;}
 else if(h.source==='socket'){if(h.gear.sockets[h.index]?.id!==it.id)return null;h.gear.sockets[h.index]=null;}
 else {const index=h.g?.items.findIndex(i=>i.id===it.id);if(index==null||index<0||h.source==='container'&&(!search||index>=search.revealed))return null;h.g.items.splice(index,1);if(h.source==='container')search.revealed=Math.max(0,search.revealed-1);}
 return it;
}
