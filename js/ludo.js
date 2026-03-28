/* ─────────────────────────────────────────────
   ludo.js – NeonArcade Ludo (2-4 Player Pass & Play)
   ─────────────────────────────────────────────── */
'use strict';
class LudoGame {
  constructor() {
    this.canvas = null;
    this.ctx    = null;
    this.running = false;
    this._container = null;
  }

  mount(container) {
    this._container = container;
    this._buildUI(container);
  }

  _buildUI(container) {
    container.innerHTML = `
      <div id="ludo-root">
        <div id="ludo-setup" class="ludo-panel">
          <h2 class="ludo-heading">🎲 Ludo</h2>
          <p class="ludo-sub">Choose number of players</p>
          <div class="ludo-player-sel">
            ${[2,3,4].map(n => `<button class="ludo-pcount-btn" data-count="${n}">${n} Players</button>`).join('')}
          </div>
          <div id="ludo-player-names" class="ludo-names-grid" style="display:none"></div>
          <button id="ludo-start-btn" class="btn-primary" style="display:none;margin-top:18px;padding:12px 36px;font-size:1rem;">🎲 Start Game</button>
        </div>
        <div id="ludo-game-area" style="display:none">
          <div id="ludo-status-bar" class="ludo-status-bar">
            <div id="ludo-turn-info" class="ludo-turn-info"></div>
            <div id="ludo-dice-area" class="ludo-dice-area">
              <div id="ludo-die" class="ludo-die">🎲</div>
              <button id="ludo-roll-btn" class="btn-primary ludo-roll-btn">Roll Dice</button>
            </div>
          </div>
          <div id="ludo-board-wrap" class="ludo-board-wrap">
            <canvas id="ludo-canvas" width="540" height="540"></canvas>
          </div>
          <div id="ludo-log" class="ludo-log"></div>
        </div>
        <div id="ludo-winner-screen" class="ludo-panel" style="display:none">
          <div class="ludo-winner-emoji">🏆</div>
          <h2 class="ludo-heading" id="ludo-winner-text">Player Wins!</h2>
          <p class="ludo-sub" id="ludo-winner-sub"></p>
          <div style="display:flex;gap:12px;margin-top:20px;justify-content:center">
            <button id="ludo-replay-btn" class="btn-primary" style="padding:12px 28px">🎲 Play Again</button>
            <button id="ludo-setup-btn" class="btn-secondary" style="padding:12px 28px">⚙️ Setup</button>
          </div>
        </div>
      </div>`;

    this._attachSetupEvents(container);
  }

