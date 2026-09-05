// 工具函数（严格 ES2017 子集）
(function () {
  var YT = (window.YT = window.YT || {});

  YT.rand = function (min, max) { return min + Math.random() * (max - min); };
  YT.randInt = function (min, max) { return Math.floor(YT.rand(min, max + 1)); };
  YT.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  YT.clamp = function (v, min, max) { return v < min ? min : v > max ? max : v; };
  YT.lerp = function (a, b, t) { return a + (b - a) * t; };

  YT.hexRgb = function (hex) {
    var n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  YT.lerpColor = function (c1, c2, t) {
    var a = YT.hexRgb(c1), b = YT.hexRgb(c2);
    return "rgb(" +
      Math.round(YT.lerp(a.r, b.r, t)) + "," +
      Math.round(YT.lerp(a.g, b.g, t)) + "," +
      Math.round(YT.lerp(a.b, b.b, t)) + ")";
  };

  // 线性同余伪随机（每日挑战固定种子）
  YT.LCG = function (seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return {
      next: function () {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      },
      range: function (min, max) { return min + this.next() * (max - min); },
      int: function (min, max) { return Math.floor(this.range(min, max + 1)); }
    };
  };

  // 简易对象池
  YT.Pool = function (factory) {
    this.factory = factory;
    this.free = [];
    this.used = [];
  };
  YT.Pool.prototype.get = function () {
    var obj = this.free.length > 0 ? this.free.pop() : this.factory();
    this.used.push(obj);
    return obj;
  };
  YT.Pool.prototype.releaseAll = function (keepFn) {
    var keep = [];
    for (var i = 0; i < this.used.length; i++) {
      if (keepFn && keepFn(this.used[i])) keep.push(this.used[i]);
      else this.free.push(this.used[i]);
    }
    this.used = keep;
  };

  YT.$ = function (sel) { return document.querySelector(sel); };

  // 圆角矩形路径
  YT.roundRect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // AABB 相交
  YT.aabb = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  YT.pad2 = function (n) { return n < 10 ? "0" + n : "" + n; };
})();
