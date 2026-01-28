/**
 * 微信小程序可视化开发平台 - 属性格式化工具
 *
 * 提供属性值的格式化显示、解析和验证功能
 */

import {
  PropertyType,
  PropertyValue,
  ValidationError,
  ValidationErrorCode,
  ValidationRule,
  ValidationResult,
  FormatOptions,
  NumberFormatOptions,
  ColorValue,
} from './types';

/**
 * 属性格式化器类
 * 负责属性值的格式化、解析和验证
 */
export class PropertyFormatter {
  /**
   * 格式化属性值用于显示
   */
  static format(
    value: PropertyValue,
    type: PropertyType,
    options?: FormatOptions
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (type) {
      case PropertyType.Text:
      case PropertyType.Textarea:
        return String(value);

      case PropertyType.Number:
        return this.formatNumber(value as number, options?.numberFormat);

      case PropertyType.Color:
        return this.formatColor(value);

      case PropertyType.Date:
        return this.formatDate(value as Date, options?.dateFormat);

      case PropertyType.Time:
        return this.formatTime(value as Date, options?.timeFormat);

      case PropertyType.DateTime:
        return this.formatDateTime(value as Date, options);

      case PropertyType.Checkbox:
      case PropertyType.Switch:
        return value ? '是' : '否';

      case PropertyType.Select:
        return String(value);

      case PropertyType.Slider:
      case PropertyType.Rating:
        return String(value);

      case PropertyType.Json:
        return JSON.stringify(value, null, 2);

      default:
        return String(value);
    }
  }

  /**
   * 解析字符串值为属性值
   */
  static parse(rawValue: string, type: PropertyType): PropertyValue {
    if (!rawValue || rawValue.trim() === '') {
      return null;
    }

    try {
      switch (type) {
        case PropertyType.Text:
        case PropertyType.Textarea:
          return rawValue;

        case PropertyType.Number:
        case PropertyType.Slider:
        case PropertyType.Rating:
          return this.parseNumber(rawValue);

        case PropertyType.Color:
          return this.parseColor(rawValue);

        case PropertyType.Date:
          return this.parseDate(rawValue);

        case PropertyType.Time:
          return this.parseTime(rawValue);

        case PropertyType.DateTime:
          return this.parseDateTime(rawValue);

        case PropertyType.Checkbox:
        case PropertyType.Switch:
          return this.parseBoolean(rawValue);

        case PropertyType.Json:
          return this.parseJson(rawValue);

        default:
          return rawValue;
      }
    } catch (error) {
      throw new Error(`解析失败: ${(error as Error).message}`);
    }
  }

  /**
   * 验证属性值
   */
  static validate(
    value: PropertyValue,
    rules: ValidationRule[]
  ): ValidationError | null {
    for (const rule of rules) {
      const error = this.validateRule(value, rule);
      if (error) {
        return error;
      }
    }
    return null;
  }

