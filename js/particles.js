// 粒子特效：星屑爆发 / 落地尘 / 冲刺拖尾 / 烟花 / 桂花雨 / 受击闪
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  YT.FX = function () {
    this.list = [];
    this.rain = [];
    this.flash = 0;
    this.rainRate = 0;
  };

  YT.FX.prototype = {
    add: function (p) { if (this.list.length < 140) this.list.push(p); },

    burst: function (x, y, color, n) {
      for (var i = 0; i < (n || 8); i++) {
        var a = Math.random() * Math.PI * 2;
        var v = YT.rand(120, 320);
        this.add({
          x: x, y: y,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
          life: YT.rand(0.35, 0.6), max: 0.6,
          size: YT.rand(3, 6), color: color, grav: 500, star: Math.random() < 0.4
        });
      }
    },

    dust: function (x, y) {
      for (var i = 0; i < 5; i++) {
        this.add({
          x: x + YT.rand(-14, 14), y: y,
          vx: YT.rand(-70, 70), vy: YT.rand(-90, -20),
          life: 0.35, max: 0.35, size: YT.rand(3, 6),
          color: "rgba(220,220,240,0.7)", grav: 300, star: false
        });
      }
    },

    trail: function (x, y) {
      this.add({
        x: x + YT.rand(-10, 10), y: y + YT.rand(-26, 26),
        vx: YT.rand(-30, 30), vy: YT.rand(-30, 30),
        life: 0.4, max: 0.4, size: YT.rand(4, 9),
        color: "rgba(255,217,138,0.8)", grav: 0, star: true
      });
    },

    firework: function (x, y) {
      var colors = ["#ffd98a", "#ff8a9c", "#a0c8ff", "#f5c95c"];
      for (var i = 0; i < 26; i++) {
        var a = Math.random() * Math.PI * 2;
        var v = YT.rand(150, 420);
        this.add({
          x: x, y: y,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          life: YT.rand(0.6, 1.1), max: 1.1,
          size: YT.rand(2.5, 5), color: YT.pick(colors), grav: 260, star: true
        });
      }
    },

    update: function (dt) {
      var keep = [];
      for (var i = 0; i < this.list.length; i++) {
        var p = this.list[i];
        p.life -= dt;
        if (p.life <= 0) continue;
        p.vy += (p.grav || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        keep.push(p);
      }
      this.list = keep;

      // 桂花雨
      if (this.rainRate > 0 && this.rain.length < 22 && Math.random() < this.rainRate * dt * 8) {
        this.rain.push({
          x: Math.random() * (YT.Render ? YT.Render.W + 100 : 800),
          y: -20,
          vy: YT.rand(70, 130),
          rot: Math.random() * Math.PI,
          vr: YT.rand(-2, 2),
          size: YT.rand(4, 8)
        });
      }
      var keepR = [];
      for (var j = 0; j < this.rain.length; j++) {
        var r = this.rain[j];
        r.y += r.vy * dt;
        r.rot += r.vr * dt;
        if (r.y < D.groundY + 10) keepR.push(r);
      }
      this.rain = keepR;

      if (this.flash > 0) this.flash -= dt;
    },

    draw: function (ctx) {
      var i, p;
      for (i = 0; i < this.list.length; i++) {
        p = this.list[i];
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        if (p.star) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * 6);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (p.life / p.max), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // 桂花瓣
      ctx.fillStyle = "rgba(245,201,92,0.85)";
      for (i = 0; i < this.rain.length; i++) {
        var r = this.rain[i];
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, r.size, r.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 受击红闪
      if (this.flash > 0) {
        ctx.fillStyle = "rgba(255,70,90," + (this.flash * 0.35) + ")";
        ctx.fillRect(0, 0, YT.Render.W, YT.Render.H);
      }
    },

    clear: function () { this.list = []; this.rain = []; this.flash = 0; this.rainRate = 0; }
  };
})();
