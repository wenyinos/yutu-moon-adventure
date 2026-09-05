// 游戏主控：状态机 / 主循环 / 事件生成 / 碰撞 / 彩蛋 / HUD
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  YT.Game = {
    state: "IDLE",
    opts: null,

    init: function () {
      YT.Render.init(
        document.getElementById("cv-bg"),
        document.getElementById("cv-game")
      );
      this.bindInput();
    },

    bindInput: function () {
      var self = this;
      var scr = document.getElementById("screen-game");

      scr.addEventListener("pointerdown", function (e) {
        if (self.state !== "PLAYING") return;
        if (e.target && e.target.closest && e.target.closest("button")) return;
        self.press();
      });
      document.addEventListener("pointerup", function () { self.release(); });

      document.getElementById("btn-pause").addEventListener("click", function (e) {
        e.stopPropagation();
        self.pause();
      });
      document.getElementById("btn-resume").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.resume();
      });
      document.getElementById("btn-restart").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.restart();
      });
      document.getElementById("btn-quit").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.quit();
      });
      document.getElementById("btn-music").addEventListener("click", function () {
        YT.Audio.setMusic(!YT.Store.state.settings.music);
        this.textContent = "音乐 " + (YT.Store.state.settings.music ? "开" : "关");
      });
      document.getElementById("btn-sfx").addEventListener("click", function () {
        YT.Audio.setSfx(!YT.Store.state.settings.sfx);
        this.textContent = "音效 " + (YT.Store.state.settings.sfx ? "开" : "关");
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden && self.state === "PLAYING") self.pause();
      });
    },

    start: function (opts) {
      this.opts = opts;
      this.mode = opts.mode;
      this.levelIdx = opts.levelIdx != null ? opts.levelIdx : -1;
      this.isDaily = opts.mode === "daily";

      var skin = YT.Skins.current();
      var muls = YT.Skins.muls(skin);
      this.durMul = muls.dur;
      this.enabledSkills = YT.Skills.enabledActives();

      this.player = new YT.Player(skin, YT.Skills.hasDoubleJump());
      this.score = new YT.Score(muls, muls.dur);
      this.obstacles = new YT.Obstacles();
      this.items = new YT.Items();
      this.fx = new YT.FX();
      this.skillBar = new YT.SkillBar(this);

      this.time = 0;
      this.dist = 0;
      this.lives = D.lives;
      this.spawnTimer = 2.2;
      this.phaseIdx = -1;
      this.egg = null;
      this.eggsCollected = [];
      this.eggShadowT = 0;
      this.magnetT = 0;
      this.hudT = 0;
      this.endT = 0;
      this.statsDone = false;

      if (this.isDaily) {
        this.schedule = YT.Daily.schedule(YT.Daily.today());
        this.di = 0;
      } else {
        this.schedule = null;
      }

      YT.UI.showScreen("game");
      document.getElementById("pause-panel").classList.add("hidden");
      var cd = document.getElementById("countdown");
      cd.classList.remove("hidden");
      cd.textContent = "3";

      this.state = "COUNTDOWN";
      this.countdown = 3.2;

      YT.Audio.ensure();
      YT.Audio.startMusic();
      if (this.mode === "adventure") YT.UI.buffTip(D.levels[this.levelIdx].name);
      if (this.isDaily) YT.UI.buffTip("每日挑战 · 目标 " + D.dailyGoal + " 分");
      this.updateHUD();
      this.renderFrame();
    },

    press: function () {
      if (this.state !== "PLAYING") return;
      this.player.jump();
    },
    release: function () {
      if (this.player) this.player.release();
    },
    restart: function () { this.start(this.opts); },

    pause: function () {
      if (this.state !== "PLAYING") return;
      this.state = "PAUSED";
      document.getElementById("btn-music").textContent = "音乐 " + (YT.Store.state.settings.music ? "开" : "关");
      document.getElementById("btn-sfx").textContent = "音效 " + (YT.Store.state.settings.sfx ? "开" : "关");
      document.getElementById("pause-panel").classList.remove("hidden");
      YT.Audio.stopMusic();
    },
    resume: function () {
      if (this.state !== "PAUSED") return;
      this.state = "PLAYING";
      document.getElementById("pause-panel").classList.add("hidden");
      YT.Audio.startMusic();
    },
    quit: function () {
      this.state = "IDLE";
      YT.Audio.stopMusic();
      if (this.skillBar) { this.skillBar.destroy(); this.skillBar = null; }
      YT.UI.showScreen("title");
    },

    // ---------- 难度 ----------
    speedFactor: function () {
      if (this.mode === "adventure") {
        return D.phases[D.levels[this.levelIdx].visual].speed;
      }
      var f = Math.min(this.time / D.phaseDuration, 3.999);
      var i0 = Math.floor(f);
      return YT.lerp(D.phases[i0].speed, D.phases[Math.min(3, i0 + 1)].speed, f - i0);
    },
    spawnGap: function () {
      if (this.mode === "adventure") {
        return D.phases[D.levels[this.levelIdx].visual].spawn * YT.rand(0.85, 1.2);
      }
      var f = Math.min(this.time / D.phaseDuration, 3.999);
      var i0 = Math.floor(f);
      var base = YT.lerp(D.phases[i0].spawn, D.phases[Math.min(3, i0 + 1)].spawn, f - i0);
      return base * YT.rand(0.85, 1.2);
    },

    // ---------- 主循环 ----------
    update: function (dt) {
      if (this.state === "COUNTDOWN") {
        this.countdown -= dt;
        var cd = document.getElementById("countdown");
        var n = Math.ceil(this.countdown);
        cd.textContent = n > 0 ? String(n) : "奔！";
        if (this.countdown <= 0) {
          this.state = "PLAYING";
          cd.classList.add("hidden");
        }
        this.renderFrame();
        return;
      }
      if (this.state === "PAUSED" || this.state === "IDLE") return;

      if (this.state === "ENDING") {
        this.endT += dt;
        this.player.update(dt);
        this.fx.update(dt);
        this.renderFrame();
        if (this.endT >= 0.9 && !this.statsDone) {
          this.statsDone = true;
          YT.Result.finish(this.buildStats());
        }
        return;
      }

      // ---- PLAYING ----
      this.time += dt;
      if (this.time >= D.duration) {
        this.time = D.duration;
        this.finish(true);
        return;
      }

      var dashActive = this.score.inDash();
      var speed = D.baseSpeed * this.speedFactor() * (dashActive ? D.combo.dashSpeed : 1);
      this.dist += speed * dt;
      this.score.addDistance(speed * dt);
      this.score.update(dt);
      if (this.magnetT > 0) this.magnetT -= dt;

      this.player.update(dt);
      if (this.player.landed) this.fx.dust(this.player.x, D.groundY);
      if (dashActive) this.fx.trail(this.player.x - 30, this.player.y - 40);
      this.fx.update(dt);

      // 阶段切换
      if (this.mode !== "adventure") {
        var pi = Math.min(3, Math.floor(this.time / D.phaseDuration));
        if (pi !== this.phaseIdx) {
          this.phaseIdx = pi;
          if (pi > 0) {
            YT.UI.buffTip(D.phases[pi].name + " 阶段");
            this.rollEgg();
          }
          this.fx.rainRate = pi === 3 ? 0.5 : pi === 0 ? 0.18 : 0;
        }
      } else {
        this.fx.rainRate = D.levels[this.levelIdx].visual === 3 ? 0.5 : 0.15;
      }

      // 事件生成
      if (this.isDaily) {
        while (this.di < this.schedule.length && this.schedule[this.di].t <= this.time) {
          this.execEvent(this.schedule[this.di]);
          this.di++;
        }
      } else {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnRandom();
          this.spawnTimer = this.spawnGap();
        }
      }

      // 世界
      this.obstacles.update(dt, speed);
      if (this.obstacles.collide(this.player)) this.onHit();

      var self = this;
      var magnet = this.magnetT > 0 || dashActive;
      this.items.update(dt, speed, this.player, magnet, function (type, x, y) {
        self.onCollect(type, x, y);
      });

      // 彩蛋
      if (this.egg) {
        this.egg.t -= dt;
        if (this.egg.id === "shadow" || this.egg.id === "firework") {
          this.eggShadowT = Math.max(0, this.egg.t);
        }
        if (this.egg.t <= 0) this.egg = null;
      }

      this.hudT -= dt;
      if (this.hudT <= 0) {
        this.updateHUD();
        this.hudT = 0.12;
      }
      this.renderFrame();
    },

    execEvent: function (ev) {
      var x = YT.Render.W + 120;
      if (ev.kind === "items") {
        if (ev.arc) this.items.spawnArc(x, ev.n);
        else this.items.spawnLine(x, ev.n);
      } else {
        this.obstacles.spawn(ev.type, x + YT.rand(0, 60));
      }
    },

    spawnRandom: function () {
      var x = YT.Render.W + 120;
      var r = Math.random();
      if (r < 0.54) {
        var n = YT.randInt(4, 7);
        if (Math.random() < 0.35) this.items.spawnArc(x, n);
        else this.items.spawnLine(x, n);
      } else if (r < 0.86) {
        this.obstacles.spawn(this.pickObstacle(), x);
      } else {
        this.obstacles.spawn(this.pickObstacle(), x);
        this.items.spawnArc(x + 480, 5);
      }
    },
    pickObstacle: function () {
      var r = Math.random();
      return r < 0.42 ? "root" : r < 0.75 ? "rock" : "cloud";
    },

    rollEgg: function () {
      if (Math.random() >= D.eggChance) return;
      var egg = YT.pick(D.eggs);
      this.egg = { id: egg.id, t: 2.6 };
      this.eggsCollected.push(egg);
      this.score.score += egg.bonus;
      YT.UI.buffTip(egg.name + " +" + egg.bonus);
      YT.Audio.sfx("achieve");
      if (egg.id === "firework") this.fx.firework(YT.Render.W * 0.7, 300);
      if (egg.id === "shadow") this.eggShadowT = 2.6;
    },

    onHit: function () {
      if (this.player.invincible > 0 || this.score.inDash()) return;
      if (this.player.shield) {
        this.player.shield = false;
        this.player.invincible = 1;
        YT.UI.buffTip("月光护盾抵挡！");
        YT.Audio.sfx("hurt");
        return;
      }
      this.player.hurtT = 0.9;
      this.player.invincible = 1.2;
      this.score.onHit();
      this.lives--;
      this.fx.flash = 0.5;
      this.fx.burst(this.player.x, this.player.y - 40, "#ff8a9c", 10);
      YT.Audio.sfx("hurt");
      if (this.lives <= 0) this.finish(false);
    },

    onCollect: function (type, x, y) {
      this.score.addCollect(type);
      if (this.skillBar) {
        this.skillBar.addCharge(type === "moonorb" ? D.skillChargePerOrb : D.skillChargePerItem);
      }
      var colors = { mooncake: "#e8b05c", osmanthus: "#f5c95c", star: "#ffd98a", moonorb: "#cfe0ff" };
      this.fx.burst(x, y, colors[type], 7);
      YT.Audio.sfx("collect", { n: this.score.combo });
      if (this.score.combo === D.combo.moonlightAt) {
        YT.UI.buffTip("月华加成 ×2");
        YT.Audio.sfx("combo5");
      }
      if (this.score.combo === D.combo.dashAt) {
        YT.UI.buffTip("满月冲刺！");
        YT.Audio.sfx("combo10");
      }
    },

    finish: function (finished) {
      if (this.state !== "PLAYING") return;
      this.finished = finished;
      this.state = "ENDING";
      this.endT = 0;
      if (!finished) this.player.hurtT = 2;
      YT.Audio.sfx("gameover");
      YT.Audio.stopMusic();
      if (this.skillBar) { this.skillBar.destroy(); this.skillBar = null; }
    },

    buildStats: function () {
      var phaseReached = this.mode === "adventure"
        ? D.levels[this.levelIdx].visual
        : Math.min(3, Math.floor(this.time / D.phaseDuration));
      var goal = 0;
      if (this.mode === "adventure") goal = D.levels[this.levelIdx].goal;
      if (this.isDaily) goal = D.dailyGoal;
      var finalScore = this.score.final();
      return {
        score: finalScore,
        maxCombo: this.score.maxCombo,
        collisions: this.score.collisions,
        counts: this.score.counts,
        phaseReached: phaseReached,
        finished: this.finished,
        hadDash: this.score.hadDash,
        mode: this.mode,
        levelIdx: this.levelIdx,
        levelPass: this.mode === "adventure" && this.finished && finalScore >= goal,
        dailyPass: this.isDaily && finalScore >= goal,
        skin: YT.Skins.current(),
        eggs: this.eggsCollected,
        durationPlayed: Math.round(this.time)
      };
    },

    updateHUD: function () {
      document.getElementById("hud-score").textContent = String(this.score.final());
      document.getElementById("hud-time").textContent = String(Math.max(0, Math.ceil(D.duration - this.time)));
      var livesStr = "";
      for (var i = 0; i < D.lives; i++) livesStr += i < this.lives ? "♥" : "♡";
      document.getElementById("hud-lives").textContent = livesStr;
      var txt = "";
      if (this.score.combo >= 2) txt = "连击 ×" + this.score.combo;
      if (this.score.inMoonlight()) txt += " · 月华×2";
      if (this.score.inDash()) txt += " · 冲刺";
      document.getElementById("hud-combo").textContent = txt;
      var progress = Math.min(1, this.time / D.duration);
      YT.Render.drawMoonIcon(document.getElementById("hud-moon"), 0.15 + 0.85 * progress);
    },

    renderFrame: function () {
      var g = {
        dist: this.dist,
        time: this.time,
        progress: Math.min(1, this.time / D.duration),
        moonPhase: 0.15 + 0.85 * Math.min(1, this.time / D.duration),
        obstacles: this.obstacles,
        items: this.items,
        player: this.player,
        fx: this.fx,
        fixedVisual: this.mode === "adventure" ? D.levels[this.levelIdx].visual : null,
        eggShadowT: this.eggShadowT
      };
      YT.Render.drawBG(g);
      YT.Render.drawGround(g);
      YT.Render.drawWorld(g);
      if (this.egg && (this.egg.id === "change" || this.egg.id === "wugang")) {
        var p = 1 - this.egg.t / 2.6;
        var ex = YT.Render.W + 60 - p * (YT.Render.W + 260);
        YT.Render.ctx.globalAlpha = Math.min(1, this.egg.t);
        YT.Render.ctx.drawImage(YT.Sprites.egg(this.egg.id), ex, D.groundY - 420, 140, 180);
        YT.Render.ctx.globalAlpha = 1;
      }
    }
  };
})();
