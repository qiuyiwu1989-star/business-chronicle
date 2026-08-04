#!/usr/bin/env node
/**
 * 数据完整性校验：在改完 data.v22.js 后跑一次，防止内容回归。
 * 用法：
 *   node tools/validate.js            完整校验，有错退出码 1
 *   node tools/validate.js --summary  只打印规模快照
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const code = fs.readFileSync(path.join(root, "data.v22.js"), "utf8");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code + "\n;globalThis.__EXPORT__={THEORIES,COMPANIES,MODELS,ORGS,GLOSSARY,PEOPLE,ERAS,QUIZ,SCENARIOS,GRAPH_EDGES,ELEMENTS,SCHOOLS,THEORY_DETAILS,THEORY_GUIDES,THEORY_LIMITS};", ctx);
const D = ctx.__EXPORT__;

const summaryOnly = process.argv.includes("--summary");
const errors = [];
const warns = [];

const LINES = [
  ["理论线 THEORIES", D.THEORIES],
  ["企业线 COMPANIES", D.COMPANIES],
  ["模式线 MODELS", D.MODELS],
  ["组织线 ORGS", D.ORGS]
];

/* ---------- 规模快照 ---------- */
const deepCount = (arr) => arr.filter(o => o.deep).length;
const summary = [
  `理论 ${D.THEORIES.length} · 企业 ${D.COMPANIES.length} · 模式 ${D.MODELS.length} · 组织 ${D.ORGS.length}`,
  `决策现场层 deep 覆盖：企业 ${deepCount(D.COMPANIES)}/${D.COMPANIES.length} · 模式 ${deepCount(D.MODELS)}/${D.MODELS.length} · 组织 ${deepCount(D.ORGS)}/${D.ORGS.length}`,
  `词典 ${D.GLOSSARY.length} · 人物 ${D.PEOPLE.length} · 时代 ${D.ERAS.length} · 测验 ${D.QUIZ.length} · 情景 ${D.SCENARIOS.length} · 图谱边 ${D.GRAPH_EDGES.length}`,
  `理论深度：details ${D.THEORY_DETAILS.length} · guides ${Object.keys(D.THEORY_GUIDES).length} · limits ${Object.keys(D.THEORY_LIMITS).length}`
];
if (summaryOnly) { console.log(summary.join("\n")); process.exit(0); }

/* ---------- 1. rel 必须指向真实存在的理论 key ---------- */
const theoryKeys = new Set(D.THEORIES.map(t => t.key));
LINES.slice(1).forEach(([name, arr]) => {
  arr.forEach(o => {
    (o.rel || []).forEach(r => {
      if (!theoryKeys.has(r)) errors.push(`${name} ${o.year} ${o.company}：rel "${r}" 不存在于 THEORIES`);
    });
  });
});

/* ---------- 2. 必填字段 ---------- */
LINES.slice(1).forEach(([name, arr]) => {
  arr.forEach(o => {
    ["year", "company", "event", "brief"].forEach(f => {
      if (!o[f]) errors.push(`${name} ${o.year} ${o.company}：缺字段 ${f}`);
    });
  });
});
D.THEORIES.forEach(t => {
  ["year", "person", "work", "school", "key", "brief"].forEach(f => {
    if (!t[f]) errors.push(`理论线 ${t.year}：缺字段 ${f}`);
  });
  if (!D.SCHOOLS[t.school]) errors.push(`理论线 ${t.key}：school "${t.school}" 未定义`);
});

/* ---------- 3. deep 五元组完整性与长度 ---------- */
const DEEP_FIELDS = ["scene", "choice", "rival", "fate", "echo"];
LINES.slice(1).forEach(([name, arr]) => {
  arr.forEach(o => {
    if (!o.deep) return;
    DEEP_FIELDS.forEach(f => {
      const v = o.deep[f];
      if (!v) { errors.push(`${name} ${o.year} ${o.company}：deep 缺 ${f}`); return; }
      if (v.length < 30) warns.push(`${name} ${o.year} ${o.company}：deep.${f} 偏短（${v.length} 字）`);
      if (v.length > 110) warns.push(`${name} ${o.year} ${o.company}：deep.${f} 偏长（${v.length} 字）`);
    });
    Object.keys(o.deep).forEach(k => {
      if (!DEEP_FIELDS.includes(k)) errors.push(`${name} ${o.year} ${o.company}：deep 有未知字段 ${k}`);
    });
  });
});

/* ---------- 4. 年份合理性与排序 ---------- */
LINES.forEach(([name, arr]) => {
  arr.forEach(o => {
    if (typeof o.year !== "number" || o.year < 1300 || o.year > 2030) {
      errors.push(`${name} ${o.company || o.key}：年份异常 ${o.year}`);
    }
  });
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].year < arr[i - 1].year) {
      warns.push(`${name}：第 ${i + 1} 条（${arr[i].year} ${arr[i].company || arr[i].key}）年份早于前一条，数组未按年排序`);
    }
  }
});

/* ---------- 5. 模式线 el 必须是四要素之一 ---------- */
D.MODELS.forEach(m => {
  if (m.el && !D.ELEMENTS[m.el]) errors.push(`模式线 ${m.year} ${m.company}：el "${m.el}" 不在 ELEMENTS 中`);
});

/* ---------- 6. 测验答案索引合法 ---------- */
D.QUIZ.forEach((q, i) => {
  if (!Array.isArray(q.options) || q.answer < 0 || q.answer >= q.options.length) {
    errors.push(`测验第 ${i + 1} 题：answer 索引越界`);
  }
});
D.SCENARIOS.forEach((s, i) => {
  if (!Array.isArray(s.options) || s.answer < 0 || s.answer >= s.options.length) {
    errors.push(`情景题第 ${i + 1} 题：answer 索引越界`);
  }
});

/* ---------- 7. 图谱边端点必须存在 ---------- */
D.GRAPH_EDGES.forEach(e => {
  const [from, to] = [e.from ?? e[0], e.to ?? e[1]];
  if (from && !theoryKeys.has(from)) errors.push(`图谱边起点 "${from}" 不存在`);
  if (to && !theoryKeys.has(to)) errors.push(`图谱边终点 "${to}" 不存在`);
});

/* ---------- 8. 内容红线：直接引语检测 ---------- */
const QUOTE_RE = /[""]([^""]{8,})[""]\s*[，。]/;
LINES.slice(1).forEach(([name, arr]) => {
  arr.forEach(o => {
    if (!o.deep) return;
    DEEP_FIELDS.forEach(f => {
      if (QUOTE_RE.test(o.deep[f] || "")) {
        warns.push(`${name} ${o.year} ${o.company}：deep.${f} 疑似含直接引语，请确认非杜撰`);
      }
    });
  });
});

/* ---------- 输出 ---------- */
console.log(summary.join("\n"));
console.log("");
if (warns.length) {
  console.log(`⚠️  ${warns.length} 条提醒：`);
  warns.forEach(w => console.log("   - " + w));
  console.log("");
}
if (errors.length) {
  console.log(`❌ ${errors.length} 条错误：`);
  errors.forEach(e => console.log("   - " + e));
  process.exit(1);
}
console.log("✅ 数据校验通过");
