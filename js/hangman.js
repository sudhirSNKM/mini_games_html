/* ── HANGMAN – Word Guessing Game ── */
const HangmanGame = (() => {
  const WORDS = [
    { word: 'javascript', hint: 'Programming language of the web' },
    { word: 'algorithm',  hint: 'Step-by-step problem-solving procedure' },
    { word: 'recursion',  hint: 'A function that calls itself' },
    { word: 'canvas',     hint: 'HTML element for 2D drawing' },
    { word: 'database',   hint: 'Organized collection of data' },
    { word: 'framework',  hint: 'Pre-written code structure' },
    { word: 'variable',   hint: 'Named storage for data' },
    { word: 'array',      hint: 'Ordered list of elements' },
    { word: 'function',   hint: 'Reusable block of code' },
    { word: 'component',  hint: 'Reusable UI building block' },
    { word: 'debugging',  hint: 'Finding and fixing bugs' },
    { word: 'asynchronous', hint: 'Non-blocking execution' },
    { word: 'encryption', hint: 'Encoding data for security' },
    { word: 'responsive', hint: 'Adapts to different screens' },
    { word: 'bandwidth',  hint: 'Data transfer capacity' },
    { word: 'keyboard',   hint: 'Input device with keys' },
    { word: 'gradient',   hint: 'Smooth color transition' },
    { word: 'animation',  hint: 'Moving images over time' },
    { word: 'browser',    hint: 'App to navigate the web' },
    { word: 'compiler',   hint: 'Translates code to machine language' },
    { word: 'infinity',   hint: 'Unlimited; endless' },
    { word: 'pixel',      hint: 'Smallest unit of a digital image' },
    { word: 'syntax',     hint: 'Rules of a programming language' },
    { word: 'boolean',    hint: 'True or false value' },
    { word: 'fibonacci',  hint: 'Each number is sum of two before' },
  ];

  let word, hint, guessed, wrong, maxWrong, score, running = false;

  const HANG_PARTS = [
    // Gallows
    ctx => { ctx.strokeStyle='#64748b'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(20,220); ctx.lineTo(180,220); ctx.stroke();       // base
      ctx.beginPath(); ctx.moveTo(60,220); ctx.lineTo(60,20);   ctx.stroke();       // pole
      ctx.beginPath(); ctx.moveTo(60,20);  ctx.lineTo(140,20);  ctx.stroke();       // top
      ctx.beginPath(); ctx.moveTo(140,20); ctx.lineTo(140,50);  ctx.stroke(); },    // rope
    // Head
    ctx => { ctx.strokeStyle='#ff2d6b'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(140,68,18,0,Math.PI*2); ctx.stroke(); },
    // Body
    ctx => { ctx.beginPath(); ctx.moveTo(140,86); ctx.lineTo(140,150); ctx.stroke(); },
    // Left arm
    ctx => { ctx.beginPath(); ctx.moveTo(140,100); ctx.lineTo(110,130); ctx.stroke(); },
    // Right arm
    ctx => { ctx.beginPath(); ctx.moveTo(140,100); ctx.lineTo(170,130); ctx.stroke(); },
    // Left leg
    ctx => { ctx.beginPath(); ctx.moveTo(140,150); ctx.lineTo(110,190); ctx.stroke(); },
    // Right leg
    ctx => { ctx.beginPath(); ctx.moveTo(140,150); ctx.lineTo(170,190); ctx.stroke(); },
  ];

  function init() {
    const entry = WORDS[Math.floor(Math.random() * WORDS.length)];
    word = entry.word; hint = entry.hint;
    guessed = new Set(); wrong = 0; maxWrong = 6; score = 0; running = true;
  }

  function drawGallows(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#080b14'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    HANG_PARTS[0](ctx); // always draw gallows
    for (let i = 1; i <= wrong; i++) HANG_PARTS[i]?.(ctx);
    // Eyes on head (alive vs dead)
    if (wrong >= 1) {
      ctx.fillStyle = wrong >= maxWrong ? '#ff2d6b' : '#00f5ff';
      ctx.beginPath(); ctx.arc(135, 65, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(145, 65, 3, 0, Math.PI*2); ctx.fill();
      if (wrong >= maxWrong) {
        // X eyes
        ctx.strokeStyle = '#ff2d6b'; ctx.lineWidth = 2;
        [[133,63],[137,67]].forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y+4);ctx.moveTo(x+4,y);ctx.lineTo(x,y+4);ctx.stroke();});
        [[143,63],[147,67]].forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y+4);ctx.moveTo(x+4,y);ctx.lineTo(x,y+4);ctx.stroke();});
      }
    }
  }

  function render() {
    const canvas  = document.getElementById('hang-canvas');
    const wordEl  = document.getElementById('hang-word');
    const hintEl  = document.getElementById('hang-hint');
    const wrongEl = document.getElementById('hang-wrong');
    const kbEl    = document.getElementById('hang-keyboard');
    if (!canvas) return;

    drawGallows(canvas);

    // Word display
    wordEl.innerHTML = word.split('').map(l =>
      `<span class="hang-letter ${guessed.has(l) ? 'revealed' : ''}">${guessed.has(l) ? l : '_'}</span>`
    ).join('');

    hintEl.textContent = `💡 Hint: ${hint}`;
    wrongEl.textContent = `Wrong: ${wrong} / ${maxWrong}`;

    // Keyboard
    kbEl.innerHTML = '';
    'abcdefghijklmnopqrstuvwxyz'.split('').forEach(l => {
      const btn = document.createElement('button');
      btn.textContent = l; btn.className = 'hang-key';
      const used = guessed.has(l);
      const correct = used && word.includes(l);
      const miss = used && !word.includes(l);
      if (correct) btn.classList.add('correct');
      if (miss)    btn.classList.add('wrong');
      if (used)    btn.disabled = true;
      btn.addEventListener('click', () => guess(l));
      kbEl.appendChild(btn);
    });

    MainApp.updateScore(score);
  }

  function guess(letter) {
    if (!running || guessed.has(letter)) return;
    guessed.add(letter); Audio.click();

    if (!word.includes(letter)) {
      wrong++; Audio.lose();
      if (wrong >= maxWrong) {
        running = false; render();
        Storage.setHigh('hangman', score);
        setTimeout(() => MainApp.gameOver('hangman', score, `Word was: "${word}"`, false), 400);
        return;
      }
    } else {
      const pts = 10 * (maxWrong - wrong + 1);
      score += pts; Audio.eat();
    }

    const won = word.split('').every(l => guessed.has(l));
    if (won) {
      score += 50;
      running = false; render(); Audio.win();
      Storage.setHigh('hangman', score);
      setTimeout(() => MainApp.gameOver('hangman', score, `You guessed "${word}"! 🎉`, true), 400);
      return;
    }
    render();
  }

  document.addEventListener('keydown', e => {
    if (!running || !document.getElementById('hang-keyboard')) return;
    const l = e.key.toLowerCase();
    if (/^[a-z]$/.test(l)) guess(l);
  });

  function mount(container) {
    running = false;
    container.innerHTML = `
      <div id="game-hangman">
        <canvas id="hang-canvas" width="200" height="230"></canvas>
        <div id="hang-hint" class="hang-hint"></div>
        <div id="hang-word"  class="hang-word"></div>
        <div id="hang-wrong" class="hang-wrong"></div>
        <div id="hang-keyboard" class="hang-keyboard"></div>
        <p class="hang-tip">Type on keyboard or click letters</p>
      </div>
      <style>
        #game-hangman{display:flex;flex-direction:column;align-items:center;gap:14px;max-width:460px}
        #hang-canvas{border-radius:10px;border:1px solid var(--border)}
        .hang-hint{color:var(--text-dim);font-size:.82rem;font-style:italic}
        .hang-word{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
        .hang-letter{font-family:'Orbitron',monospace;font-size:1.5rem;font-weight:700;
          width:34px;height:44px;border-bottom:3px solid rgba(0,245,255,.4);
          display:flex;align-items:center;justify-content:center;color:var(--text-dim);transition:all .2s}
        .hang-letter.revealed{color:var(--accent);border-bottom-color:var(--accent);text-shadow:0 0 10px var(--accent)}
        .hang-wrong{font-family:'Orbitron',monospace;font-size:.8rem;color:var(--neon-pink)}
        .hang-keyboard{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;max-width:380px}
        .hang-key{width:34px;height:34px;background:rgba(255,255,255,.07);border:1px solid var(--border);
          border-radius:6px;color:var(--text);font-size:.78rem;font-family:'Orbitron',monospace;
          cursor:pointer;transition:all .15s;text-transform:uppercase}
        .hang-key:hover:not(:disabled){background:rgba(0,245,255,.15);border-color:var(--accent);transform:scale(1.08)}
        .hang-key.correct{background:rgba(57,255,20,.2);border-color:var(--neon-green);color:var(--neon-green)}
        .hang-key.wrong{background:rgba(255,45,107,.15);border-color:var(--neon-pink);color:var(--neon-pink)}
        .hang-key:disabled{opacity:.6;cursor:default;transform:none!important}
        .hang-tip{color:var(--text-dim);font-size:.72rem}
      </style>`;
    init(); render();
  }

  function pause() {}
  function restart() { init(); render(); }
  function stop() { running = false; }

  return { id: 'hangman', mount, pause, restart, stop };
})();
