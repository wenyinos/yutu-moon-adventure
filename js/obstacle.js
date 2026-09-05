// 障碍管理：生成 / 移动 / 碰撞 / 回收
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  var TYPES = {
    root:  { w: 60, h: 64 },
    rock:  { w: 84, h: 96 },
    cloud: { w: 110, h: 70, hover: 130 } // 悬浮垂云：底边离地 130，站立可通过，跳起会撞
  };

  YT.Obstacles = function () { this.list = []; };

  YT.Obstacles.prototype = {
    spawn: function (type, x) {
      var t = TYPES[type];
      this.list.push({ type: type, x: x, w: t.w, h: t.h, hover: t.hover || 0 });
    },

    box: function (o) {
      var bottom = D.groundY - o.hover;
      return { x: o.x - o.w / 2, y: bottom - o.h, w: o.w, h: o.h };
    },

    update: function (dt, speed) {
      var out = [];
      for (var i = 0; i < this.list.length; i++) {
        var o = this.list[i];
        o.x -= speed * dt;
        if (o.x > -150) out.push(o);
      }
      this.list = out;
    },

    // 返回发生碰撞的障碍，无则 null
    collide: function (pl) {
      var hb = pl.hitbox();
      for (var i = 0; i < this.list.length; i++) {
        var b = this.box(this.list[i]);
        // 碰撞盒收缩 15%，手感更宽容
        var sx = b.w * 0.15 / 2, sy = b.h * 0.15 / 2;
        var shrunk = { x: b.x + sx, y: b.y + sy, w: b.w - b.w * 0.15, h: b.h - b.h * 0.15 };
        if (YT.aabb(hb, shrunk)) return this.list[i];
      }
      return null;
    },

    draw: function (ctx) {
      for (var i = 0; i < this.list.length; i++) {
        var o = this.list[i];
        var img = YT.Sprites.obstacle(o.type);
        var bottom = D.groundY - o.hover;
        ctx.drawImage(img, o.x - o.w / 2, bottom - o.h, o.w, o.h);
      }
    },

    clear: function () { this.list = []; }
  };

  YT.OBSTACLE_TYPES = TYPES;
})();
