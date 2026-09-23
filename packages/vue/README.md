# @altmanlib/milkdown-kit-vue

基于 [Milkdown](https://milkdown.dev) Crepe 预配置好的 Markdown 编辑器的 Vue 3 组件：中文界面、紧凑主题、暗色模式，开箱即用

> 本包不是 Milkdown 官方包

## 安装

```bash
npm install @altmanlib/milkdown-kit-vue
```

要求项目中已安装 `vue@^3.5`

## 使用

```vue
<script setup lang="ts">
import '@altmanlib/milkdown-kit-vue/style.css'
import { MdEditor } from '@altmanlib/milkdown-kit-vue'
import { ref } from 'vue'

const content = ref('# Hello')
</script>

<template>
  <MdEditor v-model="content" />
</template>
```

配置项、按需加载、主题定制见[完整文档](https://github.com/altmanlib/milkdown-kit#readme)

## License

MIT
