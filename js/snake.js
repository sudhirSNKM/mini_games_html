/* ── SNAKE – Grid-based ── */
const SnakeGame = (() => {
  let canvas, ctx, raf, gameLoop, paused = false, running = false;
  const COLS = 25, ROWS = 20, CS = 22; // cell size
  const W = COLS*CS, H = ROWS*CS;
  let snake, dir, nextDir, food, score, speed;

  function rng(max) { return Math.floor(Math.random()*max); }

  function randomFood() {
    let pos;
    do { pos = { x: rng(COLS), y: rng(ROWS) }; }
    while (snake.some(s => s.x===pos.x && s.y===pos.y));
    return pos;
  }

  function reset() {
    snake = [{x:12,y:10},{x:11,y:10},{x:10,y:10}];
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    food = randomFood(); score = 0; speed = 120;
    paused = false;
  }

  function draw() {
    if (!running || !ctx) return;
    ctx.fillStyle='#080b14'; ctx.fillRect(0,0,W,H);
    
    // grid
    ctx.strokeStyle='rgba(255,255,255,.03)';
    for(let x=0;x<COLS;x++) for(let y=0;y<ROWS;y++){
      ctx.strokeRect(x*CS,y*CS,CS,CS);
    }

    // food pulse
    const pulse = 1 + 0.15 * Math.sin(Date.now()/150);
    ctx.shadowBlur=24 * pulse; ctx.shadowColor='#ff2d6b';
    ctx.fillStyle='#ff2d6b';
    ctx.beginPath();
    ctx.arc(food.x*CS+CS/2, food.y*CS+CS/2, (CS/2-2)*pulse, 0, Math.PI*2);
    ctx.fill(); ctx.shadowBlur=0;

    // snake
    snake.forEach((seg,i) => {
      const ratio = 1 - i/snake.length;
      const r = Math.round(0   + ratio*57);
      const g = Math.round(245 * ratio);
      const bv = Math.round(255 * ratio);
      const headPulse = i === 0 ? 1 + 0.1 * Math.sin(Date.now()/100) : 1;
      
      const px = seg.x*CS, py = seg.y*CS;
      if (i === 0) { ctx.shadowBlur=20*headPulse; ctx.shadowColor=`rgb(${r},${g},${bv})`; }
      ctx.fillStyle=`rgb(${r},${g},${bv})`;
      ctx.beginPath(); 
      ctx.roundRect(px+1, py+1, (CS-2)*headPulse, (CS-2)*headPulse, 4); 
      ctx.fill();
      ctx.shadowBlur=0;
    });

    // score
    ctx.fillStyle='rgba(0,245,255,.7)'; ctx.font='bold 14px Orbitron,monospace';
    ctx.textAlign='right'; ctx.fillText(`Score: ${score}`, W-10, 20);

    if (running && !paused) requestAnimationFrame(draw);
  }

  function step() {
    if (paused || !running) return;
    dir = {...nextDir};
    const head = { x: (snake[0].x+dir.x+COLS)%COLS, y: (snake[0].y+dir.y+ROWS)%ROWS };
    // self collision
    if (snake.some(s=>s.x===head.x&&s.y===head.y)) {
      running = false;
      MainApp.gameOver('snake', score, `You scored ${score}!`, false);
      return;
    }
    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) {
      score += 10; Audio.eat();
      MainApp.updateScore(score);
      food = randomFood();
      speed = Math.max(60, speed - 3);
      clearInterval(gameLoop);
      gameLoop = setInterval(step, speed);
    } else { 
      snake.pop(); 
    }
  }

  function mount(container) {
    stop();
    reset();
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      canvas.style.maxWidth = '100%';
      ctx = canvas.getContext('2d');
    }
    container.innerHTML = '';
    container.appendChild(canvas);
    running = true;
    requestAnimationFrame(draw);
    gameLoop = setInterval(step, speed);
  }

  const handler = e => {
    if (!running) return;
    const map = {
      ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},
      ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
      w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}
    };
    const d = map[e.key];
    if (d && !(d.x===-dir.x && d.y===-dir.y)) { nextDir=d; e.preventDefault(); }
  };
  document.addEventListener('keydown', handler);

  function pause()   { paused = !paused; }
  function restart() { reset(); running=true; requestAnimationFrame(draw); }
  function stop()    { running=false; clearInterval(gameLoop); }

  return { id:'snake', mount, pause, restart, stop };
})();
