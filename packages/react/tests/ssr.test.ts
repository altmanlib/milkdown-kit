// @vitest-environment node
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, it } from 'vitest'

// The editor only runs in browsers, but importing it during SSR must not throw.
it('can be imported without a DOM', async () => {
  const react = await import('../src')
  expect(react.MdEditor).toBeDefined()
  expect(typeof document).toBe('undefined')
})

// Effects do not run on the server, so only the empty host element is rendered.
it('renders only the host element on the server', async () => {
  const { MdEditor } = await import('../src')
  expect(renderToString(createElement(MdEditor, { className: 'custom' }))).toBe(
    '<div class="md-editor-host custom"></div>',
  )
})
