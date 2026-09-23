// Fixes two upstream data-loss issues in Markdown <-> image conversion (Milkdown 7.22.1):
//
// 1. remark emits `title: null` for images without a title, but both the `image` and
//    `image-block` schemas validate `title`/`caption` as string. The node fails validation
//    and is silently dropped, so `![alt](url)` disappears from the document.
// 2. Crepe's `image-block` stores its resize ratio in the alt text and discards the real
//    alt, so `![alt](url)` is written back as `![1.00](url)`.
import { imageBlockSchema } from '@milkdown/kit/component/image-block'
import type { Editor } from '@milkdown/kit/core'
import { $remark } from '@milkdown/kit/utils'

interface MdastNode {
  type: string
  alt?: string | null
  title?: string | null
  children?: MdastNode[]
}

function normalizeImages(node: MdastNode): void {
  if (node.type === 'image' || node.type === 'image-block') {
    node.alt ??= ''
    node.title ??= ''
  }
  node.children?.forEach(normalizeImages)
}

const remarkNormalizeImages = $remark('md-editor-normalize-images', () => () => normalizeImages)

// Crepe writes ratios as fixed-point numbers, e.g. "0.50". Only such alts are ratios.
const RATIO_PATTERN = /^\d+(?:\.\d+)?$/

function parseRatio(alt: string): number | undefined {
  if (!RATIO_PATTERN.test(alt)) return undefined
  const ratio = Number(alt)
  return ratio > 0 ? ratio : undefined
}

/**
 * Alt text and resize ratio share the Markdown alt field:
 * - parse: a numeric alt is a ratio (Crepe convention); anything else is kept as alt text
 * - serialize: alt text wins; the ratio is written only when there is no alt and it is not 1
 */
function preserveImageBlockAlt(editor: Editor): void {
  editor.config((ctx) => {
    ctx.update(imageBlockSchema.key, (factory) => (innerCtx) => {
      const schema = factory(innerCtx)
      return {
        ...schema,
        attrs: { ...schema.attrs, alt: { default: '', validate: 'string' } },
        parseMarkdown: {
          match: schema.parseMarkdown.match,
          runner: (state, node, type) => {
            const alt = typeof node.alt === 'string' ? node.alt : ''
            const ratio = parseRatio(alt)
            state.addNode(type, {
              src: typeof node.url === 'string' ? node.url : '',
              caption: typeof node.title === 'string' ? node.title : '',
              ratio: ratio ?? 1,
              alt: ratio === undefined ? alt : '',
            })
          },
        },
        toMarkdown: {
          match: schema.toMarkdown.match,
          runner: (state, node) => {
            const { src, caption, ratio, alt } = node.attrs as {
              src: string
              caption: string
              ratio: number
              alt: string
            }
            state.openNode('paragraph')
            state.addNode('image', undefined, undefined, {
              url: src,
              title: caption || null,
              alt: alt || (ratio !== 1 ? ratio.toFixed(2) : ''),
            })
            state.closeNode()
          },
        },
      }
    })
  })
}

export function applyImageMarkdownFixes(editor: Editor, imageBlockEnabled: boolean): void {
  editor.use(remarkNormalizeImages)
  if (imageBlockEnabled) preserveImageBlockAlt(editor)
}
