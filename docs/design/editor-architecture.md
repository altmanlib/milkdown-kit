---
title: 编辑器封装方案
type: design
status: published
updated: 2026-09-25
---

# 编辑器封装方案

## 1. 目标与范围

在 Milkdown 基础上封装一个预配置好的 Markdown 编辑器，公开发布到 npm。其他项目安装后，只需少量配置就能使用

| 项 | 结论 |
|---|---|
| 包名 | `@altmanlib/milkdown-kit`（核心与样式）、`@altmanlib/milkdown-kit-vue`（Vue 组件）、`@altmanlib/milkdown-kit-react`（React 组件） |
| 交付物 | 同一仓库（monorepo）发布的多个 npm 包：不依赖框架的核心包，以及基于核心的框架组件包 |
| 支持的框架 | Vue 3、React 19 |
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

**结论**：核心包 `@altmanlib/milkdown-kit`，框架组件包 `@altmanlib/milkdown-kit-<框架>`（当前为 `@altmanlib/milkdown-kit-vue`、`@altmanlib/milkdown-kit-react`）

**理由**：

- scope 和 GitHub 账号 `altmanlib` 一致，所有自有包可以放在同一个 scope 下
- 核心包名和仓库名 `milkdown-kit` 一致，从包名就能看出底层是 Milkdown；框架包加后缀，和上游 `@milkdown/vue` 的拆分方式一致

**代价**：和官方的 `@milkdown/kit` 只差一个斜杠和连字符，安装时容易写错。README 开头注明本包不是官方包

**组件与 CSS 命名**：类名 `.md-editor`、token 前缀 `--md-editor-*`、组件名 `MdEditor` 按编辑器组件命名，不使用 `milkdown` 前缀，避免和 Crepe 自带的 `.milkdown` 类名混淆

### 4.3 分层

```text
packages/
  core/                  @altmanlib/milkdown-kit
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
  vue/                   @altmanlib/milkdown-kit-vue, depends on the core package only
    src/
    style.css            Re-exports the core styles
  react/                 @altmanlib/milkdown-kit-react, depends on the core package only
    src/
    style.css            Re-exports the core styles
```

依赖方向只能是框架包 → 核心包 → `@milkdown/crepe`。框架包只通过核心包的公开入口（`@altmanlib/milkdown-kit`）使用核心，不引用核心的内部文件；框架包之间互不依赖。`locale` 只被 `core` 引用

框架组件不使用 `@milkdown/vue` 或上游 React 封装：核心已经负责编辑器的创建和销毁，组件直接调用 `createEditor()`，不需要再加一层上游的封装

### 4.4 核心 API

完整签名、选项默认值和 `EditorHandle` 的方法见 [api.md](../reference/api.md) §2、§3。本节记录实现方式

| 参数 | 实现方式 |
|---|---|
| `root` | 编辑器挂载到 `root` 内新建的 `div.md-editor` 容器里，`destroy()` 时移除这个容器，不改动 `root` 本身 |
| `uploadImage` | `image-block` 的三个上传回调都指向它。未提供时，上传回调直接拒绝，避免把会失效的 `blob:` URL 写进文档；容器带 `data-upload="disabled"`，CSS 隐藏上传按钮，占位文案为「粘贴图片链接」 |
| `features` | 决定是否调用 `CrepeBuilder.addFeature()`。`FeatureName` 由本包自己定义，按使用方看到的功能命名，在核心内部映射到 Crepe 的功能名，不直接复用 `CrepeFeature` |
| `locale` | 展开成各功能的文案字段；默认 `zh-CN` |
| `onChange` | 基于 `CrepeBuilder.on()` 注册的 listener，只在用户编辑时触发，`setMarkdown()` 不触发 |
| `codeBlockTools` | 代码块的语言选择和复制按钮。`always`（默认）一直显示；`hover` 鼠标悬停时显示，不支持悬停的设备上仍一直显示。通过容器的 `data-code-tools` 属性交给 CSS 处理 |

`FeatureName` 包含的功能，默认全部开启：

| `FeatureName` | 对应的 Crepe 功能 | 关闭后 |
|---|---|---|
| `toolbar` | `toolbar` | 选中文字时不显示格式工具栏 |
| `block-menu` | `block-edit` | 没有斜杠菜单和块手柄 |
| `code-block` | `code-mirror` | 代码块不带语法高亮、语言选择和复制按钮 |
| `image-block` | `image-block` | 图片按普通 Markdown 图片显示，没有上传和缩放 |
| `table` | `table` | 表格没有行列手柄 |
| `link-tooltip` | `link-tooltip` | 没有链接预览和编辑浮窗 |
| `placeholder` | `placeholder` | 空文档不显示占位文案 |

