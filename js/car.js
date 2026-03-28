/* ── CAR DODGER – Top-down Infinite Runner ── */
const CarGame = (() => {
  let canvas, ctx, raf, paused=false, running=false;
  const W=360, H=560;
  let player, enemies, score, speed, frameN, laneW, lanes;

  const PLAYER_W=38, PLAYER_H=64, ENEMY_W=38, ENEMY_H=60;

  function init() {
    laneW = W/3;
    lanes = [laneW/2, laneW+laneW/2, laneW*2+laneW/2];
    player = { x:lanes[1]-PLAYER_W/2, y:H-100, lane:1 };
    enemies=[]; score=0; speed=3; frameN=0;
  }

  function drawRoad() {
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(0,0,W,H);
    // Lane stripes
    for(let i=0;i<3;i++) {
      ctx.fillStyle='rgba(255,255,100,.08)'; ctx.fillRect(i*laneW,0,laneW,H);
    }
    // Moving dashes
    ctx.setLineDash([30,22]);
    ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=2;
    for(let l=1;l<3;l++) {
      ctx.beginPath();
      ctx.moveTo(l*laneW,(-frameN*speed)%52);
      ctx.lineTo(l*laneW,H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawCar(x,y,color,color2,shadow) {
    ctx.shadowBlur=shadow?18:0; ctx.shadowColor=color;
    // Body
    const bg=ctx.createLinearGradient(x,y,x+PLAYER_W,y+PLAYER_H);
    bg.addColorStop(0,color); bg.addColorStop(1,color2);
    ctx.fillStyle=bg;
    ctx.beginPath(); ctx.roundRect(x,y,PLAYER_W,PLAYER_H,8); ctx.fill();
    // Windshield
    ctx.fillStyle='rgba(150,220,255,.35)';
    ctx.beginPath(); ctx.roundRect(x+5,y+8,PLAYER_W-10,14,4); ctx.fill();
    // Wheels
    ctx.fillStyle='#111';
    [[x-4,y+8],[x+PLAYER_W-4,y+8],[x-4,y+PLAYER_H-20],[x+PLAYER_W-4,y+PLAYER_H-20]].forEach(([wx,wy])=>{
      ctx.beginPath(); ctx.roundRect(wx,wy,8,14,3); ctx.fill();
    });
    // Headlights
    ctx.fillStyle=shadow?'#ffffaa':'#666';
    ctx.shadowBlur=shadow?12:0; ctx.shadowColor='#ffffaa';
    [[x+6,y+PLAYER_H-10],[x+PLAYER_W-14,y+PLAYER_H-10]].forEach(([lx,ly])=>{
      ctx.beginPath(); ctx.roundRect(lx,ly,8,6,2); ctx.fill();
    });
    ctx.shadowBlur=0;
  }

  function spawnEnemy() {
    const lane=Math.floor(Math.random()*3);
    const colors=[['#ef4444','#7f1d1d'],['#f97316','#7c2d12'],['#a855f7','#581c87'],['#06b6d4','#164e63']];
    const c=colors[Math.floor(Math.random()*colors.length)];
    enemies.push({ x:lanes[lane]-ENEMY_W/2, y:-ENEMY_H, lane, color:c[0], color2:c[1] });
  }

  function rect(a,aw,ah,b,bw,bh) {
    return a.x<b.x+bw && a.x+aw>b.x && a.y<b.y+bh && a.y+ah>b.y;
  }

  function update() {
    if (paused||!running) return;
    frameN++;
    score = Math.floor(frameN/6);
    MainApp.updateScore(score);
    speed = 3 + score/40;

    if (frameN%70===0) spawnEnemy();

    enemies.forEach(e=>{ e.y+=speed; });
    enemies=enemies.filter(e=>e.y<H+ENEMY_H);

    enemies.forEach(e=>{
      if (rect({x:player.x+4,y:player.y+4},PLAYER_W-8,PLAYER_H-8,{x:e.x+4,y:e.y+4},ENEMY_W-8,ENEMY_H-8)) {
        running=false; Audio.boom();
        Storage.setHigh('car',score);
        MainApp.gameOver('car',score,`Survived ${score}m`,false);
      }
    });
  }

  function draw() {
    drawRoad();
    enemies.forEach(e=>drawCar(e.x,e.y,e.color,e.color2,false));
    drawCar(player.x,player.y,'#00f5ff','#0080ff',true);
    // HUD
    ctx.fillStyle='rgba(0,245,255,.8)'; ctx.font='bold 14px Orbitron,monospace';
    ctx.textAlign='left'; ctx.fillText(`${score}m`, 12, 28);
    ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='12px Inter,sans-serif';
    ctx.fillText(`Speed: ${speed.toFixed(1)}x`,12,46);
  }

  function movePlayer(dir) {
    player.lane = Math.max(0, Math.min(2, player.lane+dir));
    player.x = lanes[player.lane]-PLAYER_W/2;
  }

  function loop() {
    if (!running) return;
    update(); draw();
    raf=requestAnimationFrame(loop);
  }

  function initCanvas() {
    canvas=document.createElement('canvas');
    canvas.width=W; canvas.height=H;
    canvas.style.maxWidth='100%';
    ctx=canvas.getContext('2d');
    canvas.addEventListener('touchstart', e=>{
      const rect=canvas.getBoundingClientRect();
      const tx=e.touches[0].clientX-rect.left;
      if(tx<rect.width/2) movePlayer(-1); else movePlayer(1);
    });
  }

  document.addEventListener('keydown', e=>{
    if(!document.getElementById('view-game')?.classList.contains('active')||!running) return;
    if(e.key==='ArrowLeft'||e.key==='a') { e.preventDefault(); movePlayer(-1); }
    if(e.key==='ArrowRight'||e.key==='d') { e.preventDefault(); movePlayer(1); }
  });

  function mount(container) {
    stop(); init(); running=true;
    if (!canvas) initCanvas();
    container.appendChild(canvas);
    loop();
  }
  function pause()   { paused=!paused; if(!paused) loop(); }
  function restart() { mount(canvas.parentElement); }
  function stop()    { running=false; cancelAnimationFrame(raf); }

  return { id:'car', mount, pause, restart, stop };
})();
