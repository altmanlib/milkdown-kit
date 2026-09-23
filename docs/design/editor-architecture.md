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
| 包名 | `@altmanlib/milkdown-kit` |
| 交付物 | 一个 npm 包，包含：不依赖框架的核心接口、Vue 组件、样式文件 |
| 支持的框架 | Vue 3 |
| 使用方 | 自有的其他前端项目 |
| 「开箱即用」的含义 | 功能组合、中文文案、紧凑主题都已预设好，使用方只需提供挂载点和业务回调（例如图片上传） |

## 2. 现状与约束

### 2.1 上游现状

以下信息于 2026-09-23 通过 `npm view`、`npm pack @milkdown/crepe@7.22.1` 和源码阅读核对

| 项 | 事实 |
|---|---|
| 最新版本 | `@milkdown/kit`、`@milkdown/crepe`、`@milkdown/vue` 都是 `7.22.1`，版本号同步发布 |
| 许可证 | MIT |
| Crepe 功能列表 | `CrepeFeature` 枚举：`code-mirror`、`list-item`、`link-tooltip`、`cursor`、`image-block`、`block-edit`、`toolbar`、`placeholder`、`table`、`latex`、`top-bar`、`ai` |
| 按需组合 | `@milkdown/crepe/builder` 导出 `CrepeBuilder`，用 `addFeature()` 逐个加入功能；每个功能从 `@milkdown/crepe/feature/*` 单独导出 |
| 按需组合时缺失的默认值 | 代码块的语言列表（`@codemirror/language-data`）和语法高亮主题只在完整的 `Crepe` 类里配置；只用 `CrepeBuilder` 时，语言列表为空，代码也没有高亮 |
| 图片上传 | `image-block` 的配置提供 `onUpload`、`inlineOnUpload`、`blockOnUpload` 三个回调，类型都是 `(file: File) => Promise<string>`；默认实现生成 `blob:` URL |
| 界面文案 | 文案分散在各功能配置的字符串字段里，没有统一的 locale 参数 |
| 斜杠菜单定位 | floating-ui 只带 `flip` 和 `offset` 两个 middleware，不会在视口内横向平移，也不限制高度 |
| 依赖 | `@milkdown/crepe` 本身解压后 3,474,248 字节（实测，不含依赖）。运行时依赖包括 `codemirror` 系列、`katex`、`vue ^3.5.20`、`dompurify`、`lodash-es` |

### 2.2 上游缺陷

以下两个缺陷都在 7.22.1 中用测试复现过，本包已经规避（§4.4）：

| 缺陷 | 影响 |
|---|---|
| remark 解析没有 title 的图片时给出 `title: null`，而 `image` 和 `image-block` 的 schema 要求字符串 | `![alt](url)` 形式的图片在加载时被静默丢弃；如果文档里只有这张图片，整个文档变成空的 |
| Crepe 的 `image-block` 把缩放比例写进 alt 字段 | 原有的 alt 文本被覆盖，`![alt](url)` 保存后变成 `![1.00](url)` |

### 2.3 约束

- 所有 `@milkdown/*` 包必须使用同一个版本。依赖树里出现两份 ProseMirror 实例时，编辑器状态会出现类型不一致的错误
- 编辑器依赖 DOM，只能在浏览器中运行
- 上游 API 仍在 7.x 中持续迭代。直接透传上游配置，会把上游的破坏性变更传给使用方
- npm 包名的 scope 必须和发布账号的用户名或所属 org 同名
- TypeScript 7 不提供 vue-tsc 依赖的编译器 JS API，无法生成 `.vue` 组件的类型声明

## 3. 原则

1. **对外 API 最小化**：只暴露已知需要的参数，不透传 Milkdown 或 Crepe 的原始配置
2. **核心不依赖框架**：编辑器逻辑全部放在 Vanilla 核心里，框架组件只负责生命周期和数据同步
3. **业务能力由使用方注入**：上传、鉴权、存储等由使用方通过回调提供，包内不写死
4. **基于上游组合，不重复实现**：优先复用 Crepe 已有的功能和主题，上游确实满足不了时才自己实现
5. **不丢用户数据**：Markdown 往返中出现内容丢失的上游行为，在本包内规避，并用测试固定

## 4. 方案

### 4.1 选型

**结论**：基于 `@milkdown/crepe` 封装，用 `CrepeBuilder` 按需组合功能

**理由**：

