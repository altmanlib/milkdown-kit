---
title: 编辑器封装方案
type: design
status: published
updated: 2026-09-23
---

# 编辑器封装方案

## 1. 目标与范围

在 Milkdown 基础上封装一个预配置好的 Markdown 编辑器，公开发布到 npm。其他项目安装后，只需少量配置就能使用

| 项 | 结论 |
|---|---|
| 包名 | `@altmanlib/md-editor` |
| 交付物 | 一个 npm 包，包含：不依赖框架的核心接口、Vue 组件、样式文件 |
| 首个支持的框架 | Vue 3 |
| 使用方 | 自有的其他前端项目 |
| 「开箱即用」的含义 | 功能组合、中文文案、主题都已预设好，使用方只需提供挂载点和业务回调（例如图片上传） |

## 2. 现状与约束

### 2.1 上游现状

以下信息于 2026-09-23 通过 `npm view` 和 `npm pack @milkdown/crepe@7.22.1` 核对

| 项 | 事实 |
|---|---|
| 最新版本 | `@milkdown/kit`、`@milkdown/crepe`、`@milkdown/vue` 都是 `7.22.1`，版本号同步发布 |
| 许可证 | MIT |
| Crepe 功能列表 | `CrepeFeature` 枚举：`code-mirror`、`list-item`、`link-tooltip`、`cursor`、`image-block`、`block-edit`、`toolbar`、`placeholder`、`table`、`latex`、`top-bar`、`ai` |
| 按需组合 | `@milkdown/crepe/builder` 导出 `CrepeBuilder`，用 `addFeature()` 逐个加入功能；每个功能从 `@milkdown/crepe/feature/*` 单独导出 |
| 图片上传 | `image-block` 的配置提供 `onUpload`、`inlineOnUpload`、`blockOnUpload` 三个回调，类型都是 `(file: File) => Promise<string>` |
| 界面文案 | 文案分散在各功能配置的字符串字段里（例如 `blockUploadPlaceholderText`），没有统一的 locale 参数 |
| 内置主题 | `crepe`、`crepe-dark`、`frame`、`frame-dark`、`nord`、`nord-dark` |
| 依赖 | `@milkdown/crepe` 本身解压后 3,474,248 字节（实测，不含依赖）。运行时依赖包括 `codemirror` 系列、`katex`、`vue ^3.5.20`、`dompurify`、`lodash-es` |

### 2.2 约束

- 所有 `@milkdown/*` 包必须使用同一个版本。依赖树里出现两份 ProseMirror 实例时，编辑器状态会出现类型不一致的错误
- 编辑器依赖 DOM，只能在浏览器中运行
- 上游 API 仍在 7.x 中持续迭代。直接透传上游配置，会把上游的破坏性变更传给使用方
- npm 包名的 scope 必须和发布账号的用户名或所属 org 同名

## 3. 原则

1. **对外 API 最小化**：只暴露已知需要的参数，不透传 Milkdown 或 Crepe 的原始配置
2. **核心不依赖框架**：编辑器逻辑全部放在 Vanilla 核心里，框架组件只负责生命周期和数据同步
3. **业务能力由使用方注入**：上传、鉴权、存储等由使用方通过回调提供，包内不写死
4. **基于上游组合，不重复实现**：优先复用 Crepe 已有的功能和主题，上游确实满足不了时才自己实现

## 4. 方案

### 4.1 选型

**结论**：基于 `@milkdown/crepe` 封装，用 `CrepeBuilder` 按需组合功能

**理由**：

- Crepe 已经提供斜杠菜单、工具栏、代码块、表格、图片块等完整交互，和「开箱即用」的目标一致
- 如果用 `@milkdown/kit` 从零实现这些 UI，首次开发和长期跟进上游的成本都明显更高
- `CrepeBuilder` 只打包显式加入的功能，因此不启用的功能（如 `latex`）不会进入使用方的构建产物

**改用 `@milkdown/kit` 的触发条件**：交互形态和 Crepe 差别很大，需要改写的 Crepe 功能超过一半

### 4.2 包名

**结论**：`@altmanlib/md-editor`

**理由**：

- scope 和 GitHub 账号 `altmanlib` 一致，所有自有包可以放在同一个 scope 下
- 名字里不带 `milkdown`，避免和官方的 `@milkdown/kit` 混淆；将来底层换引擎，也不需要改包名

