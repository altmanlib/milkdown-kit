import { fileURLToPath } from 'node:url'

// Resolves workspace packages to their sources in tests and the playground, so that
// neither depends on a previous build. Keep in sync with `paths` in tsconfig.json.
export const workspaceAlias = [
  {
    find: /^@altmanlib\/milkdown-kit$/,
    replacement: fileURLToPath(new URL('packages/core/src/index.ts', import.meta.url)),
  },
  {
    find: /^@altmanlib\/milkdown-kit\/style\.css$/,
    replacement: fileURLToPath(new URL('packages/core/src/theme/style.css', import.meta.url)),
  },
]
