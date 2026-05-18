import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  // Explicitly root this config to the ghl-mcp-server directory so Vite
  // does not walk up into the parent Next.js project and load its postcss config.
  root: resolve(__dirname),
  test: {
    environment: 'node',
    globals: true,
    restoreMocks: true,
    // Run tests from this directory only
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
    },
  },
});
