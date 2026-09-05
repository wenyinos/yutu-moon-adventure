// 成就系统（V2）：全部本地判定
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  function def(id) {
    for (var i = 0; i < D.achievements.length; i++) {
      if (D.achievements[i].id === id) return D.achievements[i];
    }
    return null;
  }

  YT.Ach = {
    defs: D.achievements,

    has: function (id) {
      return YT.Store.state.achievements.indexOf(id) >= 0;
    },

    unlock: function (id, toastFn) {
      if (this.has(id)) return false;
      YT.Store.state.achievements.push(id);
      YT.Store.save();
      var d = def(id);
      if (toastFn && d) toastFn("成就解锁 · " + d.name);
      YT.Audio.sfx("achieve");
      return true;
    },

    // 局结束时统一判定
    checkEnd: function (stats, toastFn) {
      var s = YT.Store.state;
      if (s.totalGames >= 1) this.unlock("first_flight", toastFn);
      if (s.totalGames >= 10) this.unlock("games_10", toastFn);
      if (stats.score >= 3000) this.unlock("score_break", toastFn);
      if (stats.maxCombo >= 10) this.unlock("combo_master", toastFn);
      if (stats.collisions === 0 && stats.finished) this.unlock("flawless", toastFn);
      if (stats.phaseReached >= 3) this.unlock("fullmoon_arriver", toastFn);
      if (stats.hadDash) this.unlock("fullmoon_promise", toastFn);
      if (s.totalMooncakes >= 100) this.unlock("mooncake_collector", toastFn);
      if (s.totalOsmanthus >= 80) this.unlock("osmanthus_collector", toastFn);
      if (s.lastPhaseStreak >= 3) this.unlock("old_driver", toastFn);
    }
  };
})();