  _attachSetupEvents(container) {
    let selectedCount = 2;
    const setupEl   = container.querySelector('#ludo-setup');
    const namesEl   = container.querySelector('#ludo-player-names');
    const startBtn  = container.querySelector('#ludo-start-btn');

    container.querySelectorAll('.ludo-pcount-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.ludo-pcount-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCount = +btn.dataset.count;
        namesEl.style.display = 'grid';
        startBtn.style.display = 'inline-block';
        namesEl.innerHTML = '';
        const COLORS = ['Red','Blue','Green','Yellow'];
        for (let i = 0; i < selectedCount; i++) {
          const user = typeof UserSystem !== 'undefined' ? UserSystem.getCurrentUser() : {name:'Player', avatar:'👾'};
          namesEl.innerHTML += `
            <div class="ludo-name-row">
              <span class="ludo-dot" style="background:${LudoGame.PCOLORS[i].base}"></span>
              <input class="ludo-name-inp" data-idx="${i}" type="text" placeholder="${COLORS[i]} Player" value="${i===0 ? user.name : COLORS[i]+' Player'}" maxlength="14"/>
            </div>`;
        }
      });
    });

    startBtn.addEventListener('click', () => {
      const names = Array.from(container.querySelectorAll('.ludo-name-inp')).map(inp => inp.value.trim() || inp.placeholder);
      setupEl.style.display = 'none';
      container.querySelector('#ludo-game-area').style.display = 'flex';
      this._initGame(container, selectedCount, names);
    });
  }

  // ── Static consts ──────────────────────────────────────────────────────────
  static get PCOLORS() {
    return [
      { base:'#ff4757', light:'#ff6b81', home:'#ff4757', name:'Red' },
      { base:'#1e90ff', light:'#54a0ff', home:'#1e90ff', name:'Blue' },
      { base:'#2ed573', light:'#7bed9f', home:'#2ed573', name:'Green' },
      { base:'#ffa502', light:'#ffdd59', home:'#ffa502', name:'Yellow' },
    ];
  }

  // Ludo board: 15×15 grid. We model path positions 0..56 for each player.
  // Safe squares (shared path): 0 (start exit), 8, 13, 21, 26, 34, 39, 47, 52 (= index into the 52-step main path)
  static get SAFE_POSITIONS() { return new Set([0,8,13,21,26,34,39,47,52]); }

  // Main path: 52 cells around the board (col, row) in 15×15 grid
  static get MAIN_PATH() {
    return [
      // Red start → goes right/down
      [6,1],[6,2],[6,3],[6,4],[6,5],
      [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
      [0,7],
      [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
      [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
      [7,14],
      [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
      [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
      [14,7],
      [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
      [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
      [7,0],
    ];
  }

  // Home columns (safe coloured path leading to centre)
  static get HOME_PATHS() {
    return [
      [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],   // Red
      [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],   // Blue
      [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],// Green
      [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],// Yellow
    ];
  }

  // Start exits (index into MAIN_PATH where each player enters)
  static get START_IDX() { return [0, 13, 26, 39]; }

  // Home base positions (4 tokens per player, in cell coords)
  static get BASE_POSITIONS() {
    return [
      [[1,1],[2,1],[1,2],[2,2]],
      [[1,11],[2,11],[1,12],[2,12]],
      [[11,11],[12,11],[11,12],[12,12]],
      [[11,1],[12,1],[11,2],[12,2]],
    ];
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  _initGame(container, numPlayers, names) {
    this.numPlayers  = numPlayers;
    this.names       = names;
    this.running     = true;
    this.currentPlayer = 0;
    this.diceValue   = null;
    this.diceRolled  = false;
    this.movePending = false;

    // 4 tokens each, position: -1 = at base, 0..51 = main path offset, 57 = home (finished)
    const START = LudoGame.START_IDX;
    this.tokens = Array.from({length:4}, (_,pi) =>
      Array.from({length:4}, () => ({ pos: -1, steps: 0, finished: false }))
    );
    this.scores = new Array(4).fill(0); // tokens finished

    this.canvas = container.querySelector('#ludo-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    this.canvas.addEventListener('click', e => this._onBoardClick(e));

    const rollBtn = container.querySelector('#ludo-roll-btn');
    rollBtn.addEventListener('click', () => this._rollDice());

    container.querySelector('#ludo-replay-btn').addEventListener('click', () => {
      container.querySelector('#ludo-winner-screen').style.display = 'none';
      container.querySelector('#ludo-game-area').style.display = 'flex';
      this._initGame(container, this.numPlayers, this.names);
    });
    container.querySelector('#ludo-setup-btn').addEventListener('click', () => {
      container.querySelector('#ludo-winner-screen').style.display = 'none';
      container.querySelector('#ludo-setup').style.display = 'flex';
      this.running = false;
    });

    this._updateTurnUI(container);
    this._draw();
    this._log(container, `🎲 Game started! ${this.names[0]}'s turn.`);
  }

  _resizeCanvas() {
    const wrap = this._container.querySelector('#ludo-board-wrap');
    const size = Math.min(wrap.clientWidth || 540, 540);
    this.canvas.width = this.canvas.height = size;
    this._draw();
  }

  // ── Dice ────────────────────────────────────────────────────────────────────
  _rollDice() {
    if (!this.running || this.diceRolled) return;
    const dieEl = this._container.querySelector('#ludo-die');
    const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    let count = 0;
    const anim = setInterval(() => {
      dieEl.textContent = FACES[Math.floor(Math.random()*6)];
      if (++count > 10) { clearInterval(anim); this._afterRoll(dieEl, FACES); }
    }, 60);
  }

  _afterRoll(dieEl, FACES) {
    const val = Math.floor(Math.random()*6)+1;
    this.diceValue = val;
    dieEl.textContent = FACES[val-1];
    this.diceRolled = true;

    const container = this._container;
    const pi = this.currentPlayer;
    this._log(container, `${LudoGame.PCOLORS[pi].name} rolled a ${val}.`);

    // Check if any move is possible
    const movable = this._getMovableTokens(pi, val);
    if (movable.length === 0) {
      this._log(container, `No valid moves for ${this.names[pi]}. Skipping.`);
      setTimeout(() => this._endTurn(val === 6), 800);
      return;
    }
    if (movable.length === 1 && this.tokens[pi][movable[0]].pos === -1 && val === 6) {
      // Only one token at base, auto bring out
      this._moveToken(pi, movable[0]);
      return;
    }
    // highlight available tokens
    this._highlightedTokens = movable;
    this._draw();
    this._log(container, `Click a highlighted token to move.`);
  }

  _getMovableTokens(pi, val) {
    const result = [];
    for (let ti = 0; ti < 4; ti++) {
      const tok = this.tokens[pi][ti];
      if (tok.finished) continue;
      if (tok.pos === -1) {
        if (val === 6) result.push(ti); // can exit base
      } else {
        // check won't overshoot home
        const stepsLeft = 57 - tok.steps;
        if (val <= stepsLeft) result.push(ti);
      }
    }
    return result;
  }

  _onBoardClick(e) {
    if (!this.diceRolled || !this._highlightedTokens || !this._highlightedTokens.length) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cs = this.canvas.width / 15;
    const gx = Math.floor(mx / cs);
    const gy = Math.floor(my / cs);

    const pi = this.currentPlayer;
    for (const ti of this._highlightedTokens) {
      const {col,row} = this._getTokenCell(pi, ti);
      if (Math.abs(gx-col) <= 0.5 && Math.abs(gy-row) <= 0.5) {
        this._moveToken(pi, ti);
        return;
      }
    }
  }

  _moveToken(pi, ti) {
    const tok = this.tokens[pi][ti];
    const val = this.diceValue;
    this._highlightedTokens = [];

    if (tok.pos === -1 && val === 6) {
      tok.pos = LudoGame.START_IDX[pi];
      tok.steps = 0;
      this._log(this._container, `${this.names[pi]}'s token enters the board!`);
    } else {
      tok.steps += val;
      tok.pos = (LudoGame.START_IDX[pi] + tok.steps) % 52;
      if (tok.steps >= 51) { // home path
        tok.finished = tok.steps >= 57;
      }
    }

    // Check capture (only on main path, not safe squares, not finished)
    if (!tok.finished && tok.steps <= 51) {
      this._checkCapture(pi, ti, tok.pos);
    }

    if (tok.finished) {
      this.scores[pi]++;
      this._log(this._container, `🎉 ${this.names[pi]}'s token reached home! (${this.scores[pi]}/4)`);
      if (this.scores[pi] === 4) { this._declareWinner(pi); return; }
    }

    MainApp.updateScore(this.scores[pi]);
    this._draw();
    this._endTurn(val === 6);
  }

  _checkCapture(pi, ti, newPos) {
    if (LudoGame.SAFE_POSITIONS.has(newPos % 52)) return;
    for (let op = 0; op < this.numPlayers; op++) {
      if (op === pi) continue;
      for (let oti = 0; oti < 4; oti++) {
        const oTok = this.tokens[op][oti];
        if (oTok.finished || oTok.pos === -1) continue;
        if (oTok.pos === newPos && oTok.steps <= 51) {
          oTok.pos = -1;
          oTok.steps = 0;
          this._log(this._container, `${LudoGame.PCOLORS[pi].name} captured ${LudoGame.PCOLORS[op].name}'s token! 💥`);
        }
      }
    }
  }

  _endTurn(extraTurn) {
    this.diceRolled = false;
    this.diceValue  = null;
    this._highlightedTokens = [];

    if (!extraTurn) {
      let next = (this.currentPlayer + 1) % this.numPlayers;
      this.currentPlayer = next;
    } else {
      this._log(this._container, `${this.names[this.currentPlayer]} rolled a 6 – roll again!`);
    }
    this._updateTurnUI(this._container);
    this._draw();
  }

  _declareWinner(pi) {
    this.running = false;
    const container = this._container;
    container.querySelector('#ludo-game-area').style.display = 'none';
    const ws = container.querySelector('#ludo-winner-screen');
    ws.style.display = 'flex';
    container.querySelector('#ludo-winner-text').textContent = `${this.names[pi]} Wins! 🏆`;
    container.querySelector('#ludo-winner-sub').textContent = `Congratulations to ${this.names[pi]} – all tokens home!`;
    if (typeof UserSystem !== 'undefined') {
      const user = UserSystem.getCurrentUser();
      UserSystem.addLBEntry('ludo', this.scores[pi] * 250, { name: this.names[pi], avatar:'🎲' });
    }
    if (typeof MainApp !== 'undefined') MainApp.gameOver('ludo', this.scores[pi] * 250, `${this.names[pi]} wins Ludo!`, true);
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  _updateTurnUI(container) {
    const pi = this.currentPlayer;
    const cl = LudoGame.PCOLORS[pi];
    container.querySelector('#ludo-turn-info').innerHTML = `
      <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${cl.base};margin-right:8px;vertical-align:middle;box-shadow:0 0 8px ${cl.base}"></span>
      <b style="color:${cl.light}">${this.names[pi]}</b>'s Turn`;
    container.querySelector('#ludo-roll-btn').style.background = `linear-gradient(135deg,${cl.base},${cl.light})`;
  }

  _log(container, msg) {
    const logEl = container.querySelector('#ludo-log');
    if (!logEl) return;
    const d = document.createElement('div');
    d.className = 'ludo-log-entry';
    d.textContent = msg;
    logEl.insertBefore(d, logEl.firstChild);
    while (logEl.children.length > 6) logEl.removeChild(logEl.lastChild);
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────
  _draw() {
    if (!this.canvas || !this.ctx) return;
    const cv = this.canvas;
    const ctx = this.ctx;
    const S = cv.width;
    const cs = S / 15; // cell size

    ctx.clearRect(0,0,S,S);

    // Background
    ctx.fillStyle = '#0d1226';
    ctx.fillRect(0,0,S,S);

    // Draw cells
    this._drawBoard(ctx, cs);
    // Draw tokens
    this._drawTokens(ctx, cs);
  }

  _drawBoard(ctx, cs) {
    const S = this.canvas.width;
    const COLORS = LudoGame.PCOLORS;

    // ------- Helper to fill a cell ---------
    const fillCell = (col, row, color, alpha=1) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      this._roundRect(ctx, col*cs+1, row*cs+1, cs-2, cs-2, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    // Grey path cells
    const path = LudoGame.MAIN_PATH;
    path.forEach(([c,r]) => fillCell(c,r,'#1a1f36'));

    // Coloured home stretches
    LudoGame.HOME_PATHS.forEach((hp, pi) => {
      hp.forEach(([c,r]) => fillCell(c,r, COLORS[pi].base, 0.35));
    });

    // Safe cells (star)
    LudoGame.SAFE_POSITIONS.forEach(idx => {
      if (idx < 52) {
        const [c,r] = path[idx];
        fillCell(c,r,'#ffd700',0.25);
        ctx.font = `${cs*0.45}px serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle='#ffd700'; ctx.globalAlpha=0.85;
        ctx.fillText('⭐', c*cs+cs/2, r*cs+cs/2);
        ctx.globalAlpha=1;
      }
    });

    // Home bases (coloured squares)
    const baseCols = [[0,0],[0,9],[9,9],[9,0]];
    baseCols.forEach(([bc,br], pi) => {
      // Draw large base square 6×6
      ctx.fillStyle = COLORS[pi].base;
      ctx.globalAlpha = 0.15;
      this._roundRect(ctx, bc*cs, br*cs, cs*6, cs*6, 8);
      ctx.fill();
      ctx.globalAlpha = 1;
      // border
      ctx.strokeStyle = COLORS[pi].base;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      this._roundRect(ctx, bc*cs+1, br*cs+1, cs*6-2, cs*6-2, 8);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Inner circle area for tokens
      const innerX = bc*cs + cs;
      const innerY = br*cs + cs;
      ctx.fillStyle = COLORS[pi].base;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(innerX, innerY, cs*4, cs*4);
      ctx.globalAlpha = 1;
    });

    // Centre home triangle
    const cx = 7*cs, cy = 7*cs, cw = cs;
    const triColors = ['#ff4757','#1e90ff','#2ed573','#ffa502'];
    const tris = [
      [[7*cs,7*cs],[9*cs,7*cs],[8*cs,8*cs]],
      [[7*cs,7*cs],[7*cs,9*cs],[8*cs,8*cs]],
      [[7*cs,9*cs],[9*cs,9*cs],[8*cs,8*cs]],
      [[9*cs,7*cs],[9*cs,9*cs],[8*cs,8*cs]],
    ];
    tris.forEach(([p1,p2,p3], i) => {
      ctx.beginPath();
      ctx.moveTo(p1[0],p1[1]); ctx.lineTo(p2[0],p2[1]); ctx.lineTo(p3[0],p3[1]);
      ctx.closePath();
      ctx.fillStyle = triColors[i];
      ctx.globalAlpha = 0.45;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let i=0;i<=15;i++) {
      ctx.beginPath(); ctx.moveTo(i*cs,0); ctx.lineTo(i*cs,this.canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*cs); ctx.lineTo(this.canvas.width,i*cs); ctx.stroke();
    }

    // Column/Row start markers
    const startEntryCells = [[6,1],[1,8],[8,13],[13,6]];
    startEntryCells.forEach(([c,r], pi) => {
      ctx.font = `${cs*0.5}px serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle = COLORS[pi].light;
      ctx.fillText('▶', c*cs+cs/2, r*cs+cs/2);
    });
  }

  _drawTokens(ctx, cs) {
    const COLORS = LudoGame.PCOLORS;
    const BASE_POS = LudoGame.BASE_POSITIONS;
    const highlighted = this._highlightedTokens || [];
    const pi = this.currentPlayer;

    for (let p = 0; p < this.numPlayers; p++) {
      for (let t = 0; t < 4; t++) {
        const tok = this.tokens[p][t];
        let col, row;

        if (tok.finished) continue;

        if (tok.pos === -1) {
          // at base
          [col, row] = BASE_POS[p][t];
        } else if (tok.steps > 51) {
          // on home path
          const homeStep = tok.steps - 52;
          const hp = LudoGame.HOME_PATHS[p];
          const hpIdx = Math.min(homeStep, hp.length - 1);
          [col, row] = hp[hpIdx];
        } else {
          const mainPath = LudoGame.MAIN_PATH;
          const pathIdx = tok.pos % mainPath.length;
          [col, row] = mainPath[pathIdx];
        }

        const x = col*cs + cs/2;
        const y = row*cs + cs/2;
        const r = cs * 0.38;

        const isHighlighted = p === pi && highlighted.includes(t);

        if (isHighlighted) {
          // Glow ring
          ctx.beginPath();
          ctx.arc(x, y, r*1.5, 0, Math.PI*2);
          ctx.fillStyle = COLORS[p].light;
          ctx.globalAlpha = 0.25 + 0.15 * Math.sin(Date.now()/200);
          ctx.fill();
          ctx.globalAlpha = 1;
          requestAnimationFrame(() => this._draw());
        }

        // Shadow
        ctx.beginPath();
        ctx.arc(x+1, y+2, r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();

        // Token
        const grad = ctx.createRadialGradient(x-r*0.3, y-r*0.3, r*0.1, x, y, r);
        grad.addColorStop(0, COLORS[p].light);
        grad.addColorStop(1, COLORS[p].base);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = isHighlighted ? '#fff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();

        // Token number
        ctx.font = `bold ${cs*0.28}px Orbitron,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(t+1, x, y);
      }
    }
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  _getTokenCell(pi, ti) {
    const tok = this.tokens[pi][ti];
    if (tok.pos === -1) {
      const [c,r] = LudoGame.BASE_POSITIONS[pi][ti];
      return {col:c, row:r};
    }
    if (tok.steps > 51) {
      const hp = LudoGame.HOME_PATHS[pi];
      const idx = Math.min(tok.steps - 52, hp.length-1);
      return {col:hp[idx][0], row:hp[idx][1]};
    }
    const [c,r] = LudoGame.MAIN_PATH[tok.pos % 52];
    return {col:c, row:r};
  }

  // ── Required interface ──────────────────────────────────────────────────────
  stop()    { this.running = false; window.removeEventListener('resize', this._resizeCb); }
  pause()   { this.running = !this.running; }
  restart() { if (this._container) { this._initGame(this._container, this.numPlayers, this.names); } }
}
