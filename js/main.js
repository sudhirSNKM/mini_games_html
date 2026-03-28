/* ───────────────────────────────────────────────
   main.js – NeonArcade Hub Controller
   ─────────────────────────────────────────────── */

const GAMES = {
  pong:        PongGame,
  snake:       SnakeGame,
  breakout:    BreakoutGame,
  g2048:       G2048Game,
  sliding:     SlidingGame,
  memory:      MemoryGame,
  flappy:      FlappyGame,
  car:         CarGame,
  shooter:     ShooterGame,
  tictactoe:   TictactoeGame,
  quiz:        QuizGame,
  tetris:      TetrisGame,
  minesweeper: MinesweeperGame,
  whack:       WhackGame,
  hangman:     HangmanGame,
};

// ── State ──────────────────────────────────────
let currentGame = null;
let isPaused    = false;
let musicEnabled = true;

// ── DOM Refs ───────────────────────────────────
const viewHome    = document.getElementById('view-home');
const viewGame    = document.getElementById('view-game');
const gameCont    = document.getElementById('game-container');
const titleBar    = document.getElementById('game-title-bar');
const liveScore   = document.getElementById('live-score');
const pauseBtn    = document.getElementById('pause-btn');
const restartBtn  = document.getElementById('restart-btn');
const backBtn     = document.getElementById('back-btn');
const lbBtn       = document.getElementById('leaderboard-btn');
const lbModal     = document.getElementById('leaderboard-modal');
const lbContent   = document.getElementById('leaderboard-content');
const closeLb     = document.getElementById('close-lb');
const goOverlay   = document.getElementById('game-over-overlay');
const goTitle     = document.getElementById('gameover-title');
const goMsg       = document.getElementById('gameover-msg');
const goEmoji     = document.getElementById('gameover-emoji');
const goRestart   = document.getElementById('go-restart');
const goHome      = document.getElementById('go-home');
const musicToggle = document.getElementById('music-toggle');
const hamburger   = document.getElementById('hamburger');
const sidebar     = document.getElementById('sidebar');
const toast       = document.getElementById('toast');

// ── Game Meta ─────────────────────────────────
const META = {
  pong:        { name:'Pong',            icon:'🏓' },
  snake:       { name:'Snake',           icon:'🐍' },
  breakout:    { name:'Breakout',        icon:'🧱' },
  g2048:       { name:'2048',            icon:'🔢' },
  sliding:     { name:'Sliding Puzzle',  icon:'🧩' },
  memory:      { name:'Memory Cards',    icon:'🃏' },
  flappy:      { name:'Flappy Bird',     icon:'🐦' },
  car:         { name:'Car Dodger',      icon:'🚗' },
  shooter:     { name:'Space Shooter',   icon:'🔫' },
  tictactoe:   { name:'Tic Tac Toe',     icon:'❌' },
  quiz:        { name:'Quiz Game',       icon:'🧠' },
  tetris:      { name:'Tetris',          icon:'🟦' },
  minesweeper: { name:'Minesweeper',     icon:'💣' },
  whack:       { name:'Whack-a-Mole',    icon:'🐹' },
  hangman:     { name:'Hangman',         icon:'🪢' },
};

// ── Navigation ─────────────────────────────────
function showHome() {
  stopCurrentGame();
  viewHome.classList.add('active');
  viewGame.classList.remove('active');
  setNavActive('home');
  refreshHomeBadges();
}

function launchGame(id) {
  if (!GAMES[id]) return;
  stopCurrentGame();
  currentGame = GAMES[id];
  isPaused = false;

  viewHome.classList.remove('active');
  viewGame.classList.add('active');
  gameCont.innerHTML = '';

  const meta = META[id] || { name: id, icon:'🎮' };
  titleBar.textContent = `${meta.icon} ${meta.name}`;
  liveScore.textContent = '0';
  pauseBtn.textContent = '⏸ Pause';
  isPaused = false;
  goOverlay.classList.add('hidden');

  setNavActive(id);
  closeSidebar();

  // Mount the game
  currentGame.mount(gameCont);
  Audio.click();
}

function stopCurrentGame() {
  if (currentGame) { currentGame.stop(); currentGame = null; }
}

