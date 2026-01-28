/**
 * 模拟器核心类测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Simulator } from '../simulator';
import type { MiniProgramProject, SimulatorConfig } from '../types';

// Mock项目数据
const mockProject: MiniProgramProject = {
  id: 'test-project',
  name: '测试项目',
  version: '1.0.0',
  appId: 'wx1234567890',
  config: {
    window: {
      navigationBarTitleText: '测试',
    },
  },
  pages: [
    {
      id: 'page-1',
      name: '首页',
      path: 'pages/index/index',
      config: {},
      components: [],
      data: {},
      variables: [],
      lifecycleEvents: [],
      customEvents: [],
    },
  ],
  globalComponents: [],
  resources: [],
  globalVariables: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Simulator', () => {
  let simulator: Simulator;
  let config: SimulatorConfig;

  beforeEach(() => {
    config = {
      port: 9999,
      host: 'localhost',
      autoOpen: false,
    };
    simulator = new Simulator(config);
  });

  afterEach(async () => {
    if (simulator.getState().status === 'running') {
      await simulator.stop();
    }
  });

  describe('构造函数', () => {
    it('应该使用默认配置创建实例', () => {
      const sim = new Simulator();
      expect(sim).toBeDefined();
      expect(sim.getState().status).toBe('idle');
    });

    it('应该使用自定义配置创建实例', () => {
      const sim = new Simulator({
        port: 8888,
        host: '0.0.0.0',
      });
      expect(sim).toBeDefined();
    });
  });

  describe('load', () => {
    it('应该能够加载项目', async () => {
      const started = vi.fn();
      simulator.on('started', started);

      await simulator.load(mockProject);

      expect(simulator.getState().status).toBe('running');
      expect(simulator.getState().project).toBe(mockProject);
      expect(started).toHaveBeenCalled();
    });

    it('应该启动预览服务器', async () => {
      await simulator.load(mockProject);

      const url = simulator.getURL();
      expect(url).toBeTruthy();
      expect(url).toContain('localhost');
      expect(url).toContain('9999');
    });

    it('应该触发started事件', async () => {
      const started = vi.fn();
      simulator.on('started', started);

      await simulator.load(mockProject);

      expect(started).toHaveBeenCalledOnce();
    });

    it('加载失败时应该触发error事件', async () => {
      const errorHandler = vi.fn();
      simulator.on('error', errorHandler);

      // 使用无效项目测试错误处理
      const invalidProject = { ...mockProject, pages: [] as any };

      try {
        await simulator.load(invalidProject);
      } catch (error) {
        // 预期会抛出错误
      }

      expect(simulator.getState().status).toBe('error');
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await simulator.load(mockProject);
    });

    it('应该能够停止模拟器', async () => {
      await simulator.stop();

      expect(simulator.getState().status).toBe('stopped');
      expect(simulator.getState().project).toBeNull();
    });

    it('应该触发stopped事件', async () => {
      const stopped = vi.fn();
      simulator.on('stopped', stopped);

      await simulator.stop();

      expect(stopped).toHaveBeenCalledOnce();
    });

    it('停止后URL应该为null', async () => {
      await simulator.stop();

      expect(simulator.getURL()).toBeNull();
    });
  });

  describe('reload', () => {
    beforeEach(async () => {
      await simulator.load(mockProject);
    });

    it('应该能够重新加载项目', async () => {
      const oldUrl = simulator.getURL();
      await simulator.reload();

      expect(simulator.getState().status).toBe('running');
      expect(simulator.getURL()).toBeTruthy();
    });

    it('未加载项目时reload应该抛出错误', async () => {
      const sim = new Simulator(config);

      await expect(sim.reload()).rejects.toThrow('未加载项目');
    });
  });

  describe('refresh', () => {
    beforeEach(async () => {
      await simulator.load(mockProject);
    });

    it('应该能够刷新预览页面', () => {
      expect(() => simulator.refresh()).not.toThrow();
    });

    it('未启动时refresh应该抛出错误', () => {
      const sim = new Simulator(config);

      expect(() => sim.refresh()).toThrow('服务器未启动');
    });
  });

  describe('setDevice', () => {
    beforeEach(async () => {
      await simulator.load(mockProject);
    });

    it('应该能够切换设备', () => {
      const newDevice = {
        name: 'iPad',
        platform: 'ios' as const,
        viewport: { width: 768, height: 1024 },
        devicePixelRatio: 2,
        systemInfo: {} as any,
      };

      expect(() => simulator.setDevice(newDevice)).not.toThrow();
    });

    it('未初始化时setDevice应该抛出错误', () => {
      const sim = new Simulator(config);

      expect(() => sim.setDevice({} as any)).toThrow(
        '设备模拟器未初始化'
      );
    });
  });

  describe('getState', () => {
    it('应该返回当前状态', () => {
      const state = simulator.getState();

      expect(state).toBeDefined();
      expect(state.status).toBe('idle');
      expect(state.project).toBeNull();
      expect(state.clients).toEqual([]);
    });

    it('加载后状态应该更新', async () => {
      await simulator.load(mockProject);
      const state = simulator.getState();

      expect(state.status).toBe('running');
      expect(state.project).toBe(mockProject);
    });
  });

  describe('事件监听', () => {
    it('应该能够添加事件监听器', () => {
      const listener = vi.fn();
      simulator.on('test-event', listener);

      // 手动触发事件(模拟)
      (simulator as any).emit('test-event', 'data');

      expect(listener).toHaveBeenCalledWith('data');
    });

    it('应该能够移除事件监听器', () => {
      const listener = vi.fn();
      simulator.on('test-event', listener);
      simulator.off('test-event', listener);

      // 手动触发事件
      (simulator as any).emit('test-event');

      expect(listener).not.toHaveBeenCalled();
    });

    it('应该支持多个监听器', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      simulator.on('test-event', listener1);
      simulator.on('test-event', listener2);

      (simulator as any).emit('test-event');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('状态转换', () => {
    it('状态应该正确转换: idle -> starting -> running', async () => {
      const states: string[] = [];
      simulator.on('status-change', (status: string) => {
        states.push(status);
      });

      await simulator.load(mockProject);

      expect(states).toContain('starting');
      expect(states).toContain('running');
    });

    it('状态应该正确转换: running -> stopped', async () => {
      await simulator.load(mockProject);

      const states: string[] = [];
      simulator.on('status-change', (status: string) => {
        states.push(status);
      });

      await simulator.stop();

      expect(states).toContain('stopped');
    });
  });

  describe('错误处理', () => {
    it('应该捕获并记录错误', async () => {
      const errorHandler = vi.fn();
      simulator.on('error', errorHandler);

      // 触发一个错误
      try {
        await simulator.load(null as any);
      } catch (error) {
        // 预期错误
      }

      expect(simulator.getState().errors.length).toBeGreaterThan(0);
    });

    it('错误应该包含完整信息', async () => {
      try {
        await simulator.load(null as any);
      } catch (error) {
        // 预期错误
      }

      const errors = simulator.getState().errors;
      expect(errors.length).toBeGreaterThan(0);

      const error = errors[0];
      expect(error.type).toBeDefined();
      expect(error.code).toBeDefined();
      expect(error.message).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('配置合并', () => {
    it('应该正确合并默认配置和自定义配置', () => {
      const customConfig: SimulatorConfig = {
        port: 7777,
        hotReload: {
          batchDelay: 500,
        },
      };

      const sim = new Simulator(customConfig);

      // 验证自定义配置生效
      expect((sim as any).config.port).toBe(7777);

      // 验证默认配置保留
      expect((sim as any).config.host).toBe('localhost');
      expect((sim as any).config.hotReload.enabled).toBe(true);
    });
  });
});
