// Bundles src/theme/style.css (inlining package @imports) into dist/style.css.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

import { bundleAsync } from 'lightningcss'

const root = resolve(import.meta.dirname, '..')
const entry = resolve(root, 'src/theme/style.css')
const output = resolve(root, 'dist/style.css')
const require = createRequire(entry)

const { code } = await bundleAsync({
  filename: entry,
  minify: true,
  resolver: {
    read: (file) => readFile(file, 'utf8'),
    resolve: (specifier, from) =>
      specifier.startsWith('.') ? resolve(dirname(from), specifier) : require.resolve(specifier),
  },
})

await mkdir(dirname(output), { recursive: true })
await writeFile(output, code)
console.log(`[build-css] ${output} (${code.byteLength} bytes)`)
