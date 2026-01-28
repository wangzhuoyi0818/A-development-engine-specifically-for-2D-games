import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      include: ['*.ts', '!*.test.ts'],
      exclude: ['node_modules', 'dist'],
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
    },
  },
});
