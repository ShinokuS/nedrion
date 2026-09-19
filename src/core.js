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
    description: "Рядом с камнем умения: открывает улучшение +1 снаряд.",
  },
  haste: {
    name: "Ускорение",
    kind: "support",
    w: 1,
    h: 1,
    icon: "support",
    description: "Рядом с камнем умения: открывает улучшение скорости атак.",
  },
  pierce: {
    name: "Пробитие",
    kind: "support",
    w: 1,
    h: 1,
    icon: "support",
    description: "Рядом с камнем умения: открывает пробитие ещё одной цели.",
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
  DEFS[type] = { name, kind:'armor', slot:type, w:type === 'ring' ? 1 : 2, h:type === 'ring' || type === 'belt' ? 1 : 2, icon:type, armor, sockets:type === 'helmet' ? 2 : 1 };
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
    sockets: d.sockets ? Array(d.sockets).fill(null) : undefined,
    value: Math.round((d.kind === "loot" ? 30 : 15) * RARITIES[rarity].mult),
  };
}
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
        gem?.kind === "skill" && gem.accept.includes(equip.weapon?.weapon)
          ? [
              {
                ...gem,
                gear: gear.id,
                supports: [gear.sockets[index - 1], gear.sockets[index + 1]]
                  .filter(
                    (g) =>
                      g?.kind === "support" &&
                      (gem.type !== "nova" || g.type === "haste"),
                  )
                  .map((g) => g.type),
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
  p.inRaid = false;
}
export function recoverProfile(raw) {
  try {
    const p = JSON.parse(raw);
    if (p.version !== 1 || !p.bag?.items || !p.stash?.items || !p.equipment)
      throw Error();
    if (p.inRaid) loseRaid(p);
    p.bag.w = Math.max(12, p.bag.w);
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
  const random = rng(seed), w = 160, h = 120;
  const tiles = Array.from({length:h},()=>Array(w).fill(0)), rooms=[];
  const carve=(x,y)=>{if(x>1&&y>1&&x<w-2&&y<h-2)tiles[y][x]=1;};
  for(let attempt=0;attempt<1500&&rooms.length<28;attempt++){
    const rw=10+Math.floor(random()*13),rh=9+Math.floor(random()*11);
    const x=8+Math.floor(random()*(w-rw-16)),y=8+Math.floor(random()*(h-rh-16));
    if(rooms.some(r=>x<r.x+r.w+5&&x+rw+5>r.x&&y<r.y+r.h+5&&y+rh+5>r.y))continue;
    const shape=Math.floor(random()*3);
    const r={x,y,w:rw,h:rh,cx:x+Math.floor(rw/2),cy:y+Math.floor(rh/2),theme:rooms.length%5,shape};
    for(let yy=y;yy<y+rh;yy++)for(let xx=x;xx<x+rw;xx++){
      const corner=(xx<x+2||xx>=x+rw-2)&&(yy<y+2||yy>=y+rh-2);
      const alcove=shape===2&&xx>x+Math.floor(rw/2)+2&&yy<y+Math.floor(rh/2)-2;
      if((shape===0||!corner)&&!alcove)carve(xx,yy);
    }
    rooms.push(r);
  }
  rooms.sort((a,b)=>Math.hypot(a.cx-w/2,a.cy-h/2)-Math.hypot(b.cx-w/2,b.cy-h/2));
  const edges=[],joined=new Set([0]);
  while(joined.size<rooms.length){
    let best=null;
    for(const a of joined)for(let b=0;b<rooms.length;b++)if(!joined.has(b)){
      const d=Math.hypot(rooms[a].cx-rooms[b].cx,rooms[a].cy-rooms[b].cy);
      if(!best||d<best.d)best={a,b,d};
    }
    edges.push([best.a,best.b]);joined.add(best.b);
  }
  // Extra connections create loops and alternative routes rather than a single chain.
  for(let i=0;i<rooms.length;i++)if(random()<.4){
    const nearest=rooms.map((r,j)=>({j,d:Math.hypot(r.cx-rooms[i].cx,r.cy-rooms[i].cy)})).filter(v=>v.j!==i&&!edges.some(([a,b])=>a===i&&b===v.j||b===i&&a===v.j)).sort((a,b)=>a.d-b.d)[0];
    if(nearest)edges.push([i,nearest.j]);
  }
  for(const [a,b] of edges){
    let x=rooms[a].cx,y=rooms[a].cy;const dest=rooms[b],horizontal=random()<.5,width=random()<.3?2:1;
    const step=(axis)=>{while(axis==='x'?x!==dest.cx:y!==dest.cy){if(axis==='x')x+=Math.sign(dest.cx-x);else y+=Math.sign(dest.cy-y);for(let d=-width;d<=width;d++)carve(x+(axis==='y'?d:0),y+(axis==='x'?d:0));}};
    step(horizontal?'x':'y');step(horizontal?'y':'x');
  }
  return {w,h,tiles,rooms,edges,seed};
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
      if (map.tiles[yy]?.[xx] && dist[yy][xx] === Infinity) {
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
    "pierce",
    "helmet", "gloves", "boots", "belt", "ring", "amulet", "relic",
    "coin",
  ];
  const r = random();
  return item(
    types[Math.floor(random() * types.length)],
    r > 0.97 ? 3 : r > 0.8 ? 2 : r > 0.45 ? 1 : 0,
  );
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