Crepe 的 `cursor`（拖放和间隙光标）和 `list-item`（列表项和任务列表的渲染）始终开启，不提供开关：关闭它们只会让基础编辑变差，公开后 1.0 起无法再收回

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

由 `@altmanlib/milkdown-kit-vue` 提供。props、事件和暴露的实例见 [api.md](../reference/api.md) §4

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
| 类型 | 同时导出核心包的 `EditorHandle`、`FeatureName`、`Locale`、`CodeBlockToolsMode`，使用方不需要直接依赖核心包 |

### 4.5.1 React 组件

由 `@altmanlib/milkdown-kit-react` 提供

```tsx
<MdEditor
  value={content}
  onChange={setContent}
  readonly={false}
  uploadImage={upload}
  codeBlockTools="always"
  onReady={onReady}
  ref={editorRef}
/>
```

| 项 | 结论 |
|---|---|
| 受控内容 | `value` / `onChange`，语义对齐 Vue 的 `v-model`。不传 `value` 时为非受控，初始内容取 `defaultValue`（仅创建时），之后不同步外部值；两者都传时以 `value` 为准。`value` 没有默认值，否则无法区分「受控为空」和「非受控」 |
| 其他 props | 和 `MdEditorOptions` 一一对应，camelCase 命名；另增 `onReady`、`className`、`style` |
| 外部改值 | 只有当新值和组件上次同步的值不同时，才调用 `setMarkdown()`，避免循环更新和光标跳动 |
| `readonly` | 响应式，变化时调用 `setReadonly()` |
| 其他 props 变化 | 不响应。`features`、`locale`、`uploadImage`、`codeBlockTools` 等只在创建时生效，需要变化时由使用方通过 `key` 重建组件 |
| 实例访问 | `ref` 作为普通 prop（React 19），类型为 `EditorHandle \| null`；同时通过 `onReady` 回调传出 |
| 生命周期 | 挂载时创建，卸载时调用 `destroy()`；在编辑器就绪前卸载，就绪后立即销毁 |
| 根节点 | `div.md-editor-host`，`className` / `style` 落在这里 |
| 类型 | 同时导出核心包的 `EditorHandle`、`FeatureName`、`Locale`、`CodeBlockToolsMode`，使用方不需要直接依赖核心包 |
| peer 依赖 | `react` / `react-dom` 为 `^19.0.0` |

### 4.6 包结构与导出

每个包的导出结构相同：

```json
{
  "type": "module",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./style.css": "...",
    "./package.json": "./package.json"
  },
  "publishConfig": { "access": "public" }
}
```

| 包 | `./style.css` |
|---|---|
| `@altmanlib/milkdown-kit` | `./dist/style.css`，由 `scripts/build-css.ts` 构建的完整样式 |
| `@altmanlib/milkdown-kit-vue` | `./style.css`，只有一行 `@import '@altmanlib/milkdown-kit/style.css'` |
| `@altmanlib/milkdown-kit-react` | `./style.css`，只有一行 `@import '@altmanlib/milkdown-kit/style.css'` |

- 只输出 ESM，附带 `.d.ts`
- 使用方要自己引入 `style.css`，JS 入口不自动注入样式
- 框架包转发样式，是为了让使用方只依赖框架包：在 pnpm 等严格安装模式下，使用方不能直接 import 间接依赖。转发依赖打包工具解析 CSS 中的包名 `@import`（Vite 已实测，样本 1 次构建）
- scope 包默认是私有的，公开发布必须设置 `publishConfig.access: public`
- provenance 不在 `publishConfig` 中声明：通过 Trusted Publishing 从 GitHub Actions 发布时，npm 会自动生成

### 4.7 依赖策略

