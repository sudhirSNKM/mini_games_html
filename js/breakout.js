/* ── BREAKOUT – Brick Breaker ── */
const BreakoutGame = (() => {
  let canvas, ctx, raf, paused = false, running = false;
  const W = 700, H = 460;
  let paddle, ball, bricks, score, lives, level;

  function initLevel() {
    const cols = 10, rows = 4 + level;
    const bW = 54, bH = 18, padX = 10, padY = 50;
    bricks = [];
    const colors = ['#ff2d6b','#ff6b6b','#f7971e','#facc15','#39ff14','#00f5ff','#818cf8','#a78bfa'];
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
      bricks.push({ x: padX+c*(bW+6), y: padY+r*(bH+6), w:bW, h:bH,
        hp: Math.ceil((level+1)/2), color: colors[(r+level)%colors.length] });
    }
  }

  function reset() {
    score = 0; lives = 3; level = 1;
    paddle = { x: W/2-45, y: H-30, w: 90, h: 12, speed: 7 };
    ball = { x: W/2, y: H-60, dx: 4.5, dy: -4.5, r: 8 };
    initLevel();
  }

  const keys = {};
  document.addEventListener('keydown', e => { keys[e.key]=true; });
  document.addEventListener('keyup',   e => { keys[e.key]=false; });

  function movePaddle() {
    if ((keys['ArrowLeft']||keys['a']) && paddle.x > 0)     paddle.x -= paddle.speed;
    if ((keys['ArrowRight']||keys['d']) && paddle.x+paddle.w < W) paddle.x += paddle.speed;
  }

  function draw() {
    ctx.fillStyle='#080b14'; ctx.fillRect(0,0,W,H);

    // Bricks
    bricks.forEach(b => {
      if (b.hp<=0) return;
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 8; ctx.shadowColor = b.color;
      ctx.beginPath(); ctx.roundRect(b.x,b.y,b.w,b.h,4); ctx.fill();
      ctx.shadowBlur = 0;
      // HP indicator
      if (b.hp > 1) {
        ctx.fillStyle='rgba(0,0,0,.6)'; ctx.font='bold 10px Inter,sans-serif';
        ctx.textAlign='center'; ctx.fillText(b.hp, b.x+b.w/2, b.y+b.h/2+4);
      }
    });

    // Paddle
    const pg = ctx.createLinearGradient(paddle.x,0,paddle.x+paddle.w,0);
    pg.addColorStop(0,'#00f5ff'); pg.addColorStop(1,'#a78bfa');
    ctx.fillStyle=pg; ctx.shadowBlur=14; ctx.shadowColor='#00f5ff';
    ctx.beginPath(); ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,6); ctx.fill();
    ctx.shadowBlur=0;

    // Ball
    ctx.shadowBlur=18; ctx.shadowColor='#ffffff';
    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;

    // HUD
    ctx.fillStyle='rgba(0,245,255,.7)'; ctx.font='14px Orbitron,monospace'; ctx.textAlign='left';
    ctx.fillText(`Score: ${score}  Lives: ${'❤️'.repeat(lives)}  Level: ${level}`, 10, 30);
  }

  function update() {
    if (paused || !running) return;
    movePaddle();
    ball.x += ball.dx; ball.y += ball.dy;

    // Walls
    if (ball.x-ball.r<0)  { ball.dx=Math.abs(ball.dx); ball.x=ball.r; }
    if (ball.x+ball.r>W)  { ball.dx=-Math.abs(ball.dx); ball.x=W-ball.r; }
    if (ball.y-ball.r<0)  { ball.dy=Math.abs(ball.dy); ball.y=ball.r; }

    // Ball lost
    if (ball.y > H+20) {
      lives--;
      if (lives <= 0) {
        running=false; MainApp.gameOver('breakout',score,`Level ${level} reached!`,false); return;
      }
      ball = { x:W/2, y:H-60, dx:4.5+level*.3, dy:-(4.5+level*.3), r:8 };
      Audio.lose();
    }

    // Paddle collision
    if (ball.dy>0 && ball.x>paddle.x && ball.x<paddle.x+paddle.w &&
        ball.y+ball.r>paddle.y && ball.y+ball.r<paddle.y+paddle.h+10) {
      ball.dy = -Math.abs(ball.dy);
      const off = (ball.x - (paddle.x+paddle.w/2)) / (paddle.w/2);
      ball.dx = off * 7;
      Audio.paddle();
    }

    // Brick collision
    let cleared = true;
    bricks.forEach(b => {
      if (b.hp<=0) return;
      cleared = false;
      if (ball.x>b.x && ball.x<b.x+b.w && ball.y-ball.r<b.y+b.h && ball.y+ball.r>b.y) {
        b.hp--;
        if (b.hp<=0) { score += 10*level; Audio.eat(); MainApp.updateScore(score); }
        else Audio.paddle();
        const fromTop = Math.abs(ball.y+ball.r - b.y);
        const fromBot = Math.abs(ball.y-ball.r - (b.y+b.h));
        ball.dy = fromTop < fromBot ? -Math.abs(ball.dy) : Math.abs(ball.dy);
      }
    });

    // Level clear
    if (cleared) {
      level++;
      score += 200;
      MainApp.updateScore(score);
      Audio.win();
      ball = { x:W/2, y:H-60, dx:4+level*.4, dy:-(4+level*.4), r:8 };
      paddle.w = Math.max(50, 90-level*5);
      initLevel();
    }
  }

  function loop() {
    if (!running) return;
    update(); draw();
    raf = requestAnimationFrame(loop);
  }

  function initCanvas() {
    canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.maxWidth = '100%';
    ctx = canvas.getContext('2d');
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      paddle.x = (e.clientX - rect.left)*scaleX - paddle.w/2;
      paddle.x = Math.max(0, Math.min(W-paddle.w, paddle.x));
    });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      paddle.x = (e.touches[0].clientX - rect.left)*scaleX - paddle.w/2;
      paddle.x = Math.max(0, Math.min(W-paddle.w, paddle.x));
    }, { passive: false });
  }

  function mount(container) {
    stop(); reset(); paused=false; running=true;
    if (!canvas) initCanvas();
    container.appendChild(canvas);
    loop();
  }
  function pause()   { paused = !paused; if (!paused) loop(); }
  function restart() { mount(canvas.parentElement); }
  function stop()    { running=false; cancelAnimationFrame(raf); }

  return { id:'breakout', mount, pause, restart, stop };
})();
