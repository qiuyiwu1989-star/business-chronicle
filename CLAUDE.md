# 商业通鉴 · 五本书里的百年商业史

## 目标
把《经营战略全史》《商业模式全史》《他们创造了美国》《管理百年》《新经营学》五本书叠成一部可交互的百年商业史站点，帮读者「看规律、练判断」，而不是背知识点。

## 技术栈
- 纯静态：`index.html` + `style.v22.css` + `app.v22.js` + `data.v22.js`，零依赖、零构建。
- 本地预览：`node server.js`（端口 3000，含 /health）。
- 禁止引入框架 / 打包器 / npm 依赖，保持单文件数据源。

## 约定
- **所有内容数据只住在 `data.v22.js`**，渲染逻辑只住在 `app.v22.js`，两者不混。
- 数据结构：THEORIES(34) / COMPANIES(49) / MODELS(29) / ORGS(20) / ACTS(六幕叙事) / THEORY_DETAILS / THEORY_GUIDES / THEORY_LIMITS / GLOSSARY / ERAS / PEOPLE / QUIZ / SCENARIOS / GRAPH_* / ELEMENTS。
- 三条现场线（企业/模式/组织）每个节点都有 `deep` 五元组（决策现场层），详见 `specs/001-company-deep.md` 与 `CONTEXT.md`。
- 数据正文沿用现有半角逗号/分号风格（历史遗留，全量统一标点属单独任务，勿零散混改）；`rel` 字段用 THEORIES 的 `key` 精确串联跨线关系。
- 改版本号（v22 → v23）才动文件名，日常打磨不改名。
- **改完数据必须跑 `node tools/validate.js`**；部署脚本内置此校验，不过则中止。

## 红线
- **只搬运不发明**：内容为对公开知识的事实性整理，不得虚构史实、数据、引文；不确定的事实先查证再写入。完整六条内容红线见 `CONTEXT.md` 第 3 节。
- 不做用户系统 / 后端数据库（留言板等仅 localStorage）。
- 上线/部署动作必须用户说「上线 / 发布 / 同步」才执行（默认只改本地）。
- **不要碰 `history.qiuyiwu.com`**：那是《智能革命史》另一个项目的子域，本站在 `chronicle.qiuyiwu.com`。

## 当前档位
G2 产品档，已上线。升 G3 条件：接入统计看到真实访问后，补端到端冒烟测试脚本 + CI。

## 部署与并行
- 线上：https://chronicle.qiuyiwu.com （南京机 146.56.239.22，SSH 别名 `yongle-nanjing`）
- 部署：`./scripts/deploy.sh`（自动校验数据 → 重建 SEO 产物 → 上传 → 冒烟）
- GitHub：`qiuyiwu1989-star/business-chronicle`（public）
- DEPLOY-OWNER：主会话。其它并行会话只 commit+push，不部署。
- 跨平台加载上下文：`bash tools/pack-context.sh` → `context-pack.md` 单文件。
