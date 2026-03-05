/* ============================================================
   Germs.io Clone - Main JavaScript
   Handles: canvas game loop, menu, panels, settings, party
============================================================ */

// ── State ────────────────────────────────────────────────────
const state = {
  inGame: false,
  spectating: false,
  settings: {
    showNames: 'All',
    showSkins: 'All',
    animSpeed: 50,
    autoZoom: true,
    mouseArrow: false,
    showMass: false,
    hideFood: false,
    hideBorder: false,
    profanityFilter: true,
    hideXP: false,
    hideChat: false,
    theme: 'hex',
    color: 'gray',
    region: 'na',
    keybinds: {
      feed: 'W',
      split: 'Space',
      doublesplit: 'E',
      triplesplit: 'R',
      '16split': 'T',
      freeze: 'Q',
      vertical: 'F',
      hideui: 'H',
    }
  },
  nick: '',
  party: { code: null, members: [] },
  player: { x: 0, y: 0, mass: 20, cells: [] },
  foods: [],
  viruses: [],
  others: [],
  camera: { x: 0, y: 0, zoom: 1 },
  mouseX: 0, mouseY: 0,
  hudHidden: false,
};

// Load settings from localStorage-free persistence (in-memory only for artifact compat)
function loadSettings() {
  try {
    const saved = window.__germSettings;
    if (saved) Object.assign(state.settings, saved);
  } catch { }
}

function saveSettings() {
  window.__germSettings = { ...state.settings };
}

loadSettings();

// ── Canvas Setup ────────────────────────────────────────────
const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Game World ───────────────────────────────────────────────
const WORLD = { w: 6000, h: 6000 };
const COLORS = [
  '#e94560', '#4ecdc4', '#f7b731', '#a29bfe', '#fd79a8',
  '#00b894', '#e17055', '#74b9ff', '#55efc4', '#ffeaa7'
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function initWorld() {
  // Spawn foods
  state.foods = [];
  for (let i = 0; i < 600; i++) {
    state.foods.push({
      x: Math.random() * WORLD.w,
      y: Math.random() * WORLD.h,
      r: 5 + Math.random() * 4,
      color: randomColor(),
    });
  }

  // Spawn viruses
  state.viruses = [];
  for (let i = 0; i < 30; i++) {
    state.viruses.push({
      x: Math.random() * WORLD.w,
      y: Math.random() * WORLD.h,
      r: 50,
    });
  }

  // Spawn AI blobs - avoid spawning near player start (center)
  state.others = [];
  for (let i = 0; i < 20; i++) {
    const mass = 30 + Math.random() * 200;
    // Keep AI away from center 800px radius where player spawns
    let ox, oy;
    do {
      ox = Math.random() * WORLD.w;
      oy = Math.random() * WORLD.h;
    } while (Math.hypot(ox - WORLD.w / 2, oy - WORLD.h / 2) < 800);
    state.others.push({
      x: ox, y: oy,
      r: massToRadius(mass),
      mass,
      color: randomColor(),
      name: randomName(),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    });
  }

  // Player
  state.player.x = WORLD.w / 2;
  state.player.y = WORLD.h / 2;
  state.player.mass = 20;
  state.player.cells = [{
    x: WORLD.w / 2, y: WORLD.h / 2,
    r: massToRadius(20),
    mass: 20,
    color: randomColor(),
    vx: 0, vy: 0,
  }];
  state.camera.x = WORLD.w / 2;
  state.camera.y = WORLD.h / 2;
  state.camera.zoom = 1;

  state.score = { food: 0, cells: 0, maxMass: 20, startTime: Date.now() };
  state.dying = false;
  state.spawnGrace = 3.0; // 3 seconds of invincibility at spawn
}

const AI_NAMES = ['xXx_blob', 'FatCell', 'NomNom', 'SplitKing', 'TinyTerror', 'GermBoss', 'CellCrusher', 'BigMac', 'EatMore', 'SlimShady'];
function randomName() { return AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)]; }

function massToRadius(mass) { return Math.sqrt(mass) * 5; }

// ── Game Loop ────────────────────────────────────────────────
let lastTime = 0;
let animFrame;

function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.1);
  lastTime = ts;

  if (state.inGame || state.spectating) {
    update(dt);
    render();
  } else {
    renderMenuBackground();
  }

  animFrame = requestAnimationFrame(gameLoop);
}

