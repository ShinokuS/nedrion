import {RAID_MAPS} from './raid-maps.js';
import gearArt from './gear-art.json' with {type:'json'};
import {linkedSupports} from './skill-rules.js';
export const RARITIES = [
  { name: "Обычный", color: "#a0aaa5", mult: 1 },
  { name: "Магический", color: "#6aa5e5", mult: 1.35 },
  { name: "Редкий", color: "#e0bb65", mult: 1.8 },
  { name: "Легендарный", color: "#ed854e", mult: 2.6 },
];
export const DEFS = {
  staff: {
    name: "Посох углей",
    kind: "weapon",
    weapon: "staff",
    w: 1,
    h: 3,
    icon: "staff",
    damage: 14,
    sockets: 3,
  },
  sword: {
    name: "Клинок сумерек",
    kind: "weapon",
    weapon: "sword",
    w: 1,
    h: 3,
    icon: "sword",
    damage: 18,
    sockets: 3,
  },
  bow: {
    name: "Лук странника",
    kind: "weapon",
    weapon: "bow",
    w: 2,
    h: 3,
    icon: "bow",
    damage: 16,
    sockets: 3,
  },
  armor: {
    name: "Доспех изгнанника",
    kind: "armor",
    w: 2,
    h: 3,
    icon: "armor",
    armor: 3,
    sockets: 2,
  },
  fire: {
    name: "Огненный шар",
    kind: "skill",
    w: 1,
    h: 1,
    icon: "gem",
    accept: ["staff", "sword", "bow"],
    description: "Универсальный • огненный снаряд в ближайшего врага.",
  },
  arrow: {
    name: "Пронзающая стрела",
    kind: "skill",
    w: 1,
    h: 1,
    icon: "gem",
    accept: ["bow"],
    description: "Только лук • быстрый снаряд с пробитием.",
  },
  slash: {
    name: "Призрачный разрез",
    kind: "skill",
    w: 1,
    h: 1,
    icon: "gem",
    accept: ["sword"],
    description: "Только меч • широкий летящий взмах.",
  },
  nova: {
    name: "Ледяное кольцо",
    kind: "skill",
    w: 1,
    h: 1,
    icon: "support",
    accept: ["staff", "sword", "bow"],
    description:
      "Универсальный • автоматическая волна вокруг героя. Можно назначить на Q.",
  },
  multi: {
    name: "Множественные снаряды",
    kind: "support",
    w: 1,
    h: 1,
    icon: "support",
    description: "В связанной цепочке умения: открывает улучшение +1 снаряд.",
  },
  haste: {
    name: "Ускорение",
    kind: "support",
    w: 1,
    h: 1,
    icon: "support",
    description: "В связанной цепочке умения: открывает улучшение скорости атак.",
  },
  pierce: {
    name: "Пробитие",
    kind: "support",
    w: 1,
    h: 1,
    icon: "support",
    description: "В связанной цепочке умения: открывает пробитие ещё одной цели.",
  },
  relic: {
    name: "Реликвия забытого культа",
    kind: "loot",
    w: 2,
    h: 2,
    icon: "relic",
  },
  coin: { name: "Древняя печать", kind: "loot", w: 1, h: 1, icon: "coin" },
  key: { name: "Ключ от костяных врат", kind: "key", w: 1, h: 2, icon: "key" },
};
for (const [type, name, armor] of [['shield','Щит стражника',2],['helmet','Басинет стражника',2],['gloves','Кожаные перчатки',1],['boots','Походные сапоги',1],['belt','Пояс искателя',1],['ring','Железное кольцо',1],['amulet','Серебряный амулет',1]]) {
  DEFS[type] = { name, kind:'armor', slot:type, w:['ring','amulet'].includes(type) ? 1 : 2, h:['ring','amulet','belt'].includes(type) ? 1 : 2, icon:type, armor, sockets:type === 'helmet' ? 2 : 1 };
}
for(const [type,name,extra] of [
 ['meteor','Метеорит',{accept:['staff'],hostWeapons:['staff'],description:'Посох • метеорит падает на цель, нанося урон по области.'}],
 ['rain','Дождь стрел',{accept:['bow'],hostWeapons:['bow'],duration:3,description:'Лук • обстреливает область в течение 3 секунд.'}],
 ['juggernaut','Джаггернаут',{accept:['sword'],hostWeapons:['sword'],duration:4,description:'Меч • вращающийся клинок на 4 секунды.'}],
 ['healing','Исцеление',{acceptSlots:['ring','amulet'],activeOnly:true,description:'Кольцо или амулет • активное лечение 35 здоровья.'}],
 ['blink','Скачок',{acceptSlots:['boots'],activeOnly:true,description:'Сапоги • активный скачок в направлении курсора.'}],
 ['duration','Длительность',{kind:'support',description:'Связанный камень: +25% длительности; открывает улучшения длительности.'}]
])DEFS[type]={kind:'skill',w:1,h:1,icon:'gem',name,...extra};
for(const [type,base,name,stats]of [
 ['warstaff','staff','Боевой посох',{damage:20,sockets:3}],
 ['longsword','sword','Длинный клинок',{damage:25,sockets:3}],
 ['hunterbow','bow','Лук охотника',{damage:22,sockets:4}],
 ['plate','armor','Усиленная броня',{armor:7,sockets:4}],
 ['swiftboots','boots','Сапоги следопыта',{armor:2,sockets:2,movement:0.08}],
 ['lifering','ring','Кольцо жизненной силы',{armor:2,sockets:1,healingBonus:0.25}]
])DEFS[type]={...DEFS[base],name,...stats};
for(const [type,def]of Object.entries(RAID_MAPS))DEFS[type]={kind:'map',w:1,h:1,icon:'map',...def};
export function acceptsGem(gear,gem){
 if(gem.kind==='support')return true;
 if(gem.acceptSlots)return gem.acceptSlots.includes(gear.slot||gear.kind);
 return !gem.hostWeapons||gem.hostWeapons.includes(gear.weapon);
}
let serial = 0;
export function item(type, rarity = 0) {
  const d = DEFS[type];
  return {
    id: `${Date.now().toString(36)}-${++serial}`,
    type,
    rarity,
    x: 0,
    y: 0,
    ...d,
    visualSprite: gearArt[d.slot||d.weapon||(d.kind==='armor'?'armor':type)]?.[serial%gearArt[d.slot||d.weapon||(d.kind==='armor'?'armor':type)].length],
    sockets: d.sockets ? Array(d.sockets).fill(null) : undefined,
    value: Math.round((d.kind === "loot" ? 30 : 15) * RARITIES[rarity].mult),
  };
}
// Temporary prototype economy: all merchant purchases are free. Resale values stay intact.
export function vendorPrice(_item) { return 0; }
export function grid(w = 12, h = 5) {
  return { w, h, items: [] };
}
export function fits(g, it, x, y, ignoreId) {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x + it.w <= g.w &&
    y + it.h <= g.h &&
    !g.items.some(
      (o) =>
        o.id !== ignoreId &&
        x < o.x + o.w &&
        x + it.w > o.x &&
        y < o.y + o.h &&
        y + it.h > o.y,
    )
  );
}
export function put(g, it, x, y) {
  if (x === undefined) {
    for (let yy = 0; yy < g.h; yy++)
      for (let xx = 0; xx < g.w; xx++)
        if (fits(g, it, xx, yy, it.id)) return put(g, it, xx, yy);
    return false;
  }
  if (!fits(g, it, x, y, it.id)) return false;
  const found = g.items.find((o) => o.id === it.id);
  if (found) {
    found.x = x;
    found.y = y;
  } else g.items.push({ ...it, x, y });
  return true;
}
export function move(from, to, id, x, y) {
  const it = from.items.find((i) => i.id === id);
  if (!it || !put(to, it, x, y)) return false;
  if (from !== to) from.items = from.items.filter((i) => i.id !== id);
  return true;
}
export function equippedSkills(equip) {
  return Object.values(equip)
    .filter(Boolean)
    .flatMap((gear) =>
      (gear.sockets || []).flatMap((gem, index) =>
        gem?.kind === "skill" && acceptsGem(gear,gem) && (gem.acceptSlots || gem.accept?.includes(equip.weapon?.weapon))
          ? [
              {
                ...gem,
                gear: gear.id,
                supports: linkedSupports(gear,index,gem.type),
              },
            ]
          : [],
      ),
    );
}
export function starter() {
  const weapon = item("staff");
  weapon.sockets = [item("fire"), item("multi"), item("haste")];
  const kit = { weapon, armor: item("armor"), helmet:item('helmet'), boots:item('boots') };
  for (const gear of Object.values(kit)) { gear.free = true; for (const gem of gear.sockets || []) if (gem) gem.free = true; }
  return kit;
}
export function newProfile() {
  const bag = grid();
  for (const t of ["nova", "haste", "pierce", "sword", "slash"])
    put(bag, item(t));
  return {
    version: 1,
    gold: 100,
    bag,
    stash: grid(10, 7),
    equipment: starter(),
    active: null,
    runs: 0,
    extractions: 0,
    inRaid: false,
  };
}
export function loseRaid(p) {
  p.bag = grid();
  p.equipment = { weapon: null, armor: null };
  p.active = null;
  p.activeSlots = [null,null,null,null];
  p.inRaid = false;
}
export function recoverProfile(raw) {
  try {
    const p = JSON.parse(raw);
    if (p.version !== 1 || !p.bag?.items || !p.stash?.items || !p.equipment)
      throw Error();
    if (p.inRaid) loseRaid(p);
    p.bag.w = Math.max(12, p.bag.w);
    for (const it of [...p.bag.items, ...p.stash.items, ...Object.values(p.equipment)]) {
      if (it && (it.slot === "amulet" || it.type === "amulet")) { it.w = 1; it.h = 1; }
    }
    return p;
  } catch {
    return newProfile();
  }
}
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function generateDungeon(seed) {
  const random=rng(seed),w=248,h=206,tiles=Array.from({length:h},()=>Array(w).fill(0)),rooms=[],paths=[];
  const carve=(x,y)=>{if(x>1&&y>1&&x<w-2&&y<h-2)tiles[y][x]=1;};
  // Clearings form districts of an abandoned village, connected by winding woodland paths.
  for(let row=0;row<6;row++)for(let col=0;col<8;col++){
    const rw=22+Math.floor(random()*6),rh=22+Math.floor(random()*7);
    const x=3+col*30+Math.floor(random()*3),y=4+row*33+Math.floor(random()*3);
    const theme=Math.floor(random()*5),phase=random()*6.28,mirror=random()<.5?-1:1;
    const r={x,y,w:rw,h:rh,cx:x+Math.floor(rw/2),cy:y+Math.floor(rh/2),theme,mirror,wing:row*8+col};rooms.push(r);
    for(let yy=y;yy<y+rh;yy++)for(let xx=x;xx<x+rw;xx++){
      const nx=(xx-r.cx)/(rw/2),ny=(yy-r.cy)/(rh/2),angle=Math.atan2(ny,nx);
      if(Math.hypot(nx,ny)<.9+Math.sin(angle*3+phase)*.06+Math.cos(angle*5-phase)*.04)carve(xx,yy);
    }
  }
  rooms.sort((a,b)=>Math.hypot(a.cx-w/2,a.cy-h/2)-Math.hypot(b.cx-w/2,b.cy-h/2));rooms[0].theme=0;
  const edges=[],joined=new Set([0]);
  while(joined.size<rooms.length){let best=null;for(const a of joined)for(let b=0;b<rooms.length;b++)if(!joined.has(b)){const d=Math.hypot(rooms[a].cx-rooms[b].cx,rooms[a].cy-rooms[b].cy);if(!best||d<best.d)best={a,b,d};}edges.push([best.a,best.b]);joined.add(best.b);}
  for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++){const a=rooms[i].wing,b=rooms[j].wing,adjacent=Math.abs(a-b)===8||Math.floor(a/8)===Math.floor(b/8)&&Math.abs(a-b)===1;if(adjacent&&random()<.3&&!edges.some(([u,v])=>u===i&&v===j||u===j&&v===i))edges.push([i,j]);}
  for(const [a,b]of edges){const p=rooms[a],q=rooms[b],dx=q.cx-p.cx,dy=q.cy-p.cy,len=Math.hypot(dx,dy),bend=(random()-.5)*12,points=[];
    for(let n=0;n<=Math.ceil(len*2);n++){const t=n/Math.ceil(len*2),offset=Math.sin(t*Math.PI)*bend,x=p.cx+dx*t-dy/len*offset,y=p.cy+dy*t+dx/len*offset;points.push([x*32+16,y*32+16]);for(let sy=-3;sy<=3;sy++)for(let sx=-3;sx<=3;sx++)if(sx*sx+sy*sy<=11)carve(Math.round(x)+sx,Math.round(y)+sy);}
    paths.push(points);
  }
  return {w,h,tiles,rooms,edges,paths,seed,biome:'autumn-ruins'};
}
  export function flowField(map, x, y) {
  const dist = Array.from({ length: map.h }, () => Array(map.w).fill(Infinity)),
    q = [[x, y]];
  if (!map.tiles[y]?.[x]) return dist;
  dist[y][x] = 0;
  for (let i = 0; i < q.length; i++) {
    const [cx, cy] = q[i];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const xx = cx + dx,
        yy = cy + dy;
      if (map.tiles[yy]?.[xx] && dist[yy][xx] === Infinity && (!map.links || map.links[cy][cx].some(([x,y])=>x===xx&&y===yy))) {
        dist[yy][xx] = dist[cy][cx] + 1;
        q.push([xx, yy]);
      }
    }
  }
  return dist;
}
export function rollLoot(random = Math.random) {
  const types = [
    "staff",
    "sword",
    "bow",
    "armor",
    "fire",
    "arrow",
    "slash",
    "nova",
    "multi",
    "haste",
    "pierce", "meteor", "rain", "juggernaut", "healing", "blink", "duration", "warstaff", "longsword", "hunterbow", "plate", "swiftboots", "lifering",
    "helmet", "gloves", "boots", "belt", "ring", "amulet", "relic",
    "coin",
  ];
  const r = random();
  const result = item(
    types[Math.floor(random() * types.length)],
    r > 0.97 ? 3 : r > 0.8 ? 2 : r > 0.45 ? 1 : 0,
  );
  if(result.sockets){const max=Math.min(6,result.w*result.h);const count=Math.max(1,Math.min(max,result.sockets.length+Math.floor(random()*3)-1));result.sockets=Array(count).fill(null);result.links=Array.from({length:count-1},()=>random()<.75);if(result.damage)result.damage=Math.round(result.damage*(.85+random()*.3));if(result.armor)result.armor+=Math.floor(random()*3);}
  return result;
}
export function upgradeOptions(skills) {
  const out = [
    {
      id: "power",
      name: "Разгорающийся огонь",
      text: "+20% урона всех умений",
      icon: "✧",
    },
    {
      id: "vitality",
      name: "Воля к жизни",
      text: "+25 максимального здоровья и лечение",
      icon: "♡",
    },
    {
      id: "speed",
      name: "Лёгкая поступь",
      text: "+8% скорости передвижения",
      icon: "↟",
    },
  ];
  for (const skill of skills)
    for (const support of new Set(skill.supports)) {
      const names = {
        multi: ["Эхо снаряда", "+1 снаряд"],
        haste: ["Ускоренный ритуал", "+18% скорости атак"],
        pierce: ["Сквозь кости", "+1 пробитая цель"],
        duration: ["Долгое эхо", "+25% длительности"],
      };
      out.push({
        id: support,
        skill: skill.id,
        name: names[support][0],
        text: `${skill.name}: ${names[support][1]}`,
        icon: "◇",
      });
    }
  return out;
}
