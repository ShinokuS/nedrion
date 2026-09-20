import test from 'node:test';
import assert from 'node:assert/strict';
import {mapContours,isOccluding} from '../src/cartography.js';

test('map contours hide unexplored cells and omit shared walls',()=>{
 const map={w:2,h:1,tiles:[[1,1]]};
 assert.equal(mapContours(map,new Set()).length,0);
 assert.deepEqual(mapContours(map,new Set([0])),[[0,0,1,0],[0,1,1,1],[0,0,0,1]]);
 const all=mapContours(map,new Set(),true);
 assert.equal(all.length,6);
 assert(!all.some(([x1,y1,x2,y2])=>x1===1&&x2===1));
});

test('occlusion fades opaque art behind the hero, never in front or through transparent pixels',()=>{
 const sprite={y:100,occlusionY:90,scaleX:1,scaleY:1,getBounds:()=>({left:0,right:100,top:0,bottom:100})};
 assert.equal(isOccluding(sprite,{x:50,y:70},()=>255),true);
 assert.equal(isOccluding(sprite,{x:50,y:100},()=>255),false);
 assert.equal(isOccluding(sprite,{x:50,y:70},()=>0),false);
 assert.equal(isOccluding(sprite,{x:150,y:70},()=>255),false);
});
