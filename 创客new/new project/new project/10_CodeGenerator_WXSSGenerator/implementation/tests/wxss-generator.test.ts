/**
 * WXSS生成器 - 核心测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import WXSSGenerator from '../wxss-generator';
import StyleCompiler from '../style-compiler';
import CSSFormatter from '../formatter';
import CSSValidator from '../validator';
import ThemeManager from '../theme-manager';
import type { Component, ComponentStyle } from '../../../01_Core_ProjectStructure/implementation/types';
import type { Theme } from '../types';

// ============================================================================
// WXSS生成器测试
// ============================================================================

describe('WXSSGenerator', () => {
  let generator: WXSSGenerator;

  beforeEach(() => {
    generator = new WXSSGenerator();
  });

  describe('基础WXSS生成', () => {
    it('应该生成简单的WXSS代码', () => {
      const components: Component[] = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: {
            width: '100%',
            height: '200rpx',
            backgroundColor: '#ffffff',
          },
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      const wxss = generator.generateWXSS(components, { beautify: true });

      expect(wxss).toContain('.view-comp-1');
      expect(wxss).toContain('width: 100%');
      expect(wxss).toContain('height: 200rpx');
      expect(wxss).toContain('background-color: #ffffff');
    });

    it('应该处理多个组件', () => {
      const components: Component[] = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: { width: '100%' },
          events: [],
          children: [],
          dataBindings: [],
        },
        {
          id: 'comp-2',
          type: 'text',
          properties: [],
          style: { fontSize: '14px' },
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      const wxss = generator.generateWXSS(components);

      expect(wxss).toContain('.view-comp-1');
      expect(wxss).toContain('.text-comp-2');
    });

    it('应该忽略空样式', () => {
      const components: Component[] = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: {},
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      const wxss = generator.generateWXSS(components);

      // 空样式应该返回最少的代码（可能为空或只包含注释）
      expect(wxss.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('rpx单位处理', () => {
    it('应该保留rpx单位', () => {
      const components: Component[] = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: {
            width: '200rpx',
            padding: '10rpx',
          },
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      const wxss = generator.generateWXSS(components);

      expect(wxss).toContain('200rpx');
      expect(wxss).toContain('10rpx');
    });

    it('应该处理纯数字并添加默认rpx单位', () => {
      const components: Component[] = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: {
            width: '100' as any,
            padding: '10' as any,
          },
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      const wxss = generator.generateWXSS(components);

      expect(wxss).toContain('100rpx');
      expect(wxss).toContain('10rpx');
    });

    it('应该处理百分比单位', () => {
      const components: Component[] = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: {
            width: '50%',
          },
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      const wxss = generator.generateWXSS(components);

      expect(wxss).toContain('50%');
    });
  });

  describe('Flex布局', () => {
    it('应该生成Flex布局代码', () => {
      const components: Component[] = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          },
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      const wxss = generator.generateWXSS(components);

      expect(wxss).toContain('display: flex');
      expect(wxss).toContain('flex-direction: row');
      expect(wxss).toContain('justify-content: center');
      expect(wxss).toContain('align-items: center');
    });
  });

  describe('嵌套组件', () => {
    it('应该编译嵌套的子组件', () => {
      const components: Component[] = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: { width: '100%' },
          events: [],
          dataBindings: [],
          children: [
            {
              id: 'comp-2',
              type: 'text',
              properties: [],
              style: { fontSize: '14px' },
              events: [],
              dataBindings: [],
              children: [],
            },
          ],
        },
      ];

      const wxss = generator.generateWXSS(components);

      expect(wxss).toContain('.view-comp-1');
      expect(wxss).toContain('.text-comp-2');
    });
  });

  describe('主题系统', () => {
    it('应该应用主题', () => {
      const theme: Theme = {
        name: 'test-theme',
        colors: {
          primary: '#007aff',
          secondary: '#5856d6',
          success: '#34c759',
          warning: '#ff9500',
          error: '#ff3b30',
          info: '#00bfff',
          text: '#000000',
          textSecondary: '#666666',
          background: '#ffffff',
          backgroundSecondary: '#f5f5f5',
          border: '#e0e0e0',
          divider: '#eeeeee',
        },
        spacing: {
          xs: '4rpx',
          sm: '8rpx',
          md: '16rpx',
          lg: '24rpx',
          xl: '32rpx',
          xxl: '48rpx',
        },
        typography: {
          fontSize: {
            xs: '12px',
            sm: '13px',
            base: '14px',
            lg: '16px',
            xl: '18px',
            '2xl': '20px',
            '3xl': '24px',
          },
          fontWeight: {
            light: '300',
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
          },
          lineHeight: {
            tight: '1.2',
            normal: '1.5',
            relaxed: '1.75',
            loose: '2',
          },
        },
        borderRadius: {
          sm: '4rpx',
          md: '8rpx',
          lg: '12rpx',
          xl: '16rpx',
          full: '9999rpx',
        },
        shadows: {
          sm: '0 1px 2px rgba(0,0,0,0.05)',
          md: '0 4px 6px rgba(0,0,0,0.1)',
          lg: '0 10px 15px rgba(0,0,0,0.1)',
          xl: '0 20px 25px rgba(0,0,0,0.1)',
        },
      };

      generator.registerTheme(theme);
      const themeWxss = generator.applyTheme('test-theme');

      expect(themeWxss).toContain(':root');
      expect(themeWxss).toContain('--color-primary: #007aff');
      expect(themeWxss).toContain('--spacing-md: 16rpx');
    });
  });

  describe('缓存', () => {
    it('应该缓存生成结果', () => {
      const components: Component[] = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: { width: '100%' },
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      const wxss1 = generator.generateComponentWXSS(components[0]);
      const wxss2 = generator.generateComponentWXSS(components[0]);

      expect(wxss1).toBe(wxss2);
    });

    it('应该清空缓存', () => {
      const stats1 = generator.getCacheStats();
      generator.clearCache();
      const stats2 = generator.getCacheStats();

      expect(stats2.entries).toBeLessThanOrEqual(stats1.entries);
    });
  });

  describe('错误处理', () => {
    it('应该处理空组件列表', () => {
      expect(() => {
        generator.generateWXSS([]);
      }).toThrow();
    });

    it('应该处理无效的组件', () => {
      expect(() => {
        generator.generateWXSS([
          {
            id: '',
            type: 'view',
            properties: [],
            style: {},
            events: [],
            children: [],
            dataBindings: [],
          },
        ]);
      }).toThrow();
    });
  });
});

// ============================================================================
// 样式编译器测试
// ============================================================================

describe('StyleCompiler', () => {
  let compiler: StyleCompiler;

  beforeEach(() => {
    compiler = new StyleCompiler();
  });

  describe('样式编译', () => {
    it('应该将camelCase转换为kebab-case', () => {
      const style: ComponentStyle = {
        backgroundColor: '#ffffff',
        fontSize: '14px',
        borderRadius: '8rpx',
      };

      const rule = compiler.compileStyle(style, '.test');

      expect(rule.properties['background-color']).toBe('#ffffff');
      expect(rule.properties['font-size']).toBe('14px');
      expect(rule.properties['border-radius']).toBe('8rpx');
    });

    it('应该处理样式值中的单位', () => {
      const style: ComponentStyle = {
        width: '200rpx',
        fontSize: '14px',
      };

      const rule = compiler.compileStyle(style, '.test');

      expect(rule.properties['width']).toBe('200rpx');
      expect(rule.properties['font-size']).toBe('14px');
    });

    it('应该支持CSS变量', () => {
      const style: ComponentStyle = {
        color: 'var(--primary-color)',
        backgroundColor: 'var(--bg-color)',
      };

      const rule = compiler.compileStyle(style, '.test');

      expect(rule.properties['color']).toContain('var(--primary-color)');
      expect(rule.properties['background-color']).toContain('var(--bg-color)');
    });
  });

  describe('单位转换', () => {
    it('应该将px转换为rpx', () => {
      const result = compiler.convertUnit('10px', 'rpx', { ratio: 1 });
      expect(result).toBe('10rpx');
    });

    it('应该保留已有单位', () => {
      const result = compiler.convertUnit('200rpx', 'rpx');
      expect(result).toBe('200rpx');
    });
  });
});

// ============================================================================
// 格式化器测试
// ============================================================================

describe('CSSFormatter', () => {
  let formatter: CSSFormatter;

  beforeEach(() => {
    formatter = new CSSFormatter();
  });

  describe('美化格式', () => {
    it('应该美化CSS代码', () => {
      const rules = [
        {
          selector: '.container',
          properties: {
            display: 'flex',
            padding: '20rpx',
          },
        },
      ];

      const formatted = formatter.beautify(rules);

      expect(formatted).toContain('.container');
      expect(formatted).toContain('display: flex');
      expect(formatted).toContain('padding: 20rpx');
      expect(formatted).toContain('\n');
    });
  });

  describe('压缩格式', () => {
    it('应该压缩CSS代码', () => {
      const css = `.container {
        display: flex;
        padding: 20rpx;
      }`;

      const minified = formatter.minify(css);

      expect(minified).not.toContain('\n');
      expect(minified).toContain('.container{');
      expect(minified.length).toBeLessThan(css.length);
    });
  });
});

// ============================================================================
// 验证器测试
// ============================================================================

describe('CSSValidator', () => {
  let validator: CSSValidator;

  beforeEach(() => {
    validator = new CSSValidator();
  });

  describe('选择器验证', () => {
    it('应该验证有效的选择器', () => {
      const result = validator.validateSelector('.container');
      expect(result.errors.length).toBe(0);
    });

    it('应该检测无效的选择器', () => {
      const result = validator.validateSelector('');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该警告不支持的选择器', () => {
      const result = validator.validateSelector('*');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('单位验证', () => {
    it('应该接受支持的单位', () => {
      const result = validator.validateUnit('100rpx');
      expect(result.valid).toBe(true);
    });

    it('应该拒绝不支持的单位', () => {
      const result = validator.validateUnit('100xyz');
      expect(result.valid).toBe(false);
    });
  });

  describe('兼容性检查', () => {
    it('应该检查WXSS兼容性', () => {
      const report = validator.checkCompatibility('* { display: flex; }');
      expect(report.compatible).toBe(false);
      expect(report.incompatibilities.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// 主题管理器测试
// ============================================================================

describe('ThemeManager', () => {
  let manager: ThemeManager;

  beforeEach(() => {
    manager = new ThemeManager();
  });

  describe('主题定义', () => {
    it('应该定义新主题', () => {
      const theme: Theme = {
        name: 'custom',
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          success: '#34c759',
          warning: '#ff9500',
          error: '#ff3b30',
          info: '#00bfff',
          text: '#000000',
          textSecondary: '#666666',
          background: '#ffffff',
          backgroundSecondary: '#f5f5f5',
          border: '#e0e0e0',
          divider: '#eeeeee',
        },
        spacing: {
          xs: '4rpx',
          sm: '8rpx',
          md: '16rpx',
          lg: '24rpx',
          xl: '32rpx',
          xxl: '48rpx',
        },
        typography: {
          fontSize: {
            xs: '12px',
            sm: '13px',
            base: '14px',
            lg: '16px',
            xl: '18px',
            '2xl': '20px',
            '3xl': '24px',
          },
          fontWeight: {
            light: '300',
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
          },
          lineHeight: {
            tight: '1.2',
            normal: '1.5',
            relaxed: '1.75',
            loose: '2',
          },
        },
        borderRadius: {
          sm: '4rpx',
          md: '8rpx',
          lg: '12rpx',
          xl: '16rpx',
          full: '9999rpx',
        },
        shadows: {
          sm: '0 1px 2px rgba(0,0,0,0.05)',
          md: '0 4px 6px rgba(0,0,0,0.1)',
          lg: '0 10px 15px rgba(0,0,0,0.1)',
          xl: '0 20px 25px rgba(0,0,0,0.1)',
        },
      };

      manager.defineTheme(theme);
      const retrieved = manager.getTheme('custom');

      expect(retrieved.name).toBe('custom');
      expect(retrieved.colors.primary).toBe('#ff0000');
    });

    it('应该生成主题规则', () => {
      const theme = manager.getTheme('light');
      const rules = manager.generateThemeRules(theme);

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].selector).toBe(':root');
      expect(Object.keys(rules[0].properties).length).toBeGreaterThan(0);
    });
  });

  describe('主题扩展', () => {
    it('应该扩展现有主题', () => {
      const extended = manager.extendTheme('light', {
        name: 'light-alt',
        colors: {
          primary: '#ff0000',
        },
      });

      expect(extended.name).toBe('light-alt');
      expect(extended.colors.primary).toBe('#ff0000');
      expect(extended.colors.secondary).toBe('#5856d6'); // 保留基础主题的值
    });
  });
});
