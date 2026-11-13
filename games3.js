'use strict';
// Hra 5: Kreslenie podľa predlohy, Hra 6: Utekanie, Hra 7: Kŕmenie

// ---------- Kreslenie podľa predlohy ----------
function sampleDots(pts, closed, step) {
  const out = [];
  const n = pts.length;
  const lim = closed ? n : n - 1;
  for (let i = 0; i < lim; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const k = Math.max(1, Math.round(dist(a[0], a[1], b[0], b[1]) / step));
    for (let j = 0; j < k; j++) out.push({ x: a[0] + ((b[0] - a[0]) * j) / k, y: a[1] + ((b[1] - a[1]) * j) / k, hit: false });
  }
  if (!closed) out.push({ x: pts[n - 1][0], y: pts[n - 1][1], hit: false });
  return out;
}
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
  return dist(px, py, ax + t * dx, ay + t * dy);
}

function traceTemplates() {
  const circle = [];
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2 - Math.PI / 2; circle.push([512 + Math.cos(a) * 220, 390 + Math.sin(a) * 215]); }
  const wave = [];
  for (let i = 0; i <= 60; i++) { const x = 150 + (i / 60) * 724; wave.push([x, 390 + Math.sin((i / 60) * Math.PI * 3) * 140]); }
  const heart = [];
  for (let i = 0; i < 96; i++) {
    const a = i * Math.PI * 2 / 96;
    heart.push([512 + 13 * 16 * Math.sin(a) ** 3, 360 - 13 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]);
  }
  const star = [];
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 105 : 220;
    star.push([512 + Math.cos(a) * r, 390 + Math.sin(a) * r]);
  }
  return [
    { pts: circle, closed: true },
    { pts: [[300, 180], [724, 180], [724, 610], [300, 610]], closed: true },
    { pts: [[512, 165], [790, 620], [234, 620]], closed: true },
    { pts: wave, closed: false },
    { pts: heart, closed: true },
    { pts: star, closed: true },
    { pts: [[512, 160], [778, 356], [712, 356], [712, 614], [312, 614], [312, 356], [246, 356]], closed: true },
  ];
}

