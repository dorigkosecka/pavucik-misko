'use strict';
// Hlavné menu, výhra, vstupy a hlavná slučka.

const LEVELS = [
  { game: jumpGame, color: '#ffccb0', icon: iconJump },
  { game: paintGame, color: '#d9c4ef', icon: iconPaint },
  { game: sortColorGame, color: '#b5def7', icon: iconColors },
  { game: sortShapeGame, color: '#b9e5c7', icon: iconShapes },
  { game: traceGame, color: '#fce4a0', icon: iconTrace },
  { game: runGame, color: '#f7bdd0', icon: iconRun },
  { game: feedGame, color: '#c9c4f1', icon: iconFeed },
  { game: webGame, color: '#cceada', icon: iconWeb },
];
const LEVEL_NAMES = ['Skákanie', 'Maľovanie', 'Farby', 'Tvary', 'Kreslenie', 'Utekanie', 'Kŕmenie', 'Pavučiny'];
const LEVEL_HINTS = [
  ['Ťukni a preskoč prekážku.', 'Zbieraj modré a červené hviezdy.'],
  ['Vyber farbu a vyfarbi obrázok.', 'Dokonči všetky tri obrázky.'],
  ['Presuň vec do škatule.', 'Rovnaké farby patria k sebe.'],
  ['Presuň vec do škatule.', 'Hľadaj rovnaký tvar.'],
  ['Veď prst po bodkách.', 'Miško pôjde za tvojím prstom.'],
  ['Ťukni na dráhu, kam má bežať.', 'Zbieraj chrobáčiky a obchádzaj prekážky.'],
  ['Presuň jedlo k Miškovi.', 'Daj mu práve toľko, koľko ukazuje bublina.'],
  ['Ťukni na pavučinu, kde je Miško.', 'Šesť správnych zásahov a vyhráš.'],
];
const GESTURES = ['tap', 'drag', 'drag', 'drag', 'trace', 'tap', 'drag', 'tap'];
const G = { scene: null, level: -1, won: null, demo: null, t: 0, done: {} };
try { G.done = JSON.parse(localStorage.getItem('pavucik-done') || '{}'); } catch (e) {}

function iconJump(x, y, s) {
  ctx.fillStyle = '#8a8f98'; rr(x - s * 0.35, y + s * 0.2, s * 0.7, s * 0.55, 14); ctx.fill();
  drawSpider(x, y - s * 0.4, s * 0.3, 1, { rot: -0.15, mouth: 'open' });
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.setLineDash([6, 8]);
  ctx.beginPath(); ctx.arc(x - s * 0.5, y + s * 0.2, s * 0.55, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); ctx.setLineDash([]);
}
function iconPaint(x, y, s) {
  ctx.fillStyle = '#d7b27a';
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.85, s * 0.65, 0, 0, 7); ctx.fill();
  [['#e53935', -0.45, -0.2], ['#fdd835', 0, -0.4], ['#1e88e5', 0.45, -0.2], ['#43a047', 0.4, 0.25]].forEach(c => {
    ctx.fillStyle = c[0]; ctx.beginPath(); ctx.arc(x + c[1] * s, y + c[2] * s, s * 0.17, 0, 7); ctx.fill();
  });
  ctx.fillStyle = '#ffe9c4'; ctx.beginPath(); ctx.arc(x - s * 0.3, y + s * 0.3, s * 0.14, 0, 7); ctx.fill();
}
function iconColors(x, y, s) {
  [['#e53935', -0.5, 0.3], ['#1e88e5', 0.5, 0.3], ['#fdd835', 0, -0.4]].forEach(c => {
    ctx.fillStyle = c[0]; ctx.beginPath(); ctx.arc(x + c[1] * s, y + c[2] * s, s * 0.38, 0, 7); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke();
  });
}
function iconShapes(x, y, s) {
  drawShape(0, x - s * 0.62, y + s * 0.2, s * 0.28, '#ef5350');
  drawShape(1, x + s * 0.62, y + s * 0.2, s * 0.28, '#42a5f5');
  drawShape(2, x, y - s * 0.35, s * 0.3, '#ffee58');
}
function iconTrace(x, y, s) {
  ctx.fillStyle = UI.ink;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * s * 0.7, y + Math.sin(a) * s * 0.7, s * 0.1, 0, 7); ctx.fill();
  }
  ctx.save(); ctx.translate(x + s * 0.15, y + s * 0.1); ctx.rotate(0.8);
  ctx.fillStyle = '#ff7043'; ctx.fillRect(-s * 0.08, -s * 0.7, s * 0.16, s * 0.9);
  ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.moveTo(-s * 0.08, s * 0.2); ctx.lineTo(s * 0.08, s * 0.2); ctx.lineTo(0, s * 0.42); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function iconRun(x, y, s) {
  ctx.strokeStyle = UI.ink; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x - s * 1.0, y + i * s * 0.3); ctx.lineTo(x - s * 0.55, y + i * s * 0.3); ctx.stroke(); }
  drawSpider(x + s * 0.25, y, s * 0.3, G.t, { run: 1, mouth: 'open', look: { x: 1, y: 0 } });
}
function iconFeed(x, y, s) {
  drawFly(x - s * 0.4, y + s * 0.18, s * 0.58, G.t, false);
  drawMosquito(x + s * 0.42, y - s * 0.27, s * 0.53, G.t);
  drawCricket(x + s * 0.45, y + s * 0.4, s * 0.52, G.t);
}
function iconWeb(x, y, s) {
  ctx.strokeStyle = '#78669f'; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const px = x + (i % 3 - 1) * s * 0.68, py = y + (Math.floor(i / 3) - 0.5) * s * 0.76;
    ctx.beginPath(); ctx.arc(px, py, s * 0.25, 0, Math.PI * 2);
    ctx.moveTo(px - s * 0.25, py); ctx.lineTo(px + s * 0.25, py);
    ctx.moveTo(px, py - s * 0.25); ctx.lineTo(px, py + s * 0.25); ctx.stroke();
  }
  drawSpider(x + s * 0.67, y - s * 0.37, s * 0.25, G.t, { mouth: 'smile' });
}

