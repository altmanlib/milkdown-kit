// Bundles the built core package the way a consumer would (Vite, production) and checks
// the gzip size of what loads up front against the limits below. Run after `bun run build`.
// Lazily loaded chunks (code block language grammars) are reported but not limited.
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'

import { build, type Rollup } from 'vite'

const root = resolve(import.meta.dirname, '..')
const core = resolve(root, 'packages/core/dist')

// Limits in gzip bytes: the 2026-09-25 baseline (JS 367,993, CSS 7,633; Milkdown 7.22.1)
// plus about 10% headroom.
// Raising a limit is a deliberate decision; record why in the commit message.
const LIMITS = {
  js: 405_000,
  css: 8_500,
}

const ENTRY = '\0size-entry'

const result = (await build({
  configFile: false,
  logLevel: 'warn',
  root,
  resolve: {
    alias: [
      { find: /^@altmanlib\/milkdown-kit$/, replacement: resolve(core, 'index.js') },
      { find: /^@altmanlib\/milkdown-kit\/style\.css$/, replacement: resolve(core, 'style.css') },
    ],
  },
  plugins: [
    {
      name: 'size-entry',
      resolveId: (id) => (id === ENTRY ? id : undefined),
      load: (id) =>
        id === ENTRY
          ? `import '@altmanlib/milkdown-kit/style.css'
             import { createEditor } from '@altmanlib/milkdown-kit'
             createEditor(document.body)`
          : undefined,
    },
  ],
  build: {
    write: false,
    rollupOptions: { input: ENTRY },
  },
})) as Rollup.RollupOutput

const chunks = result.output.filter((item): item is Rollup.OutputChunk => item.type === 'chunk')
const assets = result.output.filter((item): item is Rollup.OutputAsset => item.type === 'asset')
const gzip = (code: string | Uint8Array) => gzipSync(code).length

// Everything reachable from the entry through static imports loads up front.
const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
const initial = new Set<string>()
const queue = chunks.filter((chunk) => chunk.isEntry).map((chunk) => chunk.fileName)
while (queue.length > 0) {
  const name = queue.pop()!
  if (initial.has(name)) continue
  initial.add(name)
  queue.push(...(byName.get(name)?.imports ?? []))
}

const js = [...initial].reduce((sum, name) => sum + gzip(byName.get(name)!.code), 0)
const lazy = chunks.filter((chunk) => !initial.has(chunk.fileName))
const lazyJs = lazy.reduce((sum, chunk) => sum + gzip(chunk.code), 0)
const css = assets
  .filter((asset) => asset.fileName.endsWith('.css'))
  .reduce((sum, asset) => sum + gzip(asset.source), 0)

// KaTeX only ends up in the bundle when the @milkdown/crepe root entry is imported.
const hasKatex = chunks.some((chunk) => chunk.moduleIds.some((id) => id.includes('/katex/')))

const rows: [string, number, number | undefined][] = [
  ['JS loaded up front', js, LIMITS.js],
  [`JS loaded lazily (${lazy.length} chunks)`, lazyJs, undefined],
  ['CSS', css, LIMITS.css],
]
const failures: string[] = []
for (const [label, size, limit] of rows) {
  const status = limit === undefined ? '' : size > limit ? 'OVER' : 'ok'
  console.log(`${label.padEnd(36)} ${String(size).padStart(9)} B  ${limit ? `limit ${limit}` : ''} ${status}`)
  if (limit !== undefined && size > limit) failures.push(`${label}: ${size} B exceeds ${limit} B`)
}
if (hasKatex) failures.push('KaTeX is bundled: something imports the @milkdown/crepe root entry')

if (failures.length > 0) {
  for (const failure of failures) console.error(`[check-size] ${failure}`)
  process.exit(1)
}
console.log('[check-size] OK')
