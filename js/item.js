// 收集物管理：生成（直线串/弧线串）/ 磁吸 / 收集判定
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;

  function pickType(rng) {
    var total = 0, k;
    for (k in D.itemWeights) total += D.itemWeights[k];
    var r = rng ? rng.range(0, total) : Math.random() * total;
    for (var type in D.itemWeights) {
      r -= D.itemWeights[type];
      if (r <= 0) return type;
    }
    return "mooncake";
  }

  YT.Items = function () {
    this.list = [];
    this.t = 0;
  };

  YT.Items.prototype = {
    spawnLine: function (x, n, rng) {
      var type = pickType(rng);
      var y = D.groundY - 70 - (rng ? rng.range(0, 90) : YT.rand(0, 90));
      for (var i = 0; i < n; i++) {
        this.list.push({ type: type, x: x + i * 95, y: y, bx: x + i * 95, by: y });
      }
    },

    spawnArc: function (x, n, rng) {
      var type = pickType(rng);
      for (var i = 0; i < n; i++) {
        var p = n > 1 ? i / (n - 1) : 0.5;
        var y = D.groundY - 80 - Math.sin(p * Math.PI) * 150;
        this.list.push({ type: type, x: x + i * 95, y: y, bx: x + i * 95, by: y });
      }
    },

    update: function (dt, speed, pl, magnet, onCollect) {
      this.t += dt;
      var keep = [];
      var pc = pl.center();
      for (var i = 0; i < this.list.length; i++) {
        var it = this.list[i];
        it.x -= speed * dt;
        var dx = pc.x - it.x, dy = pc.y - it.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (magnet && dist < 280) { // 磁吸
          it.x += dx / dist * 620 * dt;
          it.y += dy / dist * 620 * dt;
        }
        if (dist < 68) {
          onCollect(it.type, it.x, it.y);
        } else if (it.x > -80) {
          keep.push(it);
        }
      }
      this.list = keep;
    },

    draw: function (ctx) {
      for (var i = 0; i < this.list.length; i++) {
        var it = this.list[i];
        var img = YT.Sprites.item(it.type);
        var bob = Math.sin(this.t * 4 + it.bx * 0.02) * 5;
        ctx.drawImage(img, it.x - 28, it.y - 28 + bob, 56, 56);
      }
    },

    clear: function () { this.list = []; }
  };
})();
