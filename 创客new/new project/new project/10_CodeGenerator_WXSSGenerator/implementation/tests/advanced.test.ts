/**
 * WXSS生成器 - 额外测试
 * 用于提升测试覆盖率
 */

import { describe, it, expect, beforeEach } from 'vitest';
import WXSSGenerator from '../wxss-generator';
import StyleCompiler from '../style-compiler';
import CSSFormatter from '../formatter';
import ThemeManager from '../theme-manager';
import type { CSSRule, Theme, WXSSPlugin, NestedStyles } from '../types';
import { ThemeNotFoundError, WXSSGeneratorError } from '../types';

describe('StyleCompiler - 高级功能', () => {
  let compiler: StyleCompiler;

  beforeEach(() => {
    compiler = new StyleCompiler();
  });

  describe('嵌套样式处理', () => {
    it('应该展开嵌套样式', () => {
      const nested: NestedStyles = {
        base: {
          display: 'flex',
        },
        nested: {
          '.header': {
            fontSize: '16px',
          },
          '&:hover': {
            backgroundColor: '#f0f0f0',
          },
        },
      };

      const rules = compiler.compileNested(nested, '.container');

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(r => r.selector.includes('.container .header'))).toBe(true);
      expect(rules.some(r => r.selector.includes('.container:hover'))).toBe(true);
    });

    it('应该处理深层嵌套', () => {
      const nested: NestedStyles = {
        base: {
          display: 'flex',
        },
        nested: {
          '.level1': {
            base: {
              padding: '10rpx',
            },
            nested: {
              '.level2': {
                margin: '5rpx',
              },
            },
          },
        },
      };

      const rules = compiler.compileNested(nested, '.root');
      expect(rules.some(r => r.selector.includes('.root .level1 .level2'))).toBe(true);
    });
  });

  describe('媒体查询', () => {
    it('应该生成媒体查询', () => {
      const rules: CSSRule[] = [
        {
          selector: '.responsive',
          properties: {
            'font-size': '14px',
          },
        },
      ];

      const breakpoint = {
        name: 'md',
        minWidth: 667,
        query: '(min-width: 667px)',
      };

      const mediaQuery = compiler.generateMediaQuery(breakpoint, rules);

      expect(mediaQuery).toContain('@media (min-width: 667px)');
      expect(mediaQuery).toContain('.responsive');
      expect(mediaQuery).toContain('font-size: 14px');
    });
  });

  describe('样式合并', () => {
    it('应该合并多个样式对象', () => {
      const style1 = { width: '100%' };
      const style2 = { height: '200rpx' };
      const style3 = { padding: '10rpx' };

      const merged = compiler.mergeStyles(style1, style2, style3);

      expect(merged.width).toBe('100%');
      expect(merged.height).toBe('200rpx');
      expect(merged.padding).toBe('10rpx');
    });
  });

  describe('属性验证', () => {
    it('应该验证有效属性', () => {
      const isValid = compiler.validateProperty('width', '100rpx');
      expect(isValid).toBe(true);
    });

    it('应该拒绝无效属性', () => {
      const isValid = compiler.validateProperty('', '');
      expect(isValid).toBe(false);
    });

    it('应该拒绝无效属性名格式', () => {
      const isValid = compiler.validateProperty('WIDTH123', '100rpx');
      expect(isValid).toBe(false);
    });
  });
});

describe('CSSFormatter - 高级功能', () => {
  let formatter: CSSFormatter;

  beforeEach(() => {
    formatter = new CSSFormatter();
  });

  describe('格式化选项', () => {
    it('应该根据选项选择压缩模式', () => {
      const rules: CSSRule[] = [
        {
          selector: '.test',
          properties: {
            width: '100%',
            height: '200rpx',
          },
        },
      ];

      const minified = formatter.format(rules, { minify: true });
      expect(minified).not.toContain('\n');
      expect(minified.length).toBeLessThan(100);
    });

    it('应该根据选项选择美化模式', () => {
      const rules: CSSRule[] = [
        {
          selector: '.test',
          properties: {
            width: '100%',
          },
        },
      ];

      const beautified = formatter.format(rules, { beautify: true, comments: true });
      expect(beautified).toContain('\n');
      expect(beautified).toContain('自动生成');
    });

    it('应该处理空规则数组', () => {
      const result = formatter.format([]);
      expect(result).toBe('');
    });
  });

  describe('优化功能', () => {
    it('应该优化CSS代码', () => {
      const css = '.a{width:100%}.a{height:200rpx}';
      const optimized = formatter.optimize(css);

      expect(optimized).toContain('.a');
      expect(optimized).toContain('width:100%');
      expect(optimized).toContain('height:200rpx');
    });
  });

  describe('源映射', () => {
    it('应该生成源映射', () => {
      const rules: CSSRule[] = [
        {
          selector: '.test',
          properties: {
            width: '100%',
          },
          sourceId: 'comp-1',
        },
      ];

      const css = formatter.beautify(rules);
      const sourceMap = formatter.generateSourceMap(css, rules);

      expect(sourceMap.version).toBe(3);
      expect(sourceMap.sources.length).toBeGreaterThan(0);
      expect(sourceMap.mappings).toBeDefined();
    });
  });

  describe('媒体查询格式化', () => {
    it('应该格式化带媒体查询的规则', () => {
      const rules: CSSRule[] = [
        {
          selector: '.normal',
          properties: {
            width: '100%',
          },
        },
        {
          selector: '.responsive',
          properties: {
            'font-size': '16px',
          },
          media: '(min-width: 768px)',
        },
      ];

      const formatted = formatter.beautify(rules);

      expect(formatted).toContain('.normal');
      expect(formatted).toContain('@media (min-width: 768px)');
      expect(formatted).toContain('.responsive');
    });
  });
});

