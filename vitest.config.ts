import React from '@vitejs/plugin-react'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

import { workspaceAlias } from './workspace-alias.ts'

export default defineConfig({
  plugins: [Vue(), React()],
  resolve: { alias: workspaceAlias },
  test: {
    environment: 'happy-dom',
    include: ['packages/*/tests/**/*.test.ts', 'packages/*/tests/**/*.test.tsx'],
    setupFiles: ['vitest.setup.ts'],
  },
})