const traceGame = {
  R: 46,
  enter() {
    this.templates = traceTemplates();
    this.idx = 0;
    this.t = 0;
    this.finish = 0;
    this.mode = null;
    this.dots = [];
  },
  chooseMode(mode) {
    if (mode !== 'free' && mode !== 'line') throw new Error('Neznámy režim kreslenia: ' + mode);
    this.mode = mode;
    this.idx = 0;
    this.finish = 0;
    this.loadTemplate();
    G.demo = { t: 0 };
  },
  loadTemplate() {
    const tp = this.templates[this.idx];
    this.dots = sampleDots(tp.pts, tp.closed, 30);
    this.tp = tp;
    this.strokes = [];
    this.cur = null;
    this.nextDot = 0;
    this.hue = 0;
    this.spider = { x: this.dots[0].x, y: this.dots[0].y };
  },
  down(x, y) {
    if (!this.mode) {
      if (x >= 150 && x <= 480 && y >= 230 && y <= 620) this.chooseMode('free');
      else if (x >= 544 && x <= 874 && y >= 230 && y <= 620) this.chooseMode('line');
      return;
    }
    if (this.mode === 'line') {
      const previous = this.dots[Math.max(0, this.nextDot - 1)];
      if (dist(x, y, previous.x, previous.y) > this.R) return;
    }
    this.cur = { pts: [[x, y]], h: this.hue };
    this.strokes.push(this.cur);
    if (this.mode === 'line') {
      if (this.nextDot === 0) { this.dots[0].hit = true; this.nextDot = 1; }
    } else this.mark(x, y, x, y);
    this.follow(x, y);
  },
  move(x, y) {
    if (!this.cur) return;
    const l = this.cur.pts[this.cur.pts.length - 1];
    if (dist(l[0], l[1], x, y) < 3) return;
    this.cur.pts.push([x, y]);
    this.mark(l[0], l[1], x, y);
    this.follow(x, y);
    this.hue = (this.hue + 2) % 360;
  },
  up() { this.cur = null; },
  follow(x, y) {
    let nearest = null, dmin = this.R + 15;
    for (const d of this.dots) {
      const d0 = dist(x, y, d.x, d.y);
      if (d0 < dmin) { nearest = d; dmin = d0; }
    }
    if (nearest) { this.spider.x = nearest.x; this.spider.y = nearest.y; }
  },
  mark(ax, ay, bx, by) {
    if (this.mode === 'line') {
      while (this.nextDot < this.dots.length) {
        const d = this.dots[this.nextDot];
        if (segDist(d.x, d.y, ax, ay, bx, by) >= this.R) break;
        d.hit = true;
        this.nextDot++;
      }
    } else {
      for (const d of this.dots) {
        if (!d.hit && segDist(d.x, d.y, ax, ay, bx, by) < this.R) d.hit = true;
      }
    }
    if (!this.finish && this.dots.every(d => d.hit)) {
      this.finish = 0.9;
      burst(512, 390, 40);
    }
  },
  update(dt) {
    this.t += dt;
    if (!this.mode) return;
    if (this.finish > 0) {
      this.finish -= dt;
      if (this.finish <= 0) {
        this.finish = 0;
        this.idx++;
        if (this.idx >= this.templates.length) { this.finish = -1; win(); } else this.loadTemplate();
      }
    }
  },
  draw() {
    if (!this.mode) {
      backdrop('#f1edfc', '#fff8e9');
      ctx.fillStyle = UI.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 53px ' + FONT; ctx.fillText('Ako chceš kresliť?', W / 2, 158);
      for (const [mode, x, color, label, detail] of [
        ['free', 150, UI.peach, 'Voľné bodky', 'Ťukaj na bodky'],
        ['line', 544, UI.mint, 'Spoj čiaru', 'Veď prst po čiare'],
      ]) {
        card(x, 230, 330, 390, UI.paper, 36);
        ctx.fillStyle = color; rr(x + 10, 240, 310, 370, 28); ctx.fill();
        ctx.strokeStyle = UI.ink; ctx.lineWidth = mode === 'line' ? 13 : 4;
        if (mode === 'free') ctx.setLineDash([3, 18]);
        ctx.beginPath(); ctx.arc(x + 165, 380, 72, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        drawSpider(x + 165, 380, 23, this.t, { mouth: 'smile' });
        ctx.fillStyle = UI.ink; ctx.font = 'bold 35px ' + FONT; ctx.fillText(label, x + 165, 500, 300);
        ctx.font = '25px ' + FONT; ctx.fillText(detail, x + 165, 555, 300);
      }
      return;
    }
    backdrop('#f1edfc', '#fff8e9');
    card(110, 108, 804, 566, UI.paper, 35);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // cesta
    ctx.beginPath();
    this.tp.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    if (this.tp.closed) ctx.closePath();
    ctx.strokeStyle = '#e8e7f4'; ctx.lineWidth = this.R * 1.5; ctx.stroke();
    // bodky
    this.dots.forEach((d, i) => {
      ctx.fillStyle = d.hit ? '#9876d2' : '#9bacbf';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.hit ? 9 : 11, 0, 7); ctx.fill();
    });
    // čiary dieťaťa
    ctx.lineWidth = 18;
    for (const s of this.strokes) {
      if (s.pts.length < 2) continue;
      let h = s.h;
      for (let i = 1; i < s.pts.length; i++) {
        h = (h + 2) % 360;
        ctx.strokeStyle = 'hsl(' + h + ',85%,55%)';
        ctx.beginPath(); ctx.moveTo(s.pts[i - 1][0], s.pts[i - 1][1]); ctx.lineTo(s.pts[i][0], s.pts[i][1]); ctx.stroke();
      }
    }
    // štart
    if (!this.dots.some(d => d.hit)) {
      const k = Math.sin(this.t * 5) * 4;
      ctx.fillStyle = UI.mint; ctx.beginPath(); ctx.arc(this.spider.x, this.spider.y, 20 + k, 0, 7); ctx.fill();
    }
    drawSpider(this.spider.x, this.spider.y - 46, 23, this.t, { mouth: this.cur ? 'open' : 'smile' });
    // priebeh
    for (let i = 0; i < this.templates.length; i++) {
      const cx = W / 2 - (this.templates.length - 1) * 27 + i * 54;
      if (i < this.idx) drawStar(cx, 49, 18, UI.sun);
      else { ctx.fillStyle = '#d9dce6'; ctx.beginPath(); ctx.arc(cx, 49, 13, 0, 7); ctx.fill(); }
    }
  },
};

