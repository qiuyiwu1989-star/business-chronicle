# 商业通鉴 · 五本书里的百年商业史

## 目标
把《经营战略全史》《商业模式全史》《他们创造了美国》《管理百年》《新经营学》五本书叠成一部可交互的百年商业史站点，帮读者「看规律、练判断」，而不是背知识点。

## 技术栈
- 纯静态：`index.html` + `style.v22.css` + `app.v22.js` + `data.v22.js`，零依赖、零构建。
- 本地预览：`node server.js`（端口 3000，含 /health）。
- 禁止引入框架 / 打包器 / npm 依赖，保持单文件数据源。

## 约定
- **所有内容数据只住在 `data.v22.js`**，渲染逻辑只住在 `app.v22.js`，两者不混。
- 数据结构：THEORIES(34) / COMPANIES(48) / MODELS(29) / ORGS(19) / THEORY_DETAILS / THEORY_GUIDES / THEORY_LIMITS / GLOSSARY / ERAS / PEOPLE / QUIZ / SCENARIOS / GRAPH_* / ELEMENTS。
- 数据正文沿用现有半角逗号/分号风格（历史遗留，全量统一标点属单独任务，勿零散混改）；`rel` 字段用 THEORIES 的 `key` 精确串联跨线关系。
- 改版本号（v22 → v23）才动文件名，日常打磨不改名。

## 红线
- **只搬运不发明**：内容为对公开知识的事实性整理，不得虚构史实、数据、引文；不确定的事实先查证再写入。
- 不做用户系统 / 后端数据库（留言板等仅 localStorage）。
- 上线/部署动作必须用户说「上线 / 发布 / 同步」才执行（默认只改本地）。

## 当前档位
G2 产品档。升 G3 条件：正式部署到 qiuyiwu.com 子域并有真实访问后，补数据校验脚本 + 部署冒烟。

## 部署与并行
尚未部署。DEPLOY-OWNER：待定（部署时按 qiuyiwu-deploy skill 走子域流程）。
