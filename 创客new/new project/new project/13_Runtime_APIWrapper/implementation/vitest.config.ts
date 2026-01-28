import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000, // 增加超时时间为15秒
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
        'wx-api/device.ts',
        'wx-api/file.ts',
        'wx-api/media.ts',
        'wx-api/navigation.ts',
        'wx-api/ui.ts',
        'wx-api/location.ts',
        'wx-api/payment.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 75,
        branches: 80,
        statements: 85,
      },
    },
  },
});
