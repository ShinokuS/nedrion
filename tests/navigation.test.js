import test from 'node:test';
import assert from 'node:assert/strict';
import {navigationMap,clearSegment,pursuitTarget} from '../src/navigation.js';
import {flowField} from '../src/core.js';

test('routing goes around a solid obstacle without cutting its corners',()=>{
 const map={w:12,h:10,tiles:Array.from({length:10},()=>Array(12).fill(1))};
 const canWalk=(x,y,r=8)=>x>=r&&y>=r&&x<384-r&&y<320-r&&!(x+r>130&&x-r<210&&y+r>50&&y-r<220);
 const nav=navigationMap(map,canWalk),hero={x:304,y:112},enemy={sprite:{x:80,y:112}},field=flowField(nav,9,3);
 assert(!clearSegment(canWalk,80,112,304,112));
 for(let n=0;n<1800&&Math.hypot(enemy.sprite.x-hero.x,enemy.sprite.y-hero.y)>3;n++){
  const s=enemy.sprite,t=pursuitTarget(enemy,hero,field,nav,canWalk),d=Math.hypot(t.x-s.x,t.y-s.y),step=Math.min(d,2);
  if(d){s.x+=(t.x-s.x)/d*step;s.y+=(t.y-s.y)/d*step;}
  assert(canWalk(s.x,s.y),'route crossed a solid footprint');
 }
 assert(Math.hypot(enemy.sprite.x-hero.x,enemy.sprite.y-hero.y)<4,'enemy failed to get around the obstacle');
});
