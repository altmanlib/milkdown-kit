# 文档索引

本目录存放 milkdown-kit 的项目文档。本文件是文档索引，同时也是本项目对文档格式规范的采纳声明

## 1. 文档列表

| 文档 | type | status | 说明 |
|---|---|---|---|
| [editor-architecture.md](design/editor-architecture.md) | design | published | 编辑器封装方案：选型、包名、分层、对外 API、Vue / React 组件、依赖、主题 token、构建与发布 |
| [ROADMAP.md](ROADMAP.md) | design | draft | 路线图：计划编号规则、近期与 1.0 之前的计划、按需触发的计划 |
| [release.md](guide/release.md) | guide | published | 发版流程：发布配置现状、changeset、检查、已知现象、手动发布与撤回 |
| [api.md](reference/api.md) | reference | published | 对外 API：JS 导出、Vue 组件、样式入口、CSS token、DOM 约定 |
| [2026-09-23-01-markdown-normalization.md](record/2026-09-23-01-markdown-normalization.md) | record | published | Markdown 往返时的格式规范化及其影响 |

## 2. 目录约定

| 目录 | 存放内容 | 对应 `type` |
|---|---|---|
| `design/` | 方案与取舍 | `design` |
| `guide/` | 开发、发布、接入的操作流程 | `guide` |
| `reference/` | 对外 API、配置项、CSS 变量等可查阅事实 | `reference` |
| `record/` | 决策、已知限制、复盘 | `record` |

目录在出现第一篇对应文档时创建，不预建空目录

`docs/` 根目录只放跨类型的索引文档：`README.md`（本文件）和 `ROADMAP.md`（路线图，`type: design`）

## 3. 格式规范采纳声明

### 3.1 适用范围

`docs/` 下全部子目录中的 Markdown 文档。以下文件不在范围内，不需要 front matter：

- `docs/README.md`（本文件）
- 仓库根目录的 `README.md`（npm 包主页，面向使用者）
- `AGENTS.md`

### 3.2 强制条款

1. 每篇文档以 YAML front matter 开头，包含四个必填字段：
   - `title`：文档标题
   - `type`：取值为 `guide` / `runbook` / `reference` / `design` / `record`
   - `status`：取值为 `draft` / `published` / `deprecated`
   - `updated`：最后一次实质性修改的日期，格式 `YYYY-MM-DD`
2. front matter 中的 `title` 必须和正文 `# 标题` 一致
3. 所有相对链接都能解析到实际存在的文件
4. `status: deprecated` 的文档，正文开头必须给出替代文档的链接

### 3.3 默认约定（软条款）

- 文件名使用小写英文和连字符（根目录的 `README.md`、`ROADMAP.md` 除外）；需要按时间排序时，命名为 `YYYY-MM-DD-NN-slug.md`
- 章节使用 `## 1.` 编号；`record` 类型不编号
- 代码块必须标注语言
- 枚举和对比用表格，表格不超过 6 列
- 取舍写成「结论 + 理由 + 触发条件」
- 数字要标明是否实测：实测的给出样本量，未实测的写「推断」
- 过时内容直接删除
- 不留「待续」「TODO」段落，未完成的文档标为 `status: draft`
- 代码注释使用英文，文档正文使用简体中文

### 3.4 本地差异

无

### 3.5 校验

`bun run check:docs`（`scripts/check-docs.ts`）校验 §3.2 的全部 4 条，CI 中通过 `bun run check` 执行。本规范从第一篇文档起生效，没有需要补齐的历史文档
