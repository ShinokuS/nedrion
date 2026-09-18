import Phaser from "phaser";
import { RaidScene } from "./scene.js";
import {
  DEFS,
  RARITIES,
  grid,
  item,
  put,
  move,
  starter,
  newProfile,
  recoverProfile,
  loseRaid,
  equippedSkills,
} from "./core.js";
import "./style.css";

const SAVE = "nedrion.profile.v1";
let raw = null;
try {
  raw = localStorage.getItem(SAVE);
} catch {}
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
const app = document.querySelector("#app");
app.innerHTML = `<header><a class="brand" href="#" aria-label="Nedrion">N<span>Е</span>DRION<small>ПОСЛЕДНИЙ ОГОНЬ</small></a><nav><span class="live-dot"></span><span id="location">УБЕЖИЩЕ СТРАННИКОВ</span><span class="tag">ПРОТОТИП 0.1</span></nav><div class="wallet"><span>◈</span> <b id="gold">100</b><small>ЗОЛОТО</small></div></header><main><aside id="left"></aside><section class="viewport"><div id="game"></div><div id="scene-top"></div><div id="context"></div><div id="bottom-hud"></div><div id="toast" role="status"></div></section><aside id="right"></aside></main><footer><span><kbd>W A S D</kbd> движение <kbd>E</kbd> взаимодействие <kbd>I</kbd> инвентарь <kbd>Space</kbd> рывок <kbd>Q</kbd> умение</span><button id="help">Как играть <span>?</span></button></footer><div id="modal-root"></div>`;
export function save() {
  if (
    state.profile.active &&
    !equippedSkills(state.profile.equipment).some(
      (g) => g.id === state.profile.active,
    )
  )
    state.profile.active = null;
  try {
    localStorage.setItem(SAVE, JSON.stringify(state.profile));
  } catch {
    toast("Не удалось сохранить: хранилище браузера недоступно.");
  }
  document.querySelector("#gold").textContent = state.profile.gold;
}
export function toast(message) {
  const e = document.querySelector("#toast");
  e.textContent = message;
  e.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => e.classList.remove("visible"), 3300);
}
export function icon(it) {
  const symbols = { coin: "◈" };
  return symbols[it.icon]
    ? `<span class="item-symbol">${symbols[it.icon]}</span>`
    : `<img draggable="false" src="${import.meta.env.BASE_URL}assets/${it.icon}-0.png" alt=""/>`;
}
function skillList() {
  const skills = equippedSkills(state.profile.equipment);
  return skills.length
    ? skills
        .map(
          (s) =>
            `<div class="skill-row">${icon(s)}<div><b>${s.name}</b><small>${s.supports.length ? s.supports.map((k) => DEFS[k].name).join(" · ") : "Нет соседних поддержек"}</small></div><span class="auto">${state.profile.active === s.id ? "Q" : "АВТО"}</span></div>`,
        )
        .join("")
    : '<p class="muted">Вставьте камень умения в оружие.</p>';
}
export function renderHUD() {
  const p = state.profile,
    raid = state.mode === "raid",
    s = state.scene;
  document.querySelector("#location").textContent = raid
    ? "КАТАКОМБЫ ЗАБЫТЫХ"
    : "УБЕЖИЩЕ СТРАННИКОВ";
  document.querySelector("#gold").textContent = p.gold;
  document.querySelector("#left").innerHTML =
    `<div class="eyebrow">${raid ? "ЭКСПЕДИЦИЯ  /  I" : "БЕЗОПАСНАЯ ЗОНА"}</div><h1>${raid ? "Катакомбы<br>забытых" : "Последний<br>огонь"}</h1><p class="intro">${raid ? "Заберите то, за чем пришли.<br>Успейте вернуться." : "За стенами убежища всё имеет цену.<br>Особенно путь назад."}</p><div class="divider"></div>${raid ? `<div class="eyebrow">ДО ПРИХОДА ТЬМЫ</div><div class="timer" id="timer">03:30</div><div class="thin-track"><i id="time-fill"></i></div><div class="stat-row"><span>Волна</span><b id="wave">01</b></div><div class="stat-row"><span>Убито</span><b id="kills">0</b></div><div class="stat-row"><span>Комнаты</span><b id="rooms">1 / 12</b></div><div class="divider"></div><div class="eyebrow">ПУТИ ЭВАКУАЦИИ</div><div id="exits"></div>` : `<div class="eyebrow">ПОДГОТОВКА К ВЫЛАЗКЕ</div><button class="hub-action" data-panel="stash"><span class="action-icon">▦</span><span><b>Тайник</b><small>Сохраните ценное</small></span><span>↗</span></button><button class="hub-action" data-panel="vendor"><span class="action-icon">⚖</span><span><b>Торговец Рен</b><small>Снаряжение и припасы</small></span><span>↗</span></button><button class="hub-action" data-panel="inventory"><span class="action-icon">◇</span><span><b>Снаряжение</b><small>Камни и связи</small></span><span>↗</span></button><div class="divider"></div><div class="stat-row"><span>Экспедиции</span><b>${p.runs.toString().padStart(2, "0")}</b></div><div class="stat-row"><span>Возвращения</span><b>${p.extractions.toString().padStart(2, "0")}</b></div><div class="field-note"><span>ПАМЯТКА СТРАННИКА</span>Вынесенный лут остаётся с вами. Смерть забирает всё, что вы взяли в данж.</div>`}`;
  document.querySelector("#right").innerHTML =
    `<div class="eyebrow">${raid ? "КАРТА ПОДЗЕМЕЛЬЯ" : "ВАШ СТРАННИК"}</div>${raid ? '<canvas id="minimap" width="228" height="174"></canvas><div class="map-legend"><span>● Вы</span><span>◆ Выход</span><span>▪ Тайник</span></div>' : '<div class="portrait"><div class="portrait-ring"></div><img src="' + import.meta.env.BASE_URL + 'assets/hero-0.png" alt="Странник"/><span>ИЗГНАННИК</span></div>'}<div class="divider"></div><div class="eyebrow">СВЯЗАННЫЕ УМЕНИЯ</div>${skillList()}<button class="outline full" data-panel="inventory">Снаряжение <kbd>I</kbd></button><div class="divider"></div><div class="eyebrow">РЮКЗАК <span class="right-label">8 × 5</span></div><div id="bag-preview"></div><p class="small muted">${raid ? "Обыск не останавливает бой." : "Перенесите добычу в тайник перед вылазкой."}</p>`;
  document.querySelector("#bag-preview").append(makeGrid(p.bag, "bag", true));
  document.querySelector("#scene-top").innerHTML =
    `<div class="scene-label"><span class="live-dot"></span>${raid ? "КАТАКОМБЫ • УРОВЕНЬ I" : "УБЕЖИЩЕ • БЕЗОПАСНО"}</div><button class="icon-button" id="pause" title="Пауза">Ⅱ</button>`;
  document.querySelector("#pause").onclick = () => openPanel("pause");
  document.querySelector("#bottom-hud").innerHTML = raid
    ? `<div class="health-block"><span><b id="hp-text">100 / 100</b><small>ЗДОРОВЬЕ</small></span><div class="health-track"><i id="hp-fill"></i></div><div class="xp-track"><i id="xp-fill"></i></div></div><div class="level-badge">УР.<b id="level">1</b></div><div class="hotkey" id="dash-state"><kbd>SPACE</kbd><span>Рывок</span></div><div class="hotkey" id="q-state"><kbd>Q</kbd><span>Кольцо</span></div>`
    : `<div class="hub-caption"><span>ОГОНЬ ЕЩЁ ГОРИТ</span><p>Подготовьтесь. Следующая дверь ведёт во тьму.</p></div><button class="primary" id="enter">Начать вылазку <span>→</span></button>`;
  document
    .querySelector("#enter")
    ?.addEventListener("click", () => openPanel("expedition"));
  document
    .querySelectorAll("[data-panel]")
    .forEach((b) => (b.onclick = () => openPanel(b.dataset.panel)));
  if (raid && s) s.updateHUD();
}
export function makeGrid(g, source, mini = false, revealed = Infinity) {
  const wrap = document.createElement("div");
  wrap.className = "inventory-grid" + (mini ? " mini" : "");
  wrap.style.setProperty("--cols", g.w);
  wrap.style.setProperty("--rows", g.h);
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.style.gridColumn = x + 1;
      cell.style.gridRow = y + 1;
      cell.ondragover = (e) => e.preventDefault();
      cell.ondrop = (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData("text/plain") || "null");
        if (data) transfer(data.source, source, data.id, x, y);
      };
      wrap.append(cell);
    }
  g.items.forEach((it, index) => {
    const hidden = index >= revealed,
      b = document.createElement("button");
    b.className = `grid-item rarity-${it.rarity}${hidden ? " unidentified" : ""}`;
    b.style.gridColumn = `${it.x + 1} / span ${it.w}`;
    b.style.gridRow = `${it.y + 1} / span ${it.h}`;
    b.style.setProperty("--rarity", RARITIES[it.rarity].color);
    b.innerHTML = hidden
      ? "<span>?</span>"
      : icon(it) +
        (it.sockets
          ? '<span class="socket-dots">' +
            it.sockets.map((g) => (g ? "◆" : "◇")).join("") +
            "</span>"
          : "");
    b.title = hidden
      ? "Ещё не обыскано"
      : `${it.name} · ${RARITIES[it.rarity].name}${it.damage ? " · Урон " + Math.round(it.damage * RARITIES[it.rarity].mult) : ""}`;
    b.disabled = hidden;
    b.draggable = !hidden && !mini;
    b.ondragstart = (e) =>
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({ source, id: it.id }),
      );
    b.onclick = () => {
      if (mini) {
        openPanel("inventory");
        return;
      }
      state.selected = it;
      state.source = source;
      renderDetail();
    };
    b.ondblclick = () => {
      if (source === "container") transfer(source, "bag", it.id);
      else if (state.panel === "stash")
        transfer(source, source === "stash" ? "bag" : "stash", it.id);
    };
    wrap.append(b);
  });
  return wrap;
}
function sourceGrid(name) {
  return name === "bag"
    ? state.profile.bag
    : name === "stash"
      ? state.profile.stash
      : name === "container"
        ? state.search?.grid
        : undefined;
}
function transfer(from, to, id, x, y) {
  if (
    from === "container" &&
    state.search.grid.items.findIndex((i) => i.id === id) >=
      state.search.revealed
  )
    return;
  if (to === "container") {
    toast("В контейнер можно только заглянуть. Переносите добычу в рюкзак.");
    return;
  }
  const a = sourceGrid(from),
    b = sourceGrid(to);
  if (a && b && move(a, b, id, x, y)) {
    if (from === "container")
      state.search.revealed = Math.max(0, state.search.revealed - 1);
    state.selected = null;
    save();
    renderPanel();
    renderHUD();
  } else toast("Недостаточно свободного места.");
}
function shell(title, eyebrow, body, wide = false) {
  document.querySelector("#modal-root").innerHTML =
    `<div class="modal-shade ${state.mode === "raid" && ["container", "inventory"].includes(state.panel) ? "in-combat" : ""}"><section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${title}"><button class="close" aria-label="Закрыть">×</button><div class="eyebrow">${eyebrow}</div><h2>${title}</h2>${body}</section></div>`;
  document.querySelector(".close").onclick = closePanel;
}
export function openPanel(panel, search = null) {
  if (state.panel === "level" || state.panel === "result") return;
  state.panel = panel;
  state.selected = null;
  if (search) state.search = search;
  renderPanel();
}
export function closePanel() {
  if (state.panel === "level" || state.panel === "result") return;
  state.panel = null;
  state.selected = null;
  document.querySelector("#modal-root").innerHTML = "";
  state.scene?.input.keyboard.resetKeys();
}
export function isPaused() {
  return !!state.panel && !["container", "inventory"].includes(state.panel);
}
function renderEquipment() {
  const div = document.createElement("div");
  div.className = "equipment";
  for (const slot of ["weapon", "armor"]) {
    const it = state.profile.equipment[slot],
      e = document.createElement("div");
    e.className = "equip-card";
    e.innerHTML = `<span class="eyebrow">${slot === "weapon" ? "ОРУЖИЕ" : "ДОСПЕХ"}</span><button class="equipped-item">${it ? icon(it) + `<span>${it.name}</span>` : "Пустой слот"}</button><div class="sockets">${it ? it.sockets.map((g, n) => `<button data-socket="${n}" class="socket ${g?.kind || ""}" title="${g ? g.name : "Пустой сокет"}">${g ? icon(g) : "+"}</button>`).join('<span class="socket-link"></span>') : ""}</div>`;
    e.querySelector(".equipped-item").onclick = () => {
      if (it) {
        state.selected = it;
        state.source = slot;
        renderDetail();
      }
    };
    e.querySelectorAll("[data-socket]").forEach(
      (b) =>
        (b.onclick = () => {
          const index = +b.dataset.socket,
            g = it.sockets[index];
          if (
            state.selected &&
            ["skill", "support"].includes(state.selected.kind) &&
            state.source === "bag"
          ) {
            const gem = state.selected;
            if (g) {
              toast("Сначала извлеките установленный камень.");
              return;
            }
            if (
              gem.kind === "skill" &&
              !gem.accept.includes(state.profile.equipment.weapon?.weapon)
            ) {
              toast("Этот камень несовместим с оружием.");
              return;
            }
            it.sockets[index] = gem;
            state.profile.bag.items = state.profile.bag.items.filter(
              (i) => i.id !== gem.id,
            );
            state.selected = null;
          } else if (g) {
            if (!put(state.profile.bag, g)) {
              toast("Освободите место в рюкзаке.");
              return;
            }
            if (state.profile.active === g.id) state.profile.active = null;
            it.sockets[index] = null;
          } else {
            toast("Выберите камень в рюкзаке, затем нажмите на пустой сокет.");
            return;
          }
          save();
          renderPanel();
          renderHUD();
        }),
    );
    div.append(e);
  }
  return div;
}
export function renderPanel() {
  const panel = state.panel,
    p = state.profile;
  if (!panel) return;
  if (["inventory", "stash", "container"].includes(panel)) {
    shell(
      panel === "stash"
        ? "Тайник странника"
        : panel === "container"
          ? "Обыск контейнера"
          : "Снаряжение и камни",
      state.mode === "raid" ? "БОЙ ПРОДОЛЖАЕТСЯ" : "УБЕЖИЩЕ",
      `<div class="inventory-layout"><div><div id="equipment"></div><h3>Рюкзак <small>8 × 5</small></h3><div id="bag-grid"></div><p class="small muted">Перетаскивайте предметы по сетке. Камень → пустой сокет.</p></div><div id="other-column"></div><div id="item-detail" class="item-detail"><span class="detail-rune">◇</span><h3>Каждый камень меняет путь</h3><p>Выберите предмет, чтобы узнать свойства и доступные действия.</p><p class="small">Поддержка связывается с умениями только в соседних сокетах. Повторное нажатие на камень извлекает его.</p></div></div>`,
      true,
    );
    document.querySelector("#equipment").append(renderEquipment());
    document.querySelector("#bag-grid").append(makeGrid(p.bag, "bag"));
    const other = document.querySelector("#other-column");
    if (panel === "stash") {
      other.innerHTML = "<h3>Тайник <small>10 × 7</small></h3>";
      other.append(makeGrid(p.stash, "stash"));
    } else if (panel === "container") {
      other.innerHTML =
        '<h3>Содержимое <small id="search-label"></small></h3><div id="container-grid"></div><p class="small muted">Каждый предмет открывается отдельно. Двойной щелчок — забрать.</p>';
      updateSearch();
    } else {
      other.innerHTML =
        "<h3>Активные связи</h3>" +
        skillList() +
        '<p class="small muted">Огненный шар и кольцо универсальны. Стрела требует лук, разрез — меч.</p>';
      const nova = equippedSkills(p.equipment).find((s) => s.type === "nova");
      if (nova) {
        const b = document.createElement("button");
        b.className = "outline full";
        b.textContent =
          p.active === nova.id
            ? "Вернуть кольцо в автобой"
            : "Назначить ледяное кольцо на Q";
        b.onclick = () => {
          p.active = p.active === nova.id ? null : nova.id;
          save();
          renderPanel();
          renderHUD();
        };
        other.append(b);
      }
    }
    renderDetail();
    return;
  }
  if (panel === "vendor") {
    const stock = [
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
    ];
    shell(
      "Торговец Рен",
      "ПОСЛЕДНИЙ ОГОНЬ",
      `<p class="muted">«Вернёшься живым — сочтёмся».</p><div class="shop-grid">${stock.map((t) => `<button class="shop-item" data-buy="${t}">${icon(DEFS[t])}<span>${DEFS[t].name}<small>◈ ${DEFS[t].kind === "weapon" ? 45 : 25}</small></span></button>`).join("")}</div><div class="shop-footer"><button class="outline" id="free-kit">Бесплатный набор</button><span class="small muted">Если у вас не осталось оружия</span></div><h3>Продать из рюкзака</h3><div class="sell-list">${p.bag.items.map((i) => `<button class="outline" data-sell="${i.id}">${i.name} <b>◈ ${i.value}</b></button>`).join("") || '<span class="muted">Рюкзак пуст</span>'}</div>`,
    );
    document.querySelectorAll("[data-buy]").forEach(
      (b) =>
        (b.onclick = () => {
          const t = b.dataset.buy,
            cost = DEFS[t].kind === "weapon" ? 45 : 25;
          if (p.gold < cost) {
            toast("Недостаточно золота.");
            return;
          }
          if (!put(p.bag, item(t, 1))) {
            toast("В рюкзаке нет места.");
            return;
          }
          p.gold -= cost;
          save();
          renderPanel();
          renderHUD();
        }),
    );
    document.querySelectorAll("[data-sell]").forEach(
      (b) =>
        (b.onclick = () => {
          const it = p.bag.items.find((i) => i.id === b.dataset.sell);
          p.gold +=
            it.value +
            (it.sockets || []).filter(Boolean).reduce((a, g) => a + g.value, 0);
          p.bag.items = p.bag.items.filter((i) => i !== it);
          save();
          renderPanel();
          renderHUD();
        }),
    );
    document.querySelector("#free-kit").onclick = () => {
      const ownsWeapon =
        p.equipment.weapon ||
        [...p.bag.items, ...p.stash.items].some((i) => i.kind === "weapon");
      if (ownsWeapon) {
        toast("У вас уже есть оружие — проверьте рюкзак и тайник.");
        return;
      }
      const kit = starter();
      kit.weapon.value = 0;
      kit.weapon.sockets.filter(Boolean).forEach((g) => (g.value = 0));
      kit.armor.value = 0;
      p.equipment.weapon = kit.weapon;
      if (!p.equipment.armor) p.equipment.armor = kit.armor;
      save();
      renderPanel();
      renderHUD();
      toast("Рен выдал походный набор.");
    };
    return;
  }
  if (panel === "expedition") {
    shell(
      "Войти в катакомбы",
      "ЭКСПЕДИЦИЯ / УРОВЕНЬ I",
      `<p class="muted">Под старым монастырём открылись забытые залы. У вас будет <strong>3 минуты 30 секунд</strong>, прежде чем тьма начнёт поглощать подземелье.</p><div class="expedition-facts"><div><span>12</span>связанных комнат</div><div><span>3</span>пути эвакуации</div><div><span>∞</span>волн после таймера</div></div><p>Найдите ключ, активируйте три руны по порядку или уничтожьте 35 врагов. Затем доберитесь до соответствующего выхода и удержитесь рядом 3 секунды.</p><p class="warning">При смерти теряются рюкзак, экипировка и вставленные камни. Тайник и золото в убежище сохраняются.</p><button class="primary full" id="launch">Спуститься в подземелье →</button>`,
    );
    document.querySelector("#launch").onclick = () => {
      if (!equippedSkills(p.equipment).length) {
        toast("Сначала экипируйте оружие с совместимым камнем умения.");
        return;
      }
      closePanel();
      p.inRaid = true;
      p.runs++;
      save();
      state.mode = "raid";
      state.scene.startRaid();
      renderHUD();
    };
    return;
  }
  if (panel === "help" || panel === "pause") {
    shell(
      panel === "pause" ? "У огня времени" : "Памятка странника",
      panel === "pause" ? "ПАУЗА" : "КАК ИГРАТЬ",
      `<div class="help-text"><p><b>1. Подготовьтесь.</b> Откройте снаряжение. Камень в рюкзаке → пустой сокет. Соседняя поддержка открывает улучшения при получении уровня.</p><p><b>2. Исследуйте.</b> WASD / стрелки — движение. E — обыск, руны и выходы. Наведитесь к объекту; подсказка появится снизу. Автобой выбирает ближайшего врага.</p><p><b>3. Забирайте добычу.</b> Предметы раскрываются по очереди. Двойной щелчок переносит их в рюкзак. Во время обыска и открытого инвентаря бой продолжается.</p><p><b>4. Найдите выход.</b> Золотой: ключ в сундуке. Фиолетовый: руны I → II → III. Зелёный: 35 убийств. Выход — E и 3 секунды неподвижно; урон прерывает эвакуацию.</p><p><b>5. Вернитесь.</b> Переложите ценности в тайник или продайте. После смерти торговец выдаст бесплатный набор, если оружия больше нет.</p><p class="small muted">Space — рывок (4 сек.). Кольцо можно назначить на Q в снаряжении. Escape — закрыть окно / пауза. Закрытие вкладки в данже считается потерей вылазки.</p></div><button class="primary full" id="resume">${panel === "pause" ? "Продолжить" : "Понятно"}</button>`,
    );
    document.querySelector("#resume").onclick = closePanel;
  }
}
function renderDetail() {
  const el = document.querySelector("#item-detail"),
    it = state.selected;
  if (!el || !it) return;
  el.innerHTML = `<div class="detail-icon">${icon(it)}</div><div class="eyebrow" style="color:${RARITIES[it.rarity].color}">${RARITIES[it.rarity].name}</div><h3>${it.name}</h3><p>${it.description || (it.damage ? "Урон: " + Math.round(it.damage * RARITIES[it.rarity].mult) : it.armor ? "Броня: " + Math.round(it.armor * RARITIES[it.rarity].mult) : it.kind === "key" ? "Открывает костяные врата. Должен находиться в рюкзаке." : "Добыча для продажи торговцу.")}</p><div class="stat-row"><span>Размер</span><b>${it.w} × ${it.h}</b></div><div class="stat-row"><span>Стоимость</span><b>◈ ${it.value}</b></div><div id="detail-actions"></div>`;
  const actions = el.querySelector("#detail-actions");
  const action = (label, fn) => {
    const b = document.createElement("button");
    b.className = "outline full";
    b.textContent = label;
    b.onclick = fn;
    actions.append(b);
  };
  if (state.source === "bag" && ["weapon", "armor"].includes(it.kind))
    action("Экипировать", () => {
      const slot = it.kind,
        old = state.profile.equipment[slot],
        bag = state.profile.bag,
        backup = structuredClone(bag.items);
      bag.items = bag.items.filter((i) => i.id !== it.id);
      if (old && !put(bag, old)) {
        bag.items = backup;
        toast("Нет места для снятого предмета.");
        return;
      }
      state.profile.equipment[slot] = it;
      state.selected = null;
      save();
      renderPanel();
      renderHUD();
    });
  if (["weapon", "armor"].includes(state.source))
    action("Снять в рюкзак", () => {
      if (!put(state.profile.bag, it)) {
        toast("Недостаточно места.");
        return;
      }
      state.profile.equipment[state.source] = null;
      state.selected = null;
      save();
      renderPanel();
      renderHUD();
    });
  if (state.source === "container")
    action("Забрать", () => transfer("container", "bag", it.id));
  if (state.panel === "stash" && ["bag", "stash"].includes(state.source))
    action(state.source === "stash" ? "В рюкзак" : "В тайник", () =>
      transfer(state.source, state.source === "stash" ? "bag" : "stash", it.id),
    );
  if (state.source === "bag" && ["skill", "support"].includes(it.kind))
    actions.innerHTML +=
      '<p class="hint">Теперь нажмите на пустой сокет слева.</p>';
  if (state.source === "bag")
    action("Выбросить предмет", () => {
      state.profile.bag.items = state.profile.bag.items.filter(
        (i) => i.id !== it.id,
      );
      state.selected = null;
      save();
      renderPanel();
      renderHUD();
    });
}
export function updateSearch() {
  if (state.panel !== "container" || !state.search) return;
  const c = state.search;
  document.querySelector("#search-label").textContent =
    `${Math.min(c.revealed, c.grid.items.length)} / ${c.grid.items.length} найдено`;
  const el = document.querySelector("#container-grid");
  el.innerHTML = "";
  el.append(makeGrid(c.grid, "container", false, c.revealed));
}
export function showLevel(options, apply) {
  state.panel = "level";
  shell(
    "Сила пробуждается",
    "НОВЫЙ УРОВЕНЬ",
    `<p class="muted">Выберите улучшение до конца этой вылазки.</p><div class="upgrade-list">${options.map((o, i) => `<button class="upgrade" data-upgrade="${i}"><span>${o.icon}</span><div><h3>${o.name}</h3><p>${o.text}</p><small>${o.skill ? "ОТ СОСЕДНЕГО КАМНЯ ПОДДЕРЖКИ" : "БАЗОВОЕ УЛУЧШЕНИЕ"}</small></div><b>→</b></button>`).join("")}</div>`,
  );
  document.querySelector(".close").hidden = true;
  document.querySelectorAll("[data-upgrade]").forEach(
    (b) =>
      (b.onclick = () => {
        apply(options[+b.dataset.upgrade]);
        state.panel = null;
        document.querySelector("#modal-root").innerHTML = "";
      }),
  );
}
export function finishRaid(success) {
  if (state.mode !== "raid") return;
  const p = state.profile,
    s = state.scene,
    loot = p.bag.items.length;
  if (success) {
    p.inRaid = false;
    p.extractions++;
  } else loseRaid(p);
  save();
  state.mode = "result";
  state.panel = "result";
  shell(
    success ? "Вы вернулись к огню" : "Тьма забрала своё",
    success ? "ЭВАКУАЦИЯ УСПЕШНА" : "ВЫЛАЗКА ПОТЕРЯНА",
    `<div class="result-sigil">${success ? "✧" : "☠"}</div><p class="muted">${success ? "Всё, что вы вынесли, теперь в вашем рюкзаке." : "Рюкзак и снаряжение потеряны. Ваш тайник в безопасности."}</p><div class="expedition-facts"><div><span>${s.kills}</span>врагов убито</div><div><span>${s.level}</span>уровень</div><div><span>${success ? loot : 0}</span>предметов вынесено</div></div><button class="primary full" id="return">Вернуться в убежище →</button>`,
  );
  document.querySelector(".close").hidden = true;
  document.querySelector("#return").onclick = () => {
    state.panel = null;
    document.querySelector("#modal-root").innerHTML = "";
    state.mode = "hub";
    s.startHub();
    renderHUD();
  };
}
document.querySelector("#help").onclick = () => openPanel("help");
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyI") {
    if (state.panel === "inventory") closePanel();
    else if (!state.panel) openPanel("inventory");
  }
  if (e.code === "Escape") {
    if (state.panel) closePanel();
    else openPanel("pause");
  }
});
save();
renderHUD();
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#101719",
  pixelArt: true,
  antialias: false,
  scale: { mode: Phaser.Scale.RESIZE, width: 800, height: 720 },
  scene: [RaidScene],
  render: { roundPixels: true },
  audio: { noAudio: true },
});
if (import.meta.env.DEV && new URLSearchParams(location.search).has("smoke"))
  import("../tests/browser-smoke.js");
