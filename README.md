# @altmanlib/milkdown-kit

基于 [Milkdown](https://milkdown.dev) Crepe 预配置好的 Markdown 编辑器：中文界面、紧凑主题、暗色模式、Vue 3 组件，开箱即用

> 本包不是 Milkdown 官方包。官方包名是 `@milkdown/kit`，注意区分

## 安装

```bash
npm install @altmanlib/milkdown-kit
```

使用 Vue 组件时，项目中需要有 `vue@^3.5`

## 使用

### Vue

```vue
<script setup lang="ts">
import '@altmanlib/milkdown-kit/style.css'
import { MdEditor } from '@altmanlib/milkdown-kit/vue'
import { ref } from 'vue'

const content = ref('# Hello')

async function uploadImage(file: File): Promise<string> {
  // Upload to your storage and return the public URL
  return 'https://example.com/image.png'
}
</script>

<template>
  <MdEditor v-model="content" :upload-image="uploadImage" />
</template>
```

### 不使用框架

```ts
import '@altmanlib/milkdown-kit/style.css'
import { createEditor } from '@altmanlib/milkdown-kit'

const editor = await createEditor(document.querySelector('#editor')!, {
  defaultValue: '# Hello',
  onChange: (markdown) => console.log(markdown),
})

editor.getMarkdown()
editor.setMarkdown('# Replaced')
await editor.destroy()
```

## 配置

| 选项 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `defaultValue` | `string` | `''` | 初始内容（Vue 组件用 `v-model`） |
| `readonly` | `boolean` | `false` | 只读；Vue 组件中是响应式的 |
| `placeholder` | `string` | 按 `locale` | 空文档的占位文案 |
| `onChange` | `(markdown) => void` | — | 用户编辑后触发，200ms 防抖（Vue 组件用 `v-model`） |
| `uploadImage` | `(file) => Promise<string>` | — | 上传图片并返回 URL；不提供时只能粘贴图片链接 |
| `features` | `Partial<Record<FeatureName, boolean>>` | 全部开启 | 关闭某个功能，例如 `{ table: false }` |
| `locale` | `'zh-CN' \| 'en'` | `'zh-CN'` | 界面语言 |
| `codeBlockTools` | `'always' \| 'hover'` | `'always'` | 代码块的语言选择和复制按钮是否一直显示 |

`FeatureName`：`code-mirror`、`list-item`、`link-tooltip`、`cursor`、`image-block`、`block-edit`、`toolbar`、`placeholder`、`table`

除 `readonly` 外，其他选项只在创建时生效。在 Vue 中需要变更时，通过 `:key` 重建组件

## 主题

在 `.md-editor` 或它的任意祖先元素上覆盖 CSS 变量：

```css
.my-page .md-editor {
  --md-editor-color-primary: #7c3aed;
  --md-editor-font-size: 16px;
  --md-editor-padding: 24px 48px 24px 72px;
}
```

- 暗色模式：在任意祖先元素（例如 `<html>`）上设置 `data-theme="dark"`
- 编辑器本身不带外框和最小高度，由你的页面决定
- 给编辑器外层加样式时不要使用 `overflow: hidden`，否则斜杠菜单和工具栏会被裁掉

## 注意

- 只能在浏览器中运行。SSR 环境中可以 import，但要在客户端挂载（例如 Nuxt 的 `<ClientOnly>`）
- 导出的 Markdown 会做少量格式规范化（例如列表符号统一为 `*`），内容不变

## License

MIT
