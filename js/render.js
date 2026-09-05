// 渲染层：双层 Canvas（背景层 + 游戏层），逻辑高度固定 1334
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  // 阶段色板：天空顶/底、地面主/边
  var SKY = [
    { top: [12, 16, 48], bot: [29, 43, 94] },
    { top: [14, 20, 64], bot: [42, 63, 125] },
    { top: [19, 16, 72], bot: [58, 47, 110] },
    { top: [25, 18, 64], bot: [74, 53, 32] }
  ];
  var PATTERN_NAMES = ["trees", "hills", "palace", "deity"];

  var stars = [];
  for (var si = 0; si < 80; si++) {
    stars.push({ x: Math.random() * 2000, y: Math.random() * 720, r: YT.rand(0.5, 1.8), tw: YT.rand(1, 3) });
  }

  function phaseInfo(g) {
    var f;
    if (g.fixedVisual != null) f = g.fixedVisual;
    else f = Math.min(g.time / D.phaseDuration, 3.999);
    var i0 = Math.floor(f);
    var i1 = Math.min(3, i0 + 1);
    var t = f - i0;
    // 过渡只发生在窗口后 30%
    var k = t < 0.7 ? 0 : (t - 0.7) / 0.3;
    return { i0: i0, i1: i1, k: k };
  }

  function mix(a, b, k) {
    return [
      Math.round(YT.lerp(a[0], b[0], k)),
      Math.round(YT.lerp(a[1], b[1], k)),
      Math.round(YT.lerp(a[2], b[2], k))
    ];
  }
  function rgb(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }

  YT.Render = {
    W: 640,
    H: 1334,
    scale: 1,
    dpr: 1,

    init: function (bgC, gameC) {
      this.bg = bgC;
      this.gameC = gameC;
      this.bgCtx = bgC.getContext("2d");
      this.ctx = gameC.getContext("2d");
    },

    resize: function (cssW, cssH) {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.scale = cssH / 1334;
      this.W = cssW / this.scale;
      this.H = 1334;
      this.bg.width = Math.ceil(cssW * this.dpr);
      this.bg.height = Math.ceil(cssH * this.dpr);
      this.gameC.width = this.bg.width;
      this.gameC.height = this.bg.height;
      var t = this.dpr * this.scale;
      this.bgCtx.setTransform(t, 0, 0, t, 0, 0);
      this.ctx.setTransform(t, 0, 0, t, 0, 0);
    },

    // ---------- 背景层 ----------
    drawBG: function (g) {
      var ctx = this.bgCtx;
      var W = this.W, H = this.H;
      var pi = phaseInfo(g);

      // 天空
      var top = mix(SKY[pi.i0].top, SKY[pi.i1].top, pi.k);
      var bot = mix(SKY[pi.i0].bot, SKY[pi.i1].bot, pi.k);
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, rgb(top));
      grad.addColorStop(1, rgb(bot));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 星星（慢视差）
      var sx;
      ctx.fillStyle = "#fff";
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        sx = (s.x - g.dist * 0.05) % 2000;
        if (sx < 0) sx += 2000;
        if (sx > W + 20) continue;
        ctx.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(g.time * s.tw + s.x));
        ctx.beginPath();
        ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 月亮：升高、变大、月相渐满
      var mx = W * 0.7;
      var my = 520 - g.progress * 280;
      var mr = 52 + g.progress * 42;
      var glow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2.2);
      glow.addColorStop(0, "rgba(247,232,192,0.4)");
      glow.addColorStop(1, "rgba(247,232,192,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(mx - mr * 2.4, my - mr * 2.4, mr * 4.8, mr * 4.8);
      var moonImg = YT.Sprites.moon(g.moonPhase);
      ctx.drawImage(moonImg, mx - mr, my - mr, mr * 2, mr * 2);
      if (g.eggShadowT > 0) {
        ctx.globalAlpha = Math.min(1, g.eggShadowT);
        var sh = YT.Sprites.moonShadowRabbit();
        ctx.drawImage(sh, mx - mr * 0.45, my - mr * 0.35, mr * 0.9, mr * 0.82);
        ctx.globalAlpha = 1;
      }

      // 云带（中视差）
      var clouds = YT.Sprites.clouds();
      var co = (g.dist * 0.38) % 1200;
      var cy = D.groundY - 500;
      this._tileX(ctx, clouds, co, 1200, cy, W);

      // 远景剪影（慢视差 + 阶段过渡）
      var p0 = YT.Sprites.pattern(PATTERN_NAMES[pi.i0]);
      var py = D.groundY - 340;
      var po = (g.dist * 0.18) % 1600;
      this._tileX(ctx, p0, po, 1600, py, W);
      if (pi.k > 0.01) {
        var p1 = YT.Sprites.pattern(PATTERN_NAMES[pi.i1]);
        ctx.globalAlpha = pi.k;
        this._tileX(ctx, p1, po, 1600, py, W);
        ctx.globalAlpha = 1;
      }
    },

    _tileX: function (ctx, img, offset, tw, y, W) {
      var x = -offset;
      while (x < W) {
        ctx.drawImage(img, x, y);
        x += tw;
      }
    },

    // ---------- 地面 ----------
    drawGround: function (g) {
      var ctx = this.bgCtx;
      var W = this.W;
      var gy = D.groundY;
      var pi = phaseInfo(g);
      var off = g.dist % 200;

      var t0 = YT.Sprites.ground(pi.i0);
      this._tileX(ctx, t0, off, 200, gy, W);
      if (pi.k > 0.01) {
        var t1 = YT.Sprites.ground(pi.i1);
        ctx.globalAlpha = pi.k;
        this._tileX(ctx, t1, off, 200, gy, W);
        ctx.globalAlpha = 1;
      }
      // 地面以下补色
      var bots = ["#1a1640", "#2a3670", "#1f1c46", "#241a08"];
      ctx.fillStyle = bots[pi.i0];
      if (pi.k > 0.01) ctx.fillStyle = YT.lerpColor(bots[pi.i0], bots[pi.i1], pi.k);
      ctx.fillRect(0, gy + 184, W, this.H - gy);
    },

    // ---------- 游戏层 ----------
    drawWorld: function (g) {
      var ctx = this.ctx;
      var W = this.W, H = this.H;
      ctx.clearRect(0, 0, W, H);

      g.obstacles.draw(ctx);
      g.items.draw(ctx);
      g.player.draw(ctx);
      g.fx.draw(ctx);
    },

    // HUD 月相小图
    drawMoonIcon: function (canvas, phase) {
      var x = canvas.getContext("2d");
      x.clearRect(0, 0, 88, 88);
      var glow = x.createRadialGradient(44, 44, 10, 44, 44, 44);
      glow.addColorStop(0, "rgba(247,232,192,0.5)");
      glow.addColorStop(1, "rgba(247,232,192,0)");
      x.fillStyle = glow;
      x.fillRect(0, 0, 88, 88);
      x.drawImage(YT.Sprites.moon(phase), 8, 8, 72, 72);
    }
  };
})();
