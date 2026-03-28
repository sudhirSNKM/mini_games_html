/* ── TETRIS – Classic Falling Blocks ── */
const TetrisGame = (() => {
  let canvas, ctx, raf, paused = false, running = false;
  const COLS = 10, ROWS = 20, CS = 28;
  const W = COLS * CS, H = ROWS * CS;
  let board, piece, nextPiece, score, level, lines, dropTimer, dropInterval;

  const SHAPES = {
    I: { cells: [[0,1],[1,1],[2,1],[3,1]], color: '#00f5ff' },
    O: { cells: [[0,0],[1,0],[0,1],[1,1]], color: '#facc15' },
    T: { cells: [[1,0],[0,1],[1,1],[2,1]], color: '#a855f7' },
    S: { cells: [[1,0],[2,0],[0,1],[1,1]], color: '#39ff14' },
    Z: { cells: [[0,0],[1,0],[1,1],[2,1]], color: '#ff2d6b' },
    J: { cells: [[0,0],[0,1],[1,1],[2,1]], color: '#3b82f6' },
    L: { cells: [[2,0],[0,1],[1,1],[2,1]], color: '#f97316' },
  };

  const KEYS = Object.keys(SHAPES);

  function randomPiece() {
    const key = KEYS[Math.floor(Math.random() * KEYS.length)];
    const s = SHAPES[key];
    return { cells: s.cells.map(c=>[...c]), color: s.color, x: 3, y: 0 };
  }

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function reset() {
    board = emptyBoard();
    score = 0; level = 1; lines = 0;
    dropInterval = 700;
    piece = randomPiece();
    nextPiece = randomPiece();
    paused = false;
  }

  function cellsOf(p) {
    return p.cells.map(([cx, cy]) => [p.x + cx, p.y + cy]);
  }

  function valid(p, board) {
    return cellsOf(p).every(([x, y]) =>
      x >= 0 && x < COLS && y < ROWS && (y < 0 || !board[y][x])
    );
  }

  function lock() {
    cellsOf(piece).forEach(([x, y]) => {
      if (y >= 0) board[y][x] = piece.color;
    });
    // Clear full rows
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(c => c)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++; r++;
      }
    }
    if (cleared) {
      const pts = [0, 100, 300, 500, 800][cleared] * level;
      score += pts; lines += cleared;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 700 - (level - 1) * 60);
      Audio.eat(); MainApp.updateScore(score);
      Storage.setHigh('tetris', score);
    }
    piece = nextPiece; piece.x = 3; piece.y = 0;
    nextPiece = randomPiece();
    if (!valid(piece, board)) {
      running = false; Storage.setHigh('tetris', score);
      MainApp.gameOver('tetris', score, `Level ${level} · ${lines} lines`, false);
    }
  }

  function rotate(p) {
    const size = Math.max(...p.cells.map(([x]) => x)) + 1;
    const rotated = p.cells.map(([x, y]) => [size - 1 - y, x]);
    const np = { ...p, cells: rotated };
    if (!valid(np, board)) return p;
    return np;
  }

  function drop() {
    const moved = { ...piece, y: piece.y + 1 };
    if (valid(moved, board)) piece = moved;
    else lock();
  }

  function hardDrop() {
    while (valid({ ...piece, y: piece.y + 1 }, board)) piece.y++;
    lock(); Audio.click();
  }

  function ghost() {
    let g = { ...piece };
    while (valid({ ...g, y: g.y + 1 }, board)) g.y++;
    return g;
  }

  function drawCell(x, y, color, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowBlur = 8; ctx.shadowColor = color;
    ctx.beginPath();
    ctx.roundRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2, 3);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(x * CS + 2, y * CS + 2, CS - 4, 6);
  }

  function drawNext(p) {
    const nx = W + 18, ny = 80;
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.beginPath(); ctx.roundRect(nx, ny - 20, 100, 80, 8); ctx.fill();
    ctx.fillStyle = 'rgba(0,245,255,.6)';
    ctx.font = '11px Orbitron, monospace'; ctx.textAlign = 'left';
    ctx.fillText('NEXT', nx, ny - 26);
    p.cells.forEach(([cx, cy]) => {
      ctx.fillStyle = p.color; ctx.shadowBlur = 6; ctx.shadowColor = p.color;
      ctx.beginPath(); ctx.roundRect(nx + cx * 22 + 10, ny + cy * 22, 20, 20, 3); ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function draw() {
    // Expand canvas for sidebar
    ctx.fillStyle = '#080b14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        ctx.strokeRect(c * CS, r * CS, CS, CS);
        if (board[r][c]) drawCell(c, r, board[r][c]);
      }

    // Ghost
    const g = ghost();
    cellsOf(g).forEach(([x, y]) => { if (y >= 0) drawCell(x, y, piece.color, 0.18); });

    // Active piece
    cellsOf(piece).forEach(([x, y]) => { if (y >= 0) drawCell(x, y, piece.color); });

    // Right panel
    const px = W + 10;
    ctx.fillStyle = 'rgba(0,245,255,.7)'; ctx.font = 'bold 12px Orbitron, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`SCORE`, px, 30);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Orbitron, monospace';
    ctx.fillText(score, px, 50);
    ctx.fillStyle = 'rgba(0,245,255,.7)'; ctx.font = 'bold 12px Orbitron, monospace';
    ctx.fillText(`LEVEL`, px, 175); ctx.fillStyle = '#fff'; ctx.fillText(level, px, 195);
    ctx.fillText(`LINES`, px, 220); ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Orbitron, monospace'; ctx.fillText(lines, px, 238);

    drawNext(nextPiece);

    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#00f5ff'; ctx.font = 'bold 28px Orbitron, monospace'; ctx.textAlign = 'center';
      ctx.fillText('PAUSED', W / 2, H / 2);
    }
  }

  function loop(ts) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    draw();
  }

  function startDrop() {
    clearInterval(dropTimer);
    dropTimer = setInterval(() => { if (!paused && running) drop(); }, dropInterval);
  }

  document.addEventListener('keydown', e => {
    if (!document.getElementById('view-game')?.classList.contains('active') || !running) return;
    const map = {
      ArrowLeft:  () => { const m={...piece,x:piece.x-1}; if(valid(m,board)) piece=m; },
      ArrowRight: () => { const m={...piece,x:piece.x+1}; if(valid(m,board)) piece=m; },
      ArrowDown:  () => drop(),
      ArrowUp:    () => { piece=rotate(piece); Audio.click(); },
      ' ':        () => hardDrop(),
    };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
  });

  // Touch swipe
  let tx0, ty0;
  function addTouch() {
    canvas.addEventListener('touchstart', e => { tx0=e.touches[0].clientX; ty0=e.touches[0].clientY; });
    canvas.addEventListener('touchend', e => {
      const dx=e.changedTouches[0].clientX-tx0, dy=e.changedTouches[0].clientY-ty0;
      if(Math.abs(dy)>Math.abs(dx)){ if(dy>0) hardDrop(); else { piece=rotate(piece); } }
      else { const m={...piece,x:piece.x+(dx>0?1:-1)}; if(valid(m,board)) piece=m; }
    });
  }

  function initCanvas() {
    canvas = document.createElement('canvas');
    canvas.width = W + 120; canvas.height = H;
    canvas.style.maxWidth = '100%';
    ctx = canvas.getContext('2d');
    addTouch();
  }

  function mount(container) {
    stop(); reset(); running = true;
    if (!canvas) initCanvas();
    container.appendChild(canvas);
    startDrop();
    raf = requestAnimationFrame(loop);
  }

  function pause() {
    paused = !paused;
    if (!paused) startDrop();
    else clearInterval(dropTimer);
  }

  function restart() { mount(canvas.parentElement); }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    clearInterval(dropTimer);
  }

  return { id: 'tetris', mount, pause, restart, stop };
})();
