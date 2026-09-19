import test from 'node:test';
import assert from 'node:assert/strict';
import { newProfile, grid, item, put, equippedSkills } from '../src/core.js';
import { equip, unequip, socketGem, unsocket, transfer } from '../src/inventory.js';

test('equipment swaps are atomic when backpack cannot hold old weapon',()=>{
 const p=newProfile();p.bag=grid(1,1);const ring=item('ring');put(p.bag,ring);const before=JSON.stringify(p);assert.equal(unequip(p,'weapon'),false);assert.equal(JSON.stringify(p),before);
});
test('new slots equip and unequip without duplicating sockets',()=>{
 const p=newProfile(),helmet=item('helmet');put(p.bag,helmet);assert.ok(equip(p,helmet.id));assert.equal(p.equipment.helmet.id,helmet.id);assert.ok(unequip(p,'helmet'));assert.equal(p.bag.items.filter(i=>i.id===helmet.id).length,1);
});
test('socket swapping preserves both gems, extraction restores inventory',()=>{
 const p=newProfile(),gem=p.bag.items.find(i=>i.type==='nova'),old=p.equipment.weapon.sockets[0];assert.ok(socketGem(p,p.equipment.weapon,0,gem.id));assert.ok(p.bag.items.some(i=>i.id===old.id));assert.equal(p.bag.items.some(i=>i.id===gem.id),false);assert.ok(unsocket(p,p.equipment.weapon,0));assert.equal(p.bag.items.filter(i=>i.id===gem.id).length,1);
});
test('incompatible socket insertion does not consume either gem',()=>{
 const p=newProfile(),gem=p.bag.items.find(i=>i.type==='slash');const before=JSON.stringify(p);assert.equal(socketGem(p,p.equipment.weapon,0,gem.id),false);assert.equal(JSON.stringify(p),before);
});
test('taking revealed loot never reveals the next hidden item',()=>{
 const p=newProfile(),c={grid:grid(4,4),revealed:1};put(c.grid,item('fire'));put(c.grid,item('haste'));const first=c.grid.items[0],second=c.grid.items[1];assert.ok(transfer(c.grid,p.bag,first.id,c));assert.equal(c.revealed,0);assert.equal(transfer(c.grid,p.bag,second.id,c),false);assert.equal(c.grid.items.length,1);
});
test('moving within a grid or between grids preserves item count and bounds',()=>{
 const a=grid(4,4),b=grid(4,4),it=item('sword');put(a,it);assert.equal(transfer(a,b,it.id,null,4,4),false);assert.equal(a.items.length,1);assert.ok(transfer(a,b,it.id,null,2,1));assert.equal(a.items.length,0);assert.ok(transfer(b,b,it.id,null,0,0));assert.equal(b.items.length,1);
});

test('two ring slots and explicit equipment targets preserve both items', () => {
 const p=newProfile(),a=item('ring'),b=item('ring');put(p.bag,a);put(p.bag,b);
 assert.equal(equip(p,a.id),true);assert.equal(equip(p,b.id),true);
 assert.equal(p.equipment.ring.id,a.id);assert.equal(p.equipment.ring2.id,b.id);
 const shield=item('shield');put(p.bag,shield);assert.equal(equip(p,shield.id,'helmet'),false);
 assert.equal(equip(p,shield.id,'shield'),true);assert.equal(p.equipment.shield.id,shield.id);
});
