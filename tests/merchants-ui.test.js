import test from 'node:test';
import assert from 'node:assert/strict';
import {MERCHANTS,merchantStock} from '../src/merchants.js';
import {uiScaleFor,worldScaleFor} from '../src/ui-metrics.js';
import {item,vendorPrice} from '../src/core.js';

test('merchant catalogs are disjoint, free and replenish without altering other stores',()=>{
 const stocks={},types=[];
 for(const [id,m] of Object.entries(MERCHANTS)){
  const g=merchantStock(stocks,id);assert.equal(g.items.length,m.stock.length);
  assert(g.items.every(i=>vendorPrice(i)===0));
  types.push(...g.items.map(i=>i.type));
  const removed=g.items.pop();merchantStock(stocks,id);
  assert(g.items.some(i=>i.type===removed.type&&i.id!==removed.id));
 }
 assert.equal(new Set(types).size,types.length);
 const smithIds=stocks.blacksmith.items.map(i=>i.id);
 merchantStock(stocks,'jeweler');assert.deepEqual(stocks.blacksmith.items.map(i=>i.id),smithIds);
});
test('larger UI fits both panels at desktop resolutions without changing world zoom',()=>{
 for(const [w,h] of [[1280,720],[1920,1080],[2560,921],[2560,1440]]){
  const scale=uiScaleFor(w,h);assert(scale>1);assert(scale*640<=h);assert(w/scale>=1100);
 }
 assert.equal(worldScaleFor(1080),1);assert.equal(uiScaleFor(1920,1080),1.5);
});

test('equipment art varies between drops and remains fixed on each item',()=>{const arts=new Set(Array.from({length:12},()=>item('sword').visualSprite));assert.equal(arts.size,6);const it=item('amulet');assert.equal(JSON.parse(JSON.stringify(it)).visualSprite,it.visualSprite);assert.equal(it.w*it.h,1);});
