'use strict';
// Spoločné pomôcky: plátno, kreslenie pavúka a ďalších postavičiek.
const W = 1024, H = 768;
const PORTRAIT_W = 768;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let scale = 1, offX = 0, offY = 0, dprG = 1;
let portrait = false, portraitScale = 1, portraitHeight = 0, portraitStageY = 0;

function resize(w = window.innerWidth, h = window.innerHeight) {
  dprG = window.devicePixelRatio || 1;
  cv.width = Math.round(w * dprG);
  cv.height = Math.round(h * dprG);
  cv.style.width = w + 'px';
  cv.style.height = h + 'px';
  portrait = h > w * 1.18;
  if (portrait) {
    portraitScale = cv.width / PORTRAIT_W;
    portraitHeight = cv.height / portraitScale;
    portraitStageY = Math.max(168, (portraitHeight - H * PORTRAIT_W / W) * 0.46);
    scale = cv.width / W;
    offX = 0;
    offY = portraitStageY * portraitScale;
  } else {
    portraitScale = 1;
    portraitHeight = portraitStageY = 0;
    scale = Math.min(cv.width / W, cv.height / H);
    offX = (cv.width - W * scale) / 2;
    offY = (cv.height - H * scale) / 2;
  }
}

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const FONT = '"Arial Rounded MT Bold",system-ui,sans-serif';
const UI = {
  ink: '#263650',
  muted: '#64748b',
  blue: '#4b91e8',
  red: '#ed6475',
  peach: '#ffb486',
  mint: '#7acdb4',
  lilac: '#b8a2e8',
  sun: '#f5cb70',
  paper: '#fffefa',
};

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function backdrop(top, bottom) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.arc(60, 700, 210, 0, Math.PI * 2);
  ctx.arc(980, 90, 180, 0, Math.PI * 2);
  ctx.fill();
}

function card(x, y, w, h, fill, r) {
  ctx.save();
  ctx.shadowColor = 'rgba(45,63,93,0.14)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 9;
  ctx.fillStyle = fill || UI.paper;
  rr(x, y, w, h, r || 30);
  ctx.fill();
  ctx.restore();
}

// ---------- konfety ----------
const particles = [];
function burst(x, y, n, colors) {
  const cols = colors || ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#e040fb', '#ff9100'];
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(120, 460);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 160, life: rnd(0.8, 1.6), t: 0, c: pick(cols), r: rnd(5, 10) });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt; p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.t > p.life) particles.splice(i, 1);
  }
}
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = clamp(1 - p.t / p.life, 0, 1);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
  }
  ctx.globalAlpha = 1;
}