// ---------- Utekanie ----------
const LANES = [312, 512, 712];
const SPY = 600;

const runGame = {
  goal: 10,
  enter() {
    this.t = 0;
    this.lane = 1;
    this.x = LANES[1];
    this.objs = [];
    this.score = 0;
    this.speed = 165;
    this.spawnT = 1.6;
    this.scroll = 0;
    this.stumble = 0;
    this.gap = 230;
    this.spin = 0;
    this.finish = 0;
    this.beeX = this.x;
  },
  down(x) {
    let best = 0;
    LANES.forEach((l, i) => { if (Math.abs(l - x) < Math.abs(LANES[best] - x)) best = i; });
    this.lane = best;
  },
  move() {},
  up() {},
  update(dt) {
    this.t += dt;
    this.scroll += this.speed * dt;
    this.x += (LANES[this.lane] - this.x) * Math.min(1, dt * 12);
    this.stumble = Math.max(0, this.stumble - dt);
    this.spin = Math.max(0, this.spin - dt);
    this.beeX += (this.x - this.beeX) * Math.min(1, dt * 5);
    this.gap = Math.min(230, this.gap + 7 * dt);
    if (this.finish > 0) { this.finish -= dt; if (this.finish <= 0) { this.finish = -1; win(); } return; }

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.9;
      const fl = Math.floor(rnd(0, 3));
      this.objs.push({ lane: fl, y: -60, type: 'fly' });
      if (Math.random() < 0.8) {
        const others = [0, 1, 2].filter(l => l !== fl);
        const n = Math.random() < 0.3 ? 2 : 1;
        shuffle(others).slice(0, n).forEach(l => this.objs.push({ lane: l, y: -60, type: Math.random() < 0.5 ? 'rock' : 'puddle' }));
      }
    }
    for (let i = this.objs.length - 1; i >= 0; i--) {
      const o = this.objs[i];
      o.y += this.speed * dt;
      const near = Math.abs(o.y - SPY) < 48 && Math.abs(LANES[o.lane] - this.x) < 60;
      if (near && !o.gone) {
        if (o.type === 'fly') {
          this.score++; burst(LANES[o.lane], o.y, 12, ['#ffd740', '#fff']);
          this.gap = Math.min(230, this.gap + 25);
          this.objs.splice(i, 1);
          if (this.score >= this.goal) this.finish = 0.8;
          continue;
        }
        o.gone = true; this.stumble = 0.6; this.gap -= 60;
        if (this.gap < 90) { this.gap = 230; this.spin = 0.9; }
      }
      if (o.y > H + 80) this.objs.splice(i, 1);
    }
  },
  draw() {
    backdrop('#c8ebda', '#eaf7d7');
    ctx.fillStyle = '#86cf9c'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d7bb93'; ctx.fillRect(212, 0, 600, H);
    ctx.fillStyle = '#c7a982';
    ctx.fillRect(208, 0, 8, H); ctx.fillRect(808, 0, 8, H);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let l = 0; l < 2; l++) {
      for (let i = -1; i < 12; i++) {
        const y = ((i * 80 + this.scroll) % 960) - 80;
        ctx.fillRect(412 + l * 200 - 5, y, 10, 40);
      }
    }
    // kvety pri ceste
    for (let i = 0; i < 10; i++) {
      const y = ((i * 110 + this.scroll) % 1100) - 100;
      ctx.fillStyle = ['#ff7043', '#ffee58', '#f06292'][i % 3];
      ctx.beginPath(); ctx.arc(80 + (i % 2) * 90, y, 12, 0, 7); ctx.arc(900 + (i % 2) * 60, y + 50, 12, 0, 7); ctx.fill();
    }
    for (const o of this.objs) {
      const x = LANES[o.lane];
      if (o.type === 'fly') drawFly(x, o.y, 34, this.t + o.lane, false);
      else if (o.type === 'rock') {
        ctx.fillStyle = o.gone ? 'rgba(120,125,135,0.4)' : '#8a8f98';
        ctx.beginPath(); ctx.ellipse(x, o.y, 52, 40, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#aeb3bb'; ctx.beginPath(); ctx.ellipse(x - 14, o.y - 14, 16, 9, -0.4, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = o.gone ? 'rgba(90,160,230,0.4)' : '#5aa9e6';
        ctx.beginPath(); ctx.ellipse(x, o.y, 64, 34, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x - 18, o.y - 8, 18, 7, 0, 0, 7); ctx.fill();
      }
    }
    // včielka naháňa
    const by = SPY + this.gap;
    if (by < 800) drawBee(this.beeX, by + Math.sin(this.t * 8) * 6, 44, this.t);
    const flash = this.stumble > 0 && Math.floor(this.t * 20) % 2 === 0;
    ctx.globalAlpha = flash ? 0.4 : 1;
    drawSpider(this.x, SPY, 36, this.t * 0.65, { run: 1, look: { x: 0, y: -1 }, rot: this.spin > 0 ? this.spin * 14 : 0, mouth: this.stumble > 0 ? 'no' : 'open' });
    ctx.globalAlpha = 1;
    for (let i = 0; i < this.goal; i++) {
      const cx = W / 2 - (this.goal - 1) * 24 + i * 48;
      if (i < this.score) drawFly(cx, 52, 20, this.t, false);
      else { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(cx, 52, 12, 0, 7); ctx.fill(); }
    }
  },
};

