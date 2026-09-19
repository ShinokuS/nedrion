import { put, fits } from './core.js';

export function equip(profile, id, preferredSlot) {
  const it = profile.bag.items.find(i => i.id === id);
  if (!it || !['weapon', 'armor'].includes(it.kind)) return false;
  const naturalSlot = it.slot || it.kind;
  if (preferredSlot && preferredSlot !== naturalSlot && !(it.type === 'ring' && preferredSlot === 'ring2')) return false;
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
export function socketGem(profile, gear, index, id) {
  const gem = profile.bag.items.find(i => i.id === id);
  if (!gear?.sockets || index < 0 || index >= gear.sockets.length || !gem || !['skill','support'].includes(gem.kind)) return false;
  if (gem.kind === 'skill' && !gem.accept.includes(profile.equipment.weapon?.weapon)) return false;
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
