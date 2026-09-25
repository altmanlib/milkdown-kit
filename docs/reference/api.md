---
title: 对外 API
type: reference
status: published
updated: 2026-09-25
---

# 对外 API

本文列出各包对使用方公开的全部内容：JS 导出、框架组件、样式入口、CSS token 和 DOM 约定。未列在这里的都属于内部实现，可能随时变化，包括名字带 `internal` 的 CSS 变量。各项的方案见 [editor-architecture.md](../design/editor-architecture.md) §4

## 1. 导出清单

| 包 | 入口 | 导出 |
|---|---|---|
| `@altmanlib/milkdown-kit` | `.` | 函数 `createEditor`；类型 `MdEditorOptions`、`EditorHandle`、`FeatureName`、`Locale`、`CodeBlockToolsMode` |
| `@altmanlib/milkdown-kit` | `./style.css` | 完整样式 |
| `@altmanlib/milkdown-kit-vue` | `.` | 组件 `MdEditor`；类型 `MdEditorProps`，以及从核心包转发的 `EditorHandle`、`FeatureName`、`Locale`、`CodeBlockToolsMode` |
| `@altmanlib/milkdown-kit-vue` | `./style.css` | 转发核心包的 `style.css` |
| `@altmanlib/milkdown-kit-react` | `.` | 组件 `MdEditor`；类型 `MdEditorProps`，以及从核心包转发的 `EditorHandle`、`FeatureName`、`Locale`、`CodeBlockToolsMode` |
| `@altmanlib/milkdown-kit-react` | `./style.css` | 转发核心包的 `style.css` |

所有包都只输出 ESM。JS 入口不注入样式，使用方需要自己引入 `style.css`

## 2. createEditor

```ts
function createEditor(root: HTMLElement, options?: MdEditorOptions): Promise<EditorHandle>
```

在 `root` 内新建 `div.md-editor` 并挂载编辑器，编辑器就绪后 resolve。创建失败时移除该容器并 reject

### 2.1 MdEditorOptions

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `defaultValue` | `string` | `''` | 初始 Markdown |
| `readonly` | `boolean` | `false` | 只读 |
| `placeholder` | `string` | 按 `locale` | 空文档的占位文案 |
| `onChange` | `(markdown: string) => void` | — | 用户编辑后触发，200ms 防抖；`setMarkdown()` 不触发 |
| `uploadImage` | `(file: File) => Promise<string>` | — | 上传图片并返回 URL。不提供时，上传会被拒绝，只能通过链接插入图片 |
| `features` | `Partial<Record<FeatureName, boolean>>` | 全部开启 | 设为 `false` 关闭对应功能 |
| `locale` | `Locale` | `'zh-CN'` | 界面文案语言 |
| `codeBlockTools` | `CodeBlockToolsMode` | `'always'` | 代码块的语言选择和复制按钮：`always` 一直显示；`hover` 悬停时显示，不支持悬停的设备上仍一直显示 |

除 `readonly` 可通过 `setReadonly()` 修改外，其他选项只在创建时生效

### 2.2 类型

| 类型 | 取值 |
|---|---|
| `FeatureName` | `'toolbar'`、`'block-menu'`、`'code-block'`、`'image-block'`、`'table'`、`'link-tooltip'`、`'placeholder'`，含义见 [editor-architecture.md](../design/editor-architecture.md) §4.4 |
| `Locale` | `'zh-CN'`、`'en'` |
| `CodeBlockToolsMode` | `'always'`、`'hover'` |

## 3. EditorHandle

| 方法 | 说明 |
|---|---|
| `getMarkdown(): string` | 返回当前文档的 Markdown |
| `setMarkdown(markdown: string): void` | 替换整个文档并重置撤销历史，不触发 `onChange` |
| `setReadonly(readonly: boolean): void` | 切换只读 |
| `focus(): void` | 让编辑器获得焦点 |
| `destroy(): Promise<void>` | 销毁编辑器并移除 `div.md-editor`，不改动 `root`。重复调用无副作用 |

## 4. MdEditor 组件

两个框架包都导出 `MdEditor`。组件的根节点是 `div.md-editor-host`，组件上的 class / style 落在这里。标为「仅创建时」的 props 变化后不生效，需要通过 `key` 重建组件

### 4.1 Vue

| Prop | 类型 | 默认 | 仅创建时 | 说明 |
|---|---|---|---|---|
| `modelValue` | `string` | `''` | 否 | 配合 `v-model` 使用。外部改值时调用 `setMarkdown()`；组件自己发出的值不会回写 |
| `readonly` | `boolean` | `false` | 否 | 变化时调用 `setReadonly()` |
| `placeholder` | `string` | 按 `locale` | 是 | 同 `MdEditorOptions` |
| `uploadImage` | `(file: File) => Promise<string>` | — | 是 | 同 `MdEditorOptions` |
| `features` | `Partial<Record<FeatureName, boolean>>` | 全部开启 | 是 | 同 `MdEditorOptions` |
| `locale` | `Locale` | `'zh-CN'` | 是 | 同 `MdEditorOptions` |
| `codeBlockTools` | `CodeBlockToolsMode` | `'always'` | 是 | 同 `MdEditorOptions` |

