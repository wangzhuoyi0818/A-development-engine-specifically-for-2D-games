/**
 * WXSS生成器 - 验证器
 *
 * 验证CSS选择器、单位使用和微信小程序WXSS兼容性
 */

import type {
  CSSRule,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  CompatibilityReport,
  IncompatibilityIssue,
} from './types';

// ============================================================================
// CSS验证器类
// ============================================================================

/**
 * CSS验证器
 *
 * 职责:
 * - 验证CSS选择器有效性
 * - 检查单位使用规范
 * - 检查微信小程序WXSS兼容性
 */
export class CSSValidator {
  /** 支持的CSS单位 */
  private supportedUnits = new Set([
    'rpx', 'px', '%', 'vw', 'vh', 'rem', 'em', 'cm', 'mm', 'in', 'pt', 'pc',
  ]);

  /** 支持的CSS属性 */
  private supportedProperties = new Set([
    // 布局
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border', 'border-width', 'border-style', 'border-color',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-radius', 'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'box-sizing', 'overflow', 'overflow-x', 'overflow-y',
    'z-index',

    // Flexbox
    'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
    'align-content', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
    'gap', 'row-gap', 'column-gap',

    // 背景
    'background', 'background-color', 'background-image', 'background-size',
    'background-position', 'background-repeat', 'background-attachment',

    // 文本
    'color', 'font-size', 'font-weight', 'font-family', 'font-style',
    'line-height', 'text-align', 'text-decoration', 'text-transform',
    'letter-spacing', 'word-spacing', 'word-break', 'word-wrap',
    'white-space', 'text-overflow', 'text-indent',

    // 变换
    'transform', 'transform-origin', 'transition', 'animation',
    'opacity', 'visibility',

    // 其他
    'cursor', 'filter', 'box-shadow', 'text-shadow',
  ]);