describe('ThemeManager - 高级功能', () => {
  let manager: ThemeManager;

  beforeEach(() => {
    manager = new ThemeManager();
  });

  describe('主题继承', () => {
    it('应该支持主题继承', () => {
      const baseTheme: Theme = {
        name: 'base',
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

      manager.defineTheme(baseTheme);

      const childTheme: Theme = {
        ...baseTheme,
        name: 'child',
        extends: 'base',
        colors: {
          ...baseTheme.colors,
          primary: '#0000ff',
        },
      };

      manager.defineTheme(childTheme);
      const retrieved = manager.getTheme('child');

      expect(retrieved.colors.primary).toBe('#0000ff');
      expect(retrieved.colors.secondary).toBe('#00ff00');
    });
  });

  describe('错误处理', () => {
    it('应该抛出主题未找到错误', () => {
      expect(() => {
        manager.getTheme('non-existent');
      }).toThrow(ThemeNotFoundError);
    });

    it('应该拒绝无效主题', () => {
      expect(() => {
        manager.defineTheme({} as Theme);
      }).toThrow(WXSSGeneratorError);
    });

    it('应该拒绝缺少颜色的主题', () => {
      expect(() => {
        manager.defineTheme({
          name: 'invalid',
          colors: {
            primary: '#ff0000',
          } as any,
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
          borderRadius: {},
          shadows: {},
        });
      }).toThrow();
    });

    it('应该在继承不存在的主题时抛出错误', () => {
      expect(() => {
        manager.defineTheme({
          name: 'child',
          extends: 'non-existent',
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
          borderRadius: {},
          shadows: {},
        });
      }).toThrow(ThemeNotFoundError);
    });
  });

  describe('主题列表', () => {
    it('应该列出所有主题', () => {
      const themes = manager.listThemes();
      expect(themes.length).toBeGreaterThan(0);
      expect(themes).toContain('light');
    });
  });

  describe('主题变量', () => {
    it('应该获取主题变量', () => {
      const variables = manager.getThemeVariables('light');
      expect(Object.keys(variables).length).toBeGreaterThan(0);
      expect(variables['--color-primary']).toBeDefined();
    });
  });
});

describe('WXSSGenerator - 插件系统', () => {
  let generator: WXSSGenerator;

  beforeEach(() => {
    generator = new WXSSGenerator();
  });

  describe('插件注册', () => {
    it('应该注册插件', () => {
      const plugin: WXSSPlugin = {
        name: 'test-plugin',
        transform: (rules) => rules,
      };

      expect(() => {
        generator.use(plugin);
      }).not.toThrow();
    });

    it('应该拒绝无效插件', () => {
      expect(() => {
        generator.use({} as WXSSPlugin);
      }).toThrow();
    });

    it('应该调用插件的init方法', () => {
      let initialized = false;

      const plugin: WXSSPlugin = {
        name: 'test-plugin',
        init: () => {
          initialized = true;
        },
        transform: (rules) => rules,
      };

      generator.use(plugin);
      expect(initialized).toBe(true);
    });
  });

  describe('插件转换', () => {
    it('应该应用插件转换', () => {
      const plugin: WXSSPlugin = {
        name: 'uppercase-plugin',
        transform: (rules) => {
          return rules.map((rule) => ({
            ...rule,
            selector: rule.selector.toUpperCase(),
          }));
        },
      };

      generator.use(plugin);

      const components = [
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

      const wxss = generator.generateWXSS(components);
      expect(wxss).toContain('.VIEW-COMP-1');
    });
  });
});
