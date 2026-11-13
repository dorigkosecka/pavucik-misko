'use strict';
// Hra 1: Preskakovanie, Hra 2: Maľovanie

const GY = 600; // zem

const jumpGame = {
  goal: 10,
  enter() {
    this.mode = null;
    this.scores = [0, 0];
    this.checkpoint = false;
    this.t = 0;
  },
  chooseMode(mode) {
    if (mode !== 'normal' && mode !== 'calm') throw new Error('Neznámy režim skákania: ' + mode);
    this.start(mode, [0, 0]);
    G.demo = { t: 0 };
  },
  start(mode, scores) {
    this.mode = mode;
    this.obs = [];
    this.scores = scores.slice();
    this.checkpoint = mode === 'calm' && scores.every(n => n >= 5);
    this.nextType = 0;
    this.x = 230;
    this.y = GY;
    this.vy = 0;
    this.speed = 220;
    this.spawnT = 1.6;
    this.scroll = 0;
    this.crashT = 0;
    this.buf = 0;
    this.finish = 0;
    this.hint = true;
    this.t = 0;
  },
  down(x, y) {
    if (!this.mode) {
      if (x >= 160 && x <= 480 && y >= 230 && y <= 600) this.chooseMode('normal');
      else if (x >= 544 && x <= 864 && y >= 230 && y <= 600) this.chooseMode('calm');
      return;
    }
    if (this.crashT <= 0) this.buf = 0.15;
  },
  move() {},
  up() {},
  update(dt) {
    this.t += dt;
    if (!this.mode) return;
    if (this.crashT > 0) {
      this.crashT -= dt;
      if (this.crashT <= 0) this.start(this.mode, this.checkpoint ? [5, 5] : [0, 0]);
      return;
    }
    this.scroll += this.speed * dt;
    this.buf -= dt;
    const onGround = this.y >= GY;
    if (this.buf > 0 && onGround) {
      this.vy = -800; this.buf = 0; this.hint = false;
    }
    this.vy += 1500 * dt;
    this.y += this.vy * dt;
    if (this.y >= GY) { this.y = GY; this.vy = 0; }

    if (this.finish > 0) {
      this.finish -= dt;
      if (this.finish <= 0) win();
      return;
    }
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.obs.push({ x: W + 60, w: 56, h: rnd(48, 68), type: this.nextType, done: false });
      this.nextType = 1 - this.nextType;
      this.spawnT = rnd(2.6, 3.4);
    }
    for (let i = this.obs.length - 1; i >= 0; i--) {
      const o = this.obs[i];
      o.x -= this.speed * dt;
      if (o.x < this.x + 20 && o.x + o.w > this.x - 20 && this.y > GY - o.h + 6) {
        this.crashT = 0.75;
        this.buf = 0;
        burst(this.x, this.y - 36, 24, ['#ffffff', '#bce8f8', '#ffdfb4']);
        break;
      }
      if (!o.done && o.x + o.w < this.x - 20) {
        o.done = true;
        this.scores[o.type]++;
        burst(this.x, this.y - 80, 14, [o.type ? UI.red : UI.blue, '#fff']);
        if (this.mode === 'calm' && !this.checkpoint && this.scores.every(n => n >= 5)) {
          this.checkpoint = true;
          burst(512, 130, 30, [UI.sun, UI.mint]);
        }
        if (this.scores.every(n => n >= this.goal)) this.finish = 0.8;
      }
      if (o.x < -120) this.obs.splice(i, 1);
    }
  },
  draw() {
    if (!this.mode) {
      backdrop('#dbeafa', '#f7ecf8');
      ctx.fillStyle = UI.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 53px ' + FONT; ctx.fillText('Vyber si skákanie', W / 2, 158);
      for (const [mode, x, color, label, detail] of [
        ['normal', 160, UI.blue, 'Bežné', 'Po náraze od začiatku'],
        ['calm', 544, UI.mint, 'Pokojné', 'Kontrolný bod v polovici'],
      ]) {
        card(x, 230, 320, 370, UI.paper, 36);
        ctx.fillStyle = color; rr(x + 10, 240, 300, 350, 28); ctx.fill();
        drawSpider(x + 160, 370, 50, this.t, { mouth: 'smile' });
        drawStar(x + 160, 300, mode === 'calm' ? 34 : 24, UI.sun);
        ctx.fillStyle = UI.ink; ctx.font = 'bold 39px ' + FONT; ctx.fillText(label, x + 160, 475);
        ctx.font = '25px ' + FONT; ctx.fillText(detail, x + 160, 535, 290);
      }
      return;
    }
    const t = this.t;
    const g = ctx.createLinearGradient(0, 0, 0, GY);
    g.addColorStop(0, '#c6e7fb'); g.addColorStop(1, '#edf9fc');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f9dc85';
    ctx.beginPath(); ctx.arc(880, 145, 52, 0, Math.PI * 2); ctx.fill();
    // oblaky
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 330 - this.scroll * 0.15) % 1400 + 1400) % 1400 - 200;
      ctx.beginPath(); ctx.arc(cx, 150 + (i % 2) * 70, 38, 0, 7); ctx.arc(cx + 40, 140 + (i % 2) * 70, 48, 0, 7); ctx.arc(cx + 85, 155 + (i % 2) * 70, 34, 0, 7); ctx.fill();
    }
    // kopce
    for (let k = 0; k < 2; k++) {
      ctx.fillStyle = k ? '#8dd8a9' : '#b5e7ba';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 380 - this.scroll * (0.3 + 0.2 * k) + k * 150) % 1600 + 1600) % 1600 - 300;
        ctx.beginPath(); ctx.ellipse(cx, GY, 260, 120 - k * 30, 0, Math.PI, Math.PI * 2); ctx.fill();
      }
    }
    // zem
    ctx.fillStyle = '#6fcb96'; ctx.fillRect(0, GY, W, 26);
    ctx.fillStyle = '#b68e72'; ctx.fillRect(0, GY + 26, W, H - GY - 26);
    ctx.fillStyle = '#a27a62';
    for (let i = 0; i < 12; i++) {
      const px = ((i * 120 - this.scroll) % 1400 + 1400) % 1400 - 100;
      ctx.beginPath(); ctx.ellipse(px, GY + 70 + (i % 3) * 28, 22, 8, 0, 0, 7); ctx.fill();
    }
    // prekážky
    for (const o of this.obs) {
      ctx.save();
      ctx.translate(o.x + o.w / 2, GY - o.h / 2);
      if (o.type === 0) {
        ctx.fillStyle = '#829bb5';
        rr(-o.w / 2, -o.h / 2, o.w, o.h, 22); ctx.fill();
        ctx.fillStyle = '#b9c9d8';
        ctx.beginPath(); ctx.ellipse(-o.w * 0.15, -o.h * 0.2, o.w * 0.2, o.h * 0.12, -0.4, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = '#b47c55';
        rr(-o.w / 2, -o.h / 2, o.w, o.h, 10); ctx.fill();
        ctx.fillStyle = '#d4a47d';
        ctx.beginPath(); ctx.ellipse(0, -o.h / 2 + 8, o.w / 2 - 4, 8, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#7a4f28'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-o.w * 0.15, -o.h * 0.1); ctx.lineTo(-o.w * 0.15, o.h * 0.35); ctx.moveTo(o.w * 0.2, 0); ctx.lineTo(o.w * 0.2, o.h * 0.4); ctx.stroke();
      }
      ctx.restore();
    }
    // pavúk
    const air = this.y < GY;
    if (this.crashT > 0) {
      const puff = (0.75 - this.crashT) / 0.75;
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - puff) + ')';
      for (let i = 0; i < 7; i++) {
        const a = i * Math.PI * 2 / 7;
        ctx.beginPath();
        ctx.arc(this.x + Math.cos(a) * 58 * puff, this.y - 35 + Math.sin(a) * 58 * puff, 23 * (1 - puff * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      drawSpider(this.x, this.y - 34 * 0.95, 34, t, { run: air ? 0 : 1, rot: air ? -0.1 : 0, mouth: air ? 'open' : 'smile', look: { x: 1, y: 0 } });
    }
    // nápoveda
    if (this.hint) {
      const k = (Math.sin(t * 5) + 1) / 2;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.4 * k) + ')'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(this.x, this.y - 140, 40 + k * 14, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.moveTo(this.x, this.y - 128); ctx.lineTo(this.x - 14, this.y - 150); ctx.lineTo(this.x + 14, this.y - 150); ctx.closePath(); ctx.fill();
    }
    card(245, 20, 565, 112, 'rgba(255,255,255,0.86)', 24);
    for (let type = 0; type < 2; type++) {
      const cy = 50 + type * 55;
      drawStar(277, cy, 19, type ? UI.red : UI.blue);
      for (let i = 0; i < this.goal; i++) {
        const cx = 320 + i * 48;
        if (i < this.scores[type]) drawStar(cx, cy, 17, type ? UI.red : UI.blue);
        else { ctx.fillStyle = '#dfe9ef'; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    if (this.checkpoint) drawStar(790, 106, 20, UI.sun);
  },
};

// ---------- Maľovanie ----------
const PAINT_COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#ec407a', '#6d4c41'];
const PAINT_PICTURES = [
  {
    name: 'Dinosaurus',
    regions: [
      { t: 'poly', p: [[370, 381], [237, 286], [275, 439], [388, 453]] },
      { t: 'rect', x: 392, y: 460, w: 58, h: 115 },
      { t: 'rect', x: 545, y: 460, w: 58, h: 115 },
      { t: 'ellipse', x: 485, y: 400, rx: 174, ry: 96 },
      { t: 'poly', p: [[540, 376], [606, 240], [654, 250], [620, 420]] },
      { t: 'ellipse', x: 705, y: 245, rx: 84, ry: 60 },
      { t: 'poly', p: [[362, 343], [390, 283], [421, 333], [454, 274], [490, 332], [526, 283], [556, 352]] },
    ],
  },
  {
    name: 'Domček',
    regions: [
      { t: 'rect', x: 370, y: 335, w: 284, h: 242 },
      { t: 'poly', p: [[334, 341], [512, 189], [690, 341]] },
      { t: 'rect', x: 481, y: 472, w: 65, h: 105 },
      { t: 'rect', x: 406, y: 382, w: 64, h: 65 },
      { t: 'rect', x: 570, y: 382, w: 64, h: 65 },
      { t: 'rect', x: 760, y: 458, w: 28, h: 119 },
      { t: 'circle', x: 775, y: 398, r: 65 },
      { t: 'circle', x: 784, y: 198, r: 52 },
    ],
  },
  {
    name: 'Auto',
    regions: [
      { t: 'rect', x: 245, y: 371, w: 534, h: 157 },
      { t: 'poly', p: [[354, 372], [424, 286], [624, 286], [704, 372]] },
      { t: 'poly', p: [[428, 306], [500, 306], [500, 358], [385, 358]] },
      { t: 'poly', p: [[516, 306], [618, 306], [668, 358], [516, 358]] },
      { t: 'rect', x: 516, y: 385, w: 157, h: 115 },
      { t: 'circle', x: 355, y: 532, r: 50 },
      { t: 'circle', x: 668, y: 532, r: 50 },
    ],
  },
];

const paintGame = {
  brushRadius: 26,
  cellSize: 4,
  enter() {
    this.picture = -1;
    this.completed = new Set();
    this.sel = 0;
    this.finish = 0;
    this.t = 0;
    this.brush = null;
    this.painting = false;
    this.layer = null;
  },
  get regions() { return this.picture < 0 ? [] : PAINT_PICTURES[this.picture].regions; },
  choose(i) {
    if (this.completed.has(i)) return;
    this.picture = i;
    this.sel = 0;
    this.brush = null;
    this.painting = false;
    this.initLayer();
    if (this.completed.size === 0) G.demo = { t: 0 };
  },
  initLayer() {
    this.layer = document.createElement('canvas');
    this.layer.width = W; this.layer.height = H;
    this.layerCtx = this.layer.getContext('2d');
    if (!this.layerCtx) throw new Error('Nedá sa vytvoriť plátno na maľovanie.');
    this.layerCtx.fillStyle = '#fff';
    for (const r of this.regions) { this.pathOf(r, this.layerCtx); this.layerCtx.fill(); }
    this.layerCtx.globalCompositeOperation = 'source-atop';
    this.layerCtx.lineWidth = this.brushRadius * 2;
    this.layerCtx.lineCap = this.layerCtx.lineJoin = 'round';

    const cols = W / this.cellSize, rows = H / this.cellSize;
    this.mask = new Uint8Array(cols * rows);
    this.covered = new Uint8Array(cols * rows);
    this.totalCells = this.coveredCount = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col + 0.5) * this.cellSize, y = (row + 0.5) * this.cellSize;
        if (this.regions.some(r => this.inShape(r, x, y))) {
          this.mask[row * cols + col] = 1;
          this.totalCells++;
        }
      }
    }
    if (!this.totalCells) throw new Error('Obrázok nemá plochu na maľovanie.');
  },
  paintStroke(ax, ay, bx, by) {
    const color = PAINT_COLORS[this.sel];
    this.layerCtx.strokeStyle = this.layerCtx.fillStyle = color;
    this.layerCtx.beginPath(); this.layerCtx.moveTo(ax, ay); this.layerCtx.lineTo(bx, by); this.layerCtx.stroke();
    this.layerCtx.beginPath(); this.layerCtx.arc(bx, by, this.brushRadius, 0, Math.PI * 2); this.layerCtx.fill();

    const cell = this.cellSize, radius = this.brushRadius, cols = W / cell;
    const left = Math.max(0, Math.floor((Math.min(ax, bx) - radius) / cell));
    const right = Math.min(cols - 1, Math.floor((Math.max(ax, bx) + radius) / cell));
    const top = Math.max(0, Math.floor((Math.min(ay, by) - radius) / cell));
    const bottom = Math.min(H / cell - 1, Math.floor((Math.max(ay, by) + radius) / cell));
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        const index = row * cols + col;
        if (!this.mask[index] || this.covered[index]) continue;
        if (segDist((col + 0.5) * cell, (row + 0.5) * cell, ax, ay, bx, by) <= radius) {
          this.covered[index] = 1;
          this.coveredCount++;
        }
      }
    }
    if (this.coveredCount * 5 >= this.totalCells * 4 && !this.completed.has(this.picture)) {
      this.completed.add(this.picture);
      this.painting = false;
      this.finish = 0.9;
    }
  },
  swatch(i) { return { x: 130 + i * 100, y: 696 }; },
  tile(i) { return { x: 116 + i * 275, y: 228, w: 242, h: 290 }; },
  inShape(r, x, y) {
    if (r.t === 'rect') return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (r.t === 'circle') return dist(x, y, r.x, r.y) <= r.r;
    if (r.t === 'ellipse') return ((x - r.x) / r.rx) ** 2 + ((y - r.y) / r.ry) ** 2 <= 1;
    let inside = false;
    const p = r.p;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  },
  pathOf(r, target = ctx) {
    target.beginPath();
    if (r.t === 'rect') target.rect(r.x, r.y, r.w, r.h);
    else if (r.t === 'circle') target.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    else if (r.t === 'ellipse') target.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, Math.PI * 2);
    else { r.p.forEach((q, i) => (i ? target.lineTo(q[0], q[1]) : target.moveTo(q[0], q[1]))); target.closePath(); }
  },
  down(x, y) {
    if (this.finish > 0) return;
    if (this.picture < 0) {
      for (let i = 0; i < PAINT_PICTURES.length; i++) {
        const t = this.tile(i);
        if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) { this.choose(i); return; }
      }
      return;
    }
    for (let i = 0; i < PAINT_COLORS.length; i++) {
      const s = this.swatch(i);
      if (dist(x, y, s.x, s.y) < 52) {
        this.sel = i; this.brush = { x, y }; this.painting = false; return;
      }
    }
    if (!this.regions.some(r => this.inShape(r, x, y))) return;
    this.brush = { x, y };
    this.last = { x, y };
    this.painting = true;
    this.paintStroke(x, y, x, y);
  },
  move(x, y) {
    if (!this.brush) return;
    this.brush.x = x; this.brush.y = y;
    if (this.painting) {
      this.paintStroke(this.last.x, this.last.y, x, y);
      this.last = { x, y };
    }
  },
  up() { this.brush = null; this.last = null; this.painting = false; },
  update(dt) {
    this.t += dt;
    if (this.finish > 0) {
      this.finish -= dt;
      if (this.finish <= 0) {
        this.finish = 0;
        this.brush = null;
        if (this.completed.size === PAINT_PICTURES.length) { this.finish = -1; win(); }
        else this.picture = -1;
      }
    }
  },
  drawPicture(regions, fills, picture, outlineOnly = false) {
    ctx.lineJoin = 'round';
    regions.forEach((r, i) => {
      this.pathOf(r);
      if (!outlineOnly) {
        ctx.fillStyle = fills ? (fills[i] || '#ffffff') : ['#b8d7e4', '#eac8a9', '#b6dfbc', '#efc3c4', '#c4b8e3'][i % 5];
        ctx.fill();
      }
      ctx.lineWidth = 6; ctx.strokeStyle = UI.ink; ctx.stroke();
    });
    if (picture === 0) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(742, 226, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = UI.ink;
      ctx.beginPath(); ctx.arc(748, 228, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = UI.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(735, 256, 21, Math.PI * 0.16, Math.PI * 0.79); ctx.stroke();
    }
  },
  drawBrush(x, y) {
    ctx.save(); ctx.translate(x + 24, y - 40); ctx.rotate(0.45);
    ctx.fillStyle = '#cf9a70'; rr(-7, -65, 14, 53, 5); ctx.fill();
    ctx.fillStyle = '#b7c8d6'; rr(-11, -15, 22, 24, 5); ctx.fill();
    ctx.fillStyle = PAINT_COLORS[this.sel];
    ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(10, 8); ctx.quadraticCurveTo(6, 32, 0, 38); ctx.quadraticCurveTo(-6, 32, -10, 8); ctx.fill();
    ctx.restore();
  },
  draw() {
    backdrop('#fbe9e5', '#fff5dd');
    if (this.picture < 0) {
      ctx.fillStyle = UI.ink; ctx.font = 'bold 48px ' + FONT; ctx.textAlign = 'center';
      ctx.fillText('Vyber obrázok', W / 2, 170);
      for (let i = 0; i < PAINT_PICTURES.length; i++) {
        const t = this.tile(i), done = this.completed.has(i);
        card(t.x, t.y, t.w, t.h, UI.paper, 30);
        ctx.fillStyle = ['#d3e9d8', '#e2d8f6', '#d2e8fa'][i];
        rr(t.x + 10, t.y + 10, t.w - 20, t.h - 20, 23); ctx.fill();
        ctx.save();
        ctx.translate(t.x + t.w / 2, t.y + 120);
        ctx.scale(0.34, 0.34);
        ctx.translate(-512, -390);
        this.drawPicture(PAINT_PICTURES[i].regions, null, i);
        ctx.restore();
        ctx.fillStyle = UI.ink; ctx.font = 'bold 30px ' + FONT;
        ctx.fillText(PAINT_PICTURES[i].name, t.x + t.w / 2, t.y + 255, t.w - 20);
        if (done) {
          ctx.fillStyle = 'rgba(255,255,255,0.62)'; rr(t.x + 10, t.y + 10, t.w - 20, t.h - 20, 23); ctx.fill();
          drawStar(t.x + t.w / 2, t.y + 118, 47, UI.sun);
        }
      }
      drawSpider(512, 653, 38, this.t, { mouth: 'smile' });
      return;
    }
    card(112, 99, 800, 530, UI.paper, 32);
    ctx.fillStyle = '#d4eddc'; rr(132, 546, 760, 60, 16); ctx.fill();
    ctx.drawImage(this.layer, 0, 0);
    this.drawPicture(this.regions, null, this.picture, true);
    card(312, 16, 400, 68, UI.paper, 22);
    ctx.fillStyle = UI.ink; ctx.font = 'bold 27px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Vyfarbené ' + Math.floor(this.coveredCount * 100 / this.totalCells) + ' % / 80 %', 512, 49, 370);
    card(73, 640, 878, 113, 'rgba(255,255,255,0.87)', 30);
    for (let i = 0; i < PAINT_COLORS.length; i++) {
      const s = this.swatch(i);
      const on = i === this.sel;
      if (on) { ctx.fillStyle = '#e7e2f5'; ctx.beginPath(); ctx.arc(s.x, s.y, 53, 0, 7); ctx.fill(); }
      ctx.fillStyle = PAINT_COLORS[i];
      ctx.beginPath(); ctx.arc(s.x, s.y, on ? 46 : 38, 0, 7); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(38,54,80,0.28)'; ctx.stroke();
    }
    if (this.brush) this.drawBrush(this.brush.x, this.brush.y);
    for (let i = 0; i < this.completed.size; i++) drawStar(780 + i * 56, 68, 23, UI.sun);
  },
};
