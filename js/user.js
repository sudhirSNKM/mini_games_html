/* ── user.js – Player Identity & Profile System ── */
const UserSystem = (() => {
  const KEY_PROFILE = 'neonarcade_profile';
  const KEY_LB      = 'neonarcade_leaderboard';

  const ADJECTIVES = ['Neon','Cyber','Pixel','Turbo','Ghost','Blaze','Storm','Hype','Ultra','Apex','Nova','Volt'];
  const NOUNS      = ['Ninja','Falcon','Cobra','Dragon','Viper','Wolf','Eagle','Phoenix','Titan','Specter','Ranger','Ace'];

  function randomGuestName() {
    const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${a}${n}${Math.floor(Math.random()*100)}`;
  }

  function getProfile() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY_PROFILE));
      if (p && p.name) return p;
    } catch {}
    return null;
  }

  function saveProfile(profile) {
    try { localStorage.setItem(KEY_PROFILE, JSON.stringify(profile)); } catch {}
  }

  function getCurrentUser() {
    return getProfile() || { name: 'Guest', avatar: '👾', isGuest: true };
  }

  function setUser(name, avatar) {
    const profile = { name: name.trim().slice(0,18) || 'Player', avatar: avatar || '👾', isGuest: false, joinedAt: Date.now() };
    saveProfile(profile);
    return profile;
  }

  function logout() {
    try { localStorage.removeItem(KEY_PROFILE); } catch {}
  }

  // ── Leaderboard ──────────────────────────────────────
  function getLB(game) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY_LB)) || {};
      return all[game] || [];
    } catch { return []; }
  }

  function addLBEntry(game, score, player) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY_LB)) || {};
      const list = all[game] || [];
      list.push({ name: player.name, avatar: player.avatar || '👾', score, date: Date.now() });
      list.sort((a,b) => b.score - a.score);
      all[game] = list.slice(0, 10); // top 10 per game
      localStorage.setItem(KEY_LB, JSON.stringify(all));
    } catch {}
  }

  function getAllLB() {
    try { return JSON.parse(localStorage.getItem(KEY_LB)) || {}; } catch { return {}; }
  }

  function clearLB(game) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY_LB)) || {};
      if (game) { delete all[game]; }
      else { Object.keys(all).forEach(k => delete all[k]); }
      localStorage.setItem(KEY_LB, JSON.stringify(all));
    } catch {}
  }

  return { randomGuestName, getCurrentUser, setUser, logout, getLB, addLBEntry, getAllLB, clearLB };
})();
