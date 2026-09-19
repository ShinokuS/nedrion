import Phaser from "phaser";
import { installWorld } from './world.js';
import { preloadOriginal, installPresentation } from './presentation.js';
import {
  state,
  openPanel,
  closePanel,
  save,
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
  move,
  item,
  rollLoot,
  equippedSkills,
  upgradeOptions,
  RARITIES,
  DEFS,
  starter,
} from "./core.js";

const T = 32,
  RAID_TIME = 210;
export class RaidScene extends Phaser.Scene {
  constructor() {
    super("world");
  }
  preload() {
    preloadOriginal(this);
    const counts = {
      hero: 6,
      skeleton: 7,
      zombie: 8,
      torch: 4,
      chest: 1,
      stash: 1,
      trader: 1,
      barrel: 1,
      staff: 1, sword: 1, bow: 1, armor: 1, gem: 1, support: 1, key: 1, relic: 1,
    };
    for (const [key, count] of Object.entries(counts))
      for (let n = 0; n < count; n++)
        this.load.image(
          `${key}-${n}`,
          `${import.meta.env.BASE_URL}assets/${key}-${n}.png`,
        );
    const hs = {
      "main-hud": 22, "minimap-hud": 13, "minimap-frame": 20,
      "skill-frame": 12, "hp-bar": 21, "hp-bg": 2, "hp-glass": 2,
      "inventory-player": 4, "stash-bg": 3, "inv-grid": 1, "inv-slot": 16,
      "inv-tab": 7, "inv-tab-solid": 8, "equip-weapon": 1, "equip-armor": 1,
      "slot-weapon": 1, "slot-armor": 1, "hud-button": 3, "button-close": 2,
      backpack: 1, coin: 11, xp: 1, "fall-ground": 1, "fall-ground3": 1,
      "fall-ground4": 1, "prison-ground": 1, "prison-wall": 1, "town-hall": 1,
      "dead-tree": 1, "dead-tree2": 1, "tree-leaves": 1, "street-lamp": 1,
      "street-lamp-right": 1, bush: 1, rock: 1, fence: 1, pitfire: 6, grave: 2,
      portal: 15, guide: 12, chains: 3, "paladin-head-down": 1,
      "paladin-head-left": 1, "paladin-head-up": 1, "paladin-torso-down": 1,
      "paladin-torso-left": 1, "paladin-torso-up": 1, "paladin-pelvis-down": 1,
      "paladin-pelvis-left": 1, "paladin-pelvis-up": 1, "paladin-arm-down": 1,
      "paladin-arm-left": 1, "paladin-arm-up": 1, "paladin-leg-down": 1,
      "paladin-leg-left": 1, "paladin-leg-up": 1, "holy-helmet": 1,
      "holy-helmet-left": 1, "holy-helmet-up": 1, "anubis-armor": 1,
      azurewrath: 1, "phoenix-staff": 1, "player-arrow": 2, "bat-down": 4,
      "bat-left": 4, "bat-up": 4, "imp-down": 10, "imp-left": 12,
      "imp-up": 12, "rat-down": 4, "rat-left": 4, "rat-up": 4,
      "archer-down": 8, "archer-left": 8, "archer-up": 8,
      "archer-projectile": 4, "fx-fire": 9, "fx-lightning": 8,
      "fx-pulse": 1, "xp-globe": 8, cursor: 1,
    };
    for (const [key, count] of Object.entries(hs))
      for (let n = 0; n < count; n++)
        this.load.image(`hs-${key}-${n}`, `${import.meta.env.BASE_URL}assets/hs/${key}-${n}.png`);
    for (const [key, count] of Object.entries({
      "skeleton-down": 7, "skeleton-left": 7, "skeleton-up": 7,
      "zombie-down": 8, "zombie-left": 8, "zombie-up": 8,
    })) for (let n = 0; n < count; n++)
      this.load.image(`hs-${key}-${n}`, `${import.meta.env.BASE_URL}assets/${key.replace("skeleton", "skeleton").replace("zombie", "zombie")}-${n}.png`);
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
    for (const [key, count] of Object.entries({
      "skeleton-down": 7, "skeleton-left": 7, "skeleton-up": 7,
      "zombie-down": 8, "zombie-left": 8, "zombie-up": 8,
      "bat-down": 4, "bat-left": 4, "bat-up": 4,
      "imp-down": 10, "imp-left": 12, "imp-up": 12,
      "rat-down": 4, "rat-left": 4, "rat-up": 4,
      "archer-down": 8, "archer-left": 8, "archer-up": 8,
    })) this.anims.create({
      key: `hs-${key}`,
      frames: Array.from({length: count}, (_, n) => ({key: `hs-${key}-${n}`})),
      frameRate: key.startsWith("bat") ? 11 : 8,
      repeat: -1,
    });
    this.anims.create({key: "hs-portal", frames: Array.from({length: 15}, (_, n) => ({key: `hs-portal-${n}`})), frameRate: 13, repeat: -1});
    this.anims.create({key: "hs-pitfire", frames: Array.from({length: 6}, (_, n) => ({key: `hs-pitfire-${n}`})), frameRate: 9, repeat: -1});
    this.anims.create({key: "hs-guide", frames: Array.from({length: 12}, (_, n) => ({key: `hs-guide-${n}`})), frameRate: 12, repeat: -1});
    this.anims.create({key: "hs-fx-fire", frames: Array.from({length: 9}, (_, n) => ({key: `hs-fx-fire-${n}`})), frameRate: 18, repeat: 0});
    this.anims.create({key: "hs-fx-lightning", frames: Array.from({length: 8}, (_, n) => ({key: `hs-fx-lightning-${n}`})), frameRate: 18, repeat: 0});
    this.keys = this.input.keyboard.addKeys(
      "W,A,S,D,E,Q,SPACE,UP,DOWN,LEFT,RIGHT",
    );
    this.input.keyboard.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT"]);
    this.input.keyboard.on("keydown", (event) => {
      if (state.mode === "result" || state.panel === "level") return;
      if (event.code === "KeyI") state.panel ? closePanel() : openPanel("inventory");
      if (event.code === "Escape") state.panel ? closePanel() : openPanel("pause");
    });
    this.scale.on("resize", () => this.resize());
    this.startHub();
  }
  resetWorld() {
    this.cameras.main.stopFollow();
    this.tweens.killAll();
    this.children.removeAll(true);
    this.enemies = [];
    this.enemyBullets = [];
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
      strokeThickness: 1,
      resolution: 2,
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
    this.createCanvasHud();
    this.renderOverlay(true);
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
    [rooms.length-1, rooms.length-3, rooms.length-5].forEach((n, i) => {
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
    this.createFog();
    this.createCanvasHud();
    this.renderOverlay(true);

  }
  drawMap(hub) {
    const random = rng(hub ? 72 : this.seed);
    const ground = hub ? "hs-fall-ground-0" : "hs-prison-ground-0";
    this.add.tileSprite(0, 0, this.map.w * T, this.map.h * T, ground)
      .setOrigin(0).setTileScale(0.5).setDepth(-30);
    const walls = this.add.graphics().setDepth(-15);
    for (let y = 0; y < this.map.h; y++) for (let x = 0; x < this.map.w; x++) {
      if (!this.map.tiles[y][x] && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => this.map.tiles[y + dy]?.[x + dx])) {
        walls.fillStyle(hub ? 0x241815 : 0x17151a, 0.86).fillRect(x * T, y * T, T, T);
        if (random() > 0.45) this.add.image(x * T + 16, y * T + 16, "hs-prison-wall-0").setDisplaySize(T * 2, T * 1.5).setAlpha(0.35).setDepth(-12);
      }
    }
    if (hub) {
      this.add.image(544, 177, "hs-town-hall-0").setOrigin(0.5, 0.7).setScale(1.3).setDepth(100);
      for (const [x, y] of [[288, 240], [800, 240], [288, 640], [800, 640]]) this.torch(x, y);
      this.placeWorldProp(250, 500, "hs-dead-tree-0", 0.9);
      this.placeWorldProp(900, 490, "hs-dead-tree2-0", 0.8);
      this.placeWorldProp(310, 300, "hs-street-lamp-0", 0.7);
      this.placeWorldProp(790, 300, "hs-street-lamp-right-0", 0.7);
      this.placeWorldProp(375, 560, "hs-bush-0", 1.15);
      this.placeWorldProp(720, 560, "hs-rock-0", 0.8);
    } else for (const r of this.map.rooms) {
      this.torch((r.x + 1) * T + 16, (r.y + 1) * T + 16);
      if (random() > 0.3) this.torch((r.x + r.w - 2) * T + 16, (r.y + r.h - 2) * T + 16);
      const props = ["hs-bush-0", "hs-rock-0", "hs-grave-0", "hs-chains-0"];
      for (let n = 0; n < 2 + Math.floor(random() * 3); n++) {
        const px = (r.x + 2 + random() * (r.w - 4)) * T;
        const py = (r.y + 2 + random() * (r.h - 4)) * T;
        this.placeWorldProp(px, py, props[Math.floor(random() * props.length)], 0.65 + random() * 0.4);
      }
    }
  }
  placeWorldProp(x, y, texture, scale = 1) {
    if (!this.textures.exists(texture)) return;
    return this.add.image(x, y, texture).setOrigin(0.5, 0.85).setScale(scale).setDepth(y);
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
    this.add.ellipse(x, y + 12, 82, 38, color, 0.16).setStrokeStyle(1, color, 0.7);
    const e = this.add.sprite(x, y - 12, "hs-portal-0").play("hs-portal").setScale(1.15).setDepth(y + 1);
    e.setTint(color);
    this.add.text(x, y + 34, "ПОРТАЛ", {...this.textStyle, fontFamily: "Georgia", fontSize: "10px", color: "#e8d8ac"}).setOrigin(0.5).setDepth(y + 2);
  }
  makeHero(x, y) {
    this.shadow = this.add.ellipse(x, y + 11, 30, 12, 0x000000, 0.4);
    this.hero = this.add.sprite(x, y, "hero-0").play("hero").setScale(1.2);
    this.hero.setAlpha(0);
    this.heroDirection = "down";
    this.heroModel = this.add.container(x, y).setDepth(y + 20);
    this.heroParts = {
      legs: [this.add.image(-5, 12, "hs-paladin-leg-down-0").setScale(2.2), this.add.image(5, 12, "hs-paladin-leg-down-0").setScale(2.2)],
      pelvis: this.add.image(0, 7, "hs-paladin-pelvis-down-0").setScale(2.2),
      torso: this.add.image(0, -1, "hs-paladin-torso-down-0").setScale(2.2),
      arms: [this.add.image(-10, -1, "hs-paladin-arm-down-0").setScale(2.2), this.add.image(10, -1, "hs-paladin-arm-down-0").setScale(2.2)],
      head: this.add.image(0, -14, "hs-paladin-head-down-0").setScale(2.2),
    };
    this.heroModel.add([...this.heroParts.legs, this.heroParts.pelvis, this.heroParts.torso, ...this.heroParts.arms, this.heroParts.head]);
    this.heroLight = this.add.circle(x, y, 38, 0xe4c478, 0.035);
    this.hero.setDepth(y + 20);
    this.heroRing = this.add
      .ellipse(x, y + 13, 35, 15)
      .setStrokeStyle(1, 0xc2b77d, 0.7);
    this.setHeroDirection(0, 1);
  }
  setHeroDirection(dx, dy) {
    if (!this.heroParts) return;
    const direction = Math.abs(dx) > Math.abs(dy) ? "left" : dy < 0 ? "up" : "down";
    this.heroModel.setScale(direction === "left" && dx > 0 ? -1 : 1, 1);
    if (direction === this.heroDirection) return;
    this.heroDirection = direction;
    this.heroParts.head.setTexture(`hs-paladin-head-${direction}-0`);
    this.heroParts.torso.setTexture(`hs-paladin-torso-${direction}-0`);
    this.heroParts.pelvis.setTexture(`hs-paladin-pelvis-${direction}-0`);
    this.heroParts.arms.forEach((part) => part.setTexture(`hs-paladin-arm-${direction}-0`));
    this.heroParts.legs.forEach((part) => part.setTexture(`hs-paladin-leg-${direction}-0`));
  }
  addObject(type, x, y, texture, label) {
    const o = { type, x, y, label };
    if (texture)
      o.sprite = this.add
        .image(x, y, texture)
        .setOrigin(0.5, 0.8)
        .setDepth(y)
        .setScale(texture === "chest-0" ? 0.8 : 1.3);
    if (o.sprite) o.sprite.setInteractive({useHandCursor: true}).on("pointerdown", () => this.interact(o));
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
      grad.addColorStop(1, "rgba(3,9,12,.30)");
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
  createFog() {
    this.fog = this.add.graphics().setDepth(6900);
    this.fogOpen = true;
    this.updateFog();
  }
  updateFog() {
    if (!this.fog || !this.map || state.mode !== "raid") return;
    this.fog.clear().fillStyle(0x090709, 0.10).fillRect(0, 0, this.map.w * T, this.map.h * T);
    this.fog.setBlendMode(Phaser.BlendModes.ERASE);
    this.fog.fillCircle(this.hero?.x || 0, this.hero?.y || 0, 210);
    for (const n of this.discovered || []) {
      const r = this.map.rooms[n];
      this.fog.fillRect(r.x * T + 8, r.y * T + 8, r.w * T - 16, r.h * T - 16);
    }
    this.fog.setBlendMode(Phaser.BlendModes.NORMAL);
  }
  uiText(key, x, y, text, style = {}) {
    const t = this.add.text(x, y, text, {fontFamily: "Georgia, serif", fontSize: "14px", color: "#f0dfb0", stroke: "#150b0c", strokeThickness: 1,
      resolution: 2, ...style});
    this.ui.add(t); this.uiTexts[key] = t; return t;
  }
  createCanvasHud() {
    this.ui = this.add.container(0, 0).setScrollFactor(0).setDepth(10000);
    this.uiTexts = {}; this.uiMode = null; this.canvasPanel = null; this.hudMap = null;
    this.renderOverlay(true);
  }
  renderOverlay(force = false) {
    if (!this.ui) return;
    if (force || this.uiMode !== state.mode) {
      this.ui.removeAll(true); this.uiTexts = {}; this.uiMode = state.mode;
      const w = this.scale.width, h = this.scale.height;
      const mainFrame = this.add.image(16, 13, "hs-main-hud-15").setOrigin(0).setDisplaySize(410, 114);
      this.ui.add(mainFrame);
      const portrait = this.add.sprite(57, 61, "hero-0").setScale(1.55).setDepth(2);
      this.ui.add(portrait);
      this.uiText("title", 101, 20, state.mode === "raid" ? "ИЗГНАННИК" : "ПОСЛЕДНИЙ ОГОНЬ", {fontSize: "18px", color: "#f04d76"});
      this.uiText("subtitle", 102, 47, state.mode === "raid" ? "КАТАКОМБЫ • УРОВЕНЬ I" : "УБЕЖИЩЕ СТРАННИКОВ", {fontSize: "10px", color: "#dfb77c"});
      this.uiText("hp", 101, 68, "100 / 100", {fontFamily: "monospace", fontSize: "11px", color: "#f0d1c5"});
      this.uiText("gold", 100, 92, "◈ 100", {fontFamily: "monospace", fontSize: "11px", color: "#e1c77b"});
      const mini = this.add.image(w - 276, 20, "hs-minimap-frame-0").setOrigin(0).setDisplaySize(256, 145);
      this.ui.add(mini);
      this.hudMap = this.add.graphics(); this.ui.add(this.hudMap);
      this.uiText("mapLabel", w - 262, 29, state.mode === "raid" ? "КАРТА • ТУМАН ВОЙНЫ" : "УБЕЖИЩЕ", {fontSize: "10px", color: "#e0cb96"});
      this.uiText("timer", 22, 142, "", {fontFamily: "monospace", fontSize: "18px", color: "#e7d5a1"});
      this.uiText("wave", 22, 169, "", {fontSize: "10px", color: "#d7bb77"});
      this.uiText("rooms", 22, 187, "", {fontSize: "10px", color: "#a9ad9a"});
      const bottom = this.add.image(w / 2 - 222, h - 110, "hs-main-hud-11").setOrigin(0).setDisplaySize(444, 123);
      this.ui.add(bottom);
      this.hudBars = this.add.graphics(); this.ui.add(this.hudBars);
      this.uiText("hint", w / 2, h - 142, "", {fontSize: "13px", color: "#f2dfaf"}).setOrigin(0.5);
      this.uiText("controls", w / 2, h - 22, "WASD движение   E взаимодействие   I инвентарь   SPACE рывок   Q умение", {fontFamily: "monospace", fontSize: "10px", color: "#a9a089"}).setOrigin(0.5);
      this.uiText("hpBottom", w / 2 - 180, h - 91, "", {fontFamily: "monospace", fontSize: "12px", color: "#f5d0bb"});
      this.uiText("level", w / 2 + 155, h - 88, "УР. 1", {fontSize: "15px", color: "#edce88"});
      if (state.mode === "hub") {
        this.uiText("hubPrompt", w / 2, h - 170, "E рядом с объектом • I открыть снаряжение", {fontSize: "12px", color: "#c9bd9a"}).setOrigin(0.5);
      }
      this.updateHeroAppearance();
    }
    const w = this.scale.width, h = this.scale.height, p = state.profile;
    this.uiTexts.gold?.setText(`◈ ${p.gold}`);
    this.uiTexts.hp?.setText(`${Math.max(0, Math.ceil(this.hp || 100))} / ${this.maxHP || 100}`);
    this.uiTexts.hpBottom?.setText(`${Math.max(0, Math.ceil(this.hp || 100))} / ${this.maxHP || 100}`);
    this.uiTexts.timer?.setText(state.mode === "raid" ? `ТЬМА ${Math.max(0, Math.floor((RAID_TIME - (this.elapsed || 0)) / 60)).toString().padStart(2, "0")}:${Math.max(0, Math.floor((RAID_TIME - (this.elapsed || 0)) % 60)).toString().padStart(2, "0")}` : "БЕЗОПАСНАЯ ЗОНА");
    this.uiTexts.wave?.setText(state.mode === "raid" ? `ВОЛНА ${String(this.wave).padStart(2, "0")}   УБИТО ${this.kills}` : "ПОДГОТОВКА К ВЫЛАЗКЕ");
    this.uiTexts.rooms?.setText(state.mode === "raid" ? `КОМНАТЫ ${this.discovered?.size || 0} / 12` : "ТАЙНИК • ТОРГОВЕЦ • ПОРТАЛ");
    this.uiTexts.level?.setText(`УР. ${this.level || 1}`);
    if (this.hudBars) {
      const left = Math.max(0, RAID_TIME - (this.elapsed || 0));
      this.hudBars.clear();
      this.hudBars.fillStyle(0x260e12, 0.9).fillRect(w / 2 - 182, h - 76, 235, 8);
      this.hudBars.fillStyle(0xb64252, 0.95).fillRect(w / 2 - 182, h - 76, 235 * Math.max(0, Math.min(1, (this.hp || 100) / (this.maxHP || 100))), 8);
      this.hudBars.fillStyle(0x39223e, 0.95).fillRect(w / 2 - 182, h - 65, 235, 4);
      this.hudBars.fillStyle(0x9d5cbb, 0.95).fillRect(w / 2 - 182, h - 65, 235 * Math.max(0, Math.min(1, (this.xp || 0) / ((this.level || 1) * 10))), 4);
      this.hudBars.fillStyle(0x9d6e2e, 0.9).fillRect(22, 205, 205, 3);
      this.hudBars.fillStyle(0xd8b566, 0.95).fillRect(22, 205, 205 * Math.max(0, Math.min(1, left / RAID_TIME)), 3);
    }
    this.drawMinimap();
  }
  updateHeroAppearance() {
    if (!this.hero) return;
    if (this.heroGear) this.heroGear.destroy();
    this.heroGear = this.add.container(this.hero.x, this.hero.y).setDepth(this.hero.y + 21);
    const weapon = state.profile.equipment.weapon?.type;
    const armor = state.profile.equipment.armor?.type;
    if (armor === "armor") this.heroGear.add(this.add.image(0, 1, "hs-anubis-armor-0").setScale(0.62));
    if (weapon === "sword") this.heroGear.add(this.add.image(13, 5, "hs-azurewrath-0").setScale(0.28).setAngle(-15));
    if (weapon === "staff") this.heroGear.add(this.add.image(13, 2, "hs-phoenix-staff-0").setScale(0.25).setAngle(-10));
    if (armor === "armor") this.heroGear.add(this.add.image(0, -20, "hs-holy-helmet-0").setScale(0.7));
  }
  setInteractionText(text) {
    if (this.uiTexts?.hint) this.uiTexts.hint.setText(text || "");
  }
  toastCanvas(message) {
    if (!this.ui) return;
    if (this.uiTexts.toast) this.uiTexts.toast.destroy();
    const t = this.uiText("toast", this.scale.width / 2, 87, message, {fontSize: "14px", color: "#f2e5bd", backgroundColor: "#160f0fd9", padding: {left: 18, right: 18, top: 10, bottom: 10}}).setOrigin(0.5);
    this.tweens.add({targets: t, alpha: 0, delay: 2700, duration: 500, onComplete: () => t.destroy()});
  }
  createCanvasButton(x, y, w, h, label, callback) {
    const bg = this.add.image(x, y, "hs-hud-button-0").setDisplaySize(w, h).setInteractive({useHandCursor: true});
    const text = this.add.text(x, y, label, {fontFamily: "Georgia, serif", fontSize: "13px", color: "#e9d5a0", stroke: "#160b0c", strokeThickness: 3}).setOrigin(0.5);
    bg.on("pointerdown", callback); this.canvasPanel.add([bg, text]); return bg;
  }
  openCanvasPanel(panel, search = null) {
    this.closeCanvasPanel();
    if (!this.ui) return;
    this.canvasPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(11000);
    const w = this.scale.width, h = this.scale.height;
    this.canvasPanel.add(this.add.rectangle(w / 2, h / 2, Math.min(930, w - 50), Math.min(650, h - 42), 0x130b0d, 0.94).setStrokeStyle(2, 0x93613d, 0.9));
    const isInventory = ["inventory", "stash", "container"].includes(panel);
    if (isInventory) this.canvasPanel.add(this.add.image(w / 2 + 168, h / 2, "hs-inventory-player-0").setScale(0.73).setAlpha(0.88));
    this.canvasPanel.add(this.add.text(w / 2 - 390, 46, panel === "inventory" ? "INVENTORY" : panel === "stash" ? "STASH" : panel === "container" ? "SEARCH" : panel.toUpperCase(), {fontFamily: "Georgia, serif", fontSize: "25px", color: "#e7d69f", stroke: "#180b0b", strokeThickness: 4}));
    const close = this.add.image(w - 90, 55, "hs-button-close-0").setScale(1.7).setInteractive({useHandCursor: true});
    close.on("pointerdown", () => closePanel()); this.canvasPanel.add(close);
    if (isInventory) this.drawCanvasInventory(panel, search); else if (panel === "expedition") this.drawCanvasExpedition(); else if (panel === "vendor") this.drawCanvasVendor(); else if (panel === "pause" || panel === "help") this.drawCanvasHelp();
    else if (panel === "result") this.drawCanvasResult();
  }
  closeCanvasPanel() { this.canvasPanel?.destroy(); this.canvasPanel = null; }
  drawCanvasGrid(g, x, y, source, revealed = Infinity) {
    const cell = 31, layer = this.add.container(x, y); this.canvasPanel.add(layer);
    for (let yy = 0; yy < g.h; yy++) for (let xx = 0; xx < g.w; xx++) layer.add(this.add.image(xx * cell, yy * cell, "hs-inv-grid-0").setOrigin(0).setDisplaySize(cell, cell));
    g.items.forEach((it, index) => {
      const hidden = index >= revealed, texture = this.itemTexture(it), holder = this.add.container(it.x * cell, it.y * cell);
      holder.add(this.add.image(0, 0, "hs-inv-slot-0").setOrigin(0).setDisplaySize(Math.max(1, it.w * cell - 2), Math.max(1, it.h * cell - 2)).setTint(RARITIES[it.rarity].color));
      if (hidden) holder.add(this.add.text(it.w * cell / 2, it.h * cell / 2, "?", {fontSize: "21px", color: "#c9ad72"}).setOrigin(0.5));
      else holder.add(this.add.image(it.w * cell / 2, it.h * cell / 2, texture).setDisplaySize(Math.min(it.w * cell - 8, 54), Math.min(it.h * cell - 8, 76)));
      if (!hidden) holder.setSize(it.w * cell, it.h * cell).setInteractive({useHandCursor: true}).on("pointerdown", () => { state.selected = it; state.source = source; this.renderCanvasItemDetail(it); });
      layer.add(holder);
    }); return layer;
  }
  itemTexture(it) { return it.icon === "coin" ? "hs-coin-0" : `${it.icon}-0`; }
  drawCanvasInventory(panel, search) {
    const w = this.scale.width, h = this.scale.height, p = state.profile;
    this.canvasPanel.add(this.add.text(w / 2 - 382, 92, panel === "container" ? "ОБЫСК • ПРЕДМЕТЫ ОТКРЫВАЮТСЯ ПО ОДНОМУ" : "СОКЕТЫ И СНАРЯЖЕНИЕ", {fontFamily: "monospace", fontSize: "10px", color: "#a99279"}));
    const gridX = w / 2 - 370, gridY = 135;
    if (panel === "container" && search) { this.drawCanvasGrid(search.grid, gridX, gridY, "container", search.revealed); this.drawCanvasGrid(p.bag, gridX + 315, gridY, "bag"); }
    else { this.drawCanvasGrid(p.bag, gridX, gridY + 210, "bag"); if (panel === "stash") this.drawCanvasGrid(p.stash, gridX + 315, gridY, "stash"); else this.drawCanvasEquipment(gridX + 315, gridY); }
    this.canvasPanel.add(this.add.text(gridX, gridY - 20, panel === "container" ? "СОДЕРЖИМОЕ" : "РЮКЗАК  8 × 5", {fontFamily: "Georgia, serif", fontSize: "15px", color: "#d7c796"}));
    this.canvasPanel.add(this.add.text(gridX + 315, gridY - 20, panel === "container" ? "РЮКЗАК" : panel === "stash" ? "ТАЙНИК  10 × 7" : "СНАРЯЖЕНИЕ", {fontFamily: "Georgia, serif", fontSize: "15px", color: "#d7c796"}));
    this.renderCanvasItemDetail(state.selected);
  }
  drawCanvasEquipment(x, y) {
    const p = state.profile, gear = p.equipment.weapon;
    this.canvasPanel.add(this.add.image(x + 50, y + 65, "hs-slot-weapon-0").setDisplaySize(72, 96));
    this.canvasPanel.add(this.add.image(x + 50, y + 180, "hs-slot-armor-0").setDisplaySize(58, 86));
    if (gear) this.canvasPanel.add(this.add.image(x + 50, y + 65, this.itemTexture(gear)).setDisplaySize(42, 70).setInteractive().on("pointerdown", () => { state.selected = gear; state.source = "weapon"; this.renderCanvasItemDetail(gear); }));
    if (p.equipment.armor) this.canvasPanel.add(this.add.image(x + 50, y + 180, this.itemTexture(p.equipment.armor)).setDisplaySize(38, 62));
    if (gear?.sockets) gear.sockets.forEach((gem, i) => { const socket = this.add.image(x + 110 + i * 28, y + 50, "hs-skill-frame-0").setDisplaySize(26, 26).setInteractive(); if (gem) socket.setTint(RARITIES[gem.rarity].color).on("pointerdown", () => { state.selected = gem; state.source = "weapon"; this.renderCanvasItemDetail(gem); }); socket.on("pointerdown", () => this.installSelectedGem(gear, i)); this.canvasPanel.add(socket); if (gem) this.canvasPanel.add(this.add.image(x + 110 + i * 28, y + 50, this.itemTexture(gem)).setDisplaySize(16, 16)); });
  }
  installSelectedGem(gear, index) {
    const gem = state.selected; if (!gem || state.source !== "bag" || !["skill", "support"].includes(gem.kind)) return;
    if (gear.sockets[index]) return;
    if (gem.kind === "skill" && !gem.accept.includes(gear.weapon)) return toast("Камень несовместим с этим оружием");
    gear.sockets[index] = gem; state.profile.bag.items = state.profile.bag.items.filter((item) => item.id !== gem.id); state.selected = null; save(); this.openCanvasPanel("inventory");
  }
  renderCanvasItemDetail(it) {
    if (this.canvasDetail) this.canvasDetail.destroy(); if (!this.canvasPanel) return;
    const x = this.scale.width / 2 + 210, y = this.scale.height - 180;
    this.canvasDetail = this.add.container(x, y); this.canvasPanel.add(this.canvasDetail);
    this.canvasDetail.add(this.add.text(0, 0, it?.name || "ВЫБЕРИТЕ ПРЕДМЕТ", {fontFamily: "Georgia, serif", fontSize: "18px", color: it ? RARITIES[it.rarity].color : "#b49e7a"}));
    if (it) this.canvasDetail.add(this.add.text(0, 32, it.description || `${it.kind === "weapon" ? "Оружие" : it.kind === "armor" ? "Броня" : "Добыча"}\nСтоимость: ◈ ${it.value}`, {fontFamily: "monospace", fontSize: "11px", color: "#c9bda2", lineSpacing: 6}));
  }
  drawCanvasExpedition() { const x = this.scale.width / 2, y = 180; this.canvasPanel.add(this.add.image(x, y + 70, "hs-guide-0").setScale(0.65)); this.canvasPanel.add(this.add.text(x, y + 150, "3:30 ДО ПРИХОДА ТЬМЫ\n12 КОМНАТ • 3 ВЫХОДА • БЕСКОНЕЧНЫЕ ВОЛНЫ", {fontFamily: "monospace", fontSize: "14px", color: "#dfc98f", align: "center", lineSpacing: 10}).setOrigin(0.5)); this.createCanvasButton(x, y + 245, 220, 40, "СПУСТИТЬСЯ В ДАНЖ", () => { state.mode = "raid"; state.profile.inRaid = true; state.profile.runs++; save(); closePanel(); this.startRaid(); }); }
  drawCanvasVendor() { const x = this.scale.width / 2 - 250, y = 140; this.canvasPanel.add(this.add.image(x - 60, y + 80, "trader-0").setScale(2.2)); this.canvasPanel.add(this.add.text(x, y, "ТОРГОВЕЦ РЕН", {fontFamily: "Georgia, serif", fontSize: "25px", color: "#e0c886"})); ["staff", "sword", "armor", "fire", "multi", "haste"].forEach((type, i) => { const ix = x + (i % 3) * 170, iy = y + 80 + Math.floor(i / 3) * 110; this.canvasPanel.add(this.add.image(ix, iy, this.itemTexture({icon: DEFS[type].icon})).setDisplaySize(40, 55)); this.createCanvasButton(ix + 62, iy, 100, 30, `${DEFS[type].name}\n◈ ${DEFS[type].kind === "weapon" ? 45 : 25}`, () => { const cost = DEFS[type].kind === "weapon" ? 45 : 25; if (state.profile.gold < cost || !put(state.profile.bag, item(type, 1))) return toast("Не хватает золота или места"); state.profile.gold -= cost; save(); this.openCanvasPanel("vendor"); }); }); this.createCanvasButton(x + 210, y + 330, 220, 34, "БЕСПЛАТНЫЙ НАБОР", () => { if (state.profile.equipment.weapon || state.profile.bag.items.some((i) => i.kind === "weapon") || state.profile.stash.items.some((i) => i.kind === "weapon")) return toast("Оружие уже есть"); const kit = starter(); state.profile.equipment.weapon = kit.weapon; state.profile.equipment.armor ||= kit.armor; save(); this.openCanvasPanel("vendor"); }); }
  drawCanvasHelp() { const x = this.scale.width / 2, y = 145; this.canvasPanel.add(this.add.text(x - 300, y, "ПАМЯТКА СТРАННИКА", {fontFamily: "Georgia, serif", fontSize: "25px", color: "#e0c886"})); this.canvasPanel.add(this.add.text(x - 300, y + 58, "WASD — движение\nE — обыск, руны, выход\nI — инвентарь\nSPACE — рывок\nQ — назначенное ледяное кольцо\n\nКамни поддержки действуют рядом с камнем умения.\nУспейте вынести добычу до прихода тьмы.", {fontFamily: "monospace", fontSize: "14px", color: "#cdbf9c", lineSpacing: 9})); }
  showCanvasResult(success) { this.resultSuccess = success; this.openCanvasPanel("result"); }

  drawCanvasResult() { const success = this.resultSuccess === true; const x = this.scale.width / 2, y = 190; this.canvasPanel.add(this.add.text(x, y, success ? "ЭВАКУАЦИЯ УСПЕШНА" : "ВЫЛАЗКА ПОТЕРЯНА", {fontFamily: "Georgia, serif", fontSize: "28px", color: success ? "#d9d09a" : "#d47565"}).setOrigin(0.5)); this.canvasPanel.add(this.add.text(x, y + 70, success ? "Добыча сохранена в вашем профиле." : "Рюкзак, экипировка и вставленные камни исчезли. Тайник уцелел.", {fontFamily: "monospace", fontSize: "13px", color: "#cbbd9c"}).setOrigin(0.5)); this.createCanvasButton(x, y + 150, 220, 40, "ВЕРНУТЬСЯ В УБЕЖИЩЕ", () => { state.panel = null; state.mode = "hub"; this.startHub(); }); }
  openCanvasLevel(options, apply) { this.closeCanvasPanel(); this.canvasPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(12000); this.canvasPanel.add(this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 650, 450, 0x120b0d, 0.96).setStrokeStyle(2, 0xc89f5d)); this.canvasPanel.add(this.add.text(this.scale.width / 2, 120, "СИЛА ПРОБУЖДАЕТСЯ", {fontFamily: "Georgia, serif", fontSize: "26px", color: "#e4d19c"}).setOrigin(0.5)); options.forEach((option, i) => { const y = 200 + i * 84, card = this.add.rectangle(this.scale.width / 2, y, 520, 64, 0x2b171d, 0.9).setStrokeStyle(1, 0x8e633d).setInteractive({useHandCursor: true}); const tx = this.add.text(this.scale.width / 2 - 220, y - 20, `${option.icon}  ${option.name}\n${option.text}`, {fontFamily: "monospace", fontSize: "12px", color: "#e1cc94", lineSpacing: 4}); card.on("pointerdown", () => { apply(option); state.panel = null; this.closeCanvasPanel(); this.renderOverlay(true); }); this.canvasPanel.add([card, tx]); }); }
  refreshCanvasSearch() { if (state.panel === "container") this.openCanvasPanel("container", state.search); }
  resize() {
    this.vignette?.setDisplaySize(this.scale.width, this.scale.height);
    if (state.mode === "hub") this.cameras.main.centerOn(544, 424);
    if (this.ui) this.renderOverlay(true);
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
      this.setHeroDirection(dx, dy);
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
    if (this.heroModel) this.heroModel.setPosition(this.hero.x, this.hero.y).setDepth(this.hero.y + 20);
    this.shadow
      .setPosition(this.hero.x, this.hero.y + 17)
      .setDepth(this.hero.y - 1);
    this.heroRing
      .setPosition(this.hero.x, this.hero.y + 18)
      .setDepth(this.hero.y);
    this.heroLight.setPosition(this.hero.x, this.hero.y).setDepth(1);
    if (this.heroGear) this.heroGear.setPosition(this.hero.x, this.hero.y).setDepth(this.hero.y + 21).setScale(dx < 0 ? -1 : 1, 1);
    const nearby = this.objects
      .filter((o) => o === this.hoverObject)
      .filter((o) => Math.hypot(o.x - this.hero.x, o.y - this.hero.y) < 76)
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(this.hero.x, this.hero.y, a.x, a.y) -
          Phaser.Math.Distance.Between(this.hero.x, this.hero.y, b.x, b.y),
      )[0];
    this.setInteractionText(this.extraction
      ? `ЭВАКУАЦИЯ ${Math.max(0, 3 - this.extraction.progress).toFixed(1)} С • НЕ ДВИГАЙТЕСЬ`
      : nearby
        ? `E  ${nearby.label.text}${nearby.type === "exit" ? " • " + this.exitCondition(nearby.exitType) : ""}`
        : "");
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
    this.updateFog();
    if (state.panel === "container" && state.search) {
      const c = state.search;
      if (Math.hypot(c.x - this.hero.x, c.y - this.hero.y) > 100) {
        closePanel();
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
        this.navigationMap || this.map,
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
    const roll = this.random();
    const type = this.wave < 2 ? (roll < 0.45 ? "skeleton" : "zombie") : roll < 0.18 ? "bat" : roll < 0.38 ? "rat" : roll < 0.58 ? "imp" : roll < 0.76 ? "archer" : roll < 0.88 ? "skeleton" : "zombie";
    const base = type === "skeleton" ? "hs-skeleton-down-0" : type === "zombie" ? "hs-zombie-down-0" : `hs-${type}-down-0`;
    const mobAnim=this.anims.exists(`mob-${type}-walk-down`)?`mob-${type}-walk-down`:`hs-${type}-down`;
    const sprite = this.add.sprite(x, y, base).play(mobAnim);
    const scale = type === "bat" ? 0.8 : type === "rat" ? 0.78 : type === "imp" ? 0.95 : type === "archer" ? 1.05 : type === "zombie" ? 1.15 : 1;
    sprite.setScale(scale).setOrigin(.5,1);
    const stats = {skeleton: [53, 1], zombie: [39, 1.15], bat: [92, 0.65], rat: [78, 0.6], imp: [48, 0.9], archer: [31, 1.05]}[type];
    this.enemies.push({
      sprite,
      type,
      hp: Math.round((22 + this.wave * 8) * stats[1]),
      maxHP: Math.round((22 + this.wave * 8) * stats[1]),
      speed: stats[0] + Math.min(60, this.wave * 3),
      hit: 0,
      shoot: 1.5 + this.random(),
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
      const distance = Math.hypot(s.x - this.hero.x, s.y - this.hero.y);
      const a = Math.atan2(target.y - s.y, target.x - s.x);
      const aim = Math.atan2(this.hero.y - s.y, this.hero.x - s.x);
      if (e.type !== "archer" || distance > 240) this.moveBody(s, Math.cos(a) * e.speed * dt, Math.sin(a) * e.speed * dt, 8);
      const facing = e.type === "archer" && distance < 240 ? aim : a;
      const horizontal = Math.abs(Math.cos(facing)) > Math.abs(Math.sin(facing));
      const direction = horizontal ? "left" : Math.sin(facing) < 0 ? "up" : "down";
      e.strike = Math.max(0,(e.strike||0)-dt);
      const attack = this.anims.exists(`mob-${e.type}-attack-${direction}`)?`mob-${e.type}-attack-${direction}`:`original-atk-${e.type}-${direction}`;
      const movement = e.type === "archer" && distance < 240 ? "idle" : "walk";
      const locomotion = this.anims.exists(`mob-${e.type}-${movement}-${direction}`)?`mob-${e.type}-${movement}-${direction}`:`hs-${e.type}-${direction}`;
      const anim = e.strike>0 && this.anims.exists(attack) ? attack : locomotion;
      if (s.anims.currentAnim?.key !== anim) s.play(anim);
      s.setDepth(s.y + 15).setFlipX(horizontal && Math.cos(facing) > 0);
      if (e.type === "archer") {
        e.shoot -= dt;
        if (e.shoot <= 0 && distance < 330) {
          e.shoot = Math.max(0.7, 2.3 - this.wave * 0.08);
          e.strike = .5;
          const projectile = this.add.image(s.x+Math.cos(aim)*12, s.y-12, "hs-archer-projectile-0").setRotation(aim).setScale(1).setDepth(s.y + 4);
          this.enemyBullets.push({sprite: projectile, vx: Math.cos(aim) * 210, vy: Math.sin(aim) * 210, life: 2.1, damage: 7 + this.wave});
        }
      }
      e.hit = Math.max(0, e.hit - dt);
      if (!e.hit) s.clearTint();
      if (
        Math.hypot(s.x - this.hero.x, s.y - this.hero.y) < 24 &&
        this.invincible <= 0
      ) {
        const defense = Object.values(state.profile.equipment).reduce((sum, gear) => sum + (gear?.armor || 0) * RARITIES[gear?.rarity || 0].mult, 0);
        e.strike = .55;
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
    this.enemyBullets = this.enemyBullets.filter((b) => {
      b.life -= dt; b.sprite.x += b.vx * dt; b.sprite.y += b.vy * dt;
      if (Math.hypot(b.sprite.x - this.hero.x, b.sprite.y - this.hero.y) < 18 && this.invincible <= 0) {
        this.hp -= b.damage; this.invincible = 0.45; this.extraction = null; b.life = 0; this.cameras.main.shake(50, 0.002);
        if (this.hp <= 0) finishRaid(false);
      }
      const alive = b.life > 0 && this.canWalk(b.sprite.x, b.sprite.y, 1); if (!alive) b.sprite.destroy(); return alive;
    });
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
      this.attackUntil = this.clock + .3;
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
        const sprite = this.add.sprite(this.hero.x, this.hero.y,
          skill.type === "slash" ? "original-slash-0" : skill.type === "arrow" ? "hs-archer-projectile-0" : "original-fireball-0").setScale(skill.type === "slash" ? 0.55 : skill.type === "arrow" ? 0.7 : 0.65);
        if(skill.type !== 'arrow') sprite.play(skill.type==='slash'?'original-slash':'original-fireball');
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
      const orb = this.add.image(e.sprite.x, e.sprite.y, 'original-experience-0').setScale(.55).setDepth(5);
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
      const direction = e.sprite.anims.currentAnim?.key.split('-').at(-1)||'down';
      const death = this.anims.exists(`mob-${e.type}-dies-${direction}`)?`mob-${e.type}-dies-${direction}`:`original-death-${e.type}-${direction}`;
      if(this.anims.exists(death)) { e.sprite.clearTint().play(death).setDepth(e.sprite.y-1);this.tweens.add({targets:e.sprite,alpha:0,delay:8000,duration:2000,onComplete:()=>e.sprite.destroy()}); }
      else e.sprite.destroy();
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
    this.renderOverlay();
  }
  drawMinimap() {
    if (!this.hudMap || !this.map) return;
    const w = this.scale.width, sx = 220 / this.map.w, sy = 104 / this.map.h, ox = w - 258, oy = 54;
    this.hudMap.clear().fillStyle(0x0d1113, 0.96).fillRect(ox, oy, 220, 104);
    for (let y = 0; y < this.map.h; y++) for (let x = 0; x < this.map.w; x++) if (this.map.tiles[y][x]) this.hudMap.fillStyle(state.mode === "raid" ? 0x303238 : 0x4b3432, 0.6).fillRect(ox + x * sx, oy + y * sy, sx + 1, sy + 1);
    for (const n of this.discovered || []) { const r = this.map.rooms[n]; this.hudMap.fillStyle(0x9a7555, 0.58).fillRect(ox + r.x * sx, oy + r.y * sy, r.w * sx, r.h * sy); }
    for (const o of this.objects || []) if (o.type === "exit" && (state.mode !== "raid" || this.discovered.has(this.map.rooms.findIndex((r) => Math.abs(r.cx * T + 16 - o.x) < 64)))) this.hudMap.fillStyle([0xe0bb65, 0xb39ae2, 0x85b99a][o.exitType]).fillRect(ox + (o.x / T) * sx - 2, oy + (o.y / T) * sy - 2, 4, 4);
    if (this.hero) this.hudMap.fillStyle(0xece7c7).fillCircle(ox + (this.hero.x / T) * sx, oy + (this.hero.y / T) * sy, 3);
  }
}
const simulationRaid = RaidScene.prototype.startRaid;
installPresentation(RaidScene);
installWorld(RaidScene, simulationRaid);