// ---------- Kŕmenie ----------
const FOOD_TYPES = ['fly', 'mosquito', 'cricket'];
const FEED_SLOTS = [[620, 200], [800, 170], [930, 300], [700, 340], [860, 450], [640, 500], [790, 610], [930, 640]];
const MOUTH = { x: 290, y: 480 };
function drawFood(type, x, y, s, t) {
  if (type === 'fly') drawFly(x, y, s, t, false);
  else if (type === 'mosquito') drawMosquito(x, y, s, t);
  else if (type === 'cricket') drawCricket(x, y, s, t);
  else throw new Error('Neznámy druh jedla: ' + type);
}

const feedGame = {
  rounds: [2, 3, 4],
  enter() {
    this.t = 0;
    this.round = 0;
    this.belly = 0;
    this.mood = 'smile';
    this.moodT = 0;
    this.drag = null;
    this.next = 0;
    this.startRound();
  },
  startRound() {
    this.need = this.rounds[this.round];
    this.eaten = 0;
    this.done = false;
    const slots = shuffle(FEED_SLOTS.slice());
    const items = [];
    for (let i = 0; i < this.need + 1; i++) items.push(FOOD_TYPES[(this.round + i) % FOOD_TYPES.length]);
    items.push('boot', 'rock');
    this.items = items.map((type, i) => ({ type, x: slots[i][0], y: slots[i][1], hx: slots[i][0], hy: slots[i][1], ret: false, gone: false, away: 0 }));
  },
  down(x, y) {
    if (this.done) return;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const o = this.items[i];
      if (!o.gone && dist(x, y, o.x, o.y) < 62) {
        this.drag = o; o.ret = false; this.dx = o.x - x; this.dy = o.y - y;
        this.items.splice(i, 1); this.items.push(o);
        return;
      }
    }
  },
  move(x, y) { if (this.drag) { this.drag.x = x + this.dx; this.drag.y = y + this.dy; } },
  up() {
    const o = this.drag;
    this.drag = null;
    if (!o) return;
    if (dist(o.x, o.y, MOUTH.x, MOUTH.y) < 120) {
      if (FOOD_TYPES.includes(o.type) && !this.done) {
        o.gone = true; this.eaten++; this.belly++; this.mood = 'open'; this.moodT = 0.5;
        burst(MOUTH.x, MOUTH.y, 12, ['#ffd740', '#ff8a65']);
        if (this.eaten >= this.need) { this.done = true; this.next = 1.6; }
      } else {
        o.ret = true; this.mood = 'no'; this.moodT = 0.9;
      }
    } else {
      o.ret = true;
    }
  },
  update(dt) {
    this.t += dt;
    this.moodT = Math.max(0, this.moodT - dt);
    if (this.moodT === 0 && !this.drag) this.mood = 'smile';
    if (this.drag && this.mood === 'smile' && dist(this.drag.x, this.drag.y, MOUTH.x, MOUTH.y) < 200) this.mood = 'open';
    if (this.drag && this.mood === 'open' && this.moodT === 0 && dist(this.drag.x, this.drag.y, MOUTH.x, MOUTH.y) >= 200) this.mood = 'smile';
    for (const o of this.items) {
      if (o.ret) {
        o.x += (o.hx - o.x) * Math.min(1, dt * 10);
        o.y += (o.hy - o.y) * Math.min(1, dt * 10);
        if (dist(o.x, o.y, o.hx, o.hy) < 2) o.ret = false;
      }
      if (this.done && !o.gone) { o.y -= 300 * dt; o.x += 80 * dt; }
    }
    if (this.done) {
      this.next -= dt;
      if (this.next <= 0) {
        this.done = false;
        this.round++;
        if (this.round >= this.rounds.length) { this.next = 99; this.done = true; win(); } else this.startRound();
      }
    }
  },
  draw() {
    backdrop('#d9f0fb', '#f7e9f4');
    ctx.fillStyle = '#aedbc3'; ctx.fillRect(0, 640, W, 128);
    card(110, 70, 360, 150, UI.paper, 36);
    ctx.beginPath(); ctx.moveTo(250, 215); ctx.lineTo(290, 215); ctx.lineTo(285, 270); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
    for (let i = 0; i < this.need; i++) {
      const cx = 290 - (this.need - 1) * 38 + i * 76;
      ctx.globalAlpha = i < this.eaten ? 1 : 0.35;
      drawFood(FOOD_TYPES[(this.round + i) % FOOD_TYPES.length], cx, 145, 30, this.t * 0.2);
      ctx.globalAlpha = 1;
      if (i < this.eaten) { ctx.fillStyle = '#4ba881'; ctx.font = 'bold 34px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('✓', cx, 205); }
    }
    // pavúk
    const bounce = Math.sin(this.t * 3) * 4;
    drawSpider(290, 450 + bounce, 105, this.t, { mouth: this.mood, belly: this.belly, headShake: this.mood === 'no' ? Math.min(1, this.moodT * 2) : 0, look: this.drag ? { x: clamp((this.drag.x - 290) / 300, -1, 1), y: clamp((this.drag.y - 450) / 300, -1, 1) } : { x: 0, y: 0 } });
    // veci
    for (const o of this.items) {
      if (o.gone) continue;
      const bob = o === this.drag ? 0 : Math.sin(this.t * 3 + o.hx) * 6;
      ctx.save();
      if (o === this.drag) { ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; }
      if (FOOD_TYPES.includes(o.type)) drawFood(o.type, o.x, o.y + bob, 52, this.t + o.hx);
      else if (o.type === 'boot') {
        ctx.fillStyle = '#795548';
        ctx.beginPath(); ctx.moveTo(o.x - 28, o.y - 42); ctx.lineTo(o.x + 14, o.y - 42); ctx.lineTo(o.x + 14, o.y + 4);
        ctx.lineTo(o.x + 50, o.y + 18); ctx.lineTo(o.x + 50, o.y + 40); ctx.lineTo(o.x - 28, o.y + 40); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3e2723'; ctx.fillRect(o.x - 28, o.y + 30, 78, 10);
      } else {
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath(); ctx.ellipse(o.x, o.y + bob, 48, 38, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#bdbdbd'; ctx.beginPath(); ctx.ellipse(o.x - 14, o.y - 12 + bob, 16, 9, -0.4, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
  },
};