- Crepe 已经提供斜杠菜单、工具栏、代码块、表格、图片块等完整交互，和「开箱即用」的目标一致
- 如果用 `@milkdown/kit` 从零实现这些 UI，首次开发和长期跟进上游的成本都明显更高
- `CrepeBuilder` 只打包显式引入的功能。实测：在空 Vite + Vue 项目中安装本包并构建，产物里不含 KaTeX（样本 1 次构建）

**改用 `@milkdown/kit` 的触发条件**：交互形态和 Crepe 差别很大，需要改写的 Crepe 功能超过一半

**硬性约束**：源码中不得以运行时方式 import `@milkdown/crepe` 根入口，否则会引入所有功能（包括 KaTeX）。只允许 import `@milkdown/crepe/builder` 和 `@milkdown/crepe/feature/*`

### 4.2 包名

**结论**：`@altmanlib/milkdown-kit`

**理由**：

- scope 和 GitHub 账号 `altmanlib` 一致，所有自有包可以放在同一个 scope 下
- 包名和仓库名 `milkdown-kit` 一致，从包名就能看出底层是 Milkdown

**代价**：和官方的 `@milkdown/kit` 只差一个斜杠和连字符，安装时容易写错。README 开头注明本包不是官方包

**组件与 CSS 命名**：类名 `.md-editor`、token 前缀 `--md-editor-*`、组件名 `MdEditor` 按编辑器组件命名，不使用 `milkdown` 前缀，避免和 Crepe 自带的 `.milkdown` 类名混淆

### 4.3 分层

```text
src/
  core/
    create-editor.ts   createEditor() and EditorHandle
    features.ts        Feature registry, imports Crepe feature subpaths only
    image-markdown.ts  Workarounds for upstream image Markdown defects (§2.2)
    types.ts           Public types
  locale/              UI text presets, mapped onto Crepe feature configs
  theme/
    style.css          Entry: Crepe base styles + own layers below
    tokens.css         Public design tokens, light and dark
    content.css        Document density and block shapes
    code.css           CodeMirror colors driven by tokens
    overlays.css       Menus, toolbars, tooltips
  vue/                 Vue component, depends on core only
```

依赖方向只能是 `vue` → `core` → `@milkdown/crepe`。`locale` 只被 `core` 引用

Vue 组件不使用 `@milkdown/vue`：核心已经负责编辑器的创建和销毁，组件直接调用 `createEditor()`，不需要再加一层上游的封装

### 4.4 核心 API

```ts
interface MdEditorOptions {
  defaultValue?: string
  readonly?: boolean
  placeholder?: string
  onChange?: (markdown: string) => void          // Debounced by the editor (200ms)
  uploadImage?: (file: File) => Promise<string>  // Returns the image URL
  features?: Partial<Record<FeatureName, boolean>>
  locale?: 'zh-CN' | 'en'
  codeBlockTools?: 'always' | 'hover'
}

interface EditorHandle {
  getMarkdown(): string
  setMarkdown(markdown: string): void  // Replaces the document and resets undo history
  setReadonly(readonly: boolean): void
  focus(): void
  destroy(): Promise<void>
}

declare function createEditor(
  root: HTMLElement,
  options?: MdEditorOptions,
): Promise<EditorHandle>
```

| 参数 | 实现方式 |
|---|---|
| `root` | 编辑器挂载到 `root` 内新建的 `div.md-editor` 容器里，`destroy()` 时移除这个容器，不改动 `root` 本身 |
| `uploadImage` | `image-block` 的三个上传回调都指向它。未提供时，上传回调直接拒绝，避免把会失效的 `blob:` URL 写进文档；容器带 `data-upload="disabled"`，CSS 隐藏上传按钮，占位文案为「粘贴图片链接」 |
| `features` | 决定是否调用 `CrepeBuilder.addFeature()`。`FeatureName` 由本包自己定义，不直接复用 `CrepeFeature` |
| `locale` | 展开成各功能的文案字段；默认 `zh-CN` |
| `onChange` | 基于 `CrepeBuilder.on()` 注册的 listener，只在用户编辑时触发，`setMarkdown()` 不触发 |
| `codeBlockTools` | 代码块的语言选择和复制按钮。`always`（默认）一直显示；`hover` 鼠标悬停时显示，不支持悬停的设备上仍一直显示。通过容器的 `data-code-tools` 属性交给 CSS 处理 |

`FeatureName` 包含的功能和默认值：

| 功能 | 默认 |
|---|---|
| `code-mirror`、`list-item`、`link-tooltip`、`cursor`、`image-block`、`block-edit`、`toolbar`、`placeholder`、`table` | 开启 |