function update(dt) {
  if (!state.inGame) return;

  const cells = state.player.cells;

  // Move cells toward mouse
  cells.forEach(cell => {
    const cx = (cell.x - state.camera.x) * state.camera.zoom + canvas.width / 2;
    const cy = (cell.y - state.camera.y) * state.camera.zoom + canvas.height / 2;
    const dx = state.mouseX - cx;
    const dy = state.mouseY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const speed = (40 / Math.sqrt(cell.mass)) * dt * 60;
      cell.vx = (dx / dist) * speed;
      cell.vy = (dy / dist) * speed;
    }

    cell.x = Math.max(cell.r, Math.min(WORLD.w - cell.r, cell.x + cell.vx));
    cell.y = Math.max(cell.r, Math.min(WORLD.h - cell.r, cell.y + cell.vy));
  });

  // Update camera to centroid
  if (cells.length > 0) {
    const tx = cells.reduce((s, c) => s + c.x, 0) / cells.length;
    const ty = cells.reduce((s, c) => s + c.y, 0) / cells.length;
    state.camera.x += (tx - state.camera.x) * 0.08;
    state.camera.y += (ty - state.camera.y) * 0.08;
    state.player.x = state.camera.x;
    state.player.y = state.camera.y;

    const totalMass = cells.reduce((s, c) => s + c.mass, 0);
    const targetZoom = Math.max(0.15, Math.min(2, 500 / (massToRadius(totalMass) * 2.5)));
    state.camera.zoom += (targetZoom - state.camera.zoom) * 0.05;

    // Update leaderboard & XP (inside cells check to avoid ReferenceError)
    updateLeaderboard(totalMass);

    const xpEl = document.querySelector('#xp-fill');
    const xpLbl = document.querySelector('#xp-count');
    if (xpEl) {
      const xp = Math.min(state.score.food * 2, 50);
      xpEl.style.width = (xp / 50 * 100) + '%';
      if (xpLbl) xpLbl.textContent = `${xp}/50 XP`;
    }

  } // end if (cells.length > 0)

  // Move AI blobs
  state.others.forEach(o => {
    o.x = Math.max(o.r, Math.min(WORLD.w - o.r, o.x + o.vx * 30 * dt));
    o.y = Math.max(o.r, Math.min(WORLD.h - o.r, o.y + o.vy * 30 * dt));

    if (o.x <= o.r || o.x >= WORLD.w - o.r) o.vx *= -1;
    if (o.y <= o.r || o.y >= WORLD.h - o.r) o.vy *= -1;

    // Small AI growth
    o.mass += 0.01;
    o.r = massToRadius(o.mass);
  });

  // Eat food
  cells.forEach(cell => {
    for (let i = state.foods.length - 1; i >= 0; i--) {
      const f = state.foods[i];
      const dx = cell.x - f.x;
      const dy = cell.y - f.y;
      if (dx * dx + dy * dy < (cell.r + f.r) * (cell.r + f.r)) {
        cell.mass += f.r * 0.5;
        cell.r = massToRadius(cell.mass);
        state.foods.splice(i, 1);
        state.score.food++;
        // Respawn
        state.foods.push({
          x: Math.random() * WORLD.w,
          y: Math.random() * WORLD.h,
          r: 5 + Math.random() * 4,
          color: randomColor(),
        });
      }
    }
  });

  // Track max mass
  const currentMass = cells.reduce((s, c) => s + c.mass, 0);
  if (currentMass > state.score.maxMass) state.score.maxMass = currentMass;

  // Eat AI
  cells.forEach(cell => {
    for (let i = state.others.length - 1; i >= 0; i--) {
      const o = state.others[i];
      const dx = cell.x - o.x;
      const dy = cell.y - o.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < cell.r - o.r * 0.5 && cell.mass > o.mass * 1.15) {
        cell.mass += o.mass;
        cell.r = massToRadius(cell.mass);
        state.score.cells++;
        state.others.splice(i, 1);
        // Respawn
        const mass = 30 + Math.random() * 200;
        state.others.push({
          x: Math.random() * WORLD.w,
          y: Math.random() * WORLD.h,
          r: massToRadius(mass),
          mass,
          color: randomColor(),
          name: randomName(),
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
        });
      }
    }
  });

  // Decrement grace period
  if (state.spawnGrace > 0) state.spawnGrace -= dt;

  // Check if eaten by AI (only after grace period)
  if (state.spawnGrace <= 0) {
    for (const o of state.others) {
      for (let ci = cells.length - 1; ci >= 0; ci--) {
        const cell = cells[ci];
        const dx = o.x - cell.x;
        const dy = o.y - cell.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < o.r - cell.r * 0.5 && o.mass > cell.mass * 1.15) {
          cells.splice(ci, 1);
        }
      }
    }
  }

  if (cells.length === 0 && !state.dying) {
    // Death - guard flag prevents firing multiple times
    state.dying = true;
    setTimeout(() => endMatch(), 300);
  }

  // Merge split cells
  if (cells.length > 1) {
    cells.forEach((a, ai) => {
      cells.forEach((b, bi) => {
        if (ai === bi) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < a.r * 0.5 && a._splitTimer > 3) {
          a.mass += b.mass;
          a.r = massToRadius(a.mass);
          cells.splice(bi, 1);
        }
      });
    });
  }

  // Increment split timers
  cells.forEach(c => { if (!c._splitTimer) c._splitTimer = 0; c._splitTimer += dt; });
}

