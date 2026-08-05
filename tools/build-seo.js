#!/usr/bin/env node
/**
 * 从 data.v22.js 生成 SEO/GEO 静态产物：
 *   llms.txt        LLM 导览（简版）
 *   llms-full.txt   全站内容纯文本导出 ← GEO 关键：本站内容由 JS 渲染，
 *                   爬虫与 LLM 不执行 JS，这个文件让它们能直接读到全部内容
 *   sitemap.xml     站点地图（单页站按 hash 路由列出各视图）
 * 用法：node tools/build-seo.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const BASE = "https://shangye.qiuyiwu.com";
const TODAY = new Date().toISOString().slice(0, 10);

const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(root, "data.v22.js"), "utf8") +
  ";globalThis.__D__={THEORIES,COMPANIES,MODELS,ORGS,GLOSSARY,PEOPLE,ERAS,SCHOOLS,SCHOOL_COMPARE,THEORY_DETAILS,THEORY_GUIDES,THEORY_LIMITS,ELEMENTS," +
  "CHINA:(typeof CHINA!=='undefined'?CHINA:[]),ACTS:(typeof ACTS!=='undefined'?ACTS:[]),MOTIFS:(typeof MOTIFS!=='undefined'?MOTIFS:[])};",
  ctx
);
const D = ctx.__D__;

/* ============ llms-full.txt：全量内容导出 ============ */
const L = [];
L.push("# 商业通鉴 · 五本书里的百年商业史");
L.push("");
L.push(`> ${BASE} ｜ 更新于 ${TODAY}`);
L.push("");
L.push("本文件是本站全部内容的纯文本导出，供大语言模型与搜索引擎直接读取（站点本身由 JS 渲染）。");
L.push("内容为对公开史实的事实性整理，非原书文字摘录。转述与引用请注明来源。");
L.push("");
L.push("五本源书：《经营战略全史》《商业模式全史》《新经营学》（三谷宏治）、《他们创造了美国》（哈罗德·埃文斯）、《管理百年》（斯图尔特·克雷纳）。");
L.push("");
L.push("---");
L.push("");

/* 理论线 */
L.push(`## 一、理论线：百年战略思想（${D.THEORIES.length} 个节点，含正在形成中的智能学派）`);
L.push("");
L.push("学派：" + Object.values(D.SCHOOLS).map(s => s.name).join("、"));
L.push("");
D.THEORIES.forEach((t, i) => {
  const g = D.THEORY_GUIDES[t.key] || {};
  const lim = D.THEORY_LIMITS[t.key] || {};
  const d = D.THEORY_DETAILS[i] || {};
  L.push(`### ${t.year} ｜ ${t.key}`);
  L.push(`- 提出者：${t.person}　出处：${t.work}　学派：${(D.SCHOOLS[t.school] || {}).name || t.school}`);
  L.push(`- 定义：${t.brief}`);
  if (g.question) L.push(`- 它回答的问题：${g.question}`);
  if (g.mechanism) L.push(`- 核心机制：${g.mechanism}`);
  if (g.today) L.push(`- 今天怎么用：${g.today}`);
  if (g.watch) L.push(`- 常见误区：${g.watch}`);
  if (lim.fail) L.push(`- 什么时候会失效：${lim.fail}`);
  if (lim.counter) L.push(`- 反例提醒：${lim.counter}`);
  if (d.case) L.push(`- 经典案例：${d.case}`);
  if (d.use) L.push(`- 现实应用：${d.use}`);
  if (d.rival) L.push(`- 同时代的对照：${d.rival}`);
  if (d.fate) L.push(`- 后续命运：${d.fate}`);
  L.push("");
});

