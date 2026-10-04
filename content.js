// ============================================================
// 网站内容都在这里改。改完刷新页面即可，不用动 app.js。
// ============================================================
window.SITE = {
  name: "Oliver",
  tagline: "做产品 · 写代码 · 偶尔画像素",

  about: {
    avatar: "🦉",
    lines: [
      "你好，我是 Oliver。",
      "白天写代码、做产品，晚上折腾一些没什么用但很好玩的小东西。",
      "喜欢像素画、夜空、咖啡，和把复杂的事情做简单。",
    ],
    stats: [
      { k: "所在地", v: "中国 · 地球" },
      { k: "职业", v: "开发者 / 产品" },
      { k: "技能", v: "前端 · 后端 · AI 应用" },
      { k: "咖啡消耗", v: "∞ 杯" },
    ],
  },

  // 作品：tag 用于筛选，link 可留空
  works: [
    { title: "像素桌面", tag: "网站", year: "2026", desc: "就是你现在看到的这个：一台浏览器里的像素电脑。", link: "#" },
    { title: "AI 小助手", tag: "AI", year: "2026", desc: "把日常重复的工作交给 AI，自己去喝咖啡。", link: "" },
    { title: "躲方块", tag: "游戏", year: "2025", desc: "30 秒一局的小游戏，桌面上就能玩。", link: "game" },
    { title: "效率工具箱", tag: "工具", year: "2025", desc: "几个常用的小工具，打开就能用，不收集任何数据。", link: "" },
  ],

  notes: [
    { date: "2026-10-04", text: "网站上线了。月亮是双击召唤助手的开关，删不得。" },
    { date: "2026-09-20", text: "最好的按钮不是更多的按钮，而是忍住不加第二个。" },
    { date: "2026-08-12", text: "深夜写代码效率最高，第二天改 bug 的效率最低。" },
  ],

  contact: [
    { label: "邮箱", value: "hello@oliver.dev", href: "mailto:hello@oliver.dev" },
    { label: "GitHub", value: "github.com/oliver", href: "https://github.com/" },
    { label: "B 站", value: "Oliver", href: "https://www.bilibili.com/" },
  ],

  // 猫头鹰助手的问答
  owl: {
    greet: "我是猫头鹰 Hoot，OLIVER-OS 的助手。想了解 Oliver？直接问我。",
    qa: [
      { q: "Oliver 是谁？", a: "一个喜欢做小东西的开发者。点「关于我」看看。", open: "about" },
      { q: "看看作品", a: "作品都在这个文件夹里，点开就行 →", open: "works" },
      { q: "想玩游戏", a: "躲开蓝色方块，坚持 30 秒。最高分只记在你自己的浏览器里。", open: "game" },
      { q: "怎么联系？", a: "邮箱最快，其他平台也行。", open: "contact" },
    ],
    night: "这么晚还在看星星，你也早点睡哦。",
  },
};
