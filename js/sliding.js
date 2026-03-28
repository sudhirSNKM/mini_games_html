/* ── SLIDING PUZZLE – 4×4 tiles ── */
const SlidingGame = (() => {
  const N = 4;
  let tiles, moves, running=false, timer, elapsed;

  function init() {
    tiles = Array.from({length:N*N},(_,i)=>i); // 0 = blank
    shuffle();
    while (!isSolvable()) shuffle();
    moves=0; elapsed=0; running=true;
    clearInterval(timer);
    timer = setInterval(()=>{ elapsed++; updateHUD(); }, 1000);
  }

  function shuffle() {
    for(let i=tiles.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [tiles[i],tiles[j]]=[tiles[j],tiles[i]];
    }
  }

  function isSolvable() {
    let inv=0;
    for(let i=0;i<tiles.length;i++) for(let j=i+1;j<tiles.length;j++)
      if(tiles[i]&&tiles[j]&&tiles[i]>tiles[j]) inv++;
    const blankRow = Math.floor(tiles.indexOf(0)/N);
    return N%2===1 ? inv%2===0 : (Math.floor((N*N-tiles.indexOf(0)-1)/N))%2===0 ? inv%2===0 : inv%2!==0;
  }

  function isSolved() { return tiles.every((v,i)=>(i===N*N-1)?v===0:v===i+1); }

  function blank() { return tiles.indexOf(0); }

  function canMove(idx) {
    const bi=blank();
    const row=Math.floor(idx/N), col=idx%N;
    const br=Math.floor(bi/N), bc=bi%N;
    return (row===br&&Math.abs(col-bc)===1)||(col===bc&&Math.abs(row-br)===1);
  }

  function moveTile(idx) {
    if(!canMove(idx)||!running) return;
    const bi=blank();
    [tiles[idx],tiles[bi]]=[tiles[bi],tiles[idx]];
    moves++; Audio.click(); render();
    MainApp.updateScore(moves);
    if(isSolved()){
      clearInterval(timer); running=false;
      const pts = Math.max(0, 1000 - moves*5 - elapsed);
      Storage.setHigh('sliding', pts);
      setTimeout(()=>MainApp.gameOver('sliding',pts,`${moves} moves in ${elapsed}s`,true),300);
    }
  }

  function updateHUD() {
    const h=document.getElementById('hud-sliding');
    if(h) h.textContent=`Moves: ${moves}  Time: ${elapsed}s`;
  }

  function render() {
    const board = document.getElementById('board-sliding');
    if(!board) return;
    board.innerHTML='';
    tiles.forEach((v,i)=>{
      const d=document.createElement('div');
      d.className=`slide-tile ${v===0?'empty':''}`;
      d.textContent=v||'';
      if(v!==0) d.addEventListener('click',()=>moveTile(i));
      board.appendChild(d);
    });
    updateHUD();
  }

  function mount(container) {
    running=false; clearInterval(timer);
    container.innerHTML=`
      <div id="game-sliding">
        <div id="hud-sliding" style="font-family:'Orbitron',sans-serif;font-size:.85rem;color:var(--accent)"></div>
        <div id="board-sliding" style="grid-template-columns:repeat(${N},90px)"></div>
        <p style="color:var(--text-dim);font-size:.78rem">Click tiles adjacent to blank to slide</p>
      </div>`;
    init(); render();
  }

  // Keyboard support (arrow nudge)
  document.addEventListener('keydown', e=>{
    if(!document.getElementById('board-sliding')||!running) return;
    const bi=blank(), row=Math.floor(bi/N), col=bi%N;
    let target=-1;
    if(e.key==='ArrowUp'    && row<N-1) target=bi+N;
    if(e.key==='ArrowDown'  && row>0)   target=bi-N;
    if(e.key==='ArrowLeft'  && col<N-1) target=bi+1;
    if(e.key==='ArrowRight' && col>0)   target=bi-1;
    if(target>=0) { e.preventDefault(); moveTile(target); }
  });

  function pause()   {}
  function restart() { init(); render(); }
  function stop()    { running=false; clearInterval(timer); }

  return { id:'sliding', mount, pause, restart, stop };
})();