const menu = {
  tile(i) {
    if (portrait) {
      const row = i < 3 ? 0 : i < 6 ? 1 : 2;
      const n = row === 2 ? 2 : 3;
      const idx = i - (row === 0 ? 0 : row === 1 ? 3 : 6);
      const y0 = Math.max(190, (portraitHeight - 648) / 2 + 20);
      return { x: (PORTRAIT_W - (n * 196 + (n - 1) * 28)) / 2 + idx * 224, y: y0 + row * 224, w: 196, h: 196 };
    }
    const row = i < 4 ? 0 : 1;
    const n = 4;
    const idx = row ? i - 4 : i;
    const left = (W - (n * 200 + (n - 1) * 40)) / 2;
    return { x: left + idx * 240, y: row ? 440 : 190, w: 200, h: 200 };
  },
  enter() {},
  down(x, y) {
    for (let i = 0; i < LEVELS.length; i++) {
      const t = this.tile(i);
      if (x > t.x && x < t.x + t.w && y > t.y && y < t.y + t.h) { startLevel(i); return; }
    }
  },
  move() {}, up() {}, update() {},
  draw() {
    backdrop('#dceeff', '#f7ebf7');
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.ellipse(512, 97, 383, 67, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = UI.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 70px ' + FONT;
    ctx.fillText('Pavúčik Miško', 565, 98 + Math.sin(G.t * 2) * 2, 590);
    drawSpider(184, 96 + Math.sin(G.t * 2) * 3, 35, G.t, { mouth: 'smile' });
    for (let i = 0; i < LEVELS.length; i++) {
      const t = this.tile(i), L = LEVELS[i];
      card(t.x, t.y, t.w, t.h, UI.paper, 36);
      ctx.fillStyle = L.color; rr(t.x + 8, t.y + 8, t.w - 16, t.h - 16, 29); ctx.fill();
      L.icon(t.x + t.w / 2, t.y + t.h / 2 - 8, 80);
      if (G.done[i]) drawStar(t.x + t.w - 34, t.y + 34, 26, '#ffd740');
    }
  },
  drawPortrait() {
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.beginPath(); ctx.ellipse(384, 120, 355, 88, 0, 0, Math.PI * 2); ctx.fill();
    drawSpider(120, 122 + Math.sin(G.t * 2) * 3, 32, G.t, { mouth: 'smile' });
    ctx.fillStyle = UI.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 57px ' + FONT;
    ctx.fillText('Pavúčik Miško', 434, 120, 555);
    for (let i = 0; i < LEVELS.length; i++) {
      const t = this.tile(i), L = LEVELS[i];
      card(t.x, t.y, t.w, t.h, UI.paper, 34);
      ctx.fillStyle = L.color; rr(t.x + 8, t.y + 8, t.w - 16, t.h - 16, 27); ctx.fill();
      L.icon(t.x + t.w / 2, t.y + t.h / 2 - 8, 68);
      if (G.done[i]) drawStar(t.x + t.w - 31, t.y + 31, 24, UI.sun);
    }
    ctx.fillStyle = UI.ink; ctx.font = 'bold 29px ' + FONT;
    ctx.fillText('Vyber si hru', 384, portraitHeight - 42);
  },
};

function startLevel(i) {
  G.level = i; G.scene = LEVELS[i].game; G.won = null;
  particles.length = 0;
  G.scene.enter();
  G.demo = i === 0 || i === 1 || i === 4 ? null : { t: 0 };
}
function goMenu() {
  G.level = -1; G.scene = menu; G.won = G.demo = null;
  particles.length = 0;
  menu.enter();
}
function replayGuide() {
  G.demo = { t: 0 };
}
function win() {
  if (G.won || G.level < 0) return;
  G.demo = null;
  G.won = { t: 0 };
  G.done[G.level] = true;
  try { localStorage.setItem('pavucik-done', JSON.stringify(G.done)); } catch (e) {}
  burst(W / 2, 300, 60);
}

const WIN_BTN = [
  { id: 'home', x: 342, y: 640, r: 56, c: UI.peach },
  { id: 'replay', x: 512, y: 640, r: 56, c: UI.blue },
  { id: 'next', x: 682, y: 640, r: 66, c: UI.mint },
];
function portraitWinButtons() {
  return [
    { id: 'home', x: 192, y: portraitHeight - 170, r: 57, c: UI.peach },
    { id: 'replay', x: 384, y: portraitHeight - 170, r: 57, c: UI.blue },
    { id: 'next', x: 576, y: portraitHeight - 170, r: 65, c: UI.mint },
  ];
}
function selectWinButton(id) {
  if (id === 'home') goMenu();
  else if (id === 'replay') startLevel(G.level);
  else if (G.level + 1 < LEVELS.length) startLevel(G.level + 1);
  else goMenu();
}

function handleDown(x, y) {
  if (G.won) {
    if (G.won.t < 0.6) return;
    for (const b of portrait ? portraitWinButtons() : WIN_BTN) {
      if (dist(x, y, b.x, b.y) < b.r + 10) {
        selectWinButton(b.id);
        return;
      }
    }
    return;
  }
  if (portrait) {
    if (G.scene === menu) { menu.down(x, y); return; }
    if (dist(x, y, 76, 80) < 58) { goMenu(); return; }
    if (dist(x, y, 692, 80) < 58) { replayGuide(); return; }
    if (G.demo) { G.demo = null; return; }
    const p = screenToGame(x, y);
    if (p.y >= 0 && p.y <= H) G.scene.down(p.x, p.y);
    return;
  }
  if (G.scene !== menu && dist(x, y, BACK.x, BACK.y) < BACK.r + 14) { goMenu(); return; }
  if (G.scene !== menu && dist(x, y, 968, 56) < 54) { replayGuide(); return; }
  if (G.demo) { G.demo = null; return; }
  G.scene.down(x, y);
}

function drawWin() {
  const w = G.won;
  ctx.fillStyle = 'rgba(38,54,80,0.4)'; ctx.fillRect(0, 0, W, H);
  card(208, 68, 608, 661, UI.paper, 44);
  ctx.fillStyle = UI.ink; ctx.font = 'bold 55px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Výborne, Miško!', W / 2, 104);
  for (let i = 0; i < 3; i++) {
    const k = clamp((w.t - 0.2 * i) * 3, 0, 1);
    const s = k < 1 ? k * 1.3 : 1;
    drawStar(W / 2 - 150 + i * 150, i === 1 ? 200 : 226, 62 * s, UI.sun, Math.sin(G.t * 2 + i) * 0.1);
  }
  drawSpider(W / 2, 418, 73, G.t, { mouth: 'open', rot: Math.sin(G.t * 6) * 0.12, run: 1 });
  for (const b of WIN_BTN) {
    const pulse = b.id === 'next' ? 1 + Math.sin(G.t * 6) * 0.06 : 1;
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(pulse, pulse);
    circleButton(0, 0, b.r, b.c);
    if (b.id === 'home') iconHome(0, 0, 26);
    else if (b.id === 'replay') iconReplay(0, 0, 26);
    else iconPlay(0, 0, 30);
    ctx.restore();
  }
}

