import { test } from "node:test";
import assert from "node:assert/strict";
import {
  grid,
  item,
  put,
  move,
  fits,
  starter,
  equippedSkills,
  generateDungeon,
  flowField,
  newProfile,
  recoverProfile,
  loseRaid,
  upgradeOptions,
} from "../src/core.js";

test("grid rejects overlap and out-of-bounds placement", () => {
  const g = grid(3, 3),
    a = item("armor");
  assert.equal(put(g, a, 0, 0), true);
  assert.equal(put(g, item("sword"), 1, 0), false);
  assert.equal(put(g, item("coin"), 3, 0), false);
  assert.equal(put(g, item("coin"), -1, 0), false);
  assert.equal(fits(g, a, 0.5, 0), false);
  assert.equal(put(g, item("sword"), 2, 0), true);
});
test("failed transfer is atomic; successful transfer does not duplicate", () => {
  const a = grid(2, 3),
    b = grid(2, 3),
    s = item("sword");
  put(a, s);
  put(b, item("armor"));
  assert.equal(move(a, b, s.id), false);
  assert.equal(a.items.length, 1);
  assert.equal(b.items.length, 1);
  b.items = [];
  assert.equal(move(a, b, s.id), true);
  assert.equal(a.items.length, 0);
  assert.equal(b.items.length, 1);
  assert.equal(move(a, b, s.id), false);
});
test("within-grid move preserves exactly one item", () => {
  const g = grid(),
    s = item("sword");
  put(g, s);
  assert.equal(move(g, g, s.id, 5, 0), true);
  assert.equal(g.items.length, 1);
  assert.equal(g.items[0].x, 5);
});
test("only adjacent supports are linked and weapon compatibility is enforced", () => {
  const eq = starter();
  assert.deepEqual(equippedSkills(eq)[0].supports, ["multi"]);
  eq.weapon.sockets = [item("haste"), item("fire"), item("pierce")];
  assert.deepEqual(equippedSkills(eq)[0].supports, ["haste", "pierce"]);
  eq.weapon.sockets[1] = item("arrow");
  assert.equal(equippedSkills(eq).length, 0);
  eq.weapon.weapon = "bow";
  assert.equal(equippedSkills(eq).length, 1);
});
test("level choices are determined by linked supports", () => {
  const choices = upgradeOptions(equippedSkills(starter()));
  assert.ok(choices.some((o) => o.id === "multi"));
  assert.ok(!choices.some((o) => o.id === "haste"));
});
test("100 procedural seeds have connected, reachable rooms", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const m = generateDungeon(seed),
      r = m.rooms[0],
      field = flowField(m, r.cx, r.cy);
    assert.equal(m.rooms.length, 12);
    for (const room of m.rooms)
      assert.ok(Number.isFinite(field[room.cy][room.cx]), `seed ${seed}`);
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++)
        if (m.tiles[y][x]) assert.ok(Number.isFinite(field[y][x]));
  }
});
test("generation is reproducible with a seed and varies across seeds", () => {
  assert.deepEqual(generateDungeon(42), generateDungeon(42));
  assert.notDeepEqual(generateDungeon(42).tiles, generateDungeon(43).tiles);
});
test("death loses bag, equipment, gems, active skill but preserves stash and gold", () => {
  const p = newProfile();
  put(p.stash, item("relic", 3));
  p.active = "test";
  p.inRaid = true;
  const stash = structuredClone(p.stash);
  loseRaid(p);
  assert.equal(p.bag.items.length, 0);
  assert.equal(p.equipment.weapon, null);
  assert.equal(p.equipment.armor, null);
  assert.equal(p.active, null);
  assert.deepEqual(p.stash, stash);
  assert.equal(p.gold, 100);
  assert.equal(p.inRaid, false);
});
test("reload during raid applies loss, safe saves round-trip", () => {
  const p = newProfile();
  assert.deepEqual(
    recoverProfile(JSON.stringify(p)),
    JSON.parse(JSON.stringify(p)),
  );
  p.inRaid = true;
  assert.equal(recoverProfile(JSON.stringify(p)).equipment.weapon, null);
  assert.equal(recoverProfile("broken").version, 1);
});
