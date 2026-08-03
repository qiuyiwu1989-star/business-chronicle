# Decisions

- 2026-08-03: 项目正式目录定为 `/Users/qiuyiwu/strategy-site`，与 zip 同名。理由：与既有站点习惯一致（本地目录 → git → 部署时再定子域）。Basis: AI 推断，待用户确认。Confidence: medium.
- 2026-08-03: 档位定 G2。理由：内容型产品、会被真实使用、预期多轮打磨；尚无真实用户数据故不上 G3。Confidence: high.
- (代码反推) 2026-07 前后: 站点采用零依赖单数据源架构（data.v22.js 单文件承载全部内容），渲染与数据分离。Basis: 代码反推。Confidence: high.
- (代码反推) 五本书五条线的叠加叙事：理论/企业/模式/组织/著作。「著作线」由 THEORIES 等数据的 work 字段派生。Basis: 代码反推。