`latex`、`top-bar`、`ai` 不在 `FeatureName` 中，本包不提供

**核心额外补上的上游配置**：

| 项 | 做法 |
|---|---|
| 代码块语言与高亮 | 传入 `@codemirror/language-data` 的语言列表（语法按需懒加载），并用 `classHighlighter` 输出 `tok-*` 类名，颜色由主题 token 决定，自动跟随浅色和暗色 |
| 斜杠菜单定位 | 追加 floating-ui 的 `shift` 和 `size`：菜单在视口内横向平移，可用高度写入 CSS 变量，菜单最大高度不超过视口 |
| 块手柄距离 | 手柄距正文 8px，和 CSS 里给手柄预留的左侧内边距一致 |
| 图片 Markdown | 见下表 |

图片 Markdown 的处理规则（规避 §2.2 的两个缺陷）：

| 方向 | 规则 |
|---|---|
| 解析 | 图片缺失的 `title` / `alt` 补为空字符串；块级图片的 alt 如果是纯数字（Crepe 的约定），按缩放比例处理，否则作为 alt 文本保留 |
| 导出 | 块级图片优先写 alt 文本；没有 alt 且缩放比例不为 1 时，才把比例写进 alt |

### 4.5 Vue 组件

```vue
<MdEditor
  v-model="content"
  :readonly="false"
  :upload-image="upload"
  code-block-tools="always"
  @ready="onReady"
/>
```

| 项 | 结论 |
|---|---|
| `v-model` | 绑定 Markdown 字符串（`modelValue` / `update:modelValue`） |
| 其他 props | 和 `MdEditorOptions` 一一对应，camelCase 命名；`onChange` 由 `v-model` 替代 |
| 外部改值 | 只有当新值和组件上次同步的值不同时，才调用 `setMarkdown()`，避免循环更新和光标跳动 |
| `readonly` | 响应式，变化时调用 `setReadonly()` |
| 其他 props 变化 | 不响应。`features`、`locale`、`uploadImage`、`codeBlockTools` 等只在创建时生效，需要变化时由使用方通过 `:key` 重建组件 |
| 实例访问 | 通过 `defineExpose({ editor })` 暴露 `EditorHandle`（未就绪时为 `null`），同时通过 `ready` 事件传出 |
| 生命周期 | `onMounted` 时创建，`onBeforeUnmount` 时调用 `destroy()`；在编辑器就绪前卸载，就绪后立即销毁 |
| 根节点 | `div.md-editor-host`，组件上的 `class` / `style` 落在这里 |

### 4.6 包结构与导出

```json
{
  "name": "@altmanlib/milkdown-kit",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./vue": { "types": "./dist/vue.d.ts", "default": "./dist/vue.js" },
    "./style.css": "./dist/style.css",
    "./package.json": "./package.json"
  },
  "publishConfig": { "access": "public" }
}
```

- 只输出 ESM，附带 `.d.ts`
- 使用方要自己引入 `style.css`，JS 入口不自动注入样式
- scope 包默认是私有的，公开发布必须设置 `publishConfig.access: public`
- provenance 不在 `publishConfig` 中声明：通过 Trusted Publishing 从 GitHub Actions 发布时，npm 会自动生成

### 4.7 依赖策略

| 依赖 | 声明位置 | 版本范围 | 理由 |
|---|---|---|---|
| `@milkdown/crepe`、`@milkdown/kit` | `dependencies` | `~7.22.1` | 属于内部实现，锁到 patch 级别，保证整棵依赖树里 Milkdown 版本一致 |
| `@codemirror/language`、`@codemirror/language-data`、`@lezer/highlight` | `dependencies` | 和 Crepe 的依赖范围一致 | 补上按需组合时缺失的语言列表和高亮（§4.4），和 Crepe 共用同一份安装 |
| `@floating-ui/dom` | `dependencies` | 和 `@milkdown/plugin-slash` 的依赖范围一致 | 斜杠菜单的 `shift` / `size` middleware |
| `vue` | `peerDependencies`，标为 optional | `^3.5.0` | 使用宿主项目的 Vue 实例。下限和 Crepe 依赖的 `vue ^3.5.20` 保持同一个 minor，避免宿主安装出两份 Vue |
| `typescript` | `devDependencies` | `~6.0.3` | TypeScript 7 不提供 vue-tsc 需要的 API（§2.3） |

