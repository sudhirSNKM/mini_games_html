/* ─────────────────────────────────────────────
   stacker.js – Neon Stacker (Catch/Stack)
   ─────────────────────────────────────────────── */
'use strict';

class StackerGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this._container = null;
    this.running = false;
    this.blocks = [];
    this.currentWidth = 200;
    this.score = 0;
    this.speed = 4;
    this.blockX = 0;
    this.blockDir = 1;
    this.blockH = 20;
    this.mistakes = 0;
  }

  mount(container) {
    this._container = container;
    this._buildUI();
    this._init();
  }

  _buildUI() {
    this._container.innerHTML = `
      <div id="stack-root">
        <div id="stack-hint">TAP to Place Block</div>
        <canvas id="stack-canvas" width="400" height="600"></canvas>
      </div>`;
    this.canvas = this._container.querySelector('#stack-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('mousedown', () => this._placeBlock());
    window.addEventListener('keydown', (e) => { if (e.code === 'Space') this._placeBlock(); });
  }

  _init() {
    this.score = 0;
    this.currentWidth = 200;
    this.speed = 4;
    this.blocks = [{ x: 100, y: 550, w: 200 }];
    this.blockX = 0;
    this.blockDir = 1;
    this.running = true;
    this._animate();
  }

  _placeBlock() {
    if (!this.running) return;
    const last = this.blocks[this.blocks.length - 1];
    const y = last.y - this.blockH;
    
    // Calculate overlap
    const overlapStart = Math.max(this.blockX, last.x);
    const overlapEnd = Math.min(this.blockX + this.currentWidth, last.x + last.w);
    const overlapW = overlapEnd - overlapStart;

    if (overlapW <= 0) {
      this._gameOver();
      return;
    }

    this.blocks.push({ x: overlapStart, y, w: overlapW });
    this.currentWidth = overlapW;
    this.score++;
    MainApp.updateScore(this.score);
    this.speed += 0.2;
    this.blockX = Math.random() * (this.canvas.width - this.currentWidth);
    
    // Reset viewport if too high
    if (this.blocks.length > 15) {
      this.blocks.forEach(b => b.y += this.blockH);
    }
  }

  _animate() {
    if (!this.running) return;
    this.ctx.fillStyle = '#080b14';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const b of this.blocks) {
      this.ctx.fillStyle = b.y > 500 ? '#a78bfa' : '#00f5ff';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.fillRect(b.x, b.y, b.w, this.blockH - 2);
    }

    this.blockX += this.blockDir * this.speed;
    if (this.blockX < 0 || this.blockX + this.currentWidth > this.canvas.width) {
      this.blockDir *= -1;
    }

    // Moving block
    const y = this.blocks[this.blocks.length-1].y - this.blockH;
    this.ctx.fillStyle = '#ff2d6b';
    this.ctx.shadowColor = '#ff2d6b';
    this.ctx.fillRect(this.blockX, y, this.currentWidth, this.blockH - 2);
    this.ctx.shadowBlur = 0;

    requestAnimationFrame(() => this._animate());
  }

  _gameOver() {
    this.running = false;
    if (typeof MainApp !== 'undefined') {
      MainApp.gameOver('stacker', this.score, "The tower collapsed!", false);
    }
  }

  stop() { this.running = false; }
  pause() { this.running = !this.running; if (this.running) this._animate(); }
  restart() { this._init(); }
}
