// 启动入口
(function () {
  var YT = (window.YT = window.YT || {});

  YT.App = {
    fit: function () {
      YT.Render.resize(window.innerWidth, window.innerHeight);
      // 静止状态下重绘一帧，避免 resize 后黑屏
      if (YT.Game && (YT.Game.state === "COUNTDOWN" || YT.Game.state === "PAUSED" || YT.Game.state === "ENDING")) {
        YT.Game.renderFrame();
      }
    },

    boot: function () {
      YT.Store.load();
      YT.UI.init();
      YT.Game.init();

      var self = this;
      window.addEventListener("resize", function () { self.fit(); });
      window.addEventListener("orientationchange", function () {
        setTimeout(function () { self.fit(); }, 200);
      });
      this.fit();
      YT.UI.showScreen("title");

      // 主循环：dt 上限 50ms，切后台回来不会瞬移
      var last = 0;
      function loop(ts) {
        requestAnimationFrame(loop);
        var dt = Math.min((ts - last) / 1000, 0.05);
        last = ts;
        YT.Game.update(dt);
      }
      requestAnimationFrame(loop);
    }
  };

  YT.App.boot();
})();