function updateLeaderboard(playerMass) {
  const list = document.querySelector('#leaderboardList');
  if (!list) return;
  const nick = state.nick || 'You';
  const entries = [
    { name: nick, mass: Math.round(playerMass), isPlayer: true },
    ...state.others.map(o => ({ name: o.name, mass: Math.round(o.mass) }))
  ].sort((a, b) => b.mass - a.mass).slice(0, 10);

  list.innerHTML = entries.map(e =>
    `<li class="lb-item${e.isPlayer ? ' lb-you' : ''}">${e.name}<span>${e.mass}</span></li>`
  ).join('');
}

function render() {
  const W = canvas.width, H = canvas.height;
  const { camera } = state;

  ctx.clearRect(0, 0, W, H);

  // Background
  const bgColor = state.settings.color === 'white' ? '#f0f0f0'
    : state.settings.color === 'black' ? '#0a0a0a' : '#1a1a2e';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // Draw grid/pattern
  drawBackground(W, H);

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // Border
  if (!state.settings.hideBorder) {
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3 / camera.zoom;
    ctx.strokeRect(0, 0, WORLD.w, WORLD.h);
  }

  // Food
  if (!state.settings.hideFood) {
    state.foods.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();
    });
  }

  // Viruses
  state.viruses.forEach(v => {
    drawVirus(v.x, v.y, v.r);
  });

  // AI blobs
  state.others.forEach(o => {
    drawCell(o.x, o.y, o.r, o.color, o.name, null, false);
  });

  // Player cells
  state.player.cells.forEach(cell => {
    drawCell(cell.x, cell.y, cell.r, cell.color, state.nick || 'You', cell.mass, true);
  });

  ctx.restore();
}

