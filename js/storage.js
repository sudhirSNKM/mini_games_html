/* ── localStorage Score Storage (Firebase-ready) ── */
const Storage = (() => {
  const KEY = 'neonarcade_scores';

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch { console.warn('localStorage unavailable'); }
  }

  function getHigh(game) {
    return getAll()[game] ?? 0;
  }

  function setHigh(game, score) {
    const data = getAll();
    if (score > (data[game] ?? 0)) {
      data[game] = score;
      save(data);
      return true; // new high score
    }
    return false;
  }

  function getAllHighScores() { return getAll(); }

  // ── Firebase stub (plug real config here later) ──────────────────────────
  // import { initializeApp } from "firebase/app";
  // import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
  // const fb = initializeApp({ apiKey:"...", projectId:"neonarcade", ... });
  // const db   = getFirestore(fb);
  // async function syncToFirebase(game, score) {
  //   const ref = doc(db, "scores", game);
  //   const snap = await getDoc(ref);
  //   if (!snap.exists() || score > snap.data().high) {
  //     await setDoc(ref, { high: score, updated: Date.now() });
  //   }
  // }

  return { getHigh, setHigh, getAllHighScores };
})();
