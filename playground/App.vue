<script setup lang="ts">
import { ref, watchEffect } from 'vue'

import { MdEditor } from '../src/vue'

const content = ref(`# md-editor

输入 **/** 唤起菜单，选中文字可以看到工具栏

- [ ] 任务列表
- [x] 已完成

| 列 A | 列 B |
| --- | --- |
| 1 | 2 |

\`\`\`ts
const answer = 42
\`\`\`
`)
const readonly = ref(false)
const dark = ref(false)
const uploadEnabled = ref(true)

watchEffect(() => {
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
})

// Simulated upload: returns a data URL after a short delay.
function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => setTimeout(() => resolve(reader.result as string), 300)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
</script>

<template>
  <main class="layout">
    <header class="controls">
      <label><input v-model="readonly" type="checkbox" /> 只读</label>
      <label><input v-model="dark" type="checkbox" /> 暗色</label>
      <label><input v-model="uploadEnabled" type="checkbox" /> 图片上传（切换后重建）</label>
      <button type="button" @click="content = '# 外部写入\n\n内容被替换'">外部改值</button>
    </header>
    <section class="panes">
      <MdEditor
        :key="String(uploadEnabled)"
        v-model="content"
        class="editor"
        :readonly="readonly"
        :upload-image="uploadEnabled ? uploadImage : undefined"
      />
      <pre class="output">{{ content }}</pre>
    </section>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
html[data-theme='dark'] body {
  background: #0d1117;
  color: #e6edf3;
}
.layout {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px;
}
.controls {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}
.panes {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
}
.editor {
  min-height: 480px;
  border: 1px solid #8884;
  border-radius: 8px;
}
.output {
  margin: 0;
  padding: 12px;
  border: 1px solid #8884;
  border-radius: 8px;
  white-space: pre-wrap;
  font-size: 13px;
}
@media (max-width: 720px) {
  .layout {
    padding: 8px;
  }
  .controls {
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  .panes {
    grid-template-columns: 1fr;
  }
}
</style>
