import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

import { workspaceAlias } from './workspace-alias.ts'

export default defineConfig({
  plugins: [Vue()],
  resolve: { alias: workspaceAlias },
  test: {
    environment: 'happy-dom',
    include: ['packages/*/tests/**/*.test.ts'],
    setupFiles: ['vitest.setup.ts'],
  },
})
