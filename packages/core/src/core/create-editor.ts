import { syntaxHighlighting } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { shift, size } from '@floating-ui/dom'
import { classHighlighter } from '@lezer/highlight'
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { editorViewCtx } from '@milkdown/kit/core'
import { replaceAll } from '@milkdown/kit/utils'

import { getMessages } from '../locale'
import { applyFeatures, type FeatureConfigs, resolveFeatures } from './features'
import { applyImageMarkdownFixes } from './image-markdown'
import type { EditorHandle, MdEditorOptions } from './types'

export const ROOT_CLASS = 'md-editor'

const MENU_VIEWPORT_PADDING = 8

// Keeps the slash menu inside the viewport on small screens: shift it horizontally
// and expose the available height to CSS as --md-editor-menu-available-height.
const slashMenuMiddleware = [
  shift({ padding: MENU_VIEWPORT_PADDING }),
  size({
    padding: MENU_VIEWPORT_PADDING,
    apply({ availableHeight, elements }) {
      elements.floating.style.setProperty(
        '--md-editor-menu-available-height',
        `${Math.floor(availableHeight)}px`,
      )
    },
  }),
]

const rejectUpload = (): Promise<string> =>
  Promise.reject(new Error('[md-editor] image upload is disabled: `uploadImage` is not provided'))

export async function createEditor(
  root: HTMLElement,
  options: MdEditorOptions = {},
): Promise<EditorHandle> {
  const {
    defaultValue = '',
    readonly = false,
    placeholder,
    onChange,
    uploadImage,
    features,
    locale = 'zh-CN',
    codeBlockTools = 'always',
  } = options

  const messages = getMessages(locale)
  const enabled = resolveFeatures(features)

  // Mount into an owned container so that destroy() leaves the host element untouched.
  const container = document.createElement('div')
  container.className = ROOT_CLASS
  container.dataset.upload = uploadImage ? 'enabled' : 'disabled'
  container.dataset.codeTools = codeBlockTools
  root.appendChild(container)

  const imageBlockConfig: FeatureConfigs['image-block'] = uploadImage
    ? { ...messages.features['image-block'], onUpload: uploadImage }
    : {
        ...messages.features['image-block'],
        // Crepe's default uploader creates blob: URLs, which break once persisted.
        onUpload: rejectUpload,
        inlineUploadPlaceholderText: messages.imageUrlOnlyText,
        blockUploadPlaceholderText: messages.imageUrlOnlyText,
      }

  const builder = new CrepeBuilder({ root: container, defaultValue })
  applyFeatures(builder, enabled, {
    ...messages.features,
    // Must match the handle width reserved by --md-editor-padding in style.css.
    'block-edit': {
      ...messages.features['block-edit'],
      blockHandle: { getOffset: () => 8 },
      slashMenu: { offset: 6, middleware: slashMenuMiddleware },
    },
    'code-mirror': {
      ...messages.features['code-mirror'],
      // Language grammars are loaded lazily on first use.
      languages,
      // Emit tok-* classes and color them with theme tokens, so code follows light/dark.
      extensions: [syntaxHighlighting(classHighlighter)],
    },
    'image-block': imageBlockConfig,
    'placeholder': { text: placeholder ?? messages.placeholder },
  })
  applyImageMarkdownFixes(builder.editor, enabled['image-block'])
  builder.setReadonly(readonly)
  if (onChange) {
    builder.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => onChange(markdown))
    })
  }

  try {
    await builder.create()
  } catch (error) {
    container.remove()
    throw error
  }

  let destroyed = false

  return {
    getMarkdown: () => builder.getMarkdown(),
    setMarkdown: (markdown) => {
      builder.editor.action(replaceAll(markdown, true))
    },
    setReadonly: (value) => {
      builder.setReadonly(value)
    },
    focus: () => {
      builder.editor.action((ctx) => ctx.get(editorViewCtx).focus())
    },
    destroy: async () => {
      if (destroyed) return
      destroyed = true
      await builder.destroy()
      container.remove()
    },
  }
}
