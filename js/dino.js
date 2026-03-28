/* ─────────────────────────────────────────────
   dino.js – Neon Rush (Neon Dino Runner)
   ─────────────────────────────────────────────── */
'use strict';

class DinoGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this._container = null;
    this.running = false;
    this.score = 0;
    
    this.gameSpeed = 5;
    this.gravity = 0.6;
    
    this.player = {
      x: 50,
      y: 0,
      w: 40,
      h: 40,
      dy: 0,
      jumpForce: 12,
      grounded: false
    };

    this.obstacles = [];
    this.particles = [];
    this.spawnTimer = 0;
  }

  mount(container) {
    this._container = container;
    this._buildUI();
    this._init();
  }

  _buildUI() {
    this._container.innerHTML = `
      <div id="dino-root">
        <div id="dino-hint">SPACE or CLICK to Jump</div>
        <canvas id="dino-canvas" width="800" height="300"></canvas>
      </div>`;
    this.canvas = this._container.querySelector('#dino-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    const handler = (e) => {
      if (e.code === 'Space' || e.type === 'mousedown') {
        this._jump();
        if (!this.running && !this.gameOver) this.running = true;
      }
    };
    window.addEventListener('keydown', handler);
    this.canvas.addEventListener('mousedown', handler);
    this._cleanup = () => {
      window.removeEventListener('keydown', handler);
    };
  }

  _init() {
    this.score = 0;
    this.gameSpeed = 5;
    this.obstacles = [];
    this.particles = [];
    this.player.y = this.canvas.height - this.player.h - 20;
    this.player.dy = 0;
    this.running = true;
    this.gameOver = false;
    this._animate();
  }

  _jump() {
    if (this.player.grounded) {
      this.player.dy = -this.player.jumpForce;
      this.player.grounded = false;
      this._spawnParticles(this.player.x + 20, this.player.y + 40, '#00f5ff');
      if (typeof Audio !== 'undefined') Audio.click();
    }
  }

  _spawnObstacle() {
    const h = 30 + Math.random() * 40;
    const w = 20 + Math.random() * 30;
    this.obstacles.push({
      x: this.canvas.width,
      y: this.canvas.height - h - 20,
      w: w,
      h: h,
      color: Math.random() > 0.5 ? '#ff2d6b' : '#a78bfa'
    });
  }

  _spawnParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x, y,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        life: 1.0,
        color
      });
    }
  }

  _animate() {
    if (!this.running) return;
    
    this.ctx.fillStyle = '#080b14';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Ground
    this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height - 20);
    this.ctx.lineTo(this.canvas.width, this.canvas.height - 20);
    ctx.stroke();

    // Player Physics
    this.player.dy += this.gravity;
    this.player.y += this.player.dy;

    const groundY = this.canvas.height - this.player.h - 20;
    if (this.player.y > groundY) {
      this.player.y = groundY;
      this.player.dy = 0;
      this.player.grounded = true;
    }

    // Draw Player
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00f5ff';
    this.ctx.fillStyle = '#00f5ff';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    this.ctx.shadowBlur = 0;

    // Obstacles
    this.spawnTimer++;
    if (this.spawnTimer > Math.max(40, 100 - this.score / 5)) {
      this._spawnObstacle();
      this.spawnTimer = 0;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.x -= this.gameSpeed;
      
      this.ctx.fillStyle = o.color;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = o.color;
      this.ctx.fillRect(o.x, o.y, o.w, o.h);
      
      // Collision
      if (
        this.player.x < o.x + o.w &&
        this.player.x + this.player.w > o.x &&
        this.player.y < o.y + o.h &&
        this.player.y + this.player.h > o.y
      ) {
        this._die();
      }

      if (o.x + o.w < 0) {
        this.obstacles.splice(i, 1);
        this.score++;
        MainApp.updateScore(this.score);
        this.gameSpeed += 0.05;
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life -= 0.02;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, 3, 3);
      this.ctx.globalAlpha = 1;
    }

    requestAnimationFrame(() => this._animate());
  }

  _die() {
    this.running = false;
    this.gameOver = true;
    this._spawnParticles(this.player.x + 20, this.player.y + 20, '#ff2d6b');
    if (typeof MainApp !== 'undefined') {
      MainApp.gameOver('dino', this.score, `You hit a neon spike! Score: ${this.score}`, false);
    }
  }

  stop() { this.running = false; if (this._cleanup) this._cleanup(); }
  pause() { this.running = !this.running; if (this.running) this._animate(); }
  restart() { this._init(); }
}
