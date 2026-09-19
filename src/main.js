import Phaser from "phaser";
import { RaidScene } from "./scene.js";
import { equippedSkills, loseRaid, newProfile, recoverProfile } from "./core.js";
import "./style.css";

const SAVE = "nedrion.profile.v1";
let raw = null;
try { raw = localStorage.getItem(SAVE); } catch {}

// The page deliberately contains only a canvas. Menus and HUD are Phaser objects
// using the original Hero Siege UI sprites, so the game also works fullscreen.
document.querySelector("#app").innerHTML = '<div id="game"></div>';

export const state = {
  profile: raw ? recoverProfile(raw) : newProfile(),
  scene: null,
  mode: "hub",
  panel: null,
  selected: null,
  source: null,
  search: null,
  result: null,
};

export function save() {
  if (state.profile.active && !equippedSkills(state.profile.equipment).some((skill) => skill.id === state.profile.active)) state.profile.active = null;
  try { localStorage.setItem(SAVE, JSON.stringify(state.profile)); } catch { toast("Невозможно сохранить профиль"); }
}
export function toast(message) { state.scene?.toastCanvas(message); }
export function renderHUD() { state.scene?.renderOverlay(true); }
export function openPanel(panel, search = null) { state.panel = panel; state.search = search; state.selected = null; state.scene?.openCanvasPanel(panel, search); }
export function closePanel() { state.panel = null; state.search = null; state.selected = null; state.scene?.closeCanvasPanel(); }
export function isPaused() { return !!state.panel && !["container", "inventory"].includes(state.panel); }
export function updateSearch() { state.scene?.refreshCanvasSearch(); }
export function showLevel(options, apply) { state.panel = "level"; state.scene?.openCanvasLevel(options, apply); }
export function finishRaid(success) {
  if (state.mode !== "raid") return;
  const profile = state.profile;
  if (success) { profile.inRaid = false; profile.extractions++; } else loseRaid(profile);
  save(); state.mode = "result"; state.panel = "result"; state.scene?.showCanvasResult(success);
}

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#090708",
  pixelArt: true,
  antialias: false,
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1280, height: 720 },
  scene: [RaidScene],
  render: { roundPixels: true },
  audio: { noAudio: true },
});

if(import.meta.env.DEV && new URLSearchParams(location.search).has('smoke')) import('../tests/browser-smoke.js');

if(import.meta.env.DEV && new URLSearchParams(location.search).has('inspect')) import('../tests/visual-fixture.js');