function drawBackground(W, H) {
  const { camera } = state;
  const theme = state.settings.theme;
  if (theme === 'empty') return;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;

  const gridSize = (theme === 'hex') ? 60 : 50;
  const scaledGrid = gridSize * camera.zoom;

  const offX = (-camera.x * camera.zoom + W / 2) % scaledGrid;
  const offY = (-camera.y * camera.zoom + H / 2) % scaledGrid;

  if (theme === 'grid') {
    for (let x = offX; x < W; x += scaledGrid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = offY; y < H; y += scaledGrid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  } else if (theme === 'hex') {
    // Simple dot grid approximation for hex
    const spacing = scaledGrid;
    for (let xi = -1; xi * spacing < W + spacing; xi++) {
      for (let yi = -1; yi * spacing < H + spacing; yi++) {
        const px = offX + xi * spacing + (yi % 2 === 0 ? spacing / 2 : 0);
        const py = offY + yi * spacing;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

function drawCell(x, y, r, color, name, mass, isPlayer) {
  // Shadow
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;

  // Main circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, lighten(color, 30));
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fill();

  // Border
  ctx.strokeStyle = darken(color, 30);
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();

  ctx.restore();

  // Name
  const showNames = state.settings.showNames;
  const shouldShowName = showNames === 'All' || (showNames === 'Self' && isPlayer);
  if (shouldShowName && name && r > 15) {
    const fontSize = Math.max(10, Math.min(r * 0.35, 24));
    ctx.font = `bold ${fontSize}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(name, x, y);
    ctx.fillText(name, x, y);
  }

  // Mass
  if (state.settings.showMass && mass && r > 20) {
    const fontSize2 = Math.max(8, Math.min(r * 0.25, 16));
    ctx.font = `${fontSize2}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelY = name && r > 15 ? y + fontSize2 * 1.3 : y;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(Math.round(mass), x, labelY);
  }
}

function drawVirus(x, y, r) {
  ctx.save();
  ctx.beginPath();
  const spikes = 12;
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes;
    const radius = i % 2 === 0 ? r : r * 0.8;
    if (i === 0) ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    else ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(60,220,80,0.7)';
  ctx.strokeStyle = 'rgba(40,180,60,0.9)';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Color helpers
function lighten(hex, amount) {
  return adjustColor(hex, amount);
}

function darken(hex, amount) {
  return adjustColor(hex, -amount);
}

function adjustColor(hex, amount) {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `rgb(${r},${g},${b})`;
  } catch { return hex; }
}

// Menu background animation
const menuParticles = Array.from({ length: 30 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: 5 + Math.random() * 30,
  vx: (Math.random() - 0.5) * 0.3,
  vy: (Math.random() - 0.5) * 0.3,
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  alpha: 0.15 + Math.random() * 0.2,
}));

function renderMenuBackground() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, W, H);

  menuParticles.forEach(p => {
    p.x = (p.x + p.vx + W) % W;
    p.y = (p.y + p.vy + H) % H;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
    ctx.fill();
  });
}

function drawSkinCanvas() {
  const c = document.querySelector('#skin-canvas');
  if (!c) return;
  const cx = c.getContext('2d');
  const size = c.width;
  cx.clearRect(0, 0, size, size);
  const color = state.player.cells[0]?.color || randomColor();
  const r = size / 2 - 4;
  const grad = cx.createRadialGradient(size / 3, size / 3, 0, size / 2, size / 2, r);
  grad.addColorStop(0, lighten(color, 40));
  grad.addColorStop(1, color);
  cx.beginPath();
  cx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  cx.fillStyle = grad;
  cx.fill();
  cx.strokeStyle = darken(color, 30);
  cx.lineWidth = 2;
  cx.stroke();

  // Nickname in skin preview
  const nick = state.nick || '';
  if (nick) {
    cx.font = 'bold 14px Segoe UI, sans-serif';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillStyle = 'rgba(255,255,255,0.9)';
    cx.strokeStyle = 'rgba(0,0,0,0.5)';
    cx.lineWidth = 2;
    cx.strokeText(nick.slice(0, 3), size / 2, size / 2);
    cx.fillText(nick.slice(0, 3), size / 2, size / 2);
  }
}

// ── Menu UI ──────────────────────────────────────────────────
const menu = document.querySelector('#menu');
const hud = document.querySelector('#hud');

document.querySelector('#play').addEventListener('click', startGame);
document.querySelector('#spectate').addEventListener('click', startSpectate);

document.querySelector('#nick').addEventListener('input', e => {
  state.nick = e.target.value;
  drawSkinCanvas();
});

function startGame() {
  state.inGame = true;
  state.spectating = false;
  state.nick = document.querySelector('#nick').value || 'Player';
  initWorld();
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  showOverlayConnecting();
}

function startSpectate() {
  state.spectating = true;
  state.inGame = false;
  state.nick = '';
  initWorld();
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
}

function showOverlayConnecting() {
  const ov = document.querySelector('#connecting');
  ov.classList.remove('hidden');
  setTimeout(() => {
    ov.classList.add('hidden');
  }, 1800);
}

function endMatch() {
  state.inGame = false;
  const elapsed = Math.round((Date.now() - state.score.startTime) / 1000);
  document.querySelector('.stats-food-eaten').textContent = state.score.food;
  document.querySelector('.stats-highest-mass').textContent = Math.round(state.score.maxMass);
  document.querySelector('.stats-time-alive').textContent = formatTime(elapsed);
  document.querySelector('.stats-leaderboard-time').textContent = formatTime(Math.max(0, elapsed - 1));
  document.querySelector('.stats-cells-eaten').textContent = state.score.cells;
  document.querySelector('.stats-top-position').textContent = Math.floor(Math.random() * 50) + 1;

  if (!state.settings.skipResults) {
    document.querySelector('#deathContainer').classList.remove('hidden');
  } else {
    returnToMenu();
  }
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

document.querySelector('#continue').addEventListener('click', () => {
  document.querySelector('#deathContainer').classList.add('hidden');
  returnToMenu();
});

function returnToMenu() {
  state.inGame = false;
  state.spectating = false;
  hud.classList.add('hidden');
  menu.classList.remove('hidden');
  drawSkinCanvas();
}

// ── Panels ────────────────────────────────────────────────────
const backdrop = document.querySelector('#panel-backdrop');

function openPanel(id) {
  closeAllPanels();
  document.querySelector(`#${id}`).classList.remove('hidden');
  backdrop.classList.remove('hidden');
}

function closeAllPanels() {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  backdrop.classList.add('hidden');
}

backdrop.addEventListener('click', closeAllPanels);

document.querySelectorAll('.panel-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const pid = btn.dataset.panel;
    document.querySelector(`#${pid}`).classList.add('hidden');
    // Close backdrop if no panels open
    if (!document.querySelector('.panel:not(.hidden)')) {
      backdrop.classList.add('hidden');
    }
  });
});

