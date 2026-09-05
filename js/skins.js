// 皮肤系统（V2）：本地解锁 + 数值加成
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  function progressOf(unlock) {
    if (!unlock) return 1;
    var s = YT.Store.state;
    return s[unlock.type] || 0;
  }

  YT.Skins = {
    defs: D.skins,

    isUnlocked: function (id) {
      return YT.Store.state.unlockedSkins.indexOf(id) >= 0;
    },

    progress: function (id) {
      for (var i = 0; i < D.skins.length; i++) {
        if (D.skins[i].id === id) return progressOf(D.skins[i].unlock);
      }
      return 0;
    },

    checkUnlocks: function (toastFn) {
      var s = YT.Store.state;
      for (var i = 0; i < D.skins.length; i++) {
        var sk = D.skins[i];
        if (sk.unlock && !this.isUnlocked(sk.id) && progressOf(sk.unlock) >= sk.unlock.value) {
          s.unlockedSkins.push(sk.id);
          YT.Store.save();
          if (toastFn) toastFn("新皮肤解锁 · " + sk.name);
          YT.Audio.sfx("achieve");
        }
      }
    },

    current: function () {
      var id = YT.Store.state.currentSkin;
      return this.isUnlocked(id) ? id : "white";
    },

    setCurrent: function (id) {
      if (this.isUnlocked(id)) {
        YT.Store.state.currentSkin = id;
        YT.Store.save();
      }
    },

    // 数值加成
    muls: function (id) {
      return {
        collect: id === "gold" ? 1.2 : 1,
        osmanthus: id === "osmanthus" ? 1.5 : 1,
        dur: id === "lunar" ? 1.5 : 1
      };
    }
  };
})();
