/**
 * PropertyFormatter 类测试
 */

import { describe, it, expect } from 'vitest';
import { PropertyFormatter } from '../property-formatter';
import { PropertyType, ValidationErrorCode } from '../types';

describe('PropertyFormatter', () => {
  // ============================================================================
  // 格式化测试
  // ============================================================================

  describe('format()', () => {
    it('should format text values', () => {
      const result = PropertyFormatter.format('Hello', PropertyType.Text);
      expect(result).toBe('Hello');
    });

    it('should format number values', () => {
      const result = PropertyFormatter.format(123.45, PropertyType.Number);
      expect(result).toBe('123.45');
    });

    it('should format number with precision', () => {
      const result = PropertyFormatter.format(123.456, PropertyType.Number, {
        numberFormat: { precision: 2 },
      });
      expect(result).toBe('123.46');
    });

    it('should format number with grouping', () => {
      const result = PropertyFormatter.format(1234567, PropertyType.Number, {
        numberFormat: { useGrouping: true },
      });
      expect(result).toBe('1,234,567');
    });

    it('should format color values', () => {
      const result = PropertyFormatter.format('#ff0000', PropertyType.Color);
      expect(result).toBe('#ff0000');
    });

    it('should format boolean values', () => {
      expect(PropertyFormatter.format(true, PropertyType.Checkbox)).toBe('是');
      expect(PropertyFormatter.format(false, PropertyType.Checkbox)).toBe('否');
    });

    it('should return empty string for null/undefined', () => {
      expect(PropertyFormatter.format(null, PropertyType.Text)).toBe('');
      expect(PropertyFormatter.format(undefined, PropertyType.Text)).toBe('');
    });
  });

  // ============================================================================
  // 解析测试
  // ============================================================================

  describe('parse()', () => {
    it('should parse text values', () => {
      const result = PropertyFormatter.parse('Hello', PropertyType.Text);
      expect(result).toBe('Hello');
    });

    it('should parse number values', () => {
      const result = PropertyFormatter.parse('123.45', PropertyType.Number);
      expect(result).toBe(123.45);
    });

    it('should parse integer numbers', () => {
      const result = PropertyFormatter.parse('100', PropertyType.Number);
      expect(result).toBe(100);
    });

    it('should parse negative numbers', () => {
      const result = PropertyFormatter.parse('-50', PropertyType.Number);
      expect(result).toBe(-50);
    });

    it('should throw error for invalid number', () => {
      expect(() => {
        PropertyFormatter.parse('abc', PropertyType.Number);
      }).toThrow();
    });

    it('should parse boolean values', () => {
      expect(PropertyFormatter.parse('true', PropertyType.Checkbox)).toBe(true);
      expect(PropertyFormatter.parse('false', PropertyType.Checkbox)).toBe(false);
      expect(PropertyFormatter.parse('1', PropertyType.Checkbox)).toBe(true);
      expect(PropertyFormatter.parse('0', PropertyType.Checkbox)).toBe(false);
      expect(PropertyFormatter.parse('yes', PropertyType.Checkbox)).toBe(true);
      expect(PropertyFormatter.parse('no', PropertyType.Checkbox)).toBe(false);
    });

    it('should parse color values', () => {
      const result = PropertyFormatter.parse('#ff0000', PropertyType.Color);
      expect(result).toBe('#ff0000');
    });

    it('should parse JSON values', () => {
      const result = PropertyFormatter.parse('{"key": "value"}', PropertyType.Json);
      expect(result).toEqual({ key: 'value' });
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        PropertyFormatter.parse('invalid json', PropertyType.Json);
      }).toThrow();
    });

    it('should return null for empty string', () => {
      const result = PropertyFormatter.parse('', PropertyType.Text);
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // 数字解析测试
  // ============================================================================

  describe('parseNumber()', () => {
    it('should parse simple numbers', () => {
      expect(PropertyFormatter.parseNumber('123')).toBe(123);
      expect(PropertyFormatter.parseNumber('123.45')).toBe(123.45);
    });

    it('should parse numbers with thousands separators', () => {
      expect(PropertyFormatter.parseNumber('1,234')).toBe(1234);
      expect(PropertyFormatter.parseNumber('1,234,567')).toBe(1234567);
    });

    it('should parse numbers with units', () => {
      expect(PropertyFormatter.parseNumber('100px', { unit: 'px' })).toBe(100);
      expect(PropertyFormatter.parseNumber('50%', { unit: '%' })).toBe(50);
    });

    it('should apply min constraint', () => {
      expect(PropertyFormatter.parseNumber('5', { min: 10 })).toBe(10);
    });

    it('should apply max constraint', () => {
      expect(PropertyFormatter.parseNumber('100', { max: 50 })).toBe(50);
    });

    it('should apply step constraint', () => {
      expect(PropertyFormatter.parseNumber('17', { step: 5 })).toBe(15);
      expect(PropertyFormatter.parseNumber('18', { step: 5 })).toBe(20);
    });

    it('should throw error for invalid number', () => {
      expect(() => PropertyFormatter.parseNumber('abc')).toThrow('无效的数字格式');
    });
  });

  // ============================================================================
  // 颜色解析测试
  // ============================================================================

  describe('parseColor()', () => {
    it('should parse hex colors', () => {
      expect(PropertyFormatter.parseColor('#ff0000')).toBe('#ff0000');
      expect(PropertyFormatter.parseColor('#f00')).toBe('#f00');
      expect(PropertyFormatter.parseColor('#ABCDEF')).toBe('#ABCDEF');
    });

    it('should parse rgb colors', () => {
      expect(PropertyFormatter.parseColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
    });

    it('should parse rgba colors', () => {
      expect(PropertyFormatter.parseColor('rgba(255, 0, 0, 0.5)')).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should parse hsl colors', () => {
      expect(PropertyFormatter.parseColor('hsl(0, 100%, 50%)')).toBe('hsl(0, 100%, 50%)');
    });

    it('should parse color names', () => {
      expect(PropertyFormatter.parseColor('red')).toBe('red');
      expect(PropertyFormatter.parseColor('transparent')).toBe('transparent');
    });

    it('should throw error for invalid color', () => {
      expect(() => PropertyFormatter.parseColor('invalid')).toThrow('无效的颜色格式');
      expect(() => PropertyFormatter.parseColor('#gg0000')).toThrow('无效的颜色格式');
    });
  });

  // ============================================================================
  // 验证测试
  // ============================================================================

  describe('validate()', () => {
    it('should validate with multiple rules', () => {
      const rules = [
        { type: 'required' as const, message: '必填' },
        { type: 'length' as const, params: { min: 3, max: 10 } },
      ];

      expect(PropertyFormatter.validate('hello', rules)).toBeNull();
      expect(PropertyFormatter.validate('', rules)?.code).toBe(ValidationErrorCode.REQUIRED);
      expect(PropertyFormatter.validate('ab', rules)?.code).toBe(ValidationErrorCode.LENGTH_TOO_SHORT);
      expect(PropertyFormatter.validate('12345678901', rules)?.code).toBe(ValidationErrorCode.LENGTH_EXCEEDED);
    });
  });

  describe('validateRequired()', () => {
    it('should validate required values', () => {
      expect(PropertyFormatter.validateRequired('value')).toBeNull();
      expect(PropertyFormatter.validateRequired(123)).toBeNull();
      expect(PropertyFormatter.validateRequired(true)).toBeNull();
    });

    it('should reject null/undefined/empty', () => {
      expect(PropertyFormatter.validateRequired(null)?.code).toBe(ValidationErrorCode.REQUIRED);
      expect(PropertyFormatter.validateRequired(undefined)?.code).toBe(ValidationErrorCode.REQUIRED);
      expect(PropertyFormatter.validateRequired('')?.code).toBe(ValidationErrorCode.REQUIRED);
    });
  });

  describe('validateType()', () => {
    it('should validate text type', () => {
      expect(PropertyFormatter.validateType('hello', PropertyType.Text)).toBeNull();
      expect(PropertyFormatter.validateType(123, PropertyType.Text)?.code).toBe(ValidationErrorCode.TYPE_MISMATCH);
    });

    it('should validate number type', () => {
      expect(PropertyFormatter.validateType(123, PropertyType.Number)).toBeNull();
      expect(PropertyFormatter.validateType('123', PropertyType.Number)?.code).toBe(ValidationErrorCode.TYPE_MISMATCH);
    });

    it('should validate boolean type', () => {
      expect(PropertyFormatter.validateType(true, PropertyType.Checkbox)).toBeNull();
      expect(PropertyFormatter.validateType(false, PropertyType.Checkbox)).toBeNull();
      expect(PropertyFormatter.validateType('true', PropertyType.Checkbox)?.code).toBe(ValidationErrorCode.TYPE_MISMATCH);
    });
  });

  describe('validateRange()', () => {
    it('should validate numbers within range', () => {
      expect(PropertyFormatter.validateRange(50, 0, 100)).toBeNull();
      expect(PropertyFormatter.validateRange(0, 0, 100)).toBeNull();
      expect(PropertyFormatter.validateRange(100, 0, 100)).toBeNull();
    });

    it('should reject numbers out of range', () => {
      expect(PropertyFormatter.validateRange(-1, 0, 100)?.code).toBe(ValidationErrorCode.OUT_OF_RANGE);
      expect(PropertyFormatter.validateRange(101, 0, 100)?.code).toBe(ValidationErrorCode.OUT_OF_RANGE);
    });

    it('should validate with only min', () => {
      expect(PropertyFormatter.validateRange(50, 0)).toBeNull();
      expect(PropertyFormatter.validateRange(-1, 0)?.code).toBe(ValidationErrorCode.OUT_OF_RANGE);
    });

    it('should validate with only max', () => {
      expect(PropertyFormatter.validateRange(50, undefined, 100)).toBeNull();
      expect(PropertyFormatter.validateRange(101, undefined, 100)?.code).toBe(ValidationErrorCode.OUT_OF_RANGE);
    });
  });

  describe('validateLength()', () => {
    it('should validate string length', () => {
      expect(PropertyFormatter.validateLength('hello', 1, 10)).toBeNull();
      expect(PropertyFormatter.validateLength('', 1, 10)?.code).toBe(ValidationErrorCode.LENGTH_TOO_SHORT);
      expect(PropertyFormatter.validateLength('12345678901', 1, 10)?.code).toBe(ValidationErrorCode.LENGTH_EXCEEDED);
    });

    it('should validate with only min length', () => {
      expect(PropertyFormatter.validateLength('hello', 3)).toBeNull();
      expect(PropertyFormatter.validateLength('ab', 3)?.code).toBe(ValidationErrorCode.LENGTH_TOO_SHORT);
    });

    it('should validate with only max length', () => {
      expect(PropertyFormatter.validateLength('hello', undefined, 10)).toBeNull();
      expect(PropertyFormatter.validateLength('12345678901', undefined, 10)?.code).toBe(ValidationErrorCode.LENGTH_EXCEEDED);
    });
  });

  describe('validatePattern()', () => {
    it('should validate with regex pattern', () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(PropertyFormatter.validatePattern('test@example.com', emailPattern)).toBeNull();
      expect(PropertyFormatter.validatePattern('invalid-email', emailPattern)?.code).toBe(ValidationErrorCode.PATTERN_MISMATCH);
    });

    it('should validate phone pattern', () => {
      const phonePattern = /^\d{11}$/;
      expect(PropertyFormatter.validatePattern('13812345678', phonePattern)).toBeNull();
      expect(PropertyFormatter.validatePattern('123', phonePattern)?.code).toBe(ValidationErrorCode.PATTERN_MISMATCH);
    });
  });

  describe('validateEnum()', () => {
    it('should validate enum values', () => {
      const options = ['small', 'medium', 'large'];
      expect(PropertyFormatter.validateEnum('small', options)).toBeNull();
      expect(PropertyFormatter.validateEnum('medium', options)).toBeNull();
      expect(PropertyFormatter.validateEnum('invalid', options)?.code).toBe(ValidationErrorCode.INVALID_ENUM);
    });

    it('should validate number enum', () => {
      const options = [1, 2, 3];
      expect(PropertyFormatter.validateEnum(1, options)).toBeNull();
      expect(PropertyFormatter.validateEnum(4, options)?.code).toBe(ValidationErrorCode.INVALID_ENUM);
    });
  });

  // ============================================================================
  // 日期时间解析测试
  // ============================================================================

  describe('parseDate()', () => {
    it('should parse valid dates', () => {
      const result = PropertyFormatter.parseDate('2026-01-23');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(23);
    });

    it('should throw error for invalid date', () => {
      expect(() => PropertyFormatter.parseDate('invalid')).toThrow('无效的日期格式');
    });
  });

  describe('parseTime()', () => {
    it('should parse valid times', () => {
      const result = PropertyFormatter.parseTime('14:30:00');
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    });

    it('should parse time without seconds', () => {
      const result = PropertyFormatter.parseTime('14:30');
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('should throw error for invalid time', () => {
      expect(() => PropertyFormatter.parseTime('invalid')).toThrow('无效的时间格式');
    });
  });

  describe('parseDateTime()', () => {
    it('should parse valid datetime', () => {
      const result = PropertyFormatter.parseDateTime('2026-01-23 14:30:00');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(23);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('should throw error for invalid datetime', () => {
      expect(() => PropertyFormatter.parseDateTime('invalid')).toThrow('无效的日期时间格式');
    });
  });

  // ============================================================================
  // 类型转换测试
  // ============================================================================

  describe('coerce()', () => {
    it('should coerce to text', () => {
      expect(PropertyFormatter.coerce(123, PropertyType.Text)).toBe('123');
      expect(PropertyFormatter.coerce(true, PropertyType.Text)).toBe('true');
    });

    it('should coerce to number', () => {
      expect(PropertyFormatter.coerce('123', PropertyType.Number)).toBe(123);
      expect(PropertyFormatter.coerce('123.45', PropertyType.Number)).toBe(123.45);
    });

    it('should coerce to boolean', () => {
      expect(PropertyFormatter.coerce(1, PropertyType.Checkbox)).toBe(true);
      expect(PropertyFormatter.coerce(0, PropertyType.Checkbox)).toBe(false);
      expect(PropertyFormatter.coerce('hello', PropertyType.Checkbox)).toBe(true);
    });

    it('should return null for invalid coercion', () => {
      expect(PropertyFormatter.coerce('abc', PropertyType.Number)).toBeNull();
      expect(PropertyFormatter.coerce('invalid json', PropertyType.Json)).toBeNull();
    });

    it('should return null for null/undefined input', () => {
      expect(PropertyFormatter.coerce(null, PropertyType.Text)).toBeNull();
      expect(PropertyFormatter.coerce(undefined, PropertyType.Number)).toBeNull();
    });
  });
});
