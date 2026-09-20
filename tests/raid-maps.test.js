import test from 'node:test';
import assert from 'node:assert/strict';
import {contactDamage,consumeRaidMap,detachHeld} from '../src/raid-maps.js';
import {newProfile,item,put,grid} from '../src/core.js';

test('contact damage is continuous and additive, independent of frame rate',()=>{
 assert.equal(contactDamage(4,3,.1),contactDamage(4,3,.05)*2);
 assert.equal(Array.from({length:100},()=>contactDamage(4,3,.01)).reduce((a,b)=>a+b,0).toFixed(4),(contactDamage(4,3,1)).toFixed(4));
 assert.equal(contactDamage(4,3,.1)*10,10*contactDamage(4,3,.1));
});
test('only owned maps can be consumed once',()=>{
 const p=newProfile(),m=item('ravagedmap');put(p.bag,m);assert.equal(consumeRaidMap(p,p.bag.items[0].id),null);assert.equal(consumeRaidMap(p,m.id)?.id,m.id);assert.equal(consumeRaidMap(p,m.id),null);assert.equal(m.mapMods.health,1.7);
});
test('detaching items preserves sockets, respects hidden loot and rejects merchant stock',()=>{
 const p=newProfile(),weapon=p.equipment.weapon,gems=weapon.sockets;
 assert.equal(detachHeld(p,{source:'equipment',slot:'weapon',it:weapon}),weapon);assert.equal(p.equipment.weapon,null);assert.equal(weapon.sockets,gems);
 const g=grid(),hidden=item('ring');put(g,hidden);assert.equal(detachHeld(p,{source:'container',g,it:hidden},{revealed:0}),null);assert.equal(g.items.length,1);
 assert.equal(detachHeld(p,{source:'vendor',g,it:hidden}),null);
 const search={revealed:1};assert.equal(detachHeld(p,{source:'container',g,it:hidden},search),hidden);assert.equal(search.revealed,0);
});
