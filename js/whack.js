/* ── WHACK-A-MOLE ── */
const WhackGame = (() => {
  let running = false, timer, spawnTimer, score, misses, timeLeft, level, moles;
  const HOLES = 9, TOTAL_TIME = 60;

  function init() {
    score = 0; misses = 0; timeLeft = TOTAL_TIME; level = 1;
    moles = Array(HOLES).fill(false);
    running = true;
  }

  function render() {
    const grid = document.getElementById('whack-grid');
    const hudEl = document.getElementById('whack-hud');
    const barEl = document.getElementById('whack-bar');
    if (!grid) return;

    moles.forEach((up, i) => {
      const hole = document.getElementById(`hole-${i}`);
      if (!hole) return;
      hole.className = `whack-hole ${up ? 'up' : ''}`;
      hole.querySelector('.mole').textContent = up ? '🐹' : '';
    });

    if (hudEl) hudEl.textContent = `Score: ${score}  Misses: ${misses}  ⏱ ${timeLeft}s`;
    if (barEl) barEl.style.width = `${(timeLeft / TOTAL_TIME) * 100}%`;
    MainApp.updateScore(score);
  }

  function popMole(idx) {
    moles[idx] = true; render();
    // Auto-hide after duration
    const dur = Math.max(500, 1400 - level * 80);
    setTimeout(() => {
      if (moles[idx]) { moles[idx] = false; render(); }
    }, dur);
  }

  function whack(idx) {
    if (!running || !moles[idx]) return;
    moles[idx] = false;
    score += 10 * level; Audio.eat(); render();
    // Visual feedback
    const hole = document.getElementById(`hole-${idx}`);
    if (hole) {
      hole.classList.add('whacked');
      setTimeout(() => hole.classList.remove('whacked'), 300);
    }
  }

  function startSpawn() {
    clearInterval(spawnTimer);
    const interval = Math.max(400, 900 - level * 60);
    spawnTimer = setInterval(() => {
      if (!running) return;
      // Pick a hole that isn't already up
      const avail = moles.map((v, i) => v ? -1 : i).filter(i => i >= 0);
      if (avail.length) {
        const idx = avail[Math.floor(Math.random() * avail.length)];
        popMole(idx);
      }
    }, interval);
  }

  function missClick(e) {
    // Only register a miss if clicking the hole background (not the mole)
    if (e.target.classList.contains('whack-hole') || e.target.classList.contains('whack-hole-inner')) {
      misses++; Audio.lose(); render();
    }
  }

  function mount(container) {
    running = false; clearInterval(timer); clearInterval(spawnTimer);
    container.innerHTML = `
      <div id="game-whack">
        <div class="whack-timer-bar-wrap"><div class="whack-timer-bar" id="whack-bar"></div></div>
        <div id="whack-hud" class="whack-hud"></div>
        <div id="whack-grid" class="whack-grid">
          ${Array.from({ length: HOLES }, (_, i) => `
            <div class="whack-hole" id="hole-${i}">
              <div class="whack-hole-inner">
                <span class="mole"></span>
              </div>
            </div>`).join('')}
        </div>
        <p class="whack-hint">Click the mole before it hides!</p>
      </div>
      <style>
        #game-whack{display:flex;flex-direction:column;align-items:center;gap:16px}
        .whack-timer-bar-wrap{width:320px;height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden}
        .whack-timer-bar{height:100%;background:linear-gradient(90deg,var(--accent),var(--neon-pink));width:100%;transition:width 1s linear}
        .whack-hud{font-family:'Orbitron',monospace;font-size:.85rem;color:var(--accent)}
        .whack-grid{display:grid;grid-template-columns:repeat(3,110px);gap:14px}
        .whack-hole{width:110px;height:110px;background:radial-gradient(ellipse at bottom,#2d1a0e,#1a0e07);border-radius:50%;border:3px solid #5a3820;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;position:relative;transition:box-shadow .15s}
        .whack-hole:hover{box-shadow:0 0 12px rgba(249,115,22,.3)}
        .whack-hole-inner{width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px}
        .mole{font-size:2.4rem;display:block;transform:translateY(120%);transition:transform .18s cubic-bezier(.34,1.56,.64,1)}
        .whack-hole.up .mole{transform:translateY(0%)}
        .whack-hole.up{box-shadow:0 0 18px rgba(249,115,22,.5);border-color:#f97316}
        .whack-hole.whacked{background:radial-gradient(ellipse at bottom,#3d260d,#2a1507);animation:whackPop .3s ease}
        @keyframes whackPop{0%{transform:scale(1)}50%{transform:scale(1.12)}100%{transform:scale(1)}}
        .whack-hint{color:var(--text-dim);font-size:.76rem}
      </style>`;

    document.querySelectorAll('.whack-hole').forEach((hole, i) => {
      hole.addEventListener('click', () => whack(i));
    });

    init(); render();
    // Countdown
    timer = setInterval(() => {
      timeLeft--;
      level = Math.floor((TOTAL_TIME - timeLeft) / 12) + 1;
      if (level > 7) level = 7;
      startSpawn();
      render();
      if (timeLeft <= 0) {
        running = false; clearInterval(timer); clearInterval(spawnTimer);
        moles.fill(false); render();
        Storage.setHigh('whack', score);
        Audio[score >= 100 ? 'win' : 'lose']();
        setTimeout(() => MainApp.gameOver('whack', score, `${score} pts · ${misses} misses`, score >= 100), 300);
      }
    }, 1000);
    startSpawn();
  }

  function pause() {}
  function restart() { mount(document.getElementById('game-container')); }
  function stop() { running = false; clearInterval(timer); clearInterval(spawnTimer); }

  return { id: 'whack', mount, pause, restart, stop };
})();
