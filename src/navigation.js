// The same swept footprint is used for route edges and actual movement.
export function clearSegment(canWalk,x,y,tx,ty,r=8){
 const steps=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/4));
 for(let i=0;i<=steps;i++)if(!canWalk(x+(tx-x)*i/steps,y+(ty-y)*i/steps,r))return false;
 return true;
}
export function navigationMap(map,canWalk){
 const tiles=map.tiles.map((row,y)=>row.map((v,x)=>v&&canWalk(x*32+16,y*32+16,10)?1:0));
 const links=Array.from({length:map.h},()=>Array.from({length:map.w},()=>[]));
 for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++)if(tiles[y][x]){
  for(const [dx,dy]of [[1,0],[0,1]])if(tiles[y+dy]?.[x+dx]&&clearSegment(canWalk,x*32+16,y*32+16,(x+dx)*32+16,(y+dy)*32+16,10)){
   links[y][x].push([x+dx,y+dy]);links[y+dy][x+dx].push([x,y]);
  }
 }
 return {...map,tiles,links};
}
export function reachableAnchor(nav,x,y,canWalk){
 const tx=Math.floor(x/32),ty=Math.floor(y/32);let best=null;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const nx=tx+dx,ny=ty+dy;if(!nav.tiles[ny]?.[nx])continue;
  const d=Math.hypot(nx*32+16-x,ny*32+16-y);
  if((!best||d<best.d)&&clearSegment(canWalk,x,y,nx*32+16,ny*32+16))best={x:nx,y:ny,d};
 }
 return best;
}
export function pursuitTarget(enemy,hero,field,nav,canWalk){
 const s=enemy.sprite;
 if(clearSegment(canWalk,s.x,s.y,hero.x,hero.y))return {x:hero.x,y:hero.y};
 // Keep a waypoint until reached; switching at tile boundaries cuts blocked corners.
 if(enemy.waypoint&&Math.hypot(s.x-enemy.waypoint.x,s.y-enemy.waypoint.y)>2&&clearSegment(canWalk,s.x,s.y,enemy.waypoint.x,enemy.waypoint.y))return enemy.waypoint;
 const anchor=reachableAnchor(nav,s.x,s.y,canWalk);if(!anchor)return {x:s.x,y:s.y};
 let target={x:anchor.x*32+16,y:anchor.y*32+16};
 if(Math.hypot(target.x-s.x,target.y-s.y)<3){
  let best=field?.[anchor.y]?.[anchor.x]??Infinity;
  for(const [x,y]of nav.links[anchor.y][anchor.x])if(field?.[y]?.[x]<best){best=field[y][x];target={x:x*32+16,y:y*32+16};}
 }
 enemy.waypoint=target;return target;
}
// Local crowd steering keeps melee packs readable without quadratic all-pairs scans.
export function crowdSeparation(enemies){
 const cells=new Map(),result=new Map();
 for(const e of enemies){const key=`${Math.floor(e.sprite.x/32)},${Math.floor(e.sprite.y/32)}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(e);}
 enemies.forEach((e,index)=>{const s=e.sprite,cx=Math.floor(s.x/32),cy=Math.floor(s.y/32);let x=0,y=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(const other of cells.get(`${cx+dx},${cy+dy}`)||[]){if(other===e)continue;let vx=s.x-other.sprite.x,vy=s.y-other.sprite.y,d=Math.hypot(vx,vy);if(d>=24)continue;if(d<.1){vx=Math.cos(index*2.4);vy=Math.sin(index*2.4);d=1;}const force=(24-d)/24*32;x+=vx/d*force;y+=vy/d*force;}
  const length=Math.hypot(x,y);if(length>40){x=x/length*40;y=y/length*40;}result.set(e,{x,y});
 });return result;
}