  /**
   * 验证单个规则
   */
  private static validateRule(
    value: PropertyValue,
    rule: ValidationRule
  ): ValidationError | null {
    switch (rule.type) {
      case 'required':
        return this.validateRequired(value, rule.message);

      case 'type':
        return this.validateType(value, rule.params?.type, rule.message);

      case 'range':
        return this.validateRange(
          value as number,
          rule.params?.min,
          rule.params?.max,
          rule.message
        );

      case 'length':
        return this.validateLength(
          value as string,
          rule.params?.min,
          rule.params?.max,
          rule.message
        );

      case 'pattern':
        return this.validatePattern(
          value as string,
          rule.params?.pattern,
          rule.message
        );

      case 'enum':
        return this.validateEnum(value, rule.params?.options, rule.message);

      case 'custom':
        if (rule.validator) {
          const isValid = rule.validator(value);
          if (!isValid) {
            return {
              code: ValidationErrorCode.CUSTOM,
              message: rule.message || '自定义验证失败',
            };
          }
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * 必填验证
   */
  static validateRequired(
    value: PropertyValue,
    message?: string
  ): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return {
        code: ValidationErrorCode.REQUIRED,
        message: message || '此字段为必填项',
      };
    }
    return null;
  }

  /**
   * 类型验证
   */
  static validateType(
    value: PropertyValue,
    expectedType: PropertyType,
    message?: string
  ): ValidationError | null {
    const actualType = typeof value;

    const typeMap: Record<PropertyType, string[]> = {
      [PropertyType.Text]: ['string'],
      [PropertyType.Textarea]: ['string'],
      [PropertyType.Number]: ['number'],
      [PropertyType.Checkbox]: ['boolean'],
      [PropertyType.Switch]: ['boolean'],
      [PropertyType.Select]: ['string', 'number'],
      [PropertyType.Date]: ['object', 'string'],
      [PropertyType.Time]: ['object', 'string'],
      [PropertyType.DateTime]: ['object', 'string'],
      [PropertyType.Color]: ['string', 'object'],
      [PropertyType.Slider]: ['number'],
      [PropertyType.Rating]: ['number'],
      [PropertyType.Json]: ['object'],
      [PropertyType.File]: ['string', 'object'],
      [PropertyType.Image]: ['string'],
      [PropertyType.Binding]: ['object'],
      [PropertyType.Expression]: ['string'],
      [PropertyType.Code]: ['string'],
      [PropertyType.FontSelector]: ['string'],
      [PropertyType.IconSelector]: ['string'],
      [PropertyType.Gradient]: ['object'],
      [PropertyType.Shadow]: ['object'],
      [PropertyType.Border]: ['object'],
    };

    const expectedTypes = typeMap[expectedType] || [];
    if (!expectedTypes.includes(actualType)) {
      return {
        code: ValidationErrorCode.TYPE_MISMATCH,
        message: message || `类型不匹配，期望 ${expectedTypes.join(' 或 ')}，实际 ${actualType}`,
      };
    }

    return null;
  }

  /**
   * 范围验证
   */
  static validateRange(
    value: number,
    min?: number,
    max?: number,
    message?: string
  ): ValidationError | null {
    if (min !== undefined && value < min) {
      return {
        code: ValidationErrorCode.OUT_OF_RANGE,
        message: message || `值必须大于或等于 ${min}`,
      };
    }

    if (max !== undefined && value > max) {
      return {
        code: ValidationErrorCode.OUT_OF_RANGE,
        message: message || `值必须小于或等于 ${max}`,
      };
    }

    return null;
  }

  /**
   * 长度验证
   */
  static validateLength(
    value: string,
    min?: number,
    max?: number,
    message?: string
  ): ValidationError | null {
    const length = value.length;

    if (min !== undefined && length < min) {
      return {
        code: ValidationErrorCode.LENGTH_TOO_SHORT,
        message: message || `长度必须至少为 ${min} 个字符`,
      };
    }

    if (max !== undefined && length > max) {
      return {
        code: ValidationErrorCode.LENGTH_EXCEEDED,
        message: message || `长度不能超过 ${max} 个字符`,
      };
    }

    return null;
  }

  /**
   * 模式验证 (正则表达式)
   */
  static validatePattern(
    value: string,
    pattern: RegExp,
    message?: string
  ): ValidationError | null {
    if (!pattern.test(value)) {
      return {
        code: ValidationErrorCode.PATTERN_MISMATCH,
        message: message || '格式不正确',
      };
    }
    return null;
  }

  /**
   * 枚举验证
   */
  static validateEnum(
    value: PropertyValue,
    options: PropertyValue[],
    message?: string
  ): ValidationError | null {
    if (!options.includes(value)) {
      return {
        code: ValidationErrorCode.INVALID_ENUM,
        message: message || '值必须是预定义选项之一',
      };
    }
    return null;
  }

  /**
   * 格式化数字
   */
  private static formatNumber(
    value: number,
    options?: NumberFormatOptions
  ): string {
    if (typeof value !== 'number' || isNaN(value)) {
      return '';
    }

    let formatted = value.toString();

    // 应用精度
    if (options?.precision !== undefined) {
      formatted = value.toFixed(options.precision);
    }

    // 千位分隔符
    if (options?.useGrouping) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    // 添加单位
    if (options?.unit) {
      formatted += options.unit;
    }

    return formatted;
  }

  /**
   * 解析数字
   */
  static parseNumber(text: string, options?: NumberFormatOptions): number {
    // 移除千位分隔符和单位
    let cleaned = text.replace(/,/g, '');

    if (options?.unit) {
      cleaned = cleaned.replace(options.unit, '');
    }

    cleaned = cleaned.trim();

    const number = parseFloat(cleaned);

    if (isNaN(number)) {
      throw new Error('无效的数字格式');
    }

    // 应用范围限制
    if (options?.min !== undefined && number < options.min) {
      return options.min;
    }

    if (options?.max !== undefined && number > options.max) {
      return options.max;
    }

    // 应用步进值
    if (options?.step !== undefined) {
      return Math.round(number / options.step) * options.step;
    }

    return number;
  }

  /**
   * 格式化颜色
   */
  private static formatColor(value: PropertyValue): string {
    if (typeof value === 'string') {
      return value;
    }

    const color = value as ColorValue;
    if (color && color.value) {
      return color.value;
    }

    return '';
  }

  /**
   * 解析颜色
   */
  static parseColor(text: string): string {
    text = text.trim();

    // 验证 hex 格式
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(text)) {
      return text;
    }

    // 验证 rgb/rgba 格式
    if (/^rgba?\(/.test(text)) {
      return text;
    }

    // 验证 hsl/hsla 格式
    if (/^hsla?\(/.test(text)) {
      return text;
    }

    // 验证颜色名称
    const colorNames = [
      'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'transparent'
    ];
    if (colorNames.includes(text.toLowerCase())) {
      return text;
    }

    throw new Error('无效的颜色格式');
  }

  /**
   * 格式化日期
   */
  private static formatDate(value: Date, format?: string): string {
    if (!(value instanceof Date) && typeof value === 'string') {
      value = new Date(value);
    }

    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return '';
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    format = format || 'YYYY-MM-DD';
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }

  /**
   * 解析日期
   */
  static parseDate(text: string): Date {
    const date = new Date(text);
    if (isNaN(date.getTime())) {
      throw new Error('无效的日期格式');
    }
    return date;
  }

  /**
   * 格式化时间
   */
  private static formatTime(value: Date, format?: string): string {
    if (!(value instanceof Date) && typeof value === 'string') {
      value = new Date(value);
    }

    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return '';
    }

    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    const seconds = String(value.getSeconds()).padStart(2, '0');

    format = format || 'HH:mm:ss';
    return format
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 解析时间
   */
  static parseTime(text: string): Date {
    const parts = text.split(':');
    if (parts.length < 2) {
      throw new Error('无效的时间格式');
    }

    const date = new Date();
    date.setHours(parseInt(parts[0], 10));
    date.setMinutes(parseInt(parts[1], 10));
    date.setSeconds(parts[2] ? parseInt(parts[2], 10) : 0);

    if (isNaN(date.getTime())) {
      throw new Error('无效的时间格式');
    }

    return date;
  }

  /**
   * 格式化日期时间
   */
  private static formatDateTime(value: Date, options?: FormatOptions): string {
    const datePart = this.formatDate(value, options?.dateFormat);
    const timePart = this.formatTime(value, options?.timeFormat);
    return `${datePart} ${timePart}`;
  }

  /**
   * 解析日期时间
   */
  static parseDateTime(text: string): Date {
    const date = new Date(text);
    if (isNaN(date.getTime())) {
      throw new Error('无效的日期时间格式');
    }
    return date;
  }

  /**
   * 解析布尔值
   */
  static parseBoolean(text: string): boolean {
    const normalized = text.toLowerCase().trim();
    if (['true', '1', 'yes', '是'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', '否'].includes(normalized)) {
      return false;
    }
    throw new Error('无效的布尔值格式');
  }

  /**
   * 解析 JSON
   */
  static parseJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error('无效的 JSON 格式');
    }
  }

  /**
   * 格式化错误信息
   */
  static formatError(error: ValidationError): string {
    return error.message;
  }

  /**
   * 类型转换
   */
  static coerce(value: PropertyValue, targetType: PropertyType): PropertyValue {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      switch (targetType) {
        case PropertyType.Text:
        case PropertyType.Textarea:
          return String(value);

        case PropertyType.Number:
        case PropertyType.Slider:
        case PropertyType.Rating: {
          const num = typeof value === 'number' ? value : parseFloat(String(value));
          return isNaN(num) ? null : num;
        }

        case PropertyType.Checkbox:
        case PropertyType.Switch:
          return Boolean(value);

        case PropertyType.Json:
          return typeof value === 'string' ? JSON.parse(value) : value;

        default:
          return value;
      }
    } catch {
      return null;
    }
  }
}
