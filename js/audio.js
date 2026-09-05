// Web Audio 程序化合成音效 + 五声音阶 BGM（零音频资源文件，规避自动播放限制）
(function () {
  var YT = (window.YT = window.YT || {});

  var ctx = null;
  var master = null;
  var musicGain = null;
  var sfxGain = null;
  var noiseBuf = null;
  var musicTimer = null;
  var nextNoteTime = 0;
  var step = 0;
  var STEP_DUR = 0.24;

  // 五声音阶（宫商角徵羽）旋律，32 步循环，0 表示休止
  var MELODY = [
    523, 0, 587, 0, 659, 0, 784, 0, 659, 0, 587, 0, 523, 0, 0, 0,
    659, 0, 784, 0, 880, 0, 784, 0, 659, 0, 587, 0, 523, 0, 0, 0
  ];
  var BASS = [262, 0, 0, 0, 196, 0, 0, 0, 220, 0, 0, 0, 196, 0, 0, 0,
              262, 0, 0, 0, 220, 0, 0, 0, 196, 0, 0, 0, 131, 0, 0, 0];

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = YT.Store.state.settings.music ? 0.16 : 0;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = YT.Store.state.settings.sfx ? 0.9 : 0;
    sfxGain.connect(master);
    // 噪声缓冲
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function pluck(freq, when, gainVal, dest, dur) {
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gainVal, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function tone(type, f0, f1, when, dur, gainVal) {
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, when);
    if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, when + dur);
    g.gain.setValueAtTime(gainVal, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function noise(when, dur, gainVal) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(g);
    g.connect(sfxGain);
    src.start(when);
    src.stop(when + dur);
  }

  function scheduleMusic() {
    while (nextNoteTime < ctx.currentTime + 0.35) {
      var m = MELODY[step % MELODY.length];
      var b = BASS[step % BASS.length];
      if (m) {
        pluck(m, nextNoteTime, 0.5, musicGain, 0.42);
        pluck(m * 2, nextNoteTime, 0.12, musicGain, 0.3);
      }
      if (b) pluck(b / 2, nextNoteTime, 0.55, musicGain, 0.9);
      nextNoteTime += STEP_DUR;
      step++;
    }
  }

  YT.Audio = {
    // 必须由用户手势触发
    ensure: ensure,

    startMusic: function () {
      if (!ensure()) return;
      if (musicTimer) return;
      nextNoteTime = ctx.currentTime + 0.05;
      step = 0;
      scheduleMusic();
      musicTimer = setInterval(scheduleMusic, 150);
    },
    stopMusic: function () {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    },

    setMusic: function (on) {
      YT.Store.state.settings.music = on;
      YT.Store.save();
      if (musicGain) musicGain.gain.value = on ? 0.16 : 0;
      if (on) this.startMusic();
    },
    setSfx: function (on) {
      YT.Store.state.settings.sfx = on;
      YT.Store.save();
      if (sfxGain) sfxGain.gain.value = on ? 0.9 : 0;
    },

    sfx: function (name, opt) {
      if (!ensure()) return;
      opt = opt || {};
      var t = ctx.currentTime;
      var n = opt.n || 0; // 连击数，用于音高递增
      switch (name) {
        case "click":
          tone("sine", 660, 880, t, 0.08, 0.25);
          break;
        case "jump":
          tone("sine", 380, 720, t, 0.14, 0.3);
          break;
        case "double_jump":
          tone("sine", 520, 980, t, 0.14, 0.3);
          break;
        case "collect":
          var f = 780 * (1 + Math.min(n, 10) * 0.055);
          tone("sine", f, f, t, 0.09, 0.22);
          tone("sine", f * 2, f * 2, t, 0.07, 0.08);
          break;
        case "hurt":
          tone("sawtooth", 300, 110, t, 0.22, 0.3);
          noise(t, 0.15, 0.2);
          break;
        case "combo5":
          tone("sine", 523, 523, t, 0.1, 0.22);
          tone("sine", 659, 659, t + 0.08, 0.1, 0.22);
          tone("sine", 784, 784, t + 0.16, 0.16, 0.24);
          break;
        case "combo10":
          [523, 659, 784, 1047, 1319].forEach(function (f, i) {
            tone("sine", f, f, t + i * 0.07, 0.18, 0.24);
          });
          break;
        case "gameover":
          [784, 659, 523].forEach(function (f, i) {
            tone("triangle", f, f, t + i * 0.18, 0.3, 0.24);
          });
          break;
        case "achieve":
          tone("sine", 880, 880, t, 0.12, 0.2);
          tone("sine", 1175, 1175, t + 0.1, 0.2, 0.22);
          break;
        case "save":
          tone("sine", 988, 988, t, 0.09, 0.2);
          tone("sine", 1319, 1319, t + 0.09, 0.14, 0.2);
          break;
        case "skill":
          tone("triangle", 440, 880, t, 0.2, 0.26);
          break;
      }
    }
  };
})();