| 依赖 | 声明位置 | 版本范围 | 理由 |
|---|---|---|---|
| `@milkdown/crepe`、`@milkdown/kit` | 核心包 `dependencies` | `~7.22.1` | 属于内部实现，锁到 patch 级别，保证整棵依赖树里 Milkdown 版本一致 |
| `@codemirror/language`、`@codemirror/language-data`、`@lezer/highlight` | 核心包 `dependencies` | 和 Crepe 的依赖范围一致 | 补上按需组合时缺失的语言列表和高亮（§4.4），和 Crepe 共用同一份安装 |
| `@floating-ui/dom` | 核心包 `dependencies` | 和 `@milkdown/plugin-slash` 的依赖范围一致 | 斜杠菜单的 `shift` / `size` middleware |
| `@altmanlib/milkdown-kit` | 框架包 `dependencies` | `^<当前版本>`，不用 `workspace:` 协议 | 见§4.9。版本号由 changesets 在发版时同步 |
| `vue` | Vue 包 `peerDependencies` | `^3.5.0` | 使用宿主项目的 Vue 实例。下限和 Crepe 依赖的 `vue ^3.5.20` 保持同一个 minor，避免宿主安装出两份 Vue |
| `react`、`react-dom` | React 包 `peerDependencies` | `^19.0.0` | 使用宿主项目的 React 实例。`ref` 作为普通 prop，不使用已弃用的 `forwardRef` |
| 构建、测试工具 | 根目录 `devDependencies` | — | 所有包共用一套工具链版本 |
| `typescript` | 根目录 `devDependencies` | `~6.0.3` | TypeScript 7 不提供 vue-tsc 需要的 API（§2.3） |

Milkdown 的升级由本项目统一跟进，使用方不需要直接安装 `@milkdown/*`

依赖升级：npm 依赖每月手动检查，`@milkdown/crepe` 与 `@milkdown/kit` 必须同版本升级；GitHub Actions 版本由 Dependabot 管理。Dependabot 的 bun 更新器只支持 `bun.lock` 的 `lockfileVersion` 1（bun ≥ 1.4 写入 2），所以 npm 依赖暂不交给它。步骤与触发条件见 [release.md](../guide/release.md) §3

**TypeScript 升到 7 的触发条件**：vue-tsc 和 rolldown-plugin-dts 支持 TypeScript 7 的原生编译器，可以生成 `.vue` 组件的类型声明

### 4.8 样式与主题

**结论**：以 Crepe 的通用样式为基础（只引入已启用功能的部分），在上面叠加本包自己的 token 层、内容层、代码层和弹层层。不引入 Crepe 的任何主题文件，所有颜色都来自本包的 token

token 清单见 [api.md](../reference/api.md) §5。Crepe 中只在一两处使用的颜色（`surface-low`、`secondary`、`inverse` 等）不单独提供 token，由最接近的公开 token 推导，覆盖主题时一起变化。圆角分 `sm` / `md` / `lg` 三级：弹层用 `lg`、内边距 4px，内部菜单项用 `md`，保证里外圆角同心

- 暗色模式：`.md-editor` 的任意祖先元素（包括 `<html>`）上设置 `data-theme="dark"` 时生效，不依赖 `prefers-color-scheme`
- 密度：标题、段落、列表、代码块、表格采用紧凑间距
- 弹层：斜杠菜单、选中文字工具栏、链接浮窗、代码语言选择、表格按钮组使用同一套背景、边框、圆角和阴影
- 窄屏（≤ 480px）：隐藏块手柄并收窄内边距；斜杠菜单隐藏分组标签，最大高度 280px
- token 定义在 `.md-editor` 上，宿主元素 `.md-editor-host` 读不到这些 token
- 编辑器本身不带外框、圆角和最小高度，由使用方决定；使用方给外层加样式时不能用 `overflow: hidden`，否则弹层会被裁掉

### 4.9 构建与发布

