<script setup lang="ts">
import { ref, watchEffect } from 'vue'

import { MdEditor } from '../src/vue'

const content = ref(`# milkdown-kit

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
    <header class="topbar">
      <div class="brand">
        <span class="brand-name">@altmanlib/milkdown-kit</span>
        <span class="brand-tag">playground</span>
      </div>
      <div class="controls">
        <label class="switch"><input v-model="readonly" type="checkbox" /><span>只读</span></label>
        <label class="switch"><input v-model="dark" type="checkbox" /><span>暗色</span></label>
        <label class="switch" title="切换后编辑器会重建">
          <input v-model="uploadEnabled" type="checkbox" /><span>图片上传</span>
        </label>
        <button type="button" class="button" @click="content = '# 外部写入\n\n内容被替换'">
          外部改值
        </button>
      </div>
    </header>

    <section class="panes">
      <div class="card">
        <div class="card-header">编辑器</div>
        <MdEditor
          :key="String(uploadEnabled)"
          v-model="content"
          class="editor"
          :readonly="readonly"
          :upload-image="uploadEnabled ? uploadImage : undefined"
        />
      </div>
      <div class="card">
        <div class="card-header">
          Markdown
          <span class="card-meta">{{ content.length }} 字符</span>
        </div>
        <pre class="output">{{ content }}</pre>
      </div>
    </section>
  </main>
</template>

<style>
/* Playground chrome only; not part of the published package. */
:root {
  --pg-page: #f6f8fa;
  --pg-card: #ffffff;
  --pg-text: #1f2328;
  --pg-muted: #59636e;
  --pg-border: rgba(31, 35, 40, 0.12);
  --pg-divider: rgba(31, 35, 40, 0.08);
  --pg-hover: rgba(31, 35, 40, 0.05);
  --pg-accent: #0969da;
  --pg-shadow: 0 1px 2px rgba(31, 35, 40, 0.04), 0 1px 3px rgba(31, 35, 40, 0.06);
  color-scheme: light;
}

:root[data-theme='dark'] {
  --pg-page: #010409;
  --pg-card: #0d1117;
  --pg-text: #e6edf3;
  --pg-muted: #9198a1;
  --pg-border: rgba(240, 246, 252, 0.12);
  --pg-divider: rgba(240, 246, 252, 0.08);
  --pg-hover: rgba(240, 246, 252, 0.06);
  --pg-accent: #4493f8;
  --pg-shadow: 0 1px 2px rgba(1, 4, 9, 0.5);
  color-scheme: dark;
}

body {
  margin: 0;
  background: var(--pg-page);
  color: var(--pg-text);
  font: 14px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.layout {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 24px 32px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
}

.brand-tag {
  font-size: 12px;
  color: var(--pg-muted);
}

.controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.switch,
.button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 5px;
  font-size: 13px;
  color: var(--pg-muted);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s, color 0.15s;
}

.switch:hover,
.button:hover {
  background: var(--pg-hover);
  color: var(--pg-text);
}

.switch input {
  margin: 0;
  accent-color: var(--pg-accent);
}

.switch:has(input:checked) {
  color: var(--pg-text);
}

.button {
  margin-left: 4px;
  border: 1px solid var(--pg-border);
  background: var(--pg-card);
  font: inherit;
  font-size: 13px;
  box-shadow: var(--pg-shadow);
}

.panes {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 16px;
  align-items: start;
}

/* No overflow: hidden here — editor overlays (slash menu, toolbar) must not be clipped. */
.card {
  background: var(--pg-card);
  border: 1px solid var(--pg-border);
  border-radius: 8px;
  box-shadow: var(--pg-shadow);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 16px;
  border-bottom: 1px solid var(--pg-divider);
  font-size: 12px;
  font-weight: 500;
  color: var(--pg-muted);
}

.card-meta {
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

.editor {
  min-height: 480px;
}

/* Match the card's bottom corners, since the card cannot clip its children. */
.editor .milkdown {
  border-radius: 0 0 8px 8px;
}

.output {
  margin: 0;
  padding: 16px;
  min-height: 480px;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-break: break-word;
  font: 12.5px/1.6 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
  color: var(--pg-text);
}

@media (max-width: 720px) {
  .layout {
    padding: 12px 12px 24px;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .controls {
    flex-wrap: wrap;
    margin-left: -10px;
  }

  .panes {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
