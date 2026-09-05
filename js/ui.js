// UI 管理：屏幕切换 / 主页动画 / 各二级页渲染 / Toast
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  var rabbitAnim = { t: 0, raf: null };

  YT.UI = {
    init: function () {
      var self = this;

      // 主页按钮
      document.getElementById("btn-start").addEventListener("click", function () {
        YT.Audio.ensure();
        YT.Audio.sfx("click");
        YT.Game.start({ mode: "classic" });
      });
      document.getElementById("btn-map").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.renderMap();
        self.showScreen("map");
      });
      document.getElementById("btn-daily").addEventListener("click", function () {
        YT.Audio.ensure();
        YT.Audio.sfx("click");
        if (YT.Daily.isDone(YT.Daily.today())) self.toast("今日挑战已完成，可再刷分");
        YT.Game.start({ mode: "daily" });
      });
      document.getElementById("btn-hut").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.renderHut();
        self.showScreen("hut");
      });
      document.getElementById("btn-ach").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.renderAch();
        self.showScreen("ach");
      });
      document.getElementById("btn-rank").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.renderRank();
        self.showScreen("rank");
      });
      document.getElementById("btn-help").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.renderHelp();
        self.showScreen("help");
      });
      document.getElementById("btn-about").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.renderAbout();
        self.showScreen("about");
      });
      document.getElementById("btn-sound").addEventListener("click", function () {
        var on = !(YT.Store.state.settings.music || YT.Store.state.settings.sfx);
        YT.Audio.setMusic(on);
        YT.Audio.setSfx(on);
        self.refreshSound();
        YT.Audio.sfx("click");
      });

      // 返回按钮
      [["btn-map-back"], ["btn-hut-back"], ["btn-ach-back"], ["btn-rank-back"], ["btn-about-back"], ["btn-help-back"]].forEach(function (id) {
        document.getElementById(id[0]).addEventListener("click", function () {
          YT.Audio.sfx("click");
          self.showScreen("title");
        });
      });

      // 主页星星
      var wrap = document.getElementById("title-stars");
      for (var i = 0; i < 26; i++) {
        var sp = document.createElement("div");
        sp.className = "title-star";
        sp.style.left = (Math.random() * 100) + "%";
        sp.style.top = (Math.random() * 46) + "%";
        sp.style.animationDelay = (Math.random() * 2.4) + "s";
        wrap.appendChild(sp);
      }

      // 结果页按钮
      document.getElementById("btn-again").addEventListener("click", function () {
        YT.Audio.sfx("click");
        YT.Game.restart();
      });
      document.getElementById("btn-card-next").addEventListener("click", function () {
        YT.Result.nextTemplate();
      });
      document.getElementById("btn-save").addEventListener("click", function () {
        YT.Result.save();
      });
      document.getElementById("btn-publish").addEventListener("click", function () {
        YT.Result.publish();
      });
      document.getElementById("btn-home").addEventListener("click", function () {
        YT.Audio.sfx("click");
        self.showScreen("title");
      });

      this.refreshTitle();
      this.refreshSound();
    },

    showScreen: function (name) {
      var screens = document.querySelectorAll(".screen");
      for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove("active");
      }
      document.getElementById("screen-" + name).classList.add("active");
      if (name === "title") {
        this.refreshTitle();
        this.startRabbit();
      } else {
        this.stopRabbit();
      }
    },

    toast: function (msg) {
      var wrap = document.getElementById("toast-wrap");
      var t = document.createElement("div");
      t.className = "toast";
      t.textContent = msg;
      wrap.appendChild(t);
      setTimeout(function () {
        if (t.parentNode) wrap.removeChild(t);
      }, 2400);
    },

    buffTip: function (text) {
      var el = document.getElementById("buff-tip");
      el.textContent = text;
      el.classList.add("show");
      clearTimeout(this._bt);
      this._bt = setTimeout(function () { el.classList.remove("show"); }, 1400);
    },

    refreshTitle: function () {
      document.getElementById("title-best-score").textContent = YT.Store.state.bestScore;
    },

    refreshSound: function () {
      var s = YT.Store.state.settings;
      document.getElementById("btn-sound").textContent =
        s.music || s.sfx ? "音" : "静";
    },

    // ---------- 主页玉兔动画 ----------
    startRabbit: function () {
      if (rabbitAnim.raf) return;
      var cv = document.getElementById("title-rabbit");
      var x = cv.getContext("2d");
      var self = this;
      var last = 0;
      function loop(ts) {
        rabbitAnim.raf = requestAnimationFrame(loop);
        if (ts - last < 33) return; // 30fps 足够
        last = ts;
        if (!document.getElementById("screen-title").classList.contains("active")) {
          self.stopRabbit();
          return;
        }
        rabbitAnim.t += 0.1;
        x.clearRect(0, 0, 300, 300);
        var f = ["run1", "run2", "run3"][Math.floor(rabbitAnim.t) % 3];
        x.drawImage(YT.Sprites.rabbit(f, YT.Skins.current()), 40, 50, 220, 220);
      }
      rabbitAnim.raf = requestAnimationFrame(loop);
    },

    stopRabbit: function () {
      if (rabbitAnim.raf) {
        cancelAnimationFrame(rabbitAnim.raf);
        rabbitAnim.raf = null;
      }
    },

    // ---------- 冒险地图 ----------
    renderMap: function () {
      var s = YT.Store.state;
      var list = document.getElementById("map-list");
      list.innerHTML = "";
      D.levels.forEach(function (lv, i) {
        var locked = i > s.mapProgress;
        var current = i === s.mapProgress;
        var node = document.createElement("button");
        node.className = "map-node" + (locked ? " locked" : "") + (current ? " current" : "");
        var idx = document.createElement("div");
        idx.className = "map-idx";
        idx.textContent = i + 1;
        var main = document.createElement("div");
        var name = document.createElement("div");
        name.className = "map-name";
        name.textContent = lv.name;
        var goal = document.createElement("div");
        goal.className = "map-goal";
        goal.textContent = locked ? "通关上一关解锁" : "目标 " + lv.goal + " 分 · 60 秒";
        main.appendChild(name);
        main.appendChild(goal);
        var flag = document.createElement("div");
        flag.className = "map-flag";
        flag.textContent = i < s.mapProgress ? "通" : current ? "行" : "锁";
        node.appendChild(idx);
        node.appendChild(main);
        node.appendChild(flag);
        if (!locked) {
          node.addEventListener("click", function () {
            YT.Audio.ensure();
            YT.Audio.sfx("click");
            YT.Game.start({ mode: "adventure", levelIdx: i });
          });
        }
        list.appendChild(node);
      });
    },

    // ---------- 玉兔小屋 ----------
    renderHut: function () {
      var s = YT.Store.state;
      var self = this;
      var grid = document.getElementById("skin-grid");
      grid.innerHTML = "";
      D.skins.forEach(function (sk) {
        var unlocked = YT.Skins.isUnlocked(sk.id);
        var selected = YT.Skins.current() === sk.id;
        var card = document.createElement("div");
        card.className = "card" + (selected ? " selected" : "") + (unlocked ? "" : " locked");
        var cv = document.createElement("canvas");
        cv.width = 128; cv.height = 128;
        cv.getContext("2d").drawImage(YT.Sprites.rabbit("run2", sk.id), 16, 16, 96, 96);
        var name = document.createElement("div");
        name.className = "card-name";
        name.textContent = sk.name;
        var desc = document.createElement("div");
        desc.className = "card-desc";
        desc.textContent = sk.desc;
        var state = document.createElement("div");
        state.className = "card-state";
        if (selected) state.textContent = "使用中";
        else if (unlocked) state.textContent = "点击使用";
        else state.textContent = "进度 " + Math.min(YT.Skins.progress(sk.id), sk.unlock.value) + "/" + sk.unlock.value;
        card.appendChild(cv);
        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(state);
        card.addEventListener("click", function () {
          YT.Audio.sfx("click");
          if (unlocked) {
            YT.Skins.setCurrent(sk.id);
            self.renderHut();
          } else {
            self.toast("还差一点就解锁「" + sk.name + "」啦");
          }
        });
        grid.appendChild(card);
      });

      var sgrid = document.getElementById("skill-grid");
      sgrid.innerHTML = "";
      D.skills.forEach(function (sk) {
        var unlocked = YT.Skills.isUnlocked(sk.id);
        var enabled = s.enabledSkills.indexOf(sk.id) >= 0;
        var card = document.createElement("div");
        card.className = "card" + (enabled && sk.active ? " selected" : "") + (unlocked ? "" : " locked");
        var name = document.createElement("div");
        name.className = "card-name";
        name.textContent = sk.name + (sk.active ? "" : "（被动）");
        var desc = document.createElement("div");
        desc.className = "card-desc";
        desc.textContent = sk.desc;
        var state = document.createElement("div");
        state.className = "card-state";
        if (!unlocked) state.textContent = "进度 " + Math.min(YT.Skills.progress(sk.id), sk.unlock.value) + "/" + sk.unlock.value;
        else if (!sk.active) state.textContent = "已生效";
        else state.textContent = enabled ? "已启用（点击停用）" : "点击启用";
        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(state);
        if (unlocked) {
          card.addEventListener("click", function () {
            YT.Audio.sfx("click");
            YT.Skills.toggle(sk.id);
            self.renderHut();
          });
        }
        sgrid.appendChild(card);
      });
    },

    // ---------- 成就 ----------
    renderAch: function () {
      var s = YT.Store.state;
      var list = document.getElementById("ach-list");
      list.innerHTML = "";
      D.achievements.forEach(function (a) {
        var done = s.achievements.indexOf(a.id) >= 0;
        var item = document.createElement("div");
        item.className = "ach-item" + (done ? " done" : "");
        var dot = document.createElement("div");
        dot.className = "ach-dot";
        dot.textContent = done ? "✓" : "?";
        var main = document.createElement("div");
        var name = document.createElement("div");
        name.className = "ach-name";
        name.textContent = a.name;
        var desc = document.createElement("div");
        desc.className = "ach-desc";
        desc.textContent = a.desc;
        main.appendChild(name);
        main.appendChild(desc);
        item.appendChild(dot);
        item.appendChild(main);
        list.appendChild(item);
      });
    },

    // ---------- 玩法简介 ----------
    renderHelp: function () {
      var list = document.getElementById("help-list");
      list.innerHTML = "";

      function heart(x) {
        x.fillStyle = "#ff5f7a";
        x.beginPath();
        x.arc(30, 36, 16, Math.PI, 0);
        x.arc(58, 36, 16, Math.PI, 0);
        x.lineTo(44, 72);
        x.closePath();
        x.fill();
      }

      var entries = [
        {
          icon: function (x) { x.drawImage(YT.Sprites.rabbit("jump", YT.Skins.current()), 0, 0, 88, 88); },
          name: "点击跳跃",
          desc: "点击屏幕起跳，松手提前收势就是小跳；玉兔自动奔跑，专注节奏就好。"
        },
        {
          icon: function (x) { x.drawImage(YT.Sprites.item("mooncake"), 8, 8, 72, 72); },
          name: "收集道具",
          desc: "月饼 +10、桂花 +20、星星 +30、月光球 +50；收集越多，得分越高。"
        },
        {
          icon: function (x) { x.drawImage(YT.Sprites.obstacle("rock"), 6, 0, 76, 87); },
          name: "躲开障碍",
          desc: "树根和石块要跳过去；低垂的云恰好悬在跳跃高度，看清时机别乱跳。"
        },
        {
          icon: heart,
          name: "三颗生命",
          desc: "碰撞扣 1 颗心并清空连击；心用完，这一局就提前结束。"
        },
        {
          icon: function (x) { x.drawImage(YT.Sprites.item("star"), 8, 8, 72, 72); },
          name: "连击奖励",
          desc: "连击 ×5 触发月华加成，收集分翻倍；×10 触发满月冲刺，短暂无敌加速。"
        },
        {
          icon: function (x) { x.drawImage(YT.Sprites.moon(1), 8, 8, 72, 72); },
          name: "奔向满月",
          desc: "60 秒内月相渐满、场景变换；跑完按表现获得中秋称号，生成结果卡分享。"
        }
      ];

      entries.forEach(function (e) {
        var item = document.createElement("div");
        item.className = "help-item";
        var icon = document.createElement("canvas");
        icon.className = "help-icon";
        icon.width = 88;
        icon.height = 88;
        e.icon(icon.getContext("2d"));
        var main = document.createElement("div");
        var name = document.createElement("div");
        name.className = "help-name";
        name.textContent = e.name;
        var desc = document.createElement("div");
        desc.className = "help-desc";
        desc.textContent = e.desc;
        main.appendChild(name);
        main.appendChild(desc);
        item.appendChild(icon);
        item.appendChild(main);
        list.appendChild(item);
      });
    },

    // ---------- 关于 ----------
    renderAbout: function () {
      var cv = document.getElementById("about-rabbit");
      var x = cv.getContext("2d");
      x.clearRect(0, 0, 128, 128);
      x.drawImage(YT.Sprites.rabbit("run2", YT.Skins.current()), 16, 16, 96, 96);
    },

    // ---------- 排行榜 ----------
    renderRank: function () {
      var s = YT.Store.state;
      var list = document.getElementById("rank-list");
      list.innerHTML = "";
      if (!s.leaderboard.length) {
        var empty = document.createElement("div");
        empty.className = "rank-empty";
        empty.textContent = "还没有记录，快去奔月吧";
        list.appendChild(empty);
        return;
      }
      s.leaderboard.forEach(function (r, i) {
        var item = document.createElement("div");
        item.className = "rank-item";
        var idx = document.createElement("div");
        idx.className = "rank-idx";
        idx.textContent = i + 1;
        var main = document.createElement("div");
        main.className = "rank-main";
        var score = document.createElement("div");
        score.className = "rank-score";
        score.textContent = r.score + " 分";
        var meta = document.createElement("div");
        meta.className = "rank-meta";
        var modeName = r.mode === "daily" ? "每日" : r.mode === "adventure" ? "冒险" : "经典";
        meta.textContent = modeName + " · " + r.date;
        main.appendChild(score);
        main.appendChild(meta);
        item.appendChild(idx);
        item.appendChild(main);
        list.appendChild(item);
      });
    }
  };
})();
