/* ─────────────────────────────────────────────
   wordle.js – Neon Word (Word Guessing)
   ─────────────────────────────────────────────── */
'use strict';

class WordleGame {
  constructor() {
    this._container = null;
    this.running = false;
    this.targetWord = '';
    this.guesses = [];
    this.currentGuess = '';
    this.maxGuesses = 6;
    this.wordLen = 5;
    this.alphabet = 'qwertyuiopasdfghjklzxcvbnm'.split('');
    this.status = {}; // char -> 'correct' | 'present' | 'absent'
    
    this.WORDS = ['BRAIN', 'LIGHT', 'DREAM', 'NEONS', 'SPACE', 'GLOWS', 'SHINE', 'CYBER', 'POINT', 'FLASH', 'STORM', 'PULSE', 'PIXEL', 'CLOUD', 'POWER', 'CLOCK', 'SOUND', 'MUSIC', 'GAMES', 'TURBO'];
  }

  mount(container) {
    this._container = container;
    this._init();
    this._buildUI();
  }

  _init() {
    this.targetWord = this.WORDS[Math.floor(Math.random() * this.WORDS.length)].toUpperCase();
    this.guesses = [];
    this.currentGuess = '';
    this.status = {};
    this.running = true;
    this.gameOver = false;
  }

  _buildUI() {
    this._container.innerHTML = `
      <div id="wordle-root">
        <div id="wordle-grid" class="wordle-grid"></div>
        <div id="wordle-kb" class="wordle-kb"></div>
        <div id="wordle-msg" class="wordle-msg"></div>
      </div>`;
    this._renderGrid();
    this._renderKB();
    window.addEventListener('keydown', this._handleKey = (e) => this._onKeyDown(e));
  }

  _renderGrid() {
    const grid = this._container.querySelector('#wordle-grid');
    grid.innerHTML = '';
    for (let i = 0; i < this.maxGuesses; i++) {
      const row = document.createElement('div');
      row.className = 'wordle-row';
      const guess = this.guesses[i] || (i === this.guesses.length ? this.currentGuess : '');
      for (let j = 0; j < this.wordLen; j++) {
        const cell = document.createElement('div');
        cell.className = 'wordle-cell';
        if (i < this.guesses.length) {
          const res = this._checkCell(i, j);
          cell.classList.add(res);
          cell.textContent = this.guesses[i][j];
        } else if (i === this.guesses.length) {
          cell.textContent = guess[j] || '';
          if (guess[j]) cell.classList.add('pop');
        }
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
  }

  _checkCell(row, col) {
    const char = this.guesses[row][col];
    if (this.targetWord[col] === char) return 'correct';
    if (this.targetWord.includes(char)) return 'present';
    return 'absent';
  }

  _renderKB() {
    const kb = this._container.querySelector('#wordle-kb');
    const layout = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    kb.innerHTML = '';
    layout.forEach((rowStr, i) => {
      const row = document.createElement('div');
      row.className = 'kb-row';
      if (i === 2) {
        const ent = this._createKey('ENTER', 'big-key');
        ent.onclick = () => this._submit();
        row.appendChild(ent);
      }
      rowStr.split('').forEach(char => {
        const key = this._createKey(char, this.status[char] || '');
        key.onclick = () => this._onKeyDown({ key: char });
        row.appendChild(key);
      });
      if (i === 2) {
        const del = this._createKey('⌫', 'big-key');
        del.onclick = () => this._onKeyDown({ key: 'Backspace' });
        row.appendChild(del);
      }
      kb.appendChild(row);
    });
  }

  _createKey(label, cls) {
    const k = document.createElement('button');
    k.className = `kb-key ${cls}`;
    k.textContent = label;
    return k;
  }

  _onKeyDown(e) {
    if (!this.running || this.gameOver) return;
    const key = e.key.toUpperCase();
    if (key === 'ENTER') {
      this._submit();
    } else if (key === 'BACKSPACE' || key === 'DELETE') {
      this.currentGuess = this.currentGuess.slice(0, -1);
    } else if (/^[A-Z]$/.test(key) && this.currentGuess.length < this.wordLen) {
      this.currentGuess += key;
    }
    this._renderGrid();
  }

  _submit() {
    if (this.currentGuess.length !== this.wordLen) return;
    const guess = this.currentGuess;
    this.guesses.push(guess);
    
    // Update status
    for (let i = 0; i < this.wordLen; i++) {
      const c = guess[i];
      const res = this._checkCell(this.guesses.length - 1, i);
      if (res === 'correct') this.status[c] = 'correct';
      else if (res === 'present' && this.status[c] !== 'correct') this.status[c] = 'present';
      else if (!this.status[c]) this.status[c] = 'absent';
    }

    this.currentGuess = '';
    this._renderGrid();
    this._renderKB();

    if (guess === this.targetWord) {
      this._endGame(true);
    } else if (this.guesses.length >= this.maxGuesses) {
      this._endGame(false);
    }
    if (typeof Audio !== 'undefined') Audio.click();
  }

  _endGame(won) {
    this.gameOver = true;
    const msg = won ? `Excellent! Word was ${this.targetWord}` : `Word was ${this.targetWord}`;
    if (typeof MainApp !== 'undefined') {
      MainApp.gameOver('wordle', won ? (7 - this.guesses.length) * 200 : 0, msg, won);
    }
  }

  stop() { window.removeEventListener('keydown', this._handleKey); this.running = false; }
  pause() { this.running = !this.running; }
  restart() { this._init(); this._renderGrid(); this._renderKB(); }
}
