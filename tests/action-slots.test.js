import test from 'node:test';
import assert from 'node:assert/strict';
import {actionSlots,assignAction} from '../src/action-slots.js';
import {newProfile,equippedSkills,loseRaid,item,grid,put} from '../src/core.js';
import {moveCursorGem,placeCursorGem} from '../src/inventory.js';

test('legacy Q/R/F assignments migrate to Q/E/R/F without changing their keys',()=>{
 const p=newProfile(),heal=item('healing'),blink=item('blink');p.equipment.ring=item('ring');p.equipment.ring.sockets=[heal];p.equipment.boots.sockets=[blink];p.activeSlots=[heal.id,blink.id,null];
 assert.deepEqual(actionSlots(p),[heal.id,null,blink.id,null]);
});
test('action assignment requires an equipped usable gem and clears after loss',()=>{
 const p=newProfile();assert(!assignAction(p,0,equippedSkills(p.equipment)[0].id));const gem=item('blink');p.equipment.boots.sockets=[gem];const id=gem.id;
 assert(assignAction(p,0,id));assert(assignAction(p,2,id));assert.deepEqual(actionSlots(p),[null,null,id,null]);
 assert(!assignAction(p,1,'missing'));loseRaid(p);assert.deepEqual(actionSlots(p),[null,null,null,null]);
});
test('socket cursor swaps retain both gems and invalid drops preserve ownership',()=>{
 const p=newProfile(),gear=p.equipment.weapon,old=gear.sockets[0],created=item('nova');put(p.bag,created);const gem=p.bag.items.find(i=>i.id===created.id);
 const result=moveCursorGem(p,gear,0,{source:'bag',g:p.bag,it:gem});assert(result);assert.equal(gear.sockets[0],gem);assert.equal(result.held.it,old);assert(p.bag.items.includes(old));assert(!p.bag.items.includes(gem));
 const held={source:'socket',gear,index:0,it:gem},full=grid(1,1);put(full,item('haste'));
 assert(!placeCursorGem(held,full,0,0));assert.equal(gear.sockets[0],gem);
 const empty=grid(2,2);assert(placeCursorGem(held,empty,1,1));assert.equal(gear.sockets[0],null);assert.equal(empty.items[0].id,gem.id);
});
