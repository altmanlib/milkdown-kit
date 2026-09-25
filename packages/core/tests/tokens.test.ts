// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { expect, it } from 'vitest'

const read = (path: string) => readFile(resolve(import.meta.dirname, path), 'utf8')

const collect = (source: string, pattern: RegExp) => [...new Set(source.match(pattern))].sort()

// docs/reference/api.md §5 lists every public token; keep it in sync with tokens.css.
it('documents every public CSS token', async () => {
  const css = await read('../src/theme/tokens.css')
  const doc = await read('../../../docs/reference/api.md')
  const defined = collect(css, /--md-editor-[a-z-]+(?=:)/g)
  const section = doc.slice(doc.indexOf('## 5.'), doc.indexOf('## 6.'))
  expect(collect(section, /--md-editor-[a-z-]+/g)).toEqual(defined)
})
