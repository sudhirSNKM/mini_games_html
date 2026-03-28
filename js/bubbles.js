/* ─────────────────────────────────────────────
   bubbles.js – Neon Bubbles (Bubble Shooter Lite)
   ─────────────────────────────────────────────── */
'use strict';

class BubblesGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this._container = null;
    this.running = false;
    this.score = 0;
    
    this.bubbleRadius = 18;
    this.bubbles = [];
    this.shooter = { x: 0, y: 0, angle: -Math.PI/2, color: '' };
    this.projectile = null;
    this.colors = ['#00f5ff', '#ff2d6b', '#39ff14', '#facc15', '#a78bfa'];
  }

  mount(container) {
    this._container = container;
    this._buildUI();
    this._init();
  }

  _buildUI() {
    this._container.innerHTML = `<canvas id="bubbles-canvas" width="400" height="500"></canvas>`;
    this.canvas = this._container.querySelector('#bubbles-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const dx = (e.clientX - rect.left) - this.canvas.width/2;
      const dy = (e.clientY - rect.top) - (this.canvas.height - 40);
      this.shooter.angle = Math.atan2(dy, dx);
    });
    
    this.canvas.addEventListener('click', () => this._shoot());
  }

  _init() {
    this.score = 0;
    this.bubbles = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 10; c++) {
        this.bubbles.push({
          x: c * (this.bubbleRadius * 2 + 2) + this.bubbleRadius + (r % 2 ? this.bubbleRadius : 0),
          y: r * (this.bubbleRadius * 2 - 2) + this.bubbleRadius + 10,
          color: this.colors[Math.floor(Math.random() * this.colors.length)]
        });
      }
    }
    this.shooter.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.running = true;
    this._animate();
  }

  _shoot() {
    if (this.projectile || !this.running) return;
    this.projectile = {
      x: this.canvas.width/2,
      y: this.canvas.height - 40,
      dx: Math.cos(this.shooter.angle) * 8,
      dy: Math.sin(this.shooter.angle) * 8,
      color: this.shooter.color
    };
    this.shooter.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    if (typeof Audio !== 'undefined') Audio.click();
  }

  _animate() {
    if (!this.running) return;
    this.ctx.fillStyle = '#080b14';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    for (const b of this.bubbles) {
      this._drawBubble(b.x, b.y, b.color);
    }

    // Draw Shooter
    const sx = this.canvas.width/2;
    const sy = this.canvas.height - 40;
    this.ctx.strokeStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.moveTo(sx, sy);
    this.ctx.lineTo(sx + Math.cos(this.shooter.angle) * 40, sy + Math.sin(this.shooter.angle) * 40);
    this.ctx.stroke();
    this._drawBubble(sx, sy, this.shooter.color);

    // Projectile
    if (this.projectile) {
      const p = this.projectile;
      p.x += p.dx;
      p.y += p.dy;
      
      if (p.x < 15 || p.x > this.canvas.width - 15) p.dx *= -1;
      if (p.y < 15) { this._attachBubble(); return; }

      this._drawBubble(p.x, p.y, p.color);

      // Collision
      for (let i = 0; i < this.bubbles.length; i++) {
        const b = this.bubbles[i];
        const dist = Math.hypot(p.x - b.x, p.y - b.y);
        if (dist < this.bubbleRadius * 2) {
          this._attachBubble();
          return;
        }
      }
      
      if (p.y > this.canvas.height) this.projectile = null;
    }

    requestAnimationFrame(() => this._animate());
  }

  _attachBubble() {
    const p = this.projectile;
    this.bubbles.push({ x: p.x, y: p.y, color: p.color });
    this._checkMatches(this.bubbles.length - 1);
    this.projectile = null;
    
    if (this.bubbles.some(b => b.y > this.canvas.height - 100)) {
        this._gameOver();
    }
  }

  _checkMatches(idx) {
    const start = this.bubbles[idx];
    const matches = [idx];
    const queue = [idx];
    const visited = new Set([idx]);

    while(queue.length > 0) {
        const currIdx = queue.shift();
        const curr = this.bubbles[currIdx];
        for(let i=0; i<this.bubbles.length; i++) {
            if(visited.has(i)) continue;
            const b = this.bubbles[i];
            if(b.color === start.color && Math.hypot(curr.x - b.x, curr.y - b.y) < this.bubbleRadius * 2.5) {
                matches.push(i);
                queue.push(i);
                visited.add(i);
            }
        }
    }

    if (matches.length >= 3) {
      matches.sort((a,b) => b-a).forEach(mi => this.bubbles.splice(mi, 1));
      this.score += matches.length * 10;
      MainApp.updateScore(this.score);
      if (this.bubbles.length === 0) {
          this._gameOver(true);
      }
    }
  }

  _drawBubble(x, y, color) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.bubbleRadius - 2, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = color;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  _gameOver(won = false) {
    this.running = false;
    if (typeof MainApp !== 'undefined') {
      MainApp.gameOver('bubbles', this.score, won ? "Grid Cleared!" : "Bubbles reached the bottom!", won);
    }
  }

  stop() { this.running = false; }
  pause() { this.running = !this.running; if(this.running) this._animate(); }
  restart() { this._init(); }
}
