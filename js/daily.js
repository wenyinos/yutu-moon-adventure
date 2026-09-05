// 本地每日挑战（V2）：YYYYMMDD 固定种子生成当日关卡，完全离线
(function () {
  var YT = (window.YT = window.YT || {});

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  YT.Daily = {
    today: function () {
      var d = new Date();
      return "" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    },

    seed: function (dateStr) {
      return parseInt(dateStr, 10) % 2147483647;
    },

    // 生成当日事件表：同一天内容固定
    schedule: function (dateStr) {
      var rng = YT.LCG(this.seed(dateStr));
      var events = [];
      var t = 2.2;
      while (t < 57) {
        var r = rng.next();
        if (r < 0.58) {
          events.push({
            t: t, kind: "items",
            arc: rng.next() < 0.45,
            n: rng.int(4, 7)
          });
        } else {
          var tr = rng.next();
          events.push({
            t: t, kind: "obstacle",
            type: tr < 0.4 ? "root" : tr < 0.75 ? "rock" : "cloud"
          });
        }
        // 间隔随进度缩短（难度渐升）
        var gap = rng.range(1.15, 1.75) * YT.lerp(1.1, 0.68, t / 60);
        t += gap;
      }
      return events;
    },

    isDone: function (dateStr) {
      return !!YT.Store.state.dailyDone[dateStr];
    },

    markDone: function (dateStr) {
      YT.Store.state.dailyDone[dateStr] = true;
      YT.Store.save();
    }
  };
})();
