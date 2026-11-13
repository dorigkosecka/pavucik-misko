'use strict';
// Hra 3: Triedenie podľa farby, Hra 4: Triedenie podľa tvaru

const SORT_COLORS = ['#e85f68', '#4b91e8', '#f6ce55', '#62bd82', '#f5a653'];
const SORT_EXTRA = SORT_COLORS;
const BIN_Y = 500, BIN_H = 230;

function makeSort(mode) {
  const colorMode = mode === 'color';
  const binW = colorMode ? 174 : 260;
  return {
    mode,
    enter() {
      this.t = 0;
      this.finish = 0;
      this.drag = null;
      this.placed = 0;
      this.total = colorMode ? 15 : 9;
      this.wave = 0;
      this.waveDelay = 0;
      this.bins = Array.from({ length: colorMode ? 5 : 3 }, (_, k) => ({
        kind: k, cx: colorMode ? 112 + k * 200 : 192 + k * 320, count: 0, shake: 0,
      }));
      this.items = [];
      if (colorMode) this.spawnWave();
      else this.addItems(shuffle([0, 0, 0, 1, 1, 1, 2, 2, 2]));
    },
    spawnWave() {
      this.wave++;
      this.addItems(shuffle([0, 1, 2, 3, 4]));
    },
    addItems(kinds) {
      for (const k of kinds) {
        let x, y, tries = 0;
        if (colorMode) {
          const slot = this.items.length - (this.wave - 1) * 5;
          x = 132 + slot * 190; y = 206 + (slot % 2) * 112;
        } else {
          do {
            x = rnd(120, 904); y = rnd(130, 420); tries++;
          } while (tries < 300 && this.items.some(o => dist(o.x, o.y, x, y) < 112));
        }
        const other = colorMode ? Math.floor(rnd(0, 3)) : pick(SORT_EXTRA);
        this.items.push({
          kind: k, wave: this.wave, x, y, hx: x, hy: y, placed: false, tx: 0, ty: 0, ret: false, r: colorMode ? 43 : 48,
          shape: colorMode ? other : k,
          color: colorMode ? SORT_COLORS[k] : other,
        });
      }
    },
    down(x, y) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const o = this.items[i];
        if (!o.placed && dist(x, y, o.x, o.y) < o.r + 16) {
          this.drag = o; o.ret = false;
          this.items.splice(i, 1); this.items.push(o);
          this.dx = o.x - x; this.dy = o.y - y;
          return;
        }
      }
    },
    move(x, y) {
      if (this.drag) { this.drag.x = x + this.dx; this.drag.y = y + this.dy; }
    },
    up(x, y) {
      const o = this.drag;
      if (!o) return;
      this.drag = null;
      const bin = this.bins.find(b => o.x > b.cx - binW / 2 && o.x < b.cx + binW / 2 && o.y > BIN_Y - 30);
      if (bin && bin.kind === o.kind) {
        o.placed = true;
        o.tx = colorMode ? bin.cx - 43 + bin.count * 43 : bin.cx - 70 + bin.count * 70;
        o.ty = BIN_Y + 151;
        bin.count++;
        this.placed++;
        burst(o.tx, o.ty, 12);
        if (this.placed === this.total) this.finish = 1;
        else if (colorMode && this.items.filter(i => i.wave === this.wave).every(i => i.placed)) this.waveDelay = 0.6;
      } else {
        o.ret = true;
        if (bin) bin.shake = 0.5;
      }
    },
    update(dt) {
      this.t += dt;
      for (const b of this.bins) b.shake = Math.max(0, b.shake - dt);
      if (this.waveDelay > 0) {
        this.waveDelay -= dt;
        if (this.waveDelay <= 0) { this.waveDelay = 0; this.spawnWave(); }
      }
      for (const o of this.items) {
        if (o.placed) {
          o.x += (o.tx - o.x) * Math.min(1, dt * 12);
          o.y += (o.ty - o.y) * Math.min(1, dt * 12);
          o.r += ((colorMode ? 20 : 30) - o.r) * Math.min(1, dt * 12);
        } else if (o.ret) {
          o.x += (o.hx - o.x) * Math.min(1, dt * 10);
          o.y += (o.hy - o.y) * Math.min(1, dt * 10);
          if (dist(o.x, o.y, o.hx, o.hy) < 2) o.ret = false;
        }
      }
      if (this.finish > 0) { this.finish -= dt; if (this.finish <= 0) { this.finish = -1; win(); } }
    },
    draw() {
      backdrop(colorMode ? '#e5f3fc' : '#e9f7ee', colorMode ? '#fef6e8' : '#f6f7e9');
      ctx.fillStyle = colorMode ? '#d9e8f4' : '#d6edd8';
      ctx.fillRect(0, 470, W, 298);
      if (colorMode) {
        card(218, 18, 614, 68, UI.paper, 24);
        for (let i = 0; i < this.total; i++) {
          const x = 255 + i * 38;
          ctx.fillStyle = i < this.placed ? SORT_COLORS[i % 5] : '#dce4ec';
          ctx.beginPath(); ctx.arc(x, 52, 13, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (const b of this.bins) {
        const sx = Math.sin(this.t * 60) * b.shake * 14;
        const x = b.cx - binW / 2 + sx;
        const col = colorMode ? SORT_COLORS[b.kind] : UI.muted;
        card(x, BIN_Y, binW, BIN_H, UI.paper, 26);
        ctx.lineWidth = 8; ctx.strokeStyle = col; rr(x + 4, BIN_Y + 4, binW - 8, BIN_H - 8, 24); ctx.stroke();
        if (colorMode) {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(b.cx + sx, BIN_Y + 65, 33, 0, Math.PI * 2); ctx.fill();
        } else {
          shapePath(b.kind, b.cx + sx, BIN_Y + 58, 36);
          ctx.fillStyle = '#edf1f5'; ctx.fill();
          ctx.lineWidth = 6; ctx.strokeStyle = UI.muted; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      for (const o of this.items) {
        const bob = o.placed || o === this.drag ? 0 : Math.sin(this.t * 2 + o.hx) * 4;
        const lift = o === this.drag ? 1.15 : 1;
        ctx.save();
        if (o === this.drag) { ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10; }
        drawShape(o.shape, o.x, o.y + bob, o.r * lift, o.color);
        ctx.restore();
      }
    },
  };
}

const sortColorGame = makeSort('color');
const sortShapeGame = makeSort('shape');
