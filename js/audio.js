/* ── Audio Engine ── */
const Audio = (() => {
  let musicOn = true;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  function beep(freq = 440, dur = 0.08, type = 'square', vol = 0.15) {
    if (ctx.state === 'suspended') ctx.resume();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }

  function click()  { beep(600, 0.06, 'sine', 0.1); }
  function win()    { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.15,'sine',.18),i*120)); }
  function lose()   { [300,250,200,150].forEach((f,i)=>setTimeout(()=>beep(f,.18,'sawtooth',.2),i*140)); }
  function paddle() { beep(440, 0.07, 'square', 0.12); }
  function point()  { beep(700, 0.1, 'sine', 0.15); }
  function eat()    { beep(880, 0.06, 'sine', 0.1); }
  function merge()  { beep(960, 0.1, 'triangle', 0.12); }
  function flip()   { beep(520, 0.07, 'triangle', 0.1); }
  function shoot()  { beep(220, 0.08, 'sawtooth', 0.1); }
  function boom()   { beep(80,  0.25, 'sawtooth', 0.18); }

  function toggleMusic(on) { musicOn = on; }

  return { click, win, lose, paddle, point, eat, merge, flip, shoot, boom, toggleMusic };
})();
