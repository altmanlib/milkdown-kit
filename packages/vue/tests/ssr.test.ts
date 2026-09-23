// @vitest-environment node
import { expect, it } from 'vitest'

// The editor only runs in browsers, but importing it during SSR must not throw.
it('can be imported without a DOM', async () => {
  const vue = await import('../src')
  expect(vue.MdEditor).toBeDefined()
  expect(typeof document).toBe('undefined')
})
