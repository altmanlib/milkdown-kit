---
title: 发版流程
type: guide
status: published
updated: 2026-09-23
---

# 发版流程

本包通过 changesets 管理版本，由 GitHub Actions 通过 npm Trusted Publishing 发布。**正常发版不需要在本地登录 npm，也不需要在本地执行 `npm publish`**

方案层面的取舍见 [editor-architecture.md](../design/editor-architecture.md) §4.9

## 1. 账号与配置现状

发版依赖以下配置，发版失败时先逐项核对

| 项 | 现状 |
|---|---|
| npm 包 | `@altmanlib/milkdown-kit`，public |
| npm 账号 | 用户 `altmanlib`（`@altmanlib` 是它的个人 scope），已开 2FA（安全密钥），已关联 GitHub `@altmanlib`，邮箱已验证 |
| GitHub 仓库 | `altmanlib/milkdown-kit`，public，默认分支 `main` |
| Trusted Publisher | 仓库 `altmanlib/milkdown-kit`，workflow `release.yml`，无 environment，权限 `npm publish` + `npm stage publish` |
| npm Publishing access | Require two-factor authentication and disallow bypass 2fa tokens：任何 token 都不能绕过 2FA 发布，CI 只能通过 Trusted Publisher 发布 |
| GitHub Actions 设置 | 已开启「Allow GitHub Actions to create and approve pull requests」，否则 Release workflow 无法创建「Version Packages」PR |
| `package.json` | `repository.url` 为 `git+https://github.com/altmanlib/milkdown-kit.git`，provenance 要求它和发布所在仓库完全一致 |

npm 用户名不可修改。需要其他 scope 时，创建同名的 npm 组织

## 2. 常规发版

### 2.1 开发阶段：每个用户可见的改动附带一个 changeset

```bash
bunx changeset
```

按提示选择版本类型，写一句面向使用方的变更说明，生成的 `.changeset/*.md` 和代码一起提交

| 改动 | 版本类型（`0.x` 阶段） |
|---|---|
| 修复缺陷、样式微调 | `patch` |
| 新增选项或功能、不兼容的 API / CSS token 变更 | `minor` |

内部重构、测试、文档、playground 改动不需要 changeset

`bunx changeset` 是交互式命令，在没有 TTY 的环境中（例如 AI 助手执行命令）会挂起。这种情况下直接新建 `.changeset/<任意名称>.md`：

```markdown
---
'@altmanlib/milkdown-kit': patch
---

Fix ...
```

写完用 `bunx changeset status` 确认能被识别

### 2.2 发版前的本地检查

```bash
bun run check          # typecheck + tests + docs check
bun run build
bun run check:package  # publint + attw
```

改动涉及依赖、导出、构建配置或 CSS 时，再做一次使用方冒烟测试（设计文档 §6）：

1. `bun pm pack --destination /tmp`
2. 在一个空的 Vite + Vue 项目中安装该 tgz，`tsconfig` 设 `skipLibCheck: false`
3. 执行 `vue-tsc --noEmit` 和 `vite build`，并确认产物中没有 `katex`

### 2.3 推送与合并

1. 推送到 `main`。CI（`ci.yml`）和 Release（`release.yml`）同时运行
2. Release 发现有 changeset，会创建或更新「Version Packages」PR，内容是版本号和 `CHANGELOG.md` 的改动
3. 检查 PR 中的版本号和 CHANGELOG，合并
4. 合并后 Release 再次运行：没有剩余 changeset，执行 `bun run release`（`bun run build && changeset publish`），通过 Trusted Publisher 发布，自动生成 provenance，并创建 git tag 和 GitHub Release

### 2.4 发版后核对

```bash
gh run list -R altmanlib/milkdown-kit --limit 4
npm view @altmanlib/milkdown-kit version
```

- npm 包页面显示新版本，版本旁边有 provenance 标识
- GitHub 上有 `v<version>` 的 tag 和 Release（单包仓库，changesets 使用这个格式）

新发布的版本在 registry 上可能有几十秒的延迟，期间 `npm view` 返回 404 属于正常现象

## 3. 依赖升级

### 3.1 自动与手动的分工

| 范围 | 方式 |
|---|---|
| GitHub Actions 版本 | Dependabot（`.github/dependabot.yml`）每月提一个分组 PR，不需要 changeset |
| npm 依赖 | 每月手动检查一次（§3.2）。Dependabot 的 bun 更新器只能读取 `bun.lock` 的 `lockfileVersion` 1，而 bun ≥ 1.4 写入的是 2，所以没有交给 Dependabot |

**改回由 Dependabot 管理 npm 依赖的触发条件**：Dependabot 的 bun 更新器支持 `lockfileVersion` 2。届时在 `dependabot.yml` 中加入 `package-ecosystem: bun`，把 `@milkdown/*` 分为一组，并忽略 `typescript` 的 major 升级

