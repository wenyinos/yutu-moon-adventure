// 结果页：数据结算 + Canvas 分享卡（4 模板）+ 保存/发布
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  // 固定伪随机（同一局重绘卡片内容不跳变）
  function seededRand(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function titleDef(id) {
    for (var i = 0; i < D.titles.length; i++) {
      if (D.titles[i].id === id) return D.titles[i];
    }
    return D.titles[D.titles.length - 1];
  }

  function modeLabel(stats) {
    if (stats.mode === "daily") return "每日挑战";
    if (stats.mode === "adventure") return "冒险 · " + D.levels[stats.levelIdx].name;
    return "经典奔月";
  }

  YT.Result = {
    stats: null,
    title: "runner",
    tplIdx: 0,
    templates: ["score", "title", "collect", "fun"],
    saving: false,

    canvas: function () { return document.getElementById("result-card"); },

    // ---------- 结算：更新本地数据并展示 ----------
    finish: function (stats) {
      var s = YT.Store.state;
      var toasts = [];
      function toast(m) { toasts.push(m); }

      var newBest = stats.score > s.bestScore;
      if (newBest) s.bestScore = stats.score;
      s.totalGames++;
      s.totalMooncakes += stats.counts.mooncake;
      s.totalOsmanthus += stats.counts.osmanthus;
      s.totalStars += stats.counts.star;
      s.totalMoonlight += stats.counts.moonorb;
      s.totalCollect += stats.counts.mooncake + stats.counts.osmanthus + stats.counts.star + stats.counts.moonorb;

      var title = YT.Score.titleFor(stats);
      this.title = title;
      if (s.unlockedTitles.indexOf(title) < 0) {
        s.unlockedTitles.push(title);
        toast("新称号 · " + titleDef(title).name);
      }

      s.lastPhaseStreak = stats.phaseReached >= 2 ? s.lastPhaseStreak + 1 : 0;

      if (stats.mode === "adventure" && stats.levelPass) {
        s.mapProgress = Math.max(s.mapProgress, stats.levelIdx + 1);
      }
      if (stats.mode === "daily" && stats.dailyPass) {
        YT.Daily.markDone(YT.Daily.today());
      }

      YT.Store.save();
      YT.Ach.checkEnd(stats, toast);
      YT.Skins.checkUnlocks(toast);
      YT.Skills.checkUnlocks(toast);

      var rankPos = null;
      var list = s.leaderboard;
      var willEnter = list.length < 5 || stats.score > list[list.length - 1].score;
      YT.Store.addScoreRecord({
        score: stats.score, title: title,
        date: YT.Daily.today(), mode: stats.mode
      });
      for (var i = 0; i < s.leaderboard.length; i++) {
        if (s.leaderboard[i].score === stats.score) { rankPos = i + 1; break; }
      }

      this.stats = stats;
      // 趣味型模板：迷路兔/摸鱼兔时默认展示
      this.tplIdx = (title === "lost_rabbit" || title === "slacker") ? 3 : 0;

      this.renderInfo(newBest, rankPos, willEnter);
      YT.UI.showScreen("result");
      this.drawCard();
      for (var j = 0; j < toasts.length; j++) YT.UI.toast(toasts[j]);
      if (newBest && stats.score > 0) YT.UI.toast("新纪录！最高分 " + stats.score);
    },

    renderInfo: function (newBest, rankPos, willEnter) {
      var stats = this.stats;
      var td = titleDef(this.title);
      document.getElementById("result-score-line").textContent =
        "得分 " + stats.score + " · 历史最高 " + YT.Store.state.bestScore + " · " + modeLabel(stats);
      document.getElementById("result-title-line").textContent = "「" + td.name + "」";
      document.getElementById("result-quote").textContent = td.text;

      var extra = [];
      if (stats.mode === "adventure") {
        extra.push(stats.levelPass ? "通关成功，下一站已解锁" : "未达目标 " + D.levels[stats.levelIdx].goal + " 分，再试一次");
      }
      if (stats.mode === "daily") {
        extra.push(stats.dailyPass ? "今日挑战完成！" : "目标 " + D.dailyGoal + " 分，明天还能再来");
      }
      if (rankPos) extra.push("上榜第 " + rankPos + " 名");
      if (stats.eggs.length) {
        for (var i = 0; i < stats.eggs.length; i++) extra.push(stats.eggs[i].text);
      }
      document.getElementById("result-extra").textContent = extra.join("  ");
    },

    // ---------- 分享卡 ----------
    nextTemplate: function () {
      this.tplIdx = (this.tplIdx + 1) % this.templates.length;
      YT.Audio.sfx("click");
      this.drawCard();
    },

    drawCard: function () {
      var canvas = this.canvas();
      canvas.width = 1080;
      canvas.height = 1920;
      var x = canvas.getContext("2d");
      var stats = this.stats;
      var td = titleDef(this.title);
      var tpl = this.templates[this.tplIdx];
      var rnd = seededRand(stats.score * 7 + this.tplIdx + 13);

      // 背景
      var g = x.createLinearGradient(0, 0, 0, 1920);
      g.addColorStop(0, "#0c0f2e");
      g.addColorStop(0.55, "#221d55");
      g.addColorStop(1, "#4a3524");
      x.fillStyle = g;
      x.fillRect(0, 0, 1080, 1920);

      // 星星
      for (var i = 0; i < 46; i++) {
        x.globalAlpha = 0.3 + rnd() * 0.6;
        x.fillStyle = "#fff";
        x.beginPath();
        x.arc(rnd() * 1080, rnd() * 900, 1.5 + rnd() * 2.2, 0, Math.PI * 2);
        x.fill();
      }
      x.globalAlpha = 1;

      // 满月
      var mx = 540, my = 360, mr = 185;
      var glow = x.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2.3);
      glow.addColorStop(0, "rgba(247,232,192,0.45)");
      glow.addColorStop(1, "rgba(247,232,192,0)");
      x.fillStyle = glow;
      x.fillRect(mx - mr * 2.4, my - mr * 2.4, mr * 4.8, mr * 4.8);
      x.drawImage(YT.Sprites.moon(1), mx - mr, my - mr, mr * 2, mr * 2);

      // 桂花瓣
      x.fillStyle = "rgba(245,201,92,0.8)";
      for (var p = 0; p < 12; p++) {
        var px = rnd() * 1080, py = 500 + rnd() * 1300;
        x.save();
        x.translate(px, py);
        x.rotate(rnd() * Math.PI);
        x.beginPath();
        x.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2);
        x.fill();
        x.restore();
      }

      // 标题
      x.textAlign = "center";
      x.font = "800 96px 'PingFang SC','Microsoft YaHei',sans-serif";
      var tg = x.createLinearGradient(0, 640, 0, 740);
      tg.addColorStop(0, "#fdf6dd");
      tg.addColorStop(1, "#ecc66f");
      x.fillStyle = tg;
      x.strokeStyle = "rgba(74,46,10,0.6)";
      x.lineWidth = 3;
      x.fillText("玉 兔 奔 月", 540, 716);
      x.font = "34px 'PingFang SC',sans-serif";
      x.fillStyle = "#c9c2e6";
      x.fillText("月 宫 大 冒 险 · " + modeLabel(stats), 540, 782);

      // 主内容区
      x.textAlign = "center";
      if (tpl === "score") {
        x.font = "800 190px 'PingFang SC',sans-serif";
        x.fillStyle = "#ffe9b0";
        x.shadowColor = "rgba(255,217,138,0.7)";
        x.shadowBlur = 40;
        x.fillText(String(stats.score), 540, 1090);
        x.shadowBlur = 0;
        x.font = "52px 'PingFang SC',sans-serif";
        x.fillStyle = "#d8d0f0";
        x.fillText("分", 540, 1180);
      } else if (tpl === "title") {
        x.font = "800 120px 'PingFang SC',sans-serif";
        x.fillStyle = "#ffd98a";
        x.shadowColor = "rgba(255,217,138,0.6)";
        x.shadowBlur = 30;
        x.fillText("「" + td.name + "」", 540, 1060);
        x.shadowBlur = 0;
        x.font = "40px 'PingFang SC',sans-serif";
        x.fillStyle = "#d8d0f0";
        x.fillText(td.text, 540, 1150);
      } else if (tpl === "collect") {
        x.font = "800 150px 'PingFang SC',sans-serif";
        x.fillStyle = "#ffe9b0";
        x.fillText(String(stats.counts.mooncake), 540, 1080);
        x.font = "48px 'PingFang SC',sans-serif";
        x.fillStyle = "#d8d0f0";
        x.fillText("个月饼收入囊中", 540, 1170);
      } else {
        x.font = "800 84px 'PingFang SC',sans-serif";
        x.fillStyle = "#ffd98a";
        x.fillText(td.name, 540, 1020);
        x.font = "44px 'PingFang SC',sans-serif";
        x.fillStyle = "#d8d0f0";
        x.fillText(td.text, 540, 1110);
      }

      // 统计行
      var items = ["mooncake", "osmanthus", "star"];
      var bx = 330;
      for (var k = 0; k < items.length; k++) {
        var img = YT.Sprites.item(items[k]);
        x.drawImage(img, bx - 30, 1290, 60, 60);
        x.font = "38px 'PingFang SC',sans-serif";
        x.fillStyle = "#f0e8d0";
        x.textAlign = "left";
        x.fillText("×" + stats.counts[items[k]], bx + 40, 1332);
        bx += 240;
      }
      x.textAlign = "center";
      x.font = "32px 'PingFang SC',sans-serif";
      x.fillStyle = "#9a8fc9";
      x.fillText("最高连击 ×" + stats.maxCombo + " · 碰撞 " + stats.collisions + " 次", 540, 1430);

      // 玉兔
      var rb = YT.Sprites.rabbit("jump", stats.skin);
      x.drawImage(rb, 540 - 110, 1480, 220, 220);

      // 底部
      var slogan = D.cardSlogans[stats.score % D.cardSlogans.length];
      x.font = "46px 'PingFang SC',sans-serif";
      x.fillStyle = "#fff3d0";
      x.fillText(slogan, 540, 1800);
      x.font = "30px 'PingFang SC',sans-serif";
      x.fillStyle = "rgba(220,210,245,0.6)";
      var dt = new Date();
      x.fillText("中秋快乐 · 玉兔奔月 · " + dt.getFullYear() + "." + (dt.getMonth() + 1) + "." + dt.getDate(), 540, 1862);
    },

    // ---------- 保存 / 发布 ----------
    save: function () {
      if (this.saving) return;
      this.saving = true;
      YT.Audio.sfx("click");
      var self = this;
      YT.XHS.saveImage(this.canvas(),
        function () {
          self.saving = false;
          YT.Audio.sfx("save");
          YT.UI.toast(YT.XHS.available() ? "已保存到相册" : "已开始下载图片");
        },
        function (e) {
          self.saving = false;
          YT.UI.toast(e && e.message ? e.message : "保存失败，请重试");
        }
      );
    },

    publish: function () {
      if (this.saving) return;
      this.saving = true;
      YT.Audio.sfx("click");
      var self = this;
      var td = titleDef(this.title);
      var stats = this.stats;
      YT.XHS.publish(this.canvas(), {
        title: D.publish.title,
        content: D.publish.content + " 我拿到了 " + stats.score + " 分，称号「" + td.name + "」。",
        tags: D.publish.tags
      },
        function () {
          self.saving = false;
          YT.UI.toast("已唤起发布页，去发布吧！");
        },
        function (e) {
          self.saving = false;
          YT.UI.toast(e && e.message ? e.message : "发布失败，请重试");
        }
      );
    }
  };
})();
