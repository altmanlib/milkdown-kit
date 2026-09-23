import { afterEach } from 'vitest'

afterEach(() => {
  // Skipped in tests that run in the node environment.
  if (typeof document !== 'undefined') document.body.innerHTML = ''
})