| 项 | 结论 |
|---|---|
| 仓库形态 | monorepo，bun workspaces（`packages/*`）。根目录 `private: true`，不发布 |
| 包管理 | bun，版本由根目录 `package.json` 的 `packageManager` 固定；CI 中的 `setup-bun` 通过 `bun-version-file: package.json` 读取同一版本，保证本地和 CI 行为一致 |
| JS 构建 | 每个包各自用 tsdown 构建；Vue SFC 通过 `unplugin-vue` 编译，类型声明通过 vue-tsc 生成；React 包输出 ESM 与 `.d.ts`，JSX 按根目录 `tsconfig.json` 的 `jsx: react-jsx` 编译为 `react/jsx-runtime` 调用（设为 `preserve` 时产物会保留 JSX，使用方无法打包）。框架包把核心包当作外部依赖，不打进产物。根目录 `bun run build` 先构建核心包，再构建框架包 |
| CSS 构建 | 核心包的 `scripts/build-css.ts` 用 lightningcss 把 `@import` 内联成单个 `dist/style.css`。不用 tsdown 的 CSS 功能，它仍标为 experimental |
| 源码解析 | 类型检查、测试和 playground 把 `@altmanlib/milkdown-kit` 指向核心包源码（`tsconfig.json` 的 `paths` 和 `workspace-alias.ts`），不需要先构建 |
| 开发预览 | 仓库内的 `playground/`（Vite + Vue），只用于演示，不进入发布产物 |
| 版本与 changelog | changesets，配置 `access: public`。所有包放在同一个 `fixed` 分组，始终使用同一个版本号；每个包有自己的 `CHANGELOG.md` |
| CI | `.github/workflows/ci.yml`：类型检查、测试、文档检查、构建、每个包的 publint 和 attw，以及体积检查（`bun run check:size`，结果写入 job summary） |
| 发布 | `.github/workflows/release.yml`：`changesets/action` 在有 changeset 时开「Version Packages」PR，合并后执行 `bun run release`，通过 npm Trusted Publishing 发布并自动生成 provenance。操作步骤见 [release.md](../guide/release.md) |

**结论**：多框架支持采用同一仓库的 monorepo，每个框架一个包

**理由**：

- 框架包的 peer 依赖是必需的，不需要标为 optional；使用方只安装自己框架的包
- 核心修改可以在一个 PR 里同时覆盖所有框架，工具链、CI 和文档只有一套
- 上游 Milkdown、Tiptap、Floating UI 都采用这种结构（2026-09-23 通过 `npm view` 核对）

**代价**：每个新包首次发布必须在本地手动完成，再登记 Trusted Publisher（见 [release.md](../guide/release.md) §5）

**内部依赖不用 `workspace:` 协议**：changesets 在 bun 项目中用 `npm publish` 发布，而 npm 不会改写 `workspace:`，发布出去的包会无法安装。普通的 semver 范围在本地同样会链接到 workspace 包（bun 1.4.0 实测）。`bun add` 添加 workspace 包时会自动写成 `workspace:*`，需要手动改回，步骤见 [release.md](../guide/release.md) §3.2

npm Trusted Publishing 的要求（来自 npm 官方文档）：npm CLI ≥ 11.5.1、Node ≥ 22.14.0、GitHub 托管的 runner、job 权限包含 `id-token: write`；npmjs.com 上登记的 workflow 文件名必须和 `release.yml` 完全一致；要配置的包必须已经存在于 registry。私有仓库不生成 provenance；provenance 还要求 `package.json` 的 `repository` 和发布所在的公开仓库完全一致

**各包改为独立版本号的触发条件**：某个框架包需要升 major，而其他框架的使用方不应该跟着升。届时把 `fixed` 改为 `linked` 或移除

## 5. 影响面

- 使用方只依赖各包的公开 API（§4.4、§4.5、§4.5.1）和 CSS token（§4.8），Milkdown 升级对使用方透明
- major 版本只在公开 API 或 CSS token 不兼容时升级，与 Milkdown 的版本号无关
- `0.x` 阶段 API 允许不兼容变更，由 changesets 在 changelog 中写明
- 升级 Milkdown 时，§2.2 的规避代码需要复查：上游修复后删除对应规避，往返测试保证行为不变

## 6. 测试或验证策略

| 层 | 工具 | 覆盖内容 |
|---|---|---|
| 往返 | vitest + happy-dom | 标题、行内标记、有序/无序/任务列表、引用、代码块、表格、分割线、中文、块级和行内图片（有无 title、有无 alt、缩放比例）；无 title 图片前后的内容不丢失 |
| 核心 | vitest + happy-dom | 挂载与销毁、data 属性、`setMarkdown()` 不触发 `onChange`、用户编辑触发 `onChange`、只读切换、占位文案 |
| 组件 | vitest + `@vue/test-utils` / `@testing-library/react` | 初始值与暴露的句柄、外部改值写入、自身发出的值不回写、只读响应、卸载时销毁、就绪前卸载；React 另测 `className` / `style` 和 StrictMode 下只保留一个编辑器 |
| SSR | vitest（node 环境） | 在没有 DOM 的环境中 import 各包入口不报错；React 组件在服务端只渲染宿主元素 |
| 包产物 | 每个包运行 `publint`、`@arethetypeswrong/cli`（`--profile esm-only`，排除 `style.css`）；React 包再用 Node import 一次 `dist/index.js` | `exports` 和类型声明正确；React 产物不含未编译的 JSX |
| 交互 | 在 playground 中手动验证 | 斜杠菜单、工具栏、代码语言选择、暗色、窄屏、关闭上传 |

