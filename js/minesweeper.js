/* ── MINESWEEPER ── */
const MinesweeperGame = (() => {
  const CONFIGS = [
    { rows: 9,  cols: 9,  mines: 10, label: 'Beginner' },
    { rows: 16, cols: 16, mines: 40, label: 'Intermediate' },
  ];
  let cfg, board, revealed, flagged, gameOver, firstClick, running = false;
  let timer, elapsed, flags;

  function init(level = 0) {
    cfg = CONFIGS[level];
    board    = Array.from({ length: cfg.rows }, () => Array(cfg.cols).fill(0));
    revealed = Array.from({ length: cfg.rows }, () => Array(cfg.cols).fill(false));
    flagged  = Array.from({ length: cfg.rows }, () => Array(cfg.cols).fill(false));
    gameOver = false; firstClick = true; elapsed = 0; flags = 0; running = true;
    clearInterval(timer);
    timer = setInterval(() => {
      if (!gameOver) { elapsed++; updateHUD(); }
    }, 1000);
  }

  function placeMines(sr, sc) {
    let placed = 0;
    while (placed < cfg.mines) {
      const r = Math.floor(Math.random() * cfg.rows);
      const c = Math.floor(Math.random() * cfg.cols);
      if (board[r][c] === -1 || (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1)) continue;
      board[r][c] = -1; placed++;
    }
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++) {
        if (board[r][c] === -1) continue;
        let cnt = 0;
        neighbors(r, c).forEach(([nr, nc]) => { if (board[nr][nc] === -1) cnt++; });
        board[r][c] = cnt;
      }
  }

  function neighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols && (dr || dc)) out.push([nr, nc]);
      }
    return out;
  }

  function reveal(r, c) {
    if (revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    if (board[r][c] === 0) neighbors(r, c).forEach(([nr, nc]) => reveal(nr, nc));
  }

  function checkWin() {
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++)
        if (!revealed[r][c] && board[r][c] !== -1) return false;
    return true;
  }

  function NUM_COLOR(n) {
    return ['','#3b82f6','#39ff14','#ef4444','#7c3aed','#dc2626','#06b6d4','#000','#888'][n] || '#888';
  }

  function updateHUD() {
    const el = document.getElementById('ms-hud');
    if (el) el.textContent = `💣 ${cfg.mines - flags}  ⏱ ${elapsed}s`;
  }

  function render() {
    const board2d = document.getElementById('ms-board');
    if (!board2d) return;
    board2d.innerHTML = '';
    board2d.style.gridTemplateColumns = `repeat(${cfg.cols}, 1fr)`;

    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'ms-cell';

        if (flagged[r][c] && !revealed[r][c]) {
          cell.textContent = '🚩'; cell.classList.add('flagged');
        } else if (!revealed[r][c]) {
          cell.classList.add('hidden');
        } else if (board[r][c] === -1) {
          cell.textContent = '💥'; cell.classList.add('mine');
        } else {
          cell.classList.add('open');
          if (board[r][c] > 0) {
            cell.textContent = board[r][c];
            cell.style.color = NUM_COLOR(board[r][c]);
          }
        }

        cell.addEventListener('click', () => handleClick(r, c));
        cell.addEventListener('contextmenu', e => { e.preventDefault(); handleFlag(r, c); });
        cell.addEventListener('touchstart', null);
        board2d.appendChild(cell);
      }

    updateHUD();
    MainApp.updateScore(Math.max(0, cfg.mines * 10 - elapsed));
  }

  function handleClick(r, c) {
    if (!running || gameOver || flagged[r][c] || revealed[r][c]) return;
    if (firstClick) { firstClick = false; placeMines(r, c); }
    if (board[r][c] === -1) {
      revealed[r][c] = true;
      // Reveal all mines
      for (let rr = 0; rr < cfg.rows; rr++)
        for (let cc = 0; cc < cfg.cols; cc++)
          if (board[rr][cc] === -1) revealed[rr][cc] = true;
      gameOver = true; running = false;
      render(); Audio.lose(); clearInterval(timer);
      setTimeout(() => MainApp.gameOver('minesweeper', 0, 'You hit a mine! 💥', false), 400);
      return;
    }
    reveal(r, c); Audio.click(); render();
    if (checkWin()) {
      gameOver = true; running = false; clearInterval(timer);
      const pts = Math.max(0, cfg.mines * 10 - elapsed);
      Storage.setHigh('minesweeper', pts);
      Audio.win();
      setTimeout(() => MainApp.gameOver('minesweeper', pts, `Cleared in ${elapsed}s! 🎉`, true), 300);
    }
  }

  function handleFlag(r, c) {
    if (!running || gameOver || revealed[r][c]) return;
    flagged[r][c] = !flagged[r][c];
    flags += flagged[r][c] ? 1 : -1;
    Audio.click(); render();
  }

  // Long-press for flag on mobile
  let touchTimer;
  function mount(container) {
    running = false; clearInterval(timer);
    container.innerHTML = `
      <div id="game-ms">
        <div class="ms-toprow">
          <button class="ms-lvl-btn btn-secondary" data-lvl="0">🟢 Beginner</button>
          <button class="ms-lvl-btn btn-secondary" data-lvl="1">🟡 Intermediate</button>
          <div id="ms-hud" class="ms-hud">💣 – ⏱ 0s</div>
        </div>
        <div id="ms-board" class="ms-board"></div>
        <p class="ms-hint">Left-click reveal · Right-click flag (mobile: long-press)</p>
      </div>
      <style>
        #game-ms{display:flex;flex-direction:column;align-items:center;gap:14px;padding:10px}
        .ms-toprow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center}
        .ms-hud{font-family:'Orbitron',monospace;font-size:.9rem;color:var(--accent);padding:6px 14px;background:rgba(0,245,255,.07);border-radius:8px;border:1px solid rgba(0,245,255,.2)}
        .ms-lvl-btn{padding:6px 14px;font-size:.78rem}
        .ms-board{display:grid;gap:3px;background:#1a1f36;padding:10px;border-radius:12px;max-width:100%;overflow:auto}
        .ms-hint{color:var(--text-dim);font-size:.72rem}
        .ms-cell{width:34px;height:34px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-size:.75rem;font-weight:700;cursor:pointer;user-select:none;transition:all .12s ease}
        .ms-cell.hidden{background:linear-gradient(135deg,#1e3050,#0e1a36);border:1px solid rgba(0,245,255,.15)}
        .ms-cell.hidden:hover{background:linear-gradient(135deg,#243d5a,#142236);transform:scale(.95)}
        .ms-cell.open{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05)}
        .ms-cell.mine{background:rgba(239,68,68,.25);border:1px solid #ef4444;font-size:1rem}
        .ms-cell.flagged{background:rgba(249,115,22,.12);border:1px solid #f97316;font-size:1rem}
      </style>`;

    document.querySelectorAll('.ms-lvl-btn').forEach(btn => {
      btn.addEventListener('click', () => { init(+btn.dataset.lvl); render(); });
    });

    // Long-press flag for mobile
    document.getElementById('ms-board').addEventListener('touchstart', e => {
      const cell = e.target.closest('.ms-cell');
      if (!cell) return;
      const idx = [...cell.parentElement.children].indexOf(cell);
      const r = Math.floor(idx / cfg.cols), c = idx % cfg.cols;
      touchTimer = setTimeout(() => { handleFlag(r, c); }, 500);
    });
    document.getElementById('ms-board').addEventListener('touchend', () => clearTimeout(touchTimer));

    init(0); render();
  }

  function pause() {}
  function restart() { init(cfg === CONFIGS[0] ? 0 : 1); render(); }
  function stop() { running = false; clearInterval(timer); }

  return { id: 'minesweeper', mount, pause, restart, stop };
})();
