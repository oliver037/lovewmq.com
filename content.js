// ============================================================
// 网站内容都在这里改。改完刷新页面即可，不用动 app.js。
// ============================================================
window.SITE = {
  name: "Oliver",
  tagline: "IT 基建 · AI 落地 · 周末在山里",

  // 「我是谁.txt」窗口：简介 / 进行中 / 技能 三个页签
  about: {
    avatar: "🦉",
    name: "Oliver · 王梦琦",
    role: "外企 IT · 基础建设 & AI 落地",
    lines: [
      "你好，我是 Oliver。",
      "在一家外企做 IT，主要负责 IT 基础建设，也在推动 AI 在企业里真正落地。",
      "喜欢把复杂的事情做简单。工作日守着服务器和网络，周末去雪道和山路上。",
    ],
    stats: [
      { k: "英文名", v: "Oliver" },
      { k: "中文名", v: "王梦琦" },
      { k: "年代", v: "00 后" },
      { k: "职业", v: "外企 IT" },
      { k: "方向", v: "IT 基建 · AI 落地" },
      { k: "爱好", v: "滑雪 · 骑车 · 攀岩 · 徒步" },
    ],

    // 最近在忙：一句话一条
    now: [
      "把公司的 IT 基础设施理顺、做稳",
      "找 AI 在企业里能真正省事的场景，一个个落地",
      "周末：等雪季",
    ],

    // 进行中的项目。status 可选：进行中 / 规划中 / 已上线；progress 是 0–100
    // ⚠ 下面是示例，换成你真实的项目（注意别写公司内部的敏感信息）
    projects: [
      { name: "企业知识库问答", status: "进行中", progress: 60, tags: ["AI", "RAG"],
        desc: "把内部文档、IT 手册接进大模型，员工直接提问就能找到答案。" },
      { name: "IT 服务台 AI 助手", status: "规划中", progress: 20, tags: ["AI", "自动化"],
        desc: "常见的密码重置、软件安装、网络问题，先让 AI 接第一轮。" },
      { name: "基础设施升级", status: "进行中", progress: 45, tags: ["网络", "终端"],
        desc: "网络、终端和账号体系的整理与升级，让大家用起来更稳。" },
      { name: "OLIVER-OS 个人网站", status: "已上线", progress: 100, tags: ["Web"],
        desc: "就是你现在看到的这台像素电脑。" },
    ],

    // 技能：按分组写
    skills: [
      { group: "IT 基础设施", items: ["网络", "服务器 / 虚拟化", "终端管理", "账号与权限", "IT 运维"] },
      { group: "AI 落地", items: ["大模型应用", "RAG 知识库", "Prompt 设计", "流程自动化"] },
      { group: "其他", items: ["前端", "脚本", "项目推进"] },
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
      { q: "Oliver 是谁？", a: "王梦琦，00 后，外企 IT，管基础建设，也在做 AI 落地。打开「我是谁.txt」看看。", open: "about" },
      { q: "最近在忙什么？", a: "进行中的项目都列在「我是谁.txt」的第二页 →", open: "about", tab: 1 },
      { q: "平时玩什么？", a: "滑雪、骑车、攀岩、徒步，照片都在相册里 →", open: "hobbies" },
      { q: "看看作品", a: "作品都在这个文件夹里，点开就行 →", open: "works" },
      { q: "想玩游戏", a: "躲开蓝色方块，坚持 30 秒。最高分只记在你自己的浏览器里。", open: "game" },
      { q: "怎么联系？", a: "邮箱最快，其他平台也行。", open: "contact" },
    ],
    night: "这么晚还在看星星，你也早点睡哦。",
  },
};
