// @vitest-environment node
import { expect, it } from 'vitest'

// The editor only runs in browsers, but importing it during SSR must not throw.
it('can be imported without a DOM', async () => {
  const core = await import('../src')
  expect(typeof core.createEditor).toBe('function')
  expect(typeof document).toBe('undefined')
})
