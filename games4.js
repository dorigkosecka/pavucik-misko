'use strict';

const WEB_POSITIONS = [
  { x: 202, y: 265 }, { x: 512, y: 265 }, { x: 822, y: 265 },
  { x: 202, y: 545 }, { x: 512, y: 545 }, { x: 822, y: 545 },
];

const webGame = {
  waitDuration: 1.3,
  hopDuration: 0.4,
  enter() {
    this.order = shuffle([0, 1, 2, 3, 4, 5]);
    this.index = 0;
    this.taps = 0;
    this.hop = 0;
    this.wait = this.waitDuration;
    this.hit = false;
    this.happy = 0;
    this.from = this.to = this.order[0];
    this.finish = 0;
    this.t = 0;
  },
  down(x, y) {
    if (this.hop > 0 || this.finish !== 0 || this.hit) return;
    const p = WEB_POSITIONS[this.order[this.index]];
    if (dist(x, y, p.x, p.y) > 82) return;
    this.hit = true;
    this.taps++;
    this.happy = 0.8;
    burst(p.x, p.y, 22, [UI.sun, UI.peach, UI.mint]);
    if (this.taps === 6) this.finish = 0.8;
  },
  move() {},
  up() {},
  update(dt) {
    this.t += dt;
    this.happy = Math.max(0, this.happy - dt);
    if (this.finish > 0) {
      this.finish -= dt;
      if (this.finish <= 0) { this.finish = -1; win(); }
      return;
    }
    if (this.hop > 0) {
      this.hop = Math.max(0, this.hop - dt);
    } else {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.from = this.order[this.index];
        this.index = (this.index + 1) % this.order.length;
        this.to = this.order[this.index];
        this.hop = this.hopDuration;
        this.wait = this.waitDuration;
        this.hit = false;
      }
    }
  },
  draw() {
    backdrop('#dbeafa', '#f4e7f8');
    for (let i = 0; i < WEB_POSITIONS.length; i++) {
      const p = WEB_POSITIONS[i];
      card(p.x - 113, p.y - 113, 226, 226, UI.paper, 40);
      ctx.fillStyle = i === this.order[this.index] && this.hop === 0 ? '#e5f6ef' : '#f1edfc';
      rr(p.x - 104, p.y - 104, 208, 208, 33); ctx.fill();
      ctx.strokeStyle = '#9b8cbf'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      for (let spoke = 0; spoke < 8; spoke++) {
        const a = spoke * Math.PI / 4;
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(a) * 86, p.y + Math.sin(a) * 86); ctx.stroke();
      }
      for (const r of [29, 55, 85]) {
        ctx.beginPath();
        for (let k = 0; k <= 8; k++) {
          const a = k * Math.PI / 4;
          const xx = p.x + Math.cos(a) * r, yy = p.y + Math.sin(a) * r;
          if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
        }
        ctx.stroke();
      }
      if (i === this.order[this.index] && this.hop === 0 && this.finish === 0) {
        ctx.strokeStyle = this.hit ? UI.sun : UI.mint; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(p.x, p.y, 96 + Math.sin(this.t * 5) * 4, 0, Math.PI * 2); ctx.stroke();
      }
    }

    const destination = WEB_POSITIONS[this.order[this.index]];
    let x = destination.x, y = destination.y;
    if (this.hop > 0) {
      const k = 1 - this.hop / this.hopDuration;
      const source = WEB_POSITIONS[this.from], target = WEB_POSITIONS[this.to];
      x = source.x + (target.x - source.x) * k;
      y = source.y + (target.y - source.y) * k - Math.sin(k * Math.PI) * 95;
    }
    drawSpider(x, y, 39 * (1 + this.happy * 0.55), this.t, { mouth: this.happy || this.hop ? 'open' : 'smile', rot: this.hop ? -0.15 : 0 });

    card(272, 18, 480, 92, UI.paper, 25);
    for (let i = 0; i < 6; i++) {
      if (i < this.taps) drawStar(337 + i * 70, 65, 24, UI.sun);
      else {
        ctx.fillStyle = '#dce4ef';
        ctx.beginPath(); ctx.arc(337 + i * 70, 65, 18, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
};
