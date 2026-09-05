// 玉兔奔月 —— 全局配置数据（替代 JSON：容器禁 fetch，用 JS 全局变量注入）
window.YT_DATA = {
  duration: 60,          // 经典模式时长（秒）
  lives: 3,              // 初始生命
  penalty: 100,          // 单次碰撞扣分
  baseSpeed: 420,        // 基础滚动速度（逻辑像素/秒）
  groundY: 1150,         // 地面顶（逻辑坐标，高度基准 1334）

  items: {
    mooncake:  { name: "月饼",   score: 10 },
    osmanthus: { name: "桂花",   score: 20 },
    star:      { name: "星星",   score: 30 },
    moonorb:   { name: "月光球", score: 50 }
  },
  itemWeights: { mooncake: 50, osmanthus: 25, star: 17, moonorb: 8 },

  combo: {
    moonlightAt: 5,        // ×5 月华加成
    moonlightDuration: 8,
    moonlightMul: 2,
    dashAt: 10,            // ×10 满月冲刺
    dashDuration: 5,
    dashSpeed: 1.35
  },

  phases: [
    { name: "桂花林", speed: 1.00, spawn: 1.55 },
    { name: "云海",   speed: 1.15, spawn: 1.35 },
    { name: "月宫",   speed: 1.35, spawn: 1.15 },
    { name: "满月",   speed: 1.60, spawn: 0.95 }
  ],
  phaseDuration: 15,

  titles: [
    { id: "lost_rabbit",     name: "月宫迷路兔", text: "月亮找到了，你还没找到路。",   desc: "碰撞三次仍然坚持" },
    { id: "moon_fairy",      name: "月宫仙兔",   text: "今夜月光似乎格外偏爱你。",     desc: "总分达到 4000" },
    { id: "osmanthus_fairy", name: "桂花小仙",   text: "桂香入梦，月色正好。",         desc: "桂花收集最多" },
    { id: "mooncake_master", name: "月饼大师",   text: "谁还不是个隐藏的月饼收藏家。", desc: "月饼收集最多" },
    { id: "slacker",         name: "摸鱼玉兔",   text: "奔月不重要，躺平才是中秋真谛。", desc: "坚持到最后但分数不高" },
    { id: "runner",          name: "追月小兔",   text: "一步一步，总会到达月亮。",     desc: "完成一局" }
  ],

  achievements: [
    { id: "first_flight",     name: "首次奔月",   desc: "完成第一局" },
    { id: "mooncake_collector", name: "月饼收藏家", desc: "累计收集 100 个月饼" },
    { id: "osmanthus_collector", name: "桂花收集家", desc: "累计收集 80 朵桂花" },
    { id: "fullmoon_arriver", name: "满月抵达者", desc: "进入满月阶段" },
    { id: "fullmoon_promise", name: "满月之约",   desc: "触发一次满月冲刺" },
    { id: "combo_master",     name: "连击大师",   desc: "单局连击达到 ×10" },
    { id: "flawless",         name: "凌云无伤",   desc: "整局零碰撞跑完" },
    { id: "games_10",         name: "十局挑战",   desc: "累计完成 10 局" },
    { id: "score_break",      name: "最高分突破", desc: "单局得分达到 3000" },
    { id: "old_driver",       name: "月宫老司机", desc: "连续 3 局进入月宫阶段" }
  ],

  skins: [
    { id: "white",      name: "白玉兔", desc: "经典造型，干净利落",           unlock: null },
    { id: "osmanthus",  name: "桂花兔", desc: "桂花得分 ×1.5",                unlock: { type: "totalOsmanthus", value: 80 } },
    { id: "gold",       name: "金玉兔", desc: "全部收集得分 ×1.2",            unlock: { type: "totalMooncakes", value: 150 } },
    { id: "lunar",      name: "月神兔", desc: "月华与冲刺持续 ×1.5",          unlock: { type: "bestScore", value: 5000 } }
  ],

  skills: [
    { id: "double_jump", name: "二段跳",   desc: "空中可再跳一次", active: false, unlock: { type: "totalGames", value: 5 } },
    { id: "shield",      name: "月光护盾", desc: "抵挡一次碰撞",   active: true,  unlock: { type: "totalCollect", value: 100 } },
    { id: "dash",        name: "月影冲刺", desc: "短时高速无敌",   active: true,  unlock: { type: "bestScore", value: 3000 } },
    { id: "blossom",     name: "桂花祝福", desc: "附近道具自动吸附", active: true, unlock: { type: "totalStars", value: 60 } }
  ],
  skillChargeMax: 100,
  skillChargePerItem: 9,
  skillChargePerOrb: 30,
  skillMaxEnabled: 2,

  levels: [
    { name: "桂花林",   goal: 1500, visual: 0 },
    { name: "云海",     goal: 2200, visual: 1 },
    { name: "月宫长廊", goal: 2800, visual: 2 },
    { name: "广寒宫",   goal: 3500, visual: 2 },
    { name: "月桂神树", goal: 4200, visual: 3 }
  ],

  dailyGoal: 2200,

  eggs: [
    { id: "change",  name: "偶遇嫦娥", bonus: 100, text: "嫦娥姐姐朝你挥了挥手" },
    { id: "wugang",  name: "吴刚路过", bonus: 50,  text: "吴刚扛着斧头匆匆走过" },
    { id: "firework",name: "满月烟花", bonus: 66,  text: "月亮旁炸开一朵烟花" },
    { id: "shadow",  name: "月中玉影", bonus: 88,  text: "月亮里浮现出一只兔子剪影" }
  ],
  eggChance: 0.05,

  cardSlogans: [
    "今晚也奔向满月",
    "月亮不许你加班",
    "桂花开好了，就等你",
    "月亮收到你的消息啦"
  ],

  publish: {
    title: "我居然跑到月宫了",
    content: "刚刚玩了一把玉兔奔月，你能跑多远？",
    tags: "中秋,中秋小游戏,玉兔奔月,月饼"
  }
};
