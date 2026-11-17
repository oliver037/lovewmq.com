// ============================================================
// STENDERS 顾客视角：第一人称逛店（光线投射 raycasting）
//
//   window.ShopFPS.mount(root, opts) -> { destroy() }
//     root         容纳画面的元素
//     opts.catalog [{ id, name, color, items:[{ name, price }] }]
//     opts.stockOf (catId) => number | Infinity
//     opts.counted 这一单是否计入营业额（门店营业中为 true）
//     opts.onSell  (catId, item) => boolean   结账时逐件调用，返回是否成交
//     opts.onExit  () => void                 点右上角 × 或按 Esc
// ============================================================
window.ShopFPS = (function () {
  "use strict";

  const W = 320, H = 224, HORIZON = H / 2, PLANE = 0.66; // 视野约 66°
  const EYE = 0.5;                                        // 眼高（墙高 = 1）

  // ---------- 店面地图 ----------
  // # 墙  S 招牌墙  D 玻璃门  1-5 五类货架  K 收银台  p 绿植  . 空地（泡泡池单独做精灵+圆形碰撞）
  const MW = 26, MH = 20;
  const grid = Array.from({ length: MH }, () => new Array(MW).fill("."));
  for (let x = 0; x < MW; x++) { grid[0][x] = "#"; grid[MH - 1][x] = "#"; }
  for (let y = 0; y < MH; y++) { grid[y][0] = "#"; grid[y][MW - 1] = "#"; }
  const block = (k, x, y, w, h) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++)
      if (j > 0 && j < MH - 1 && i > 0 && i < MW - 1) grid[j][i] = k;
  };
  block("1", 3, 5, 4, 2);   // 沐浴球
  block("2", 9, 5, 4, 2);   // 手工皂
  block("3", 15, 5, 4, 2);  // 身体护理
  block("4", 3, 11, 4, 2);  // 香氛
  block("5", 15, 11, 4, 2); // 礼盒
  block("K", 19, 15, 4, 1); // 收银台
  for (let x = 9; x <= 16; x++) grid[0][x] = "S";
  grid[19][12] = "D"; grid[19][13] = "D";
  [[2, 3], [23, 3], [2, 16], [23, 16]].forEach(([x, y]) => (grid[y][x] = "p"));
  // 泡泡池不入格子图：它是个矮池子，用精灵画，单独做圆形碰撞
  const POOL_POS = { x: 8.4, y: 8.6, r: 1.05 };

  const SOLID = new Set(["#", "S", "D", "1", "2", "3", "4", "5", "K"]);
  const SHELF = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };  // 格子 -> catalog 下标
  const tileAt = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH ? "#" : grid[y][x]);

  // ---------- 贴图 ----------
  const fr = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  function makeTex(draw, size = 16) {
    const cv = document.createElement("canvas"); cv.width = cv.height = size;
    draw(cv.getContext("2d")); return cv;
  }
  const TEX = {};
  TEX["#"] = makeTex((c) => {
    fr(c, 0, 0, 16, 16, "#0a1c38");
    fr(c, 0, 0, 16, 2, "#16375c");
    fr(c, 0, 15, 16, 1, "#061223");
    fr(c, 0, 9, 16, 1, "#081627");
    for (let i = 0; i < 4; i++) fr(c, i * 4 + 3, 5, 1, 1, "#12305a");
  });
  TEX["S"] = makeTex((c) => {
    fr(c, 0, 0, 16, 16, "#241a12");                       // 木墙
    fr(c, 0, 0, 16, 1, "#3a2a1c");
    fr(c, 0, 15, 16, 1, "#120d08");
    fr(c, 1, 3, 14, 7, "#0e0c0b");                        // 招牌底
    fr(c, 1, 3, 14, 1, "#6b5230"); fr(c, 1, 9, 14, 1, "#6b5230");
    fr(c, 1, 3, 1, 7, "#6b5230"); fr(c, 14, 3, 1, 7, "#6b5230");
    fr(c, 3, 6, 10, 1, "#c9a96a");                        // 字
  });
  TEX["D"] = makeTex((c) => {
    fr(c, 0, 0, 16, 16, "#030d22");
    for (let i = 0; i < 9; i++) fr(c, (i * 7 + 3) % 14 + 1, (i * 5 + 2) % 12 + 1, 1, 1, "#cfe0ff");
    fr(c, 0, 0, 2, 16, "#3a2f22"); fr(c, 14, 0, 2, 16, "#3a2f22");
    fr(c, 7, 7, 2, 3, "#e8b64c"); fr(c, 0, 0, 16, 1, "#3a2f22");
  });
  // 货架贴图：用真实商品图绘制（图加载完成后重建）
  const shelfSrc = {};
  function buildShelfTex(i) {
    const entry = shelfSrc[i];
    if (!entry) return;
    const { color, items } = entry;
    const img = items.map((it) => it.img && IMG_CACHE[it.img]).find((im) => im && im.complete && im.naturalWidth);
    const size = 32;
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const c = cv.getContext("2d");
    fr(c, 0, 0, size, size, "#1d140d");
    fr(c, 0, 0, size, 6, "#3a2a1c");
    fr(c, 0, 2, size, 3, color);
    [10, 20, 30].forEach((y) => {
      fr(c, 2, y, size - 4, 2, "#6b5230");
      for (let k = 0; k < 4; k++) {
        const x = 3 + k * 7;
        if (img) {
          c.imageSmoothingEnabled = true;
          c.drawImage(img, x, y - 7, 6, 7);
        } else fr(c, x + 1, y - 5, 4, 5, k % 2 ? color : "#f1e6ce");
      }
    });
    fr(c, 0, 0, 1, size, "#0d0a07"); fr(c, size - 1, 0, 1, size, "#0d0a07");
    TEX[String(i + 1)] = cv;
  }
  const IMG_CACHE = {};
  function prepareCatalog(catalog) {
    catalog.forEach((c, i) => {
      shelfSrc[i] = c;
      c.items.forEach((it) => {
        if (!it.img || IMG_CACHE[it.img]) return;
        const im = new Image();
        im.onload = () => buildShelfTex(i);
        im.src = it.img;
        IMG_CACHE[it.img] = im;
      });
      buildShelfTex(i);
    });
  }
  TEX["K"] = makeTex((c) => {
    fr(c, 0, 0, 16, 16, "#2a2018");
    fr(c, 0, 0, 16, 3, "#e8b64c");
    fr(c, 0, 3, 16, 1, "#a07c33");
    fr(c, 3, 7, 5, 4, "#0d1b2a"); fr(c, 4, 8, 3, 2, "#8cc2ff");
    fr(c, 0, 15, 16, 1, "#120d08");
  });

  // 精灵（广告牌）
  const poolSpr = makeTex((c) => {
    c.fillStyle = "#0f1416"; c.beginPath(); c.ellipse(22, 21, 21, 7, 0, 0, 7); c.fill();
    c.fillStyle = "#1b1512"; c.beginPath(); c.ellipse(22, 19, 18, 6, 0, 0, 7); c.fill();
    c.fillStyle = "#6fa8b8"; c.beginPath(); c.ellipse(22, 17, 16, 5, 0, 0, 7); c.fill();
    c.fillStyle = "#8fc4d0"; c.beginPath(); c.ellipse(22, 16.5, 12, 3.5, 0, 0, 7); c.fill();
    for (let i = 0; i < 8; i++) fr(c, 12 + ((i * 7) % 20), 15 + (i % 3), 2, 2, "#ffffff");
    fr(c, 21, 5, 2, 11, "#cfe8ef"); fr(c, 19, 3, 6, 2, "#ffffff");
    fr(c, 14, 8, 2, 2, "#ffffff"); fr(c, 28, 9, 2, 2, "#ffffff");
  }, 44);

  const plantSpr = makeTex((c) => {
    fr(c, 5, 15, 6, 5, "#b06a44"); fr(c, 4, 14, 8, 2, "#8a4f31");
    fr(c, 6, 9, 4, 6, "#3f6b4c");
    fr(c, 2, 6, 5, 5, "#4f7a5a"); fr(c, 9, 5, 5, 7, "#4f7a5a");
    fr(c, 5, 2, 5, 6, "#5f8f6a"); fr(c, 3, 9, 4, 4, "#3f6b4c");
  }, 16);

  const baSpr = makeTex((c) => {
    fr(c, 5, 21, 3, 3, "#1a1410"); fr(c, 9, 21, 3, 3, "#1a1410");
    fr(c, 4, 12, 9, 9, "#2c5a94");
    fr(c, 6, 13, 5, 7, "#f1e6ce"); fr(c, 7, 14, 3, 2, "#e8b64c");
    fr(c, 5, 5, 7, 7, "#f2cba8");
    fr(c, 5, 3, 7, 3, "#2a1c14"); fr(c, 4, 5, 2, 5, "#2a1c14"); fr(c, 11, 5, 2, 5, "#2a1c14");
    fr(c, 7, 8, 1, 1, "#1a1410"); fr(c, 10, 8, 1, 1, "#1a1410");
    fr(c, 7, 17, 3, 1, "#e8b64c");
  }, 16);

  const logoImg = new Image();
  logoImg.src = "assets/stenders-logo.png";
  let logoSpr = null;
  logoImg.onload = () => {
    const c = document.createElement("canvas");
    const lw = 120, lh = Math.round((lw * logoImg.naturalHeight) / logoImg.naturalWidth);
    c.width = lw; c.height = lh;
    const x = c.getContext("2d");
    x.drawImage(logoImg, 0, 0, lw, lh);
    logoSpr = c;
  };

  // ---------- 玩家 ----------
  const SPAWN = { x: 12.5, y: 17.4, a: -Math.PI / 2 };
  const P = { x: SPAWN.x, y: SPAWN.y, a: SPAWN.a, dirX: 0, dirY: -1 }; // 面朝北
  const syncDir = () => { P.dirX = Math.cos(P.a); P.dirY = Math.sin(P.a); };
  const respawn = () => { P.x = SPAWN.x; P.y = SPAWN.y; P.a = SPAWN.a; syncDir(); };
  syncDir();
  P.planeX = () => -P.dirY * PLANE;
  P.planeY = () => P.dirX * PLANE;

  function blocked(x, y) {
    const r = 0.26;
    if ([[-r, -r], [r, -r], [-r, r], [r, r]].some(([ox, oy]) => SOLID.has(tileAt(Math.floor(x + ox), Math.floor(y + oy))))) return true;
    // 泡泡池圆形障碍
    return Math.hypot(x - POOL_POS.x, y - POOL_POS.y) < POOL_POS.r;
  }

  // ---------- 主函数 ----------
  function mount(root, opts) {
    root.innerHTML = `
      <div class="fps">
        <canvas class="fps__cv" width="${W}" height="${H}"></canvas>
        <div class="fps__hud">
          <div class="fps__cart">🛒 <b data-k="n">0</b> 件 · <b data-k="sum">¥0</b></div>
          <div class="fps__list" data-k="list"></div>
          <button class="fps__exit" data-act="exit" aria-label="退出顾客视角">×</button>
        </div>
        <button class="fps__act" data-act="do" hidden></button>
        <div class="fps__joy" data-k="joy" hidden><i></i></div>
        <div class="fps__panel" data-k="panel" hidden></div>
        <p class="fps__hint">WASD / 方向键移动 · 拖动鼠标转头 · E 或点一下互动</p>
      </div>`;
    const cv = root.querySelector(".fps__cv"), g = cv.getContext("2d");
    g.imageSmoothingEnabled = false;
    const elN = root.querySelector('[data-k="n"]'), elSum = root.querySelector('[data-k="sum"]');
    const elList = root.querySelector('[data-k="list"]'), elAct = root.querySelector('[data-act="do"]');
    const elPanel = root.querySelector('[data-k="panel"]'), elJoy = root.querySelector('[data-k="joy"]');
    const elHint = root.querySelector(".fps__hint");
    const win = root.closest(".win");
    const coarse = matchMedia("(pointer: coarse)").matches;
    if (coarse) elHint.textContent = "左半屏拖动走路 · 右半屏拖动转头 · 点一下互动";

    // ---------- 购物 ----------
    let cart = [], list = [], shelfOpen = null, receiptOpen = false;
    const reserved = (catId) => cart.filter((l) => l.cat.id === catId).length;
    const total = () => cart.reduce((s, l) => s + l.item.price, 0);
    function newList() {
      const pool = [];
      opts.catalog.forEach((c) => c.items.forEach((it) => pool.push({ cat: c, item: it })));
      list = [];
      const cats = [...opts.catalog].sort(() => Math.random() - 0.5).slice(0, Math.min(3, opts.catalog.length));
      cats.forEach((c) => list.push({ name: c.items[(Math.random() * c.items.length) | 0].name, cat: c.id }));
      void pool;
    }
    function refreshCart() {
      elN.textContent = cart.length;
      elSum.textContent = "¥" + total();
      elList.innerHTML = list.map((it) =>
        `<span class="${cart.some((l) => l.item.name === it.name) ? "done" : ""}">${it.name}</span>`).join("");
    }

    function openShelf(cat) {
      shelfOpen = cat;
      const rows = cat.items.map((it, i) => {
        const left = opts.stockOf(cat.id) - reserved(cat.id);
        const gone = left <= 0;
        return `<div class="fps__item"><span>${it.name}</span><b>¥${it.price}</b>
          <button class="btn btn--sm" data-take="${i}" ${gone ? "disabled" : ""}>${gone ? "缺货" : "拿取"}</button></div>`;
      }).join("");
      elPanel.innerHTML = `<div class="fps__sheet">
        <h4>${cat.name}</h4>
        <p class="fps__note">库存 ${opts.stockOf(cat.id) === Infinity ? "充足" : opts.stockOf(cat.id)} 件</p>
        <div class="fps__items">${rows}</div>
        <button class="btn btn--ghost btn--sm" data-close>返回店里</button></div>`;
      elPanel.hidden = false;
    }
    function closePanel() { elPanel.hidden = true; shelfOpen = null; receiptOpen = false; }

    function checkout() {
      if (!cart.length) { return; }
      let sum = 0, sold = 0;
      cart.forEach((l) => {
        if (opts.onSell(l.cat.id, l.item)) { sum += l.item.price; sold++; }
      });
      const got = list.filter((it) => cart.some((l) => l.item.name === it.name)).length;
      receiptOpen = true;
      elPanel.innerHTML = `<div class="fps__sheet fps__sheet--receipt">
        <p class="fps__brand">STENDERS</p>
        <p class="fps__note">小 票 · 感谢光临</p>
        <div class="fps__items">${cart.map((l) =>
          `<div class="fps__item"><span>${l.item.name}</span><b>¥${l.item.price}</b></div>`).join("")}</div>
        <div class="fps__item fps__item--total"><span>合计（${sold} 件）</span><b>¥${sum}</b></div>
        <p class="fps__note">清单完成 ${got} / ${list.length}${got === list.length && list.length ? " · 全部买齐 🎉" : ""}</p>
        <p class="fps__note">${opts.counted ? "已计入今日营业额" : "门店未营业 · 本单不计入营业额"}</p>
        <div class="fps__btns">
          <button class="btn btn--sm" data-again>再逛一圈</button>
          <button class="btn btn--ghost btn--sm" data-close>回到店里</button>
        </div></div>`;
      elPanel.hidden = false;
      cart = []; refreshCart();
    }

    elPanel.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.take !== undefined) {
        const cat = shelfOpen;
        if (!cat) return;
        const it = cat.items[+b.dataset.take];
        cart.push({ cat, item: it });
        refreshCart(); closePanel();
        flash("已放入购物篮");
        return;
      }
      if (b.dataset.again !== undefined) { newList(); refreshCart(); closePanel(); return; }
      if (b.dataset.close !== undefined) { closePanel(); return; }
    });

    // ---------- 输入 ----------
    const keys = new Set();
    const MOVE = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
    const onKey = (e) => {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.code === "Escape") { if (!elPanel.hidden) closePanel(); else exit(); return; }
      if (MOVE.has(e.code)) { keys.add(e.code); e.preventDefault(); return; }
      if (e.code === "KeyE") { e.preventDefault(); interact(); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", (e) => keys.delete(e.code));

    let joy = { on: false, x0: 0, y0: 0, dx: 0, dy: 0 };
    let look = { on: false, x: 0, moved: 0 };
    function localXY(e) {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    }
    cv.addEventListener("pointerdown", (e) => {
      cv.setPointerCapture(e.pointerId);
      const p = localXY(e);
      if (coarse && p.x < p.w * 0.45 && elPanel.hidden) {
        joy = { on: true, x0: p.x, y0: p.y, dx: 0, dy: 0 };
        elJoy.hidden = false;
        elJoy.style.left = p.x + "px"; elJoy.style.top = p.y + "px";
      } else {
        look = { on: true, x: e.clientX, moved: 0 };
      }
    });
    cv.addEventListener("pointermove", (e) => {
      if (joy.on) {
        const p = localXY(e);
        let dx = (p.x - joy.x0) / 44, dy = (p.y - joy.y0) / 44;
        const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
        joy.dx = dx; joy.dy = dy;
        elJoy.querySelector("i").style.transform = `translate(${dx * 16}px,${dy * 16}px)`;
      } else if (look.on) {
        const d = e.clientX - look.x;
        look.x = e.clientX; look.moved += Math.abs(d);
        P.a += d * 0.005; syncDir();
      }
    });
    const endPointer = (e) => {
      if (joy.on) { joy = { on: false, x0: 0, y0: 0, dx: 0, dy: 0 }; elJoy.hidden = true; }
      if (look.on) { if (look.moved < 8) interact(); look.on = false; }
      try { cv.releasePointerCapture(e.pointerId); } catch (_) { /* 已释放 */ }
    };
    cv.addEventListener("pointerup", endPointer);
    cv.addEventListener("pointercancel", endPointer);
    elAct.addEventListener("click", interact);
    root.querySelector('[data-act="exit"]').addEventListener("click", exit);

    function exit() { if (opts.onExit) opts.onExit(); }

    // ---------- 互动 ----------
    let target = null;
    function findTarget() {
      const r = 1.5;
      let best = null, bd = 1e9;
      const x0 = Math.floor(P.x - r), x1 = Math.floor(P.x + r);
      const y0 = Math.floor(P.y - r), y1 = Math.floor(P.y + r);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const k = tileAt(x, y);
        if (!(k in SHELF) && k !== "K") continue;
        const dx = x + 0.5 - P.x, dy = y + 0.5 - P.y, d = Math.hypot(dx, dy);
        if (d > r) continue;
        if (d > 0.7 && (dx * P.dirX + dy * P.dirY) / d < 0.3) continue; // 大致朝向它
        if (d < bd) { bd = d; best = { kind: k, x, y }; }
      }
      return best;
    }
    function interact() {
      if (!elPanel.hidden) return;
      if (target && target.kind === "K") { if (cart.length) checkout(); else flash("篮子是空的"); return; }
      if (target && target.kind in SHELF) {
        openShelf(opts.catalog[SHELF[target.kind]]);
        return;
      }
      flash("走近货架或收银台再按 E");
    }
    let flashT = 0, flashMsg = "";
    function flash(msg) { flashMsg = msg; flashT = 1.4; }

    // ---------- 每帧 ----------
    const zbuf = new Float32Array(W / 2);
    function update(dt) {
      let f = 0, s = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp")) f += 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) f -= 1;
      if (keys.has("KeyA")) s -= 1;
      if (keys.has("KeyD")) s += 1;
      if (joy.on) { f += -joy.dy; s += joy.dx; }
      if (keys.has("ArrowLeft")) { P.a -= dt * 2.2; syncDir(); }
      if (keys.has("ArrowRight")) { P.a += dt * 2.2; syncDir(); }

      if (f || s) {
        const m = Math.hypot(f, s) || 1;
        const sp = 2.3 * dt / m;
        const dx = (P.dirX * f - P.dirY * s) * sp;
        const dy = (P.dirY * f + P.dirX * s) * sp;
        if (!blocked(P.x + dx, P.y)) P.x += dx;
        if (!blocked(P.x, P.y + dy)) P.y += dy;
      }
      target = findTarget();
      if (flashT > 0) flashT -= dt;
      updateAct();
    }
    function updateAct() {
      if (!elPanel.hidden) { elAct.hidden = true; return; }
      if (target && target.kind === "K") {
        elAct.hidden = false;
        elAct.textContent = cart.length ? `结账 ¥${total()}` : "收银台";
        elAct.disabled = !cart.length;
        return;
      }
      if (target && target.kind in SHELF) {
        elAct.hidden = false;
        elAct.textContent = "拿取 · " + opts.catalog[SHELF[target.kind]].name;
        elAct.disabled = false;
        return;
      }
      elAct.hidden = true;
    }

    function render(t) {
      const planeX = P.planeX(), planeY = P.planeY();

      // 天花板 + 地面底色
      g.fillStyle = "#132a4a"; g.fillRect(0, 0, W, HORIZON);
      const grad = g.createLinearGradient(0, HORIZON, 0, H);
      grad.addColorStop(0, "#16324f"); grad.addColorStop(1, "#20446b");
      g.fillStyle = grad; g.fillRect(0, HORIZON, W, H - HORIZON);

      // 地面格子（只画近处，超出的一律留暗）
      const R = 9;
      for (let y = Math.floor(P.y - R); y <= Math.floor(P.y + R); y++) {
        for (let x = Math.floor(P.x - R); x <= Math.floor(P.x + R); x++) {
          if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
          const k = tileAt(x, y);
          if (k === "#" || k === "S" || k === "D") continue;
          const pts = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(([wx, wy]) => {
            const rx = wx - P.x, ry = wy - P.y;
            const inv = 1 / (planeX * P.dirY - P.dirX * planeY);
            const tx = inv * (P.dirY * rx - P.dirX * ry);
            const ty = inv * (-planeY * rx + planeX * ry);
            return { tx, ty };
          });
          if (pts.some((p) => p.ty < 0.22)) continue;
          const scr = pts.map((p) => [
            (W / 2) * (1 + p.tx / p.ty),
            HORIZON + (H * EYE) / p.ty,
          ]);
          const d = Math.hypot(x + 0.5 - P.x, y + 0.5 - P.y);
          g.beginPath(); g.moveTo(scr[0][0], scr[0][1]);
          for (let i = 1; i < 4; i++) g.lineTo(scr[i][0], scr[i][1]);
          g.closePath();
          g.fillStyle = (x + y) % 2 ? "#2a4f78" : "#22425f";
          g.fill();
          g.fillStyle = `rgba(3,10,22,${clamp01(d / 11) * 0.4})`;
          g.fill();
        }
      }

      // 墙
      for (let col = 0; col < W; col += 2) {
        const camX = (2 * col) / W - 1;
        const rx = P.dirX + planeX * camX, ry = P.dirY + planeY * camX;
        let mapX = Math.floor(P.x), mapY = Math.floor(P.y);
        const dX = Math.abs(1 / (rx || 1e-9)), dY = Math.abs(1 / (ry || 1e-9));
        const stepX = rx < 0 ? -1 : 1, stepY = ry < 0 ? -1 : 1;
        let sideX = rx < 0 ? (P.x - mapX) * dX : (mapX + 1 - P.x) * dX;
        let sideY = ry < 0 ? (P.y - mapY) * dY : (mapY + 1 - P.y) * dY;
        let side = 0, hit = "#", depth = 0;        for (let i = 0; i < 64; i++) {
          if (sideX < sideY) { sideX += dX; mapX += stepX; side = 0; } else { sideY += dY; mapY += stepY; side = 1; }
          const k = tileAt(mapX, mapY);
          if (SOLID.has(k)) { hit = k; depth = side === 0 ? sideX - dX : sideY - dY; break; }
        }
        if (!hit || depth <= 0.01) { zbuf[col / 2] = 1e9; continue; }
        zbuf[col / 2] = depth;
        const lineH = H / depth;
        const y0 = HORIZON - lineH / 2;
        let wallX = side === 0 ? P.y + depth * ry : P.x + depth * rx;
        wallX -= Math.floor(wallX);
        const tex = TEX[hit] || TEX["#"];
        const tw = tex.width;
        const tx = Math.min(tw - 1, Math.floor(wallX * tw));
        g.drawImage(tex, tx, 0, 1, tex.height, col, y0, 2, lineH);
        const shade = Math.min(0.42, depth / 22) + (side === 1 ? 0.07 : 0);
        g.fillStyle = `rgba(2,7,18,${shade})`;
        g.fillRect(col, y0, 2, lineH);
      }

      // 精灵
      const sprites = [
        { x: POOL_POS.x, y: POOL_POS.y, w: 1.9, h: 0.55, tex: poolSpr },
        { x: 20.5, y: 14.4, w: 0.55, h: 0.95, tex: baSpr },
        { x: 2.5, y: 3.5, w: 0.5, h: 0.8, tex: plantSpr },
        { x: 23.5, y: 3.5, w: 0.5, h: 0.8, tex: plantSpr },
        { x: 2.5, y: 16.5, w: 0.5, h: 0.8, tex: plantSpr },
        { x: 23.5, y: 16.5, w: 0.5, h: 0.8, tex: plantSpr },
      ];
      if (logoSpr) sprites.push({ x: 13, y: 1.02, w: 2.1, h: 0.34, tex: logoSpr });
      const inv = 1 / (planeX * P.dirY - P.dirX * planeY);
      sprites
        .map((s) => ({ s, d: (s.x - P.x) ** 2 + (s.y - P.y) ** 2 }))
        .sort((a, b) => b.d - a.d)
        .forEach(({ s }) => {
          const rx = s.x - P.x, ry = s.y - P.y;
          const tx = inv * (P.dirY * rx - P.dirX * ry);
          const ty = inv * (-planeY * rx + planeX * ry);
          if (ty < 0.25) return;
          const cx = (W / 2) * (1 + tx / ty);
          const bot = HORIZON + (H * EYE) / ty;
          const top = bot - (H * s.h) / ty;
          const wpx = (H * s.w) / ty;
          const x0 = Math.round(cx - wpx / 2), x1 = Math.round(cx + wpx / 2);
          const srcW = s.tex.width;
          for (let c = x0; c < x1; c += 2) {
            if (c < 0 || c >= W) continue;
            if (ty >= zbuf[(c / 2) | 0]) continue;
            const sx = Math.floor(((c - x0) / Math.max(1, x1 - x0)) * srcW);
            g.drawImage(s.tex, Math.min(srcW - 1, sx), 0, 1, s.tex.height, c, top, 2, bot - top);
          }
          // 距离变暗
          if (ty > 4) {
            g.fillStyle = `rgba(2,7,18,${clamp01((ty - 4) / 10) * 0.5})`;
            g.fillRect(x0, top, x1 - x0, bot - top);
          }
        });

      // 泡泡池冒泡（叠在精灵上方，简单粒子）
      if (Math.hypot(P.x - POOL_POS.x, P.y - POOL_POS.y) < 6) {
        for (let i = 0; i < 5; i++) {
          const ph = (t * 0.6 + i * 1.3) % 1;
          const bx = POOL_POS.x + Math.sin(i * 2.1 + t) * 0.35;
          const bz = 0.15 + ph * 0.5;
          const rx = bx - P.x, ry = POOL_POS.y - P.y;
          const ty = inv * (-planeY * rx + planeX * ry);
          if (ty < 0.3) continue;
          const tx = inv * (P.dirY * rx - P.dirX * ry);
          const sx = (W / 2) * (1 + tx / ty);
          const sy = HORIZON + (H * (EYE - bz)) / ty;
          if (Math.floor(sx / 2) >= 0 && Math.floor(sx / 2) < zbuf.length && ty < zbuf[Math.floor(sx / 2)])
            g.fillStyle = "#ffffff"; g.fillRect(sx | 0, sy | 0, 2, 2);
        }
      }

      // 提示文字
      if (flashT > 0) {
        g.font = '8px "DotGothic16", monospace';
        g.textAlign = "center"; g.textBaseline = "middle";
        g.fillStyle = "rgba(2,8,20,.72)";
        g.fillRect(W / 2 - 50, 150, 100, 13);
        g.fillStyle = "#ffd57a"; g.fillText(flashMsg, W / 2, 157);
      }
    }
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    let raf = 0, last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const hidden = win && win.classList.contains("is-min");
      if (!hidden && elPanel.hidden) update(dt);
      if (!hidden) render(now / 1000);
      raf = requestAnimationFrame(frame);
    }

    prepareCatalog(opts.catalog);
    respawn();
    newList(); refreshCart();
    raf = requestAnimationFrame(frame);
    setTimeout(() => { elHint.style.opacity = "0"; }, 6000);

    return {
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
        root.innerHTML = "";
      },
    };
  }

  return { mount };
})();