Milkdown 的升级由本包统一跟进，使用方不需要直接安装 `@milkdown/*`

依赖升级：npm 依赖每月手动检查，`@milkdown/crepe` 与 `@milkdown/kit` 必须同版本升级；GitHub Actions 版本由 Dependabot 管理。Dependabot 的 bun 更新器只支持 `bun.lock` 的 `lockfileVersion` 1（bun ≥ 1.4 写入 2），所以 npm 依赖暂不交给它。步骤与触发条件见 [release.md](../guide/release.md) §3

`vue` 标为 optional peer，是因为只使用核心入口的项目不需要 Vue

**TypeScript 升到 7 的触发条件**：vue-tsc 和 rolldown-plugin-dts 支持 TypeScript 7 的原生编译器，可以生成 `.vue` 组件的类型声明

### 4.8 样式与主题

**结论**：以 Crepe 的通用样式为基础（只引入已启用功能的部分），在上面叠加本包自己的 token 层、内容层、代码层和弹层层。不引入 Crepe 的任何主题文件，所有颜色都来自本包的 token

| 类别 | token | 说明 |
|---|---|---|
| 颜色 | `--md-editor-color-*` | 背景、文字、主色、边框（`border` / `divider`）、悬停（`hover` / `active` / `selected`）、弹层背景（`overlay`）等，映射到 Crepe 的 `--crepe-color-*` |
| 圆角 | `--md-editor-radius-sm` / `md` / `lg` | 3px / 4px / 8px。`lg` 用于弹层，弹层内边距 4px，内部菜单项用 `md`，保证里外圆角同心 |
| 阴影 | `--md-editor-shadow-sm` / `overlay` | 多层柔和阴影；暗色下使用黑色阴影 |
| 代码高亮 | `--md-editor-code-*` | 关键字、字符串、数字、注释、函数、类型、属性、元信息 |
| 排版 | `--md-editor-font-*`、`--md-editor-font-size`、`--md-editor-line-height` | 默认 15px、行高 1.6，字体优先使用系统中文字体 |
| 布局 | `--md-editor-padding` | 默认 `20px 32px 20px 64px`，左侧 64px 给块手柄预留位置 |

- 暗色模式：`.md-editor` 的任意祖先元素（包括 `<html>`）上设置 `data-theme="dark"` 时生效，不依赖 `prefers-color-scheme`
- 密度：标题、段落、列表、代码块、表格采用紧凑间距
- 弹层：斜杠菜单、选中文字工具栏、链接浮窗、代码语言选择、表格按钮组使用同一套背景、边框、圆角和阴影
- 窄屏（≤ 480px）：隐藏块手柄并收窄内边距；斜杠菜单隐藏分组标签，最大高度 280px
- token 定义在 `.md-editor` 上，宿主元素 `.md-editor-host` 读不到这些 token
- 编辑器本身不带外框、圆角和最小高度，由使用方决定；使用方给外层加样式时不能用 `overflow: hidden`，否则弹层会被裁掉

### 4.9 构建与发布

| 项 | 结论 |
|---|---|
| 包管理 | bun |
| JS 构建 | tsdown，Vue SFC 通过 `unplugin-vue` 编译，类型声明通过 vue-tsc 生成 |
| CSS 构建 | `scripts/build-css.ts` 用 lightningcss 把 `@import` 内联成单个 `dist/style.css`。不用 tsdown 的 CSS 功能，它仍标为 experimental |
| 开发预览 | 仓库内的 `playground/`（Vite + Vue），只用于演示，不进入发布产物 |
| 版本与 changelog | changesets，配置 `access: public` |
| CI | `.github/workflows/ci.yml`：类型检查、测试、文档检查、构建、publint、attw，并把 gzip 体积写入 job summary |
| 发布 | `.github/workflows/release.yml`：`changesets/action` 在有 changeset 时开「Version Packages」PR，合并后执行 `bun run release`，通过 npm Trusted Publishing 发布并自动生成 provenance。操作步骤见 [release.md](../guide/release.md) |
| 仓库形态 | 单个包，不使用 monorepo |

npm Trusted Publishing 的要求（来自 npm 官方文档）：npm CLI ≥ 11.5.1、Node ≥ 22.14.0、GitHub 托管的 runner、job 权限包含 `id-token: write`；npmjs.com 上登记的 workflow 文件名必须和 `release.yml` 完全一致。私有仓库不生成 provenance；provenance 还要求 `package.json` 的 `repository` 和发布所在的公开仓库完全一致