// Open settings from menu
document.querySelector('#btn-open-settings').addEventListener('click', () => {
  openPanel('panel-settings');
});

// ── Settings Panel ────────────────────────────────────────────
// Tab navigation
document.querySelectorAll('.stab').forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const target = tab.getAttribute('href').replace('#', '');
    document.querySelectorAll('.settings-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelector(`#${target}`).classList.remove('hidden');
  });
});

// Button groups
document.querySelectorAll('.btn-group').forEach(group => {
  group.querySelectorAll('.bg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = group.dataset.key;
      state.settings[key] = btn.textContent;
      saveSettings();
    });
  });
});

// Toggles
[
  ['opt-skip-results', 'skipResults'],
  ['opt-auto-zoom', 'autoZoom'],
  ['opt-mouse-arrow', 'mouseArrow'],
  ['opt-show-mass', 'showMass'],
  ['opt-hide-food', 'hideFood'],
  ['opt-hide-border', 'hideBorder'],
  ['opt-profanity', 'profanityFilter'],
  ['opt-hide-xp', 'hideXP'],
  ['opt-hide-chat', 'hideChat'],
].forEach(([id, key]) => {
  const el = document.querySelector(`#${id}`);
  if (!el) return;
  el.checked = !!state.settings[key];
  el.addEventListener('change', () => {
    state.settings[key] = el.checked;
    saveSettings();
    applySettings();
  });
});

// Slider
const animSlider = document.querySelector('#opt-anim-speed');
if (animSlider) {
  animSlider.value = state.settings.animSpeed;
  animSlider.addEventListener('input', () => {
    state.settings.animSpeed = parseInt(animSlider.value);
    saveSettings();
  });
}

// Theme buttons
document.querySelectorAll('.theme-opt').forEach(img => {
  img.addEventListener('click', () => {
    const group = img.dataset.theme ? 'theme' : 'color';
    const val = img.dataset.theme || img.dataset.color;
    document.querySelectorAll(`.theme-opt[data-${group}]`).forEach(i => i.classList.remove('active'));
    img.classList.add('active');
    state.settings[group] = val;
    saveSettings();
  });
});

// Keybinds
let listeningFor = null;

document.querySelectorAll('.keybind-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (listeningFor) {
      document.querySelector(`.keybind-btn[data-action="${listeningFor}"]`)?.classList.remove('listening');
    }
    listeningFor = btn.dataset.action;
    btn.textContent = '...';
    btn.classList.add('listening');
  });
});

document.addEventListener('keydown', e => {
  if (listeningFor) {
    e.preventDefault();
    const key = e.code === 'Space' ? 'Space' : e.key.toUpperCase();
    state.settings.keybinds[listeningFor] = key;
    const btn = document.querySelector(`.keybind-btn[data-action="${listeningFor}"]`);
    if (btn) { btn.textContent = key; btn.classList.remove('listening'); }
    listeningFor = null;
    saveSettings();
    return;
  }

  if (!state.inGame) return;

  const kb = state.settings.keybinds;
  const k = e.code === 'Space' ? 'Space' : e.key.toUpperCase();

  if (k === kb.split || e.code === 'Space') {
    splitCells();
  } else if (k === kb.feed) {
    ejectMass();
  } else if (k === kb.doublesplit) {
    splitCells(); setTimeout(splitCells, 80);
  } else if (k === kb.triplesplit) {
    splitCells(); setTimeout(splitCells, 80); setTimeout(splitCells, 160);
  } else if (k === kb['16split']) {
    for (let i = 0; i < 4; i++) setTimeout(splitCells, i * 80);
  } else if (k === kb.hideui || k === 'H') {
    state.hudHidden = !state.hudHidden;
    document.querySelector('#hud').style.opacity = state.hudHidden ? '0' : '1';
  }
});

