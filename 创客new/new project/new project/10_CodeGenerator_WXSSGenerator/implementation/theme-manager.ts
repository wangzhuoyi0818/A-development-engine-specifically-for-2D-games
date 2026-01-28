/**
 * WXSS生成器 - 主题管理器
 *
 * 管理全局主题变量，支持主题继承和覆盖
 */

import type { Theme, CSSRule, ThemeColors, ThemeSpacing, ThemeTypography } from './types';
import { ThemeNotFoundError, WXSSGeneratorError } from './types';

// ============================================================================
// 主题管理器类
// ============================================================================

/**
 * 主题管理器
 *
 * 职责:
 * - 管理全局主题变量
 * - 支持主题继承和覆盖
 * - 生成CSS变量声明
 */
export class ThemeManager {
  /** 主题存储 */
  private themes: Map<string, Theme> = new Map();

  /** 默认主题名称 */
  private defaultTheme: string = 'light';

  /** 当前激活的主题 */
  private activeTheme: string = 'light';

  constructor() {
    // 初始化默认主题
    this.registerDefaultTheme();
  }

  /**
   * 定义主题
   * @param theme 主题对象
   */
  defineTheme(theme: Theme): void {
    if (!theme || !theme.name) {
      throw new WXSSGeneratorError('主题必须有name属性', 'INVALID_THEME');
    }

    // 验证主题结构
    this.validateTheme(theme);

    // 如果主题继承自其他主题，先处理继承
    if (theme.extends) {
      const baseTheme = this.themes.get(theme.extends);
      if (!baseTheme) {
        throw new ThemeNotFoundError(theme.extends);
      }
      theme = this.mergeTheme(baseTheme, theme);
    }

    this.themes.set(theme.name, theme);
  }

  /**
   * 获取主题
   * @param themeName 主题名称
   * @returns 主题对象
   */
  getTheme(themeName?: string): Theme {
    const name = themeName || this.activeTheme;
    const theme = this.themes.get(name);

    if (!theme) {
      throw new ThemeNotFoundError(name);
    }

    return theme;
  }

  /**
   * 列出所有主题
   * @returns 主题名称数组
   */
  listThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * 应用主题
   * @param themeName 主题名称
   * @returns CSS变量声明代码
   */
  applyTheme(themeName: string): string {
    const theme = this.getTheme(themeName);
    this.activeTheme = themeName;

    const rules = this.generateThemeRules(theme);
    return this.formatRules(rules);
  }

  /**
   * 生成主题CSS规则
   * @param theme 主题
   * @returns CSS规则数组
   */
  generateThemeRules(theme: Theme): CSSRule[] {
    const properties: Record<string, string> = {};

    // 添加颜色变量
    this.addColorVariables(properties, theme.colors);

    // 添加间距变量
    this.addSpacingVariables(properties, theme.spacing);

    // 添加字体变量
    this.addTypographyVariables(properties, theme.typography);

    // 添加圆角变量
    this.addBorderRadiusVariables(properties, theme.borderRadius);

    // 添加阴影变量
    this.addShadowVariables(properties, theme.shadows);

    // 添加自定义变量
    if (theme.custom) {
      for (const [key, value] of Object.entries(theme.custom)) {
        properties[`--custom-${this.kebabCase(key)}`] = value;
      }
    }

    return [
      {
        selector: ':root',
        properties,
      },
    ];
  }

  /**
   * 获取主题变量
   * @param themeName 主题名称
   * @returns CSS变量字典
   */
  getThemeVariables(themeName?: string): Record<string, string> {
    const theme = this.getTheme(themeName);
    const variables: Record<string, string> = {};

    // 收集所有变量
    const rules = this.generateThemeRules(theme);
    for (const rule of rules) {
      for (const [key, value] of Object.entries(rule.properties)) {
        if (key.startsWith('--')) {
          variables[key] = value;
        }
      }
    }

    return variables;
  }

  /**
   * 扩展主题
   * @param baseName 基础主题名称
   * @param overrides 覆盖值
   * @returns 新主题
   */
  extendTheme(baseName: string, overrides: Partial<Theme>): Theme {
    const baseTheme = this.getTheme(baseName);

    const newTheme: Theme = {
      ...baseTheme,
      ...overrides,
      name: overrides.name || `${baseName}-extended`,
      colors: {
        ...baseTheme.colors,
        ...(overrides.colors || {}),
      },
      spacing: {
        ...baseTheme.spacing,
        ...(overrides.spacing || {}),
      },
      typography: {
        ...baseTheme.typography,
        ...(overrides.typography || {}),
      },
      borderRadius: {
        ...baseTheme.borderRadius,
        ...(overrides.borderRadius || {}),
      },
      shadows: {
        ...baseTheme.shadows,
        ...(overrides.shadows || {}),
      },
    };

    return newTheme;
  }

