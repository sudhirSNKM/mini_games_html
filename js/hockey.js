/* ─────────────────────────────────────────────
   hockey.js – Neon Hockey (Air Hockey)
   ─────────────────────────────────────────────── */
'use strict';

class HockeyGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this._container = null;
    this.running = false;
    this.p1Score = 0;
    this.p2Score = 0;
    
    this.puck = { x: 0, y: 0, dx: 0, dy: 0, r: 12 };
    this.p1 = { x: 0, y: 0, r: 25 };
    this.p2 = { x: 0, y: 0, r: 25 };
  }

  mount(container) {
    this._container = container;
    this._buildUI();
    this._init();
  }

  _buildUI() {
    this._container.innerHTML = `<canvas id="hockey-canvas" width="400" height="600"></canvas>`;
    this.canvas = this._container.querySelector('#hockey-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const my = e.clientY - rect.top;
      this.p1.x = e.clientX - rect.left;
      this.p1.y = Math.max(this.canvas.height / 2 + this.p1.r, my);
    });
  }

  _init() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.p1Score = 0; this.p2Score = 0;
    this.puck = { x: W/2, y: H/2, dx: 0, dy: 0, r: 12 };
    this.p1 = { x: W/2, y: H - 50, r: 25 };
    this.p2 = { x: W/2, y: 50, r: 25 };
    this.running = true;
    this._animate();
  }

  _animate() {
    if (!this.running) return;
    const W = this.canvas.width;
    const H = this.canvas.height;
    
    this.ctx.fillStyle = '#080b14';
    this.ctx.fillRect(0, 0, W, H);
    
    // Draw table
    this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.2)';
    this.ctx.strokeRect(0, 0, W, H);
    this.ctx.beginPath(); this.ctx.moveTo(0, H/2); this.ctx.lineTo(W, H/2); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.arc(W/2, H/2, 40, 0, Math.PI*2); this.ctx.stroke();

    // AI Logic (Simple)
    const targetX = this.puck.x;
    const targetY = Math.min(this.puck.y, H/2 - this.p2.r);
    this.p2.x += (targetX - this.p2.x) * 0.15;
    this.p2.y += (targetY - this.p2.y) * 0.1;

    // Puck movement
    this.puck.x += this.puck.dx;
    this.puck.y += this.puck.dy;
    this.puck.dx *= 0.985; this.puck.dy *= 0.985; // Friction

    // Puck wall collision
    if (this.puck.x < this.puck.r || this.puck.x > W - this.puck.r) {
        this.puck.dx *= -1;
        this.puck.x = this.puck.x < this.puck.r ? this.puck.r : W - this.puck.r;
    }
    
    // Goal collision
    if (this.puck.y < this.puck.r || this.puck.y > H - this.puck.r) {
      if (this.puck.x > W/3 && this.puck.x < 2*W/3) {
          if (this.puck.y < H/2) this.p1Score++; else this.p2Score++;
          MainApp.updateScore(this.p1Score);
          this.puck = { x: W/2, y: H/2, dx: 0, dy: 0, r: 12 };
          if (this.p1Score >= 5 || this.p2Score >= 5) this._gameOver(this.p1Score >= 5);
      } else {
          this.puck.dy *= -1;
          this.puck.y = this.puck.y < this.puck.r ? this.puck.r : H - this.puck.r;
      }
    }

    // Mallet collisions
    this._checkMallet(this.p1);
    this._checkMallet(this.p2);

    // Draw mallets
    this._drawCircle(this.p1.x, this.p1.y, this.p1.r, '#00f5ff');
    this._drawCircle(this.p2.x, this.p2.y, this.p2.r, '#ff2d6b');
    this._drawCircle(this.puck.x, this.puck.y, this.puck.r, '#39ff14');

    requestAnimationFrame(() => this._animate());
  }

  _checkMallet(m) {
    const dist = Math.hypot(this.puck.x - m.x, this.puck.y - m.y);
    if (dist < m.r + this.puck.r) {
      const angle = Math.atan2(this.puck.y - m.y, this.puck.x - m.x);
      const overlap = m.r + this.puck.r - dist;
      this.puck.x += Math.cos(angle) * overlap;
      this.puck.y += Math.sin(angle) * overlap;
      
      const speed = 8;
      this.puck.dx = Math.cos(angle) * speed;
      this.puck.dy = Math.sin(angle) * speed;
      if (typeof Audio !== 'undefined') Audio.click();
    }
  }

  _drawCircle(x, y, r, color) {
    this.ctx.beginPath(); this.ctx.arc(x, y, r, 0, Math.PI*2);
    this.ctx.fillStyle = color; this.ctx.shadowBlur = 15; this.ctx.shadowColor = color;
    this.ctx.fill(); this.ctx.shadowBlur = 0;
  }

  _gameOver(won) {
    this.running = false;
    if (typeof MainApp !== 'undefined') {
      MainApp.gameOver('hockey', this.p1Score * 500, won ? "You reached 5 goals first!" : "The AI won!", won);
    }
  }

  stop() { this.running = false; }
  pause() { this.running = !this.running; if (this.running) this._animate(); }
  restart() { this._init(); }
}
