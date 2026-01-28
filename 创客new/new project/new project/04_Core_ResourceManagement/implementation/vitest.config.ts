/**
 * Vitest 配置文件 - 资源管理模块
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',

    // 全局设置
    globals: true,

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90,
    },

    // 测试文件模式
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.idea'],

    // 测试超时
    testTimeout: 10000,

    // 并发
    threads: true,
    maxThreads: 4,
    minThreads: 1,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
