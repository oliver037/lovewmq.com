// ============================================================
// STENDERS 像素门店.exe：经营小游戏
// 开店前备货 → 营业时点顾客派 BA 接待、点货架加急补货、点泡泡池引流 → 打烊结算、升级门店
// ============================================================
window.renderShop = function (body) {
  const BEST = "oliver-os-shop-best", MUTE = "oliver-os-shop-mute";
  const W = 320, H = 224;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // 品类：真实商品（零售价）、客流权重、接待时长（秒）。进价按均价 24% 估算，仅作游戏数值
  const SKU = {
    bomb: { name: "沐浴球", color: "#e8638c", demand: 6, svc: 4, items: [
      ["野生薰衣草足浴气泡弹", 38], ["木兰花香氛气泡弹", 70], ["梦想星球气泡弹", 70], ["蓝莓香氛精油球", 70],
      ["苔藓秘境气泡弹", 98], ["冬日暖阳气泡弹", 98], ["牛油果奶油球", 98], ["北国之春气泡弹", 98],
      ["风之恋气泡弹", 98], ["优雅天秤座精油球", 125]] },
    soap: { name: "手工皂", color: "#7fd99a", demand: 4, svc: 4, items: [
      ["蔓越莓香氛皂", 25], ["块状葡萄柚温柏皂", 80], ["红色冰玫瑰皂", 80], ["芒果百香果彩泥皂", 80],
      ["玫瑰奶油块状皂", 85], ["燕麦玫瑰奶油块状皂", 85], ["金色雪花皂", 98], ["苹果大黄塔啫喱皂", 98],
      ["草莓覆盆子啫喱皂", 98], ["蓝莓泡泡啫喱皂", 98]] },
    body: { name: "身体护理", color: "#e8b64c", demand: 5, svc: 6, items: [
      ["苹果精粹沐浴露", 160], ["欧薄荷液体皂", 198], ["苹果精粹身体乳", 210], ["柑橘薄荷醒肤沐浴啫喱", 210],
      ["手工果油乳霜", 240], ["蔓越莓温和磨砂膏", 240], ["葡萄柚绵肌沐浴膏", 245], ["欧薄荷磨砂盐", 260],
      ["姜黄焕彩身体莹润霜", 265], ["蔓越莓水分乳", 278], ["玫瑰身体油霜", 315], ["甜杏润体乳", 330]] },
    scent: { name: "香氛", color: "#b49cf0", demand: 3, svc: 6, items: [
      ["绿色按摩蜡", 175], ["香薰包·花瀑暗语", 180], ["香薰包·春之悸动", 180], ["印象香草家居扩香", 295],
      ["智利往事家居扩香", 295], ["浮光掠影家居扩香", 295], ["橙花伊甸园家居扩香", 295], ["醉情地中海香薰蜡烛", 350]] },
    gift: { name: "礼盒", color: "#8cc2ff", demand: 2, svc: 8, items: [
      ["固定4球礼盒", 280], ["沁爽慕斯礼盒", 300], ["迷你香薰蜡烛套装", 395], ["北国秘境奇浴记", 425],
      ["北欧茉莉木屋礼盒", 575], ["花香木屋礼盒", 588], ["身体护理木屋礼盒", 593], ["沐浴木屋礼盒", 643]] },
  };
  const CATS = Object.entries(SKU).map(([id, d]) => {
    const items = d.items.map(([name, price]) => ({ name, price }));
    const ps = items.map((i) => i.price), avg = ps.reduce((a, b) => a + b, 0) / ps.length;
    return { id, ...d, items, price: [Math.min(...ps), Math.max(...ps)], cost: Math.round(avg * 0.24) };
  });
  const WEIGHTED = CATS.flatMap((c) => Array(c.demand).fill(c));
  const UPS = [
    { id: "train", name: "BA 培训",  desc: "成交率 +6%",              costs: [600, 1000, 1600] },
    { id: "talk",  name: "标准话术", desc: "接待时长 -15%",           costs: [500, 900] },
    { id: "cap",   name: "货架扩容", desc: "每个货架 +3 格",          costs: [500, 900] },
    { id: "ads",   name: "门店推广", desc: "客流 +10%",               costs: [600, 1000, 1500] },
    { id: "pool",  name: "泡泡池加压", desc: "泡泡池冷却 -3 秒",      costs: [700, 1200] },
    { id: "auto",  name: "自动派单", desc: "空闲 BA 优先接高客单",    costs: [1500] },
  ];
  const SALARY = 120, HIRE = 800, MAX_STAFF = 4, RUSH = 2; // 加急补货单价 = 进价 × RUSH
  const BA_NAMES = ["BA·林", "BA·苏", "BA·周", "BA·陈"];

  // 场景布局（画布坐标，人物坐标是脚底）
  const SHELF = CATS.map((c, i) => ({ c, x: 8 + i * 62, y: 22, w: 56, h: 22 }));
  const COUNTER = { x: 214, y: 150, w: 92, h: 16 };
  const POOL = { x: 120, y: 146, rx: 20, ry: 11 };
  const DOOR = { x: 14, y: H + 10 };
  const queueSlot = (k) => ({ x: 248 - k * 14, y: 184 });
  const homeSlot = (i) => ({ x: 228 + i * 18, y: 146 });
  const poolCd = () => 12 - 3 * G.up.pool;

  const logo = new Image();
  logo.src = "assets/stenders-logo.png";

  body.innerHTML = `
    <div class="shop">
      <div class="shop__hud">
        <span>DAY <b data-k="day">1</b></span>
        <span class="shop__clock" data-k="clock">--:--</span>
        <span class="shop__time" title="营业时间"><i data-k="bar"></i></span>
        <span>¥<b data-k="money">0</b></span>
        <span title="口碑">♥<b data-k="rep">50</b></span>
        <span title="空闲 BA">BA <b data-k="idle">2</b></span>
      </div>
      <div class="shop__stage">
        <canvas width="${W}" height="${H}" aria-label="STENDERS 像素门店：点击顾客派 BA 接待，点击货架加急补货，点击泡泡池引流"></canvas>
        <div class="shop__modal" hidden><div class="shop__card"></div></div>
      </div>
      <div class="shop__bar">
        <p class="shop__tip"></p>
        <button class="btn btn--sm btn--ghost" data-act="close" hidden>打烊</button>
        <button class="btn btn--sm btn--ghost" data-act="mute" aria-label="音效开关"></button>
      </div>
    </div>`;
  const cv = body.querySelector("canvas"), g = cv.getContext("2d");
  const modal = body.querySelector(".shop__modal"), card = body.querySelector(".shop__card");
  const tipEl = body.querySelector(".shop__tip");
  const closeBtn = body.querySelector('[data-act="close"]'), muteBtn = body.querySelector('[data-act="mute"]');
  const hud = Object.fromEntries([...body.querySelectorAll("[data-k]")].map((e) => [e.dataset.k, e]));
  const TIP = "点顾客派 BA 接待 · 点货架加急补货 · 点泡泡池引流";

  // ---------- 音效 ----------
  let actx = null, muted = localStorage.getItem(MUTE) === "1";
  const setMuteLabel = () => (muteBtn.textContent = muted ? "🔇" : "🔊");
  setMuteLabel();
  function initAudio() { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  function tone(f, d, type, v, delay = 0) {
    if (!actx || muted) return;
    const t0 = actx.currentTime + delay, o = actx.createOscillator(), gn = actx.createGain();
    o.type = type || "square"; o.frequency.setValueAtTime(f, t0);
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.linearRampToValueAtTime(v || 0.03, t0 + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(gn); gn.connect(actx.destination); o.start(t0); o.stop(t0 + d + 0.02);
  }
  const SFX = {
    tap: () => tone(660, 0.04, "square", 0.025),
    good: () => { tone(523, 0.05, "square", 0.03); tone(784, 0.08, "square", 0.03, 0.05); },
    cash: () => { tone(880, 0.06, "square", 0.035); tone(1318, 0.1, "square", 0.03, 0.06); },
    no: () => tone(140, 0.12, "sawtooth", 0.025),
    foam: () => { for (let i = 0; i < 4; i++) tone(500 + i * 160, 0.05, "sine", 0.02, i * 0.04); },
    day: () => { tone(523, 0.12, "square", 0.03); tone(659, 0.12, "square", 0.03, 0.12); tone(784, 0.2, "square", 0.03, 0.24); },
  };

  let G;
  const cap = () => 6 + G.up.cap * 3;
  const conv = () => 0.55 + G.up.train * 0.06;
  const svcTime = (c) => c.cat.svc * (1 - 0.15 * G.up.talk);
  const rent = () => 150 + G.day * 50;

  function newGame() {
    G = {
      phase: "title", day: 1, money: 3000, rep: 50, t: 0, len: 60, poolT: 0,
      up: { train: 0, talk: 0, cap: 0, ads: 0, pool: 0, auto: 0 },
      stock: Object.fromEntries(CATS.map((c) => [c.id, 0])),
      order: {}, staff: [], cust: [], fx: [], parts: [], queue: [], total: 0,
    };
    G.staff = [makeStaff(0), makeStaff(1)];
    showTitle();
  }
  function makeStaff(i) {
    const h = homeSlot(i);
    return { i, name: BA_NAMES[i], x: h.x, y: h.y, home: h, state: "idle", c: null, t: 0, dir: -1,
      hair: ["#2a1c14", "#5a3b28", "#1a1410", "#6b4a30"][i], skin: ["#f2cba8", "#e8b98f", "#d9a278", "#f2cba8"][i],
      stat: { served: 0, deals: 0, rev: 0 } };
  }

  // ---------- 弹窗 ----------
  function show(html) { card.innerHTML = html; modal.hidden = false; }
  function hide() { modal.hidden = true; }
  function tip(msg, warn) {
    tipEl.textContent = msg; tipEl.classList.toggle("is-warn", !!warn);
    clearTimeout(tip._t);
    tip._t = setTimeout(() => { tipEl.textContent = G.phase === "open" ? TIP : ""; tipEl.classList.remove("is-warn"); }, 1800);
  }

  function showTitle() {
    G.phase = "title"; closeBtn.hidden = true; tipEl.textContent = "";
    const best = +localStorage.getItem(BEST) || 0;
    show(`
      <img class="shop__logo" src="assets/stenders-logo.png" alt="STENDERS">
      <p class="shop__tag">NORDIC BATH DELIGHTS</p>
      <h3 class="shop__title">像 素 门 店</h3>
      <p class="shop__sub">一家 STENDERS 门店 · 两位 BA · 每天 60 秒</p>
      <ul class="shop__rules">
        <li><b>派单</b>点顾客，最近的空闲 BA 会过去一对一接待</li>
        <li><b>成交</b>有 BA 接待 55% 成交，没人管只有 15%</li>
        <li><b>补货</b>货架空了点一下加急补，但进价翻倍</li>
        <li><b>引流</b>点泡泡池冒泡，马上吸引一位顾客进店</li>
        <li><b>活下去</b>打烊后付工资和房租，现金为负就歇业</li>
      </ul>
      ${best ? `<p class="shop__sub">最好成绩：撑到第 ${best} 天</p>` : ""}
      <button class="btn" data-go="prep">开 始 营 业</button>`);
  }

  function openPrep() {
    G.phase = "prep"; closeBtn.hidden = true; tipEl.textContent = "";
    autoOrder();
    renderPrep();
  }
  const orderCost = () => CATS.reduce((s, c) => s + (G.order[c.id] || 0) * c.cost, 0);
  function autoOrder() {
    const total = CATS.reduce((s, c) => s + c.demand, 0);
    let budget = G.money * 0.6;
    CATS.forEach((c) => {
      const room = cap() - G.stock[c.id];
      const want = Math.min(room, Math.round((c.demand / total) * 34));
      const n = Math.max(0, Math.min(want, Math.floor((budget * c.demand) / total / c.cost) + 1));
      G.order[c.id] = Math.min(n, room);
    });
    while (orderCost() > G.money) { const c = CATS.find((k) => G.order[k.id] > 0); if (!c) break; G.order[c.id]--; }
  }
  function renderPrep() {
    const cost = orderCost();
    const rows = CATS.map((c) => {
      const room = cap() - G.stock[c.id], q = G.order[c.id];
      return `<div class="shop__row">
        <i style="background:${c.color}${c.id === "bomb" ? ";border-radius:50%" : ""}"></i>
        <div><b>${c.name}</b><small>进价 ¥${c.cost} · 售价 ¥${c.price[0]}–${c.price[1]} · ${c.items.length} 款 · 库存 ${G.stock[c.id]}/${cap()}</small></div>
        <div class="shop__step">
          <button data-dec="${c.id}" ${q <= 0 ? "disabled" : ""} aria-label="${c.name}少订一件">−</button>
          <span>${q}</span>
          <button data-inc="${c.id}" ${q >= room || cost + c.cost > G.money ? "disabled" : ""} aria-label="${c.name}多订一件">+</button>
        </div></div>`;
    }).join("");
    show(`
      <h3 class="shop__title">DAY ${G.day} · 备货</h3>
      <p class="shop__sub">今晚要付：BA 工资 ¥${G.staff.length * SALARY} + 房租 ¥${rent()}</p>
      ${rows}
      <div class="shop__sum"><span>备货支出</span><b>¥${cost}</b></div>
      <div class="shop__sum"><span>备货后现金</span><b>¥${G.money - cost}</b></div>
      <div class="shop__btns"><button class="btn" data-go="open">开 门 营 业</button><button class="btn btn--ghost" data-go="auto">推荐配货</button></div>`);
  }

  function startDay() {
    const cost = orderCost();
    G.money -= cost;
    CATS.forEach((c) => (G.stock[c.id] += G.order[c.id]));
    G.st = { rev: 0, spent: cost, cogs: 0, rushExtra: 0, served: 0, deals: 0, self: 0, left: 0, oos: 0, pool: 0, rep0: G.rep };
    G.phase = "open"; G.t = 0; G.spawnT = 0.6; G.autoT = 0; G.closeT = 0; G.poolT = 0;
    G.cust = []; G.queue = []; G.fx = []; G.parts = [];
    G.staff.forEach((s) => { s.x = s.home.x; s.y = s.home.y; s.state = "idle"; s.c = null; s.stat = { served: 0, deals: 0, rev: 0 }; });
    hide(); closeBtn.hidden = false; tipEl.textContent = TIP; SFX.day();
  }
  function startClosing() {
    if (G.phase !== "open") return;
    G.phase = "closing"; G.closeT = 5; closeBtn.hidden = true;
    tip("打烊中 · 送走最后几位顾客"); SFX.day();
  }

  function endDay() {
    // 还在排队的顾客直接结账
    G.queue.forEach((c) => { G.money += c.price; G.st.rev += c.price; if (c.by) c.by.stat.rev += c.price; });
    G.queue = []; G.cust = []; G.parts = [];
    const salary = G.staff.length * SALARY, r = rent();
    G.money -= salary + r;
    // 净利按卖出的货算成本，没卖完的库存留到明天，不算亏
    const net = G.st.rev - G.st.cogs - G.st.rushExtra - salary - r;
    G.total += net;
    const best = +localStorage.getItem(BEST) || 0;
    if (G.day > best) localStorage.setItem(BEST, G.day);
    SFX.day();
    if (G.money < 0) return gameOver();
    G.phase = "settle"; tipEl.textContent = "";
    renderSettle({ salary, r, net });
  }
  const signed = (n) => `${n >= 0 ? "+" : "-"}¥${Math.abs(Math.round(n))}`;
  function renderSettle(s) {
    G.lastSettle = s;
    const st = G.st, rate = st.served ? Math.round((st.deals / st.served) * 100) : 0;
    const ups = UPS.map((u) => {
      const lv = G.up[u.id], max = lv >= u.costs.length, price = u.costs[lv];
      const dots = u.costs.map((_, i) => `<i class="${i < lv ? "on" : ""}"></i>`).join("");
      return `<div class="shop__up"><div><b>${u.name}</b><small>${u.desc}</small><span class="shop__dots">${dots}</span></div>
        <button class="btn btn--sm" data-up="${u.id}" ${max || G.money < price ? "disabled" : ""}>${max ? "满级" : "¥" + price}</button></div>`;
    }).join("");
    const team = G.staff.map((b) => `<div><dt>${b.name}</dt><dd>接待 ${b.stat.served} · 成交 ${b.stat.deals} · ¥${b.stat.rev}</dd></div>`).join("");
    const canHire = G.staff.length < MAX_STAFF;
    show(`
      <h3 class="shop__title">DAY ${G.day} · 打烊</h3>
      <dl class="shop__stats">
        <div><dt>营业额</dt><dd>¥${st.rev}</dd></div>
        <div><dt>商品成本</dt><dd>-¥${st.cogs}</dd></div>
        <div><dt>加急补货多花</dt><dd>-¥${st.rushExtra}</dd></div>
        <div><dt>BA 工资 ×${G.staff.length}</dt><dd>-¥${s.salary}</dd></div>
        <div><dt>房租</dt><dd>-¥${s.r}</dd></div>
        <div class="${s.net >= 0 ? "good" : "bad"}"><dt>今日净利</dt><dd>${signed(s.net)}</dd></div>
        <div><dt>累计利润</dt><dd>${signed(G.total)}</dd></div>
        <div><dt>现金</dt><dd>¥${G.money}</dd></div>
        <div><dt>接待 / 成交</dt><dd>${st.served} / ${st.deals}（${rate}%）</dd></div>
        <div><dt>自己买 / 没人理走了</dt><dd>${st.self} / ${st.left}</dd></div>
        <div><dt>缺货流失</dt><dd>${st.oos} 位</dd></div>
        <div><dt>泡泡池引流</dt><dd>${st.pool} 位</dd></div>
        <div><dt>口碑</dt><dd>${Math.round(st.rep0)} → ${Math.round(G.rep)}</dd></div>
      </dl>
      <p class="shop__sub">BA 团队</p>
      <dl class="shop__stats shop__stats--team">${team}</dl>
      <p class="shop__sub">门店升级（剩余库存会留到明天）</p>
      <div class="shop__up"><div><b>招聘 BA</b><small>每天工资 ¥${SALARY} · 现有 ${G.staff.length}/${MAX_STAFF}</small></div>
        <button class="btn btn--sm" data-up="hire" ${!canHire || G.money < HIRE ? "disabled" : ""}>${canHire ? "¥" + HIRE : "已满"}</button></div>
      ${ups}
      <button class="btn" data-go="next">进入第 ${G.day + 1} 天</button>`);
  }
  function gameOver() {
    G.phase = "over"; closeBtn.hidden = true; tipEl.textContent = "";
    show(`
      <h3 class="shop__title">门 店 歇 业</h3>
      <p class="shop__big">${G.day}</p>
      <p class="shop__sub">撑了 ${G.day} 天 · 累计利润 ${signed(G.total)}</p>
      <p class="shop__sub">现金付不起今晚的工资和房租了。下次试试：把 BA 的时间花在高客单上。</p>
      <button class="btn" data-go="restart">重新开张</button>`);
  }

  card.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    initAudio(); SFX.tap();
    const go = b.dataset.go;
    if (go === "prep") openPrep();
    if (go === "auto") { autoOrder(); renderPrep(); }
    if (go === "open") startDay();
    if (go === "next") { G.day++; openPrep(); }
    if (go === "restart") newGame();
    if (b.dataset.inc) { G.order[b.dataset.inc]++; renderPrep(); }
    if (b.dataset.dec) { G.order[b.dataset.dec]--; renderPrep(); }
    const up = b.dataset.up;
    if (up === "hire") { G.money -= HIRE; G.staff.push(makeStaff(G.staff.length)); SFX.good(); renderSettle(G.lastSettle); }
    else if (up) {
      const u = UPS.find((k) => k.id === up);
      G.money -= u.costs[G.up[up]]; G.up[up]++;
      SFX.good(); renderSettle(G.lastSettle);
    }
  });
  closeBtn.addEventListener("click", startClosing);
  muteBtn.addEventListener("click", () => {
    muted = !muted; localStorage.setItem(MUTE, muted ? "1" : "0"); setMuteLabel();
    initAudio(); SFX.tap();
  });

  // ---------- 顾客与 BA ----------
  const OUTFITS = ["#d96c5f", "#5f8fc0", "#7fa98a", "#c89b5e", "#a87fa8", "#5fa8a0", "#c97b8e"];
  function standSpot(cat) {
    const sh = SHELF[CATS.indexOf(cat)];
    const spots = [0, 1, 2, 3].map((k) => ({ x: sh.x + 10 + k * 12, y: 86 + (k % 2) * 6 }));
    let best = spots[0], n = 1e9;
    spots.forEach((p) => { const m = G.cust.filter((c) => !c.dead && c.spot === p.x).length; if (m < n) { n = m; best = p; } });
    return best;
  }
  function spawn() {
    const cat = pick(WEIGHTED);
    const spot = standSpot(cat);
    const item = pick(cat.items);
    const pat = rand(9, 12);
    G.cust.push({ x: DOOR.x + rand(-4, 4), y: DOOR.y, tx: spot.x, ty: spot.y, spot: spot.x,
      cat, item, price: item.price, st: "in", pat, maxPat: pat, staff: null, by: null, reserved: false, dir: 1, payT: 0, bob: rand(0, 6),
      skin: pick(["#f2cba8", "#e8b98f", "#d9a278", "#c08658"]), hair: pick(["#3a2a20", "#5a3b28", "#221c18", "#8a5a38"]),
      outfit: pick(OUTFITS), speed: rand(40, 50) });
  }
  // 绕开泡泡池（椭圆障碍）
  function avoidPool(e) {
    const dx = (e.x - POOL.x) / (POOL.rx + 4), dy = (e.y - POOL.y) / (POOL.ry + 4), d = Math.hypot(dx, dy);
    if (d < 1 && d > 0.001) { e.x = POOL.x + (dx / d) * (POOL.rx + 4); e.y = POOL.y + (dy / d) * (POOL.ry + 4); }
  }
  function moveTo(e, tx, ty, dt, sp) {
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d < 1) { e.x = tx; e.y = ty; return true; }
    const v = Math.min(d, sp * dt);
    e.x += (dx / d) * v; e.y += (dy / d) * v;
    if (Math.abs(dx) > 0.5) e.dir = dx > 0 ? 1 : -1;
    avoidPool(e);
    return false;
  }
  function fx(text, x, y, color) { G.fx.push({ text, x, y, color, life: 1.1 }); }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.28), sp = rand(8, 30);
      G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 12, g: 40, life: rand(0.35, 0.7), max: 0.7, color, size: 1 + (Math.random() < 0.5) });
    }
  }

  function dispatch(c, silent) {
    if (c.st !== "browse" || c.staff) return false;
    let s = null, bd = 1e9;
    G.staff.forEach((k) => { if (k.state === "idle" && dist(k, c) < bd) { bd = dist(k, c); s = k; } });
    if (!s) { if (!silent) { tip("BA 都在接待中", true); SFX.no(); } return false; }
    if (G.stock[c.cat.id] <= 0) { if (!silent) { tip(`${c.cat.name}缺货，点货架加急补货`, true); SFX.no(); } return false; }
    G.stock[c.cat.id]--; c.reserved = true;
    s.state = "go"; s.c = c; c.staff = s; c.st = "wait";
    fx("派单", c.x, c.y - 24, "#ffd57a");
    if (!silent) SFX.tap();
    return true;
  }
  function sale(c, by) {
    if (by) { G.st.deals++; by.stat.deals++; c.by = by; } else G.st.self++;
    G.st.cogs += c.cat.cost;
    G.rep = clamp(G.rep + (by ? 0.8 : 0.3), 0, 100);
    c.st = "pay"; G.queue.push(c);
    burst(c.x, c.y - 12, "#ffd57a", 6);
  }
  function leave(c, text, color) { c.st = "leave"; if (text) fx(text, c.x, c.y - 24, color || "#9fb3d1"); }
  function release(c) { if (c.reserved) { G.stock[c.cat.id]++; c.reserved = false; } }

  function rush(sh) {
    const c = sh.c, room = cap() - G.stock[c.id];
    if (room <= 0) { SFX.no(); return tip(`${c.name}货架是满的`); }
    const n = Math.min(3, room), price = n * c.cost * RUSH;
    if (G.money < price) { SFX.no(); return tip("现金不够加急补货", true); }
    G.money -= price; G.st.spent += price; G.st.rushExtra += price - n * c.cost; G.stock[c.id] += n;
    fx(`+${n} -¥${price}`, sh.x + sh.w / 2 - 16, sh.y + sh.h + 2, "#ff8a7a");
    SFX.good();
  }
  function puffPool() {
    if (G.poolT > 0) { SFX.no(); return tip(`泡泡还在飘 · ${Math.ceil(G.poolT)}s`, true); }
    if (G.cust.length >= 12) { SFX.no(); return tip("店里挤满了", true); }
    G.poolT = poolCd(); G.st.pool++;
    for (let i = 0; i < 14; i++)
      G.parts.push({ x: POOL.x + rand(-12, 12), y: POOL.y - rand(0, 6), vx: rand(-10, 10), vy: rand(-40, -14), g: 0,
        life: rand(0.6, 1.2), max: 1.2, color: "#ffffff", size: 1 + (Math.random() < 0.5), bubble: true });
    spawn();
    fx("引流", POOL.x - 10, POOL.y - 26, "#7fd99a");
    SFX.foam();
  }

  function update(dt) {
    if (G.phase === "open") {
      G.t += dt; G.spawnT -= dt;
      if (G.poolT > 0) G.poolT = Math.max(0, G.poolT - dt);
      if (G.spawnT <= 0) {
        if (G.cust.length < 12) spawn();
        const base = Math.max(1.9, 3.1 - 0.1 * (G.day - 1));
        G.spawnT = base * (1.2 - G.rep / 250) * Math.pow(0.9, G.up.ads) * rand(0.8, 1.2);
      }
      if (G.up.auto && (G.autoT -= dt) <= 0) {
        G.autoT = 0.8;
        const w = G.cust.filter((c) => c.st === "browse" && !c.staff && G.stock[c.cat.id] > 0).sort((a, b) => b.price - a.price);
        if (w[0]) dispatch(w[0], true);
      }
      if (G.t >= G.len) startClosing();
    } else if (G.phase === "closing") {
      G.closeT -= dt;
      G.cust.forEach((c) => { if (c.st === "browse" || c.st === "in") leave(c); });
      if (G.closeT <= 0 || G.cust.every((c) => c.st === "leave" || c.dead)) return endDay();
    } else return;

    G.staff.forEach((s) => {
      if (s.state === "idle") moveTo(s, s.home.x, s.home.y, dt, 40);
      else if (s.state === "go") {
        const c = s.c;
        if (moveTo(s, c.x - 10 * c.dir, c.y + 1, dt, 70)) { s.state = "serve"; s.t = svcTime(c); c.st = "serve"; s.dir = c.dir; }
      } else if (s.state === "serve") {
        if ((s.t -= dt) <= 0) {
          const c = s.c; c.staff = null; s.c = null; s.state = "back"; G.st.served++; s.stat.served++;
          if (Math.random() < conv()) { c.reserved = false; sale(c, s); fx("成交", c.x, c.y - 24, "#7fd99a"); SFX.good(); }
          else { release(c); G.rep = clamp(G.rep + 0.1, 0, 100); leave(c, "再逛逛"); }
        }
      } else if (s.state === "back" && moveTo(s, s.home.x, s.home.y, dt, 70)) s.state = "idle";
    });

    G.cust.forEach((c) => {
      c.bob += dt;
      if (c.st === "in") {
        if (moveTo(c, c.tx, c.ty, dt, c.speed)) {
          if (G.stock[c.cat.id] <= 0) { G.st.oos++; G.rep = clamp(G.rep - 2, 0, 100); leave(c, "缺货…", "#ff8a7a"); }
          else c.st = "browse";
        }
      } else if (c.st === "browse") {
        if ((c.pat -= dt) <= 0) {
          if (Math.random() < 0.15 && G.stock[c.cat.id] > 0) { G.stock[c.cat.id]--; sale(c, null); }
          else { G.st.left++; G.rep = clamp(G.rep - 1, 0, 100); leave(c, "没人理", "#ff8a7a"); }
        }
      } else if (c.st === "pay") {
        const idx = G.queue.indexOf(c), slot = queueSlot(Math.min(idx, 5));
        if (moveTo(c, slot.x, slot.y, dt, 46) && idx === 0 && (c.payT += dt) > 0.7) {
          G.money += c.price; G.st.rev += c.price; G.queue.shift();
          if (c.by) c.by.stat.rev += c.price;
          fx("+¥" + c.price, c.x - 10, c.y - 26, "#ffd57a");
          SFX.cash();
          leave(c);
        }
      } else if (c.st === "leave") {
        if (moveTo(c, DOOR.x, DOOR.y, dt, c.speed)) c.dead = true;
      }
    });
    G.cust = G.cust.filter((c) => !c.dead);
    G.fx.forEach((f) => { f.life -= dt; f.y -= 14 * dt; });
    G.fx = G.fx.filter((f) => f.life > 0);
    G.parts.forEach((p) => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; });
    G.parts = G.parts.filter((p) => p.life > 0);
  }

  // ---------- 绘制 ----------
  const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const ellipse = (x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
  function text(s, x, y, color, align = "left") {
    g.font = '8px "DotGothic16", monospace'; g.textAlign = align; g.textBaseline = "top";
    g.fillStyle = "#000"; g.fillText(s, x + 1, y + 1);
    g.fillStyle = color; g.fillText(s, x, y);
  }
  function person(p, outfit, isStaff) {
    const x = Math.round(p.x), y = Math.round(p.y);
    const walk = p.st === "in" || p.st === "leave" || p.st === "pay" || p.state === "go" || p.state === "back";
    const step = walk ? (Math.floor(p.x / 4 + p.y / 4) % 2) : 0;
    px(x - 4, y - 1, 9, 2, "#00000055");                                   // 影子
    px(x - 3, y - 4, 2, 4 - step, "#1a1410"); px(x + 1, y - 4, 2, 3 + step, "#1a1410"); // 腿
    px(x - 4, y - 11, 8, 7, outfit);                                         // 身体
    if (isStaff) { px(x - 3, y - 10, 6, 6, "#f1e6ce"); px(x - 1, y - 9, 2, 1, "#e8b64c"); } // 围裙 + 工牌
    px(x - 3, y - 16, 6, 5, p.skin);                                         // 头
    px(x - 3, y - 17, 6, 2, p.hair); px(p.dir > 0 ? x - 3 : x + 2, y - 16, 1, 3, p.hair);
    px(p.dir > 0 ? x + 1 : x - 2, y - 14, 1, 1, "#1a1410");                 // 眼睛
  }
  function drawStaff(s, t) {
    person(s, "#2c5a94", true);
    // 头顶状态灯：空闲绿 / 忙碌橙
    const x = Math.round(s.x), y = Math.round(s.y) - 23, idle = s.state === "idle";
    const lc = idle ? "#7fd99a" : "#f0a050";
    px(x - 2, y - 1, 5, 5, "#000"); px(x - 1, y, 3, 3, lc);
    if (idle && Math.floor(t / 250) % 3 === 0) px(x - 1, y, 1, 1, "#d8ffd8");
  }
  let hover = null;
  function drawSign() {
    // 门头招牌：深色底 + 金边 + STENDERS logo
    const w = 84, h = 16, x = (W - w) / 2, y = 2;
    px(x - 1, y - 1, w + 2, h + 2, "#6b5230"); px(x, y, w, h, "#0e0c0b"); px(x + 1, y + 1, w - 2, 1, "#c9a96a");
    if (logo.complete && logo.naturalWidth) {
      const lw = 70, lh = (lw * logo.naturalHeight) / logo.naturalWidth;
      g.imageSmoothingEnabled = true;
      g.drawImage(logo, x + (w - lw) / 2, y + (h - lh) / 2 + 1, lw, lh);
      g.imageSmoothingEnabled = false;
    } else text("STENDERS", W / 2, y + 4, "#f1e6ce", "center");
  }
  function drawPool(t) {
    const { x, y, rx, ry } = POOL, hot = hover === POOL;
    ellipse(x, y + 4, rx + 2, ry + 2, "#00000066");                         // 影子
    ellipse(x, y + 2, rx, ry, hot ? "#e8b64c" : "#0f1416");                 // 池壁
    ellipse(x, y, rx, ry, "#1b1512");
    ellipse(x, y - 2, rx - 3, ry - 3, "#6fa8b8");                           // 水面
    ellipse(x, y - 2, rx - 6, ry - 5, "#8fc4d0");
    for (let i = 0; i < 9; i++) {                                           // 泡沫
      const a = i * 1.9 + t / 2500, rr = (rx - 7) * Math.sqrt((i % 5) / 5);
      px(x + Math.cos(a) * rr, y - 2 + Math.sin(a) * rr * 0.5, 2, 2, "#ffffff");
    }
    if (Math.sin(t / 500) > 0) { px(x - 1, y - 9, 2, 6, "#cfe8ef"); px(x - 2, y - 11, 4, 2, "#ffffff"); } // 喷泉
    if (G.phase !== "open" && G.phase !== "closing") return;
    if (G.poolT > 0) {
      const p = 1 - G.poolT / poolCd();
      for (let i = 0; i < 10; i++) px(x - 15 + i * 3, y - ry - 8, 2, 2, i / 10 < p ? "#ffd57a" : "#2c5a94");
    } else text("泡泡池", x, y - ry - 12, "#8fd0c0", "center");
  }
  function draw(t) {
    // 地板 + 墙
    px(0, 0, W, H, "#0b1d3a");
    for (let y = 62; y < H; y += 16) for (let x = ((y - 62) / 16) % 2 ? 16 : 0; x < W; x += 32) px(x, y, 16, 16, "#0d2246");
    px(0, 0, W, 62, "#061a38"); px(0, 60, W, 2, "#2c5a94");
    drawSign();
    // 门
    px(0, H - 4, 30, 4, "#e8b64c"); px(2, H - 2, 26, 2, "#020a1c");
    text("门口", 32, H - 12, "#5c7398");
    // 货架
    SHELF.forEach((sh) => {
      const c = sh.c, n = G.stock[c.id], hot = hover === sh;
      px(sh.x - 1, sh.y - 1, sh.w + 2, sh.h + 2, hot ? "#e8b64c" : "#2c5a94");
      px(sh.x, sh.y, sh.w, sh.h, "#08214a");
      px(sh.x, sh.y + 10, sh.w, 1, "#1d3d68");
      for (let i = 0; i < cap(); i++) {
        const col = i % 8, row = (i / 8) | 0;
        px(sh.x + 3 + col * 6.5, sh.y + 3 + row * 10, 5, 5, i < n ? c.color : "#0d2a55");
      }
      text(c.name, sh.x + sh.w / 2, sh.y + sh.h + 3, n ? c.color : "#ff8a7a", "center");
      if (!n && G.phase === "open" && Math.floor(t / 400) % 2) text("缺货", sh.x + sh.w / 2, sh.y + 6, "#ff8a7a", "center");
    });
    // 植物装饰
    [[306, 64], [306, 120]].forEach(([x, y]) => { px(x - 4, y - 4, 8, 6, "#5b3d10"); px(x - 6, y - 14, 12, 10, "#3f7a52"); px(x - 3, y - 18, 6, 4, "#5aa070"); });

    // 按 y 排序画人、收银台和泡泡池
    const items = [
      ...G.cust.map((c) => ({ y: c.y, f: () => drawCust(c, t) })),
      ...G.staff.map((s) => ({ y: s.y, f: () => drawStaff(s, t) })),
      { y: COUNTER.y + COUNTER.h, f: drawCounter },
      { y: POOL.y + POOL.ry, f: () => drawPool(t) },
    ].sort((a, b) => a.y - b.y);
    items.forEach((i) => i.f());

    G.parts.forEach((p) => { g.globalAlpha = clamp(p.life / p.max, 0, 1); px(p.x, p.y, p.size, p.size, p.color); });
    G.fx.forEach((f) => { g.globalAlpha = clamp(f.life / 0.4, 0, 1); text(f.text, f.x, f.y, f.color); });
    g.globalAlpha = 1;
  }
  function drawCounter() {
    const c = COUNTER;
    px(c.x, c.y, c.w, c.h, "#5b3d10"); px(c.x, c.y, c.w, 3, "#e8b64c");
    px(c.x + 8, c.y - 7, 14, 7, "#2c5a94"); px(c.x + 10, c.y - 5, 10, 3, "#8cc2ff"); // 收银机
    text("收银", c.x + c.w - 26, c.y + 5, "#f1e6ce");
  }
  function drawCust(c, t) {
    person(c, c.outfit, false);
    if (c.st === "leave") return;
    const x = Math.round(c.x), y = Math.round(c.y) - 26;
    if (c.st === "browse" || c.st === "wait" || c.st === "serve") {
      // 头顶标签：品类色块 + 价格；逛店时下方是耐心条
      const label = "¥" + c.price, w = 8 + label.length * 5;
      const hot = hover === c;
      px(x - w / 2 - 1, y - 1, w + 2, 11, hot ? "#e8b64c" : "#000");
      px(x - w / 2, y, w, 9, "#f1e6ce");
      px(x - w / 2 + 2, y + 2, 4, 5, c.cat.color);
      g.font = '8px "DotGothic16", monospace'; g.textAlign = "left"; g.textBaseline = "top";
      g.fillStyle = "#1f1107"; g.fillText(label, x - w / 2 + 7, y);
      if (c.st === "browse") {
        const r = c.pat / c.maxPat;
        px(x - 8, y + 11, 16, 2, "#000");
        px(x - 8, y + 11, Math.round(16 * r), 2, r > 0.5 ? "#7fd99a" : r > 0.25 ? "#e8b64c" : "#ff8a7a");
      } else if (c.st === "serve" && c.staff) {
        const r = 1 - c.staff.t / svcTime(c);
        px(x - 8, y + 11, 16, 2, "#000"); px(x - 8, y + 11, Math.round(16 * r), 2, "#8cc2ff");
      }
    } else if (c.st === "pay" && Math.floor(t / 300) % 2) text("♪", x + 4, y + 4, "#ffd57a");
  }

  function refreshHUD() {
    hud.day.textContent = G.day;
    hud.money.textContent = G.money;
    hud.rep.textContent = Math.round(G.rep);
    hud.idle.textContent = `${G.staff.filter((s) => s.state === "idle").length}/${G.staff.length}`;
    const left = G.phase === "open" ? 1 - G.t / G.len : 0;
    const s = Math.max(0, Math.ceil(G.len - G.t));
    hud.clock.textContent = G.phase === "open" ? `00:${String(s).padStart(2, "0")}` : G.phase === "closing" ? "打烊中" : "--:--";
    hud.bar.style.width = left * 100 + "%";
    hud.bar.parentElement.classList.toggle("is-warn", G.phase === "open" && left < 0.25);
  }

  // ---------- 交互 ----------
  function toCanvas(e) {
    const r = cv.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }
  function hitTest(p) {
    if (G.phase !== "open") return null;
    const c = G.cust.filter((c) => c.st === "browse" && !c.staff)
      .find((c) => p.x > c.x - 12 && p.x < c.x + 12 && p.y > c.y - 30 && p.y < c.y + 2);
    if (c) return c;
    if (Math.hypot((p.x - POOL.x) / POOL.rx, (p.y - POOL.y) / (POOL.ry + 4)) < 1.2) return POOL;
    return SHELF.find((s) => p.x > s.x && p.x < s.x + s.w && p.y > s.y && p.y < s.y + s.h + 12) || null;
  }
  cv.addEventListener("pointermove", (e) => {
    const h = hitTest(toCanvas(e));
    cv.style.cursor = h ? "pointer" : "";
    if (h && h.item && h !== hover) cv.title = `想要 · ${h.item.name} ¥${h.price}`;
    else if (!h || !h.item) cv.title = "";
    hover = h;
  });
  cv.addEventListener("pointerleave", () => (hover = null));
  cv.addEventListener("click", (e) => {
    initAudio();
    const h = hitTest(toCanvas(e));
    if (!h) return;
    if (h === POOL) puffPool();
    else if (h.cat) { if (dispatch(h)) tip(`派单 · ${h.item.name} ¥${h.price}`); }
    else rush(h);
  });

  // ---------- 主循环 ----------
  const win = body.closest(".win");
  let raf = 0, last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!win || !win.classList.contains("is-min")) update(dt);
    draw(now); refreshHUD();
    raf = requestAnimationFrame(loop);
  }
  newGame();
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); clearTimeout(tip._t); if (actx) actx.close(); };
};
