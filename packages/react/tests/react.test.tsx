import { act, cleanup, render, waitFor } from '@testing-library/react'
import { StrictMode, useRef, useState, type ReactElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { type EditorHandle, MdEditor } from '../src'

afterEach(() => {
  cleanup()
})

describe('MdEditor', () => {
  it('renders the initial value and exposes the handle via onReady and ref', async () => {
    let readyHandle: EditorHandle | null = null
    function Host(): ReactElement {
      const ref = useRef<EditorHandle | null>(null)
      return (
        <MdEditor
          ref={ref}
          value={'# Title\n'}
          onReady={(handle) => {
            readyHandle = handle
            expect(ref.current).toBe(handle)
          }}
        />
      )
    }
    render(<Host />)
    await waitFor(() => expect(readyHandle).not.toBeNull())
    expect(readyHandle!.getMarkdown()).toBe('# Title\n')
  })

  it('writes external value changes into the editor', async () => {
    let editor: EditorHandle | null = null
    function Host({ value }: { value: string }): ReactElement {
      return (
        <MdEditor
          value={value}
          onReady={(handle) => {
            editor = handle
          }}
        />
      )
    }
    const view = render(<Host value={'a\n'} />)
    await waitFor(() => expect(editor).not.toBeNull())
    view.rerender(<Host value={'b\n'} />)
    expect(editor!.getMarkdown()).toBe('b\n')
  })

  it('does not write back values it emitted itself', async () => {
    let setCalls = 0
    let latest = 'a\n'
    function Host(): ReactElement {
      const [value, setValue] = useState('a\n')
      return (
        <MdEditor
          value={value}
          onChange={(next) => {
            latest = next
            setValue(next)
          }}
          onReady={(handle) => {
            const original = handle.setMarkdown
            handle.setMarkdown = (markdown) => {
              setCalls++
              original(markdown)
            }
          }}
        />
      )
    }
    const view = render(<Host />)
    await waitFor(() => expect(view.container.querySelector('.ProseMirror')).toBeTruthy())

    const paragraph = view.container.querySelector('.ProseMirror p')!
    await act(async () => {
      paragraph.textContent = 'typed'
      await new Promise((resolve) => setTimeout(resolve, 400))
    })

    expect(latest).toBe('typed\n')
    expect(setCalls).toBe(0)
  })

  it('reacts to readonly changes', async () => {
    let editor: EditorHandle | null = null
    function Host({ readonly }: { readonly: boolean }): ReactElement {
      return (
        <MdEditor
          readonly={readonly}
          onReady={(handle) => {
            editor = handle
          }}
        />
      )
    }
    const view = render(<Host readonly={false} />)
    await waitFor(() => expect(editor).not.toBeNull())
    const prose = view.container.querySelector('.ProseMirror')!
    expect(prose.getAttribute('contenteditable')).toBe('true')
    view.rerender(<Host readonly={true} />)
    expect(prose.getAttribute('contenteditable')).toBe('false')
  })

  it('destroys the editor on unmount', async () => {
    let editor: EditorHandle | null = null
    const view = render(
      <MdEditor
        onReady={(handle) => {
          editor = handle
        }}
      />,
    )
    await waitFor(() => expect(editor).not.toBeNull())
    const host = view.container.firstElementChild as HTMLElement
    expect(host.querySelector('.md-editor')).toBeTruthy()
    view.unmount()
    await act(async () => {
      await Promise.resolve()
    })
    expect(host.querySelector('.md-editor')).toBeNull()
  })

  it('cleans up when unmounted before the editor is ready', async () => {
    const view = render(<MdEditor />)
    const host = view.container.firstElementChild as HTMLElement
    view.unmount()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
    expect(host.querySelector('.md-editor')).toBeNull()
  })

  it('puts className and style on the host element', async () => {
    let editor: EditorHandle | null = null
    const view = render(
      <MdEditor
        className="custom"
        style={{ height: '100px' }}
        onReady={(handle) => {
          editor = handle
        }}
      />,
    )
    await waitFor(() => expect(editor).not.toBeNull())
    const host = view.container.firstElementChild as HTMLElement
    expect(host.className).toBe('md-editor-host custom')
    expect(host.style.height).toBe('100px')
  })

  it('keeps a single editor under StrictMode', async () => {
    let editor: EditorHandle | null = null
    const view = render(
      <StrictMode>
        <MdEditor
          onReady={(handle) => {
            editor = handle
          }}
        />
      </StrictMode>,
    )
    await waitFor(() => expect(editor).not.toBeNull())
    // Let the instance from the discarded first mount finish creating and destroy itself.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
    expect(view.container.querySelectorAll('.md-editor')).toHaveLength(1)
  })

  it('starts from defaultValue when value is omitted', async () => {
    let editor: EditorHandle | null = null
    render(
      <MdEditor
        defaultValue={'# Draft\n'}
        onReady={(handle) => {
          editor = handle
        }}
      />,
    )
    await waitFor(() => expect(editor).not.toBeNull())
    expect(editor!.getMarkdown()).toBe('# Draft\n')
  })

  it('prefers value over defaultValue', async () => {
    let editor: EditorHandle | null = null
    render(
      <MdEditor
        value={'from value\n'}
        defaultValue={'from default\n'}
        onReady={(handle) => {
          editor = handle
        }}
      />,
    )
    await waitFor(() => expect(editor).not.toBeNull())
    expect(editor!.getMarkdown()).toBe('from value\n')
  })

  it('keeps uncontrolled content across re-renders', async () => {
    let editor: EditorHandle | null = null
    function Host({ defaultValue }: { defaultValue: string }): ReactElement {
      return (
        <MdEditor
          defaultValue={defaultValue}
          onReady={(handle) => {
            editor = handle
          }}
        />
      )
    }
    const view = render(<Host defaultValue={'a\n'} />)
    await waitFor(() => expect(editor).not.toBeNull())
    editor!.setMarkdown('edited\n')
    // defaultValue is creation-time only; changing it or re-rendering must not reset content.
    view.rerender(<Host defaultValue={'b\n'} />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(editor!.getMarkdown()).toBe('edited\n')
  })
})
