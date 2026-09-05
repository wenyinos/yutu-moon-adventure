// 计分系统：距离分 + 收集分 + 连击（月华/满月冲刺）+ 称号判定
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  YT.Score = function (skinMul, durMul) {
    this.score = 0;
    this.distance = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.counts = { mooncake: 0, osmanthus: 0, star: 0, moonorb: 0 };
    this.collisions = 0;
    this.moonlightT = 0; // 月华加成剩余
    this.dashT = 0;      // 满月冲刺剩余
    this.hadDash = false;
    this.skinMul = skinMul;
    this.durMul = durMul;
    this.events = [];    // 本局关键事件（成就用）
  };

  YT.Score.prototype = {
    addDistance: function (px) {
      this.distance += px;
      this.score += px * 0.02; // 距离分：每 100px 记 1 米 ×2 分
    },

    addCollect: function (type) {
      var base = D.items[type].score;
      var mul = this.skinMul.collect;
      if (type === "osmanthus") mul *= this.skinMul.osmanthus;
      if (this.moonlightT > 0) mul *= D.combo.moonlightMul;

      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      if (this.combo === D.combo.moonlightAt) {
        this.moonlightT = D.combo.moonlightDuration * this.durMul;
        this.events.push("combo5");
      }
      if (this.combo === D.combo.dashAt) {
        this.dashT = D.combo.dashDuration * this.durMul;
        this.hadDash = true;
        this.events.push("combo10");
      }

      this.counts[type]++;
      var gained = Math.round(base * mul);
      this.score += gained;
      return gained;
    },

    onHit: function () {
      this.combo = 0;
      this.collisions++;
      this.score -= D.penalty;
    },

    update: function (dt) {
      if (this.moonlightT > 0) this.moonlightT -= dt;
      if (this.dashT > 0) this.dashT -= dt;
    },

    inDash: function () { return this.dashT > 0; },
    inMoonlight: function () { return this.moonlightT > 0; },
    final: function () { return Math.max(0, Math.round(this.score)); }
  };

  // 称号判定（按优先级）
  YT.Score.titleFor = function (stats) {
    if (stats.collisions >= 3) return "lost_rabbit";
    if (stats.score >= 4000) return "moon_fairy";
    var c = stats.counts;
    var mx = Math.max(c.mooncake, c.osmanthus, c.star);
    if (mx > 0) {
      if (c.osmanthus === mx) return "osmanthus_fairy";
      if (c.mooncake === mx) return "mooncake_master";
    }
    if (stats.finished && stats.score < 1500) return "slacker";
    return "runner";
  };
})();
