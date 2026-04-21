(function() {
  var ctx = null;
  var sfxEnabled = true;
  var unlocked = false;
  var STORAGE_KEY = 'llk_sfx_enabled';

  function loadPreference() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === '0') sfxEnabled = false;
      if (saved === '1') sfxEnabled = true;
    } catch (e) {}
  }

  function savePreference() {
    try {
      window.localStorage.setItem(STORAGE_KEY, sfxEnabled ? '1' : '0');
    } catch (e) {}
  }

  function ensureContext() {
    if (!sfxEnabled) return null;
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function unlockAudio() {
    if (unlocked || !sfxEnabled) return;
    var audioCtx = ensureContext();
    if (!audioCtx) return;
    audioCtx.resume().then(function() {
      unlocked = true;
      playTone(520, 0.03, 'sine', 0.02);
    });
  }

  function playTone(freq, duration, type, volume) {
    var audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state !== 'running') {
      audioCtx.resume().then(function() {
        playTone(freq, duration, type, volume);
      });
      return;
    }

    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume || 0.14, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playSuccessSfx() {
    playTone(760, 0.12, 'triangle', 0.14);
    setTimeout(function() { playTone(980, 0.16, 'triangle', 0.16); }, 70);
  }

  function playFailSfx() {
    playTone(240, 0.12, 'sawtooth', 0.16);
    setTimeout(function() { playTone(180, 0.18, 'sawtooth', 0.16); }, 60);
  }

  function toggleSfx() {
    sfxEnabled = !sfxEnabled;
    savePreference();
    return sfxEnabled;
  }

  function isSfxEnabled() {
    return sfxEnabled;
  }

  loadPreference();
  document.addEventListener('pointerdown', unlockAudio, { once: true });

  window.playSuccessSfx = playSuccessSfx;
  window.playFailSfx = playFailSfx;
  window.toggleSfx = toggleSfx;
  window.isSfxEnabled = isSfxEnabled;
  window.unlockAudio = unlockAudio;
})();
