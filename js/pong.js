/* ── PONG – Player vs AI ── */
const PongGame = (() => {
  let canvas, ctx, raf, paused = false, running = false;
  let score = 0;
  const W = 700, H = 420;
  const PAD_W = 12, PAD_H = 80, BALL_R = 8;
  const state = {
    player: { y: H/2 - PAD_H/2, dy: 0, score: 0 },
    ai:     { y: H/2 - PAD_H/2, speed: 3.5,  score: 0 },
    ball:   { x: W/2, y: H/2, dx: 5, dy: 3 }
  };

  function clampPad(v) { return Math.max(0, Math.min(H - PAD_H, v)); }

  function resetBall(dir = 1) {
    state.ball = { x: W/2, y: H/2, dx: 5*dir, dy: (Math.random()*4-2) };
  }

  function aiMove() {
    const b = state.ball, ai = state.ai;
    const center = ai.y + PAD_H/2;
    if (b.dx > 0) {
      if (center < b.y - 6) ai.y += ai.speed;
      else if (center > b.y + 6) ai.y -= ai.speed;
    }
    ai.y = clampPad(ai.y);
  }

  function draw() {
    ctx.clearRect(0,0,W,H);

    // Background
    ctx.fillStyle = '#080b14';
    ctx.fillRect(0,0,W,H);

    // Center line
    ctx.setLineDash([10,10]);
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.font = 'bold 2rem Orbitron, monospace';
    ctx.fillStyle = 'rgba(0,245,255,.7)';
    ctx.textAlign = 'center';
    ctx.fillText(state.player.score, W/2 - 70, 50);
    ctx.fillText(state.ai.score, W/2 + 70, 50);

    // Paddles
    const pGrad = ctx.createLinearGradient(0,0,PAD_W,0);
    pGrad.addColorStop(0,'#00f5ff'); pGrad.addColorStop(1,'#0080aa');
    ctx.fillStyle = pGrad;
    ctx.beginPath(); ctx.roundRect(10, state.player.y, PAD_W, PAD_H, 4); ctx.fill();
    const aGrad = ctx.createLinearGradient(W-PAD_W,0,W,0);
    aGrad.addColorStop(0,'#ff2d6b'); aGrad.addColorStop(1,'#aa0040');
    ctx.fillStyle = aGrad;
    ctx.beginPath(); ctx.roundRect(W-PAD_W-10, state.ai.y, PAD_W, PAD_H, 4); ctx.fill();

    // Ball glow
    const b = state.ball;
    ctx.shadowBlur = 20; ctx.shadowColor = '#00f5ff';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function update() {
    if (paused) return;
    const b = state.ball;
    b.x += b.dx; b.y += b.dy;

    // Wall bounce
    if (b.y - BALL_R < 0) { b.y = BALL_R; b.dy = Math.abs(b.dy); }
    if (b.y + BALL_R > H) { b.y = H-BALL_R; b.dy = -Math.abs(b.dy); }

    // Player paddle
    if (b.dx < 0 && b.x - BALL_R < 10+PAD_W && b.y > state.player.y && b.y < state.player.y+PAD_H) {
      b.dx = Math.abs(b.dx)*1.05; b.x = 10+PAD_W+BALL_R;
      const rel = ((b.y - state.player.y) / PAD_H) - 0.5;
      b.dy = rel * 10;
      Audio.paddle();
    }
    // AI paddle
    if (b.dx > 0 && b.x + BALL_R > W-PAD_W-10 && b.y > state.ai.y && b.y < state.ai.y+PAD_H) {
      b.dx = -Math.abs(b.dx)*1.05; b.x = W-PAD_W-10-BALL_R;
      const rel = ((b.y - state.ai.y) / PAD_H) - 0.5;
      b.dy = rel * 10;
      Audio.paddle();
    }
    // Cap speed
    const speed = Math.sqrt(b.dx*b.dx+b.dy*b.dy);
    if (speed > 18) { b.dx = b.dx/speed*18; b.dy = b.dy/speed*18; }

    // Score
    if (b.x < 0) {
      state.ai.score++; score = state.ai.score; Audio.point();
      MainApp.updateScore(state.player.score);
      resetBall(1);
    }
    if (b.x > W) {
      state.player.score++; Audio.point();
      score = state.player.score;
      MainApp.updateScore(score);
      resetBall(-1);
    }
    if (state.ai.score >= 7 || state.player.score >= 7) {
      const won = state.player.score >= 7;
      running = false;
      MainApp.gameOver('pong', score, won ? '🎉 You Win! ' : '💀 AI Wins!', won);
      return;
    }

    aiMove();
    // Player mouse/touch moves via canvas
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
    canvas.style.touchAction = 'none';
    ctx = canvas.getContext('2d');

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const scaleY = H / rect.height;
      state.player.y = clampPad((e.clientY - rect.top) * scaleY - PAD_H/2);
    });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleY = H / rect.height;
      state.player.y = clampPad((e.touches[0].clientY - rect.top) * scaleY - PAD_H/2);
    }, { passive: false });
  }

  function mount(container) {
    stop();
    score = 0;
    state.player.y = H/2 - PAD_H/2; state.player.score = 0;
    state.ai.y = H/2 - PAD_H/2;     state.ai.score = 0;
    resetBall(1); paused = false; running = true;
    if (!canvas) initCanvas();
    container.appendChild(canvas);
    loop();
  }

  function pause()   { paused = !paused; if (!paused) loop(); }
  function restart() { mount(canvas.parentElement); }
  function stop()    { running = false; cancelAnimationFrame(raf); }

  return { id:'pong', mount, pause, restart, stop };
})();
