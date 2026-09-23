# @altmanlib/milkdown-kit-react

基于 [Milkdown](https://milkdown.dev) Crepe 预配置好的 Markdown 编辑器的 React 19 组件：中文界面、紧凑主题、暗色模式，开箱即用

> 本包不是 Milkdown 官方包

## 安装

```bash
npm install @altmanlib/milkdown-kit-react
```

要求项目中已安装 `react@^19` 和 `react-dom@^19`

## 使用

```tsx
import '@altmanlib/milkdown-kit-react/style.css'
import { MdEditor } from '@altmanlib/milkdown-kit-react'
import { useState } from 'react'

export function App() {
  const [content, setContent] = useState('# Hello')
  return <MdEditor value={content} onChange={setContent} />
}
```

配置项、按需加载、主题定制见[完整文档](https://github.com/altmanlib/milkdown-kit#readme)

## License

MIT
