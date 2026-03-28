/* ── multiplayer.js – Local Pass-and-Play Room System ── */
const Multiplayer = (() => {
  const KEY_ROOMS = 'neonarcade_rooms';
  const WORDS = ['STAR','MOON','FIRE','VOLT','APEX','ZETA','NOVA','BOLT','NEON','CUBE','FLUX','RING','WAVE','GLOW','BLAZE'];

  function generateRoomCode() {
    const w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
    const nums = String(Math.floor(Math.random() * 9000) + 1000);
    return w1 + nums;
  }

  function getRooms() {
    try { return JSON.parse(localStorage.getItem(KEY_ROOMS)) || {}; } catch { return {}; }
  }

  function saveRooms(rooms) {
    try { localStorage.setItem(KEY_ROOMS, JSON.stringify(rooms)); } catch {}
  }

  function createRoom(gameId, hostName, hostAvatar) {
    const code = generateRoomCode();
    const rooms = getRooms();
    rooms[code] = {
      code,
      gameId,
      host: { name: hostName, avatar: hostAvatar },
      players: [{ name: hostName, avatar: hostAvatar, score: 0 }],
      createdAt: Date.now(),
      status: 'waiting', // waiting | playing | finished
      currentTurn: 0,
      turnCount: 0,
    };
    saveRooms(rooms);
    return rooms[code];
  }

  function joinRoom(code, playerName, playerAvatar) {
    const rooms = getRooms();
    const room = rooms[code.toUpperCase()];
    if (!room) return { error: 'Room not found. Check the code and try again.' };
    if (room.status === 'finished') return { error: 'This room has already finished.' };
    if (room.players.length >= 4) return { error: 'Room is full (max 4 players).' };
    const alreadyIn = room.players.some(p => p.name === playerName);
    if (!alreadyIn) {
      room.players.push({ name: playerName, avatar: playerAvatar, score: 0 });
    }
    saveRooms(rooms);
    return room;
  }

  function getRoom(code) {
    return getRooms()[code.toUpperCase()] || null;
  }

  function updateRoom(code, updates) {
    const rooms = getRooms();
    if (!rooms[code]) return;
    Object.assign(rooms[code], updates);
    saveRooms(rooms);
  }

  function updatePlayerScore(code, playerIdx, score) {
    const rooms = getRooms();
    if (!rooms[code] || !rooms[code].players[playerIdx]) return;
    rooms[code].players[playerIdx].score = score;
    saveRooms(rooms);
  }

  function nextTurn(code) {
    const rooms = getRooms();
    if (!rooms[code]) return null;
    const room = rooms[code];
    room.turnCount = (room.turnCount || 0) + 1;
    room.currentTurn = (room.currentTurn + 1) % room.players.length;
    saveRooms(rooms);
    return room;
  }

  function deleteRoom(code) {
    const rooms = getRooms();
    delete rooms[code];
    saveRooms(rooms);
  }

  function cleanOldRooms() {
    const rooms = getRooms();
    const cutoff = Date.now() - 24 * 3600 * 1000; // 24h
    let changed = false;
    Object.keys(rooms).forEach(code => {
      if (rooms[code].createdAt < cutoff) { delete rooms[code]; changed = true; }
    });
    if (changed) saveRooms(rooms);
  }

  cleanOldRooms();

  return { createRoom, joinRoom, getRoom, updateRoom, updatePlayerScore, nextTurn, deleteRoom };
})();
