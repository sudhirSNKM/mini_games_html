# 🕹️ NeonArcade – The Ultimate Mini Game Hub

Welcome to **NeonArcade**, a premium, high-performance mini-game hub built entirely from scratch using only **Vanilla HTML, CSS, and JavaScript**. No frameworks, just pure code and modern web APIs. 🚀

![Arcade Header Emoji](https://img.shields.io/badge/Arcade-15%20Games-00f5ff?style=for-the-badge&logo=game-controller&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS-3-1572b6?style=for-the-badge&logo=css3&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML-5-e34f26?style=for-the-badge&logo=html5&logoColor=white)

---

## 🎮 The Games (15 Total)

The arcade is split into **five main categories**:

### 🕹 Arcade Classics
1.  **🏓 Pong**: Player vs AI classic paddle game.
2.  **🐍 Snake**: Retro grid-based movement with food and growth.
3.  **🧱 Breakout**: Multi-level brick breaker with increasing difficulty.

### 🧩 Puzzle Games
4.  **🔢 2048**: Tile merging logic with 2048 goal.
5.  **🧩 Sliding Puzzle**: 4x4 tile-shifting challenge with solvability checks.
6.  **🃏 Memory Cards**: 3D-flipping card matching game with emoji pairs.

### 🚀 Action Games
7.  **🐦 Flappy Bird**: Gravity-based pipe dodger.
8.  **🚗 Car Dodger**: High-speed, 3-lane infinite runner.
9.  **🔫 Space Shooter**: Wave-based alien invader shooter.

### 🧠 Brain Games
10. **❌ Tic Tac Toe**: Play against an unbeatable **Minimax AI**.
11. **🧠 Quiz Game**: Multiple-choice questions with a ticking timer.
12. **🪢 Hangman**: Word guessing with beautiful canvas drawings.

### 🟦 Classic Extensions
13. **🟦 Tetris**: Complete line clearing with ghost pieces and rotation.
14. **💣 Minesweeper**: Beginner and Intermediate modes with flagging.
15. **🐹 Whack-a-Mole**: Fast-paced scoring game with 7 levels of speed.

---

## ✨ Features

- **Hub Dashboard**: Centralized navigation between all games without page reloads (SPA).
- **Responsive UI**: Fully optimized for Desktop, Tablet, and Mobile devices.
- **Neon Dark Theme**: Stunning design using glowing colors (Cyan, Pink, Purple) and modern typography (Orbitron/Inter).
- **Sound System**: Immersive audio feedback for wins, losses, clicks, and points using the **Web Audio API**.
- **Leaderboard**: Global high-score system that stores your best performances in `localStorage`.
- **Game Controls**: Support for Mouse, Touch, and **Keyboard Shortcuts** (Esc to Home, P to Pause, Arrow Keys).
- **Custom Favicon**: Custom-generated neon joystick icon for a professional feel.

---

## 🛠️ Technology Stack

- **HTML5**: Semantic structure and Canvas for 2D rendering.
- **CSS3**: Advanced Flexbox/Grid layouts, glassmorphism, transitions, and keyframe animations.
- **JavaScript (ES6+)**: Modular game logic, audio synthesis, and local storage management.
- **Web Audio API**: Real-time sound generation without external assets.

---

## 🏃‍♂️ How to Run

No installation, build steps, or servers are required!

1.  Clone or download the project folder.
2.  Locate `index.html` in the root directory.
3.  Double-click `index.html` to open it in your preferred browser.

### 🔌 Developer Mode (Optional)
For live-reload during development:
```bash
npx serve .
```

---

## 📁 Project Structure

```text
mini_games_html/
├── index.html          # Main application shell
├── style.css           # Global design system & animations
├── favicon.png         # Custom tab icon
├── js/
│   ├── main.js         # Core hub logic & routing
│   ├── audio.js        # Sound generation engine
│   ├── storage.js      # Score management
│   ├── pong.js         # Game files...
│   ├── snake.js
│   ├── breakout.js
│   ├── g2048.js
│   ├── sliding.js
│   ├── memory.js
│   ├── flappy.js
│   ├── car.js
│   ├── shooter.js
│   ├── tictactoe.js
│   ├── quiz.js
│   ├── tetris.js
│   ├── minesweeper.js
│   ├── whack.js
│   └── hangman.js
└── README.md           # You are here!
```

---

## 🏆 Future Enhancements
- [ ] **Multiplayer**: Real-time P2P gaming using WebRTC.
- [ ] **Firebase Sync**: Global leaderboard support (stub already exists in `storage.js`).
- [ ] **More Levels**: Endless mode extensions for action games.

Enjoy your time at the **NeonArcade**! 🎮✨


