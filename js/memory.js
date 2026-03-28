/* ── MEMORY CARD MATCHING ── */
const MemoryGame = (() => {
  const EMOJIS = ['🌟','🔥','💎','🚀','🎯','🌈','⚡','🎪','🦋','🏆','🍀','🎭'];
  let cards, flipped, matched, moves, locked, running=false;

  function init() {
    const set = [...EMOJIS, ...EMOJIS].sort(()=>Math.random()-.5);
    cards = set.map((emoji,i)=>({ id:i, emoji, flippedState:false, matchedState:false }));
    flipped=[]; matched=0; moves=0; locked=false; running=true;
  }

  function render() {
    const board = document.getElementById('board-memory');
    if (!board) return;
    board.innerHTML='';
    cards.forEach(card=>{
      const el=document.createElement('div');
      el.className=`mem-card ${card.flippedState?'flipped':''} ${card.matchedState?'matched':''}`;
      el.innerHTML=`<div class="mem-card-inner">
        <div class="mem-front">❓</div>
        <div class="mem-back">${card.emoji}</div>
      </div>`;
      el.addEventListener('click',()=>clickCard(card,el));
      board.appendChild(el);
    });
    document.getElementById('hud-memory').textContent=`Moves: ${moves}  Matched: ${matched}/${EMOJIS.length}`;
    MainApp.updateScore(matched*10 - moves);
  }

  function clickCard(card, el) {
    if (!running||locked||card.flippedState||card.matchedState) return;
    Audio.flip();
    card.flippedState=true; el.classList.add('flipped');
    flipped.push({card,el});

    if (flipped.length===2) {
      locked=true; moves++;
      const [a,b]=flipped;
      if (a.card.emoji===b.card.emoji) {
        a.card.matchedState=true; b.card.matchedState=true;
        a.el.classList.add('matched'); b.el.classList.add('matched');
        matched++; flipped=[]; locked=false; Audio.eat();
        document.getElementById('hud-memory').textContent=`Moves: ${moves}  Matched: ${matched}/${EMOJIS.length}`;
        MainApp.updateScore(matched*10 - moves);
        if (matched===EMOJIS.length) {
          running=false;
          const pts=Math.max(0,500-moves*5);
          Storage.setHigh('memory',pts);
          Audio.win();
          setTimeout(()=>MainApp.gameOver('memory',pts,`${moves} moves to clear!`,true),400);
        }
      } else {
        setTimeout(()=>{
          a.card.flippedState=false; b.card.flippedState=false;
          a.el.classList.remove('flipped'); b.el.classList.remove('flipped');
          flipped=[]; locked=false;
        }, 1000);
      }
    }
  }

  function mount(container) {
    running=false;
    container.innerHTML=`
      <div id="game-memory">
        <div id="hud-memory" style="font-family:'Orbitron',sans-serif;font-size:.85rem;color:var(--accent)">Moves: 0  Matched: 0/${EMOJIS.length}</div>
        <div id="board-memory"></div>
      </div>`;
    init(); render();
  }

  function pause()   {}
  function restart() { init(); render(); }
  function stop()    { running=false; }

  return { id:'memory', mount, pause, restart, stop };
})();
