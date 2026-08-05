/* 《经营战略全史》互动知识站 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ---------- 页面切换 ---------- */
const KNOWLEDGE_PANELS = ["cards", "books", "glossary", "people", "versus"];

function showKnowledgePanel(name) {
  if (!KNOWLEDGE_PANELS.includes(name)) return;
  $$(".knowledge-panel").forEach(p => p.classList.toggle("active", p.id === "page-" + name));
  $$("#knowledge-tabs button").forEach(b => b.classList.toggle("active", b.dataset.kpanel === name));
  if (window.__watchReveal) window.__watchReveal();
}

function gotoPage(name) {
  const knowledgePanel = KNOWLEDGE_PANELS.includes(name) ? name : null;
  if (knowledgePanel) name = "knowledge";
  $$(".page").forEach(p => p.classList.remove("active"));
  const page = $("#page-" + name);
  if (page) page.classList.add("active");
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === name));
  if (knowledgePanel) showKnowledgePanel(knowledgePanel);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("#nav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-btn");
  if (btn) gotoPage(btn.dataset.page);
});

$$("[data-goto]").forEach(b => b.addEventListener("click", () => gotoPage(b.dataset.goto)));

const knowledgeTabs = $("#knowledge-tabs");
if (knowledgeTabs) {
  knowledgeTabs.addEventListener("click", e => {
    const btn = e.target.closest("button[data-kpanel]");
    if (btn) showKnowledgePanel(btn.dataset.kpanel);
  });
}

/* ---------- 主题切换(深色/浅色) ---------- */
const THEME_KEY = "strategy_theme";
(function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  const theme = saved ||
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  applyTheme(theme);
  $("#theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });
})();
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("#theme-toggle").textContent = theme === "light" ? "☀" : "☾";
}

/* ---------- 学习进度(已读,四条线) ---------- */
const READ_KEY = "strategy_read_v1";
function loadRead() {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(READ_KEY)) || []; } catch (e) {}
  // 旧格式迁移:纯数字 = 理论线索引
  return arr.map(x => typeof x === "number" ? "t:" + x : x);
}
function saveRead(arr) {
  try { localStorage.setItem(READ_KEY, JSON.stringify(arr)); } catch (e) {}
}
function isReadK(key) { return loadRead().includes(key); }
function isRead(idx) { return isReadK("t:" + idx); }
function toggleReadK(key) {
  let arr = loadRead();
  if (arr.includes(key)) arr = arr.filter(i => i !== key);
  else arr.push(key);
  saveRead(arr);
  return arr.includes(key);
}
function toggleRead(idx) { return toggleReadK("t:" + idx); }
function updateProgress() {
  const set = loadRead();
  const hasChina = typeof CHINA !== "undefined" && Array.isArray(CHINA) && CHINA.length > 0;
  const totals = { t: THEORIES.length, c: COMPANIES.length, m: MODELS.length, o: ORGS.length };
  if (hasChina) totals.h = CHINA.length;
  const done = {};
  Object.keys(totals).forEach(k => done[k] = 0);
  set.forEach(k => { const p = k.slice(0, 1); if (done[p] !== undefined) done[p]++; });
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const dn = Object.values(done).reduce((a, b) => a + b, 0);
  const el = $("#lp-text");
  if (el) el.textContent = dn + " / " + total;
  // 中国线进度条按需插入,数据缺失时该行自动隐藏
  const chinaLine = $("#lp-line-h");
  if (chinaLine) chinaLine.style.display = hasChina ? "" : "none";
  Object.keys(totals).forEach(p => {
    const bar = $("#lp-" + p), num = $("#lp-" + p + "n");
    if (bar) bar.style.width = (done[p] / totals[p] * 100) + "%";
    if (num) num.textContent = done[p] + "/" + totals[p];
  });
}

/* ---------- 滚动条宽度：供全宽出血元素补偿 100vw 与 100% 的差 ---------- */
(function trackScrollbarWidth() {
  const set = () => {
    const w = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--sbw", Math.max(0, w) + "px");
  };
  set();
  window.addEventListener("resize", set);
})();

/* ---------- 首页文案数字：从数据实时生成,防止口径漂移 ---------- */
(function syncHeroCounts() {
  const works = new Set(THEORIES.map(t => t.work).filter(Boolean));
  const pairs = [["hs-t", THEORIES.length], ["hs-c", COMPANIES.length],
                 ["hs-m", MODELS.length], ["hs-o", ORGS.length], ["hs-w", works.size]];
  pairs.forEach(([id, n]) => { const el = $("#" + id); if (el) el.textContent = n; });
  // 中国对照线：有数据才在首页文案里出现
  const hasChina = typeof CHINA !== "undefined" && Array.isArray(CHINA) && CHINA.length > 0;
  const chinaFrag = $("#hs-china-frag");
  if (chinaFrag) {
    chinaFrag.style.display = hasChina ? "" : "none";
    const n = $("#hs-ch");
    if (n && hasChina) n.textContent = CHINA.length;
  }
})();