**改用 monorepo 的触发条件**：增加第二个框架组件后，不同框架组件需要各自的版本节奏，或者 optional peer 让使用方安装时出现问题

## 5. 影响面

- 使用方只依赖本包的公开 API（§4.4、§4.5）和 CSS token（§4.8），Milkdown 升级对使用方透明
- 本包的 major 版本只在公开 API 或 CSS token 不兼容时升级，与 Milkdown 的版本号无关
- `0.x` 阶段 API 允许不兼容变更，由 changesets 在 changelog 中写明
- 升级 Milkdown 时，§2.2 的规避代码需要复查：上游修复后删除对应规避，往返测试保证行为不变

## 6. 测试或验证策略

| 层 | 工具 | 覆盖内容 |
|---|---|---|
| 往返 | vitest + happy-dom | 标题、行内标记、有序/无序/任务列表、引用、代码块、表格、分割线、中文、块级和行内图片（有无 title、有无 alt、缩放比例）；无 title 图片前后的内容不丢失 |
| 核心 | vitest + happy-dom | 挂载与销毁、data 属性、`setMarkdown()` 不触发 `onChange`、用户编辑触发 `onChange`、只读切换、占位文案 |
| 组件 | vitest + `@vue/test-utils` | 初始值与暴露的句柄、外部改值写入、自身发出的值不回写、只读响应、卸载时销毁、就绪前卸载 |
| SSR | vitest（node 环境） | 在没有 DOM 的环境中 import 核心和 Vue 入口不报错 |
| 包产物 | `publint`、`@arethetypeswrong/cli`（`--profile esm-only`，排除 `style.css`） | `exports` 和类型声明正确 |
| 交互 | 在 playground 中手动验证 | 斜杠菜单、工具栏、代码语言选择、暗色、窄屏、关闭上传 |

使用方冒烟测试：把 `bun pm pack` 打出的包安装到空的 Vite + Vue 项目，执行 `vue-tsc`（`skipLibCheck: false`）和 `vite build`，步骤见 [release.md](../guide/release.md) §2.2。2026-09-23 实测结果（样本 1 次构建）：

| 产物 | gzip 体积 |
|---|---|
| 静态引入时的首屏 JS（含 Vue 运行时） | 363,394 字节 |
| 用 `defineAsyncComponent` 按需加载时的首屏 JS（含 Vue 运行时） | 25,357 字节 |
| 按需加载时的编辑器 chunk | 239,921 字节 |
| CSS | 7,717 字节 |
| 代码语言语法 | 按需懒加载，拆成独立 chunk |

README 推荐使用方按需加载编辑器，包内不做额外的体积优化

打包体积不设上限，CI 的 job summary 记录每次构建的 gzip 体积，作为以后设定上限的基线

## 7. 迁移与兼容

浏览器支持范围以 Milkdown / ProseMirror 为准，不额外做降级

Markdown 往返中的格式规范化（列表符号、标题风格等）不改变内容，详见 [2026-09-23-01-markdown-normalization.md](../record/2026-09-23-01-markdown-normalization.md)

## 8. 明确不做

- 不透传 Crepe / Milkdown 的原始配置和实例
- 不内置任何上传、存储、鉴权实现
- 不提供 `latex`、`top-bar`、`ai` 功能
- 不支持 SSR 渲染编辑器；只保证在 SSR 环境中 import 时不报错
- 不做协同编辑（Yjs）
- 不输出 CJS
- 当前不提供 React 组件（触发条件见 §9）

## 9. 开放项

| 项 | 触发条件 | 处理方式 |
|---|---|---|
| 公式支持 | 有使用方需要公式 | 在 `FeatureName` 中增加 `latex`，通过动态 import 加载，不启用时不打包 KaTeX |
| React 组件 | 有 React 项目需要接入 | 新增 `./react` 导出，并按 §4.9 的触发条件评估是否改用 monorepo |
| 体积上限 | 使用方反馈加载性能问题 | 以 §6 的基线数据设定 gzip 上限，并在 CI 中卡住 |
| 自动化 E2E | 交互层出现回归，或交互改动变得频繁 | 把 §6 的手动交互验证写成 playwright 用例，在 CI 中针对 playground 运行 |
| 列表符号 | 使用方要求导出 `-` 而不是 `*` | 通过 Milkdown 的 remark-stringify 配置设置 `bullet: '-'`，并更新往返测试 |
| 外层 token | 使用方需要在编辑器外框上使用主题 token | 把 token 同时定义到宿主元素上 |
