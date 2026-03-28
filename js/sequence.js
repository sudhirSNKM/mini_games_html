/* ─────────────────────────────────────────────
   sequence.js – Neon Sequence (Simon Says)
   ─────────────────────────────────────────────── */
'use strict';

class SequenceGame {
  constructor() {
    this._container = null;
    this.running = false;
    this.sequence = [];
    this.playerIdx = 0;
    this.isShowing = false;
    this.score = 0;
    this.colors = ['#00f5ff', '#ff2d6b', '#39ff14', '#facc15'];
  }

  mount(container) {
    this._container = container;
    this._buildUI();
    this._init();
  }

  _buildUI() {
    this._container.innerHTML = `
      <div id="seq-root">
        <div id="seq-board" class="seq-board">
          ${this.colors.map((c, i) => `<div class="seq-pad" data-idx="${i}" style="--c:${c}"></div>`).join('')}
        </div>
        <div id="seq-status" class="seq-status">Wait for sequence...</div>
      </div>`;
    this._container.querySelectorAll('.seq-pad').forEach(pad => {
      pad.addEventListener('click', () => this._onPadClick(+pad.dataset.idx));
    });
  }

  _init() {
    this.sequence = [];
    this.score = 0;
    this.running = true;
    this._nextRound();
  }

  _nextRound() {
    this.sequence.push(Math.floor(Math.random() * 4));
    this.playerIdx = 0;
    this._playSequence();
  }

  async _playSequence() {
    this.isShowing = true;
    const status = this._container.querySelector('#seq-status');
    status.textContent = 'Watching...';
    
    for (const idx of this.sequence) {
      await this._flashPad(idx);
      await new Promise(r => setTimeout(r, 200));
    }
    
    this.isShowing = false;
    status.textContent = 'Your Turn!';
  }

  _flashPad(idx) {
    return new Promise(r => {
      const pad = this._container.querySelectorAll('.seq-pad')[idx];
      pad.classList.add('active');
      if (typeof Audio !== 'undefined') Audio.click();
      setTimeout(() => {
        pad.classList.remove('active');
        r();
      }, 500);
    });
  }

  _onPadClick(idx) {
    if (!this.running || this.isShowing) return;
    
    const pad = this._container.querySelectorAll('.seq-pad')[idx];
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 200);
    if (typeof Audio !== 'undefined') Audio.click();

    if (idx === this.sequence[this.playerIdx]) {
      this.playerIdx++;
      if (this.playerIdx === this.sequence.length) {
        this.score++;
        MainApp.updateScore(this.score);
        setTimeout(() => this._nextRound(), 1000);
      }
    } else {
      this._gameOver();
    }
  }

  _gameOver() {
    this.running = false;
    if (typeof MainApp !== 'undefined') {
      MainApp.gameOver('sequence', this.score * 100, `You missed the pattern at turn ${this.score + 1}!`, false);
    }
  }

  stop() { this.running = false; }
  pause() { this.running = !this.running; }
  restart() { this._init(); }
}
