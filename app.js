(() => {
  "use strict";
  const S = window.SITE;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // 像素绘制：月亮 + 猫头鹰
  // ============================================================
  function drawMoon(cv, cells = 32) {
    const ctx = cv.getContext("2d");
    const s = cv.width / cells, r = cells / 2 - 1, c = cells / 2;
    const blues = ["#cfe3ff", "#a9cbf7", "#7fb0ee", "#4a8ce0", "#f1e6ce"];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
        if (d > r) continue;
        if (d > r - 1) { ctx.fillStyle = "#e8b64c"; }           // 金色描边
        else {
          // 云纹：用正弦叠加出一点层次
          const n = Math.sin(x * 0.7) + Math.cos(y * 0.55) + rnd() * 1.2;
          ctx.fillStyle = n > 1.4 ? blues[4] : blues[Math.min(3, Math.floor((n + 2) / 1.1))];
        }
        ctx.fillRect(x * s, y * s, s, s);
      }
    }
  }

  // 12x12 猫头鹰，字符映射颜色
  const OWL = [
    "..G......G..",
    "..GBBBBBBG..",
    ".BBBBBBBBBB.",
    ".BWWBBBBWWB.",
    ".BWKWBBWKWB.",
    ".BWWBYYBWWB.",
    ".BBBBYYBBBB.",
    ".BBPPPPPPBB.",
    ".BBPBPPBPBB.",
    "..BPPPPPPB..",
    "...BBBBBB...",
    "...Y....Y...",
  ];
  const OWL_C = { G: "#e8b64c", B: "#5b3d10", W: "#f1e6ce", K: "#030d22", Y: "#ffd57a", P: "#a06d40" };
  function drawOwl(cv, blink = false) {
    const ctx = cv.getContext("2d"), s = cv.width / 12;
    ctx.clearRect(0, 0, cv.width, cv.height);
    OWL.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === ".") return;
      let col = OWL_C[ch];
      if (blink && (y === 3 || y === 4 || y === 5) && (ch === "W" || ch === "K")) col = y === 4 ? "#030d22" : OWL_C.B;
      ctx.fillStyle = col;
      ctx.fillRect(x * s, y * s, s, s);
    }));
  }

  // ============================================================
  // 夜空背景：星星 + 漂浮的像素方块
  // ============================================================
  const sky = $("#sky"), sctx = sky.getContext("2d");
  let stars = [], blocks = [], W = 0, H = 0;
  function resizeSky() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    sky.width = W * dpr; sky.height = H * dpr;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round(W * H / 5000) }, () => ({
      x: Math.random() * W, y: Math.random() * H, s: Math.random() < 0.85 ? 1 : 2, t: Math.random() * 6,
    }));
    const cols = ["#4a8ce0", "#2c5a94", "#8cc2ff", "#e8b64c", "#1d3d68"];
    blocks = Array.from({ length: Math.round(W / 25) }, () => {
      const edge = Math.random() < 0.5 ? Math.random() * W * 0.18 : W - Math.random() * W * 0.18;
      return { x: edge, y: Math.random() * H, z: 4 + Math.floor(Math.random() * 4) * 4, c: cols[(Math.random() * cols.length) | 0], v: 0.05 + Math.random() * 0.15 };
    });
  }
  let mx = 0, my = 0;
  addEventListener("pointermove", (e) => { mx = e.clientX / W - 0.5; my = e.clientY / H - 0.5; });
  function tickSky(t) {
    sctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + s.t));
      sctx.fillStyle = s.s === 2 ? `rgba(255,213,122,${a})` : `rgba(223,231,244,${a})`;
      sctx.fillRect(s.x | 0, s.y | 0, s.s, s.s);
    }
    for (const b of blocks) {
      if (!reduced) { b.y -= b.v; if (b.y < -20) b.y = H + 20; }
      sctx.globalAlpha = 0.55;
      sctx.fillStyle = b.c;
      sctx.fillRect((b.x + mx * b.z * 2) | 0, (b.y + my * b.z * 2) | 0, b.z, b.z);
    }
    sctx.globalAlpha = 1;
    // 流星，偶尔一颗
    if (!reduced && Math.random() < 0.003) meteors.push({ x: Math.random() * W, y: Math.random() * H * 0.4, l: 0 });
    for (const m of meteors) {
      m.l += 1;
      for (let i = 0; i < 8; i++) {
        sctx.fillStyle = `rgba(255,213,122,${1 - i / 8})`;
        sctx.fillRect(m.x + m.l * 6 - i * 4, m.y + m.l * 3 - i * 2, 2, 2);
      }
    }
    meteors = meteors.filter((m) => m.l < 40);
    requestAnimationFrame(tickSky);
  }
  let meteors = [];
  addEventListener("resize", resizeSky);
  resizeSky();
  requestAnimationFrame(tickSky);

  // ============================================================
  // 开机画面
  // ============================================================
  const boot = $("#boot");
  drawMoon($("#bootMoon"), 24);
  const logs = ["检测月光……OK", "唤醒猫头鹰 Hoot……OK", "挂载作品集……OK", "冲一杯咖啡……OK", "欢迎回来。"];
  let bootDone = false, bootStep = 0;
  function finishBoot() {
    if (bootDone) return;
    bootDone = true;
    boot.classList.add("is-done");
    setTimeout(() => boot.remove(), 700);
    setTimeout(() => owlSay(new Date().getHours() < 5 ? S.owl.night : S.owl.greet), 900);
  }
  const bootTimer = setInterval(() => {
    if (bootStep >= logs.length) { clearInterval(bootTimer); setTimeout(finishBoot, 350); return; }
    const li = document.createElement("li");
    li.textContent = logs[bootStep++];
    $("#bootLog").append(li);
    $(".boot__bar span").style.width = (bootStep / logs.length) * 100 + "%";
  }, reduced ? 60 : 320);
  const skip = () => { clearInterval(bootTimer); finishBoot(); };
  boot.addEventListener("click", skip);
  addEventListener("keydown", function k() { if (!bootDone) skip(); removeEventListener("keydown", k); }, { once: true });

  // ============================================================
  // 月亮
  // ============================================================
  drawMoon($("#moonCanvas"), 32);
  $("#moon").addEventListener("dblclick", () => owlSay(S.owl.greet));
  $("#moon").addEventListener("click", () => toast("双击月亮，召唤猫头鹰"));

  // ============================================================
  // 窗口系统
  // ============================================================
  const APPS = {
    about:   { title: "关于我.txt", render: renderAbout },
    works:   { title: "作品集/", render: renderWorks },
    notes:   { title: "碎碎念.log", render: renderNotes },
    game:    { title: "躲方块.exe", render: renderGame, w: 480 },
    contact: { title: "联系我.vcf", render: renderContact },
  };
  const wins = new Map();
  let zTop = 10, cascade = 0;

  function openApp(id) {
    const app = APPS[id];
    if (!app) return;
    closeMenus();
    if (wins.has(id)) { const w = wins.get(id); w.el.classList.remove("is-min"); focusWin(id); return; }

    const el = document.createElement("section");
    el.className = "win";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", app.title);
    el.innerHTML = `
      <header class="win__bar">
        <span class="win__title">${esc(app.title)}</span>
        <button class="win__btn" data-act="min" aria-label="最小化">_</button>
        <button class="win__btn win__btn--close" data-act="close" aria-label="关闭">×</button>
      </header>
      <div class="win__body"></div>`;
    if (app.w) el.style.width = `min(${app.w}px, 92vw)`;
    const desk = $("#windows").parentElement;
    const dw = desk.clientWidth, dh = desk.clientHeight;
    const off = (cascade++ % 6) * 28;
    el.style.left = Math.max(10, Math.min(dw - 540, dw / 2 - 260 + off - 60)) + "px";
    el.style.top = Math.max(10, Math.min(dh - 300, dh * 0.12 + off)) + "px";
    $("#windows").append(el);

    const task = document.createElement("button");
    task.className = "task";
    task.textContent = app.title;
    task.addEventListener("click", () => {
      const w = wins.get(id);
      if (w.el.classList.contains("is-min")) { w.el.classList.remove("is-min"); focusWin(id); }
      else if (w.el.classList.contains("is-active")) minimize(id);
      else focusWin(id);
    });
    $("#tasks").append(task);

    const state = { el, task, cleanup: null };
    wins.set(id, state);
    state.cleanup = app.render($(".win__body", el)) || null;

    el.addEventListener("pointerdown", () => focusWin(id));
    $("[data-act=close]", el).addEventListener("click", () => closeWin(id));
    $("[data-act=min]", el).addEventListener("click", (e) => { e.stopPropagation(); minimize(id); });
    makeDraggable(el, $(".win__bar", el));
    focusWin(id);
  }
  function focusWin(id) {
    wins.forEach((w, k) => { w.el.classList.toggle("is-active", k === id); w.task.classList.toggle("is-active", k === id); });
    wins.get(id).el.style.zIndex = ++zTop;
  }
  function minimize(id) { const w = wins.get(id); w.el.classList.add("is-min"); w.el.classList.remove("is-active"); w.task.classList.remove("is-active"); }
  function closeWin(id) {
    const w = wins.get(id);
    if (!w) return;
    if (w.cleanup) w.cleanup();
    w.el.remove(); w.task.remove(); wins.delete(id);
  }
  function makeDraggable(el, handle) {
    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button") || innerWidth <= 640) return;
      const sx = e.clientX - el.offsetLeft, sy = e.clientY - el.offsetTop;
      handle.setPointerCapture(e.pointerId);
      handle.style.cursor = "grabbing";
      const move = (ev) => {
        el.style.left = Math.max(-el.offsetWidth + 80, Math.min(innerWidth - 80, ev.clientX - sx)) + "px";
        el.style.top = Math.max(0, Math.min(innerHeight - 100, ev.clientY - sy)) + "px";
      };
      const up = () => { handle.style.cursor = ""; handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });
  }

  // ---------- 各个应用 ----------
  function renderAbout(body) {
    const a = S.about;
    body.innerHTML = `
      <div class="about">
        <div class="about__avatar" aria-hidden="true">${esc(a.avatar)}</div>
        <div>${a.lines.map((l) => `<p>${esc(l)}</p>`).join("")}</div>
      </div>
      <dl class="stats">${a.stats.map((s) => `<div><dt>${esc(s.k)}</dt><dd>${esc(s.v)}</dd></div>`).join("")}</dl>`;
  }

  function renderWorks(body) {
    const tags = ["全部", ...new Set(S.works.map((w) => w.tag))];
    body.innerHTML = `<div class="filters" role="group" aria-label="筛选">${tags.map((t, i) => `<button class="chip${i ? "" : " is-on"}" data-tag="${esc(t)}">${esc(t)}</button>`).join("")}</div><div class="cards"></div>`;
    const list = $(".cards", body);
    const draw = (tag) => {
      list.innerHTML = S.works.filter((w) => tag === "全部" || w.tag === tag).map((w, i) => `
        <article class="card">
          <h3>${esc(w.title)} <small>${esc(w.year)}</small></h3>
          <p>${esc(w.desc)}</p>
          <span class="tag">#${esc(w.tag)}</span>
          ${w.link ? ` · <a href="${esc(w.link)}" data-link="${esc(w.link)}">打开 →</a>` : ""}
        </article>`).join("");
    };
    body.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip) { $$(".chip", body).forEach((c) => c.classList.toggle("is-on", c === chip)); draw(chip.dataset.tag); }
      const link = e.target.closest("a[data-link]");
      if (link && APPS[link.dataset.link]) { e.preventDefault(); openApp(link.dataset.link); }
      else if (link && link.dataset.link === "#") { e.preventDefault(); toast("你已经在这里了"); }
    });
    draw("全部");
  }

  function renderNotes(body) {
    body.innerHTML = `<ul class="notes">${S.notes.map((n) => `<li><time>${esc(n.date)}</time><p>${esc(n.text)}</p></li>`).join("")}</ul>`;
  }

  function renderContact(body) {
    body.innerHTML = `<ul class="contact">${S.contact.map((c) => `
      <li><span>${esc(c.label)}</span>
        <span><a href="${esc(c.href)}" target="_blank" rel="noopener">${esc(c.value)}</a><button class="copy" data-v="${esc(c.value)}">复制</button></span>
      </li>`).join("")}</ul>`;
    body.addEventListener("click", async (e) => {
      const b = e.target.closest(".copy");
      if (!b) return;
      try { await navigator.clipboard.writeText(b.dataset.v); toast("已复制：" + b.dataset.v); }
      catch { toast("复制失败，手动选一下吧"); }
    });
  }

  // ---------- 小游戏：躲方块 ----------
  function renderGame(body) {
    const KEY = "oliver-os-best";
    body.innerHTML = `
      <div class="game">
        <div class="game__hud"><span>时间 <b id="gT">0.0</b>s / 30</span><span>最高 <b id="gB">${(+localStorage.getItem(KEY) || 0).toFixed(1)}</b>s</span></div>
        <canvas width="440" height="330" aria-label="躲方块游戏：用方向键或鼠标移动金色方块"></canvas>
        <div><button class="btn">开始</button></div>
        <p style="font-size:12px;color:var(--ink-soft);margin-top:6px">方向键 / WASD / 鼠标或手指拖动，躲开蓝色方块</p>
      </div>`;
    const cv = $("canvas", body), g = cv.getContext("2d"), btn = $(".btn", body);
    const GW = cv.width, GH = cv.height;
    let p, foes, keys = {}, running = false, t0 = 0, raf = 0, elapsed = 0;

    const reset = () => { p = { x: GW / 2 - 8, y: GH / 2 - 8, s: 16 }; foes = []; elapsed = 0; };
    const spawn = () => {
      const side = (Math.random() * 4) | 0, s = 10 + Math.random() * 18, sp = 1.5 + elapsed / 6 + Math.random();
      const f = { s, x: 0, y: 0, vx: 0, vy: 0 };
      if (side === 0) { f.x = Math.random() * GW; f.y = -s; f.vy = sp; }
      if (side === 1) { f.x = GW; f.y = Math.random() * GH; f.vx = -sp; }
      if (side === 2) { f.x = Math.random() * GW; f.y = GH; f.vy = -sp; }
      if (side === 3) { f.x = -s; f.y = Math.random() * GH; f.vx = sp; }
      foes.push(f);
    };
    const draw = () => {
      g.fillStyle = "#020a1c"; g.fillRect(0, 0, GW, GH);
      g.fillStyle = "#4a8ce0"; foes.forEach((f) => g.fillRect(f.x | 0, f.y | 0, f.s | 0, f.s | 0));
      g.fillStyle = "#e8b64c"; g.fillRect(p.x | 0, p.y | 0, p.s, p.s);
      g.fillStyle = "#030d22"; g.fillRect((p.x + 4) | 0, (p.y + 5) | 0, 2, 2); g.fillRect((p.x + 10) | 0, (p.y + 5) | 0, 2, 2);
    };
    const end = (win) => {
      running = false; cancelAnimationFrame(raf);
      const best = +localStorage.getItem(KEY) || 0;
      if (elapsed > best) { localStorage.setItem(KEY, elapsed.toFixed(1)); $("#gB", body).textContent = elapsed.toFixed(1); }
      g.fillStyle = "#00030ecc"; g.fillRect(0, 0, GW, GH);
      g.fillStyle = "#ffd57a"; g.font = "20px DotGothic16, monospace"; g.textAlign = "center";
      g.fillText(win ? "坚持到了 30 秒！" : `撑了 ${elapsed.toFixed(1)} 秒`, GW / 2, GH / 2);
      btn.textContent = "再来一局";
      if (win) toast("厉害！破纪录记得告诉我");
    };
    const loop = (now) => {
      elapsed = (now - t0) / 1000;
      const sp = 3.2;
      if (keys.ArrowLeft || keys.a) p.x -= sp;
      if (keys.ArrowRight || keys.d) p.x += sp;
      if (keys.ArrowUp || keys.w) p.y -= sp;
      if (keys.ArrowDown || keys.s) p.y += sp;
      p.x = Math.max(0, Math.min(GW - p.s, p.x)); p.y = Math.max(0, Math.min(GH - p.s, p.y));
      if (Math.random() < 0.04 + elapsed / 500) spawn();
      foes.forEach((f) => { f.x += f.vx; f.y += f.vy; });
      foes = foes.filter((f) => f.x > -40 && f.x < GW + 40 && f.y > -40 && f.y < GH + 40);
      $("#gT", body).textContent = elapsed.toFixed(1);
      draw();
      if (foes.some((f) => p.x < f.x + f.s && p.x + p.s > f.x && p.y < f.y + f.s && p.y + p.s > f.y)) return end(false);
      if (elapsed >= 30) return end(true);
      raf = requestAnimationFrame(loop);
    };
    btn.addEventListener("click", () => { reset(); running = true; btn.textContent = "进行中…"; t0 = performance.now(); raf = requestAnimationFrame(loop); });

    const kd = (e) => {
      if (!running) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d"].includes(k)) { keys[k] = true; e.preventDefault(); }
    };
    const ku = (e) => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; };
    addEventListener("keydown", kd); addEventListener("keyup", ku);
    cv.addEventListener("pointermove", (e) => {
      if (!running || (e.pointerType === "mouse" && !e.buttons && e.type !== "pointermove")) return;
      const r = cv.getBoundingClientRect();
      p.x = ((e.clientX - r.left) / r.width) * GW - p.s / 2;
      p.y = ((e.clientY - r.top) / r.height) * GH - p.s / 2;
    });
    reset(); draw();
    return () => { cancelAnimationFrame(raf); removeEventListener("keydown", kd); removeEventListener("keyup", ku); };
  }

  // ============================================================
  // 猫头鹰助手
  // ============================================================
  const owl = $("#owl"), owlCv = $("#owlCanvas");
  drawOwl(owlCv);
  setInterval(() => { drawOwl(owlCv, true); setTimeout(() => drawOwl(owlCv), 160); }, 3800);
  let typeTimer = 0;
  function owlSay(text) {
    owl.hidden = false;
    clearInterval(typeTimer);
    const out = $("#owlText");
    out.textContent = "";
    let i = 0;
    typeTimer = setInterval(() => { out.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typeTimer); }, reduced ? 0 : 35);
    $("#owlChips").innerHTML = S.owl.qa.map((q, i) => `<button data-qa="${i}">${esc(q.q)}</button>`).join("");
  }
  $("#owlChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-qa]");
    if (!b) return;
    const q = S.owl.qa[b.dataset.qa];
    owlSay(q.a);
    if (q.open) setTimeout(() => openApp(q.open), 500);
  });
  $("#owlClose").addEventListener("click", () => { owl.hidden = true; toast("想我了就双击月亮"); });

  // ============================================================
  // 桌面图标 / 开始菜单 / 命令面板 / 时钟
  // ============================================================
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]");
    if (o) openApp(o.dataset.open);
    const a = e.target.closest("[data-action]");
    if (a?.dataset.action === "owl") { closeMenus(); owlSay(S.owl.greet); }
    if (a?.dataset.action === "reboot") location.reload();
    if (!e.target.closest("#startMenu, #startBtn")) closeMenus();
  });
  const startBtn = $("#startBtn"), menu = $("#startMenu");
  startBtn.addEventListener("click", () => { menu.hidden = !menu.hidden; startBtn.setAttribute("aria-expanded", String(!menu.hidden)); });
  function closeMenus() { menu.hidden = true; startBtn.setAttribute("aria-expanded", "false"); }

  const pal = $("#palette"), palIn = $("#paletteInput"), palList = $("#paletteList");
  const ENTRIES = [
    ...Object.entries(APPS).map(([id, a]) => ({ label: a.title, kw: id + a.title, run: () => openApp(id) })),
    { label: "召唤猫头鹰", kw: "owl 助手 猫头鹰", run: () => owlSay(S.owl.greet) },
    { label: "重新开机", kw: "reboot 重启", run: () => location.reload() },
  ];
  let palSel = 0, palItems = [];
  function openPalette() { pal.hidden = false; palIn.value = ""; filterPal(); palIn.focus(); }
  function closePalette() { pal.hidden = true; }
  function filterPal() {
    const q = palIn.value.trim().toLowerCase();
    palItems = ENTRIES.filter((e) => !q || (e.label + e.kw).toLowerCase().includes(q));
    palSel = 0;
    palList.innerHTML = palItems.map((e, i) => `<li role="option" data-i="${i}" aria-selected="${i === 0}">${esc(e.label)}</li>`).join("") || `<li>没找到，换个词试试</li>`;
  }
  palIn.addEventListener("input", filterPal);
  palIn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      palSel = (palSel + (e.key === "ArrowDown" ? 1 : -1) + palItems.length) % Math.max(1, palItems.length);
      $$("li", palList).forEach((li, i) => li.setAttribute("aria-selected", String(i === palSel)));
    }
    if (e.key === "Enter" && palItems[palSel]) { closePalette(); palItems[palSel].run(); }
  });
  palList.addEventListener("click", (e) => { const li = e.target.closest("[data-i]"); if (li) { closePalette(); palItems[li.dataset.i].run(); } });
  pal.addEventListener("click", (e) => { if (e.target === pal) closePalette(); });
  $("#cmdBtn").addEventListener("click", openPalette);
  addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.hidden ? openPalette() : closePalette(); }
    if (e.key === "Escape") {
      if (!pal.hidden) return closePalette();
      closeMenus();
      const active = [...wins.entries()].find(([, w]) => w.el.classList.contains("is-active"));
      if (active) closeWin(active[0]);
    }
  });

  const clock = $("#clock");
  const tick = () => { const d = new Date(); clock.textContent = d.toTimeString().slice(0, 5); };
  tick(); setInterval(tick, 10000);

  // ---------- Toast ----------
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    $("#toasts").append(t);
    setTimeout(() => t.remove(), 2200);
  }
})();
