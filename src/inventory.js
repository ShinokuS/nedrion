import {acceptsGem} from './core.js';
import { put, fits } from './core.js';

export function equip(profile, id, preferredSlot) {
  const it = profile.bag.items.find(i => i.id === id);
  if (!it || !['weapon', 'armor'].includes(it.kind)) return false;
  const naturalSlot = it.slot || it.kind;
  if (preferredSlot && preferredSlot !== naturalSlot && !(it.slot === 'ring' && preferredSlot === 'ring2')) return false;
  const slot = preferredSlot || (naturalSlot === 'ring' && profile.equipment.ring && !profile.equipment.ring2 ? 'ring2' : naturalSlot), old = profile.equipment[slot];
  const candidate = { ...profile.bag, items: profile.bag.items.filter(i => i.id !== id) };
  if (old && !put(candidate, old)) return false;
  profile.bag.items = candidate.items;
  profile.equipment[slot] = it;
  return true;
}
export function unequip(profile, slot) {
  const it = profile.equipment[slot];
  if (!it || !put(profile.bag, it)) return false;
  profile.equipment[slot] = null; return true;
}
// Equip directly from a revealed container/stash without a temporary backpack insertion.
export function equipFrom(profile, source, id, preferredSlot, container){
 if(source===profile.bag)return equip(profile,id,preferredSlot);
 const index=source?.items.findIndex(i=>i.id===id),it=source?.items[index];
 if(!it||!['weapon','armor'].includes(it.kind)||container&&source===container.grid&&index>=container.revealed)return false;
 const natural=it.slot||it.kind,slot=preferredSlot||(natural==='ring'&&profile.equipment.ring&&!profile.equipment.ring2?'ring2':natural);
 if(slot!==natural&&!(natural==='ring'&&slot==='ring2'))return false;
 const candidate={...source,items:source.items.filter(i=>i.id!==id)},bag={...profile.bag,items:[...profile.bag.items]},old=profile.equipment[slot];let returned=false;
 if(old){if(put(candidate,old)){const moved=candidate.items.pop();candidate.items.splice(index,0,moved);returned=true;}else if(!put(bag,old))return false;}
 source.items=candidate.items;profile.bag.items=bag.items;profile.equipment[slot]=it;
 if(container&&source===container.grid&&!returned)container.revealed=Math.max(0,container.revealed-1);
 return true;
}
export function socketGem(profile, gear, index, id) {
  const gem = profile.bag.items.find(i => i.id === id);
  if (!gear?.sockets || index < 0 || index >= gear.sockets.length || !gem || !['skill','support'].includes(gem.kind)) return false;
  if (!acceptsGem(gear,gem) || gem.kind === 'skill' && !gem.acceptSlots && !gem.accept?.includes(profile.equipment.weapon?.weapon)) return false;
  const old = gear.sockets[index];
  const bag = { ...profile.bag, items: profile.bag.items.filter(i => i.id !== id) };
  if (old && !put(bag, old)) return false;
  profile.bag.items = bag.items; gear.sockets[index] = gem; return true;
}
export function unsocket(profile, gear, index) {
  const gem = gear?.sockets?.[index];
  if (!gem || !put(profile.bag, gem)) return false;
  gear.sockets[index] = null; if (profile.active === gem.id) profile.active = null; return true;
}
export function transfer(from, to, id, container, x, y) {
  const index = from.items.findIndex(i => i.id === id);
  if (index < 0 || (container && from === container.grid && index >= container.revealed)) return false;
  const it = from.items[index];
  if (from === to) return x !== undefined && fits(from, it, x, y, id) && put(from, it, x, y);
  if (!put(to, it, x, y)) return false;
  from.items.splice(index, 1);
  if (container && from === container.grid) container.revealed = Math.max(0, container.revealed - 1);
  return true;
}

// Cursor moves retain ownership until a valid destination is committed.
export function moveCursorGem(profile, gear, index, held) {
 const gem=held?.it;
 if(!gear?.sockets||index<0||index>=gear.sockets.length||!['skill','support'].includes(gem?.kind)||held.source==='vendor'||held.source==='container')return false;
 if(held.source==='socket'&&held.gear===gear&&held.index===index)return false;
 if(!acceptsGem(gear,gem))return false;
 const old=gear.sockets[index];
 if(held.source==='socket'&&old&&!acceptsGem(held.gear,old))return false;
 if(held.source==='socket'){
  if(held.gear.sockets[held.index]!==gem)return false;
  held.gear.sockets[held.index]=old;
 }else{
  const at=held.g?.items.indexOf(gem);if(at===undefined||at<0)return false;
  if(old){old.x=gem.x;old.y=gem.y;held.g.items[at]=old;}else held.g.items.splice(at,1);
 }
 gear.sockets[index]=gem;
 return {old,held:old?{...held,it:old}:null};
}
export function placeCursorGem(held, target, x, y){
 if(held.source!=='socket'||held.gear.sockets[held.index]!==held.it||!put(target,held.it,x,y))return false;
 held.gear.sockets[held.index]=null;return true;
}
