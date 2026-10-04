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
      { k: "英文名", v: "Oliver" },
      { k: "中文名", v: "王梦琦" },
      { k: "年代", v: "00 后" },
      { k: "爱好", v: "滑雪 · 骑车 · 攀岩 · 徒步" },
    ],
    links: [
      { label: "GitHub", value: "github.com/oliver037", href: "https://github.com/oliver037" },
      { label: "邮箱", value: "oliver.wang@stenders.com", href: "mailto:oliver.wang@stenders.com" },
    ],
  },

  // 爱好相册：照片放进 photos/ 文件夹，在 photos 里填文件名和说明
  // 每项的第一张是封面（大图），其余按瀑布流排。caption 可以改成地点 / 时间
  hobbies: [
    { id: "ski", name: "滑雪", icon: "🏂", desc: "冬天的正经事。", photos: [
      { src: "photos/ski-1.jpg", caption: "抱着板，和雪山对视" },
      { src: "photos/ski-2.jpg", caption: "压下去，雪会飞起来" },
      { src: "photos/ski-3.jpg", caption: "刻滑" },
      { src: "photos/ski-4.jpg", caption: "拖着板去雪场" },
    ] },
    { id: "bike", name: "骑车", icon: "🚴", desc: "风从耳边过去的时候，什么都不用想。", photos: [
      { src: "photos/bike-1.jpg", caption: "爬完这段坡，山就在眼前" },
      { src: "photos/bike-2.jpg", caption: "骑到一半，先自拍" },
    ] },
    { id: "climb", name: "攀岩", icon: "🧗", desc: "离地面越远，脑子越安静。", photos: [
      { src: "photos/climb-1.jpg", caption: "抱住这块黄点" },
    ] },
    { id: "hike", name: "徒步", icon: "🥾", desc: "一步一步走，山顶总会到。", photos: [
      { src: "photos/hike-1.jpg", caption: "洞口碰个拳" },
      { src: "photos/hike-2.jpg", caption: "日落时分，借匹马歇会儿" },
      { src: "photos/hike-3.jpg", caption: "雾里遇到两位原住民" },
    ] },
  ],

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
    { label: "邮箱", value: "oliver.wang@stenders.com", href: "mailto:oliver.wang@stenders.com" },
    { label: "GitHub", value: "github.com/oliver037", href: "https://github.com/oliver037" },
  ],

  // 猫头鹰助手的问答
  owl: {
    greet: "我是猫头鹰 Hoot，OLIVER-OS 的助手。想了解 Oliver？直接问我。",
    qa: [
      { q: "Oliver 是谁？", a: "王梦琦，00 后，写代码也爱往山里跑。点「关于我」看看。", open: "about" },
      { q: "平时玩什么？", a: "滑雪、骑车、攀岩、徒步，照片都在相册里 →", open: "hobbies" },
      { q: "看看作品", a: "作品都在这个文件夹里，点开就行 →", open: "works" },
      { q: "想玩游戏", a: "躲开蓝色方块，坚持 30 秒。最高分只记在你自己的浏览器里。", open: "game" },
      { q: "怎么联系？", a: "邮箱最快，其他平台也行。", open: "contact" },
    ],
    night: "这么晚还在看星星，你也早点睡哦。",
  },
};
