// Contours are shared by the minimap and the Tab overlay, with no prop sprite noise.
export function mapContours(map, explored, hub=false) {
  const known=(x,y)=>!!map.tiles[y]?.[x]&&(hub||explored.has(y*map.w+x));
  const walkable=(x,y)=>!!map.tiles[y]?.[x];
  const edges=[];
  for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++)if(known(x,y)){
    if(!walkable(x,y-1))edges.push([x,y,x+1,y]);
    if(!walkable(x,y+1))edges.push([x,y+1,x+1,y+1]);
    if(!walkable(x-1,y))edges.push([x,y,x,y+1]);
    if(!walkable(x+1,y))edges.push([x+1,y,x+1,y+1]);
  }
  return edges;
}
export function isOccluding(sprite, hero, alphaAt) {
  const baseline=sprite.occlusionY??sprite.y;
  if(hero.y>=baseline-2)return false;
  const b=sprite.getBounds(),headY=hero.y-30;
  if(hero.x<b.left||hero.x>b.right||headY<b.top||headY>b.bottom)return false;
  // Test actual art under the head instead of making an entire empty image rectangle fade.
  const x=Math.floor((hero.x-b.left)/sprite.scaleX),y=Math.floor((headY-b.top)/sprite.scaleY);
  return [[0,0],[-4,0],[4,0],[0,7],[0,-5]].some(([dx,dy])=>alphaAt(x+dx,y+dy)>32);
}