### 3.2 手动检查

```bash
bun outdated
```

| 依赖 | 升级方式 | changeset |
|---|---|---|
| `@milkdown/crepe`、`@milkdown/kit` | `bun add @milkdown/crepe@~<版本> @milkdown/kit@~<版本>`，两者必须同一版本 | 需要，`patch`，说明升级到的 Milkdown 版本。本包锁定 `~` 范围，使用方只能通过本包发版拿到新版 Milkdown |
| `@codemirror/*`、`@lezer/highlight`、`@floating-ui/dom` | `bun update <包名>`，保持 `^` 范围不变 | 只更新 `bun.lock` 时不需要；改动了范围时需要 |
| 开发依赖 | `bun update <包名>` | 不需要 |
| `typescript` | 保持 6.x，不升级到 7（设计文档 §2.3） | 不需要 |

### 3.3 升级 Milkdown 后的检查

1. `bun run check` 通过。往返测试覆盖了图片规避逻辑，失败说明上游的 schema 或解析行为有变化
2. `bun run dev`，在 playground 中检查：斜杠菜单（滚动、键盘导航）、选中文字工具栏、代码语言选择与高亮、暗色、窄屏、关闭图片上传
3. 做一次使用方冒烟测试（§2.2）
4. 检查图片规避是否还有必要：临时去掉 `create-editor.ts` 中的 `applyImageMarkdownFixes(...)` 调用并运行 `bun run test`。图片相关用例全部通过时，删除 `src/core/image-markdown.ts`，并更新设计文档 §2.2 和 §4.4
5. 同步更新设计文档 §2.1 中的上游版本信息

## 4. 已知现象

| 现象 | 原因 | 处理 |
|---|---|---|
| 推送后 Release 显示 `No unpublished projects to publish` | 没有 changeset，当前版本已在 npm 上 | 正常，无需处理 |
| Release 报 `GitHub Actions is not permitted to create or approve pull requests` | 仓库的 Actions 权限设置被关闭 | 仓库 Settings → Actions → General 打开「Allow GitHub Actions to create and approve pull requests」，或执行 `gh api -X PUT repos/altmanlib/milkdown-kit/actions/permissions/workflow -F can_approve_pull_request_reviews=true -f default_workflow_permissions=read` |
| 发布时报 `ENEEDAUTH` 或 404 | Trusted Publisher 配置和实际不一致 | 在 npm 包页 Settings → Trusted Publisher 核对仓库名和 workflow 文件名（区分大小写，含 `.yml`）；修改 `release.yml` 的文件名后必须同步修改这里 |
| 发布只进入 staged，没有正式发布 | Trusted Publisher 缺少 `npm publish` 权限 | 编辑连接，勾选「Allow npm publish」。新建连接时这一项默认**不勾选** |
| provenance 生成失败 | `package.json` 的 `repository` 和仓库不一致，或仓库改为私有 | 修正 `repository` 字段；私有仓库不生成 provenance |
| `0.1.0` 在 npm 上没有 provenance 标识 | 该版本由本地手动发布 | 无需处理；经 CI 发布的版本都有 |

## 5. 手动发布（仅在 CI 无法使用时）

Publishing access 禁止 token 绕过 2FA，手动发布必须由账号持有人用安全密钥现场确认，无法无人值守完成

1. `npm login --auth-type=web`，在浏览器中完成安全密钥验证，`npm whoami` 应输出 `altmanlib`
2. 确认版本号已由 `changeset version` 更新并提交
3. `bun run build`
4. `npm publish --auth-type=web`，打开输出的链接完成安全密钥验证

在没有 TTY 的环境中（例如 AI 助手执行命令），`npm publish` 不会等待验证：它直接以 `EOTP` 退出，并把验证链接打码。需要用伪终端运行，让它输出完整链接并等待：

```bash
script -q /tmp/npm-publish.log npm publish --auth-type=web
```

从 `/tmp/npm-publish.log` 中取出 `https://www.npmjs.com/auth/cli/...` 链接，在浏览器中完成验证；输出 `+ @altmanlib/milkdown-kit@<version>` 即为成功

手动发布的版本没有 provenance，也不会自动创建 git tag 和 GitHub Release；需要时用 `gh release create v<version> --target <发版提交>` 补建

## 6. 撤回有问题的版本

- 优先发布修复版本（`patch`）
- 需要提示使用方避开某个版本时，使用 `npm deprecate @altmanlib/milkdown-kit@<version> "<原因>"`（同样需要 2FA 验证）
- 不使用 `npm unpublish`：已发布的版本号不能再次使用，而且可能影响已安装的使用方
