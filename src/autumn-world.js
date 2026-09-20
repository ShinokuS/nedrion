import {REFUGE} from './refuge-layout.js';
import {rng,grid,put,rollLoot,item} from './core.js';

// A texture is a continuous 384×128 patch, not a bag of interchangeable 32px cells.
function terrainPattern(scene,ctx,key){
 const source=scene.textures.get(`original-${key}-0`).getSourceImage();
 const tile=document.createElement('canvas');tile.width=source.width-64;tile.height=source.height;
 tile.getContext('2d').drawImage(source,64,0,tile.width,tile.height,0,0,tile.width,tile.height);
 return ctx.createPattern(tile,'repeat');
}
export function paintAutumnGround(scene,hub){
 const {map}=scene,w=map.w*32,h=map.h*32;
 for(const key of scene.textures.getTextureKeys())if(key==='world-ground'||key.startsWith('world-ground-'))scene.textures.remove(key);
 const paths=hub?REFUGE.roads:map.paths;
 for(let oy=0;oy<h;oy+=2048)for(let ox=0;ox<w;ox+=2048){
  const key=`world-ground-${ox}-${oy}`,cw=Math.min(2048,w-ox),ch=Math.min(2048,h-oy),texture=scene.textures.createCanvas(key,cw,ch),ctx=texture.context;
  ctx.imageSmoothingEnabled=false;ctx.translate(-ox,-oy);ctx.fillStyle=terrainPattern(scene,ctx,'forest-ground');ctx.fillRect(ox,oy,cw,ch);
  ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=terrainPattern(scene,ctx,'autumn-road-ground');
  for(const [width,alpha]of [[134,.12],[116,.18],[98,.3],[82,.62]]){ctx.lineWidth=width;ctx.globalAlpha=alpha;for(const points of paths){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}}
  ctx.globalAlpha=1;
  if(!hub){const bush=scene.textures.get('original-autumn-bush-0').getSourceImage(),rock=scene.textures.get('original-rock-small-0').getSourceImage();for(let y=Math.max(1,Math.floor(oy/32)-4);y<Math.min(map.h-1,Math.ceil((oy+ch)/32)+4);y++)for(let x=Math.max(1,Math.floor(ox/32)-4);x<Math.min(map.w-1,Math.ceil((ox+cw)/32)+4);x++)if(!map.tiles[y][x]){const art=(x*7+y*3)%17===0?rock:bush;const jitter=((x*73856093^y*19349663^map.seed)>>>0);ctx.drawImage(art,x*32+8+jitter%16-art.width/2,y*32+32+(jitter>>>8)%16-art.height);}}
  texture.refresh();scene.add.image(ox,oy,key).setOrigin(0).setDepth(-100);
 }

}

export function plantForest(scene){
 const {map}=scene,random=rng(scene.seed^0x7117);

 for(let y=3;y<map.h-2;y+=3)for(let x=3;x<map.w-2;x+=3){
  if(map.tiles[y][x])continue;
  // Trees sit outside the navigable surface. Their canopies may naturally overhang it.
  let near=false;for(let dy=-5;dy<=5&&!near;dy++)for(let dx=-5;dx<=5;dx++)if(map.tiles[y+dy]?.[x+dx]){near=true;break;}
  if(!near)continue;
  const wx=x*32+Math.floor(random()*30),wy=y*32+Math.floor(random()*30),variant=Math.floor(random()*3),key=['tree-a','tree-b','tree-c'][variant];
  const tree=scene.add.image(wx,wy,`original-${key}-0`).setOrigin(.5,1).setDepth(wy);scene.occluders.push(tree);
  if(variant!==2){const crown=scene.add.image(wx,wy-16,'original-tree-leaves-0').setOrigin(.5,1).setDepth(wy+1);crown.occlusionY=wy;scene.occluders.push(crown);}
 }
}

