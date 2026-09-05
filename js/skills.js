// 技能系统（V2）：被动二段跳 + 充能制主动技能（护盾/冲刺/吸附）
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  function progressOf(unlock) {
    if (!unlock) return 1;
    return YT.Store.state[unlock.type] || 0;
  }

  YT.Skills = {
    defs: D.skills,

    isUnlocked: function (id) {
      return YT.Store.state.unlockedSkills.indexOf(id) >= 0;
    },

    progress: function (id) {
      for (var i = 0; i < D.skills.length; i++) {
        if (D.skills[i].id === id) return progressOf(D.skills[i].unlock);
      }
      return 0;
    },

    checkUnlocks: function (toastFn) {
      var s = YT.Store.state;
      for (var i = 0; i < D.skills.length; i++) {
        var sk = D.skills[i];
        if (sk.unlock && !this.isUnlocked(sk.id) && progressOf(sk.unlock) >= sk.unlock.value) {
          s.unlockedSkills.push(sk.id);
          YT.Store.save();
          if (toastFn) toastFn("新技能解锁 · " + sk.name);
          YT.Audio.sfx("achieve");
        }
      }
    },

    // 被动：二段跳（解锁即生效）
    hasDoubleJump: function () {
      return this.isUnlocked("double_jump");
    },

    // 已启用的主动技能（最多 2 个）
    enabledActives: function () {
      var s = YT.Store.state;
      var out = [];
      for (var i = 0; i < D.skills.length; i++) {
        var sk = D.skills[i];
        if (sk.active && this.isUnlocked(sk.id) && s.enabledSkills.indexOf(sk.id) >= 0) {
          out.push(sk);
        }
      }
      return out;
    },

    toggle: function (id) {
      var s = YT.Store.state;
      var sk = null, i;
      for (i = 0; i < D.skills.length; i++) if (D.skills[i].id === id) sk = D.skills[i];
      if (!sk || !sk.active || !this.isUnlocked(id)) return;
      var idx = s.enabledSkills.indexOf(id);
      if (idx >= 0) {
        s.enabledSkills.splice(idx, 1);
      } else {
        var actives = s.enabledSkills.length;
        if (actives >= D.skillMaxEnabled) {
          if (YT.UI) YT.UI.toast("最多同时启用 " + D.skillMaxEnabled + " 个主动技能");
          return;
        }
        s.enabledSkills.push(id);
      }
      YT.Store.save();
    }
  };

  // ---------- 单局技能条（充能制） ----------
  YT.SkillBar = function (game) {
    this.game = game;
    this.charge = 0;
    this.buttons = {};
    this.buildUI();
  };

  YT.SkillBar.prototype = {
    buildUI: function () {
      var bar = document.getElementById("skill-bar");
      bar.innerHTML = "";
      var self = this;
      this.game.enabledSkills.forEach(function (sk) {
        var btn = document.createElement("button");
        btn.className = "skill-btn";
        btn.textContent = sk.name.slice(0, 2);
        var ring = document.createElement("canvas");
        ring.className = "ring";
        ring.width = 116;
        ring.height = 116;
        btn.appendChild(ring);
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          self.press(sk.id);
        });
        bar.appendChild(btn);
        self.buttons[sk.id] = { btn: btn, ring: ring };
      });
      this.updateUI();
    },

    addCharge: function (n) {
      this.charge = Math.min(D.skillChargeMax, this.charge + n);
      this.updateUI();
    },

    press: function (id) {
      var g = this.game;
      if (g.state !== "PLAYING") return;
      if (this.charge < D.skillChargeMax) return;
      this.charge = 0;
      YT.Audio.sfx("skill");
      if (id === "shield") {
        g.player.shield = true;
        YT.UI.buffTip("月光护盾");
      } else if (id === "dash") {
        g.score.dashT = Math.max(g.score.dashT, 2.5 * g.durMul);
        g.score.hadDash = true;
        YT.UI.buffTip("月影冲刺");
      } else if (id === "blossom") {
        g.magnetT = 6;
        YT.UI.buffTip("桂花祝福");
      }
      this.updateUI();
    },

    updateUI: function () {
      var max = D.skillChargeMax;
      var ready = this.charge >= max;
      for (var id in this.buttons) {
        var b = this.buttons[id];
        b.btn.className = "skill-btn" + (ready ? " ready" : "");
        var x = b.ring.getContext("2d");
        x.clearRect(0, 0, 116, 116);
        if (!ready) {
          x.strokeStyle = "rgba(255,217,138,0.9)";
          x.lineWidth = 5;
          x.beginPath();
          x.arc(58, 58, 54, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (this.charge / max));
          x.stroke();
        }
      }
    },

    destroy: function () {
      document.getElementById("skill-bar").innerHTML = "";
    }
  };
})();
