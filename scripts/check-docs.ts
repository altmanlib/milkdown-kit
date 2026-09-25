// Enforces the hard rules declared in docs/README.md §3.2:
//   1. front matter has title / type / status / updated with valid values
//   2. front matter title equals the first "# " heading
//   3. relative links resolve to existing files
//   4. deprecated docs link to a replacement at the top of the body
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

import { parse } from 'yaml'

const root = resolve(import.meta.dirname, '..')
const docsDir = join(root, 'docs')

const TYPES = new Set(['guide', 'runbook', 'reference', 'design', 'record'])
const STATUSES = new Set(['draft', 'published', 'deprecated'])
const DATE = /^\d{4}-\d{2}-\d{2}$/

async function listMarkdown(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return listMarkdown(path)
      return entry.name.endsWith('.md') ? [path] : []
    }),
  )
  return files.flat()
}

function stripCode(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
}

function checkLinks(file: string, body: string, errors: string[]): void {
  for (const match of stripCode(body).matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1]!
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue
    const path = decodeURIComponent(target.split('#')[0]!)
    if (!existsSync(resolve(dirname(file), path))) errors.push(`broken link: ${target}`)
  }
}

async function checkFile(file: string): Promise<string[]> {
  const errors: string[] = []
  const content = await readFile(file, 'utf8')
  const isIndex = file === join(docsDir, 'README.md')
  const frontMatter = /^---\n([\s\S]*?)\n---\n/.exec(content)

  // docs/README.md (the index) is outside the front matter scope.
  if (isIndex) {
    checkLinks(file, content, errors)
    return errors
  }

  if (!frontMatter) return ['missing front matter']
  const meta = (parse(frontMatter[1]!) ?? {}) as Record<string, unknown>
  const body = content.slice(frontMatter[0].length)

  if (typeof meta.title !== 'string' || !meta.title) errors.push('title is required')
  if (!TYPES.has(String(meta.type))) errors.push(`invalid type: ${String(meta.type)}`)
  if (!STATUSES.has(String(meta.status))) errors.push(`invalid status: ${String(meta.status)}`)
  // YAML parses unquoted dates as strings with the yaml package's default (core) schema.
  if (!DATE.test(String(meta.updated))) errors.push(`invalid updated: ${String(meta.updated)}`)

  const heading = /^# (.+)$/m.exec(stripCode(body))
  if (!heading) errors.push('missing "# " heading')
  else if (heading[1]!.trim() !== meta.title) {
    errors.push(`title mismatch: front matter "${String(meta.title)}" vs heading "${heading[1]!.trim()}"`)
  }

  if (meta.status === 'deprecated') {
    const intro = body.slice(heading ? body.indexOf(heading[0]) + heading[0].length : 0).trimStart()
    const firstBlock = intro.split(/\n\s*\n/)[0] ?? ''
    if (!/\[[^\]]+\]\([^)]+\.md(?:#[^)]*)?\)/.test(firstBlock)) {
      errors.push('deprecated doc must link to its replacement right after the title')
    }
  }

  checkLinks(file, body, errors)
  return errors
}

const files = await listMarkdown(docsDir)
let failed = 0
for (const file of files) {
  const errors = await checkFile(file)
  if (errors.length === 0) continue
  failed++
  for (const error of errors) console.error(`${relative(root, file)}: ${error}`)
}

if (failed > 0) {
  console.error(`\n[check-docs] ${failed} of ${files.length} file(s) failed`)
  process.exit(1)
}
console.log(`[check-docs] ${files.length} file(s) OK`)
