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
export function grid(w = 8, h = 5) {
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
  return { weapon, armor: item("armor") };
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
  const random = rng(seed),
    w = 76,
    h = 58,
    tiles = Array.from({ length: h }, () => Array(w).fill(0)),
    rooms = [];
  const carve = (x, y) => {
    if (x > 0 && y > 0 && x < w - 1 && y < h - 1) tiles[y][x] = 1;
  };
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 4; col++) {
      const rw = 10 + Math.floor(random() * 5),
        rh = 9 + Math.floor(random() * 4),
        x = 3 + col * 18 + Math.floor(random() * 3),
        y = 3 + row * 18 + Math.floor(random() * 3);
      const room = {
        x,
        y,
        w: rw,
        h: rh,
        cx: x + Math.floor(rw / 2),
        cy: y + Math.floor(rh / 2),
      };
      for (let yy = y; yy < y + rh; yy++)
        for (let xx = x; xx < x + rw; xx++) carve(xx, yy);
      if (rooms.length) {
        const prev = rooms.reduce((a, b) =>
          Math.hypot(a.cx - room.cx, a.cy - room.cy) <
          Math.hypot(b.cx - room.cx, b.cy - room.cy)
            ? a
            : b,
        );
        let xx = prev.cx,
          yy = prev.cy;
        while (xx !== room.cx) {
          xx += Math.sign(room.cx - xx);
          for (let d = -1; d <= 1; d++) carve(xx, yy + d);
        }
        while (yy !== room.cy) {
          yy += Math.sign(room.cy - yy);
          for (let d = -1; d <= 1; d++) carve(xx + d, yy);
        }
      }
      rooms.push(room);
    }
  return { w, h, tiles, rooms, seed };
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
    "relic",
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
