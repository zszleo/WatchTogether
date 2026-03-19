import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
      exclude: ['__tests__/**', 'node_modules/**', 'templates/**', 'test-data/**', 'index.js']
    }
  }
})
