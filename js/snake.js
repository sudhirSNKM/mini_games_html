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

  function drawCell(x, y, r, g, b, glow) {
    const px = x*CS, py = y*CS;
    if (glow) { ctx.shadowBlur=16; ctx.shadowColor=`rgb(${r},${g},${b})`; }
    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.beginPath(); ctx.roundRect(px+1,py+1,CS-2,CS-2,4); ctx.fill();
    ctx.shadowBlur=0;
  }

  function draw() {
    ctx.fillStyle='#080b14'; ctx.fillRect(0,0,W,H);
    // grid
    ctx.strokeStyle='rgba(255,255,255,.03)';
    for(let x=0;x<COLS;x++) for(let y=0;y<ROWS;y++){
      ctx.strokeRect(x*CS,y*CS,CS,CS);
    }
    // food
    ctx.shadowBlur=24; ctx.shadowColor='#ff2d6b';
    ctx.fillStyle='#ff2d6b';
    ctx.beginPath();
    ctx.arc(food.x*CS+CS/2, food.y*CS+CS/2, CS/2-2, 0, Math.PI*2);
    ctx.fill(); ctx.shadowBlur=0;

    // snake
    snake.forEach((seg,i) => {
      const ratio = 1 - i/snake.length;
      const r = Math.round(0   + ratio*57);
      const g = Math.round(245 * ratio);
      const bv = Math.round(255 * ratio);
      drawCell(seg.x, seg.y, r, g, bv, i===0);
    });

    // score
    ctx.fillStyle='rgba(0,245,255,.7)'; ctx.font='bold 14px Orbitron,monospace';
    ctx.textAlign='right'; ctx.fillText(`Score: ${score}`, W-10, 20);
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
    } else { snake.pop(); }
    draw();
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
    container.appendChild(canvas);
    running = true;
    draw();
    gameLoop = setInterval(step, speed);
  }

  document.addEventListener('keydown', e => {
    if (!running) return;
    const map = {
      ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},
      ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
      w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}
    };
    const d = map[e.key];
    if (d && !(d.x===-dir.x && d.y===-dir.y)) { nextDir=d; e.preventDefault(); }
  });

  // Swipe
  let tx, ty;
  document.addEventListener('touchstart', e => { tx=e.touches[0].clientX; ty=e.touches[0].clientY; });
  document.addEventListener('touchend', e => {
    if (!running) return;
    const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if (Math.abs(dx)>Math.abs(dy)) nextDir = dx>0?{x:1,y:0}:{x:-1,y:0};
    else nextDir = dy>0?{x:0,y:1}:{x:0,y:-1};
  });

  function pause()   { paused = !paused; }
  function restart() { mount(canvas.parentElement); }
  function stop()    { running=false; clearInterval(gameLoop); }

  return { id:'snake', mount, pause, restart, stop };
})();