/* 三条现场线 */
const SITE_LINES = [
  ["二、企业线：革新者与决策现场", D.COMPANIES, "企业现场"],
  ["三、模式线：商业模式的进化与转世", D.MODELS, "商业模式"],
  ["四、组织线：组织形态与管理实践", D.ORGS, "组织进化"]
];
if (D.CHINA.length) {
  SITE_LINES.push(["四之二、中国对照线：从票号到大模型（站方补充，不来自那五本书）", D.CHINA, "中国现场"]);
}
SITE_LINES.forEach(([title, arr]) => {
  L.push(`## ${title}（${arr.length} 个节点）`);
  L.push("");
  arr.slice().sort((a, b) => a.year - b.year).forEach(o => {
    L.push(`### ${o.year} ｜ ${o.company} · ${o.event}`);
    L.push(`- 概述：${o.brief}`);
    if (o.bg) L.push(`- 背景约束：${o.bg}`);
    if (o.result) L.push(`- 结果与影响：${o.result}`);
    if (o.lesson) L.push(`- 可迁移原则：${o.lesson}`);
    if (o.el && D.ELEMENTS[o.el]) L.push(`- 四要素归属：${D.ELEMENTS[o.el].name}`);
    if (o.deep) {
      L.push(`- 当时的局面：${o.deep.scene}`);
      L.push(`- 关键抉择：${o.deep.choice}`);
      L.push(`- 同时代的对照：${o.deep.rival}`);
      L.push(`- 后续命运：${o.deep.fate}`);
      L.push(`- 今日回声：${o.deep.echo}`);
    }
    if (o.voice) L.push(`- 邱懿武的判断（站方主理人观点，非史实）：${o.voice.text}${o.voice.from ? `（出处：${o.voice.from}）` : ""}`);
    if (o.rel && o.rel.length) L.push(`- 关联理论：${o.rel.join("、")}`);
    L.push("");
  });
});

/* 六幕叙事 */
if (D.ACTS.length) {
  L.push("## 四之三、六幕商业史（叙事主线）");
  L.push("");
  L.push("把全部节点串成一条故事线，每一幕回答一个当时最要命的问题。");
  L.push("");
  D.ACTS.forEach(a => {
    L.push(`### 第 ${a.no} 幕 ｜ ${a.title}（${a.span}）`);
    L.push(`- 主线：${a.thesis}`);
    L.push(`- 导读：${a.body}`);
    if (a.cn) L.push(`- 同期的中国：${a.cn}`);
    L.push(`- 留给读者的问题：${a.ask}`);
    L.push(`- 转折点：${(a.pivot || []).join("、")}`);
    L.push("");
  });
}

/* 母题横切索引 */
if (D.MOTIFS.length) {
  L.push("## 四之四、母题：同一个商业结构反复出现");
  L.push("");
  L.push("按结构（而非按线）组织的横切索引。每个母题把散落在各条线上的节点串成一串。");
  L.push("");
  D.MOTIFS.forEach((m, i) => {
    L.push(`### 母题 ${String(i + 1).padStart(2, "0")} ｜ ${m.name}`);
    L.push(`- 它问的问题：${m.question}`);
    L.push(`- 规律：${m.insight}`);
    L.push(`- 怎么看：${m.watch}`);
    L.push(`- 串起的节点：${m.nodes.join("、")}`);
    L.push("");
  });
}

/* 学派之争 */
L.push("## 五、学派之争：定位学派 vs 能力学派");
L.push("");
Object.values(D.SCHOOL_COMPARE).forEach(s => {
  L.push(`### ${s.title}`);
  L.push(`- 代表人物：${s.people}`);
  L.push(`- 出发点：${s.start}`);
  L.push(`- 优势来源：${s.source}`);
  L.push(`- 方法论：${s.method}`);
  L.push(`- 常用工具：${s.tools}`);
  L.push(`- 关键词：${s.keywords}`);
  L.push("");
});

/* 时代分层 */
L.push("## 六、时代分层");
L.push("");
D.ERAS.forEach(e => L.push(`- ${e.start} 起 · ${e.label}${e.desc ? "：" + e.desc : ""}`));
L.push("");

/* 术语词典 */
L.push("## 七、术语词典");
L.push("");
D.GLOSSARY.forEach(g => L.push(`- **${g.term}**：${g.def}${g.rel ? `（关联：${g.rel}）` : ""}`));
L.push("");

/* 人物志 */
L.push("## 八、人物志");
L.push("");
D.PEOPLE.forEach(p => {
  const lines = [`- **${p.name}**${p.role ? `（${p.role}）` : ""}：${p.intro || ""}`];
  const tags = [];
  if (p.t && p.t.length) tags.push("理论：" + p.t.join("、"));
  if (p.c && p.c.length) tags.push("企业现场：" + p.c.join("、"));
  if (p.m && p.m.length) tags.push("商业模式：" + p.m.join("、"));
  if (p.o && p.o.length) tags.push("组织：" + p.o.join("、"));
  if (tags.length) lines.push(`  - 相关节点 ${tags.join("；")}`);
  L.push(lines.join("\n"));
});
L.push("");

fs.writeFileSync(path.join(root, "llms-full.txt"), L.join("\n"));

