/* ── TIC TAC TOE – Minimax AI ── */
const TictactoeGame = (() => {
  let board, human, ai, gameActive, score, running=false;

  function init() {
    board=Array(9).fill('');
    human='X'; ai='O'; gameActive=true; score=0; running=true;
  }

  const WIN_LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  function checkWinner(b,p) {
    return WIN_LINES.some(([a,c,d])=>b[a]===p&&b[c]===p&&b[d]===p);
  }

  function isDraw(b) { return b.every(c=>c!==''); }

  function minimax(b, depth, isMax, alpha=-Infinity, beta=Infinity) {
    if(checkWinner(b,ai))    return 10-depth;
    if(checkWinner(b,human)) return depth-10;
    if(isDraw(b))            return 0;
    if(depth>8)              return 0;

    if(isMax) {
      let best=-Infinity;
      b.forEach((_,i)=>{ if(!b[i]){ b[i]=ai; best=Math.max(best,minimax(b,depth+1,false,alpha,beta)); b[i]=''; alpha=Math.max(alpha,best); if(beta<=alpha) return; } });
      return best;
    } else {
      let best=Infinity;
      b.forEach((_,i)=>{ if(!b[i]){ b[i]=human; best=Math.min(best,minimax(b,depth+1,true,alpha,beta)); b[i]=''; beta=Math.min(beta,best); if(beta<=alpha) return; } });
      return best;
    }
  }

  function bestMove() {
    let best=-Infinity, mv=-1;
    board.forEach((_,i)=>{
      if(!board[i]){ board[i]=ai; const s=minimax(board,0,false); board[i]=''; if(s>best){best=s;mv=i;} }
    });
    return mv;
  }

  function getWinLine(b,p) {
    return WIN_LINES.find(([a,c,d])=>b[a]===p&&b[c]===p&&b[d]===p);
  }

  function setStatus(msg) {
    const el=document.getElementById('ttt-status'); if(el) el.textContent=msg;
  }

  function render(winLine=[]) {
    board.forEach((val,i)=>{
      const cell=document.getElementById(`ttt-${i}`);
      if(!cell) return;
      cell.textContent=val;
      cell.className=`ttt-cell ${val?val:''} ${val?'taken':''}`;
      if(winLine.includes(i)) cell.classList.add('win-cell');
    });
  }

  function playAt(idx) {
    if(!gameActive||!running||board[idx]) return;
    Audio.click();
    board[idx]=human; render();

    if(checkWinner(board,human)) {
      const wl=getWinLine(board,human); render(wl); setStatus('🎉 You win!');
      gameActive=false; score=1; MainApp.updateScore(score);
      Storage.setHigh('tictactoe', Storage.getHigh('tictactoe')+1);
      Audio.win();
      setTimeout(()=>MainApp.gameOver('tictactoe',1,'You beat the AI!',true),600);
      return;
    }
    if(isDraw(board)){ setStatus("🤝 Draw!"); gameActive=false;
      setTimeout(()=>MainApp.gameOver('tictactoe',0,"It's a draw!",false),600); return; }

    setStatus('🤖 AI thinking…');
    setTimeout(()=>{
      const mv=bestMove();
      if(mv===-1) return;
      board[mv]=ai; render();

      if(checkWinner(board,ai)){
        const wl=getWinLine(board,ai); render(wl); setStatus('💀 AI wins!');
        gameActive=false; Audio.lose();
        setTimeout(()=>MainApp.gameOver('tictactoe',0,'AI is unbeatable!',false),600);
        return;
      }
      if(isDraw(board)){ setStatus("🤝 Draw!"); gameActive=false;
        setTimeout(()=>MainApp.gameOver('tictactoe',0,"It's a draw!",false),600); return; }

      setStatus('Your turn (X)');
    }, 320);
  }

  function mount(container) {
    running=false;
    container.innerHTML=`
      <div id="game-tictactoe">
        <div id="ttt-status" class="ttt-status">Your turn (X)</div>
        <div id="board-ttt">
          ${Array(9).fill(0).map((_,i)=>`<div class="ttt-cell" id="ttt-${i}" data-idx="${i}"></div>`).join('')}
        </div>
        <p style="color:var(--text-dim);font-size:.78rem;margin-top:8px">You are X · AI uses Minimax</p>
      </div>`;
    document.querySelectorAll('.ttt-cell').forEach(cell=>{
      cell.addEventListener('click',()=>playAt(+cell.dataset.idx));
    });
    init(); render();
  }

  function pause()   {}
  function restart() { init(); render(); document.querySelectorAll('.ttt-cell').forEach(c=>{c.className='ttt-cell';c.textContent='';}); setStatus('Your turn (X)'); }
  function stop()    { running=false; }

  return { id:'tictactoe', mount, pause, restart, stop };
})();
