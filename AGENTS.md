# milkdown-kit

基于 Milkdown Crepe 的开箱即用 Markdown 编辑器: 中文界面, 紧凑主题与暗色模式, Vue 3 / React 19 组件; 公开发布到 npm(`@altmanlib/milkdown-kit` 及 `-vue` / `-react`). Bun workspaces monorepo

## 开工

- 动手前在仓库根 `git fetch`, 再 `git status -sb`; 落后则 `git pull --ff-only`; 分叉则停下告知用户, 不擅自 rebase 或强制推送(本仓 `agent/develop` 约定是把 `main` 合并进来, 不改写已推送历史)
- 先读 @ROADMAP.md; 选任务与断点按 ROADMAP 文首规则; 能直接解决的小问题顺手处理, 不登记成任务
- 发现债务当场还掉, 或登记进 `ROADMAP.md` 并写明触发条件; 需要拍板的进「待决策」

## 先读(按需)

| 文档 | 何时读 |
|---|---|
| [编辑器封装方案](docs/design/editor-architecture.md) | 动手前的全局背景; 改公开 API / 依赖 / 主题 token / 构建发布时同步更新 |
| [发版流程](docs/guide/release.md) | 发版 / changeset / npm 与 GitHub 发布配置 / 手动发布与撤回 |
| [公开 API](docs/reference/api.md) | 查导出, 组件 props, CSS token, DOM 约定 |
| [文档索引](docs/README.md) | 找不到该写哪类文档 |
| [候选目标](docs/design/editor-candidate-goals.md) | 评估尚未入路线图的能力是否接纳 |

## 设计文档

- 大功能先写专项设计, 再动手. 库项目判据(满足任一条): 改公开接口的约定; 改交互约定(键盘, 焦点, 输入法, 粘贴); 新增或替换依赖(含可选 peer); 改主题 token 或构建发布流程; 有被否决的备选需要留痕; 预计不止一个任务
- 专项设计放 `docs/design/YYYY-MM-DD-NN-slug.md`, `status: draft`; 只写方案与取舍, 不写实施细节; 经用户确认后才开工, ROADMAP 条目写「设计: 文件名」
- 实施中方案变了, 先改设计文档再改代码
- 实施完成后, 在同一提交里修订设计文档: 删去代码里看得出的实施细节, 只留核心决策/理由/否决项/触发条件/已知取舍, `status` 改 `published`
- 小改动不新建设计文档, 把结论并入 [editor-architecture.md](docs/design/editor-architecture.md) 的对应段落
- 总览文档只放跨功能的目标/选型/边界/明确不做与专项设计索引; 某功能区方案写进对应专项设计

## 技术栈

| 项 | 说明 |
|---|---|
| 运行时 | Bun workspaces, TypeScript `~6.0`(固定 6.x: TypeScript 7 不提供 vue-tsc 需要的 API) |
| 包 | `packages/core` → `@altmanlib/milkdown-kit`; `packages/vue` → `-vue`; `packages/react` → `-react`; 根目录 `private`, 不发布 |
| 上游 | `@milkdown/crepe` + `@milkdown/kit`, 同版本; 只 import `builder` 与 `feature/*`, 禁止运行时 import `@milkdown/crepe` 根入口 |
| 构建 | 各包 tsdown; 核心 CSS 用 lightningcss 内联; Vue SFC 经 unplugin-vue + vue-tsc |
| 版本 | changesets, 三包 `fixed` 同版本; 用户可见改动须加 `.changeset/*.md` |
| 检查 | `bun run check`(typecheck + test + check:docs); 发版前另跑 `build` / `check:package` / `check:size` |

版本与脚本以根目录 `package.json` 为准. 依赖分类(`dependencies` / peer)的判断规则见设计总览 §4.7, 清单以各包 `package.json` 为准, 不复述

## 目录与边界

| 路径 | 作用 |
|---|---|
| `packages/core/` | 框架无关的 `createEditor()` 与主题样式 |
| `packages/vue/` | Vue 3 `MdEditor`, 只依赖核心包公开入口 |
| `packages/react/` | React 19 `MdEditor`, 只依赖核心包公开入口 |
| `playground/` | Vite + Vue 演示, 不进发布产物 |
| `scripts/` | `check-docs.ts` / `check-size.ts` 等仓库级脚本 |
| `docs/` | 设计 / 指南 / 参考 / 记录; 索引见 `docs/README.md` |

依赖方向: 框架包 → 核心包 → `@milkdown/crepe`. 框架包之间互不依赖; 框架包不用相对路径引用 `packages/core` 内部文件. workspace 内部依赖不用 `workspace:` 协议(`npm publish` 不会改写; `bun add` 写成 `workspace:*` 时按 release.md §3.2 改回)

## Git 工作流

- 开发分支 `agent/develop`; agent 改动只在该分支, 可自行 commit / push
- 远程 `git@github.com:altmanlib/milkdown-kit.git`(公开, 默认分支 `main`)
- 开始新功能前把 `main` 合并进 `agent/develop`, 不 rebase、不强制推送已推送历史
- 合并到 `main`、推送 `main`、打 tag、创建 GitHub Release、合并「Version Packages」PR: 须用户明确确认
- 功能完成后先跑 `bun run check`、`bun run build`、`bun run check:package`、`bun run check:size`, 全部通过并经确认后用 `git merge --squash` 合并到 `main` 并推送
- 不在本地执行 `npm publish`; 发布由 CI 完成, 例外按 [release.md](docs/guide/release.md) §5

## 约定

- 本仓是公开仓库: 文档, 代码, 示例与提交信息里不出现用户的业务项目信息(项目名, 业务词汇, 域名); 示例用通用内容
- 版本遵循 SemVer; `0.x` 允许不兼容变更(changesets 在 changelog 写明); 1.0 表示对外 API 与 CSS token 稳定
- 对外可见改动在提交时写入 changeset; 版本历史归各包 `CHANGELOG.md`, 不在 ROADMAP 累积功能清单
- 提交前通过 `bun run check`; 提交信息单行小写 `type: summary`; 对应 ROADMAP 任务时末尾附编号
- 代码注释用英文; 文档用简体中文; 注释不引用 ROADMAP / § / R 编号等本地文档
- `docs/` 文档带 front matter 四项(`title`/`type`/`status`/`updated`), `title` 与 `# 标题` 一致, 由 `bun run check:docs` 校验; 本文件与 `README.md` / `ROADMAP.md` / 各包 `CHANGELOG.md` 不在其范围内
- `playwright-cli` 会在当前目录生成 `.playwright-cli/`, 已 gitignore; 提交前确认不在 `git status` 里. `attach --cdp=chrome` 的会话名是 `chrome`, 后续命令加 `-s=chrome`
- npm 的 2FA 使用安全密钥, 需账号持有人在浏览器现场确认, 无法代为完成
