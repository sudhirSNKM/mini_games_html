/* ── 2048 – Merge Tiles ── */
const G2048Game = (() => {
  let grid, score, best, running=false;
  const SIZE = 4;

  function empty() { return Array.from({length:SIZE},()=>Array(SIZE).fill(0)); }

  function addTile(g) {
    const cells = [];
    for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (!g[r][c]) cells.push({r,c});
    if (!cells.length) return;
    const {r,c} = cells[Math.floor(Math.random()*cells.length)];
    g[r][c] = Math.random()<0.85 ? 2 : 4;
  }

  function reset() {
    grid = empty(); score = 0; best = Storage.getHigh('g2048');
    addTile(grid); addTile(grid);
    running = true;
  }

  function slide(row) {
    let arr = row.filter(v=>v!==0), merged=false, pts=0;
    for (let i=0;i<arr.length-1;i++) {
      if (arr[i]===arr[i+1]) {
        arr[i] *= 2; pts += arr[i]; arr[i+1]=0; i++; merged=true;
      }
    }
    arr = arr.filter(v=>v!==0);
    while (arr.length<SIZE) arr.push(0);
    return { arr, pts, merged };
  }

  function move(dir) {
    if (!running) return false;
    let moved=false, totalPts=0;
    const prev = JSON.stringify(grid);

    for (let r=0;r<SIZE;r++) {
      for (let c=0;c<SIZE;c++) {
        let row;
        if (dir==='left')  row = grid[r];
        if (dir==='right') row = [...grid[r]].reverse();
        if (dir==='up')    row = grid.map(row=>row[c]);
        if (dir==='down')  row = grid.map(row=>row[c]).reverse();
        if (!row) continue;
        const { arr, pts, merged } = slide(row);
        if (merged && pts) { Audio.merge(); }
        totalPts += pts;
        if (dir==='left')  grid[r] = arr;
        if (dir==='right') grid[r] = [...arr].reverse();
        if (dir==='up')    arr.forEach((v,i)=>grid[i][c]=v);
        if (dir==='down')  [...arr].reverse().forEach((v,i)=>grid[i][c]=v);
      }
    }
    if (JSON.stringify(grid)!==prev) { moved=true; score+=totalPts; addTile(grid); }
    return moved;
  }

  function isOver() {
    for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
      if (!grid[r][c]) return false;
      if (c<SIZE-1 && grid[r][c]===grid[r][c+1]) return false;
      if (r<SIZE-1 && grid[r][c]===grid[r+1][c]) return false;
    }
    return true;
  }

  function tileClass(v) {
    const map = {0:'',2:'t2',4:'t4',8:'t8',16:'t16',32:'t32',64:'t64',128:'t128',256:'t256',512:'t512',1024:'t1024',2048:'t2048'};
    return map[v] || 't2048';
  }

  function render() {
    const board = document.getElementById('board-2048');
    if (!board) return;
    board.innerHTML='';
    grid.flat().forEach(v => {
      const d = document.createElement('div');
      d.className = `tile-2048 ${tileClass(v)} ${v ? 'new' : ''}`;
      d.textContent = v || '';
      board.appendChild(d);
    });
    document.getElementById('score-2048').textContent = score;
    if (Storage.setHigh('g2048', score)) {
      best = score;
      document.getElementById('best-2048').textContent = best;
    }
    MainApp.updateScore(score);

    if (isOver()) {
      running=false;
      setTimeout(() => MainApp.gameOver('g2048', score, `Best tile reached!`, false), 400);
    }
    const hasWon = grid.flat().includes(2048);
    if (hasWon && running) { running=false; setTimeout(()=>MainApp.gameOver('g2048',score,'You reached 2048! 🎉',true),300); }
  }

  function mount(container) {
    running=false;
    container.innerHTML = `
      <div id="game-2048">
        <div class="g2048-header">
          <div class="g2048-score-box">Score<br><strong id="score-2048">0</strong></div>
          <div class="g2048-score-box">Best<br><strong id="best-2048">${Storage.getHigh('g2048')}</strong></div>
        </div>
        <div id="board-2048"></div>
        <p style="color:var(--text-dim);font-size:.78rem;margin-top:8px">Arrow keys or swipe to play</p>
      </div>
      <style>
        #game-2048{display:flex;flex-direction:column;align-items:center;gap:14px}
        .g2048-header{display:flex;gap:16px}
        .g2048-score-box{background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:10px 20px;text-align:center;font-size:.75rem;color:var(--text-dim)}
        .g2048-score-box strong{display:block;font-family:'Orbitron',sans-serif;font-size:1.2rem;color:var(--accent);margin-top:4px}
      </style>`;
    reset(); render();
  }

  document.addEventListener('keydown', e => {
    if (!document.getElementById('board-2048') || !running) return;
    const map = {ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); render(); }
  });

  // Touch swipe
  let sx, sy;
  document.addEventListener('touchstart', e => { sx=e.touches[0].clientX; sy=e.touches[0].clientY; });
  document.addEventListener('touchend', e => {
    if (!document.getElementById('board-2048') || !running) return;
    const dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy;
    if (Math.abs(dx)>Math.abs(dy)) move(dx>0?'right':'left');
    else move(dy>0?'down':'up');
    render();
  });

  function pause()   {}
  function restart() { reset(); render(); }
  function stop()    { running=false; }

  return { id:'g2048', mount, pause, restart, stop };
})();
