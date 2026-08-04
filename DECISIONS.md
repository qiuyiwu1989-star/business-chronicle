# Decisions

- 2026-08-03: 项目正式目录定为 `/Users/qiuyiwu/strategy-site`，与 zip 同名。理由：与既有站点习惯一致（本地目录 → git → 部署时再定子域）。Basis: AI 推断，待用户确认。Confidence: medium.
- 2026-08-03: 档位定 G2。理由：内容型产品、会被真实使用、预期多轮打磨；尚无真实用户数据故不上 G3。Confidence: high.
- (代码反推) 2026-07 前后: 站点采用零依赖单数据源架构（data.v22.js 单文件承载全部内容），渲染与数据分离。Basis: 代码反推。Confidence: high.
- (代码反推) 五本书五条线的叠加叙事：理论/企业/模式/组织/著作。「著作线」由 THEORIES 等数据的 work 字段派生。Basis: 代码反推。
- 2026-08-03: 企业线深度层字段定为 deep{scene,choice,rival,fate,echo} 五元组，渲染复用 guide-card 零新增 CSS；有 deep 时替换通用「边界与代价」模板段。理由：真实史实优于模板话术。Confidence: high.
- 2026-08-03: server.js 本地默认 no-store，部署环境 CACHE=1 恢复强缓存。理由：immutable 缓存让本地迭代看不到改动。Confidence: high.
- 2026-08-04: 子域名定为 `chronicle.qiuyiwu.com`，而非原计划的 `history.qiuyiwu.com`。理由：history 子域当天已被《智能革命史》占用（/var/www/history.qiuyiwu.com，2026-08-04 16:57 部署），不可覆盖；chronicle 对应站名 Business Chronicle，且不与"智能革命史"混淆。Confidence: high.
- 2026-08-04: 不复用 qiuyiwu.com 其它站点的百度统计 ID。理由：一个 ID 对应一个站点，复用会把两站数据混在一起。index.html 中留注释占位，待用户申请新 ID。Confidence: high.
- 2026-08-04: 新增 `llms-full.txt`（全站内容纯文本导出，186KB）作为 GEO 主要抓取入口。理由：本站内容由 JS 渲染，LLM 爬虫不执行 JS，没有这个文件等于对生成式引擎完全隐身。由 tools/build-seo.js 从 data 生成，部署脚本自动重建，不会与内容脱节。Confidence: high.
- 2026-08-04: 部署脚本内置数据校验闸门（validate 不过则中止部署）。理由：内容站的回归风险在数据不在代码。Confidence: high.
