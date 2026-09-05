// 程序化美术：全部视觉元素 Canvas 自绘 + 离屏缓存（零图片资源）
(function () {
  var YT = (window.YT = window.YT || {});
  var cache = {};
  var SCALE = 2; // 2x 超采样，绘制时缩回逻辑尺寸

  function make(key, w, h, drawFn) {
    if (cache[key]) return cache[key];
    var c = document.createElement("canvas");
    c.width = Math.ceil(w * SCALE);
    c.height = Math.ceil(h * SCALE);
    var x = c.getContext("2d");
    x.scale(SCALE, SCALE);
    drawFn(x, w, h);
    cache[key] = c;
    return c;
  }

  function circle(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); }
  function ell(x, cx, cy, rx, ry, rot) { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2); x.fill(); }
  function starPath(x, cx, cy, ro, ri) {
    x.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var r = i % 2 === 0 ? ro : ri;
      var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.closePath();
  }

  // ---------- 皮肤画笔 ----------
  var PAINT = {
    white:     { body1: "#ffffff", body2: "#ece8f6", scarf: "#e0485a", inner: "#ffc9d2", bell: "#ffd98a" },
    osmanthus: { body1: "#fffdf4", body2: "#f3ead0", scarf: "#ff9a3d", inner: "#ffd9a0", bell: "#ffd98a", flower: true },
    gold:      { body1: "#fff8e0", body2: "#eed287", scarf: "#f0b429", inner: "#ffe9b0", bell: "#ffffff" },
    lunar:     { body1: "#f6f2ff", body2: "#d6ccf2", scarf: "#9b7ede", inner: "#e6dbff", bell: "#ffe9b0", moon: true }
  };

  // ---------- 玉兔（96×96，脚底约 y=88） ----------
  function drawRabbit(x, pose, skinId) {
    var P = PAINT[skinId] || PAINT.white;
    var grad = x.createLinearGradient(0, 12, 0, 92);
    grad.addColorStop(0, P.body1);
    grad.addColorStop(1, P.body2);
    var jump = pose === "jump";
    var hurt = pose === "hurt";

    function ear(cx, cy, rot) {
      x.save();
      x.translate(cx, cy);
      x.rotate(rot);
      x.fillStyle = P.body1;
      ell(x, 0, -10, 7.5, 17);
      x.fillStyle = P.inner;
      ell(x, 0, -8, 3.8, 11);
      x.restore();
    }

    var tilt = hurt ? 0.6 : (jump ? 0.62 : 0.18);
    ear(39, 18, -tilt);
    ear(57, 18, tilt);

    // 尾巴
    x.fillStyle = P.body1;
    ell(x, 25, 65, 8, 7);

    // 身体
    x.fillStyle = grad;
    ell(x, 48, 63, 24, 21);

    // 头
    x.fillStyle = grad;
    circle(x, 48, 33, 21);

    // 腮红
    x.fillStyle = "rgba(255,170,180,0.75)";
    ell(x, 35, 39, 5, 3.5);
    ell(x, 61, 39, 5, 3.5);

    // 眼睛
    x.fillStyle = "#3a2e3e";
    if (hurt) {
      x.strokeStyle = "#3a2e3e";
      x.lineWidth = 2.2;
      [[40, 30], [56, 30]].forEach(function (p) {
        x.beginPath();
        x.moveTo(p[0] - 3, p[1] - 3); x.lineTo(p[0] + 3, p[1] + 3);
        x.moveTo(p[0] + 3, p[1] - 3); x.lineTo(p[0] - 3, p[1] + 3);
        x.stroke();
      });
    } else {
      circle(x, 40, 30, 2.6);
      circle(x, 56, 30, 2.6);
      x.fillStyle = "#ffffff";
      circle(x, 40.8, 29.2, 0.9);
      circle(x, 56.8, 29.2, 0.9);
    }

    // 嘴
    x.strokeStyle = "#c98a94";
    x.lineWidth = 1.6;
    x.beginPath();
    x.arc(48, 36, 2.8, Math.PI * 0.15, Math.PI * 0.85);
    x.stroke();

    // 围巾 + 飘带
    x.fillStyle = P.scarf;
    ell(x, 48, 51, 15, 5.5);
    x.beginPath();
    if (jump) { x.moveTo(58, 52); x.quadraticCurveTo(78, 42, 88, 50); }
    else { x.moveTo(58, 52); x.quadraticCurveTo(72, 56, 78, 64); }
    x.quadraticCurveTo(72, 58, 58, 56);
    x.closePath();
    x.fill();

    // 铃铛
    x.fillStyle = P.bell;
    circle(x, 48, 58, 4);
    x.fillStyle = "rgba(255,255,255,0.85)";
    circle(x, 46.8, 56.8, 1.2);

    // 手
    x.fillStyle = P.body1;
    if (jump) { ell(x, 30, 50, 6, 8, -0.5); ell(x, 66, 50, 6, 8, 0.5); }
    else { ell(x, 33, 61, 6, 7); ell(x, 63, 61, 6, 7); }

    // 脚
    if (pose === "run1") { ell(x, 37, 85, 8, 5); ell(x, 61, 79, 8, 5); }
    else if (pose === "run2") { ell(x, 41, 85, 8, 5); ell(x, 57, 85, 8, 5); }
    else if (pose === "run3") { ell(x, 35, 79, 8, 5); ell(x, 63, 85, 8, 5); }
    else if (jump) { ell(x, 43, 78, 8, 5); ell(x, 55, 78, 8, 5); }
    else { ell(x, 38, 85, 8, 5); ell(x, 58, 85, 8, 5); }

    // 皮肤装饰
    if (P.flower) { // 桂花兔：右耳旁小花
      x.fillStyle = "#ffb84d";
      for (var k = 0; k < 5; k++) {
        var a = k * Math.PI * 2 / 5 - Math.PI / 2;
        circle(x, 64 + Math.cos(a) * 4.5, 10 + Math.sin(a) * 4.5, 2.6);
      }
      x.fillStyle = "#d9903f";
      circle(x, 64, 10, 2.2);
    }
    if (P.moon) { // 月神兔：额头月牙
      x.strokeStyle = "#b9a0f0";
      x.lineWidth = 2.4;
      x.beginPath();
      x.arc(48, 22, 5, Math.PI * 0.25, Math.PI * 1.25, true);
      x.stroke();
    }
    if (hurt) { // 头顶眩晕星
      x.fillStyle = "#ffd98a";
      starPath(x, 30, 8, 5, 2.2); x.fill();
      starPath(x, 48, 2, 6, 2.6); x.fill();
      starPath(x, 66, 8, 5, 2.2); x.fill();
    }
  }

  YT.Sprites = {
    rabbit: function (pose, skin) {
      return make("r_" + pose + "_" + skin, 96, 96, function (x) { drawRabbit(x, pose, skin); });
    },

    // ---------- 收集物（64×64） ----------
    item: function (type) {
      return make("i_" + type, 64, 64, function (x) {
        if (type === "mooncake") {
          x.fillStyle = "#d9903f";
          circle(x, 32, 32, 24);
          x.strokeStyle = "#a86428";
          x.lineWidth = 3;
          x.beginPath(); x.arc(32, 32, 22.5, 0, Math.PI * 2); x.stroke();
          x.fillStyle = "#e8b05c";
          circle(x, 32, 32, 17);
          x.strokeStyle = "#c9854a";
          x.lineWidth = 2;
          for (var i = 0; i < 8; i++) {
            var a = i * Math.PI / 4;
            x.beginPath();
            x.moveTo(32 + Math.cos(a) * 9, 32 + Math.sin(a) * 9);
            x.lineTo(32 + Math.cos(a) * 15.5, 32 + Math.sin(a) * 15.5);
            x.stroke();
          }
          x.fillStyle = "#c9854a";
          circle(x, 32, 32, 6);
          x.fillStyle = "#f5c95c";
          for (var j = 0; j < 6; j++) {
            var b = j * Math.PI / 3 + Math.PI / 6;
            circle(x, 32 + Math.cos(b) * 19, 32 + Math.sin(b) * 19, 2.4);
          }
        } else if (type === "osmanthus") {
          x.fillStyle = "#f5c95c";
          x.strokeStyle = "#e0a83a";
          x.lineWidth = 1.5;
          for (var k = 0; k < 5; k++) {
            var a2 = k * Math.PI * 2 / 5 - Math.PI / 2;
            x.beginPath();
            x.arc(32 + Math.cos(a2) * 11, 32 + Math.sin(a2) * 11, 9.5, 0, Math.PI * 2);
            x.fill(); x.stroke();
          }
          x.fillStyle = "#d9903f";
          circle(x, 32, 32, 6.5);
        } else if (type === "star") {
          x.fillStyle = "#ffd98a";
          x.strokeStyle = "#e8a94f";
          x.lineWidth = 2;
          starPath(x, 32, 34, 22, 9.5);
          x.fill(); x.stroke();
          x.fillStyle = "#fff3d0";
          circle(x, 29, 30, 3);
        } else if (type === "moonorb") {
          var g = x.createRadialGradient(32, 32, 2, 32, 32, 27);
          g.addColorStop(0, "#ffffff");
          g.addColorStop(0.45, "#cfe0ff");
          g.addColorStop(1, "rgba(188,212,255,0)");
          x.fillStyle = g;
          circle(x, 32, 32, 27);
          x.strokeStyle = "rgba(255,255,255,0.8)";
          x.lineWidth = 2;
          x.beginPath(); x.arc(32, 32, 21, 0, Math.PI * 2); x.stroke();
          x.fillStyle = "#ffffff";
          circle(x, 28, 28, 4);
        }
      });
    },

    // ---------- 障碍 ----------
    obstacle: function (type) {
      if (type === "root") {
        return make("o_root", 60, 64, function (x) {
          x.fillStyle = "#6b4a2f";
          ell(x, 18, 50, 13, 12); ell(x, 35, 40, 15, 14); ell(x, 48, 52, 12, 11);
          x.fillStyle = "#7d583a";
          ell(x, 30, 36, 8, 6); ell(x, 44, 48, 6, 5);
          x.fillStyle = "#59402a";
          ell(x, 20, 58, 16, 6); ell(x, 44, 58, 14, 6);
          x.strokeStyle = "#3f6b46";
          x.lineWidth = 2.5;
          x.beginPath(); x.moveTo(8, 62); x.quadraticCurveTo(4, 50, 10, 44); x.stroke();
          x.beginPath(); x.moveTo(54, 62); x.quadraticCurveTo(58, 52, 52, 46); x.stroke();
        });
      }
      if (type === "rock") {
        return make("o_rock", 84, 96, function (x) {
          x.fillStyle = "#b8b4cc";
          ell(x, 42, 62, 35, 32);
          ell(x, 42, 78, 37, 18);
          x.fillStyle = "#d8d5e8";
          ell(x, 30, 46, 11, 7.5);
          x.fillStyle = "#8f8aab";
          ell(x, 44, 88, 30, 8);
          x.strokeStyle = "#8f8aab";
          x.lineWidth = 2.2;
          x.beginPath();
          x.moveTo(46, 40); x.lineTo(52, 56); x.lineTo(44, 68); x.lineTo(50, 80);
          x.stroke();
          x.fillStyle = "#6b8f6b";
          circle(x, 22, 84, 3.5); circle(x, 60, 90, 3);
        });
      }
      // cloud 垂云
      return make("o_cloud", 110, 70, function (x) {
        x.fillStyle = "#f4f5fd";
        circle(x, 26, 44, 17); circle(x, 55, 34, 23); circle(x, 84, 44, 17);
        x.fillRect(20, 44, 72, 22);
        x.fillStyle = "#ccd2ee";
        YT.roundRect(x, 22, 56, 68, 10, 5); x.fill();
        x.fillStyle = "#ffffff";
        circle(x, 48, 26, 7); circle(x, 70, 30, 5);
      });
    },

    // ---------- 月相（120×120，phase 0~1） ----------
    moon: function (phase) {
      var idx = Math.max(0, Math.min(20, Math.round(phase * 20)));
      return make("moon_" + idx, 120, 120, function (x) {
        var r = 50, cx = 60, cy = 60;
        x.fillStyle = "#f7e8c0";
        circle(x, cx, cy, r);
        x.fillStyle = "rgba(216,190,130,0.55)";
        circle(x, cx - 16, cy - 12, 9);
        circle(x, cx + 14, cy + 14, 7);
        circle(x, cx + 20, cy - 16, 5);
        circle(x, cx - 4, cy + 22, 5.5);
        var off = (1 - idx / 20) * r * 2;
        if (off > 0.5) {
          x.globalCompositeOperation = "destination-out";
          circle(x, cx + off, cy - r * 0.12, r + 1);
          x.globalCompositeOperation = "source-over";
        }
      });
    },

    // 月中玉影（画在满月上）
    moonShadowRabbit: function () {
      return make("moon_shadow", 44, 40, function (x) {
        x.fillStyle = "rgba(180,150,95,0.55)";
        ell(x, 22, 26, 12, 9);
        circle(x, 26, 16, 8);
        ell(x, 20, 5, 2.6, 7, -0.2);
        ell(x, 31, 6, 2.6, 7, 0.25);
      });
    },

    // ---------- 远景剪影 pattern（1600×340，底边贴地面） ----------
    pattern: function (name) {
      return make("p_" + name, 1600, 340, function (x) {
        function tree(cx, s) {
          x.fillStyle = "#1c2347";
          x.fillRect(cx - 7 * s, 340 - 150 * s, 14 * s, 150 * s);
          x.fillStyle = "#182348";
          circle(x, cx, 340 - 190 * s, 42 * s);
          circle(x, cx - 34 * s, 340 - 160 * s, 30 * s);
          circle(x, cx + 34 * s, 340 - 165 * s, 32 * s);
          x.fillStyle = "rgba(217,179,106,0.5)";
          circle(x, cx - 12 * s, 340 - 200 * s, 3 * s);
          circle(x, cx + 20 * s, 340 - 175 * s, 2.5 * s);
        }
        if (name === "trees") {
          tree(300, 1.1); tree(760, 0.8); tree(1250, 1.3);
          x.strokeStyle = "#1c2347";
          x.lineWidth = 4;
          x.beginPath(); x.moveTo(520, 340); x.quadraticCurveTo(540, 250, 580, 220); x.stroke();
        } else if (name === "hills") {
          x.fillStyle = "#202a5c";
          ell(x, 350, 340, 260, 110);
          ell(x, 900, 340, 320, 150);
          ell(x, 1420, 340, 240, 95);
          x.fillStyle = "rgba(230,235,255,0.12)";
          ell(x, 880, 260, 140, 40);
        } else if (name === "palace") {
          x.fillStyle = "#221d4e";
          x.fillRect(560, 250, 480, 90);
          x.fillRect(640, 170, 320, 90);
          x.beginPath(); // 大屋顶
          x.moveTo(500, 175);
          x.quadraticCurveTo(800, 60, 1100, 175);
          x.lineTo(1050, 185);
          x.quadraticCurveTo(800, 95, 550, 185);
          x.closePath(); x.fill();
          x.fillRect(620, 240, 360, 14);
          x.fillStyle = "#d9b36a";
          x.fillRect(760, 200, 26, 34);
          x.fillRect(820, 200, 26, 34);
          x.fillStyle = "rgba(217,179,106,0.35)";
          circle(x, 800, 120, 5);
          tree(180, 0.9); tree(1420, 1.0);
        } else if (name === "deity") {
          x.fillStyle = "#2a2246";
          x.beginPath();
          x.moveTo(730, 340); x.lineTo(760, 120); x.lineTo(850, 120); x.lineTo(885, 340);
          x.closePath(); x.fill();
          x.fillStyle = "#1f2c52";
          circle(x, 805, 95, 95);
          circle(x, 715, 140, 62); circle(x, 895, 140, 62);
          circle(x, 805, 55, 55);
          x.fillStyle = "#d9b36a";
          [[760, 70], [850, 60], [805, 30], [730, 120], [880, 110], [805, 105]].forEach(function (p) {
            circle(x, p[0], p[1], 4.5);
          });
          tree(240, 0.85); tree(1380, 0.9);
        }
      });
    },

    // ---------- 云带 pattern（1200×240） ----------
    clouds: function () {
      return make("clouds", 1200, 240, function (x) {
        x.fillStyle = "rgba(215,222,248,0.20)";
        function cl(cx, cy, s) {
          circle(x, cx - 30 * s, cy + 6 * s, 16 * s);
          circle(x, cx, cy - 6 * s, 22 * s);
          circle(x, cx + 32 * s, cy + 5 * s, 17 * s);
          x.fillRect(cx - 34 * s, cy + 4 * s, 68 * s, 12 * s);
        }
        cl(200, 90, 1.2); cl(640, 150, 0.9); cl(1020, 70, 1.4);
      });
    },

    // ---------- 地面 tile（200×184） ----------
    ground: function (i) {
      return make("g_" + i, 200, 184, function (x) {
        var mains = ["#241f4e", "#3a4a8e", "#2b2758", "#33260f"];
        var edges = ["#4a3f7a", "#9fb2e8", "#8f87c9", "#d9b36a"];
        x.fillStyle = mains[i];
        x.fillRect(0, 0, 200, 184);
        x.fillStyle = edges[i];
        x.fillRect(0, 0, 200, 9);
        if (i === 0) {
          x.strokeStyle = "#3a3270";
          x.lineWidth = 2.4;
          [[26, 60], [86, 110], [150, 52], [180, 140], [56, 150]].forEach(function (p) {
            x.beginPath();
            x.moveTo(p[0] - 6, p[1]); x.lineTo(p[0], p[1] - 10); x.lineTo(p[0] + 6, p[1]);
            x.stroke();
          });
        } else if (i === 1) {
          x.fillStyle = "rgba(255,255,255,0.13)";
          circle(x, 40, 70, 16); circle(x, 120, 120, 22); circle(x, 175, 60, 12);
        } else if (i === 2) {
          x.strokeStyle = "#221f4a";
          x.lineWidth = 3;
          x.beginPath(); x.moveTo(0, 66); x.lineTo(200, 66); x.moveTo(0, 132); x.lineTo(200, 132); x.stroke();
          x.beginPath(); x.moveTo(66, 9); x.lineTo(66, 66); x.moveTo(140, 66); x.lineTo(140, 132); x.moveTo(40, 132); x.lineTo(40, 184); x.stroke();
          x.fillStyle = "rgba(143,135,201,0.4)";
          circle(x, 100, 98, 3);
        } else {
          x.strokeStyle = "rgba(217,179,106,0.3)";
          x.lineWidth = 3;
          for (var k = 0; k < 4; k++) {
            x.beginPath();
            x.moveTo(k * 55 - 20, 184); x.lineTo(k * 55 + 40, 9);
            x.stroke();
          }
        }
      });
    },

    // ---------- 彩蛋角色（140×180） ----------
    egg: function (name) {
      return make("e_" + name, 140, 180, function (x) {
        if (name === "change") {
          x.fillStyle = "rgba(244,219,232,0.92)";
          circle(x, 70, 58, 16);
          circle(x, 70, 38, 7);
          x.beginPath(); // 裙摆
          x.moveTo(70, 72);
          x.quadraticCurveTo(30, 110, 38, 158);
          x.quadraticCurveTo(70, 148, 102, 158);
          x.quadraticCurveTo(110, 110, 70, 72);
          x.closePath(); x.fill();
          x.strokeStyle = "rgba(244,219,232,0.8)";
          x.lineWidth = 5;
          x.beginPath(); x.moveTo(58, 80); x.quadraticCurveTo(10, 100, 4, 150); x.stroke();
          x.beginPath(); x.moveTo(84, 82); x.quadraticCurveTo(126, 110, 132, 152); x.stroke();
        } else if (name === "wugang") {
          x.fillStyle = "#3a3660";
          circle(x, 70, 60, 13);
          x.beginPath(); // 身
          x.moveTo(58, 72); x.lineTo(82, 72); x.lineTo(88, 130); x.lineTo(52, 130);
          x.closePath(); x.fill();
          x.lineWidth = 6;
          x.strokeStyle = "#3a3660";
          x.beginPath(); x.moveTo(60, 130); x.lineTo(54, 168); x.stroke();
          x.beginPath(); x.moveTo(80, 130); x.lineTo(88, 168); x.stroke();
          x.lineWidth = 4;
          x.strokeStyle = "#5a5080";
          x.beginPath(); x.moveTo(40, 42); x.lineTo(108, 92); x.stroke(); // 斧柄
          x.fillStyle = "#8f8ab5";
          x.beginPath(); // 斧刃
          x.moveTo(108, 92); x.quadraticCurveTo(128, 78, 122, 58);
          x.quadraticCurveTo(110, 72, 100, 78);
          x.closePath(); x.fill();
        }
      });
    }
  };
})();
