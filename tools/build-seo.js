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
const BASE = "https://chronicle.qiuyiwu.com";
const TODAY = new Date().toISOString().slice(0, 10);

const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(root, "data.v22.js"), "utf8") +
  ";globalThis.__D__={THEORIES,COMPANIES,MODELS,ORGS,GLOSSARY,PEOPLE,ERAS,SCHOOLS,SCHOOL_COMPARE,THEORY_DETAILS,THEORY_GUIDES,THEORY_LIMITS,ELEMENTS};",
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
L.push("## 一、理论线：百年战略思想（34 个节点）");
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
  L.push("");
});

/* 三条现场线 */
const SITE_LINES = [
  ["二、企业线：革新者与决策现场", D.COMPANIES, "企业现场"],
  ["三、模式线：商业模式的进化与转世", D.MODELS, "商业模式"],
  ["四、组织线：组织形态与管理实践", D.ORGS, "组织进化"]
];
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
    if (o.rel && o.rel.length) L.push(`- 关联理论：${o.rel.join("、")}`);
    L.push("");
  });
});

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

- [全站内容纯文本导出](${BASE}/llms-full.txt)：全部 ${D.THEORIES.length + D.COMPANIES.length + D.MODELS.length + D.ORGS.length} 个节点的完整内容，含决策现场五问、理论深度解读、术语词典与人物志。**本站页面由 JS 渲染，抓取请用此文件。**

## 内容构成

- 理论线 ${D.THEORIES.length} 节点：百年战略思想的学派之争（源自《经营战略全史》三谷宏治）
- 企业线 ${D.COMPANIES.length} 节点：革新者如何把发明推向大众（源自《他们创造了美国》哈罗德·埃文斯）
- 模式线 ${D.MODELS.length} 节点：赚钱方式的进化与转世（源自《商业模式全史》三谷宏治）
- 组织线 ${D.ORGS.length} 节点：组织形态与管理实践的进化（源自《管理百年》斯图尔特·克雷纳）
- 著作线 34 部经典 + 术语词典 ${D.GLOSSARY.length} 条 + 人物志

横切透镜来自《新经营学》：商业模式 = 目标 × 价值 × 能力 × 收益。

## 视图

- [时间线](${BASE}/#timeline)：五轨对照或单线细读，带时代分层
- [知识库](${BASE}/#knowledge)：节点卡片、著作与案例、术语词典、人物志、学派之争
- [关系图谱](${BASE}/#graph)：理论谱系，谁影响谁、谁批判谁
- [以史鉴今](${BASE}/#insights)：七条百年规律与战略判断仪表盘
- [测验](${BASE}/#quiz)：10 道知识题 + 8 道情景题

## 内容纪律

本站内容为对公开史实的事实性整理，非原书文字摘录。写作红线：只搬运不发明、
不杜撰引语、对照者必须真实、2020 年后事实从严。建议读原书，本站是索引与地图。

## 引用

引用本站内容时请注明：商业通鉴（${BASE}）。
`;
fs.writeFileSync(path.join(root, "llms.txt"), nav);

/* ============ sitemap.xml ============ */
const views = [
  ["/", "1.0", "weekly"],
  ["/#timeline", "0.9", "weekly"],
  ["/#knowledge", "0.9", "weekly"],
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
