/* ─────────────────────────────────────────────
   defense.js – Neon Defense (Tower Defense Lite)
   ─────────────────────────────────────────────── */
'use strict';

class DefenseGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this._container = null;
    this.running = false;
    this.money = 100;
    this.score = 0;
    this.wave = 1;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.spawnTimer = 0;
    
    this.path = [
      {x: 0, y: 150}, {x: 150, y: 150}, {x: 150, y: 350}, {x: 350, y: 350}, {x: 350, y: 50}, {x: 500, y: 50}
    ];
  }

  mount(container) {
    this._container = container;
    this._buildUI();
    this._init();
  }

  _buildUI() {
    this._container.innerHTML = `
      <div id="def-root">
        <div class="def-top">
          <span>Wave: <span id="def-wave">1</span></span>
          <span>Core: <span id="def-core">100%</span></span>
          <span>Money: $<span id="def-money">100</span></span>
        </div>
        <canvas id="def-canvas" width="500" height="400"></canvas>
      </div>`;
    this.canvas = this._container.querySelector('#def-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.onclick = (e) => this._placeTower(e);
  }

  _init() {
    this.money = 100; this.score = 0; this.wave = 1;
    this.enemies = []; this.towers = []; this.projectiles = [];
    this.running = true;
    this.coreHP = 100;
    this._animate();
  }

  _placeTower(e) {
    if (this.money < 30) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.towers.push({ x, y, range: 100, dmg: 1, timer: 0 });
    this.money -= 30;
    this._updateUI();
  }

  _animate() {
    if (!this.running) return;
    this.ctx.fillStyle = '#080b14';
    this.ctx.fillRect(0, 0, 500, 400);

    // Path
    this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)';
    this.ctx.lineWidth = 30;
    this.ctx.beginPath(); this.ctx.moveTo(this.path[0].x, this.path[0].y);
    this.path.forEach(p => this.ctx.lineTo(p.x, p.y)); this.ctx.stroke();

    // Enemies
    this.spawnTimer++;
    if (this.spawnTimer > 100) {
      this.enemies.push({ x: 0, y: 150, targetIdx: 1, hp: 5 + this.wave, speed: 1.5 });
      this.spawnTimer = 0;
    }

    this.enemies.forEach((e, i) => {
      const t = this.path[e.targetIdx];
      const angle = Math.atan2(t.y - e.y, t.x - e.x);
      e.x += Math.cos(angle) * e.speed;
      e.y += Math.sin(angle) * e.speed;
      if (Math.hypot(t.x - e.x, t.y - e.y) < 5) {
        e.targetIdx++;
        if (e.targetIdx >= this.path.length) {
            this.enemies.splice(i, 1);
            this.coreHP -= 10;
            this._updateUI();
            if (this.coreHP <= 0) this._gameOver();
            return;
        }
      }
      this.ctx.fillStyle = '#ff2d6b';
      this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#ff2d6b';
      this.ctx.fillRect(e.x - 6, e.y - 6, 12, 12);
    });

    // Towers
    this.towers.forEach(t => {
      this.ctx.fillStyle = '#a78bfa';
      this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#a78bfa';
      this.ctx.beginPath(); this.ctx.arc(t.x, t.y, 10, 0, Math.PI*2); this.ctx.fill();
      
      t.timer++;
      if (t.timer > 30) {
        const target = this.enemies.find(e => Math.hypot(e.x - t.x, e.y - t.y) < t.range);
        if (target) {
          this.projectiles.push({ x: t.x, y: t.y, tx: target.x, ty: target.y, enemy: target });
          t.timer = 0;
        }
      }
    });

    // Projectiles
    this.projectiles.forEach((p, i) => {
        const angle = Math.atan2(p.ty - p.y, p.tx - p.x);
        p.x += Math.cos(angle) * 10;
        p.y += Math.sin(angle) * 10;
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        if (Math.hypot(p.tx - p.x, p.ty - p.y) < 10) {
            this.projectiles.splice(i, 1);
            p.enemy.hp -= 2;
            if (p.enemy.hp <= 0) {
                const idx = this.enemies.indexOf(p.enemy);
                if (idx !== -1) {
                    this.enemies.splice(idx, 1);
                    this.money += 10;
                    this.score += 10;
                    MainApp.updateScore(this.score);
                    this._updateUI();
                }
            }
        }
    });

    requestAnimationFrame(() => this._animate());
  }

  _updateUI() {
    this._container.querySelector('#def-money').textContent = this.money;
    this._container.querySelector('#def-core').textContent = this.coreHP + '%';
  }

  _gameOver() {
    this.running = false;
    MainApp.gameOver('defense', this.score, "The Core was destroyed!", false);
  }

  stop() { this.running = false; }
  pause() { this.running = !this.running; if (this.running) this._animate(); }
  restart() { this._init(); }
}