  /** 不支持的选择器类型 */
  private unsupportedSelectors = [
    { pattern: /\*/g, reason: '不支持通配符选择器 *' },
    { pattern: /\[[^\]]*\]/g, reason: '不支持属性选择器' },
    { pattern: /[>~+]/g, reason: '不支持相邻选择器' },
  ];

  /**
   * 验证CSS规则
   * @param rules CSS规则
   * @returns 验证结果
   */
  validateRules(rules: CSSRule[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      // 验证选择器
      const selectorResult = this.validateSelector(rule.selector);
      errors.push(...selectorResult.errors);
      warnings.push(...selectorResult.warnings);

      // 验证属性
      for (const [property, value] of Object.entries(rule.properties)) {
        const propertyResult = this.validateProperty(property, value);
        errors.push(...propertyResult.errors);
        warnings.push(...propertyResult.warnings);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证CSS选择器
   * @param selector 选择器
   * @returns 验证结果
   */
  validateSelector(selector: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!selector || typeof selector !== 'string') {
      errors.push({
        code: 'INVALID_SELECTOR',
        message: '选择器必须是非空字符串',
        path: selector,
      });
      return { errors, warnings };
    }

    // 检查基本格式
    if (!/^[a-zA-Z0-9_\-.:# (),]+$/.test(selector)) {
      errors.push({
        code: 'INVALID_SELECTOR_FORMAT',
        message: `选择器包含非法字符: ${selector}`,
        path: selector,
      });
    }

    // 检查不支持的选择器
    for (const { pattern, reason } of this.unsupportedSelectors) {
      if (pattern.test(selector)) {
        warnings.push({
          code: 'UNSUPPORTED_SELECTOR',
          message: `${reason}: ${selector}`,
          path: selector,
        });
      }
    }

    // 检查嵌套深度
    const parts = selector.split(' ');
    if (parts.length > 4) {
      warnings.push({
        code: 'DEEP_NESTING',
        message: `选择器嵌套深度过深 (${parts.length} 级)`,
        path: selector,
      });
    }

    return { errors, warnings };
  }

  /**
   * 验证CSS单位
   * @param value 值
   * @returns 验证结果
   */
  validateUnit(value: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!value) {
      return { valid: true, errors, warnings };
    }

    // 提取所有单位
    const unitMatches = value.match(/\d+([a-zA-Z%]+)/g);
    if (!unitMatches) {
      return { valid: true, errors, warnings };
    }

    for (const match of unitMatches) {
      const unit = match.replace(/\d+/g, '');

      if (!this.supportedUnits.has(unit)) {
        errors.push({
          code: 'UNSUPPORTED_UNIT',
          message: `不支持的单位: ${unit}`,
          details: { value, unit },
        });
      }

      // rpx 是微信小程序推荐单位
      if (unit === 'px') {
        warnings.push({
          code: 'PREFER_RPX',
          message: '建议使用rpx而不是px以获得更好的适配性',
          details: { value },
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证CSS属性和值
   * @param property 属性名
   * @param value 属性值
   * @returns 验证结果
   */
  validateProperty(property: string, value: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!property || !value) {
      errors.push({
        code: 'INVALID_PROPERTY',
        message: '属性和值不能为空',
        details: { property, value },
      });
      return { errors, warnings };
    }

    // 验证属性名
    if (!/^[a-z-]+$/.test(property)) {
      errors.push({
        code: 'INVALID_PROPERTY_NAME',
        message: `无效的属性名: ${property}`,
        details: { property },
      });
    }

    // 检查属性是否支持
    if (!this.supportedProperties.has(property)) {
      warnings.push({
        code: 'UNSUPPORTED_PROPERTY',
        message: `属性 ${property} 可能不被微信小程序支持`,
        details: { property },
      });
    }

    // 验证属性值中的单位
    const unitValidation = this.validateUnit(value);
    errors.push(...unitValidation.errors);
    warnings.push(...unitValidation.warnings);

    return { errors, warnings };
  }

  /**
   * 检查兼容性
   * @param css CSS字符串
   * @returns 兼容性报告
   */
  checkCompatibility(css: string): CompatibilityReport {
    const incompatibilities: IncompatibilityIssue[] = [];
    const suggestions: string[] = [];

    // 检查通配符选择器
    if (/\*/.test(css)) {
      incompatibilities.push({
        type: 'selector',
        message: '微信小程序WXSS不支持通配符选择器 *',
        code: '*',
        fix: '使用具体的类或元素选择器替代',
      });
    }

    // 检查属性选择器
    if (/\[[^\]]*\]/.test(css)) {
      incompatibilities.push({
        type: 'selector',
        message: '微信小程序WXSS不支持属性选择器',
        code: '[attr]',
        fix: '使用类选择器或元素选择器替代',
      });
    }

    // 检查不支持的属性
    const unsupportedProps = [
      'position',
      'transition',
      'animation',
      'transform',
    ];

    for (const prop of unsupportedProps) {
      const pattern = new RegExp(`\\b${prop}\\s*:`, 'i');
      if (pattern.test(css)) {
        incompatibilities.push({
          type: 'property',
          message: `属性 ${prop} 在微信小程序中可能无法正常工作`,
          code: prop,
          fix: `参考微信小程序WXSS文档了解 ${prop} 的具体用法`,
        });
      }
    }

    // 检查不支持的值
    if (/calc\s*\(/i.test(css)) {
      incompatibilities.push({
        type: 'value',
        message: 'calc() 函数可能在某些微信小程序版本中不支持',
        code: 'calc()',
        fix: '使用Flex布局或JavaScript计算替代',
      });
    }

    // 生成建议
    if (incompatibilities.length > 0) {
      suggestions.push('请参考 https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html 了解完整的WXSS支持');
      suggestions.push('测试你的小程序确保在目标微信版本中正常显示');
    }

    suggestions.push('建议使用rpx单位以实现不同屏幕宽度的适配');
    suggestions.push('避免使用过深的CSS选择器以提高性能');

    return {
      compatible: incompatibilities.length === 0,
      incompatibilities,
      suggestions,
    };
  }

  /**
   * 验证颜色值
   * @param color 颜色值
   * @returns 是否有效
   */
  private isValidColor(color: string): boolean {
    // 十六进制颜色
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }

    // rgb/rgba
    if (/^rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+/.test(color)) {
      return true;
    }

    // 颜色名称
    const colorNames = [
      'white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
      'pink', 'gray', 'transparent', 'inherit',
    ];

    return colorNames.includes(color.toLowerCase());
  }

  /**
   * 获取属性建议值
   * @param property 属性名
   * @returns 建议值数组
   */
  getSuggestedValues(property: string): string[] {
    const suggestions: Record<string, string[]> = {
      display: ['block', 'flex', 'none', 'inline-flex', 'inline-block'],
      position: ['relative', 'absolute', 'fixed', 'static'],
      'text-align': ['left', 'right', 'center', 'justify'],
      'flex-direction': ['row', 'column', 'row-reverse', 'column-reverse'],
      'justify-content': [
        'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly',
      ],
      'align-items': ['flex-start', 'flex-end', 'center', 'baseline', 'stretch'],
      'overflow': ['visible', 'hidden', 'auto', 'scroll'],
      'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    };

    return suggestions[property] || [];
  }
}

// ============================================================================
// 导出
// ============================================================================

export default CSSValidator;
