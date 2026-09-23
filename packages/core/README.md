# @altmanlib/milkdown-kit

基于 [Milkdown](https://milkdown.dev) Crepe 预配置好的 Markdown 编辑器：中文界面、紧凑主题、暗色模式，开箱即用。本包提供不依赖框架的核心 API 和样式

> 本包不是 Milkdown 官方包。官方包名是 `@milkdown/kit`，注意区分

使用 Vue 时请安装 [`@altmanlib/milkdown-kit-vue`](https://www.npmjs.com/package/@altmanlib/milkdown-kit-vue)；使用 React 时请安装 [`@altmanlib/milkdown-kit-react`](https://www.npmjs.com/package/@altmanlib/milkdown-kit-react)

## 安装

```bash
npm install @altmanlib/milkdown-kit
```

## 使用

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

配置项和主题定制见[完整文档](https://github.com/altmanlib/milkdown-kit#readme)

## License

MIT
