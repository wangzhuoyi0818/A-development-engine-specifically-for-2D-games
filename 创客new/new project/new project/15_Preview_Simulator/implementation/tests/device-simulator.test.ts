/**
 * 设备模拟器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeviceSimulator } from '../device-simulator';
import { DEVICE_PRESETS } from '../types';
import type { DeviceConfig, NetworkType, Location } from '../types';

describe('DeviceSimulator', () => {
  let deviceSimulator: DeviceSimulator;
  let defaultConfig: DeviceConfig;

  beforeEach(() => {
    defaultConfig = DEVICE_PRESETS['iphone-13-pro'];
    deviceSimulator = new DeviceSimulator(defaultConfig);
  });

  describe('构造函数', () => {
    it('应该使用配置创建实例', () => {
      expect(deviceSimulator).toBeDefined();
    });

    it('应该保存初始配置', () => {
      const config = deviceSimulator.getConfig();
      expect(config.name).toBe('iPhone 13 Pro');
    });
  });

  describe('getConfig', () => {
    it('应该返回当前设备配置', () => {
      const config = deviceSimulator.getConfig();

      expect(config).toBeDefined();
      expect(config.name).toBe('iPhone 13 Pro');
      expect(config.platform).toBe('ios');
      expect(config.viewport).toBeDefined();
      expect(config.systemInfo).toBeDefined();
    });

    it('应该返回配置副本', () => {
      const config1 = deviceSimulator.getConfig();
      const config2 = deviceSimulator.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('setConfig', () => {
    it('应该能够设置新配置', () => {
      const newConfig = DEVICE_PRESETS['ipad-air'];
      deviceSimulator.setConfig(newConfig);

      const config = deviceSimulator.getConfig();
      expect(config.name).toBe('iPad Air');
    });

    it('设置配置应该触发config-changed事件', () => {
      const handler = vi.fn();
      deviceSimulator.on('config-changed', handler);

      const newConfig = DEVICE_PRESETS['ipad-air'];
      deviceSimulator.setConfig(newConfig);

      expect(handler).toHaveBeenCalledWith(newConfig);
    });
  });

  describe('loadPreset', () => {
    it('应该能够加载预设配置', () => {
      deviceSimulator.loadPreset('iphone-se');

      const config = deviceSimulator.getConfig();
      expect(config.name).toBe('iPhone SE');
    });

    it('应该支持所有预设设备', () => {
      const presets = Object.keys(DEVICE_PRESETS);

      presets.forEach((preset) => {
        expect(() => {
          deviceSimulator.loadPreset(preset);
        }).not.toThrow();
      });
    });

    it('加载未知预设应该抛出错误', () => {
      expect(() => {
        deviceSimulator.loadPreset('unknown-device');
      }).toThrow('未知的设备预设');
    });
  });

  describe('getPresets', () => {
    it('应该返回所有预设配置', () => {
      const presets = DeviceSimulator.getPresets();

      expect(presets).toBeDefined();
      expect(Object.keys(presets).length).toBeGreaterThan(0);
    });

    it('应该包含常用设备', () => {
      const presets = DeviceSimulator.getPresets();

      expect(presets['iphone-13-pro']).toBeDefined();
      expect(presets['iphone-se']).toBeDefined();
      expect(presets['ipad-air']).toBeDefined();
      expect(presets['android-phone']).toBeDefined();
    });
  });

  describe('getSystemInfo', () => {
    it('应该返回系统信息', () => {
      const systemInfo = deviceSimulator.getSystemInfo();

      expect(systemInfo).toBeDefined();
      expect(systemInfo.model).toBe('iPhone 13 Pro');
      expect(systemInfo.platform).toBe('ios');
      expect(systemInfo.screenWidth).toBe(390);
      expect(systemInfo.screenHeight).toBe(844);
    });

    it('应该返回系统信息副本', () => {
      const info1 = deviceSimulator.getSystemInfo();
      const info2 = deviceSimulator.getSystemInfo();

      expect(info1).not.toBe(info2);
      expect(info1).toEqual(info2);
    });
  });

  describe('网络类型', () => {
    it('应该返回当前网络类型', () => {
      const networkType = deviceSimulator.getNetworkType();
      expect(networkType).toBe('wifi');
    });

    it('应该能够设置网络类型', () => {
      deviceSimulator.setNetworkType('4g');

      const networkType = deviceSimulator.getNetworkType();
      expect(networkType).toBe('4g');
    });

    it('设置网络类型应该触发network-changed事件', () => {
      const handler = vi.fn();
      deviceSimulator.on('network-changed', handler);

      deviceSimulator.setNetworkType('3g');

      expect(handler).toHaveBeenCalledWith('3g');
    });

    it('应该支持所有网络类型', () => {
      const types: NetworkType[] = ['wifi', '4g', '3g', '2g', 'none', 'unknown'];

      types.forEach((type) => {
        deviceSimulator.setNetworkType(type);
        expect(deviceSimulator.getNetworkType()).toBe(type);
      });
    });
  });

  describe('定位', () => {
    it('初始状态可能没有定位信息', () => {
      const ds = new DeviceSimulator(defaultConfig);
      const location = ds.getLocation();

      // 根据配置决定是否有定位
      if (defaultConfig.location) {
        expect(location).toBeDefined();
      } else {
        expect(location).toBeUndefined();
      }
    });

    it('应该能够设置定位信息', () => {
      const location: Location = {
        latitude: 39.9042,
        longitude: 116.4074,
        accuracy: 65,
      };

      deviceSimulator.setLocation(location);

      const result = deviceSimulator.getLocation();
      expect(result).toEqual(location);
    });

    it('设置定位应该触发location-changed事件', () => {
      const handler = vi.fn();
      deviceSimulator.on('location-changed', handler);

      const location: Location = {
        latitude: 31.2304,
        longitude: 121.4737,
      };

      deviceSimulator.setLocation(location);

      expect(handler).toHaveBeenCalledWith(location);
    });

    it('应该返回定位信息副本', () => {
      const location: Location = {
        latitude: 39.9042,
        longitude: 116.4074,
      };

      deviceSimulator.setLocation(location);

      const loc1 = deviceSimulator.getLocation();
      const loc2 = deviceSimulator.getLocation();

      expect(loc1).not.toBe(loc2);
      expect(loc1).toEqual(loc2);
    });
  });

  describe('getUserAgent', () => {
    it('应该生成iOS设备的User-Agent', () => {
      const userAgent = deviceSimulator.getUserAgent();

      expect(userAgent).toContain('iPhone');
      expect(userAgent).toContain('iOS');
      expect(userAgent).toContain('MicroMessenger');
    });

    it('应该生成Android设备的User-Agent', () => {
      deviceSimulator.loadPreset('android-phone');
      const userAgent = deviceSimulator.getUserAgent();

      expect(userAgent).toContain('Android');
      expect(userAgent).toContain('MicroMessenger');
    });

    it('应该使用自定义User-Agent', () => {
      const customUA = 'Custom User Agent';
      const config = { ...defaultConfig, userAgent: customUA };
      const ds = new DeviceSimulator(config);

      expect(ds.getUserAgent()).toBe(customUA);
    });
  });

  describe('convertMouseToTouch', () => {
    it('应该将鼠标事件转换为触摸事件', () => {
      const mouseEvent = {
        type: 'mousedown',
        clientX: 100,
        clientY: 200,
        pageX: 100,
        pageY: 200,
        timeStamp: 1234567890,
      };

      const touchEvent = deviceSimulator.convertMouseToTouch(mouseEvent);

      expect(touchEvent.type).toBe('touchstart');
      expect(touchEvent.touches).toHaveLength(1);
      expect(touchEvent.touches[0].clientX).toBe(100);
      expect(touchEvent.touches[0].clientY).toBe(200);
    });

    it('应该正确映射事件类型', () => {
      const testCases = [
        { mouse: 'mousedown', touch: 'touchstart' },
        { mouse: 'mousemove', touch: 'touchmove' },
        { mouse: 'mouseup', touch: 'touchend' },
      ];

      testCases.forEach(({ mouse, touch }) => {
        const mouseEvent = {
          type: mouse,
          clientX: 0,
          clientY: 0,
          pageX: 0,
          pageY: 0,
          timeStamp: 0,
        };

        const touchEvent = deviceSimulator.convertMouseToTouch(mouseEvent);
        expect(touchEvent.type).toBe(touch);
      });
    });
  });

  describe('applyToDOM', () => {
    it('应该能够应用配置到DOM', () => {
      expect(() => {
        deviceSimulator.applyToDOM();
      }).not.toThrow();
    });

    it('应该触发applied事件', () => {
      const handler = vi.fn();
      deviceSimulator.on('applied', handler);

      deviceSimulator.applyToDOM();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('事件监听', () => {
    it('应该能够添加事件监听器', () => {
      const listener = vi.fn();
      deviceSimulator.on('test-event', listener);

      (deviceSimulator as any).emit('test-event', 'data');

      expect(listener).toHaveBeenCalledWith('data');
    });

    it('应该能够移除事件监听器', () => {
      const listener = vi.fn();
      deviceSimulator.on('test-event', listener);
      deviceSimulator.off('test-event', listener);

      (deviceSimulator as any).emit('test-event');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('设备预设完整性', () => {
    it('所有预设应该包含必需字段', () => {
      const presets = DeviceSimulator.getPresets();

      Object.values(presets).forEach((preset) => {
        expect(preset.name).toBeDefined();
        expect(preset.platform).toBeDefined();
        expect(preset.viewport).toBeDefined();
        expect(preset.viewport.width).toBeGreaterThan(0);
        expect(preset.viewport.height).toBeGreaterThan(0);
        expect(preset.devicePixelRatio).toBeGreaterThan(0);
        expect(preset.systemInfo).toBeDefined();
      });
    });
  });
});
