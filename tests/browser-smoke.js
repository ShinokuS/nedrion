// Development-only integration tests. Uses the real Phaser scene and real DOM handlers.
// Each scenario starts with a fresh profile; the original browser save is restored.
import {
  state,
  save,
  renderHUD,
  openPanel,
  closePanel,
  finishRaid,
} from "../src/main.js";
import { newProfile, grid, item, put } from "../src/core.js";

const output = document.createElement("pre");
output.id = "smoke-results";
output.style.cssText =
  "position:fixed;inset:15px;z-index:1000;background:#102018;color:#ddf4dd;padding:24px;overflow:auto;white-space:pre-wrap;font:14px monospace";
document.body.append(output);
const results = [];
const assert = (condition, label) => {
  if (!condition) throw Error(label);
};
const test = (name, fn) => {
  try {
    fn();
    results.push(`PASS ${name}`);
  } catch (e) {
    results.push(`FAIL ${name}: ${e.message}`);
    console.error(e);
  }
  output.textContent = results.join("\n");
};
while (!state.scene?.hero) await new Promise((r) => setTimeout(r, 50));
const original = structuredClone(state.profile),
  s = state.scene;
s.game.loop.sleep();
function fresh() {
  state.panel = null;
  document.querySelector("#modal-root").innerHTML = "";
  state.profile = newProfile();
  state.profile.inRaid = true;
  state.mode = "raid";
  s.startRaid();
  s.spawnTime = 999;
  s.invincible = 999;
  renderHUD();
}
const tick = (n = 1) => {
  for (let i = 0; i < n; i++) s.update(0, 50);
};
try {
  test("three exit gates and ordered rune puzzle", () => {
    fresh();
    assert(
      !s.exitReady(0) && !s.exitReady(1) && !s.exitReady(2),
      "gates start locked",
    );
    const runes = s.objects.filter((o) => o.type === "rune");
    s.interact(runes[1]);
    assert(s.runes === 0, "out-of-order rune rejected");
    runes.forEach((r) => s.interact(r));
    assert(s.exitReady(1), "rune gate opens");
    put(state.profile.bag, item("key"));
    assert(s.exitReady(0), "key gate opens");
    s.kills = 35;
    assert(s.exitReady(2), "kill gate opens");
  });
  test("container reveals one item at a time; taking one cannot reveal the next", () => {
    fresh();
    const c = s.objects.find((o) => o.type === "container");
    c.grid = grid(5, 4);
    put(c.grid, item("coin"));
    put(c.grid, item("relic"));
    s.hero.setPosition(c.x, c.y);
    s.interact(c);
    tick(19);
    assert(c.revealed === 1, "one reveal after 0.9 seconds");
    const buttons = document.querySelectorAll("#container-grid .grid-item");
    assert(
      buttons.length === 2 && !buttons[0].disabled && buttons[1].disabled,
      "hidden item disabled",
    );
    buttons[0].dispatchEvent(new MouseEvent("dblclick"));
    assert(
      c.grid.items.length === 1 && c.revealed === 0,
      "removing revealed item preserves unrevealed state",
    );
    assert(
      document.querySelector("#container-grid .grid-item").disabled,
      "next item still hidden",
    );
    tick(19);
    assert(c.revealed === 1, "second item eventually reveals");
    closePanel();
  });
  test("automatic combat produces projectiles, kills enemies, and awards XP", () => {
    fresh();
    const e = s.add.sprite(s.hero.x + 70, s.hero.y, "skeleton-0");
    s.enemies.push({ sprite: e, hp: 1, maxHP: 1, speed: 0, hit: 0 });
    tick(12);
    assert(s.kills === 1, "projectile kills enemy");
    tick(20);
    assert(s.xp > 0, "nearby XP collected");
  });
  test("level-up offers support-dependent choices and applies selected upgrade", () => {
    fresh();
    s.xp = 10;
    tick();
    assert(state.panel === "level", "level modal opens");
    const choices = [...document.querySelectorAll("[data-upgrade]")];
    assert(choices.length === 3, "three choices");
    assert(
      choices[0].textContent.includes("Эхо снаряда"),
      "linked support offered",
    );
    choices[0].click();
    assert(state.panel === null, "choice resumes game");
    assert(
      Object.values(s.skillBonuses)[0].multi === 1,
      "projectile modifier applied",
    );
  });
  test("movement interrupts extraction; stationary channel returns loot safely", () => {
    fresh();
    s.kills = 35;
    const exit = s.objects.find((o) => o.exitType === 2);
    s.hero.setPosition(exit.x, exit.y);
    s.interact(exit);
    s.keys.D.isDown = true;
    tick();
    s.keys.D.isDown = false;
    assert(s.extraction === null, "movement cancels");
    s.hero.setPosition(exit.x, exit.y);
    s.interact(exit);
    tick(62);
    assert(
      state.mode === "result" && state.profile.extractions === 1,
      "successful extraction",
    );
    assert(
      state.profile.equipment.weapon && state.profile.bag.items.length > 0,
      "gear and inventory retained",
    );
    assert(state.profile.inRaid === false, "saved as safe");
  });
  test("removing required key interrupts extraction", () => {
    fresh();
    put(state.profile.bag, item("key"));
    const exit = s.objects.find((o) => o.exitType === 0);
    s.hero.setPosition(exit.x, exit.y);
    s.interact(exit);
    state.profile.bag.items = state.profile.bag.items.filter(
      (i) => i.type !== "key",
    );
    tick();
    assert(s.extraction === null, "key must remain present");
  });
  test("collapse damages outside safe zone, death preserves stash, recovery kit works", () => {
    fresh();
    put(state.profile.stash, item("relic", 3));
    const stashId = state.profile.stash.items[0].id;
    const far = s.map.rooms[11];
    s.hero.setPosition(far.cx * 32 + 16, far.cy * 32 + 16);
    s.elapsed = 400;
    s.hp = 1;
    s.invincible = 0;
    tick();
    assert(state.mode === "result", "zone causes death");
    assert(
      state.profile.bag.items.length === 0 && !state.profile.equipment.weapon,
      "carried equipment lost",
    );
    assert(state.profile.stash.items[0].id === stashId, "stash preserved");
    document.querySelector("#return").click();
    openPanel("vendor");
    document.querySelector("#free-kit").click();
    assert(
      state.profile.equipment.weapon?.sockets[0]?.type === "fire",
      "functional free weapon and skill",
    );
    assert(state.profile.gold === 100, "free kit does not charge currency");
    closePanel();
  });
  test("stash transfer and vendor purchase/sale preserve inventory accounting", () => {
    fresh();
    state.mode = "hub";
    s.startHub();
    openPanel("stash");
    const first = state.profile.bag.items[0].id;
    document
      .querySelector("#bag-grid .grid-item")
      .dispatchEvent(new MouseEvent("dblclick"));
    assert(
      state.profile.stash.items.some((i) => i.id === first) &&
        !state.profile.bag.items.some((i) => i.id === first),
      "stash transfer unique",
    );
    closePanel();
    openPanel("vendor");
    document.querySelector('[data-buy="fire"]').click();
    assert(state.profile.gold === 75, "purchase charged");
    const bought = state.profile.bag.items.at(-1);
    document.querySelector(`[data-sell="${bought.id}"]`).click();
    assert(state.profile.gold === 75 + bought.value, "sale credited");
    assert(
      !state.profile.bag.items.some((i) => i.id === bought.id),
      "sold item removed",
    );
    closePanel();
  });
} finally {
  state.profile = original;
  state.mode = "hub";
  state.panel = null;
  document.querySelector("#modal-root").innerHTML = "";
  s.startHub();
  save();
  renderHUD();
  s.game.loop.wake();
  output.textContent =
    results.join("\n") +
    `\n\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} PASSED. Original save restored.`;
}
