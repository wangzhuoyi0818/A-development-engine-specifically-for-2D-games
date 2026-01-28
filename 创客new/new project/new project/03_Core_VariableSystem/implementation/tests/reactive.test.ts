/**
 * ReactiveManager 类测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReactiveManager, createReactive } from '../reactive';
import { VariablesContainer } from '../variables-container';

describe('ReactiveManager Class', () => {
  let container: VariablesContainer;
  let reactive: ReactiveManager;

  beforeEach(() => {
    container = VariablesContainer.createGlobalContainer();
    reactive = new ReactiveManager(container);

    // 设置测试数据
    container.insertNew('count').setValue(0);
    container.insertNew('name').setString('User');

    const user = container.insertNew('user');
    user.castTo('Structure');
    user.getChild('age').setValue(25);
    user.getChild('score').setValue(100);
  });

  // ============================================================================
  // Watch 测试
  // ============================================================================

  describe('Watch', () => {
    it('should watch variable changes', (done) => {
      const callback = vi.fn();
      reactive.watch('count', callback);

      reactive.set('count', 1);
      expect(callback).toHaveBeenCalledWith(1, 0);

      reactive.set('count', 2);
      expect(callback).toHaveBeenCalledWith(2, 1);
      expect(callback).toHaveBeenCalledTimes(2);

      done();
    });

    it('should watch nested properties', (done) => {
      const callback = vi.fn();
      reactive.watch('user.age', callback);

      reactive.set('user.age', 30);
      expect(callback).toHaveBeenCalledWith(30, 25);

      done();
    });

    it('should support immediate callback', (done) => {
      const callback = vi.fn();
      reactive.watch('count', callback, { immediate: true });

      expect(callback).toHaveBeenCalledWith(0, undefined);

      done();
    });

    it('should support deep watching', (done) => {
      const callback = vi.fn();
      reactive.watch('user', callback, { deep: true });

      reactive.set('user.age', 30);
      expect(callback).toHaveBeenCalled();

      done();
    });

    it('should return unwatch function', (done) => {
      const callback = vi.fn();
      const watcher = reactive.watch('count', callback);

      reactive.set('count', 1);
      expect(callback).toHaveBeenCalledTimes(1);

      watcher.unwatch();

      reactive.set('count', 2);
      expect(callback).toHaveBeenCalledTimes(1); // 不会增加

      done();
    });

    it('should support context binding', (done) => {
      const context = { name: 'test' };
      let callContext: any = null;

      const callback = function (newVal: any) {
        callContext = this;
      };

      reactive.watch('count', callback, { context });
      reactive.set('count', 1);

      expect(callContext).toBe(context);
      done();
    });

    it('should unwatchAll', (done) => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      reactive.watch('count', callback1);
      reactive.watch('name', callback2);

      reactive.unwatchAll();

      reactive.set('count', 1);
      reactive.set('name', 'NewUser');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      done();
    });

    it('should get watchers for path', () => {
      const callback = vi.fn();
      reactive.watch('count', callback);

      const watchers = reactive.getWatchersForPath('count');
      expect(watchers.length).toBe(1);
    });

    it('should get watcher count', () => {
      reactive.watch('count', () => {});
      reactive.watch('name', () => {});
      reactive.watch('user.age', () => {});

      expect(reactive.getWatcherCount()).toBe(3);
    });
  });

  // ============================================================================
  // Computed Property 测试
  // ============================================================================

  describe('Computed Properties', () => {
    it('should define and get computed property', () => {
      reactive.defineComputed('doubled', () => {
        const count = reactive.get('count') as number;
        return count * 2;
      }, ['count']);

      reactive.set('count', 5);
      expect(reactive.getComputed('doubled')).toBe(10);
    });

    it('should cache computed value', () => {
      let callCount = 0;
      reactive.defineComputed('expensive', () => {
        callCount++;
        return reactive.get('count');
      }, ['count']);

      reactive.getComputed('expensive');
      reactive.getComputed('expensive');
      expect(callCount).toBe(1); // 只计算一次

      reactive.set('count', 1);
      reactive.getComputed('expensive');
      expect(callCount).toBe(2); // 依赖变化后重新计算
    });

    it('should track dependencies', () => {
      reactive.defineComputed('info', () => {
        return `${reactive.get('name')} (${reactive.get('count')})`;
      }, ['name', 'count']);

      reactive.set('name', 'NewUser');
      expect(reactive.getComputed('info')).toBe('NewUser (0)');

      reactive.set('count', 5);
      expect(reactive.getComputed('info')).toBe('NewUser (5)');
    });

    it('should remove computed property', () => {
      reactive.defineComputed('test', () => 42, []);
      expect(reactive.getComputedCount()).toBe(1);

      const success = reactive.removeComputed('test');
      expect(success).toBe(true);
      expect(reactive.getComputedCount()).toBe(0);
    });

    it('should get computed names', () => {
      reactive.defineComputed('comp1', () => 1, []);
      reactive.defineComputed('comp2', () => 2, []);
      reactive.defineComputed('comp3', () => 3, []);

      const names = reactive.getComputedNames();
      expect(names).toContain('comp1');
      expect(names).toContain('comp2');
      expect(names).toContain('comp3');
    });

    it('should throw on nonexistent computed property', () => {
      expect(() => reactive.getComputed('nonexistent')).toThrow();
    });

    it('should handle computed property errors gracefully', () => {
      reactive.defineComputed('error', () => {
        throw new Error('Computation failed');
      }, []);

      expect(() => reactive.getComputed('error')).not.toThrow();
      expect(reactive.getComputed('error')).toBe(null);
    });
  });

  // ============================================================================
  // 响应式赋值测试
  // ============================================================================

  describe('Reactive Set/Get', () => {
    it('should set and get values', () => {
      reactive.set('count', 42);
      expect(reactive.get('count')).toBe(42);
    });

    it('should trigger watchers on set', (done) => {
      const callback = vi.fn();
      reactive.watch('count', callback);

      reactive.set('count', 100);
      expect(callback).toHaveBeenCalled();

      done();
    });

    it('should handle nested set', () => {
      reactive.set('user.age', 35);
      expect(reactive.get('user.age')).toBe(35);
    });

    it('should auto-create on set', () => {
      reactive.set('new.nested.value', 42);
      expect(reactive.get('new.nested.value')).toBe(42);
    });
  });

  // ============================================================================
  // 批量更新测试
  // ============================================================================

  describe('Batch Updates', () => {
    it('should batch multiple updates', (done) => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      reactive.watch('count', callback1);
      reactive.watch('name', callback2);

      reactive.batchSet({
        count: 10,
        name: 'Batch',
      });

      // 因为是异步的,需要等待
      setTimeout(() => {
        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  // ============================================================================
  // 数据绑定测试
  // ============================================================================

  describe('Data Binding', () => {
    it('should bind source to target', (done) => {
      container.insertNew('source').setValue(100);
      container.insertNew('target').setValue(0);

      reactive.bind('source', 'target', false);

      reactive.set('source', 200);
      expect(reactive.get('target')).toBe(200);

      done();
    });

    it('should support bidirectional binding', (done) => {
      container.insertNew('a').setValue(1);
      container.insertNew('b').setValue(2);

      reactive.bind('a', 'b', true);

      reactive.set('a', 10);
      expect(reactive.get('b')).toBe(10);

      reactive.set('b', 20);
      expect(reactive.get('a')).toBe(20);

      done();
    });

    it('should unbind watchers', (done) => {
      container.insertNew('x').setValue(0);
      container.insertNew('y').setValue(0);

      const watchers = reactive.bind('x', 'y', false);

      reactive.set('x', 100);
      expect(reactive.get('y')).toBe(100);

      reactive.unbind(watchers);

      reactive.set('x', 200);
      expect(reactive.get('y')).toBe(100); // 不会改变

      done();
    });
  });

  // ============================================================================
  // 容器管理测试
  // ============================================================================

  describe('Container Management', () => {
    it('should set and get container', () => {
      const newContainer = VariablesContainer.createSceneContainer();
      reactive.setContainer(newContainer);
      expect(reactive.getContainer()).toBe(newContainer);
    });
  });

  // ============================================================================
  // 清理和调试测试
  // ============================================================================

  describe('Cleanup and Debug', () => {
    it('should dispose all watchers and computed', () => {
      reactive.watch('count', () => {});
      reactive.watch('name', () => {});
      reactive.defineComputed('comp', () => 42, []);

      expect(reactive.getWatcherCount()).toBe(2);
      expect(reactive.getComputedCount()).toBe(1);

      reactive.dispose();

      expect(reactive.getWatcherCount()).toBe(0);
      expect(reactive.getComputedCount()).toBe(0);
    });

    it('should generate debug info', () => {
      reactive.watch('count', () => {});
      reactive.defineComputed('comp', () => 42, []);

      const debug = reactive.debug();
      expect(debug).toContain('ReactiveManager Debug Info');
      expect(debug).toContain('Total Watchers: 1');
      expect(debug).toContain('Total Computed Properties: 1');
    });
  });

  // ============================================================================
  // 工厂函数测试
  // ============================================================================

  describe('Factory Function', () => {
    it('should create reactive manager', () => {
      const rm = createReactive(container);
      expect(rm).toBeInstanceOf(ReactiveManager);
      expect(rm.getContainer()).toBe(container);
    });
  });

  // ============================================================================
  // 集成测试
  // ============================================================================

  describe('Integration', () => {
    it('should handle complex reactive scenario', (done) => {
      // 定义计算属性
      reactive.defineComputed('greeting', () => {
        return `Hello, ${reactive.get('name')}!`;
      }, ['name']);

      // 监听计算属性
      const greetingCallback = vi.fn();
      reactive.watchComputed('greeting', greetingCallback);

      // 修改源数据
      reactive.set('name', 'Alice');

      setTimeout(() => {
        expect(reactive.getComputed('greeting')).toBe('Hello, Alice!');
        done();
      }, 10);
    });

    it('should handle cascading updates', (done) => {
      reactive.defineComputed('ageGroup', () => {
        const age = reactive.get('user.age') as number;
        if (age < 18) return 'Child';
        if (age < 65) return 'Adult';
        return 'Senior';
      }, ['user.age']);

      const callback = vi.fn();
      reactive.watch('user.age', callback);

      reactive.set('user.age', 30);
      expect(reactive.getComputed('ageGroup')).toBe('Adult');

      reactive.set('user.age', 70);
      expect(reactive.getComputed('ageGroup')).toBe('Senior');

      expect(callback).toHaveBeenCalledTimes(2);
      done();
    });

    it('should handle multiple dependent computed properties', () => {
      reactive.defineComputed('sum', () => {
        return (reactive.get('user.age') as number) + (reactive.get('user.score') as number);
      }, ['user.age', 'user.score']);

      reactive.defineComputed('product', () => {
        return (reactive.get('user.age') as number) * (reactive.get('user.score') as number);
      }, ['user.age', 'user.score']);

      reactive.set('user.age', 30);
      reactive.set('user.score', 200);

      expect(reactive.getComputed('sum')).toBe(230);
      expect(reactive.getComputed('product')).toBe(6000);
    });
  });
});
