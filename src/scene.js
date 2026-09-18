import Phaser from "phaser";
import {
  state,
  openPanel,
  isPaused,
  toast,
  updateSearch,
  showLevel,
  finishRaid,
} from "./main.js";
import {
  generateDungeon,
  flowField,
  rng,
  grid,
  put,
  item,
  rollLoot,
  equippedSkills,
  upgradeOptions,
  RARITIES,
} from "./core.js";

const T = 32,
  RAID_TIME = 210;
export class RaidScene extends Phaser.Scene {
  constructor() {
    super("world");
  }
  preload() {
    const counts = {
      hero: 6,
      skeleton: 7,
      zombie: 8,
      torch: 4,
      chest: 1,
      stash: 1,
      trader: 1,
      barrel: 1,
    };
    for (const [key, count] of Object.entries(counts))
      for (let n = 0; n < count; n++)
        this.load.image(
          `${key}-${n}`,
          `${import.meta.env.BASE_URL}assets/${key}-${n}.png`,
        );
  }
  create() {
    state.scene = this;
    for (const [key, count] of Object.entries({
      hero: 6,
      skeleton: 7,
      zombie: 8,
      torch: 4,
    }))
      this.anims.create({
        key,
        frames: Array.from({ length: count }, (_, n) => ({
          key: `${key}-${n}`,
        })),
        frameRate: key === "torch" ? 9 : 7,
        repeat: -1,
      });
    this.keys = this.input.keyboard.addKeys(
      "W,A,S,D,E,Q,SPACE,UP,DOWN,LEFT,RIGHT",
    );
    this.input.keyboard.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT"]);
    this.scale.on("resize", () => this.resize());
    this.startHub();
  }
  resetWorld() {
    this.cameras.main.stopFollow();
    this.tweens.killAll();
    this.children.removeAll(true);
    this.enemies = [];
    this.bullets = [];
    this.drops = [];
    this.objects = [];
    this.decor = [];
    this.clock = 0;
    this.elapsed = 0;
    this.flowTime = 0;
    this.spawnTime = 4;
    this.hudTime = 0;
    this.shotTimes = {};
    this.bonuses = { power: 1, speed: 1 };
    this.skillBonuses = {};
    this.extraction = null;
    this.lastDirection = { x: 0, y: 1 };
    this.dashCooldown = 0;
    this.qCooldown = 0;
    this.dashDuration = 0;
    this.invincible = 0;
    this.discovered = new Set();
    this.runes = 0;
    this.hp = 100;
    this.maxHP = 100;
    this.xp = 0;
    this.level = 1;
    this.kills = 0;
    this.wave = 1;
    this.zoneRadius = Infinity;
    this.textStyle = {
      fontFamily: "Georgia",
      fontSize: "12px",
      color: "#c7c4af",
      stroke: "#101516",
      strokeThickness: 4,
    };
  }
  startHub() {
    this.resetWorld();
    this.map = {
      w: 34,
      h: 26,
      tiles: Array.from({ length: 26 }, (_, y) =>
        Array.from({ length: 34 }, (_, x) =>
          x > 2 && x < 31 && y > 3 && y < 23 ? 1 : 0,
        ),
      ),
      rooms: [],
    };
    this.drawMap(true);
    this.add.rectangle(544, 440, 150, 150, 0x5a4231, 0.25).setAngle(45);
    this.add.circle(544, 400, 60, 0xae692c, 0.08);
    this.add.circle(544, 400, 38, 0xe79739, 0.12);
    this.add
      .sprite(544, 396, "torch-0")
      .play("torch")
      .setScale(1.8)
      .setDepth(400);
    this.add
      .text(544, 467, "ПОСЛЕДНИЙ ОГОНЬ", {
        ...this.textStyle,
        fontSize: "11px",
        letterSpacing: 3,
      })
      .setOrigin(0.5);
    this.addObject("stash", 354, 382, "stash-0", "Тайник");
    this.addObject("vendor", 738, 386, "trader-0", "Торговец Рен");
    this.addObject("expedition", 545, 220, "hero-0", "Проводник");
    this.portal(545, 195, 0xa8c7aa);
    this.makeHero(540, 560);
    this.cameras.main.setBounds(0, 0, 1088, 832);
    this.cameras.main.centerOn(544, 424);
    this.addVignette();
    document.querySelector("#context").innerHTML = "";
  }
  startRaid() {
    this.resetWorld();
    this.seed = Date.now() & 0x7fffffff;
    this.random = rng(this.seed);
    this.map = generateDungeon(this.seed);
    this.drawMap(false);
    const rooms = this.map.rooms;
    for (let n = 0; n < rooms.length; n++) {
      const r = rooms[n],
        g = grid(5, 4);
      if (n === 5) put(g, item("key", 2));
      const count = 2 + Math.floor(this.random() * 3);
      for (let k = 0; k < count; k++) put(g, rollLoot(this.random));
      const o = this.addObject(
        "container",
        (r.x + 2) * T + 16,
        (r.y + 2) * T + 16,
        n % 3 === 1 ? "barrel-0" : "chest-0",
        n % 3 === 1 ? "Старая бочка" : "Забытый сундук",
      );
      Object.assign(o, { grid: g, revealed: 0, progress: 0 });
    }
    [2, 6, 9].forEach((n, i) => {
      const r = rooms[n],
        o = this.addObject(
          "rune",
          r.cx * T + 16,
          (r.cy + 2) * T + 16,
          null,
          `Руна ${["I", "II", "III"][i]}`,
        );
      o.order = i;
      this.add
        .circle(o.x, o.y, 18, 0x9e81c0, 0.2)
        .setStrokeStyle(1, 0xbfa2e4, 0.6);
      this.add
        .text(o.x, o.y, ["I", "II", "III"][i], {
          ...this.textStyle,
          fontSize: "22px",
          color: "#b9a0e0",
        })
        .setOrigin(0.5);
    });
    [8, 10, 11].forEach((n, i) => {
      const r = rooms[n],
        o = this.addObject(
          "exit",
          r.cx * T + 16,
          r.cy * T + 16,
          null,
          ["Костяные врата", "Рунный проход", "Путь охотника"][i],
        );
      o.exitType = i;
      this.portal(o.x, o.y, [0xe0bb65, 0xb39ae2, 0x85b99a][i]);
    });
    this.makeHero(rooms[0].cx * T + 16, rooms[0].cy * T + 16);
    this.cameras.main.setBounds(0, 0, this.map.w * T, this.map.h * T);
    this.cameras.main.startFollow(this.hero, true, 0.13, 0.13);
    this.zone = this.add.graphics().setDepth(7000);
    this.addVignette();
    toast("Найдите добычу и выход. До прихода тьмы — 3:30.");
  }
  drawMap(hub) {
    const g = this.add.graphics();
    const random = rng(hub ? 72 : this.seed);
    for (let y = 0; y < this.map.h; y++)
      for (let x = 0; x < this.map.w; x++) {
        if (this.map.tiles[y][x]) {
          const v = Math.floor(random() * 10);
          g.fillStyle(Phaser.Display.Color.GetColor(35 + v, 40 + v, 39 + v));
          g.fillRect(x * T, y * T, T - 1, T - 1);
          g.lineStyle(1, 0x535a50, 0.13);
          g.lineBetween(x * T + 2, y * T + 2, x * T + T - 3, y * T + 2);
          if (random() < 0.14) {
            g.lineStyle(1, 0x121a1c, 0.7);
            g.lineBetween(x * T + 8, y * T + 5, x * T + 12, y * T + 17);
            g.lineBetween(x * T + 12, y * T + 17, x * T + 23, y * T + 21);
          }
          if (random() < 0.04) {
            g.fillStyle(0x647355, 0.22);
            g.fillCircle(x * T + 10, y * T + 20, 5);
          }
        } else if (
          [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
          ].some(([dx, dy]) => this.map.tiles[y + dy]?.[x + dx])
        ) {
          g.fillStyle(0x464b46);
          g.fillRect(x * T, y * T, T, T);
          g.fillStyle(0x63675a, 0.4);
          g.fillRect(x * T + 1, y * T + 1, T - 2, 4);
          g.fillStyle(0x181f20);
          g.fillRect(x * T, y * T + T - 6, T, 6);
          g.lineStyle(1, 0x111819);
          g.strokeRect(x * T, y * T, T, T);
        }
      }
    if (hub) {
      for (const [x, y] of [
        [288, 240],
        [800, 240],
        [288, 640],
        [800, 640],
      ])
        this.torch(x, y);
    } else
      for (const r of this.map.rooms) {
        this.torch((r.x + 1) * T + 16, (r.y + 1) * T + 16);
        if (random() > 0.3)
          this.torch((r.x + r.w - 2) * T + 16, (r.y + r.h - 2) * T + 16);
        for (let n = 0; n < 3; n++) {
          const x = (r.x + 2 + random() * (r.w - 4)) * T,
            y = (r.y + 2 + random() * (r.h - 4)) * T;
          g.fillStyle(0x969789, 0.3);
          g.fillRect(x, y, 4, 3);
          g.fillRect(x + 6, y + 5, 2, 5);
        }
      }
  }
  torch(x, y) {
    for (let i = 3; i > 0; i--)
      this.add.circle(x, y - 8, i * 24, 0xf1a044, 0.025);
    this.add
      .sprite(x, y, "torch-0")
      .play("torch")
      .setOrigin(0.5, 0.8)
      .setDepth(y);
  }
  portal(x, y, color) {
    this.add
      .ellipse(x, y + 12, 82, 38, color, 0.1)
      .setStrokeStyle(1, color, 0.5);
    const e = this.add
      .ellipse(x, y - 12, 42, 65, color, 0.16)
      .setStrokeStyle(2, color, 0.75);
    this.tweens.add({
      targets: e,
      alpha: 0.4,
      scaleX: 0.85,
      duration: 1600,
      yoyo: true,
      repeat: -1,
    });
    this.add
      .text(x, y - 17, "◇", {
        ...this.textStyle,
        fontSize: "30px",
        color: "#cfdfcc",
      })
      .setOrigin(0.5);
  }
  makeHero(x, y) {
    this.shadow = this.add.ellipse(x, y + 11, 30, 12, 0x000000, 0.4);
    this.hero = this.add.sprite(x, y, "hero-0").play("hero").setScale(1.2);
    this.heroLight = this.add.circle(x, y, 38, 0xe4c478, 0.035);
    this.hero.setDepth(y + 20);
    this.heroRing = this.add
      .ellipse(x, y + 13, 35, 15)
      .setStrokeStyle(1, 0xc2b77d, 0.7);
  }
  addObject(type, x, y, texture, label) {
    const o = { type, x, y, label };
    if (texture)
      o.sprite = this.add
        .image(x, y, texture)
        .setOrigin(0.5, 0.8)
        .setDepth(y)
        .setScale(texture === "chest-0" ? 0.8 : 1.3);
    o.label = this.add
      .text(x, y + 29, label, { ...this.textStyle, fontSize: "11px" })
      .setOrigin(0.5)
      .setAlpha(0.7);
    this.objects.push(o);
    return o;
  }
  addVignette() {
    if (!this.textures.exists("vignette")) {
      const t = this.textures.createCanvas("vignette", 512, 512),
        c = t.context,
        grad = c.createRadialGradient(256, 256, 85, 256, 256, 330);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(3,9,12,.78)");
      c.fillStyle = grad;
      c.fillRect(0, 0, 512, 512);
      t.refresh();
    }
    this.vignette = this.add
      .image(0, 0, "vignette")
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(8000);
    this.resize();
  }
  resize() {
    this.vignette?.setDisplaySize(this.scale.width, this.scale.height);
    if (state.mode === "hub") this.cameras.main.centerOn(544, 424);
  }
  canWalk(x, y, r = 10) {
    return [
      [-r, -r],
      [r, -r],
      [-r, r],
      [r, r],
    ].every(
      ([dx, dy]) =>
        this.map.tiles[Math.floor((y + dy) / T)]?.[Math.floor((x + dx) / T)],
    );
  }
  moveBody(body, dx, dy, r = 10) {
    if (this.canWalk(body.x + dx, body.y, r)) body.x += dx;
    if (this.canWalk(body.x, body.y + dy, r)) body.y += dy;
  }
  update(_, delta) {
    if (!this.hero || state.mode === "result" || isPaused()) return;
    const dt = Math.min(delta / 1000, 0.05);
    this.clock += dt;
    const raid = state.mode === "raid";
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.qCooldown = Math.max(0, this.qCooldown - dt);
    this.invincible = Math.max(0, this.invincible - dt);
    let dx =
        (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) -
        (this.keys.A.isDown || this.keys.LEFT.isDown ? 1 : 0),
      dy =
        (this.keys.S.isDown || this.keys.DOWN.isDown ? 1 : 0) -
        (this.keys.W.isDown || this.keys.UP.isDown ? 1 : 0);
    const len = Math.hypot(dx, dy);
    if (len) {
      dx /= len;
      dy /= len;
      this.lastDirection = { x: dx, y: dy };
    }
    if (
      raid &&
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) &&
      this.dashCooldown === 0
    ) {
      this.dashDuration = 0.17;
      this.dashCooldown = 4;
      this.invincible = 0.3;
    }
    const speed = raid ? 185 * this.bonuses.speed : 165;
    if (this.dashDuration > 0) {
      this.dashDuration -= dt;
      dx = this.lastDirection.x;
      dy = this.lastDirection.y;
      this.moveBody(this.hero, dx * speed * 3 * dt, dy * speed * 3 * dt);
    } else this.moveBody(this.hero, dx * speed * dt, dy * speed * dt);
    this.hero.setDepth(this.hero.y + 20).setFlipX(dx < 0);
    this.hero.setTint(this.invincible > 0 ? 0xf4ce83 : 0xffffff);
    this.shadow
      .setPosition(this.hero.x, this.hero.y + 17)
      .setDepth(this.hero.y - 1);
    this.heroRing
      .setPosition(this.hero.x, this.hero.y + 18)
      .setDepth(this.hero.y);
    this.heroLight.setPosition(this.hero.x, this.hero.y).setDepth(1);
    const nearby = this.objects
      .filter((o) => Math.hypot(o.x - this.hero.x, o.y - this.hero.y) < 76)
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(this.hero.x, this.hero.y, a.x, a.y) -
          Phaser.Math.Distance.Between(this.hero.x, this.hero.y, b.x, b.y),
      )[0];
    document.querySelector("#context").innerHTML = this.extraction
      ? `<div class="interaction">Эвакуация · ${Math.max(0, 3 - this.extraction.progress).toFixed(1)} с · не двигайтесь</div>`
      : nearby
        ? `<div class="interaction"><kbd>E</kbd> ${nearby.label.text}${nearby.type === "exit" ? " · " + this.exitCondition(nearby.exitType) : ""}</div>`
        : "";
    if (nearby && !state.panel && Phaser.Input.Keyboard.JustDown(this.keys.E))
      this.interact(nearby);
    if (!raid) return;
    this.elapsed += dt;
    this.wave = 1 + Math.floor(this.elapsed / 25);
    for (let i = 0; i < this.map.rooms.length; i++) {
      const r = this.map.rooms[i];
      if (
        this.hero.x > r.x * T &&
        this.hero.x < (r.x + r.w) * T &&
        this.hero.y > r.y * T &&
        this.hero.y < (r.y + r.h) * T
      )
        this.discovered.add(i);
    }
    if (state.panel === "container" && state.search) {
      const c = state.search;
      if (Math.hypot(c.x - this.hero.x, c.y - this.hero.y) > 100) {
        state.panel = null;
        document.querySelector("#modal-root").innerHTML = "";
      } else if (c.revealed < c.grid.items.length) {
        c.progress += dt;
        if (c.progress >= 0.9) {
          c.progress = 0;
          c.revealed++;
          updateSearch();
        }
      }
    }
    this.flowTime -= dt;
    if (this.flowTime <= 0) {
      this.flowTime = 0.5;
      this.flow = flowField(
        this.map,
        Math.floor(this.hero.x / T),
        Math.floor(this.hero.y / T),
      );
    }
    this.spawnTime -= dt;
    if (this.spawnTime <= 0) {
      this.spawnTime = Math.max(0.35, 2.3 - this.elapsed / 110);
      for (let n = 0; n < 2 + Math.floor(this.wave / 3); n++) this.spawnEnemy();
    }
    this.updateEnemies(dt);
    if (state.mode !== "raid") return;
    this.updateCombat(dt);
    this.updateDrops(dt);
    if (this.elapsed > RAID_TIME) {
      this.zoneRadius = Math.max(0, 1800 - (this.elapsed - RAID_TIME) * 13);
      const c = this.map.rooms[0],
        cx = c.cx * T + 16,
        cy = c.cy * T + 16;
      this.zone.clear();
      this.zone.lineStyle(5, 0xb84675, 0.8);
      this.zone.strokeCircle(cx, cy, this.zoneRadius);
      if (Math.hypot(this.hero.x - cx, this.hero.y - cy) > this.zoneRadius) {
        this.extraction = null;
        this.hp -= dt * (10 + (this.elapsed - RAID_TIME) * 0.13);
        this.vignette.setTint(0xed6f86);
        if (this.hp <= 0) {
          finishRaid(false);
          return;
        }
      } else this.vignette.clearTint();
    }
    if (this.extraction) {
      if (
        !this.exitReady(this.extraction.exit.exitType) ||
        len ||
        Math.hypot(
          this.hero.x - this.extraction.exit.x,
          this.hero.y - this.extraction.exit.y,
        ) > 76
      )
        this.extraction = null;
      else {
        this.extraction.progress += dt;
        if (this.extraction.progress >= 3) {
          finishRaid(true);
          return;
        }
      }
    }
    if (this.xp >= this.level * 10 && !state.panel) {
      this.xp -= this.level * 10;
      this.level++;
      const options = upgradeOptions(equippedSkills(state.profile.equipment));
      const supported = options.filter((o) => o.skill),
        base = options.filter((o) => !o.skill);
      const choice = supported.length
        ? [
            supported[Math.floor(this.random() * supported.length)],
            ...base.sort(() => this.random() - 0.5).slice(0, 2),
          ]
        : base;
      showLevel(choice, (o) => {
        if (o.id === "power") this.bonuses.power += 0.2;
        else if (o.id === "vitality") {
          this.maxHP += 25;
          this.hp = Math.min(this.maxHP, this.hp + 45);
        } else if (o.id === "speed") this.bonuses.speed += 0.08;
        else {
          this.skillBonuses[o.skill] ??= { multi: 0, haste: 0, pierce: 0 };
          this.skillBonuses[o.skill][o.id]++;
        }
      });
    }
    this.hudTime -= dt;
    if (this.hudTime <= 0) {
      this.hudTime = 0.12;
      this.updateHUD();
    }
  }
  interact(o) {
    if (o.type === "container") {
      openPanel("container", o);
      return;
    }
    if (o.type === "rune") {
      if (o.order === this.runes) {
        this.runes++;
        o.label.setText("Руна активирована").setColor("#a4d8b4");
        toast(`Руна активирована: ${this.runes} / 3`);
      } else if (o.order > this.runes)
        toast("Древние знаки требуют порядка: I → II → III.");
      return;
    }
    if (o.type === "exit") {
      if (this.exitReady(o.exitType)) {
        this.extraction = { exit: o, progress: 0 };
        toast("Оставайтесь неподвижны 3 секунды.");
      } else toast(this.exitCondition(o.exitType));
      return;
    }
    openPanel(o.type);
  }
  exitReady(type) {
    return type === 0
      ? state.profile.bag.items.some((i) => i.type === "key")
      : type === 1
        ? this.runes === 3
        : this.kills >= 35;
  }
  exitCondition(type) {
    return type === 0
      ? this.exitReady(0)
        ? "Ключ найден"
        : "Нужен ключ в рюкзаке"
      : type === 1
        ? `Руны: ${this.runes} / 3`
        : `Враги: ${Math.min(35, this.kills)} / 35`;
  }
  spawnEnemy() {
    if (this.enemies.length >= 140) return;
    let x,
      y,
      found = false;
    for (let n = 0; n < 35; n++) {
      const a = this.random() * Math.PI * 2,
        d = 270 + this.random() * 230;
      x = this.hero.x + Math.cos(a) * d;
      y = this.hero.y + Math.sin(a) * d;
      if (this.canWalk(x, y, 11)) {
        found = true;
        break;
      }
    }
    if (!found) return;
    const zombie = this.random() < 0.4;
    const sprite = this.add
      .sprite(x, y, zombie ? "zombie-0" : "skeleton-0")
      .play(zombie ? "zombie" : "skeleton");
    sprite.setScale(zombie ? 1.15 : 1);
    this.enemies.push({
      sprite,
      hp: 22 + this.wave * 8,
      maxHP: 22 + this.wave * 8,
      speed: (zombie ? 39 : 53) + Math.min(60, this.wave * 3),
      hit: 0,
    });
  }
  updateEnemies(dt) {
    for (const e of this.enemies) {
      const s = e.sprite,
        tx = Math.floor(s.x / T),
        ty = Math.floor(s.y / T);
      let target = { x: this.hero.x, y: this.hero.y };
      if (Math.hypot(s.x - this.hero.x, s.y - this.hero.y) > 42) {
        let best = this.flow?.[ty]?.[tx] ?? Infinity;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const d = this.flow?.[ty + dy]?.[tx + dx] ?? Infinity;
          if (d < best) {
            best = d;
            target = { x: (tx + dx) * T + 16, y: (ty + dy) * T + 16 };
          }
        }
      }
      const a = Math.atan2(target.y - s.y, target.x - s.x);
      this.moveBody(
        s,
        Math.cos(a) * e.speed * dt,
        Math.sin(a) * e.speed * dt,
        8,
      );
      s.setDepth(s.y + 15).setFlipX(Math.cos(a) < 0);
      e.hit = Math.max(0, e.hit - dt);
      if (!e.hit) s.clearTint();
      if (
        Math.hypot(s.x - this.hero.x, s.y - this.hero.y) < 24 &&
        this.invincible <= 0
      ) {
        const armor = state.profile.equipment.armor;
        const defense = armor ? armor.armor * RARITIES[armor.rarity].mult : 0;
        this.hp -= Math.max(3, 11 + this.wave - defense);
        this.invincible = 0.65;
        this.extraction = null;
        this.cameras.main.shake(70, 0.003);
        if (this.hp <= 0) {
          finishRaid(false);
          return;
        }
      }
    }
  }
  updateCombat(dt) {
    const skills = equippedSkills(state.profile.equipment);
    for (const skill of skills) {
      const manual = state.profile.active === skill.id;
      this.shotTimes[skill.id] = (this.shotTimes[skill.id] || 0) - dt;
      if (manual) {
        if (
          skill.type === "nova" &&
          Phaser.Input.Keyboard.JustDown(this.keys.Q) &&
          this.qCooldown === 0
        ) {
          this.nova(skill);
          this.qCooldown = 7;
        }
        continue;
      }
      if (this.shotTimes[skill.id] > 0) continue;
      const target = this.enemies.reduce((best, e) => {
        const dist = Math.hypot(
          e.sprite.x - this.hero.x,
          e.sprite.y - this.hero.y,
        );
        return dist < 440 && (!best || dist < best.dist) ? { e, dist } : best;
      }, null);
      if (!target) continue;
      const bonus = this.skillBonuses[skill.id] || {
        multi: 0,
        haste: 0,
        pierce: 0,
      };
      this.shotTimes[skill.id] =
        (skill.type === "nova" ? 3 : skill.type === "arrow" ? 0.65 : 1) /
        (1 + bonus.haste * 0.18);
      if (skill.type === "nova") {
        this.nova(skill);
        continue;
      }
      const angle = Math.atan2(
          target.e.sprite.y - this.hero.y,
          target.e.sprite.x - this.hero.x,
        ),
        count = 1 + Math.min(7, bonus.multi),
        color =
          skill.type === "fire"
            ? 0xf2a752
            : skill.type === "arrow"
              ? 0xa5d1b0
              : 0x9bc8ef;
      for (let n = 0; n < count; n++) {
        const a = angle + (n - (count - 1) / 2) * 0.19;
        const sprite =
          skill.type === "slash"
            ? this.add.rectangle(this.hero.x, this.hero.y, 9, 32, color)
            : this.add.ellipse(
                this.hero.x,
                this.hero.y,
                skill.type === "arrow" ? 19 : 16,
                skill.type === "arrow" ? 4 : 10,
                color,
              );
        sprite.setRotation(a).setDepth(4000);
        this.bullets.push({
          sprite,
          vx: Math.cos(a) * 360,
          vy: Math.sin(a) * 360,
          life: 1.5,
          damage: this.damage(skill),
          pierce: bonus.pierce + (skill.type === "arrow" ? 1 : 0),
          hit: new Set(),
          color,
        });
      }
    }
    this.bullets = this.bullets.filter((b) => {
      b.life -= dt;
      b.sprite.x += b.vx * dt;
      b.sprite.y += b.vy * dt;
      let alive = b.life > 0 && this.canWalk(b.sprite.x, b.sprite.y, 1);
      if (alive)
        for (const e of this.enemies) {
          if (
            e.hp > 0 &&
            !b.hit.has(e) &&
            Math.hypot(b.sprite.x - e.sprite.x, b.sprite.y - e.sprite.y) < 22
          ) {
            b.hit.add(e);
            this.hitEnemy(e, b.damage, b.color);
            b.pierce--;
            if (b.pierce < 0) {
              alive = false;
              break;
            }
          }
        }
      if (!alive) b.sprite.destroy();
      return alive;
    });
    this.enemies = this.enemies.filter((e) => {
      if (e.hp > 0) return true;
      this.kills++;
      const orb = this.add
        .circle(e.sprite.x, e.sprite.y, 4, 0x90c8bf)
        .setStrokeStyle(1, 0xceedce, 0.6)
        .setDepth(5);
      this.drops.push({ sprite: orb, xp: 3 });
      if (this.random() < 0.045) {
        const c = this.addObject(
          "container",
          e.sprite.x,
          e.sprite.y,
          null,
          "Останки",
        );
        c.grid = grid(3, 3);
        put(c.grid, rollLoot(this.random));
        c.revealed = 0;
        c.progress = 0;
        this.add.circle(c.x, c.y, 5, 0xd0b068, 0.6);
      }
      e.sprite.destroy();
      return false;
    });
  }
  damage(skill) {
    const w = state.profile.equipment.weapon;
    return Math.round(
      (w?.damage || 5) *
        (w ? RARITIES[w.rarity].mult : 1) *
        RARITIES[skill.rarity].mult *
        this.bonuses.power,
    );
  }
  nova(skill) {
    const ring = this.add
      .circle(this.hero.x, this.hero.y, 15, 0x9fd9eb, 0.15)
      .setStrokeStyle(3, 0xa9e0ed)
      .setDepth(3000);
    this.tweens.add({
      targets: ring,
      scale: 10,
      alpha: 0,
      duration: 420,
      onComplete: () => ring.destroy(),
    });
    for (const e of this.enemies)
      if (Math.hypot(e.sprite.x - this.hero.x, e.sprite.y - this.hero.y) < 155)
        this.hitEnemy(e, this.damage(skill) * 1.5, 0xa9e0ed);
  }
  hitEnemy(e, damage, color) {
    e.hp -= damage;
    e.hit = 0.1;
    e.sprite.setTintFill(color);
    const text = this.add
      .text(e.sprite.x, e.sprite.y - 25, `${Math.round(damage)}`, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#e9d4aa",
        stroke: "#141818",
        strokeThickness: 3,
      })
      .setDepth(5000);
    this.tweens.add({
      targets: text,
      y: text.y - 25,
      alpha: 0,
      duration: 550,
      onComplete: () => text.destroy(),
    });
  }
  updateDrops(dt) {
    this.drops = this.drops.filter((d) => {
      const dist = Math.hypot(
        d.sprite.x - this.hero.x,
        d.sprite.y - this.hero.y,
      );
      if (dist < 105) {
        const a = Math.atan2(
          this.hero.y - d.sprite.y,
          this.hero.x - d.sprite.x,
        );
        d.sprite.x += Math.cos(a) * 250 * dt;
        d.sprite.y += Math.sin(a) * 250 * dt;
      }
      if (dist < 18) {
        this.xp += d.xp;
        d.sprite.destroy();
        return false;
      }
      return true;
    });
  }
  updateHUD() {
    if (state.mode !== "raid") return;
    const set = (id, text) => {
      const e = document.getElementById(id);
      if (e) e.textContent = text;
    };
    const left = Math.max(0, RAID_TIME - this.elapsed);
    set(
      "timer",
      left
        ? `${Math.floor(left / 60)
            .toString()
            .padStart(2, "0")}:${Math.floor(left % 60)
            .toString()
            .padStart(2, "0")}`
        : "ТЬМА ИДЁТ",
    );
    set("wave", String(this.wave).padStart(2, "0"));
    set("kills", this.kills);
    set("rooms", `${this.discovered.size} / 12`);
    set("hp-text", `${Math.max(0, Math.ceil(this.hp))} / ${this.maxHP}`);
    set("level", this.level);
    const width = (id, v) => {
      const e = document.getElementById(id);
      if (e) e.style.width = `${Math.max(0, Math.min(100, v))}%`;
    };
    width("hp-fill", (this.hp / this.maxHP) * 100);
    width("xp-fill", (this.xp / (this.level * 10)) * 100);
    width("time-fill", (left / RAID_TIME) * 100);
    const exits = document.querySelector("#exits");
    if (exits)
      exits.innerHTML = ["Костяные врата", "Рунный проход", "Путь охотника"]
        .map(
          (s, i) =>
            `<div class="exit-row ${this.exitReady(i) ? "ready" : ""}"><span class="exit-symbol exit-${i}">◇</span><div><b>${s}</b><small>${this.exitCondition(i)}</small></div>${this.exitReady(i) ? "<span>✓</span>" : ""}</div>`,
        )
        .join("");
    const dash = document.querySelector("#dash-state span"),
      q = document.querySelector("#q-state span");
    if (dash)
      dash.textContent =
        this.dashCooldown > 0 ? this.dashCooldown.toFixed(1) + " с" : "Рывок";
    if (q)
      q.textContent = state.profile.active
        ? this.qCooldown > 0
          ? this.qCooldown.toFixed(1) + " с"
          : "Кольцо"
        : "Нет умения";
    this.drawMinimap();
  }
  drawMinimap() {
    const canvas = document.querySelector("#minimap");
    if (!canvas) return;
    const c = canvas.getContext("2d"),
      sx = canvas.width / this.map.w,
      sy = canvas.height / this.map.h;
    c.fillStyle = "#121b1d";
    c.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < this.map.h; y++)
      for (let x = 0; x < this.map.w; x++)
        if (this.map.tiles[y][x]) {
          c.fillStyle = "#384444";
          c.fillRect(x * sx, y * sy, sx, sy);
        }
    for (const n of this.discovered) {
      const r = this.map.rooms[n];
      c.fillStyle = "#576257";
      c.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
    }
    for (const o of this.objects) {
      if (o.type === "exit") {
        c.fillStyle = ["#e0bb65", "#b39ae2", "#85b99a"][o.exitType];
        c.fillRect((o.x / T) * sx - 3, (o.y / T) * sy - 3, 6, 6);
      }
      if (o.type === "rune") {
        c.fillStyle = o.order < this.runes ? "#8be0bb" : "#b195d3";
        c.fillRect((o.x / T) * sx - 1, (o.y / T) * sy - 1, 3, 3);
      }
      if (
        o.type === "container" &&
        o.grid.items.some((i) => i.type === "key")
      ) {
        c.fillStyle = "#e0bb65";
        c.fillRect((o.x / T) * sx - 2, (o.y / T) * sy - 2, 4, 4);
      }
    }
    c.fillStyle = "#e6eee0";
    c.beginPath();
    c.arc((this.hero.x / T) * sx, (this.hero.y / T) * sy, 3, 0, Math.PI * 2);
    c.fill();
    if (this.elapsed > RAID_TIME) {
      const r = this.map.rooms[0];
      c.strokeStyle = "#cc638c";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(
        (r.cx + 0.5) * sx,
        (r.cy + 0.5) * sy,
        (this.zoneRadius / T) * sx,
        0,
        Math.PI * 2,
      );
      c.stroke();
    }
  }
}
