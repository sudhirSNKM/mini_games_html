/* ───────────────────────────────────────────────
   main.js – NeonArcade Hub Controller v2
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
  ludo:        LudoGame,
  connect4:    Connect4Game,
  dino:        DinoGame,
  sudoku:      SudokuGame,
  stacker:     StackerGame,
  wordle:      WordleGame,
  sequence:    SequenceGame,
  bubbles:     BubblesGame,
  hockey:      HockeyGame,
  flow:        FlowGame,
  defense:     DefenseGame,
  solitaire:   SolitaireGame,
  checkers:    CheckersGame,
  dots:        DotsGame,
  tiles:       TilesGame,
};

// ── State ──────────────────────────────────────
let currentGame   = null;
let isPaused      = false;
let musicEnabled  = true;
let currentGameId = null;
let activeRoomCode = null;

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

// Profile
const profileModal   = document.getElementById('profile-modal');
const profileBtn     = document.getElementById('profile-btn');
const profileNameInp = document.getElementById('profile-name-input');
const saveProfileBtn = document.getElementById('save-profile-btn');
const logoutProfileBtn= document.getElementById('logout-profile-btn');
const closeProfileBtn= document.getElementById('close-profile-btn');
const profileStatus  = document.getElementById('profile-status');
const avatarPicker   = document.getElementById('avatar-picker');
const selectedAvatarDisplay = document.getElementById('selected-avatar-display');
const userChip       = document.getElementById('user-chip');
const userNameSidebar= document.getElementById('user-name-sidebar');
const userAvatarSidebar = document.getElementById('user-avatar-sidebar');
const userBadgeSidebar= document.getElementById('user-badge-sidebar');

// Room
const roomModal      = document.getElementById('room-modal');
const roomCreateView = document.getElementById('room-create-view');
const roomCreatedView= document.getElementById('room-created-view');
const roomJoinView   = document.getElementById('room-join-view');
const roomCodeDisplay= document.getElementById('room-code-display');
const roomPlayersList= document.getElementById('room-players-list');
const roomCodeInput  = document.getElementById('room-code-input');
const roomJoinError  = document.getElementById('room-join-error');

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
  ludo:        { name:'Ludo',            icon:'🎲' },
  connect4:    { name:'Connect Four',    icon:'🔵' },
  dino:        { name:'Neon Rush',       icon:'🦖' },
  sudoku:      { name:'Neon Sudoku',     icon:'🔢' },
  stacker:     { name:'Neon Stacker',    icon:'🏗️' },
  wordle:      { name:'Neon Word',       icon:'🔤' },
  sequence:    { name:'Sequence',        icon:'🚦' },
  bubbles:     { name:'Bubble Pop',      icon:'🫧' },
  hockey:      { name:'Air Hockey',      icon:'🏒' },
  flow:        { name:'Neon Flow',       icon:'🌊' },
  defense:     { name:'Neon Defense',    icon:'🛡️' },
  solitaire:   { name:'Solitaire',       icon:'🃏' },
  checkers:    { name:'Checkers',        icon:'🏁' },
  dots:        { name:'Dots & Boxes',    icon:'⚬' },
  tiles:       { name:'Neon Tiles',      icon:'🎹' },
};

// Multiplayer-capable games
const MP_GAMES = ['ludo','tictactoe','memory','connect4','checkers','dots','hockey'];

// ── Navigation ─────────────────────────────────
function showHome() {
  stopCurrentGame();
  viewHome.classList.add('active');
  viewGame.classList.remove('active');
  setNavActive('home');
  refreshHomeBadges();
  updateHomeGreeting();
}

function launchGame(id) {
  if (!GAMES[id]) return;
  stopCurrentGame();
  currentGameId = id;
  currentGame = new GAMES[id]();
  isPaused = false;

  viewHome.classList.remove('active');
  viewGame.classList.add('active');
  gameCont.innerHTML = '';
  gameCont.className = 'animate-in';

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
  if (typeof Audio !== 'undefined') Audio.click();
}

function stopCurrentGame() {
  if (currentGame) { currentGame.stop(); currentGame = null; }
  currentGameId = null;
}

// ── Score / Game-Over Hooks (called by games) ──
const MainApp = {
  updateScore(n) {
    liveScore.textContent = n;
  },
  gameOver(gameId, score, message, won) {
    stopCurrentGame();
    const box = goOverlay.querySelector('.modal-box');
    goOverlay.classList.remove('hidden');
    goOverlay.classList.add('modal-animate');
    goTitle.textContent  = won ? '🏆 Victory!' : 'Game Over';
    goEmoji.textContent  = won ? '🏆' : '💀';
    goMsg.textContent    = message;
    
    if (won) showConfetti();
    
    goOverlay.dataset.game = gameId;

    Storage.setHigh(gameId, score);

    // Also add to per-player leaderboard
    const user = UserSystem.getCurrentUser();
    UserSystem.addLBEntry(gameId, score, user);

    refreshHomeBadges();
    if (typeof Audio !== 'undefined') { won ? Audio.win() : Audio.lose(); }
    showToast(won ? `🏆 New best: ${score}!` : `Score: ${score}`);
  }
};

// ── Buttons ────────────────────────────────────
pauseBtn.addEventListener('click', () => {
  if (!currentGame) return;
  isPaused = !isPaused;
  currentGame.pause();
  pauseBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
  if (typeof Audio !== 'undefined') Audio.click();
});

restartBtn.addEventListener('click', () => {
  if (!currentGame) return;
  isPaused = false;
  pauseBtn.textContent = '⏸ Pause';
  currentGame.restart();
  liveScore.textContent = '0';
  goOverlay.classList.add('hidden');
  if (typeof Audio !== 'undefined') Audio.click();
});

backBtn.addEventListener('click', () => { if (typeof Audio !== 'undefined') Audio.click(); showHome(); });

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
    const cat    = btn.dataset.category;
    const game   = btn.dataset.game;
    const action = btn.dataset.action;
    if (cat === 'home')      { showHome(); if (typeof Audio !== 'undefined') Audio.click(); }
    else if (game)           { launchGame(game); }
    else if (action === 'create-room') openCreateRoom();
    else if (action === 'join-room')   openJoinRoom();
  });
});

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => launchGame(card.dataset.game));
});

// MP quick buttons
document.getElementById('home-create-room').addEventListener('click', openCreateRoom);
document.getElementById('home-join-room').addEventListener('click', openJoinRoom);

// ── PROFILE ────────────────────────────────────
let selectedAvatar = '👾';

function openProfile() {
  const user = UserSystem.getCurrentUser();
  profileNameInp.value = user.isGuest ? '' : user.name;
  selectedAvatar = user.avatar || '👾';
  selectedAvatarDisplay.textContent = selectedAvatar;
  profileModal.classList.remove('hidden');
  profileStatus.textContent = '';
  buildAvatarPicker();
}

function buildAvatarPicker() {
  const AVATARS = ['👾','🦁','🐯','🦊','🐺','🦝','🐸','🐲','🤖','🎃','👻','🎯','🚀','💎','⚡','🦄','🐉','🌟'];
  avatarPicker.innerHTML = '';
  AVATARS.forEach(av => {
    const btn = document.createElement('button');
    btn.textContent = av;
    btn.className = 'avatar-opt' + (av === selectedAvatar ? ' selected' : '');
    btn.addEventListener('click', () => {
      selectedAvatar = av;
      selectedAvatarDisplay.textContent = av;
      avatarPicker.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    avatarPicker.appendChild(btn);
  });
}

profileBtn.addEventListener('click', openProfile);
userChip.addEventListener('click', openProfile);

saveProfileBtn.addEventListener('click', () => {
  const name = profileNameInp.value.trim();
  if (!name) { profileStatus.textContent = 'Please enter a name.'; return; }
  UserSystem.setUser(name, selectedAvatar);
  profileStatus.textContent = '✅ Profile saved!';
  updateUserUI();
  setTimeout(() => profileModal.classList.add('hidden'), 800);
  showToast(`Welcome, ${name}! 👋`);
});

logoutProfileBtn.addEventListener('click', () => {
  UserSystem.logout();
  profileStatus.textContent = '🔄 Profile reset.';
  updateUserUI();
  setTimeout(() => profileModal.classList.add('hidden'), 600);
});

closeProfileBtn.addEventListener('click', () => profileModal.classList.add('hidden'));
profileModal.addEventListener('click', e => { if (e.target === profileModal) profileModal.classList.add('hidden'); });

function updateUserUI() {
  const user = UserSystem.getCurrentUser();
  userNameSidebar.textContent  = user.name;
  userAvatarSidebar.textContent= user.avatar || '👾';
  userBadgeSidebar.textContent = user.isGuest ? 'Guest' : 'Player';
  userBadgeSidebar.className   = 'user-badge ' + (user.isGuest ? 'badge-guest' : 'badge-player');
  document.getElementById('home-greeting').textContent =
    user.isGuest
      ? `16 games · Multiplayer · Leaderboard – let's play!`
      : `Hey ${user.name} ${user.avatar}! Ready to top the boards?`;
}

function updateHomeGreeting() { updateUserUI(); }

// ── LEADERBOARD ─────────────────────────────────
const LB_GAMES = Object.keys(META);
let currentLBGame = LB_GAMES[0];

lbBtn.addEventListener('click', () => openLeaderboard(currentLBGame));

function openLeaderboard(game) {
  currentLBGame = game;
  buildLBTabs(game);
  renderLBContent(game);
  lbModal.classList.remove('hidden');
  if (typeof Audio !== 'undefined') Audio.click();
}

function buildLBTabs(activeGame) {
  const tabsEl = document.getElementById('lb-tabs');
  // Show top game tabs
  tabsEl.innerHTML = LB_GAMES.map(g =>
    `<button class="lb-tab${g===activeGame?' active':''}" data-game="${g}">${META[g].icon}</button>`
  ).join('');
  tabsEl.querySelectorAll('.lb-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLBGame = btn.dataset.game;
      buildLBTabs(currentLBGame);
      renderLBContent(currentLBGame);
    });
  });
}

function renderLBContent(game) {
  const entries = UserSystem.getLB(game);
  const meta = META[game] || { name: game, icon: '🎮' };
  if (!entries.length) {
    lbContent.innerHTML = `<p class="lb-empty">No scores yet for ${meta.icon} ${meta.name}.<br>Play a game to appear here!</p>`;
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  lbContent.innerHTML = `
    <div class="lb-game-title">${meta.icon} ${meta.name}</div>
    ${entries.map((e,i) => `
      <div class="lb-row ${i<3?'lb-top':''}">
        <span class="lb-rank">${medals[i]||`#${i+1}`}</span>
        <span class="lb-avatar">${e.avatar||'👾'}</span>
        <span class="lb-name">${e.name}</span>
        <span class="lb-score">${e.score.toLocaleString()}</span>
        <span class="lb-date">${_fmtDate(e.date)}</span>
      </div>`).join('')}`;
}

function _fmtDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth()+1}/${d.getDate()}`;
}

document.getElementById('clear-lb-btn').addEventListener('click', () => {
  UserSystem.clearLB(currentLBGame);
  renderLBContent(currentLBGame);
  showToast('Leaderboard cleared');
});

closeLb.addEventListener('click', () => { lbModal.classList.add('hidden'); if (typeof Audio !== 'undefined') Audio.click(); });
lbModal.addEventListener('click', e => { if (e.target===lbModal) lbModal.classList.add('hidden'); });

// ── ROOM / MULTIPLAYER ─────────────────────────
let selectedMPGame = 'ludo';

function openCreateRoom() {
  roomCreateView.style.display  = 'flex';
  roomCreatedView.style.display = 'none';
  roomJoinView.style.display    = 'none';
  buildMPGamePicker();
  roomModal.classList.remove('hidden');
}

function openJoinRoom() {
  roomCreateView.style.display  = 'none';
  roomCreatedView.style.display = 'none';
  roomJoinView.style.display    = 'flex';
  roomCodeInput.value = '';
  roomJoinError.textContent = '';
  roomModal.classList.remove('hidden');
}

function buildMPGamePicker() {
  const picker = document.getElementById('mp-game-picker');
  picker.innerHTML = Object.keys(META).map(g => `
    <button class="mp-pick-btn${g===selectedMPGame?' active':''}" data-game="${g}">
      <span>${META[g].icon}</span>
      <span class="mp-pick-name">${META[g].name}</span>
    </button>`
  ).join('');
  picker.querySelectorAll('.mp-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMPGame = btn.dataset.game;
      picker.querySelectorAll('.mp-pick-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

document.getElementById('room-create-confirm-btn').addEventListener('click', () => {
  const user = UserSystem.getCurrentUser();
  const room = Multiplayer.createRoom(selectedMPGame, user.name, user.avatar || '👾');
  activeRoomCode = room.code;

  roomCreateView.style.display  = 'none';
  roomCreatedView.style.display = 'flex';
  roomCodeDisplay.textContent = room.code;
  renderRoomPlayers(room);
});

roomCodeDisplay.addEventListener('click', () => {
  navigator.clipboard?.writeText(roomCodeDisplay.textContent).then(() => showToast('Code copied! 📋'));
});

document.getElementById('room-launch-btn').addEventListener('click', () => {
  if (!activeRoomCode) return;
  roomModal.classList.add('hidden');
  launchGame(selectedMPGame);
  showToast(`🎮 Room ${activeRoomCode} – pass the device!`);
});

document.getElementById('room-join-confirm-btn').addEventListener('click', () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  if (!code) { roomJoinError.textContent = 'Please enter a room code.'; return; }
  const user = UserSystem.getCurrentUser();
  const result = Multiplayer.joinRoom(code, user.name, user.avatar || '👾');
  if (result.error) { roomJoinError.textContent = result.error; return; }
  activeRoomCode = code;
  selectedMPGame = result.gameId;

  roomJoinView.style.display    = 'none';
  roomCreatedView.style.display = 'flex';
  roomCodeDisplay.textContent = result.code;
  renderRoomPlayers(result);
});

function renderRoomPlayers(room) {
  roomPlayersList.innerHTML = room.players.map((p,i) => `
    <div class="room-player-row">
      <span class="room-player-avatar">${p.avatar||'👾'}</span>
      <span class="room-player-name">${p.name}</span>
      ${i===0?'<span class="room-host-badge">Host</span>':''}
    </div>`).join('');
}

// Close buttons
document.querySelectorAll('.room-close-btn').forEach(btn => {
  btn.addEventListener('click', () => roomModal.classList.add('hidden'));
});
roomModal.addEventListener('click', e => { if(e.target===roomModal) roomModal.classList.add('hidden'); });

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

function showToast(msg, dur=2500) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), dur);
}

function showConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1000';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({length: 100}, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: (Math.random() - 0.5) * 15,
    dy: (Math.random() - 0.5) * 25,
    r: 4 + Math.random() * 6,
    c: `hsl(${Math.random()*360}, 100%, 70%)`
  }));

  function anim() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy; p.dy += 0.5;
      if (p.y < canvas.height) alive = true;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    });
    if (alive) requestAnimationFrame(anim);
    else canvas.remove();
  }
  anim();
}

// ── Keyboard shortcuts ─────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!goOverlay.classList.contains('hidden'))  { goOverlay.classList.add('hidden'); return; }
    if (!lbModal.classList.contains('hidden'))    { lbModal.classList.add('hidden');   return; }
    if (!profileModal.classList.contains('hidden')){ profileModal.classList.add('hidden'); return; }
    if (!roomModal.classList.contains('hidden'))  { roomModal.classList.add('hidden'); return; }
    if (currentGame) showHome();
  }
  if (e.key === 'p' || e.key === 'P') pauseBtn.click();
});

// ── Boot ───────────────────────────────────────
(function boot() {
  refreshHomeBadges();
  updateUserUI();

  // Auto assign guest name if no profile
  const user = UserSystem.getCurrentUser();
  if (user.isGuest) {
    const guestName = UserSystem.randomGuestName();
    // Don't save—keep as transient guest
    document.getElementById('user-name-sidebar').textContent = guestName;
  }

  showHome();
})();
