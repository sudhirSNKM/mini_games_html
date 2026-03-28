/* ── SPACE SHOOTER – Player vs Aliens ── */
const ShooterGame = (() => {
  let canvas, ctx, raf, paused=false, running=false;
  const W=500, H=550;
  const PLAYER_SPD=5, BULLET_SPD=9, ENEMY_ROWS=4, ENEMY_COLS=8;
  let player, bullets, enemies, enemyBullets, score, lives, wave, frameN, enemyDir, enemyDropping;

  function initWave() {
    enemies=[];
    const ew=40, eh=30, gapX=12, gapY=10;
    const startX=(W-(ENEMY_COLS*(ew+gapX)))/2;
    for(let r=0;r<ENEMY_ROWS;r++) for(let c=0;c<ENEMY_COLS;c++) {
      enemies.push({ x:startX+c*(ew+gapX), y:50+r*(eh+gapY), w:ew, h:eh,
        emoji:['👾','👽','🛸','🤖'][r], hp:1, shootCd:0 });
    }
    enemyDir=1; enemyDropping=false;
  }

  function init() {
    player={ x:W/2-22, y:H-70, w:44, h:40, cd:0 };
    bullets=[]; enemyBullets=[]; score=0; lives=3; wave=1; frameN=0;
    initWave();
  }

  const keys={};
  document.addEventListener('keydown', e=>{ keys[e.key]=true; });
  document.addEventListener('keyup',   e=>{ keys[e.key]=false; });

  function drawPlayer() {
    ctx.shadowBlur=20; ctx.shadowColor='#00f5ff';
    // Ship body
    ctx.fillStyle='#00f5ff';
    ctx.beginPath();
    ctx.moveTo(player.x+player.w/2, player.y);
    ctx.lineTo(player.x+player.w, player.y+player.h);
    ctx.lineTo(player.x, player.y+player.h);
    ctx.closePath(); ctx.fill();
    // Cockpit
    ctx.fillStyle='#0ea5e9';
    ctx.beginPath();
    ctx.ellipse(player.x+player.w/2, player.y+player.h/2, 10,8,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
  }

  function shoot() {
    if (player.cd > 0) return;
    bullets.push({ x:player.x+player.w/2-2, y:player.y, w:4, h:14 });
    player.cd=12; Audio.shoot();
  }

  function drawBullet(b, color) {
    ctx.shadowBlur=10; ctx.shadowColor=color;
    ctx.fillStyle=color;
    ctx.beginPath(); ctx.roundRect(b.x,b.y,b.w,b.h,3); ctx.fill();
    ctx.shadowBlur=0;
  }

  function update() {
    if (paused||!running) return;
    frameN++;

    // Player move
    if ((keys['ArrowLeft']||keys['a']) && player.x>0) player.x-=PLAYER_SPD;
    if ((keys['ArrowRight']||keys['d']) && player.x+player.w<W) player.x+=PLAYER_SPD;
    if ((keys[' ']||keys['ArrowUp'])) shoot();
    if (player.cd>0) player.cd--;

    // Bullets
    bullets.forEach(b=>b.y-=BULLET_SPD);
    bullets=bullets.filter(b=>b.y>-b.h);

    // Enemy movement
    let hitEdge=false;
    enemies.forEach(e=>{
      e.x += enemyDir*(1.2+wave*0.2);
      if(e.x<=0||e.x+e.w>=W) hitEdge=true;
    });
    if(hitEdge) { enemyDir*=-1; enemies.forEach(e=>e.y+=20); }

    // Random enemy shoot
    if(frameN%55===0 && enemies.length) {
      const shooter=enemies[Math.floor(Math.random()*enemies.length)];
      enemyBullets.push({x:shooter.x+shooter.w/2-3,y:shooter.y+shooter.h,w:6,h:14});
    }
    enemyBullets.forEach(b=>b.y+=4);
    enemyBullets=enemyBullets.filter(b=>b.y<H);

    // Bullet-enemy collision
    bullets.forEach(b=>{
      enemies=enemies.filter(e=>{
        if(b.x<e.x+e.w&&b.x+b.w>e.x&&b.y<e.y+e.h&&b.y+b.h>e.y){
          score+=10; MainApp.updateScore(score); b.dead=true; Audio.boom(); return false;
        }
        return true;
      });
    });
    bullets=bullets.filter(b=>!b.dead);

    // Enemy bullet – player
    enemyBullets=enemyBullets.filter(b=>{
      if(b.x<player.x+player.w && b.x+b.w>player.x && b.y<player.y+player.h && b.y+b.h>player.y){
        lives--; Audio.lose();
        if(lives<=0){ running=false; Storage.setHigh('shooter',score); MainApp.gameOver('shooter',score,`Wave ${wave}`,false); }
        return false;
      }
      return true;
    });

    // Wave clear
    if(enemies.length===0) {
      wave++; score+=100; Audio.win();
      bullets=[]; enemyBullets=[]; initWave();
    }

    // Enemies reach bottom
    if(enemies.some(e=>e.y+e.h>=player.y)){
      running=false; Storage.setHigh('shooter',score); MainApp.gameOver('shooter',score,'Aliens invaded!',false);
    }
  }

  function draw() {
    // Space bg
    ctx.fillStyle='#02040d'; ctx.fillRect(0,0,W,H);
    // Stars
    ctx.fillStyle='rgba(255,255,255,.6)';
    for(let i=0;i<50;i++){
      const sx=(i*137+frameN)%W, sy=(i*97+frameN/2)%H;
      ctx.beginPath(); ctx.arc(sx,sy,0.8,0,Math.PI*2); ctx.fill();
    }

    // Enemies
    enemies.forEach(e=>{
      ctx.font=`${e.h*0.8}px serif`;
      ctx.textAlign='center';
      ctx.shadowBlur=10; ctx.shadowColor='#f43f5e';
      ctx.fillText(e.emoji, e.x+e.w/2, e.y+e.h*0.9);
      ctx.shadowBlur=0;
    });

    bullets.forEach(b=>drawBullet(b,'#00f5ff'));
    enemyBullets.forEach(b=>drawBullet(b,'#f43f5e'));
    drawPlayer();

    // HUD
    ctx.fillStyle='rgba(0,245,255,.8)'; ctx.font='14px Orbitron,monospace'; ctx.textAlign='left';
    ctx.fillText(`Score:${score}  Wave:${wave}  Lives:${'❤️'.repeat(lives)}`, 10, H-12);
  }

  function loop() { if(!running) return; update(); draw(); raf=requestAnimationFrame(loop); }

  function initCanvas() {
    canvas=document.createElement('canvas');
    canvas.width=W; canvas.height=H;
    canvas.style.maxWidth='100%';
    ctx=canvas.getContext('2d');
    canvas.addEventListener('touchmove', e=>{
      e.preventDefault();
      const rect=canvas.getBoundingClientRect();
      player.x=(e.touches[0].clientX-rect.left)*(W/rect.width)-player.w/2;
    }, {passive:false});
    canvas.addEventListener('touchstart', ()=>shoot());
  }

  function mount(container) {
    stop(); init(); running=true;
    if(!canvas) initCanvas();
    container.appendChild(canvas);
    loop();
  }
  function pause()   { paused=!paused; if(!paused) loop(); }
  function restart() { mount(canvas.parentElement); }
  function stop()    { running=false; cancelAnimationFrame(raf); }

  return { id:'shooter', mount, pause, restart, stop };
})();