| 事件与实例 | 类型 | 说明 |
|---|---|---|
| `update:modelValue` 事件 | `(value: string)` | 用户编辑后触发，200ms 防抖 |
| `ready` 事件 | `(editor: EditorHandle)` | 编辑器就绪后触发一次 |
| 模板 ref 上的 `editor` | `ShallowRef<EditorHandle \| null>` | 就绪前为 `null`，卸载后恢复为 `null` |

### 4.2 React

要求 `react` / `react-dom` 19

| Prop | 类型 | 默认 | 仅创建时 | 说明 |
|---|---|---|---|---|
| `value` | `string` | — | 否 | 外部改值时调用 `setMarkdown()`；`onChange` 发出的值不会回写。不传时为非受控 |
| `defaultValue` | `string` | `''` | 是 | 不传 `value` 时的初始内容；两者都传时以 `value` 为准 |
| `onChange` | `(markdown: string) => void` | — | 否 | 用户编辑后触发，200ms 防抖 |
| `readonly` | `boolean` | `false` | 否 | 变化时调用 `setReadonly()` |
| `onReady` | `(editor: EditorHandle) => void` | — | 否 | 编辑器就绪后调用一次，此时 `ref` 已指向编辑器 |
| `ref` | `Ref<EditorHandle \| null>` | — | 否 | 普通 prop。就绪前为 `null`，卸载后恢复为 `null` |
| `className`、`style` | `string`、`CSSProperties` | — | 否 | 设置在 `div.md-editor-host` 上 |
| `placeholder`、`uploadImage`、`features`、`locale`、`codeBlockTools` | 同 `MdEditorOptions` | 同 `MdEditorOptions` | 是 | 同 `MdEditorOptions` |

`onChange`、`onReady` 总是调用最近一次渲染传入的函数

## 5. CSS token

在 `.md-editor` 或它的任意祖先元素上覆盖。默认值见 `packages/core/src/theme/tokens.css`

### 5.1 颜色

| token | 用途 |
|---|---|
| `--md-editor-color-background` | 编辑器背景 |
| `--md-editor-color-on-background` | 正文文字 |
| `--md-editor-color-surface` | 块背景：代码块、表格表头 |
| `--md-editor-color-on-surface` | 块内文字 |
| `--md-editor-color-on-surface-variant` | 弹层中的次要文字 |
| `--md-editor-color-muted` | 弱化文字：代码行号、代码块工具按钮、菜单分组标签 |
| `--md-editor-color-primary` | 主色：链接、激活的按钮、焦点 |
| `--md-editor-color-inline-code` | 行内代码文字 |
| `--md-editor-color-error` | 错误提示 |
| `--md-editor-color-hover` | 悬停背景 |
| `--md-editor-color-active` | 按下和当前项背景 |
| `--md-editor-color-selected` | 选中背景；也用作图片链接确认按钮的背景 |
| `--md-editor-color-inline-area` | 行内代码背景 |
| `--md-editor-color-border` | 边框 |
| `--md-editor-color-divider` | 分割线 |
| `--md-editor-color-overlay` | 弹层背景：菜单、工具栏、浮窗 |

### 5.2 代码高亮

| token | 用途 |
|---|---|
| `--md-editor-code-keyword` | 关键字 |
| `--md-editor-code-string` | 字符串 |
| `--md-editor-code-number` | 数字 |
| `--md-editor-code-comment` | 注释 |
| `--md-editor-code-function` | 函数名 |
| `--md-editor-code-type` | 类型名 |
| `--md-editor-code-property` | 属性名 |
| `--md-editor-code-meta` | 元信息 |

### 5.3 形状、阴影、排版与布局

| token | 默认 | 用途 |
|---|---|---|
| `--md-editor-radius-sm` | `3px` | 行内代码、小按钮 |
| `--md-editor-radius-md` | `4px` | 代码块、图片块、弹层内的菜单项 |
| `--md-editor-radius-lg` | `8px` | 弹层 |
| `--md-editor-shadow-sm` | — | 表格的行列手柄和添加按钮 |
| `--md-editor-shadow-overlay` | — | 弹层 |
| `--md-editor-font-size` | `15px` | 正文字号 |
| `--md-editor-line-height` | `1.6` | 正文行高 |
| `--md-editor-font-default` | 系统字体，中文优先 | 正文字体 |
| `--md-editor-font-title` | 同 `font-default` | 标题字体 |
| `--md-editor-font-code` | 等宽字体 | 代码字体 |
| `--md-editor-padding` | `20px 32px 20px 64px` | 编辑区内边距，左侧 64px 给块手柄预留位置 |

## 6. 暗色模式与 DOM 约定

| 项 | 约定 |
|---|---|
| 暗色模式 | `.md-editor` 的任意祖先元素（包括 `<html>`）上设置 `data-theme="dark"` |
| token 作用范围 | 定义在 `.md-editor` 上；`.md-editor-host` 读不到 |
| 外层样式 | 编辑器不带外框、圆角和最小高度；外层不能用 `overflow: hidden`，否则弹层会被裁掉 |
