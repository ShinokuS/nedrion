import test from 'node:test';
import assert from 'node:assert/strict';
import {item,newProfile,put,equippedSkills,rollLoot,rng,upgradeOptions} from '../src/core.js';
import {moveCursorGem,equip,equipFrom} from '../src/inventory.js';
import {skillModifiers} from '../src/skill-rules.js';
test('new gems enforce host slots and invalid insertion retains ownership',()=>{
 for(const [type,valid,invalid]of [['meteor','staff','sword'],['rain','bow','staff'],['juggernaut','sword','bow'],['healing','ring','boots'],['blink','boots','ring']]){
  const p=newProfile();put(p.bag,item(type));const gem=p.bag.items.find(i=>i.type===type),held={it:gem,g:p.bag,source:'bag'};
  assert.equal(moveCursorGem(p,item(invalid),0,held),false);assert.ok(p.bag.items.includes(gem));assert.ok(moveCursorGem(p,item(valid),0,held));assert.ok(!p.bag.items.includes(gem));
 }
});
test('support effects follow full connected chains and vanish when disconnected',()=>{
 const gear=item('staff'),meteor=item('meteor');gear.sockets=[meteor,item('haste'),item('multi')];gear.links=[true,true];
 let skill=equippedSkills({weapon:gear})[0];assert.deepEqual(skill.supports,['haste','multi']);assert.equal(skillModifiers(skill,{multi:2}).multi,3);
 gear.links[1]=false;skill=equippedSkills({weapon:gear})[0];assert.equal(skillModifiers(skill,{multi:2}).multi,0);assert.equal(skillModifiers(skill,{haste:1}).haste,2);
 gear.sockets[1]=item('pierce');assert.ok(!equippedSkills({weapon:gear})[0].supports.includes('pierce'));
});
test('direct container equip is atomic and preserves hidden-item discovery',()=>{
 const p=newProfile(),chest={grid:{w:4,h:4,items:[]},revealed:1};const sword=item('sword'),hidden=item('ring');put(chest.grid,sword);put(chest.grid,hidden);const previous=p.equipment.weapon;
 assert.equal(equipFrom(p,chest.grid,hidden.id,undefined,chest),false);
 assert.ok(equipFrom(p,chest.grid,sword.id,undefined,chest));assert.equal(p.equipment.weapon.id,sword.id);assert.equal(chest.grid.items[0].id,previous.id);assert.equal(chest.grid.items[1].id,hidden.id);assert.equal(chest.revealed,1);
});
test('duration upgrades require a connected support and jewelry needs no weapon',()=>{
 const boots=item('swiftboots');boots.sockets=[item('blink'),item('duration')];const ring=item('lifering');ring.sockets=[item('healing')];const e={boots,ring};assert.equal(equippedSkills(e).length,2);assert.ok(upgradeOptions(equippedSkills(e)).some(o=>o.id==='duration'));boots.links=[false];assert.ok(!upgradeOptions(equippedSkills(e)).some(o=>o.id==='duration'));
});
test('loot produces stable bounded socket configurations and expanded equipment',()=>{
 const random=rng(123),types=new Set();for(let n=0;n<1000;n++){const it=rollLoot(random);types.add(it.type);if(it.sockets){assert.ok(it.sockets.length<=it.w*it.h);assert.equal(it.links.length,it.sockets.length-1);}}for(const type of ['meteor','rain','juggernaut','healing','blink','duration','warstaff','lifering'])assert.ok(types.has(type),type);
 const p=newProfile(),ring=item('lifering');put(p.bag,ring);assert.ok(equip(p,ring.id,'ring2'));
});