// ---------- kreslenie postavičiek ----------
// o: { look:{x,y}, mouth:'smile'|'open'|'no', run:0..1, rot, belly, headShake }
function drawSpider(x, y, s, t, o) {
  o = o || {};
  const look = o.look || { x: 0, y: 0 };
  const run = o.run || 0;
  const belly = o.belly || 0;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.strokeStyle = '#2b1b3d';
  ctx.lineWidth = s * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i++) {
      const ph = t * (run ? 16 : 3) + i * 1.3 + (side > 0 ? Math.PI : 0);
      const sw = Math.sin(ph) * (run ? 0.28 : 0.08);
      const y0 = (i - 1.5) * s * 0.3 + s * 0.1;
      const kx = side * s * 1.55, ky = y0 - s * 0.7 + (i - 1.5) * s * 0.25 + sw * s;
      const fx = side * s * 2.1, fy = y0 + s * 0.5 + (i - 1.5) * s * 0.5 + sw * s * 0.5;
      ctx.beginPath();
      ctx.moveTo(side * s * 0.6, y0);
      ctx.lineTo(kx, ky);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }
  }
  ctx.save();
  if (o.headShake) {
    ctx.translate(Math.sin(t * 24) * s * 0.14 * o.headShake, 0);
    ctx.rotate(Math.sin(t * 24) * 0.12 * o.headShake);
  }
  // telo
  const rx = s * (1 + 0.09 * belly), ry = s * (0.9 + 0.07 * belly);
  ctx.fillStyle = '#5b3a85';
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a52a8';
  ctx.beginPath(); ctx.ellipse(-rx * 0.25, -ry * 0.35, rx * 0.4, ry * 0.25, -0.5, 0, Math.PI * 2); ctx.fill();
  // šiltovka
  ctx.fillStyle = '#2e86de';
  ctx.beginPath(); ctx.ellipse(0, -ry * 0.72, s * 0.72, s * 0.5, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b5fb0';
  rr(-s * 0.1, -ry * 0.78, s * 1.1, s * 0.16, s * 0.08); ctx.fill();
  // oči
  const blink = (t % 3.7) < 0.12;
  for (let side = -1; side <= 1; side += 2) {
    const ex = side * s * 0.4, ey = -s * 0.12;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(ex, ey, s * 0.3, blink ? s * 0.04 : s * 0.34, 0, 0, Math.PI * 2); ctx.fill();
    if (!blink) {
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(ex + look.x * s * 0.1, ey + look.y * s * 0.12, s * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex + look.x * s * 0.1 - s * 0.05, ey + look.y * s * 0.12 - s * 0.06, s * 0.05, 0, Math.PI * 2); ctx.fill();
    }
  }
  // líčka
  ctx.fillStyle = 'rgba(255,120,150,0.55)';
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath(); ctx.ellipse(side * s * 0.68, s * 0.22, s * 0.14, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();
  }
  // ústa
  const mouth = o.mouth || 'smile';
  ctx.lineWidth = s * 0.07;
  if (mouth === 'open') {
    ctx.fillStyle = '#7a1230';
    ctx.beginPath(); ctx.ellipse(0, s * 0.38, s * 0.3, s * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff7a8a';
    ctx.beginPath(); ctx.ellipse(0, s * 0.5, s * 0.16, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  } else if (mouth === 'no') {
    ctx.strokeStyle = '#2b1b3d';
    ctx.beginPath(); ctx.arc(0, s * 0.62, s * 0.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else {
    ctx.strokeStyle = '#2b1b3d';
    ctx.beginPath(); ctx.arc(0, s * 0.2, s * 0.26, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function drawStar(x, y, R, fill, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2 + (rot || 0);
    const r = i % 2 ? R * 0.45 : R;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = Math.max(2, R * 0.08); ctx.strokeStyle = 'rgba(38,54,80,0.24)'; ctx.stroke();
}

function drawFly(x, y, s, t, flip) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  const fl = Math.sin(t * 35) * 0.35;
  ctx.fillStyle = 'rgba(200,235,255,0.85)';
  ctx.strokeStyle = 'rgba(80,120,150,0.6)';
  ctx.lineWidth = Math.max(1, s * 0.04);
  for (let k = 0; k < 2; k++) {
    ctx.save();
    ctx.translate(-s * 0.1 - k * s * 0.15, -s * 0.3);
    ctx.rotate(-0.6 - k * 0.5 + fl);
    ctx.beginPath(); ctx.ellipse(0, -s * 0.35, s * 0.2, s * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#37474f';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.65, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#546e7a';
  ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.12, s * 0.3, s * 0.12, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(s * 0.38, -s * 0.12, s * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.18, -s * 0.16, s * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(s * 0.44, -s * 0.12, s * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.16, s * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawMosquito(x, y, s, t) {
  ctx.save(); ctx.translate(x, y);
  const flutter = Math.sin(t * 28) * 0.12;
  ctx.fillStyle = '#d6f1ff'; ctx.strokeStyle = '#668baa'; ctx.lineWidth = Math.max(2, s * 0.035);
  for (const side of [-1, 1]) {
    ctx.save(); ctx.rotate(side * flutter);
    ctx.beginPath(); ctx.ellipse(side * s * 0.33, -s * 0.45, s * 0.25, s * 0.48, side * 0.6, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.strokeStyle = '#326674'; ctx.lineWidth = Math.max(2, s * 0.06); ctx.lineCap = 'round';
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(side * s * 0.3, s * 0.15); ctx.lineTo(side * s * 0.65, s * 0.6);
  }
  ctx.stroke();
  ctx.fillStyle = '#44b8bc';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(s * 0.26, -s * 0.13, s * 0.17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = UI.ink;
  ctx.beginPath(); ctx.arc(s * 0.31, -s * 0.12, s * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#326674';
  ctx.beginPath(); ctx.moveTo(s * 0.55, s * 0.03); ctx.lineTo(s * 0.95, s * 0.25); ctx.stroke();
  ctx.restore();
}

function drawCricket(x, y, s, t) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * s * 0.03);
  ctx.strokeStyle = '#497744'; ctx.lineWidth = Math.max(2, s * 0.08); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.35, s * 0.12); ctx.lineTo(-s * 0.85, -s * 0.12); ctx.lineTo(-s * 0.88, s * 0.7);
  ctx.moveTo(s * 0.18, s * 0.22); ctx.lineTo(s * 0.5, s * 0.65);
  ctx.moveTo(s * 0.58, -s * 0.13); ctx.quadraticCurveTo(s * 0.75, -s * 0.8, s * 0.98, -s * 0.75);
  ctx.stroke();
  ctx.fillStyle = '#8cca63';
  ctx.beginPath(); ctx.ellipse(-s * 0.15, 0, s * 0.67, s * 0.39, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#65a64e';
  ctx.beginPath(); ctx.ellipse(s * 0.42, -s * 0.12, s * 0.29, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(s * 0.47, -s * 0.24, s * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = UI.ink;
  ctx.beginPath(); ctx.arc(s * 0.51, -s * 0.23, s * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBee(x, y, s, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(210,240,255,0.85)';
  const fl = Math.sin(t * 40) * 0.3;
  for (let side = -1; side <= 1; side += 2) {
    ctx.save(); ctx.rotate(side * (0.6 + fl)); ctx.translate(0, -s * 0.5);
    ctx.beginPath(); ctx.ellipse(side * s * 0.4, 0, s * 0.35, s * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ffd600';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.8, s * 0.95, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(-s * 0.8, -s * 0.2, s * 1.6, s * 0.22);
  ctx.fillRect(-s * 0.7, s * 0.3, s * 1.4, s * 0.2);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.5, s * 0.2, 0, Math.PI * 2); ctx.arc(s * 0.3, -s * 0.5, s * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.48, s * 0.09, 0, Math.PI * 2); ctx.arc(s * 0.3, -s * 0.48, s * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function shapePath(kind, x, y, r) {
  ctx.beginPath();
  if (kind === 0) {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  } else if (kind === 1) {
    rr(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, r * 0.18);
  } else {
    ctx.moveTo(x, y - r * 1.05);
    ctx.lineTo(x + r * 1.05, y + r * 0.85);
    ctx.lineTo(x - r * 1.05, y + r * 0.85);
    ctx.closePath();
  }
}
function drawShape(kind, x, y, r, fill) {
  shapePath(kind, x, y, r);
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = Math.max(3, r * 0.1); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2); ctx.fill();
}

// ---------- ikony tlačidiel ----------
function circleButton(x, y, r, fill) {
  ctx.save();
  ctx.shadowColor = 'rgba(38,54,80,0.22)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
}
function iconHome(x, y, s) {
  ctx.fillStyle = UI.ink;
  ctx.beginPath();
  ctx.moveTo(x - s, y - s * 0.05); ctx.lineTo(x, y - s * 0.95); ctx.lineTo(x + s, y - s * 0.05);
  ctx.lineTo(x + s * 0.7, y - s * 0.05); ctx.lineTo(x + s * 0.7, y + s * 0.8);
  ctx.lineTo(x - s * 0.7, y + s * 0.8); ctx.lineTo(x - s * 0.7, y - s * 0.05);
  ctx.closePath(); ctx.fill();
}
function iconReplay(x, y, s) {
  ctx.strokeStyle = UI.ink; ctx.lineWidth = s * 0.3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, s * 0.75, -Math.PI * 0.3, Math.PI * 1.45); ctx.stroke();
  ctx.fillStyle = UI.ink;
  ctx.beginPath(); ctx.moveTo(x + s * 0.2, y - s * 1.2); ctx.lineTo(x + s * 0.95, y - s * 0.55); ctx.lineTo(x + s * 0.05, y - s * 0.25); ctx.closePath(); ctx.fill();
}
function iconPlay(x, y, s) {
  ctx.fillStyle = UI.ink;
  ctx.beginPath(); ctx.moveTo(x - s * 0.6, y - s * 0.9); ctx.lineTo(x + s * 0.95, y); ctx.lineTo(x - s * 0.6, y + s * 0.9); ctx.closePath(); ctx.fill();
}
// ---------- ovládanie a hlavné tlačidlo späť ----------
const BACK = { x: 56, y: 56, r: 40 };
function drawBackButton() {
  circleButton(BACK.x, BACK.y, BACK.r, UI.peach);
  iconHome(BACK.x, BACK.y, 18);
}
