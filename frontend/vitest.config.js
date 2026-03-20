import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.{js,ts}', 'src/**/*.test.{js,ts}'],
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**'],
    env: {
      VITE_API_BASE_URL: 'http://localhost:18080'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
      exclude: ['**/test/utils/**','**/node_modules/**', '**/dist/**', '**/src/main.js', '**/src/App.vue', '**/scripts/**']
    }
  }
})
