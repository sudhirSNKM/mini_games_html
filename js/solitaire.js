/* ─────────────────────────────────────────────
   solitaire.js – Neon Solitaire (Klondike Lite)
   ─────────────────────────────────────────────── */
'use strict';

class SolitaireGame {
  constructor() {
    this._container = null;
    this.running = false;
    this.suits = ['♠', '♥', '♦', '♣'];
    this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  }

  mount(container) {
    this._container = container;
    this._init();
    this._buildUI();
  }

  _init() {
    this.running = true;
    this.deck = [];
    this.suits.forEach(s => this.values.forEach(v => this.deck.push({ v, s, color: (s==='♥'||s==='♦') ? '#ff2d6b' : '#00f5ff' })));
    this.deck.sort(() => Math.random() - 0.5);
    
    this.piles = Array.from({ length: 7 }, (_, i) => this.deck.splice(0, i + 1));
    this.piles.forEach(p => p[p.length - 1].visible = true);
  }

  _buildUI() {
    this._container.innerHTML = `
      <div id="sol-root">
        <div class="sol-top">
          <div class="sol-pile deck">🂠</div>
          <div class="sol-foundations">${[1,2,3,4].map(i => `<div class="sol-cell foundation" data-idx="${i}"></div>`).join('')}</div>
        </div>
        <div class="sol-tableau">
          ${this.piles.map((p, i) => `
            <div class="sol-col" data-idx="${i}">
              ${p.map((c, ci) => `
                <div class="sol-card ${c.visible ? '' : 'back'}" style="color:${c.color}; top:${ci*15}px">
                  ${c.visible ? `${c.v}<br>${c.s}` : ''}
                </div>`).join('')}
            </div>`).join('')}
        </div>
      </div>`;
  }

  stop() { this.running = false; }
  pause() { this.running = !this.running; }
  restart() { this._init(); this._buildUI(); }
}
