import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { workspaceAlias } from '../workspace-alias.ts'

export default defineConfig({
  root: import.meta.dirname,
  plugins: [Vue()],
  resolve: { alias: workspaceAlias },
})