**改名的触发条件**：npm 上的 `altmanlib` 用户名或 org 不属于本人，这时改用实际拥有的 scope

### 4.3 分层

```text
src/
  core/        Vanilla core: createEditor() and EditorHandle
  locale/      UI text presets, mapped onto Crepe feature configs
  theme/       CSS variables and theme overrides based on Crepe themes
  vue/         Vue component, depends on core only
```

依赖方向只能是 `vue` → `core` → `@milkdown/crepe`。`locale` 和 `theme` 只被 `core` 引用

Vue 组件不使用 `@milkdown/vue`：核心已经负责编辑器的创建和销毁，组件直接调用 `createEditor()`，不需要再加一层上游的封装

### 4.4 核心 API

```ts
interface MdEditorOptions {
  defaultValue?: string
  readonly?: boolean
  placeholder?: string
  onChange?: (markdown: string) => void          // Debounced internally
  uploadImage?: (file: File) => Promise<string>  // Returns the image URL
  features?: Partial<Record<FeatureName, boolean>>
  locale?: 'zh-CN' | 'en'
}

interface EditorHandle {
  getMarkdown(): string
  setMarkdown(markdown: string): void
  setReadonly(readonly: boolean): void
  focus(): void
  destroy(): Promise<void>
}

declare function createEditor(
  root: HTMLElement,
  options?: MdEditorOptions,
): Promise<EditorHandle>
```

| 参数 | 对应的上游实现 |
|---|---|
| `uploadImage` | `image-block` 的三个上传回调都指向它 |
| `features` | 决定是否调用 `CrepeBuilder.addFeature()`。`FeatureName` 由本包自己定义，不直接复用 `CrepeFeature` |
| `locale` | 展开成各功能的文案字段；默认 `zh-CN` |
| `onChange` | 基于 `CrepeBuilder.on()` 注册的 listener |

`FeatureName` 包含的功能和默认值：

| 功能 | 默认 |
|---|---|
| `code-mirror`、`list-item`、`link-tooltip`、`cursor`、`image-block`、`block-edit`、`toolbar`、`placeholder`、`table` | 开启 |

`latex`、`top-bar`、`ai` 不在 `FeatureName` 中，本包不提供

`image-block` 开启但没有传 `uploadImage` 时，只能通过 URL 插入图片，不能上传

### 4.5 Vue 组件

```vue
<MdEditor
  v-model="content"
  :readonly="false"
  :upload-image="upload"
  @ready="onReady"
/>
```

| 项 | 结论 |
|---|---|
| `v-model` | 绑定 Markdown 字符串（`modelValue` / `update:modelValue`） |
| 其他 props | 和 `MdEditorOptions` 一一对应，camelCase 命名；`onChange` 由 `v-model` 替代 |
| 外部改值 | 只有当新值和组件上次向外发出的值不同时，才调用 `setMarkdown()`，避免循环更新和光标跳动 |
| `readonly` | 响应式，变化时调用 `setReadonly()` |
| 其他 props 变化 | 不响应。`features`、`locale` 这类只在创建时生效的参数需要变化时，由使用方通过 `:key` 重建组件 |
| 实例访问 | 通过 `defineExpose` 暴露 `EditorHandle`，同时通过 `ready` 事件传出 |
| 生命周期 | `onMounted` 时创建，`onBeforeUnmount` 时调用 `destroy()` |

### 4.6 包结构与导出