document.querySelector('#reset-controls').addEventListener('click', () => {
  state.settings.keybinds = {
    feed: 'W', split: 'Space', doublesplit: 'E',
    triplesplit: 'R', '16split': 'T', freeze: 'Q', vertical: 'F', hideui: 'H'
  };
  document.querySelectorAll('.keybind-btn').forEach(btn => {
    btn.textContent = state.settings.keybinds[btn.dataset.action] || '?';
  });
  saveSettings();
});

function applySettings() {
  const chatBox = document.querySelector('#chat');
  const xpBar = document.querySelector('#hud');
  if (chatBox) chatBox.style.display = state.settings.hideChat ? 'none' : '';
  if (xpBar) xpBar.querySelector('#xp-bar-wrap').style.display = state.settings.hideXP ? 'none' : '';
}

// Region
document.querySelectorAll('input[name=region]').forEach(radio => {
  if (radio.value === state.settings.region) radio.checked = true;
  radio.addEventListener('change', () => {
    state.settings.region = radio.value;
    saveSettings();
  });
});

// Rankings tabs
document.querySelectorAll('.rtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

document.querySelectorAll('.rstab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.rstab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// ── Party ─────────────────────────────────────────────────────
document.querySelector('#btnPartyCreate').addEventListener('click', () => {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  state.party.code = code;
  document.querySelector('#party_code_val').textContent = code;
  document.querySelector('#party-code-display').classList.remove('hidden');
  document.querySelector('#party-join-input').classList.add('hidden');
});

document.querySelector('#party-join').addEventListener('click', () => {
  document.querySelector('#party-join-input').classList.remove('hidden');
  document.querySelector('#party-code-display').classList.add('hidden');
});

document.querySelector('#party-copy-code').addEventListener('click', () => {
  const code = document.querySelector('#party_code_val').textContent;
  navigator.clipboard.writeText(code).catch(() => { });
  document.querySelector('#party-copy-code').textContent = 'Copied!';
  setTimeout(() => { document.querySelector('#party-copy-code').textContent = 'Copy'; }, 2000);
});

document.querySelector('#btnPartyJoin').addEventListener('click', () => {
  const code = document.querySelector('#party_code').value.toUpperCase();
  if (code.length >= 4) {
    state.party.code = code;
    document.querySelector('#party_code_val').textContent = code;
    document.querySelector('#party-code-display').classList.remove('hidden');
    document.querySelector('#party-join-input').classList.add('hidden');
    document.querySelector('#party_code').value = '';
  }
});

document.querySelector('#btnPartyLeave').addEventListener('click', () => {
  state.party.code = null;
  document.querySelector('#party-code-display').classList.add('hidden');
  document.querySelector('#party-join-input').classList.add('hidden');
});

// Party tabs
document.querySelectorAll('.ptab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// ── Mouse tracking ────────────────────────────────────────────
canvas.addEventListener('mousemove', e => {
  state.mouseX = e.clientX;
  state.mouseY = e.clientY;
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  state.mouseX = e.touches[0].clientX;
  state.mouseY = e.touches[0].clientY;
}, { passive: false });

// ── Touch split/feed ─────────────────────────────────────────
canvas.addEventListener('dblclick', () => { if (state.inGame) splitCells(); });

// ── Game actions ──────────────────────────────────────────────
function splitCells() {
  const cells = state.player.cells;
  if (cells.length >= 16) return;

  const newCells = [];
  cells.forEach(cell => {
    if (cell.mass < 36) return;
    const dx = state.mouseX - (cell.x - state.camera.x) * state.camera.zoom - canvas.width / 2;
    const dy = state.mouseY - (cell.y - state.camera.y) * state.camera.zoom - canvas.height / 2;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const half = cell.mass / 2;
    cell.mass = half;
    cell.r = massToRadius(half);
    newCells.push({
      x: cell.x + (dx / dist) * cell.r * 0.5,
      y: cell.y + (dy / dist) * cell.r * 0.5,
      r: massToRadius(half),
      mass: half,
      color: cell.color,
      vx: (dx / dist) * 8,
      vy: (dy / dist) * 8,
      _splitTimer: 0,
    });
  });

  state.player.cells.push(...newCells);
}

function ejectMass() {
  state.player.cells.forEach(cell => {
    if (cell.mass < 36) return;
    const dx = state.mouseX - (cell.x - state.camera.x) * state.camera.zoom - canvas.width / 2;
    const dy = state.mouseY - (cell.y - state.camera.y) * state.camera.zoom - canvas.height / 2;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    cell.mass -= 16;
    cell.r = massToRadius(cell.mass);
    state.foods.push({
      x: cell.x + (dx / dist) * (cell.r + 10),
      y: cell.y + (dy / dist) * (cell.r + 10),
      r: 8,
      color: cell.color,
    });
  });
}

// HUD buttons
document.querySelector('#btn-eject').addEventListener('click', () => { if (state.inGame) ejectMass(); });
document.querySelector('#btn-split').addEventListener('click', () => { if (state.inGame) splitCells(); });

// ── Chat ──────────────────────────────────────────────────────
document.querySelector('#chat_input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const msg = e.target.value.trim();
    if (msg) {
      const div = document.createElement('div');
      div.textContent = `${state.nick || 'You'}: ${msg}`;
      div.style.cssText = 'font-size:11px;color:#ccc;padding:2px 0;';
      document.querySelector('#tabs').appendChild(div);
      document.querySelector('#tabs').scrollTop = 9999;
      e.target.value = '';
    }
  }
  e.stopPropagation();
});

// ── Login stubs ───────────────────────────────────────────────
document.querySelector('#btn-discord-login').addEventListener('click', () => {
  alert('Discord login would be implemented server-side.');
});

document.querySelector('#btn-google-login').addEventListener('click', () => {
  alert('Google login would be implemented server-side.');
});

// ── Version link ──────────────────────────────────────────────
document.querySelector('#version').addEventListener('click', e => {
  e.preventDefault();
  openPanel('panel-settings');
});

// ── Custom skin ───────────────────────────────────────────────
document.querySelector('#custom-skin-apply').addEventListener('click', () => {
  const url = document.querySelector('#custom-skin-url').value.trim();
  if (url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.querySelector('#skin-canvas');
      const cx = c.getContext('2d');
      cx.clearRect(0, 0, c.width, c.height);
      cx.beginPath();
      cx.arc(c.width / 2, c.height / 2, c.width / 2 - 4, 0, Math.PI * 2);
      cx.clip();
      cx.drawImage(img, 4, 4, c.width - 8, c.height - 8);
    };
    img.src = url;
  }
});