// ── Score / Game-Over Hooks (called by games) ──
const MainApp = {
  updateScore(n) {
    liveScore.textContent = n;
  },
  gameOver(gameId, score, message, won) {
    stopCurrentGame();
    goTitle.textContent  = won ? '🏆 Victory!' : 'Game Over';
    goEmoji.textContent  = won ? '🏆' : '💀';
    goMsg.textContent    = message;
    goOverlay.classList.remove('hidden');
    goOverlay.dataset.game = gameId;

    Storage.setHigh(gameId, score);
    refreshHomeBadges();
    won ? Audio.win() : Audio.lose();
    showToast(won ? `New high: ${score}!` : `Score: ${score}`);
  }
};

// ── Buttons ────────────────────────────────────
pauseBtn.addEventListener('click', () => {
  if (!currentGame) return;
  isPaused = !isPaused;
  currentGame.pause();
  pauseBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
  Audio.click();
});

restartBtn.addEventListener('click', () => {
  if (!currentGame) return;
  isPaused = false;
  pauseBtn.textContent = '⏸ Pause';
  currentGame.restart();
  liveScore.textContent = '0';
  goOverlay.classList.add('hidden');
  Audio.click();
});

backBtn.addEventListener('click', () => { Audio.click(); showHome(); });

goRestart.addEventListener('click', () => {
  const id = goOverlay.dataset.game;
  goOverlay.classList.add('hidden');
  if (id) launchGame(id);
});

goHome.addEventListener('click', () => {
  goOverlay.classList.add('hidden');
  showHome();
});

// ── Nav items ──────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const cat  = btn.dataset.category;
    const game = btn.dataset.game;
    if (cat === 'home') { showHome(); Audio.click(); }
    else if (game)      { launchGame(game); }
  });
});

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => launchGame(card.dataset.game));
});

// ── Leaderboard ────────────────────────────────
lbBtn.addEventListener('click', () => {
  const scores = Storage.getAllHighScores();
  const entries = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  if (!entries.length) {
    lbContent.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px">No scores yet – play some games!</p>';
  } else {
    const medals = ['🥇','🥈','🥉'];
    lbContent.innerHTML = entries.map(([game,score],i) => `
      <div class="lb-row">
        <span class="lb-rank">${medals[i]||`#${i+1}`}</span>
        <span class="lb-name">${META[game]?.icon||'🎮'} ${META[game]?.name||game}</span>
        <span class="lb-score">${score}</span>
      </div>`).join('');
  }
  lbModal.classList.remove('hidden');
  Audio.click();
});

closeLb.addEventListener('click', () => { lbModal.classList.add('hidden'); Audio.click(); });
lbModal.addEventListener('click', e => { if (e.target===lbModal) lbModal.classList.add('hidden'); });
goOverlay.addEventListener('click', e => { if (e.target===goOverlay) goOverlay.classList.add('hidden'); });

// ── Music toggle ───────────────────────────────
musicToggle.addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  musicToggle.textContent = musicEnabled ? '🎵' : '🔇';
  showToast(musicEnabled ? 'Sound ON' : 'Sound OFF');
});

// ── Mobile sidebar ─────────────────────────────
hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  hamburger.textContent = sidebar.classList.contains('open') ? '✕' : '☰';
});

function closeSidebar() {
  sidebar.classList.remove('open');
  hamburger.textContent = '☰';
}

// Close sidebar on outside tap
document.addEventListener('click', e => {
  if (window.innerWidth<=768 && sidebar.classList.contains('open')
      && !sidebar.contains(e.target) && e.target!==hamburger) closeSidebar();
});

// ── Helpers ────────────────────────────────────
function setNavActive(id) {
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active',
      (id==='home' && b.dataset.category==='home') ||
      b.dataset.game===id
    );
  });
}

function refreshHomeBadges() {
  const scores = Storage.getAllHighScores();
  Object.entries(scores).forEach(([game,score]) => {
    const el = document.getElementById(`hs-${game}`);
    if (el) el.textContent = score;
  });
}

function showToast(msg, dur=2200) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), dur);
}

// ── Keyboard shortcuts ─────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!goOverlay.classList.contains('hidden')) { goOverlay.classList.add('hidden'); return; }
    if (!lbModal.classList.contains('hidden'))   { lbModal.classList.add('hidden');  return; }
    if (currentGame) showHome();
  }
  if (e.key === 'p' || e.key === 'P') pauseBtn.click();
});

// ── Boot ───────────────────────────────────────
(function boot() {
  refreshHomeBadges();
  showHome();
})();
