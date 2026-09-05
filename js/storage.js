// 本地存储封装（localStorage，容器按小工具隔离，不保证永久持久）
(function () {
  var YT = (window.YT = window.YT || {});
  var KEY = "yutu_benyue_save_v1";

  var DEFAULTS = {
    bestScore: 0,
    totalGames: 0,
    totalMooncakes: 0,
    totalOsmanthus: 0,
    totalStars: 0,
    totalMoonlight: 0,
    totalCollect: 0,
    unlockedTitles: [],
    unlockedSkins: ["white"],
    currentSkin: "white",
    unlockedSkills: [],
    enabledSkills: [],
    achievements: [],
    leaderboard: [],
    dailyDone: {},
    mapProgress: 0,          // 已通关的关卡数（0~5）
    lastPhaseReached: 0,     // 连续进月宫成就用
    lastPhaseStreak: 0,
    settings: { music: true, sfx: true }
  };

  var state = null;

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    var saved = null;
    if (raw) {
      try { saved = JSON.parse(raw); } catch (e) { saved = null; }
    }
    state = merge(DEFAULTS, saved || {});
    return state;
  }

  function merge(base, over) {
    var out = {};
    for (var k in base) {
      if (!base.hasOwnProperty(k)) continue;
      if (base[k] && typeof base[k] === "object" && !(base[k] instanceof Array)) {
        out[k] = merge(base[k], over && over[k] ? over[k] : {});
      } else {
        out[k] = over && over.hasOwnProperty(k) ? over[k] : base[k];
      }
    }
    return out;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 隐私模式下静默 */ }
  }

  function addScoreRecord(rec) {
    var list = state.leaderboard || [];
    list.push(rec);
    list.sort(function (a, b) { return b.score - a.score; });
    state.leaderboard = list.slice(0, 5);
    save();
  }

  YT.Store = {
    load: load,
    save: save,
    addScoreRecord: addScoreRecord,
    get state() { return state; }
  };
})();