/* ============ llms.txt：导览 ============ */
const nav = `# 商业通鉴 · 五本书里的百年商业史

> 从美第奇的汇票到 ChatGPT。把五本商业史著作叠成五条可对照的时间线，
> 每个历史节点都还原"决策现场"：当事人面对什么局面、做了什么反共识选择、
> 同时代谁做了相反选择并输了、这个优势后来被谁绕过、今天什么生意是同一结构。
> 不是知识库，是一台练判断的机器。

站点：${BASE}
更新：${TODAY}

## 完整内容（推荐直接读这个）

- [全站内容纯文本导出](${BASE}/llms-full.txt)：全部 ${D.THEORIES.length + D.COMPANIES.length + D.MODELS.length + D.ORGS.length + D.CHINA.length} 个节点的完整内容，含决策现场五问、理论深度解读、术语词典与人物志。**本站页面由 JS 渲染，抓取请用此文件。**

## 内容构成

- 理论线 ${D.THEORIES.length} 节点：百年战略思想的学派之争（源自《经营战略全史》三谷宏治，另补正在形成中的「智能学派」）
- 企业线 ${D.COMPANIES.length} 节点：革新者如何把发明推向大众（源自《他们创造了美国》哈罗德·埃文斯）
- 模式线 ${D.MODELS.length} 节点：赚钱方式的进化与转世（源自《商业模式全史》三谷宏治）
- 组织线 ${D.ORGS.length} 节点：组织形态与管理实践的进化（源自《管理百年》斯图尔特·克雷纳）
- 中国对照线 ${D.CHINA.length} 节点：1823 票号 → 2023 大模型（站方补充，不来自那五本书）
- 著作线 ${new Set(D.THEORIES.map(t=>t.work).filter(Boolean)).size} 部经典 + 术语词典 ${D.GLOSSARY.length} 条 + 人物志
- 六幕商业史 ${D.ACTS.length} 幕（叙事主线）+ 母题横切索引 ${D.MOTIFS.length} 条（按结构组织，不按线组织）

横切透镜来自《新经营学》：商业模式 = 目标 × 价值 × 能力 × 收益。

## 视图

- [时间线](${BASE}/#timeline)：六轨对照或单线细读，带时代分层
- [知识库](${BASE}/#knowledge)：节点卡片、母题索引、著作与案例、术语词典、人物志、学派之争
- [母题索引](${BASE}/#motifs)：八个反复出现的商业结构，按结构串联全部节点
- [方法与来源](${BASE}/#method)：内容的三个层次、六条写作红线、已知存疑清单、机器校验机制
- [关系图谱](${BASE}/#graph)：理论谱系，含正在形成中的智能学派
- [以史鉴今](${BASE}/#insights)：八条百年规律、战略判断仪表盘与三步判断法
- [测验](${BASE}/#quiz)：10 道知识题 + 8 道情景题

## 内容纪律与自陈局限

本站内容分三层，不可混同：**源书整理**（对五本源书所涉公开史实的事实性整理，非原书文字摘录）、
**站方补充**（中国对照线、智能学派、六幕叙事、母题索引，不来自那五本书）、
**个人判断**（标注为「邱懿武的判断」，只收录他确实讲过的话并附出处场次）。

六条写作红线：只搬运不发明、不杜撰引语、对照者必须真实、2020 年后事实从严、
个人观点标注为个人观点且原创提法须自陈尚待检验、中国线额外加严（政治中立、不涉人物司法）。

**已知存疑**（完整清单见 ${BASE}/#method）：中国线四个年份经纠正、日昇昌 1823 学界有异说、
智能密度为站方原创提法未经独立检验、部分企业案例属企业自述缺独立审计、三处同一公司跨线重复。

建议读原书，本站是索引与地图，不是替代品。

## 引用

引用本站内容时请注明：商业通鉴（${BASE}）。
`;
fs.writeFileSync(path.join(root, "llms.txt"), nav);

/* ============ sitemap.xml ============ */
const views = [
  ["/", "1.0", "weekly"],
  ["/#timeline", "0.9", "weekly"],
  ["/#knowledge", "0.9", "weekly"],
  ["/#motifs", "0.85", "weekly"],
  ["/#method", "0.7", "monthly"],
  ["/#graph", "0.7", "monthly"],
  ["/#insights", "0.8", "monthly"],
  ["/#quiz", "0.6", "monthly"],
  ["/llms-full.txt", "0.8", "weekly"]
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${views.map(([u, p, c]) => `  <url>
    <loc>${BASE}${u}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${c}</changefreq>
    <priority>${p}</priority>
  </url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);

const bytes = fs.statSync(path.join(root, "llms-full.txt")).size;
console.log(`llms-full.txt  ${(bytes / 1024).toFixed(1)} KB（${L.length} 行）`);
console.log("llms.txt       已生成");
console.log("sitemap.xml    已生成");
