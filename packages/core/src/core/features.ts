// Feature registry. Only Crepe feature subpaths are imported here: importing the
// `@milkdown/crepe` root entry would pull in every feature (including KaTeX).
import type { CrepeBuilder } from '@milkdown/crepe/builder'
import { blockEdit } from '@milkdown/crepe/feature/block-edit'
import { codeMirror } from '@milkdown/crepe/feature/code-mirror'
import { cursor } from '@milkdown/crepe/feature/cursor'
import { imageBlock } from '@milkdown/crepe/feature/image-block'
import { linkTooltip } from '@milkdown/crepe/feature/link-tooltip'
import { listItem } from '@milkdown/crepe/feature/list-item'
import { placeholder } from '@milkdown/crepe/feature/placeholder'
import { table } from '@milkdown/crepe/feature/table'
import { toolbar } from '@milkdown/crepe/feature/toolbar'
import type { Editor } from '@milkdown/kit/core'

import type { FeatureName } from './types'

// Order follows Crepe's own `defaultFeatures` loading order.
export const CREPE_FEATURES = [
  'cursor',
  'list-item',
  'link-tooltip',
  'image-block',
  'block-edit',
  'placeholder',
  'toolbar',
  'code-mirror',
  'table',
] as const

export type CrepeFeature = (typeof CREPE_FEATURES)[number]

// Public feature names mapped onto Crepe's. Crepe features missing here are always on.
const PUBLIC_FEATURES: Record<FeatureName, CrepeFeature> = {
  'toolbar': 'toolbar',
  'block-menu': 'block-edit',
  'code-block': 'code-mirror',
  'image-block': 'image-block',
  'table': 'table',
  'link-tooltip': 'link-tooltip',
  'placeholder': 'placeholder',
}

export function resolveFeatures(
  overrides: Partial<Record<FeatureName, boolean>> = {},
): Record<CrepeFeature, boolean> {
  const resolved = {} as Record<CrepeFeature, boolean>
  for (const name of CREPE_FEATURES) resolved[name] = true
  for (const [name, crepe] of Object.entries(PUBLIC_FEATURES) as [FeatureName, CrepeFeature][]) {
    resolved[crepe] = overrides[name] ?? true
  }
  return resolved
}

export interface FeatureConfigs {
  'cursor'?: Parameters<typeof cursor>[1]
  'list-item'?: Parameters<typeof listItem>[1]
  'link-tooltip'?: Parameters<typeof linkTooltip>[1]
  'image-block'?: Parameters<typeof imageBlock>[1]
  'block-edit'?: Parameters<typeof blockEdit>[1]
  'placeholder'?: Parameters<typeof placeholder>[1]
  'toolbar'?: Parameters<typeof toolbar>[1]
  'code-mirror'?: Parameters<typeof codeMirror>[1]
  'table'?: Parameters<typeof table>[1]
}

const FEATURES = {
  'cursor': cursor,
  'list-item': listItem,
  'link-tooltip': linkTooltip,
  'image-block': imageBlock,
  'block-edit': blockEdit,
  'placeholder': placeholder,
  'toolbar': toolbar,
  'code-mirror': codeMirror,
  'table': table,
} as const

export function applyFeatures(
  builder: CrepeBuilder,
  enabled: Record<CrepeFeature, boolean>,
  configs: FeatureConfigs,
): void {
  for (const name of CREPE_FEATURES) {
    if (!enabled[name]) continue
    const feature = FEATURES[name] as (editor: Editor, config?: unknown) => void
    builder.addFeature<unknown>(feature, configs[name])
  }
}