// ── Minimap ───────────────────────────────────────────────────
function drawMinimap() {
  if (!state.inGame) return;
  const mc = document.querySelector('#minimap');
  const mx = mc.getContext('2d');
  const mw = mc.width, mh = mc.height;
  mx.clearRect(0, 0, mw, mh);
  mx.fillStyle = 'rgba(0,0,0,0.4)';
  mx.fillRect(0, 0, mw, mh);

  const sx = mw / WORLD.w, sy = mh / WORLD.h;

  state.others.forEach(o => {
    mx.beginPath();
    mx.arc(o.x * sx, o.y * sy, Math.max(1, o.r * sx * 2), 0, Math.PI * 2);
    mx.fillStyle = o.color + '99';
    mx.fill();
  });

  state.player.cells.forEach(cell => {
    mx.beginPath();
    mx.arc(cell.x * sx, cell.y * sy, Math.max(2, cell.r * sx * 2), 0, Math.PI * 2);
    mx.fillStyle = '#fff';
    mx.fill();
  });

  // Viewport indicator
  const vw = (canvas.width / state.camera.zoom) * sx;
  const vh = (canvas.height / state.camera.zoom) * sy;
  const vx = state.camera.x * sx - vw / 2;
  const vy = state.camera.y * sy - vh / 2;
  mx.strokeStyle = 'rgba(255,255,255,0.4)';
  mx.lineWidth = 1;
  mx.strokeRect(vx, vy, vw, vh);
}

setInterval(drawMinimap, 100);

// ── Init ──────────────────────────────────────────────────────
drawSkinCanvas();
requestAnimationFrame(ts => { lastTime = ts; gameLoop(ts); });
