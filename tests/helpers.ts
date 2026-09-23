import { createEditor } from '../src'
import type { EditorHandle, MdEditorOptions } from '../src'

export async function mount(options: MdEditorOptions = {}): Promise<{
  root: HTMLElement
  editor: EditorHandle
}> {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const editor = await createEditor(root, options)
  return { root, editor }
}

/** Resolves after the listener plugin's 200ms debounce has flushed. */
export function waitForChange(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