/* ---------- 首页统计 ---------- */
(function renderStats() {
  const years = THEORIES.map(t => t.year);
  const span = Math.max(...years) - Math.min(...years);
  const stats = [
    [THEORIES.length, "理论节点"],
    [COMPANIES.length, "企业现场"],
    [MODELS.length, "商业模式"],
    [ORGS.length, "组织进化"]
  ];
  if (typeof CHINA !== "undefined" && Array.isArray(CHINA) && CHINA.length) {
    stats.push([CHINA.length, "中国对照"]);
  }
  stats.push([QUIZ.length, "自测题目"]);
  $("#home-stats").innerHTML = stats.map(s =>
    `<div class="stat reveal"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("");
})();

/* ---------- 六幕商业史(叙事层) ---------- */
(function renderActs() {
  const box = $("#acts-grid");
  if (!box || typeof ACTS === "undefined") return;
  box.innerHTML = ACTS.map((a, i) => `
    <article class="act reveal" data-act="${i}">
      <div class="act-side"><span class="act-no">${a.no}</span><span class="act-span">${a.span}</span></div>
      <div class="act-main">
        <h4>${a.title}</h4>
        <p class="act-thesis">${a.thesis}</p>
        <p class="act-body">${a.body}</p>
        <div class="act-ask"><span>留给你的问题</span>${a.ask}</div>
        <div class="act-pivot">${a.pivot.map(p =>
          `<button class="act-chip" data-pivot="${p}">${p}</button>`).join("")}</div>
      </div>
    </article>`).join("");

  // 点转折点 → 打开对应节点的弹层
  box.addEventListener("click", (e) => {
    const chip = e.target.closest(".act-chip");
    if (!chip) return;
    const key = chip.dataset.pivot;
    const t = THEORIES.find(x => x.key === key);
    if (t) return showDetail(t);
    const c = COMPANIES.find(x => x.company === key);
    if (c) return showCompany(c);
    const m = MODELS.find(x => x.company === key);
    if (m) return showModel(m);
    const o = ORGS.find(x => x.company === key);
    if (o) return showOrg(o);
  });
})();

/* ---------- 跑马灯 ---------- */
(function renderMarquee() {
  const terms = THEORIES.map(t => `<span><b>${t.year}</b>${t.key}</span>`).join("");
  $("#marquee-track").innerHTML = terms + terms;
})();

/* ---------- 滚动显现 ---------- */
(function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  const watch = () => $$(".reveal:not(.in)").forEach(el => io.observe(el));
  watch();
  // 动态渲染的内容在每次渲染后补挂
  window.__watchReveal = watch;
})();

/* ---------- 共振点(同一主体跨线出现 ≥2 次) ---------- */
const RESO_ALIAS = { "麦当劳兄弟": "麦当劳", "Airbnb / Uber": "Uber" };
const RESO = (function () {
  const map = {};
  const add = (kind, idx, name, obj) => {
    const n = RESO_ALIAS[name] || name;
    (map[n] = map[n] || []).push({ kind, idx, obj });
  };
  COMPANIES.forEach((c, i) => add("company", i, c.company, c));
  MODELS.forEach((m, i) => add("model", i, m.company, m));
  ORGS.forEach((o, i) => add("org", i, o.company, o));
  if (typeof CHINA !== "undefined" && Array.isArray(CHINA)) {
    CHINA.forEach((c, i) => add("china", i, c.company, c));
  }
  const out = {};
  Object.entries(map).forEach(([n, arr]) => {
    if (new Set(arr.map(a => a.kind)).size >= 2) out[n] = arr;
  });
  return out;
})();
function resoName(name) {
  const n = RESO_ALIAS[name] || name;
  return RESO[n] ? n : null;
}
function resoBadge(name) {
  return resoName(name) ? `<span class="reso-badge" title="共振点:同一主体跨多条线出现">🔗</span>` : "";
}
function openLineItem(kind, idx) {
  if (kind === "company") showCompany(COMPANIES[idx]);
  else if (kind === "model") showModel(MODELS[idx]);
  else if (kind === "org") showOrg(ORGS[idx]);
  else if (kind === "china" && typeof CHINA !== "undefined") showChina(CHINA[idx]);
}
// 弹层底部的"共振 + 关联理论"区块
function resoSection(name, currentKind, currentIdx) {
  const n = resoName(name);
  const arr = n ? RESO[n] : [];
  let html = "";
  if (n) {
    const chips = arr
      .filter(a => !(a.kind === currentKind && a.idx === currentIdx))
      .map(a => {
        const o = a.obj;
        return `<button class="rel-chip reso-chip" data-rkind="${a.kind}" data-ridx="${a.idx}">${LINE_META[a.kind].tag} · ${o.year} ${o.event}</button>`;
      }).join("");
    html += `<div class="m-sec"><h4>🔗 共振点 · 跨线出现</h4><div class="m-rel">${chips}</div></div>`;
  }
  return html;
}
function bindModalChips() {
  $("#modal").querySelectorAll("[data-rel]").forEach(b =>
    b.addEventListener("click", () => showDetail(THEORIES[Number(b.dataset.rel)])));
  $("#modal").querySelectorAll("[data-rkind]").forEach(b =>
    b.addEventListener("click", () => openLineItem(b.dataset.rkind, Number(b.dataset.ridx))));
}
function bindReadButton(key) {
  $("#m-read").addEventListener("click", () => {
    const nowRead = toggleReadK(key);
    const btn = $("#m-read");
    btn.classList.toggle("done", nowRead);
    btn.textContent = nowRead ? "✓ 已读 · 点击取消" : "标记为已读";
    renderTimeline();
    renderCards();
    updateProgress();
  });
}
function readBtnHtml(key) {
  const read = isReadK(key);
  return `<button class="btn ghost m-read-btn ${read ? "done" : ""}" id="m-read">${read ? "✓ 已读 · 点击取消" : "标记为已读"}</button>`;
}

function relButtonForKey(key) {
  const target = THEORIES.find(x => x.key === key);
  return target ? `<button data-rel="${THEORIES.indexOf(target)}">${key}</button>` : "";
}

function relatedCaseButtons(key, limit = 6) {
  const rows = [
    ...COMPANIES.filter(o => (o.rel || []).includes(key)).map(o => ({ kind: "company", o })),
    ...MODELS.filter(o => (o.rel || []).includes(key)).map(o => ({ kind: "model", o })),
    ...ORGS.filter(o => (o.rel || []).includes(key)).map(o => ({ kind: "org", o }))
  ].sort((a, b) => a.o.year - b.o.year).slice(0, limit);
  return rows.map(({ kind, o }) => {
    const idx = kind === "company" ? COMPANIES.indexOf(o) : kind === "model" ? MODELS.indexOf(o) : ORGS.indexOf(o);
    return `<button class="rel-chip" data-rkind="${kind}" data-ridx="${idx}">${LINE_META[kind].tag} · ${o.year} ${o.company}</button>`;
  }).join("");
}

function relationStrength(key, o) {
  const count = (o.rel || []).length;
  if (count <= 1) return "强关联";
  if ((o.lesson || o.brief || "").includes(key.replace(/·.*/, ""))) return "强关联";
  return "中关联";
}

function relationReason(key, o) {
  const action = o.event ? `“${o.event}”` : "这个节点";
  const lesson = o.lesson ? `可迁移原则是: ${o.lesson}` : "";
  const result = o.result ? `结果是: ${o.result}` : "";
  return `${o.company}的${action}把“${key}”从概念放进经营现场。${lesson || result || o.brief}`;
}

function relatedCaseCards(key, limit = 6) {
  const rows = [
    ...COMPANIES.filter(o => (o.rel || []).includes(key)).map(o => ({ kind: "company", o })),
    ...MODELS.filter(o => (o.rel || []).includes(key)).map(o => ({ kind: "model", o })),
    ...ORGS.filter(o => (o.rel || []).includes(key)).map(o => ({ kind: "org", o }))
  ].sort((a, b) => a.o.year - b.o.year).slice(0, limit);
  return rows.map(({ kind, o }) => {
    const idx = kind === "company" ? COMPANIES.indexOf(o) : kind === "model" ? MODELS.indexOf(o) : ORGS.indexOf(o);
    return `<button class="rel-card" data-rkind="${kind}" data-ridx="${idx}">
      <span><b>${LINE_META[kind].tag}</b><i>${relationStrength(key, o)}</i></span>
      <strong>${o.year} · ${o.company} · ${o.event}</strong>
      <em>${relationReason(key, o)}</em>
    </button>`;
  }).join("");
}

function theoryRelationCards(keys, o) {
  return (keys || []).map(key => {
    const target = THEORIES.find(x => x.key === key);
    if (!target) return "";
    const idx = THEORIES.indexOf(target);
    const sc = SCHOOLS[target.school];
    const lesson = o.lesson ? `这个现场的可迁移原则是: ${o.lesson}` : `这个现场展示了理论如何在真实约束下落地。`;
    return `<button class="rel-card theory-rel-card" data-rel="${idx}" style="--rc:${sc.color}">
      <span><b>${sc.name}</b><i>反查理论</i></span>
      <strong>${key}</strong>
      <em>${o.company}的“${o.event}”可以用“${key}”解释。${lesson}</em>
    </button>`;
  }).join("");
}

function boundaryFor(kind, o) {
  const base = {
    company: "不要把企业现场当成可照抄剧本。它依赖当时的技术窗口、资本条件、监管环境和组织能力。",
    model: "商业模式成立不等于永远成立。它依赖获客成本、履约能力、信任机制和收益结构的平衡。",
    org: "组织实践不能脱离规模、文化和人才密度。结构或制度被照搬时,常常只复制形式,复制不了行为。",
    china: "中国现场高度依赖当时的市场发育程度、要素成本与制度环境,跨时空照搬同一做法,通常复制不了同样的结果。"
  }[kind] || "这个节点需要结合具体环境判断,不能机械套用。";
  if (kind === "model" && o.el && ELEMENTS[o.el]) {
    return `${base} 这个模式主要改变的是“${ELEMENTS[o.el].name}”,若其它三要素跟不上,模式会失衡。`;
  }
  return base;
}

function costFor(kind, o) {
  if (o.result && /反垄断|监管|失败|退出|反噬|亏损|危机/.test(o.result + o.lesson)) return o.result;
  const generic = {
    company: "代价通常藏在规模、资本开支、组织复杂度或外部监管里;越成功的企业现场,越可能制造新的约束。",
    model: "代价通常是对伙伴、渠道、库存、补贴或信任系统的持续投入;模式越轻,越要警惕关键能力外包。",
    org: "代价通常是协调成本、角色冲突和文化摩擦;组织工具越强,越需要清晰边界。",
    china: "代价通常藏在增长速度与治理能力的落差里;跑得越快,补制度与信任的课就越贵。"
  }[kind] || "任何原则迁移都需要付出适配成本。";
  return generic;
}

function boundarySection(kind, o) {
  return `<div class="m-sec"><h4>边界与代价</h4>
    <div class="limit-grid">
      ${guideCard("适用边界", boundaryFor(kind, o), "danger")}
      ${guideCard("可能代价", costFor(kind, o), "warn")}
    </div>
  </div>`;
}

function guideCard(title, text, tone = "") {
  return text ? `<div class="guide-card ${tone}"><b>${title}</b><p>${text}</p></div>` : "";
}

/* ---------- 决策现场层(spec 001):有 deep 的节点用真实史实替代通用边界段 ---------- */
function decisionSection(dp) {
  return `<div class="m-sec"><h4>决策现场</h4>
    <div class="guide-grid">
      ${guideCard("当时的局面", dp.scene)}
      ${guideCard("关键抉择", dp.choice, "accent")}
    </div>
  </div>
  <div class="m-sec"><h4>对照与回声</h4>
    <div class="guide-grid">
      ${guideCard("同时代的对照", dp.rival, "warn")}
      ${guideCard("后续命运", dp.fate, "danger")}
      ${guideCard("今日回声", dp.echo, "accent")}
    </div>
  </div>`;
}

/* ---------- 学派筛选 chips(时间线与卡片共用) ---------- */
function buildChips(container, onPick) {
  const all = [["all", "全部", "#5A4FE6"]].concat(
    Object.entries(SCHOOLS).map(([k, v]) => [k, v.name, v.color]));
  container.innerHTML = all.map(([k, name, color]) =>
    `<button class="chip ${k === "all" ? "active" : ""}" data-school="${k}" style="--chip-c:${color}">${name}</button>`).join("");
  container.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip || !chip.dataset.school) return;
    container.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    onPick(chip.dataset.school);
  });
}

/* ---------- 详情弹层(四栏深度版) ---------- */
function showDetail(t) {
  const idx = THEORIES.indexOf(t);
  const sc = SCHOOLS[t.school];
  const d = THEORY_DETAILS[idx] || {};
  const g = THEORY_GUIDES[t.key] || {};
  const lim = THEORY_LIMITS[t.key] || {};
  const relBtns = (d.rel || []).map(relButtonForKey).join("");
  const caseCards = relatedCaseCards(t.key);
  const read = isRead(idx);
  $("#modal").innerHTML = `
    <button class="m-close" id="m-close">×</button>
    <div class="m-year" style="--sc:${sc.color}">${t.year} 年 · ${sc.name}</div>
    <h3>${t.key}</h3>
    <div class="m-person">${t.person}</div>
    <div class="m-work">${t.work}</div>
    <div class="m-node-summary">
      <div><span>定义</span><p>${t.brief}</p></div>
      ${g.question ? `<div><span>它回答的问题</span><p>${g.question}</p></div>` : ""}
    </div>
    ${g.mechanism || g.today || g.watch || g.ask ? `<div class="m-sec"><h4>深度理解</h4>
      <div class="guide-grid">
        ${guideCard("核心机制", g.mechanism)}
        ${guideCard("今天怎么用", g.today)}
        ${guideCard("常见误区", g.watch, "warn")}
        ${guideCard("反思问题", g.ask, "accent")}
      </div>
    </div>` : ""}
    ${lim.fail || lim.counter ? `<div class="m-sec"><h4>反例 / 失效条件</h4>
      <div class="limit-grid">
        ${guideCard("什么时候会失效", lim.fail, "danger")}
        ${guideCard("反例提醒", lim.counter, "warn")}
      </div>
    </div>` : ""}
    ${d.frame ? `<div class="m-sec"><h4>框架拆解</h4><div class="frame-grid">${d.frame.map(f => {
      const parts = f.split("|");
      return `<div class="frame-tile"><b>${parts[0]}</b><span>${parts[1] || ""}</span></div>`;
    }).join("")}</div></div>` : ""}
    ${d.case ? `<div class="m-sec"><h4>经典案例</h4><p>${d.case}</p></div>` : ""}
    ${d.use ? `<div class="m-sec"><h4>现实应用</h4><p>${d.use}</p></div>` : ""}
    ${caseCards ? `<div class="m-sec"><h4>关联解释</h4><div class="rel-card-grid">${caseCards}</div></div>` : ""}
    ${relBtns ? `<div class="m-sec"><h4>相关理论</h4><div class="m-rel">${relBtns}</div></div>` : ""}
    <button class="btn ghost m-read-btn ${read ? "done" : ""}" id="m-read">${read ? "✓ 已读 · 点击取消" : "标记为已读"}</button>`;
  $("#modal-mask").classList.add("show");
  $("#m-close").addEventListener("click", closeModal);
  bindModalChips();
  $("#m-read").addEventListener("click", () => {
    const nowRead = toggleRead(idx);
    const btn = $("#m-read");
    btn.classList.toggle("done", nowRead);
    btn.textContent = nowRead ? "✓ 已读 · 点击取消" : "标记为已读";
    renderTimeline();
    renderCards();
    updateProgress();
  });
}
function closeModal() { $("#modal-mask").classList.remove("show"); }

/* ---------- 时代背景层 ---------- */
function eraOf(year) {
  let e = ERAS[0];
  ERAS.forEach(x => { if (year >= x.start) e = x; });
  return e;
}
// 在按年排列的单线列表中插入时代分隔条(先按年份排序)
function withEras(items, renderFn) {
  let lastEra = null;
  return items.slice().sort((x, y) => x.year - y.year).map((o, i) => {
    const e = eraOf(o.year);
    const div = e !== lastEra
      ? `<div class="era-divider"><span>${e.label}</span></div>` : "";
    lastEra = e;
    return div + renderFn(o, i);
  }).join("");
}

/* ---------- 四段式深度(背景/经过/结果/启示) ---------- */
function deepSections(o, briefTitle, kind) {
  const rel = theoryRelationCards(o.rel || [], o);
  return `
    ${o.bg ? `<div class="m-sec"><h4>背景</h4><p>${o.bg}</p></div>` : ""}
    <div class="m-sec"><h4>${briefTitle}</h4><p>${o.brief}</p></div>
    ${o.result ? `<div class="m-sec"><h4>结果与影响</h4><p>${o.result}</p></div>` : ""}
    ${o.lesson ? `<div class="m-sec lesson"><h4>启示</h4><p>${o.lesson}</p></div>` : ""}
    <div class="m-sec"><h4>战略透镜</h4>
      <div class="lens-grid">
        ${o.bg ? `<div><b>约束</b><span>${o.bg}</span></div>` : ""}
        <div><b>关键动作</b><span>${o.event || briefTitle}</span></div>
        ${o.lesson ? `<div><b>可迁移原则</b><span>${o.lesson}</span></div>` : ""}
      </div>
    </div>
    ${o.deep ? decisionSection(o.deep) : boundarySection(kind, o)}
    ${rel ? `<div class="m-sec"><h4>理论关联解释</h4><div class="rel-card-grid">${rel}</div></div>` : ""}`;
}

/* ---------- 企业现场 / 模式现场 / 组织现场弹层 ---------- */
function showCompany(c) {
  const idx = COMPANIES.indexOf(c);
  $("#modal").innerHTML = `
    <button class="m-close" id="m-close">×</button>
    <div class="m-year" style="--sc:#B77A22">${c.year} 年 · 企业现场</div>
    <h3>${c.company} · ${c.event} ${resoBadge(c.company)}</h3>
    <div class="m-work">《他们创造了美国》维度 · 公开商业史整理</div>
    ${deepSections(c, "经过", "company")}
    ${resoSection(c.company, "company", idx)}
    ${readBtnHtml("c:" + idx)}`;
  $("#modal-mask").classList.add("show");
  $("#m-close").addEventListener("click", closeModal);
  bindModalChips();
  bindReadButton("c:" + idx);
}

function showModel(m) {
  const idx = MODELS.indexOf(m);
  const elTag = m.el && ELEMENTS[m.el]
    ? `<span class="el-tag" style="--ec:${ELEMENTS[m.el].color}">${ELEMENTS[m.el].name}</span>` : "";
  $("#modal").innerHTML = `
    <button class="m-close" id="m-close">×</button>
    <div class="m-year" style="--sc:#2C74D6">${m.year} 年 · 模式现场 ${elTag}</div>
    <h3>${m.company} · ${m.event} ${resoBadge(m.company)}</h3>
    <div class="m-work">《商业模式全史》维度 · 三谷宏治</div>
    ${deepSections(m, "经过", "model")}
    ${resoSection(m.company, "model", idx)}
    ${readBtnHtml("m:" + idx)}`;
  $("#modal-mask").classList.add("show");
  $("#m-close").addEventListener("click", closeModal);
  bindModalChips();
  bindReadButton("m:" + idx);
}

function showChina(c) {
  const idx = CHINA_LIST.indexOf(c);
  $("#modal").innerHTML = `
    <button class="m-close" id="m-close">×</button>
    <div class="m-year" style="--sc:${LINE_META.china.color}">${c.year} 年 · 中国现场</div>
    <h3>${c.company} · ${c.event} ${resoBadge(c.company)}</h3>
    <div class="m-work">中国对照线 · 站方补充,不来自那五本书</div>
    ${deepSections(c, "经过", "china")}
    ${resoSection(c.company, "china", idx)}
    ${readBtnHtml("h:" + idx)}`;
  $("#modal-mask").classList.add("show");
  $("#m-close").addEventListener("click", closeModal);
  bindModalChips();
  bindReadButton("h:" + idx);
}

function showOrg(o) {
  const idx = ORGS.indexOf(o);
  $("#modal").innerHTML = `
    <button class="m-close" id="m-close">×</button>
    <div class="m-year" style="--sc:#0E9C6B">${o.year} 年 · 组织现场</div>
    <h3>${o.company} · ${o.event} ${resoBadge(o.company)}</h3>
    <div class="m-work">《管理百年》维度 · 斯图尔特·克雷纳</div>
    ${deepSections(o, "经过", "org")}
    ${resoSection(o.company, "org", idx)}
    ${readBtnHtml("o:" + idx)}`;
  $("#modal-mask").classList.add("show");
  $("#m-close").addEventListener("click", closeModal);
  bindModalChips();
  bindReadButton("o:" + idx);
}
$("#modal-mask").addEventListener("click", (e) => {
  if (e.target === $("#modal-mask")) closeModal();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ---------- 时间线(理论线 / 企业线 / 五轨对照) ---------- */
let tlSchool = "all";
let tlMode = "both";
const LINE_META = {
  theory:  { tag: "战略理论", color: "#5A4FE6" },
  company: { tag: "企业现场", color: "#B77A22" },
  model:   { tag: "商业模式", color: "#2C74D6" },
  org:     { tag: "组织进化", color: "#0E9C6B" },
  china:   { tag: "中国对照", color: "#E05A2B" },
  work:    { tag: "著作线", color: "#D8474F" }
};
// 中国线数据可选:未定义时全站自动降级为五条线,不报错
const HAS_CHINA = typeof CHINA !== "undefined" && Array.isArray(CHINA) && CHINA.length > 0;
const CHINA_LIST = HAS_CHINA ? CHINA : [];
(function toggleChinaUI() {
  ["#tl-mode-china", "#card-mode-china"].forEach(sel => {
    const el = $(sel);
    if (el) el.style.display = HAS_CHINA ? "" : "none";
  });
  const allBtn = $("#tl-mode-all");
  if (allBtn) allBtn.textContent = HAS_CHINA ? "六轨对照" : "五轨对照";
})();

function renderTimelineScale() {
  const minY = (tlMode === "model" || tlMode === "both") ? 1397
    : tlMode === "company" ? 1790 : 1910;
  const maxY = Math.max(...THEORIES.map(t => t.year), ...COMPANIES.map(c => c.year));
  const span = maxY - minY;
  const step = span > 400 ? 100 : 10;
  const ticks = [];
  for (let y = Math.ceil(minY / step) * step; y <= maxY + (step === 10 ? 8 : 0); y += step) ticks.push(y);
  $("#tl-scale").innerHTML = ticks.map(y =>
    `<div class="tl-tick" style="left:${(y - minY) / span * 100}%"><span>${step === 10 ? y + "s" : y}</span><i></i></div>`).join("");
}

function theoryItem(t, i) {
  const sc = SCHOOLS[t.school];
  const idx = THEORIES.indexOf(t);
  return `
  <div class="tl-item" style="--sc:${sc.color}; --i:${Math.min(i, 14)}" data-idx="${idx}">
    <div class="tl-card">
      <div class="tl-top">
        <span class="tl-year">${t.year}</span>
        <span class="tl-key">${t.key}</span>
        <span class="tl-person">${t.person}</span>
        ${isRead(idx) ? `<span class="read-mark">✓ 已读</span>` : ""}
        <span class="school-tag">${sc.name}</span>
      </div>
      <div class="tl-work">${t.work}</div>
      <p class="tl-brief">${t.brief}</p>
    </div>
  </div>`;
}

function companyItem(c, i) {
  const idx = COMPANIES.indexOf(c);
  const relChips = (c.rel || []).map(key => {
    const t = THEORIES.find(x => x.key === key);
    return t ? `<button class="rel-chip" data-rel="${THEORIES.indexOf(t)}">${key}</button>` : "";
  }).join("");
  return `
  <div class="tl-item company" style="--sc:#B77A22; --i:${Math.min(i, 14)}" data-cidx="${idx}">
    <div class="tl-card">
      <div class="tl-top">
        <span class="tl-year">${c.year}</span>
        <span class="tl-key">${c.company} · ${c.event} ${resoBadge(c.company)}</span>
        ${isReadK("c:" + idx) ? `<span class="read-mark">✓ 已读</span>` : ""}
        <span class="school-tag">企业现场</span>
      </div>
      <p class="tl-brief">${c.brief}</p>
      ${relChips ? `<div class="rel-chips">关联理论 ${relChips}</div>` : ""}
    </div>
  </div>`;
}

function modelItem(m, i) {
  const idx = MODELS.indexOf(m);
  const relChips = (m.rel || []).map(key => {
    const t = THEORIES.find(x => x.key === key);
    return t ? `<button class="rel-chip" data-rel="${THEORIES.indexOf(t)}">${key}</button>` : "";
  }).join("");
  const elTag = m.el && ELEMENTS[m.el]
    ? `<span class="el-tag" style="--ec:${ELEMENTS[m.el].color}">${ELEMENTS[m.el].name}</span>` : "";
  return `
  <div class="tl-item model" style="--sc:#2C74D6; --i:${Math.min(i, 14)}" data-midx="${idx}">
    <div class="tl-card">
      <div class="tl-top">
        <span class="tl-year">${m.year}</span>
        <span class="tl-key">${m.company} · ${m.event} ${resoBadge(m.company)}</span>
        ${isReadK("m:" + idx) ? `<span class="read-mark">✓ 已读</span>` : ""}
        ${elTag}
        <span class="school-tag">模式现场</span>
      </div>
      <p class="tl-brief">${m.brief}</p>
      ${relChips ? `<div class="rel-chips">关联理论 ${relChips}</div>` : ""}
    </div>
  </div>`;
}

function orgItem(o, i) {
  const idx = ORGS.indexOf(o);
  const relChips = (o.rel || []).map(key => {
    const t = THEORIES.find(x => x.key === key);
    return t ? `<button class="rel-chip" data-rel="${THEORIES.indexOf(t)}">${key}</button>` : "";
  }).join("");
  return `
  <div class="tl-item org" style="--sc:#0E9C6B; --i:${Math.min(i, 14)}" data-oidx="${idx}">
    <div class="tl-card">
      <div class="tl-top">
        <span class="tl-year">${o.year}</span>
        <span class="tl-key">${o.company} · ${o.event} ${resoBadge(o.company)}</span>
        ${isReadK("o:" + idx) ? `<span class="read-mark">✓ 已读</span>` : ""}
        <span class="school-tag">组织现场</span>
      </div>
      <p class="tl-brief">${o.brief}</p>
      ${relChips ? `<div class="rel-chips">关联理论 ${relChips}</div>` : ""}
    </div>
  </div>`;
}

const ERA_NOTES = {
  1390: "远程贸易与信用工具扩张,商业模式先于现代企业出现。",
  1670: "城市零售和明码标价兴起,商业信用开始面向大众。",
  1790: "早期工业化加速,机器、标准化和基础设施改变成本结构。",
  1800: "蒸汽动力和交通网络打开跨地区市场。",
  1840: "电报、电梯、铁路等基础设施重塑城市和金融。",
  1860: "铁路、石油、电缆推动全国市场和跨洋市场形成。",
  1870: "规模化企业、托拉斯和现代销售系统开始成熟。",
  1880: "电力、通信和消费品牌把发明推向大众市场。",
  1890: "大企业组织与大众消费同步成形,管理问题开始显性化。",
  1900: "科学管理和流水线把效率推到中心位置。",
  1910: "管理从经验走向科学,现代组织需要新的协调方式。",
  1920: "大众生产、大众营销和金融分期共同扩大需求。",
  1930: "大萧条与大型组织治理压力推动管理思想深化。",
  1940: "战争动员和运筹思维强化计划、流程与系统能力。",
  1950: "战后增长期催生事业部制、目标管理和现代营销。",
  1960: "多元化企业扩张,战略规划和咨询业登场。",
  1970: "石油危机、全球竞争和日本企业崛起挑战规划学派。",
  1980: "行业竞争分析成熟,同时资源基础理论开始反击。",
  1990: "能力、学习、流程再造与互联网早期浪潮共同重塑战略。",
  2000: "平台、长尾、蓝海和开放生态成为新的增长语言。",
  2010: "精益创业、商业模式画布和移动互联网推动快速试错。",
  2020: "AI 与生成式技术改变知识劳动,战略判断进入新周期。"
};

/* 五轨对照:按年代分行(纬)、五线分列(经),同年代自然对齐 */
function renderSync(list) {
  const LINE_ORDER = ["theory", "company", "model", "org"]
    .concat(HAS_CHINA ? ["china"] : []).concat(["work"]);
  const buckets = new Map();
  const emptyBucket = () => LINE_ORDER.reduce((a, k) => (a[k] = [], a), {});
  const put = (year, kind, obj) => {
    const d = Math.floor(year / 10) * 10;
    if (!buckets.has(d)) buckets.set(d, emptyBucket());
    buckets.get(d)[kind].push(obj);
  };
  list.forEach(t => {
    put(t.year, "theory", t);
    put(t.year, "work", t);
  });
  COMPANIES.forEach(c => put(c.year, "company", c));
  MODELS.forEach(m => put(m.year, "model", m));
  ORGS.forEach(o => put(o.year, "org", o));
  CHINA_LIST.forEach(c => put(c.year, "china", c));

  const mini = (kind, o) => {
    const idx = kind === "theory" || kind === "work" ? THEORIES.indexOf(o)
      : kind === "company" ? COMPANIES.indexOf(o)
      : kind === "model" ? MODELS.indexOf(o)
      : kind === "china" ? CHINA_LIST.indexOf(o) : ORGS.indexOf(o);
    const title = kind === "theory" ? o.key : kind === "work" ? o.work : `${o.company} · ${o.event}`;
    const attr = kind === "theory" ? `data-idx="${idx}"`
      : kind === "work" ? `data-widx="${idx}"`
      : kind === "company" ? `data-cidx="${idx}"`
      : kind === "model" ? `data-midx="${idx}"`
      : kind === "china" ? `data-chidx="${idx}"` : `data-oidx="${idx}"`;
    const badge = kind === "theory" || kind === "work" ? "" : resoBadge(o.company);
    const brief = kind === "work" ? `${o.person} · ${o.key}` : o.brief;
    return `<div class="mini ${kind}" ${attr}>
      <div class="mini-head"><span class="mini-y">${o.year}</span><span class="mini-t">${title} ${badge}</span></div>
      <p class="mini-b">${brief}</p>
    </div>`;
  };

  const rows = Array.from(buckets.keys()).sort((a, b) => a - b).map(d => {
    const b = buckets.get(d);
    const cells = LINE_ORDER.map(k =>
      `<div class="sync-cell sync-cell-${k} ${b[k].length ? "" : "empty"}">
        ${b[k].length ? `<span class="sync-mobile-head">${LINE_META[k].tag}</span>` : ""}
        ${b[k].map(o => mini(k, o)).join("")}
      </div>`).join("");
    return `<div class="sync-row" id="era-${d}" style="--cols:${LINE_ORDER.length}">
      <div class="sync-era"><b>${d}s</b><span>${ERA_NOTES[d] || "这一时期的理论、企业与模式在同一商业环境中相互回应。"}</span></div>
      ${cells}
    </div>`;
  }).join("");

  const HEAD_LABEL = {
    theory: ["理论线", "var(--accent)"], company: ["企业线", "var(--warn)"],
    model: ["模式线", "var(--info)"], org: ["组织线", "var(--ok)"],
    china: ["中国对照", LINE_META.china.color], work: ["著作线", "var(--err)"]
  };
  return `
    <div class="sync-wrap">
      <div class="sync-row sync-head" style="--cols:${LINE_ORDER.length}">
        <div class="sync-era">年代</div>
        ${LINE_ORDER.map(k =>
          `<div class="sync-cell"><span class="dual-head" style="--dc:${HEAD_LABEL[k][1]}">${HEAD_LABEL[k][0]}</span></div>`).join("")}
      </div>
      ${rows}
    </div>`;
}

/* 模式线的四要素筛选(《新经营学》透镜) */
let modelEl = "all";
function renderElFilter() {
  const items = [["all", "全部要素", "#2C74D6"]].concat(
    Object.entries(ELEMENTS).map(([k, v]) => [k, v.name, v.color]));
  return items.map(([k, name, color]) =>
    `<button class="chip ${k === modelEl ? "active" : ""}" data-el="${k}" style="--chip-c:${color}">${name}</button>`).join("");
}

function chinaItem(c, i) {
  const idx = CHINA_LIST.indexOf(c);
  const relChips = (c.rel || []).map(key => {
    const t = THEORIES.find(x => x.key === key);
    return t ? `<button class="rel-chip" data-rel="${THEORIES.indexOf(t)}">${key}</button>` : "";
  }).join("");
  return `
  <div class="tl-item china" style="--sc:${LINE_META.china.color}; --i:${Math.min(i, 14)}" data-chidx="${idx}">
    <div class="tl-card">
      <div class="tl-top">
        <span class="tl-year">${c.year}</span>
        <span class="tl-key">${c.company} · ${c.event} ${resoBadge(c.company)}</span>
        ${isReadK("h:" + idx) ? `<span class="read-mark">✓ 已读</span>` : ""}
        <span class="school-tag">中国对照</span>
      </div>
      <p class="tl-brief">${c.brief}</p>
      ${relChips ? `<div class="rel-chips">关联理论 ${relChips}</div>` : ""}
    </div>
  </div>`;
}

function renderTimeline() {
  const filterRow = $("#tl-filter");
  const elRow = $("#el-filter");
  $("#tl-body").classList.toggle("dual-mode", tlMode === "both");
  renderTimelineScale();
  filterRow.style.display = "none";
  elRow.style.display = "none";
  if (tlMode === "company") {
    $("#tl-count").textContent = `共 ${COMPANIES.length} 个企业现场`;
    $("#tl-body").innerHTML = withEras(COMPANIES, companyItem);
    return;
  }
  if (tlMode === "org") {
    $("#tl-count").textContent = `共 ${ORGS.length} 个组织进化节点`;
    $("#tl-body").innerHTML = withEras(ORGS, orgItem);
    return;
  }
  if (tlMode === "model") {
    elRow.style.display = "";
    const mlist = MODELS.filter(m => modelEl === "all" || m.el === modelEl);
    $("#tl-count").textContent = `共 ${mlist.length} 个商业模式 · 《新经营学》四要素可筛`;
    $("#tl-body").innerHTML = withEras(mlist, modelItem);
    return;
  }
  if (tlMode === "china") {
    $("#tl-count").textContent = `共 ${CHINA_LIST.length} 个中国现场 · 与西方线对照阅读`;
    $("#tl-body").innerHTML = withEras(CHINA_LIST, chinaItem);
    return;
  }
  const list = THEORIES.filter(t => tlSchool === "all" || t.school === tlSchool);
  if (tlMode === "both") {
    filterRow.style.display = "";
    const parts = [`${list.length} 理论`, `${COMPANIES.length} 企业`, `${MODELS.length} 模式`, `${ORGS.length} 组织`];
    if (HAS_CHINA) parts.push(`${CHINA_LIST.length} 中国`);
    parts.push(`${list.length} 著作`);
    $("#tl-count").textContent = parts.join(" × ") + " · 同年代对齐";
    $("#tl-body").innerHTML = renderSync(list);
    return;
  }
  filterRow.style.display = "";
  $("#tl-count").textContent = `共 ${list.length} 个理论节点`;
  $("#tl-body").innerHTML = withEras(list, theoryItem);
}

$("#tl-mode").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-mode]");
  if (!btn) return;
  $$("#tl-mode button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  tlMode = btn.dataset.mode;
  renderTimeline();
});

$("#tl-body").addEventListener("click", (e) => {
  const rel = e.target.closest(".rel-chip");
  if (rel) {
    e.stopPropagation();
    showDetail(THEORIES[Number(rel.dataset.rel)]);
    return;
  }
  const citem = e.target.closest(".tl-item.company, .mini.company");
  if (citem) { showCompany(COMPANIES[Number(citem.dataset.cidx)]); return; }
  const mitem = e.target.closest(".tl-item.model, .mini.model");
  if (mitem) { showModel(MODELS[Number(mitem.dataset.midx)]); return; }
  const oitem = e.target.closest(".tl-item.org, .mini.org");
  if (oitem) { showOrg(ORGS[Number(oitem.dataset.oidx)]); return; }
  const hitem = e.target.closest(".tl-item.china, .mini.china");
  if (hitem) { showChina(CHINA_LIST[Number(hitem.dataset.chidx)]); return; }
  const witem = e.target.closest(".mini.work");
  if (witem) { showDetail(THEORIES[Number(witem.dataset.widx)]); return; }
  const item = e.target.closest(".tl-item, .mini.theory");
  if (item && item.dataset.idx !== undefined) showDetail(THEORIES[Number(item.dataset.idx)]);
});

buildChips($("#tl-filter"), (s) => { tlSchool = s; renderTimeline(); });
$("#el-filter").innerHTML = renderElFilter();
$("#el-filter").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-el]");
  if (!chip) return;
  modelEl = chip.dataset.el;
  $$("#el-filter .chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  renderTimeline();
});
renderTimelineScale();
renderTimeline();

/* ---------- 节点卡片库(四条线) ---------- */
let cardSchool = "all";
let cardQuery = "";
let cardLine = "theory";
let cardEl = "all";

/* ---------- 著作与案例维度 ---------- */
let bookSchool = "all";
let bookQuery = "";

function workType(work) {
  if (work.includes("《")) return "经典著作";
  if (work.includes("实验")) return "研究现场";
  if (work.includes("创立")) return "机构/事件";
  return "理论文本";
}

function relatedCasesForTheory(key) {
  const collect = (arr, kind) => arr
    .filter(o => (o.rel || []).includes(key))
    .map(o => ({ kind, obj: o, label: `${LINE_META[kind].tag} · ${o.year} ${o.company || ""}${o.event ? " · " + o.event : ""}` }));
  return [
    ...collect(COMPANIES, "company"),
    ...collect(MODELS, "model"),
    ...collect(ORGS, "org")
  ].sort((a, b) => a.obj.year - b.obj.year);
}

function renderBooks() {
  const grid = $("#books-grid");
  if (!grid) return;
  const q = bookQuery.trim().toLowerCase();
  let pool = THEORIES.map((t, idx) => {
    const cases = relatedCasesForTheory(t.key);
    const search = [t.year, t.person, t.work, t.key, t.brief, SCHOOLS[t.school].name]
      .concat(cases.map(c => c.label)).join(" ");
    return { t, idx, cases, search };
  }).filter(item => {
    if (bookSchool !== "all" && item.t.school !== bookSchool) return false;
    if (q && !item.search.toLowerCase().includes(q)) return false;
    return true;
  });

  grid.innerHTML = pool.length ? pool.map(item => {
    const t = item.t;
    const sc = SCHOOLS[t.school];
    const caseText = item.cases.length
      ? item.cases.slice(0, 3).map(c => `<span>${c.label}</span>`).join("")
      : `<span>暂无直接关联案例</span>`;
    return `<div class="book-card" data-bi="${item.idx}" style="--sc:${sc.color}">
      <div class="book-meta"><span>${t.year}</span><b>${workType(t.work)}</b><i>${sc.name}</i></div>
      <h3>${t.work}</h3>
      <div class="book-author">${t.person}</div>
      <p><b>${t.key}</b>${t.brief}</p>
      <div class="book-cases">${caseText}</div>
    </div>`;
  }).join("") : `<div class="cards-empty">没有匹配的著作或案例,换个关键词试试?</div>`;

  grid.querySelectorAll(".book-card").forEach(card => {
    card.addEventListener("click", () => showDetail(THEORIES[Number(card.dataset.bi)]));
  });
}

const bookFilter = $("#book-filter");
if (bookFilter) {
  buildChips(bookFilter, school => {
    bookSchool = school;
    renderBooks();
  });
}
const bookSearch = $("#book-search");
if (bookSearch) {
  bookSearch.addEventListener("input", e => {
    bookQuery = e.target.value;
    renderBooks();
  });
}
renderBooks();

function cardData(line) {
  if (line === "theory") return THEORIES.map(t => ({ kind: "theory", o: t, year: t.year,
    title: t.key, sub: `${t.person} · ${t.work}`, brief: t.brief,
    color: SCHOOLS[t.school].color, tag: SCHOOLS[t.school].name,
    search: [t.person, t.work, t.key, t.brief, SCHOOLS[t.school].name].join(" ") }));
  const arr = line === "company" ? COMPANIES : line === "model" ? MODELS
    : line === "china" ? CHINA_LIST : ORGS;
  return arr.map(c => ({ kind: line, o: c, year: c.year,
    title: `${c.company} · ${c.event}`, sub: LINE_META[line].tag +
      (line === "model" && c.el && ELEMENTS[c.el] ? " · " + ELEMENTS[c.el].name : ""),
    brief: c.brief, color: LINE_META[line].color, tag: LINE_META[line].tag,
    search: [c.company, c.event, c.brief, LINE_META[line].tag].join(" ") }));
}

function openCard(kind, o) {
  if (kind === "theory") showDetail(o);
  else if (kind === "company") showCompany(o);
  else if (kind === "model") showModel(o);
  else if (kind === "china") showChina(o);
  else showOrg(o);
}

function renderCards() {
  const q = cardQuery.trim().toLowerCase();
  const schoolRow = $("#card-filter");
  const elRow = $("#card-el-filter");
  schoolRow.style.display = cardLine === "theory" ? "" : "none";
  elRow.style.display = cardLine === "model" ? "" : "none";

  const ALL_LINES = ["theory", "company", "model", "org"].concat(HAS_CHINA ? ["china"] : []);
  let pool = cardLine === "all" ? ALL_LINES.flatMap(cardData) : cardData(cardLine);

  pool = pool.filter(c => {
    if (cardLine === "theory" && cardSchool !== "all" && c.o.school !== cardSchool) return false;
    if (cardLine === "model" && cardEl !== "all" && c.o.el !== cardEl) return false;
    if (q && !c.search.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => a.year - b.year);

  $("#cards-grid").innerHTML = pool.length ? pool.map((c, i) => `
    <div class="tcard" style="--sc:${c.color}; --i:${Math.min(i, 12)}">
      ${c.kind === "theory" && isRead(THEORIES.indexOf(c.o)) ? `<span class="read-mark">✓ 已读</span>` : ""}
      <div class="y">${c.year} · ${c.tag}</div>
      <h3>${c.title}</h3>
      <div class="p">${c.sub}</div>
      <div class="b">${c.brief}</div>
    </div>`).join("") : `<div class="cards-empty">没有匹配的节点,换个关键词试试?</div>`;

  // 绑定点击(用数据序号定位对象)
  $$("#cards-grid .tcard").forEach((el, i) => {
    const c = pool[i];
    el.addEventListener("click", () => openCard(c.kind, c.o));
  });
}

$("#card-mode").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cline]");
  if (!btn) return;
  $$("#card-mode button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  cardLine = btn.dataset.cline;
  renderCards();
});

$("#card-search").addEventListener("input", (e) => {
  cardQuery = e.target.value;
  renderCards();
});

$("#card-el-filter").innerHTML = [["all", "全部要素", "#2C74D6"]].concat(
  Object.entries(ELEMENTS).map(([k, v]) => [k, v.name, v.color])
).map(([k, name, color]) =>
  `<button class="chip ${k === "all" ? "active" : ""}" data-cel="${k}" style="--chip-c:${color}">${name}</button>`).join("");
$("#card-el-filter").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-cel]");
  if (!chip) return;
  cardEl = chip.dataset.cel;
  $$("#card-el-filter .chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  renderCards();
});

buildChips($("#card-filter"), (s) => { cardSchool = s; renderCards(); });
renderCards();

/* ---------- 学派之争 ---------- */
(function renderVersus() {
  const rows = [
    ["代表人物", "people"],
    ["分析起点", "start"],
    ["优势来源", "source"],
    ["战略如何形成", "method"],
    ["关键工具", "tools"],
    ["关键词", "keywords"]
  ];
  const col = (cls, d, badge) => `
    <div class="vs-col ${cls}">
      <div class="vs-head">
        <span class="vs-badge">${badge}</span>
        <h3>${d.title}</h3>
        <div class="who">${d.people}</div>
      </div>
      <div class="vs-rows">
        ${rows.slice(1).map(([label, key]) => `
          <div class="vs-row"><div class="k">${label}</div><div class="v">${d[key]}</div></div>`).join("")}
      </div>
    </div>`;
  $("#versus-wrap").innerHTML =
    col("pos", SCHOOL_COMPARE.pos, "战略是“选位置”") +
    col("cap", SCHOOL_COMPARE.cap, "战略是“育能力”");
})();

/* ---------- 术语词典 ---------- */
(function initGlossary() {
  const grid = $("#glossary-grid");
  if (!grid) return;
  function draw(q) {
    const list = GLOSSARY.filter(g => !q || (g.term + g.en + g.def).toLowerCase().includes(q));
    grid.innerHTML = list.length ? list.map(g => {
      const t = g.rel && THEORIES.find(x => x.key === g.rel);
      return `<div class="gterm ${t ? "linked" : ""}" ${t ? `data-rel="${THEORIES.indexOf(t)}"` : ""}>
        <div class="gt-head"><b>${g.term}</b><span>${g.en}</span></div>
        <p>${g.def}</p>
        ${t ? `<span class="gt-rel">→ ${g.rel}</span>` : ""}
      </div>`;
    }).join("") : `<div class="cards-empty">没有匹配的术语</div>`;
  }
  draw("");
  $("#glossary-search").addEventListener("input", e => draw(e.target.value.trim().toLowerCase()));
  grid.addEventListener("click", e => {
    const el = e.target.closest("[data-rel]");
    if (el) showDetail(THEORIES[Number(el.dataset.rel)]);
  });
})();

/* ---------- 知识测验(理论 + 情景双模式) ---------- */
const BEST_KEY = "strategy_quiz_best";
const BEST_KEY_SCN = "strategy_quiz_best_scn";
let quizState = null;

function getBest(key) {
  try { return Number(localStorage.getItem(key)) || 0; } catch (e) { return 0; }
}
function setBest(key, v) {
  try { localStorage.setItem(key, String(v)); } catch (e) {}
}

function renderQuizStart() {
  const best = getBest(BEST_KEY), bestScn = getBest(BEST_KEY_SCN);
  $("#quiz-shell").innerHTML = `
    <div class="quiz-start">
      <h3>准备好了吗?</h3>
      <p>两种玩法:<b>理论测验</b>考你记没记住,<b>情景测验</b>考你会不会在真实商业现场使用。</p>
      <div class="quiz-modes">
        <div class="qmode">
          <div class="qmode-t">理论测验 · ${QUIZ.length} 题</div>
          <div class="qmode-d">人物、年代、框架,快问快答</div>
          ${best ? `<p class="quiz-best">最好成绩:${best} / ${QUIZ.length}</p>` : ""}
          <button class="btn primary" id="q-begin">开始理论测验</button>
        </div>
        <div class="qmode">
          <div class="qmode-t">情景测验 · ${SCENARIOS.length} 题</div>
          <div class="qmode-d">真实商业情境,选适用理论</div>
          ${bestScn ? `<p class="quiz-best">最好成绩:${bestScn} / ${SCENARIOS.length}</p>` : ""}
          <button class="btn ghost" id="q-begin-scn">开始情景测验</button>
        </div>
      </div>
    </div>`;
  $("#q-begin").addEventListener("click", () => startQuiz(QUIZ, BEST_KEY));
  $("#q-begin-scn").addEventListener("click", () => startQuiz(SCENARIOS, BEST_KEY_SCN));
}

function startQuiz(set, bestKey) {
  quizState = { i: 0, score: 0, locked: false, set, bestKey };
  renderQuestion();
}

function renderQuestion() {
  const st = quizState;
  const set = st.set;
  const q = set[st.i];
  st.locked = false;
  $("#quiz-shell").innerHTML = `
    <div class="qbox">
      <div class="q-progress">
        <span>第 ${st.i + 1} / ${set.length} 题</span>
        <span>当前得分:${st.score}</span>
      </div>
      <div class="q-bar"><i style="width:${st.i / set.length * 100}%"></i></div>
      <div class="q-text">${q.q}</div>
      <div id="q-opts">
        ${q.options.map((op, i) => `<button class="q-opt" data-i="${i}">${op}</button>`).join("")}
      </div>
      <div id="q-explain-slot"></div>
      <div class="q-next-row" id="q-next-slot"></div>
    </div>`;
  $("#q-opts").addEventListener("click", onAnswer);
}

function onAnswer(e) {
  const btn = e.target.closest(".q-opt");
  if (!btn || quizState.locked) return;
  quizState.locked = true;
  const st = quizState;
  const q = st.set[st.i];
  const picked = Number(btn.dataset.i);
  const right = picked === q.answer;
  if (right) st.score++;
  $$("#q-opts .q-opt").forEach((b) => {
    b.disabled = true;
    const bi = Number(b.dataset.i);
    if (bi === q.answer) b.classList.add("correct");
    else if (bi === picked) b.classList.add("wrong");
  });
  $("#q-explain-slot").innerHTML = `<div class="q-explain">${right ? "✓ 回答正确。" : "✗ 答错了。"}${q.explain}</div>`;
  const last = st.i === st.set.length - 1;
  $("#q-next-slot").innerHTML = `<button class="btn primary" id="q-next">${last ? "查看成绩" : "下一题"}</button>`;
  $("#q-next").addEventListener("click", () => {
    st.i++;
    if (st.i < st.set.length) renderQuestion();
    else renderQuizResult();
  });
}

function renderQuizResult() {
  const st = quizState;
  const total = st.set.length;
  const prevBest = getBest(st.bestKey);
  if (st.score > prevBest) setBest(st.bestKey, st.score);
  const verdict =
    st.score >= total - 1 ? "战略大师级!这本书你吃透了。" :
    st.score >= total * 0.7 ? "相当不错,主要脉络已掌握。" :
    st.score >= total * 0.5 ? "及格线以上,建议回看时间线补补细节。" :
    "别急,先去时间线和卡片库逛逛再来挑战。";
  $("#quiz-shell").innerHTML = `
    <div class="quiz-result">
      <h3>测验完成</h3>
      <div class="quiz-score">${st.score} / ${total}</div>
      <p>${verdict}</p>
      <p class="quiz-best">历史最好成绩:${Math.max(prevBest, st.score)} / ${total}${st.score > prevBest ? "(新纪录!)" : ""}</p>
      <button class="btn primary" id="q-retry">再测一次</button>
      <button class="btn ghost" id="q-back" style="margin-left:10px">返回选择</button>
    </div>`;
  $("#q-retry").addEventListener("click", () => startQuiz(st.set, st.bestKey));
  $("#q-back").addEventListener("click", renderQuizStart);
}

renderQuizStart();

/* ---------- 人物志 ---------- */
function personAppearances(p) {
  const out = [];
  p.t.forEach(k => {
    const t = THEORIES.find(x => x.key === k);
    if (t) out.push({ kind: "theory", obj: t, label: `${t.year} · ${t.key}` });
  });
  const scan = (arr, kind, keys) => arr.forEach((o, i) => {
    if (keys.includes(o.company)) out.push({ kind, obj: o, label: `${o.year} · ${o.event}` });
  });
  scan(COMPANIES, "company", p.c);
  scan(MODELS, "model", p.m);
  scan(ORGS, "org", p.o);
  return out.sort((a, b) => a.obj.year - b.obj.year);
}

function showPerson(p) {
  const apps = personAppearances(p);
  const chips = apps.map(a => {
    const kind = a.kind;
    const idx = kind === "theory" ? THEORIES.indexOf(a.obj)
      : kind === "company" ? COMPANIES.indexOf(a.obj)
      : kind === "model" ? MODELS.indexOf(a.obj) : ORGS.indexOf(a.obj);
    return `<button class="rel-chip" data-pkind="${kind}" data-pidx="${idx}">${LINE_META[kind].tag} · ${a.label}</button>`;
  }).join("");
  $("#modal").innerHTML = `
    <button class="m-close" id="m-close">×</button>
    <div class="m-year" style="--sc:var(--accent)">人物志 · PERSON</div>
    <h3>${p.name}</h3>
    <div class="m-person">${p.role}</div>
    <div class="m-sec"><h4>其人</h4><p>${p.intro}</p></div>
    <div class="m-sec"><h4>在本站的 ${apps.length} 个节点</h4><div class="m-rel">${chips}</div></div>`;
  $("#modal-mask").classList.add("show");
  $("#m-close").addEventListener("click", closeModal);
  $("#modal").querySelectorAll("[data-pkind]").forEach(b =>
    b.addEventListener("click", () => {
      const k = b.dataset.pkind, i = Number(b.dataset.pidx);
      if (k === "theory") showDetail(THEORIES[i]);
      else openLineItem(k, i);
    }));
}

(function renderPeople() {
  const grid = $("#people-grid");
  if (!grid) return;
  grid.innerHTML = PEOPLE.map((p, i) => {
    const apps = personAppearances(p);
    const lines = [...new Set(apps.map(a => a.kind))].map(k =>
      `<i class="pline-dot" style="background:${LINE_META[k].color}"></i>`).join("");
    return `<div class="pcard" data-pi="${i}">
      <div class="pcard-head"><b>${p.name}</b><span>${p.role}</span></div>
      <p>${p.intro}</p>
      <div class="pcard-foot">${lines}<em>${apps.length} 个节点</em></div>
    </div>`;
  }).join("");
  grid.addEventListener("click", e => {
    const el = e.target.closest(".pcard");
    if (el) showPerson(PEOPLE[Number(el.dataset.pi)]);
  });
})();

/* ---------- 以史鉴今 · 证据跳转 ---------- */
$$(".ev-btn").forEach(b => b.addEventListener("click", () => {
  gotoPage("timeline");
  tlMode = "both";
  $$("#tl-mode button").forEach(x => x.classList.toggle("active", x.dataset.mode === "both"));
  renderTimeline();
  setTimeout(() => {
    const el = document.getElementById("era-" + b.dataset.decade);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 1800);
    }
  }, 60);
}));

/* ---------- 交流区(localStorage 留言板) ---------- */
const FORUM_KEY = "strategy_forum_posts";
const FORUM_LIKE_KEY = "strategy_forum_liked";

function loadPosts() {
  let posts = null;
  try { posts = JSON.parse(localStorage.getItem(FORUM_KEY)); } catch (e) {}
  if (!Array.isArray(posts)) {
    posts = FORUM_SEED.slice();
    savePosts(posts);
  }
  return posts;
}
function savePosts(posts) {
  try { localStorage.setItem(FORUM_KEY, JSON.stringify(posts)); } catch (e) {}
}
function loadLiked() {
  try { return JSON.parse(localStorage.getItem(FORUM_LIKE_KEY)) || {}; } catch (e) { return {}; }
}
function saveLiked(m) {
  try { localStorage.setItem(FORUM_LIKE_KEY, JSON.stringify(m)); } catch (e) {}
}
function fmtTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderForum() {
  const posts = loadPosts().slice().sort((a, b) => b.time - a.time);
  const liked = loadLiked();
  $("#forum-list").innerHTML = posts.length ? posts.map((p, i) => `
    <div class="fpost">
      <div class="fpost-head">
        <div class="favatar">${escapeHtml(p.name.charAt(0))}</div>
        <div>
          <div class="fname">${escapeHtml(p.name)}</div>
          <div class="ftime">${fmtTime(p.time)}</div>
        </div>
      </div>
      <div class="ftext">${escapeHtml(p.text)}</div>
      <button class="flike ${liked[p.time] ? "liked" : ""}" data-time="${p.time}">♥ ${p.likes || 0}</button>
    </div>`).join("") : `<div class="forum-empty">还没有留言,来发第一条吧。</div>`;
}

$("#forum-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#forum-name").value.trim();
  const text = $("#forum-text").value.trim();
  if (!name || !text) return;
  const posts = loadPosts();
  posts.push({ name, text, time: Date.now(), likes: 0 });
  savePosts(posts);
  $("#forum-text").value = "";
  renderForum();
});

$("#forum-list").addEventListener("click", (e) => {
  const btn = e.target.closest(".flike");
  if (!btn) return;
  const time = Number(btn.dataset.time);
  const posts = loadPosts();
  const liked = loadLiked();
  const post = posts.find(p => p.time === time);
  if (!post) return;
  if (liked[time]) {
    post.likes = Math.max(0, (post.likes || 0) - 1);
    delete liked[time];
  } else {
    post.likes = (post.likes || 0) + 1;
    liked[time] = 1;
  }
  savePosts(posts);
  saveLiked(liked);
  renderForum();
});

renderForum();
updateProgress();

/* ---------- 学派关系图谱 ---------- */
(function renderGraph() {
  const wrap = $("#graph-wrap");
  if (!wrap) return;

  const LANES = ["found", "pos", "cap", "learn", "innov"];
  const W = 1460, LANE_H = 112, TOP = 56, BOTTOM = 36;
  const X0 = 110, X1 = 1400;
  const H = TOP + LANES.length * LANE_H + BOTTOM;
  const yearX = (y) => X0 + (y - 1911) / 100 * (X1 - X0);
  const laneY = (i) => TOP + i * LANE_H + LANE_H / 2;

  // 节点坐标(只画有图谱短名的核心理论,避免拥挤)
  const nodes = THEORIES.filter(t => GRAPH_SHORT[t.key]).map((t) => ({
    t, idx: THEORIES.indexOf(t),
    x: yearX(t.year) + (GRAPH_LAYOUT[t.key] || 0),
    y: laneY(LANES.indexOf(t.school)),
    short: GRAPH_SHORT[t.key] || t.key,
    color: SCHOOLS[t.school].color
  }));
  const byKey = {};
  nodes.forEach(n => { byKey[n.t.key] = n; });

  // 图例(学派)
  $("#graph-legend-schools").innerHTML = LANES.map(k =>
    `<span class="gl-item"><i class="gl-dot" style="background:${SCHOOLS[k].color}"></i>${SCHOOLS[k].name}</span>`).join("");

  // 泳道与刻度
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="学派关系图谱"><defs><marker id="g-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>`;
  for (let y = 1920; y <= 2010; y += 10) {
    const x = yearX(y);
    svg += `<line x1="${x}" y1="${TOP - 18}" x2="${x}" y2="${H - BOTTOM + 6}" class="g-grid"/>`;
    svg += `<text x="${x}" y="${TOP - 26}" class="g-tick" text-anchor="middle">${y}s</text>`;
  }
  LANES.forEach((k, i) => {
    const y = laneY(i);
    if (i > 0) svg += `<line x1="20" y1="${TOP + i * LANE_H}" x2="${W - 20}" y2="${TOP + i * LANE_H}" class="g-lane"/>`;
    svg += `<text x="16" y="${y + 4}" class="g-lane-name" fill="${SCHOOLS[k].color}">${SCHOOLS[k].name}</text>`;
  });

  // 边
  GRAPH_EDGES.forEach((e, i) => {
    const a = byKey[e.from], b = byKey[e.to];
    if (!a || !b) return;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.max(Math.hypot(dx, dy), 1);
    const bend = (i % 2 === 0 ? 1 : -1) * Math.min(len * 0.16, 46);
    const cx = mx - dy / len * bend, cy = my + dx / len * bend;
    const color = e.type === "debate" ? "#D8474F" : a.color;
    svg += `<path d="M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}"
      class="g-edge ${e.type}" stroke="${color}"
      data-from="${e.from}" data-to="${e.to}" data-note="${e.note}"
      marker-end="url(#g-arrow)"/>`;
  });

  // 标签防重叠:每条泳道内按 下1/下2/上1/上2 四层自动分配,错层标签带牵引线
  const LEVELS = [
    { name: 30, year: 44 },
    { name: 50, year: 64 },
    { name: -42, year: -28 },
    { name: -60, year: -46 }
  ];
  const labelPlan = {};
  LANES.forEach((k) => {
    const laneNodes = nodes.filter(n => n.t.school === k).sort((a, b) => a.x - b.x);
    const lastRight = LEVELS.map(() => -Infinity);
    laneNodes.forEach(n => {
      const wEst = n.short.length * 13 + 6;
      const tx = Math.min(Math.max(n.x, X0 - 20), X1 + 6);
      let lvl = LEVELS.length - 2;
      for (let i = 0; i < LEVELS.length; i++) {
        if (tx - wEst / 2 > lastRight[i] + 8) { lvl = i; break; }
      }
      lastRight[lvl] = tx + wEst / 2;
      labelPlan[n.t.key] = { tx, lvl };
    });
  });

  // 节点
  nodes.forEach(n => {
    const plan = labelPlan[n.t.key];
    const L = LEVELS[plan.lvl];
    const lx = plan.tx - n.x;
    const leader = plan.lvl !== 0
      ? `<line x1="0" y1="${L.name > 0 ? 11 : -11}" x2="${lx}" y2="${L.name + (L.name > 0 ? -11 : 11)}" class="g-leader"/>`
      : "";
    svg += `<g class="g-node" data-key="${n.t.key}" data-idx="${n.idx}" transform="translate(${n.x}, ${n.y})">
      ${leader}
      <circle r="16" class="g-halo" fill="${n.color}"/>
      <circle r="8.5" fill="${n.color}"/>
      <text x="${lx}" y="${L.name}" text-anchor="middle" class="g-name">${n.short}</text>
      <text x="${lx}" y="${L.year}" text-anchor="middle" class="g-year">${n.t.year}</text>
    </g>`;
  });
  svg += "</svg>";
  wrap.innerHTML = svg;

  // 交互:hover 高亮关联,点击打开详情
  const tip = $("#graph-tip");
  const edges = Array.from(wrap.querySelectorAll(".g-edge"));
  const gnodes = Array.from(wrap.querySelectorAll(".g-node"));

  wrap.addEventListener("mouseover", (ev) => {
    const g = ev.target.closest(".g-node");
    const edge = ev.target.closest(".g-edge");
    if (!g && !edge) return;
    let keys = [];
    if (g) keys = [g.dataset.key];
    if (edge) keys = [edge.dataset.from, edge.dataset.to];
    const linked = new Set(keys);
    edges.forEach(p => {
      const hit = keys.includes(p.dataset.from) || keys.includes(p.dataset.to);
      p.classList.toggle("hl", hit);
      p.classList.toggle("dim", !hit);
      if (hit) {
        linked.add(p.dataset.from);
        linked.add(p.dataset.to);
        if (p.dataset.note) tip.textContent = p.dataset.note;
      }
    });
    gnodes.forEach(n => n.classList.toggle("dim", !linked.has(n.dataset.key)));
  });
  wrap.addEventListener("mouseleave", () => {
    edges.forEach(p => p.classList.remove("hl", "dim"));
    gnodes.forEach(n => n.classList.remove("dim"));
    tip.textContent = "把鼠标移到任意理论节点上,看看它与谁相连。";
  });
  wrap.addEventListener("click", (ev) => {
    const g = ev.target.closest(".g-node");
    if (g) showDetail(THEORIES[Number(g.dataset.idx)]);
  });
})();