function drawPortraitBackdrop() {
  const gradient = ctx.createLinearGradient(0, 0, PORTRAIT_W, portraitHeight);
  gradient.addColorStop(0, '#dceeff');
  gradient.addColorStop(1, '#f7ebf7');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, PORTRAIT_W, portraitHeight);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.arc(40, portraitHeight - 75, 190, 0, Math.PI * 2);
  ctx.arc(740, 80, 175, 0, Math.PI * 2); ctx.fill();
}

function drawPortraitChrome() {
  card(38, 22, 692, portraitStageY - 30, UI.paper, 30);
  circleButton(76, 80, 44, UI.peach);
  iconHome(76, 80, 21);
  circleButton(692, 80, 44, UI.lilac);
  iconReplay(692, 80, 20);
  ctx.fillStyle = UI.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 43px ' + FONT;
  ctx.fillText(LEVEL_NAMES[G.level], 384, 76, 485);
  ctx.font = '27px ' + FONT;
  ctx.fillText(LEVEL_HINTS[G.level][0], 384, 136, 624);

  const y = portraitStageY + 576 + 24;
  const h = Math.min(163, portraitHeight - y - 28);
  card(38, y, 692, h, UI.paper, 30);
  drawSpider(110, y + h / 2, 32, G.t, { mouth: 'smile' });
  ctx.textAlign = 'left'; ctx.font = 'bold 29px ' + FONT;
  ctx.fillText(LEVEL_NAMES[G.level], 200, y + h * 0.38, 480);
  ctx.font = '24px ' + FONT;
  ctx.fillText(LEVEL_HINTS[G.level][1], 200, y + h * 0.71, 490);
}

