# Tasks

## Now（本次会话正在做，最多 3 项）
- [ ] 等用户验收 2026-08-04 夜班成果（见会话末的验收清单）

## Next（已排序的待办）
- [ ] **方向 C：中国商业史线**（晋商票号→洋务运动→乡镇企业→双十一→大模型，与西方线对照）
- [ ] **方向 D：以史鉴今扩写为完整收尾章**（八条规律逐条推演到 2020s，配可下载的判断清单）
- [ ] 神脑素材二次收割：把更多 echo 换成邱懿武本人讲过的判断（目前仅以史鉴今用了 2 条）
- [ ] 理论线也补 deep 同级深度（目前理论线用的是 details/guides/limits 三层，与三条现场线结构不同，可考虑统一）
- [ ] 百度统计：申请 history/chronicle 独立站点 ID 后接入（index.html 已留注释占位）
- [ ] 提交 sitemap 到百度站长平台 + Google Search Console（需用户账号）
- [ ] 全站一致性回归（site-consistency-audit skill）

## Backlog（发现但不在本次范围）
- `.marquee` 跑马灯导致约 5px 横向溢出（既有组件，非本次引入；`body.scrollWidth` 1275 vs `clientWidth` 1270）
- THEORIES/MODELS/ORGS 三个数组各有一条未按年份排序（渲染时有 sort，不影响显示，但读源码易误解）
- PEOPLE 只有 14 人，CONTEXT 里曾写 24，已更正；人物志可扩充
- 移动端 `.act` 已适配，但 `.judge-grid`、`.insight-grid` 未在本次逐一验证

## Done（倒序，保留最近 20 条）
- 2026-08-04: 以史鉴今新增规律08 + 个人判断层（.insight-voice），神脑素材落地
- 2026-08-04: 方向 B 六幕商业史叙事层（ACTS 数据 + 首页区块 + 18 个可跳转转折点）
- 2026-08-04: 部署上线 chronicle.qiuyiwu.com（nginx + certbot + deploy.sh 含校验闸门）
- 2026-08-04: GitHub 公开仓库 qiuyiwu1989-star/business-chronicle
- 2026-08-04: SEO/GEO + PWA（llms-full.txt 186KB 全量导出、robots LLM 白名单、JSON-LD、OG 图、SW 离线）
- 2026-08-04: 模式线 29/29 + 组织线 20/20 补 deep；修正吉列/AWS/A&P 三处史实口径
- 2026-08-04: 企业线 49/49 补 deep；新增台积电1987、AI时代组织2025 两个缺口节点
- 2026-08-04: 口径统一（四条→五轨）+ 首页数字改为 data 实时生成
- 2026-08-04: CONTEXT.md 上下文体系 + tools/validate.js + tools/pack-context.sh + tools/build-seo.js
- 2026-08-04: sources/shennao-harvest.md 神脑素材辑录（23 场转写，已脱敏）
- 2026-08-03: spec 001 样例——10 节点 deep 数据 + 决策现场弹层渲染 + server.js 本地 no-store
- 2026-08-03: 用户拍板方向 A→B（「好的 一个一个来」），spec 001 落稿 approved
- 2026-08-03: 项目落位 /Users/qiuyiwu/strategy-site，git init，建 CLAUDE/TASKS/DECISIONS (7862c5a)

## Blocked
- （无）