export function furnishDistricts(scene){
 const random=rng(scene.seed^0x9723);let campCount=0,fountainCount=0;
 for(const [index,r]of scene.map.rooms.entries()){
  const cx=r.cx*32+16,cy=r.cy*32+16,mirror=r.mirror;
  const solid=(key,x,y,footprint)=>scene.placeSolid(cx+x*mirror,cy+y,`original-${key}-${key==='grave'?Math.floor(random()*2):key==='wood-fence'?Math.floor(random()*7):0}`,1,footprint);
  const decor=(key,x,y)=>scene.add.image(cx+x*mirror,cy+y,`original-${key}-0`).setOrigin(.5,1).setDepth(-30);
  const stores=[];
  const stash=(key,title,x,y)=>{
   if(key==='chest-closed')key=random()<.55?'chest':'wood-crate';if(key==='town-barrel'&&random()<.45)key='supply-crate';if(key==='corpse-pile')key='corpse-'+(1+Math.floor(random()*6));if(key==='wood-coffin')key=['wood-coffin','coffin-3','coffin-6','coffin-7'][Math.floor(random()*4)];
   const o=scene.addObject('container',cx+x*mirror,cy+y,`original-${key}-0`,title);
   if(!o.sprite?.active)return;
   o.grid=grid(5,4);o.revealed=0;o.progress=0;
   for(let n=0;n<2+Math.floor(random()*3);n++)put(o.grid,rollLoot(random));stores.push(o);
  };
  if(r.theme===0){
   if(campCount++<2){solid('camp',-145,-45,{w:78,h:42});scene.warmLight(cx-145*mirror,cy-80,165);}else{solid('cargo-crate',-145,-45,{w:54,h:35});decor('wood-debris',-110,15);}
   solid('tent',-190,165,{w:105,h:55});solid('cart',175,-90,{w:84,h:35});solid('logs',205,15,{w:72,h:35});
   stash('town-barrel','Бочка с припасами',140,85);stash('town-barrel','Бочка',185,100);stash('chest-closed','Сундук каравана',-170,210);stash('handcart','Брошенная тележка',215,-45);
   decor('bucket',-90,-30);decor('wood-debris',210,160);
  }else if(r.theme===1){
   solid('ruined-house',-165,-95,{w:190,h:68});
   for(let y=-110;y<=100;y+=90)for(let x=90;x<=230;x+=65)solid('grave',x,y,{w:18,h:12});
   stash('wood-coffin','Закрытый гроб',-150,105);stash('wood-coffin','Погребальный ларь',-210,125);stash('chest-closed','Сундук хранителя',-210,-65);
   decor('stone-debris',-65,160);solid('wood-fence',150,-175,{w:68,h:12});
  }else if(r.theme===2){
   solid('town-house',-155,-105,{w:250,h:115,offsetY:-18});
   solid('scarecrow',165,-25,{w:18,h:15});for(const [x,y]of [[110,70],[164,72],[220,90],[140,112]])solid('haybale',x,y,{w:36,h:22});
   for(const x of [110,181])solid('wood-fence',x,155,{w:65,h:12});
   stash('town-barrel','Запасы зерна',-205,25);stash('town-barrel','Бочка у дома',-160,50);stash('handcart','Повозка с припасами',180,-130);stash('chest-closed','Сундук хозяина',-190,115);
   decor('bucket',-115,35);decor('wood-debris',215,-180);
  }else if(r.theme===3){
   if(fountainCount++===0)solid('fountain',-140,-50,{w:140,h:80});else solid('well',-140,-50,{w:62,h:36});if(fountainCount===1)solid('scaffold',190,-110,{w:158,h:65});else{solid('cargo-crate',190,-110,{w:52,h:35});solid('wood-fence',230,-150,{w:62,h:10});}
   stash('chest-closed','Казённый сундук',150,10);stash('town-barrel','Бочка',215,30);stash('chest-closed','Забытый сундук',-155,165);
   decor('stone-debris',-180,60);decor('wood-debris',175,185);
  }else{
   solid('tent',-175,-95,{w:102,h:48});solid('logs',180,-90,{w:80,h:38});solid('logs',200,-30,{w:80,h:38});solid('cart',-145,140,{w:90,h:35});
   stash('handcart','Тележка лесорубов',170,100);stash('town-barrel','Бочка с инструментами',-160,-15);stash('chest-closed','Ларь лесорубов',-200,30);stash('town-barrel','Бочка',210,150);
   decor('wood-debris',175,35);decor('bucket',-105,130);
  }
  // Small edge vegetation and rubble belong to the perimeter, leaving combat routes readable.
  for(let n=0;n<28;n++){const a=n/28*Math.PI*2,rad=.68+random()*.1,x=Math.cos(a)*r.w*16*rad,y=Math.sin(a)*r.h*16*rad;decor(n%5===0?'rock-small':n%3===0?'fall-branch':'autumn-bush',x,y);}
  if(index===5&&stores.length)put(stores[0].grid,item('key',2));
  for(const o of stores.slice(0,2)){
   const x=o.x+34,y=o.y+26;if(!scene.canWalk(x,y,4))continue;
   const it=rollLoot(random),key=`original-ground-${it.type}-0`,texture=['skill','support'].includes(it.kind)?scene.groundItemTexture(it):scene.textures.exists(key)?key:scene.itemTexture(it),loose=scene.addObject('pickup',x,y,texture,it.name);loose.item=it;
   if(!scene.textures.exists(key))loose.sprite.setScale(Math.min(1,20/loose.sprite.height));
  }
 }
}
