import { describe, expect, it, vi } from 'vitest'

import { resolveFeatures } from '../src/core/features'
import { mount, waitForChange } from './helpers'

describe('createEditor', () => {
  it('mounts into an owned container and removes it on destroy', async () => {
    const { root, editor } = await mount({ defaultValue: '# Hi\n' })
    const container = root.querySelector(':scope > .md-editor')
    expect(container).not.toBeNull()
    expect(container!.querySelector('.milkdown')).not.toBeNull()

    await editor.destroy()
    expect(root.children).toHaveLength(0)
    // Idempotent
    await editor.destroy()
  })

  it('reflects options as data attributes for styling', async () => {
    const { root } = await mount({ uploadImage: async () => 'u', codeBlockTools: 'hover' })
    const container = root.querySelector<HTMLElement>('.md-editor')!
    expect(container.dataset.upload).toBe('enabled')
    expect(container.dataset.codeTools).toBe('hover')
  })

  it('defaults to upload disabled and always-visible code tools', async () => {
    const { root } = await mount()
    const container = root.querySelector<HTMLElement>('.md-editor')!
    expect(container.dataset.upload).toBe('disabled')
    expect(container.dataset.codeTools).toBe('always')
  })

  it('setMarkdown replaces the document without emitting onChange', async () => {
    const onChange = vi.fn()
    const { editor } = await mount({ defaultValue: 'old\n', onChange })
    editor.setMarkdown('new\n')
    expect(editor.getMarkdown()).toBe('new\n')
    await waitForChange()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('emits onChange for user edits', async () => {
    const onChange = vi.fn()
    const { root } = await mount({ defaultValue: 'a\n', onChange })
    // Simulate typing: ProseMirror's DOM observer picks up the text change.
    const paragraph = root.querySelector('.ProseMirror p')!
    paragraph.textContent = 'ab'
    await waitForChange(400)
    expect(onChange).toHaveBeenCalledWith('ab\n')
  })

  it('toggles readonly', async () => {
    const { root, editor } = await mount({ readonly: true })
    const view = root.querySelector('.ProseMirror')!
    expect(view.getAttribute('contenteditable')).toBe('false')
    editor.setReadonly(false)
    expect(view.getAttribute('contenteditable')).toBe('true')
  })

  it('applies the zh-CN placeholder by default and allows overriding it', async () => {
    const zh = await mount()
    expect(zh.root.innerHTML).toContain('输入 / 插入内容')
    const custom = await mount({ placeholder: 'Write here' })
    expect(custom.root.innerHTML).toContain('Write here')
  })
})

describe('features', () => {
  it('maps public names onto Crepe features and keeps cursor and list-item on', () => {
    expect(resolveFeatures({ 'block-menu': false, 'code-block': false })).toEqual({
      'cursor': true,
      'list-item': true,
      'link-tooltip': true,
      'image-block': true,
      'block-edit': false,
      'placeholder': true,
      'toolbar': true,
      'code-mirror': false,
      'table': true,
    })
  })

  it('turns off the features it is told to', async () => {
    const markdown = '```js\nx\n```\n\n| a |\n|---|\n| b |\n'
    const on = await mount({ defaultValue: markdown })
    expect(on.root.querySelector('.milkdown-code-block')).not.toBeNull()
    expect(on.root.querySelector('.milkdown-table-block')).not.toBeNull()
    expect(on.root.querySelector('.milkdown-toolbar')).not.toBeNull()

    const off = await mount({
      defaultValue: markdown,
      features: { 'code-block': false, 'table': false, 'toolbar': false },
    })
    expect(off.root.querySelector('.milkdown-code-block')).toBeNull()
    expect(off.root.querySelector('.milkdown-table-block')).toBeNull()
    expect(off.root.querySelector('.milkdown-toolbar')).toBeNull()
    // Content is kept when the rich block views are off.
    expect(off.editor.getMarkdown()).toContain('| a |')
  })
})