```json
{
  "name": "@altmanlib/md-editor",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": "./dist/index.js",
    "./vue": "./dist/vue.js",
    "./style.css": "./dist/style.css"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

- 只输出 ESM，附带 `.d.ts`
- 使用方要自己引入 `style.css`，JS 入口不自动注入样式
- scope 包默认是私有的，公开发布必须设置 `publishConfig.access: public`

### 4.7 依赖策略

| 依赖 | 声明位置 | 版本范围 | 理由 |
|---|---|---|---|
| `@milkdown/crepe` | `dependencies` | `~7.22.1` | 属于内部实现，锁到 patch 级别，保证整棵依赖树里 Milkdown 版本一致 |
| `@milkdown/kit` | `dependencies` | `~7.22.1` | 实现 `setMarkdown` 需要 `@milkdown/kit/utils`，版本和 crepe 保持一致 |
| `vue` | `peerDependencies`，标为 optional | `^3.5.0` | 使用宿主项目的 Vue 实例。下限和 Crepe 依赖的 `vue ^3.5.20` 保持同一个 minor，避免宿主安装出两份 Vue |

Milkdown 的升级由本包统一跟进，使用方不需要直接安装 `@milkdown/*`

`vue` 标为 optional peer，是因为只使用核心入口的项目不需要 Vue

### 4.8 样式与主题

- 以 Crepe 的 `crepe` / `crepe-dark` 主题为基础，通过 `--md-editor-*` 这类 CSS 变量覆盖
- 挂载容器上设置 `data-theme="dark"` 时切换为暗色，不依赖 `prefers-color-scheme`，由使用方决定

### 4.9 构建与发布

| 项 | 结论 |
|---|---|
| 包管理 | bun |
| 构建 | tsdown（Vue SFC 通过 `unplugin-vue` 编译） |
| 开发预览 | 仓库内的 `playground/`（Vite + Vue） |
| 版本与 changelog | changesets |
| 发布 | GitHub Actions 通过 npm Trusted Publishing 发布，并生成 provenance |
| 仓库形态 | 单个包，不使用 monorepo |

**改用 monorepo 的触发条件**：增加第二个框架组件后，不同框架组件需要各自的版本节奏，或者 optional peer 让使用方安装时出现问题

## 5. 影响面

- 使用方只依赖本包的公开 API（§4.4、§4.5）和 CSS 变量，Milkdown 升级对使用方透明
- 本包的 major 版本只在公开 API 或 CSS 变量不兼容时升级，与 Milkdown 的版本号无关
- `0.x` 阶段 API 允许不兼容变更，由 changesets 在 changelog 中写明

## 6. 测试或验证策略

| 层 | 工具 | 覆盖内容 |
|---|---|---|
| 单元 | vitest + happy-dom | Markdown 往返一致性（输入 → 编辑器 → `getMarkdown()`），覆盖标题、有序/无序列表、任务列表、表格、代码块、图片、链接、引用 |
| 组件 | vitest + `@vue/test-utils` | `v-model` 双向同步、外部改值时不产生循环、卸载时销毁 |
| E2E | playwright | 在 playground 中完成输入、斜杠菜单、图片上传回调、只读切换 |
| 包产物 | `publint`、`@arethetypeswrong/cli` | 检查 `exports` 和类型声明是否正确 |

发布前，用 `bun pm pack` 打出的包安装到一个空的 Vite + Vue 项目中，验证能正常使用

打包体积不设上限，但 CI 会输出每次构建的 gzip 体积，作为以后设定上限的基线

## 7. 迁移与兼容

首个版本，没有迁移成本。浏览器支持范围以 Milkdown / ProseMirror 为准，不额外做降级

## 8. 明确不做

- 不透传 Crepe / Milkdown 的原始配置和实例
- 不内置任何上传、存储、鉴权实现
- 不提供 `latex`、`top-bar`、`ai` 功能
- 不支持 SSR 渲染编辑器；只保证在 SSR 环境中 import 时不报错
- 不做协同编辑（Yjs）
- 不输出 CJS
- 首个版本不提供 React 组件

## 9. 开放项

| 项 | 触发条件 | 处理方式 |
|---|---|---|
| 公式支持 | 有使用方需要公式 | 在 `FeatureName` 中增加 `latex`，通过动态 import 加载，不启用时不打包 KaTeX |
| React 组件 | 有 React 项目需要接入 | 新增 `./react` 导出，并按 §4.9 的触发条件评估是否改用 monorepo |
| 体积上限 | 使用方反馈加载性能问题 | 以 §6 的基线数据设定 gzip 上限，并在 CI 中卡住 |

## 10. 落地顺序

1. 脚手架：`package.json`、TypeScript、tsdown、playground、`scripts/check-docs.ts`
2. `core`：实现 `createEditor()` 和默认功能组合，能在 playground 中编辑
3. 往返测试：vitest 覆盖 §6 列出的语法
4. `locale` 和 `theme`：中文文案、CSS 变量、暗色模式
5. Vue 组件：按 §4.5 实现，并补上组件测试
6. 发布链路：
   1. 确认 npm 上的 `altmanlib` scope 归本人所有
   2. 配置 Trusted Publishing
   3. 接入 changesets、publint、attw
   4. 发布 `0.1.0`
