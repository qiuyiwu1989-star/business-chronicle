# Decisions

- 2026-08-03: 项目正式目录定为 `/Users/qiuyiwu/strategy-site`，与 zip 同名。理由：与既有站点习惯一致（本地目录 → git → 部署时再定子域）。Basis: AI 推断，待用户确认。Confidence: medium.
- 2026-08-03: 档位定 G2。理由：内容型产品、会被真实使用、预期多轮打磨；尚无真实用户数据故不上 G3。Confidence: high.
- (代码反推) 2026-07 前后: 站点采用零依赖单数据源架构（data.v22.js 单文件承载全部内容），渲染与数据分离。Basis: 代码反推。Confidence: high.
- (代码反推) 五本书五条线的叠加叙事：理论/企业/模式/组织/著作。「著作线」由 THEORIES 等数据的 work 字段派生。Basis: 代码反推。
- 2026-08-03: 企业线深度层字段定为 deep{scene,choice,rival,fate,echo} 五元组，渲染复用 guide-card 零新增 CSS；有 deep 时替换通用「边界与代价」模板段。理由：真实史实优于模板话术。Confidence: high.
- 2026-08-03: server.js 本地默认 no-store，部署环境 CACHE=1 恢复强缓存。理由：immutable 缓存让本地迭代看不到改动。Confidence: high.
