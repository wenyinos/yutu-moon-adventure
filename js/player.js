// 玩家：自动奔跑 + 点击跳跃 + 重力 + 碰撞盒
(function () {
  var YT = (window.YT = window.YT || {});
  var D = window.YT_DATA;
  var GRAVITY = 2500;
  var JUMP_V = 1000;
  var JUMP_V2 = 880;

  YT.Player = function (skinId, hasDoubleJump) {
    this.skin = skinId || "white";
    this.x = 240;
    this.y = D.groundY; // 脚底
    this.vy = 0;
    this.grounded = true;
    this.jumpsUsed = 0;
    this.maxJumps = hasDoubleJump ? 2 : 1;
    this.invincible = 0; // 受击无敌
    this.shield = false; // 护盾激活
    this.animT = 0;
    this.hurtT = 0;
    this.landed = false; // 本帧落地标记
  };

  YT.Player.prototype = {
    jump: function () {
      if (this.grounded) {
        this.vy = -JUMP_V;
        this.grounded = false;
        this.jumpsUsed = 1;
        YT.Audio.sfx("jump");
        return true;
      }
      if (this.jumpsUsed < this.maxJumps) {
        this.vy = -JUMP_V2;
        this.jumpsUsed++;
        YT.Audio.sfx("double_jump");
        return true;
      }
      return false;
    },

    release: function () {
      // 松手截断上升（可变跳跃高度）
      if (this.vy < -420) this.vy = -420;
    },

    update: function (dt) {
      this.landed = false;
      if (!this.grounded) {
        this.vy += GRAVITY * dt;
        this.y += this.vy * dt;
        if (this.y >= D.groundY) {
          this.y = D.groundY;
          this.vy = 0;
          this.grounded = true;
          this.jumpsUsed = 0;
          this.landed = true;
        }
      }
      if (this.invincible > 0) this.invincible -= dt;
      if (this.hurtT > 0) this.hurtT -= dt;
      this.animT += dt;
    },

    hitbox: function () {
      return { x: this.x - 25, y: this.y - 72, w: 50, h: 72 };
    },

    center: function () {
      return { x: this.x, y: this.y - 40 };
    },

    pose: function () {
      if (this.hurtT > 0) return "hurt";
      if (!this.grounded) return "jump";
      var f = Math.floor(this.animT * 10) % 3;
      return ["run1", "run2", "run3"][f];
    },

    draw: function (ctx) {
      var img = YT.Sprites.rabbit(this.pose(), this.skin);
      var blink = this.invincible > 0 && Math.floor(this.invincible * 12) % 2 === 0;
      if (blink) ctx.globalAlpha = 0.35;
      ctx.drawImage(img, this.x - 48, this.y - 88, 96, 96);
      ctx.globalAlpha = 1;
      if (this.shield) {
        ctx.strokeStyle = "rgba(160,200,255,0.85)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 42, 58, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(160,200,255,0.3)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 42, 62, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };
})();
