import test from 'node:test';
import assert from 'node:assert/strict';
import {dragCell,socketLayout} from '../src/visual-layout.js';

test('socket arrangements are centered within the item including a single socket',()=>{
 for(const [w,h]of [[32,96],[64,96],[64,64],[32,32]])for(let n=1;n<=Math.min(6,w*h/1024);n++){
  const p=socketLayout(n,w,h),xs=p.map(p=>p[0]),ys=p.map(p=>p[1]);
  assert.equal((Math.min(...xs)+Math.max(...xs))/2,w/2);
  assert.equal((Math.min(...ys)+Math.max(...ys))/2,h/2);
 }
});

test('dragging from a lower item cell preserves the grabbed cell on drop',()=>{
 const target={x:880,y:420,cell:32};
 assert.deepEqual(dragCell(target,{grabX:1,grabY:2},976,580),{x:2,y:3});
 assert.deepEqual(dragCell(target,{grabX:1,grabY:2},881,421),{x:-1,y:-2});
});
test('socket links follow a continuous snake without diagonal jumps',()=>{
 const points=socketLayout(6,64,96);
 for(let i=1;i<points.length;i++)assert.equal(Math.abs(points[i][0]-points[i-1][0])+Math.abs(points[i][1]-points[i-1][1]),24);
 assert.deepEqual(socketLayout(3,32,96),[[16,24],[16,48],[16,72]]);
});