function drawPortraitWin() {
  ctx.fillStyle = 'rgba(38,54,80,0.47)';
  ctx.fillRect(0, 0, PORTRAIT_W, portraitHeight);
  card(48, 72, 672, portraitHeight - 144, UI.paper, 44);
  ctx.fillStyle = UI.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 58px ' + FONT;
  ctx.fillText('Výborne, Miško!', 384, 174, 610);
  for (let i = 0; i < 3; i++) {
    const k = clamp((G.won.t - 0.2 * i) * 3, 0, 1);
    drawStar(210 + i * 174, i === 1 ? 306 : 330, 57 * (k < 1 ? k * 1.3 : 1), UI.sun);
  }
  drawSpider(384, portraitHeight * 0.53, 78, G.t, { mouth: 'open', rot: Math.sin(G.t * 6) * 0.1, run: 1 });
  for (const b of portraitWinButtons()) {
    circleButton(b.x, b.y, b.r, b.c);
    if (b.id === 'home') iconHome(b.x, b.y, 26);
    else if (b.id === 'replay') iconReplay(b.x, b.y, 26);
    else iconPlay(b.x, b.y, 30);
  }
}

function drawDemoFinger(x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#ffd2ab'; ctx.strokeStyle = '#765747'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-20, 66); ctx.lineTo(-20, 17);
  ctx.quadraticCurveTo(-20, -18, 0, -18);
  ctx.quadraticCurveTo(19, -18, 19, 17);
  ctx.lineTo(19, 39);
  ctx.quadraticCurveTo(38, 28, 43, 48);
  ctx.lineTo(43, 78);
  ctx.quadraticCurveTo(28, 93, -5, 86);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawGestureDemo() {
  const kind = G.level === 4 && traceGame.mode === 'free' ? 'tap' : GESTURES[G.level];
  const phase = (G.demo.t % 1.25) / 1.25;
  ctx.save();
  ctx.fillStyle = 'rgba(38,54,80,0.38)'; ctx.fillRect(0, 0, W, H);
  card(165, 165, 694, 435, UI.paper, 40);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = UI.ink;
  ctx.font = 'bold 43px ' + FONT; ctx.fillText('Takto to skús!', W / 2, 225);
  ctx.font = '30px ' + FONT;
  const instruction = G.level === 4 ? (traceGame.mode === 'free' ? 'Ťukaj na bodky.' : 'Spoj bodky ťahom.') : LEVEL_HINTS[G.level][0];
  ctx.fillText(instruction, W / 2, 279, 620);
  if (kind === 'tap') {
    ctx.fillStyle = UI.mint;
    ctx.beginPath(); ctx.arc(512, 398, 78 + Math.sin(phase * Math.PI * 2) * 6, 0, Math.PI * 2); ctx.fill();
    LEVELS[G.level].icon(512, 395, 65);
    drawDemoFinger(563, 423 - (phase < 0.5 ? phase * 25 : (1 - phase) * 25));
  } else {
    ctx.strokeStyle = UI.lilac; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.setLineDash([12, 14]); ctx.beginPath();
    ctx.moveTo(326, 403);
    if (kind === 'trace') ctx.quadraticCurveTo(510, 325, 698, 403);
    else ctx.lineTo(698, 403);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = UI.blue; ctx.beginPath(); ctx.arc(326, 403, 43, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = UI.mint; ctx.beginPath(); ctx.arc(698, 403, 52, 0, Math.PI * 2); ctx.fill();
    const x = 326 + phase * 372;
    const y = kind === 'trace' ? 403 - Math.sin(phase * Math.PI) * 39 : 403;
    drawDemoFinger(x + 22, y + 20);
  }
  ctx.fillStyle = UI.muted; ctx.font = '26px ' + FONT;
  ctx.fillText('Ťukni a pokračuj', W / 2, 549);
  ctx.restore();
}

function frame(dt) {
  G.t += dt;
  if (G.won) G.won.t += dt;
  else if (G.demo) {
    G.demo.t += dt;
    if (G.demo.t >= 4) G.demo = null;
  } else G.scene.update(dt);
  updateParticles(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#bde7ff'; ctx.fillRect(0, 0, cv.width, cv.height);
  if (portrait) {
    ctx.setTransform(portraitScale, 0, 0, portraitScale, 0, 0);
    drawPortraitBackdrop();
    if (G.scene === menu) G.scene.drawPortrait();
    else {
      drawPortraitChrome();
      ctx.setTransform(scale, 0, 0, scale, offX, offY);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      G.scene.draw();
      drawParticles();
      if (G.demo) drawGestureDemo();
      ctx.restore();
      if (G.won) {
        ctx.setTransform(portraitScale, 0, 0, portraitScale, 0, 0);
        drawPortraitWin();
      }
    }
    return;
  }
  ctx.setTransform(scale, 0, 0, scale, offX, offY);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  G.scene.draw();
  if (G.scene !== menu) {
    drawBackButton();
    circleButton(968, 56, 40, UI.lilac);
    iconReplay(968, 56, 18);
  }
  drawParticles();
  if (G.demo) drawGestureDemo();
  if (G.won) drawWin();
  ctx.restore();
}

// ---------- vstupy ----------
function screenToGame(x, y) {
  return portrait ? { x: x * W / PORTRAIT_W, y: (y - portraitStageY) * W / PORTRAIT_W } : { x, y };
}
function toScreen(e) {
  const r = cv.getBoundingClientRect();
  if (portrait) return { x: (e.clientX - r.left) * dprG / portraitScale, y: (e.clientY - r.top) * dprG / portraitScale };
  return { x: ((e.clientX - r.left) * dprG - offX) / scale, y: ((e.clientY - r.top) * dprG - offY) / scale };
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  const p = toScreen(e); handleDown(p.x, p.y);
});
cv.addEventListener('pointermove', e => { e.preventDefault(); const p = toScreen(e); if (!G.won) { const g = screenToGame(p.x, p.y); G.scene.move(g.x, g.y); } });
const endPtr = e => { e.preventDefault(); const p = toScreen(e); if (!G.won) { const g = screenToGame(p.x, p.y); G.scene.up(g.x, g.y); } };
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('resize', () => resize());
window.addEventListener('orientationchange', () => resize());

// ---------- štart ----------
resize();
goMenu();
window.__g = { G, LEVELS, startLevel, goMenu, win, frame, handleDown, resize, screenToGame,
  layout: () => ({ portrait, stageY: portraitStageY, height: portraitHeight }) };

if (location.search.indexOf('test=1') >= 0) {
  window.__test = true;
} else {
  let last = performance.now();
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frame(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
