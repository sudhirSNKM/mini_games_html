/* ── FLAPPY BIRD ── */
const FlappyGame = (() => {
  let canvas, ctx, raf, paused=false, running=false;
  const W=400, H=550;
  const GRAV=0.45, FLAP=-9, PIPE_W=60, GAP=155, PIPE_SPEED=2.5;
  let bird, pipes, score, frameN, started;

  function reset() {
    bird={ x:80, y:H/2, vy:0, r:16 };
    pipes=[]; score=0; frameN=0; started=false; paused=false;
  }

  function addPipe() {
    const top = 80+Math.random()*(H-GAP-160);
    pipes.push({ x:W, top });
  }

  function flap() {
    if (!running) return;
    if (!started) { started=true; }
    if (paused) return;
    bird.vy = FLAP; Audio.paddle();
  }

  function draw() {
    // Sky gradient
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#0d0d2b'); sky.addColorStop(1,'#1a1a4a');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

    // Stars
    ctx.fillStyle='rgba(255,255,255,.5)';
    [30,90,160,230,310,350,70,200,270].forEach((x,i)=>{
      ctx.beginPath(); ctx.arc(x,20+i*12,1.2,0,Math.PI*2); ctx.fill();
    });

    // Ground
    ctx.fillStyle='#1a3a1a'; ctx.fillRect(0,H-40,W,40);
    ctx.fillStyle='#2d5a0f'; ctx.fillRect(0,H-40,W,6);

    // Pipes
    pipes.forEach(p=>{
      const pg=ctx.createLinearGradient(p.x,0,p.x+PIPE_W,0);
      pg.addColorStop(0,'#2d7d32'); pg.addColorStop(1,'#1b5e20');
      ctx.fillStyle=pg;
      ctx.shadowBlur=12; ctx.shadowColor='#39ff14';
      // Top pipe
      ctx.beginPath(); ctx.roundRect(p.x,0,PIPE_W,p.top,4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(p.x-5,p.top-20,PIPE_W+10,20,4); ctx.fill();
      // Bottom pipe
      const bot=p.top+GAP;
      ctx.beginPath(); ctx.roundRect(p.x,bot,PIPE_W,H-bot-40,4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(p.x-5,bot,PIPE_W+10,20,4); ctx.fill();
      ctx.shadowBlur=0;
    });

    // Bird
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.max(-0.5, Math.min(1.2, bird.vy*0.06)));
    ctx.shadowBlur=18; ctx.shadowColor='#facc15';
    ctx.fillStyle='#facc15';
    ctx.beginPath(); ctx.ellipse(0,0,bird.r,bird.r-3, 0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f97316';
    ctx.beginPath(); ctx.arc(6,-2,6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1e40af';
    ctx.beginPath(); ctx.arc(10,-4,3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(11,-5,1.5,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();

    // Score
    ctx.fillStyle='#fff'; ctx.font='bold 2rem Orbitron,monospace';
    ctx.textAlign='center';
    ctx.shadowBlur=12; ctx.shadowColor='#facc15';
    ctx.fillText(score, W/2, 50); ctx.shadowBlur=0;

    if (!started) {
      ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='1rem Inter,sans-serif';
      ctx.fillText('Tap / Space to start',W/2,H/2+60);
    }
  }

  function update() {
    if (!started || paused || !running) return;
    bird.vy += GRAV; bird.y += bird.vy;
    frameN++;
    if (frameN%90===0) addPipe();

    pipes.forEach(p=>{ p.x -= PIPE_SPEED; });
    pipes = pipes.filter(p=>p.x+PIPE_W>0);

    // Collision
    if (bird.y+bird.r>H-40 || bird.y-bird.r<0) {
      endGame(); return;
    }
    pipes.forEach(p=>{
      if (bird.x+bird.r>p.x && bird.x-bird.r<p.x+PIPE_W) {
        if (bird.y-bird.r<p.top || bird.y+bird.r>p.top+GAP) { endGame(); return; }
      }
      // Score gate
      if (!p.passed && p.x+PIPE_W<bird.x) {
        p.passed=true; score++; Audio.eat(); MainApp.updateScore(score);
      }
    });
  }

  function endGame() {
    running=false; Audio.lose();
    Storage.setHigh('flappy',score);
    MainApp.gameOver('flappy',score,`You passed ${score} pipes!`,false);
  }

  function loop() {
    if (!running) return;
    update(); draw();
    raf = requestAnimationFrame(loop);
  }

  function initCanvas() {
    canvas=document.createElement('canvas');
    canvas.width=W; canvas.height=H;
    canvas.style.maxWidth='100%';
    ctx=canvas.getContext('2d');
    canvas.addEventListener('click', flap);
    canvas.addEventListener('touchstart', e=>{ e.preventDefault(); flap(); }, {passive:false});
  }

  document.addEventListener('keydown', e=>{
    if ((e.key===' '||e.key==='ArrowUp') && document.getElementById('view-game')?.classList.contains('active')) {
      e.preventDefault(); flap();
    }
  });

  function mount(container) {
    stop(); reset(); running=true;
    if (!canvas) initCanvas();
    container.appendChild(canvas);
    loop();
  }
  function pause()   { paused=!paused; if(!paused) loop(); }
  function restart() { mount(canvas.parentElement); }
  function stop()    { running=false; cancelAnimationFrame(raf); }

  return { id:'flappy', mount, pause, restart, stop };
})();
