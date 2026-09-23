import { describe, expect, it } from 'vitest'

import { mount } from './helpers'

// Each sample is already in the serializer's canonical form, so the round trip
// (markdown -> editor -> getMarkdown) must return it unchanged.
const samples: Record<string, string> = {
  'headings': '# H1\n\n## H2\n\n### H3\n',
  'paragraph with marks': 'Plain **bold** *italic* ~~strike~~ `code` [link](https://example.com)\n',
  'bullet list': '* one\n* two\n  * nested\n',
  'ordered list': '1. one\n2. two\n',
  'task list': '* [ ] todo\n* [x] done\n',
  'blockquote': '> quoted\n',
  'code block': '```ts\nconst answer = 42\n```\n',
  'table': '| A | B |\n| - | - |\n| 1 | 2 |\n',
  'image block without title': '![alt](https://example.com/a.png)\n',
  'image block with caption': '![alt](https://example.com/a.png "caption")\n',
  'image block with ratio': '![0.50](https://example.com/a.png)\n',
  'image block without alt': '![](https://example.com/a.png)\n',
  'inline image without title': 'text ![icon](https://example.com/i.png) more\n',
  'inline image with title': 'text ![icon](https://example.com/i.png "t") more\n',
  'divider': 'before\n\n***\n\nafter\n',
  'chinese text': '中文段落，包含**粗体**和`代码`。\n',
}

describe('image markdown normalization', () => {
  it('keeps surrounding content when an image has no title', async () => {
    const markdown = 'before\n\n![a](https://example.com/a.png)\n\nafter\n'
    const { editor } = await mount({ defaultValue: markdown })
    expect(editor.getMarkdown()).toBe(markdown)
    await editor.destroy()
  })

  it('keeps images when the image-block feature is disabled', async () => {
    const markdown = '![a](https://example.com/a.png)\n'
    const { editor } = await mount({ defaultValue: markdown, features: { 'image-block': false } })
    expect(editor.getMarkdown()).toBe(markdown)
    await editor.destroy()
  })
})

describe('markdown round trip', () => {
  for (const [name, markdown] of Object.entries(samples)) {
    it(name, async () => {
      const { editor } = await mount({ defaultValue: markdown })
      expect(editor.getMarkdown()).toBe(markdown)
      await editor.destroy()
    })
  }
})
