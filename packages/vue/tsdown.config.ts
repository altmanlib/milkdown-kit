import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: 'esm',
  platform: 'browser',
  dts: { vue: true },
  plugins: [Vue({ isProduction: true })],
})
