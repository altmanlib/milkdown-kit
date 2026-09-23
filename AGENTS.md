# AGENTS.md

- 项目文档位于 `docs/`，编写和修改文档时遵守 [docs/README.md](docs/README.md) §3 的格式规范采纳声明
- 方案依据见 [docs/design/editor-architecture.md](docs/design/editor-architecture.md)；改动公开 API、依赖、主题 token 或构建发布流程时同步更新该文档
- 发版、changeset、npm / GitHub 发布配置相关的操作，先读 [docs/guide/release.md](docs/guide/release.md)

## 硬性约束

- 不得以运行时方式 import `@milkdown/crepe` 根入口，只能 import `@milkdown/crepe/builder` 和 `@milkdown/crepe/feature/*`，否则会把 KaTeX 等未启用的功能打进使用方的包
- TypeScript 固定在 6.x：TypeScript 7 不提供 vue-tsc 需要的 API
- 用户可见的行为改动需要添加 changeset（`.changeset/*.md`）
- 不在本地执行 `npm publish`；发布由 CI 完成，例外情况按 release.md §4 处理
- `git push`、打 tag、创建 GitHub Release 只在仓库所有者明确同意后执行

## 浏览器自动化

- `playwright-cli` 会在当前目录生成 `.playwright-cli/`（含页面快照），该目录已被 `.gitignore` 忽略；提交前确认 `git status` 中没有它
- `playwright-cli attach --cdp=chrome` 建立的会话名是 `chrome`：后续命令加 `-s=chrome`，并在同一目录下执行
- npm 的 2FA 使用安全密钥，需要账号持有人在浏览器中现场确认，无法代为完成

## 常用命令

| 命令 | 作用 |
|---|---|
| `bun run dev` | 启动 playground（`playground/`） |
| `bun run check` | 类型检查、测试、文档检查 |
| `bun run build` | 构建 JS（tsdown）和 CSS（`scripts/build-css.ts`） |
| `bun run check:package` | 构建后运行 publint 和 attw |
