import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.{ts,tsx}'],
    // A test that forgets to assert is a test that cannot fail.
    expect: { requireAssertions: true },
  },
})