  /**
   * 验证主题
   * @param theme 主题
   */
  private validateTheme(theme: Theme): void {
    if (!theme.colors || typeof theme.colors !== 'object') {
      throw new WXSSGeneratorError('主题必须有colors对象', 'INVALID_THEME');
    }

    if (!theme.spacing || typeof theme.spacing !== 'object') {
      throw new WXSSGeneratorError('主题必须有spacing对象', 'INVALID_THEME');
    }

    if (!theme.typography || typeof theme.typography !== 'object') {
      throw new WXSSGeneratorError('主题必须有typography对象', 'INVALID_THEME');
    }

    // 验证颜色属性
    const requiredColors = [
      'primary', 'secondary', 'success', 'warning', 'error',
      'text', 'background', 'border'
    ];
    for (const color of requiredColors) {
      if (!theme.colors[color as keyof ThemeColors]) {
        throw new WXSSGeneratorError(
          `主题颜色缺少 ${color}`,
          'INVALID_THEME'
        );
      }
    }
  }

  /**
   * 合并主题
   * @param base 基础主题
   * @param override 覆盖主题
   * @returns 合并后的主题
   */
  private mergeTheme(base: Theme, override: Theme): Theme {
    return {
      ...base,
      ...override,
      colors: { ...base.colors, ...override.colors },
      spacing: { ...base.spacing, ...override.spacing },
      typography: { ...base.typography, ...override.typography },
      borderRadius: { ...base.borderRadius, ...override.borderRadius },
      shadows: { ...base.shadows, ...override.shadows },
      custom: { ...base.custom, ...override.custom },
    };
  }

  /**
   * 添加颜色变量
   * @param properties 属性对象
   * @param colors 颜色对象
   */
  private addColorVariables(properties: Record<string, string>, colors: ThemeColors): void {
    for (const [key, value] of Object.entries(colors)) {
      if (value) {
        properties[`--color-${this.kebabCase(key)}`] = value;
      }
    }
  }

  /**
   * 添加间距变量
   * @param properties 属性对象
   * @param spacing 间距对象
   */
  private addSpacingVariables(
    properties: Record<string, string>,
    spacing: ThemeSpacing
  ): void {
    for (const [key, value] of Object.entries(spacing)) {
      if (value) {
        properties[`--spacing-${this.kebabCase(key)}`] = value;
      }
    }
  }

  /**
   * 添加字体变量
   * @param properties 属性对象
   * @param typography 字体对象
   */
  private addTypographyVariables(
    properties: Record<string, string>,
    typography: ThemeTypography
  ): void {
    // 字体大小
    if (typography.fontSize) {
      for (const [key, value] of Object.entries(typography.fontSize)) {
        if (value) {
          properties[`--font-size-${this.kebabCase(key)}`] = value;
        }
      }
    }

    // 字重
    if (typography.fontWeight) {
      for (const [key, value] of Object.entries(typography.fontWeight)) {
        if (value) {
          properties[`--font-weight-${this.kebabCase(key)}`] = value;
        }
      }
    }

    // 行高
    if (typography.lineHeight) {
      for (const [key, value] of Object.entries(typography.lineHeight)) {
        if (value) {
          properties[`--line-height-${this.kebabCase(key)}`] = value;
        }
      }
    }

    // 字体族
    if (typography.fontFamily) {
      for (const [key, value] of Object.entries(typography.fontFamily)) {
        if (value) {
          properties[`--font-family-${this.kebabCase(key)}`] = value;
        }
      }
    }
  }

  /**
   * 添加圆角变量
   * @param properties 属性对象
   * @param borderRadius 圆角对象
   */
  private addBorderRadiusVariables(
    properties: Record<string, string>,
    borderRadius: Record<string, string>
  ): void {
    for (const [key, value] of Object.entries(borderRadius)) {
      if (value) {
        properties[`--border-radius-${this.kebabCase(key)}`] = value;
      }
    }
  }

  /**
   * 添加阴影变量
   * @param properties 属性对象
   * @param shadows 阴影对象
   */
  private addShadowVariables(
    properties: Record<string, string>,
    shadows: Record<string, string>
  ): void {
    for (const [key, value] of Object.entries(shadows)) {
      if (value) {
        properties[`--shadow-${this.kebabCase(key)}`] = value;
      }
    }
  }

  /**
   * kebab-case转换
   * @param str 字符串
   * @returns 转换后的字符串
   */
  private kebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
      .toLowerCase();
  }

  /**
   * 格式化CSS规则
   * @param rules CSS规则
   * @returns 格式化后的字符串
   */
  private formatRules(rules: CSSRule[]): string {
    const lines: string[] = [];

    for (const rule of rules) {
      lines.push(`${rule.selector} {`);

      for (const [key, value] of Object.entries(rule.properties)) {
        lines.push(`  ${key}: ${value};`);
      }

      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 注册默认主题
   */
  private registerDefaultTheme(): void {
    const lightTheme: Theme = {
      name: 'light',
      description: '浅色主题',
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
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    };

    this.defineTheme(lightTheme);
  }
}

// ============================================================================
// 导出
// ============================================================================

export default ThemeManager;