测试文件放在各包的 `tests/` 下，由根目录的一份 vitest 配置统一运行

使用方冒烟测试：把各包 `bun pm pack` 打出的 tgz 安装到空的 Vite + Vue 项目，执行 `vue-tsc`（`skipLibCheck: false`）和 `vite build`，步骤见 [release.md](../guide/release.md) §2.2。2026-09-23 实测结果（monorepo 结构，Vite 8.3.0，样本各 1 次构建）：

| 产物 | gzip 体积 |
|---|---|
| 静态引入时的首屏 JS（含 Vue 运行时） | 363,105 字节 |
| 用 `defineAsyncComponent` 按需加载时的首屏 JS（含 Vue 运行时） | 25,351 字节 |
| 按需加载时的编辑器 chunk | 239,884 字节 |
| CSS | 7,792 字节 |
| 代码语言语法 | 按需懒加载，拆成独立 chunk |

React 包按同样步骤验证：空的 Vite + React 项目，执行 `tsc --noEmit`（`skipLibCheck: false`）和 `vite build`，并在 Chromium 中打开开发服务器，确认 StrictMode 下只有一个编辑器、输入触发 `onChange`、外部改值写入编辑器、斜杠菜单可用。2026-09-25 实测结果（React 19.3.0，Vite 8.3.1，样本各 1 次构建）：

| 产物 | gzip 体积 |
|---|---|
| 静态引入时的首屏 JS（含 React 运行时） | 432,401 字节 |
| 用 `React.lazy` 按需加载时的首屏 JS（含 React 运行时） | 68,821 字节 |
| CSS | 7,792 字节 |

Crepe 内部用 Vue 实现部分界面（§2.1），所以 React 项目的编辑器产物中同样包含 Vue 运行时

README 推荐使用方按需加载编辑器，包内不做额外的体积优化

体积上限由 `scripts/check-size.ts` 检查：用 Vite 按使用方的方式打包构建后的核心包，统计 gzip 体积，超出上限或产物中出现 KaTeX 时失败

| 产物 | 2026-09-25 基线（Milkdown 7.22.1） | 上限 |
|---|---|---|
| 首屏加载的 JS（核心包及全部依赖，含 Crepe 内部使用的 Vue 运行时） | 367,993 字节 | 405,000 字节 |
| CSS | 7,633 字节 | 8,500 字节 |
| 按需加载的 JS（代码语言语法） | 477,639 字节，117 个 chunk | 不限制 |

上限约为基线加 10%。框架包自身只有 1 KB 左右（gzip），不单独设上限。升级 Milkdown 或新增功能导致超出时，确认增量合理后再提高上限，并在提交信息中写明原因

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
- 不支持 React 18：React 包只支持 React 19，`ref` 依赖 React 19 的普通 prop 传递

## 9. 开放项

编号和排期见 [ROADMAP.md](../ROADMAP.md)

| 编号 | 项 | 触发条件 | 处理方式 |
|---|---|---|---|
| R02 | 交互 E2E | 交互层出现回归，或交互改动变得频繁 | 把 §6 的手动交互验证写成 playwright 用例，在 CI 中针对 playground 运行 |
| R05 | 公式支持 | 有使用方需要公式 | 在 `FeatureName` 中增加 `latex`，通过动态 import 加载，不启用时不打包 KaTeX |
| R07 | 列表符号 | 使用方要求导出 `-` 而不是 `*` | 通过 Milkdown 的 remark-stringify 配置设置 `bullet: '-'`，并更新往返测试 |
| R08 | 外层 token | 使用方需要在编辑器外框上使用主题 token | 把 token 同时定义到宿主元素上 |
| R14 | VS Code Markdown 粘贴 | 使用方频繁从 VS Code / Cursor 粘贴 `.md` 内容，并反馈被当成代码块 | 仅当剪贴板含 `vscode-editor-data` 且 `mode === 'markdown'` 时，按 Markdown 解析粘贴；其他语言保持上游「插入代码块」行为。在核心包覆盖 `@milkdown/plugin-clipboard` 的 `handlePaste`，补充剪贴板模拟测试，并记录与上游的偏差。不默认关闭全部 VS Code 代码粘贴逻辑 |
