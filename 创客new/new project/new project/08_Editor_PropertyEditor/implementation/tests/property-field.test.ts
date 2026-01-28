/**
 * PropertyField 和 PropertyFieldFactory 测试
 */

import { describe, it, expect } from 'vitest';
import {
  PropertyField,
  TextPropertyField,
  NumberPropertyField,
  ColorPropertyField,
  SelectPropertyField,
  CheckboxPropertyField,
  SliderPropertyField,
  PropertyFieldFactory,
} from '../property-field';
import { PropertyType, PropertyDefinition } from '../types';

describe('PropertyField', () => {
  // ============================================================================
  // TextPropertyField 测试
  // ============================================================================

  describe('TextPropertyField', () => {
    const definition: PropertyDefinition = {
      name: 'test',
      label: '测试',
      type: PropertyType.Text,
      defaultValue: '',
    };

    it('should parse text value', () => {
      const field = new TextPropertyField(definition, '');
      const result = field.parse('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should format text value', () => {
      const field = new TextPropertyField(definition, 'Hello');
      const result = field.format('Hello');
      expect(result).toBe('Hello');
    });

    it('should validate text value', () => {
      const field = new TextPropertyField(definition, '');
      const error = field.validate('valid text');
      expect(error).toBeNull();
    });

    it('should get and set value', () => {
      const field = new TextPropertyField(definition, 'initial');
      expect(field.getValue()).toBe('initial');

      field.setValue('updated');
      expect(field.getValue()).toBe('updated');
    });
  });

  // ============================================================================
  // NumberPropertyField 测试
  // ============================================================================

  describe('NumberPropertyField', () => {
    const definition: PropertyDefinition = {
      name: 'count',
      label: '数量',
      type: PropertyType.Number,
      defaultValue: 0,
      options: {
        numberOptions: {
          min: 0,
          max: 100,
        },
      },
    };

    it('should parse number value', () => {
      const field = new NumberPropertyField(definition, 0);
      const result = field.parse('42');
      expect(result).toBe(42);
    });

    it('should parse decimal number', () => {
      const field = new NumberPropertyField(definition, 0);
      const result = field.parse('3.14');
      expect(result).toBe(3.14);
    });

    it('should format number value', () => {
      const field = new NumberPropertyField(definition, 0);
      const result = field.format(42);
      expect(result).toBe('42');
    });

    it('should validate number range', () => {
      const field = new NumberPropertyField(definition, 0);

      expect(field.validate(50)).toBeNull(); // 在范围内
      expect(field.validate(-1)?.code).toBeDefined(); // 小于 min
      expect(field.validate(150)?.code).toBeDefined(); // 大于 max
    });
  });

  // ============================================================================
  // ColorPropertyField 测试
  // ============================================================================

  describe('ColorPropertyField', () => {
    const definition: PropertyDefinition = {
      name: 'color',
      label: '颜色',
      type: PropertyType.Color,
      defaultValue: '#000000',
    };

    it('should parse hex color', () => {
      const field = new ColorPropertyField(definition, '#000000');
      const result = field.parse('#ff0000');
      expect(result).toBe('#ff0000');
    });

    it('should parse short hex color', () => {
      const field = new ColorPropertyField(definition, '#000');
      const result = field.parse('#f00');
      expect(result).toBe('#f00');
    });

    it('should parse rgb color', () => {
      const field = new ColorPropertyField(definition, 'rgb(0,0,0)');
      const result = field.parse('rgb(255, 0, 0)');
      expect(result).toBe('rgb(255, 0, 0)');
    });

    it('should format color value', () => {
      const field = new ColorPropertyField(definition, '#ff0000');
      const result = field.format('#ff0000');
      expect(result).toBe('#ff0000');
    });

    it('should validate color format', () => {
      const field = new ColorPropertyField(definition, '#000000');

      expect(field.validate('#ff0000')).toBeNull();
      expect(field.validate('invalid')?.code).toBeDefined();
    });
  });

  // ============================================================================
  // SelectPropertyField 测试
  // ============================================================================

  describe('SelectPropertyField', () => {
    const definition: PropertyDefinition = {
      name: 'size',
      label: '尺寸',
      type: PropertyType.Select,
      defaultValue: 'medium',
      options: {
        selectOptions: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' },
        ],
      },
    };

    it('should parse select value', () => {
      const field = new SelectPropertyField(definition, 'medium');
      const result = field.parse('large');
      expect(result).toBe('large');
    });

    it('should format select value', () => {
      const field = new SelectPropertyField(definition, 'medium');
      const result = field.format('medium');
      expect(result).toBe('medium');
    });

    it('should validate select value', () => {
      const field = new SelectPropertyField(definition, 'medium');

      expect(field.validate('small')).toBeNull();
      expect(field.validate('invalid')?.code).toBeDefined();
    });

    it('should get options', () => {
      const field = new SelectPropertyField(definition, 'medium');
      const options = field.getOptions();

      expect(options.length).toBe(3);
      expect(options[0].value).toBe('small');
    });
  });

  // ============================================================================
  // CheckboxPropertyField 测试
  // ============================================================================

  describe('CheckboxPropertyField', () => {
    const definition: PropertyDefinition = {
      name: 'enabled',
      label: '启用',
      type: PropertyType.Checkbox,
      defaultValue: false,
    };

    it('should parse boolean value', () => {
      const field = new CheckboxPropertyField(definition, false);

      expect(field.parse('true')).toBe(true);
      expect(field.parse('false')).toBe(false);
      expect(field.parse('1')).toBe(true);
      expect(field.parse('0')).toBe(false);
    });

    it('should format boolean value', () => {
      const field = new CheckboxPropertyField(definition, false);
      expect(field.format(true)).toBe('是');
      expect(field.format(false)).toBe('否');
    });

    it('should validate boolean value', () => {
      const field = new CheckboxPropertyField(definition, false);
      expect(field.validate(true)).toBeNull();
      expect(field.validate(false)).toBeNull();
    });
  });

  // ============================================================================
  // SliderPropertyField 测试
  // ============================================================================

  describe('SliderPropertyField', () => {
    const definition: PropertyDefinition = {
      name: 'volume',
      label: '音量',
      type: PropertyType.Slider,
      defaultValue: 50,
      options: {
        sliderOptions: {
          min: 0,
          max: 100,
          step: 1,
        },
      },
    };

    it('should parse slider value', () => {
      const field = new SliderPropertyField(definition, 50);
      const result = field.parse('75');
      expect(result).toBe(75);
    });

    it('should format slider value', () => {
      const field = new SliderPropertyField(definition, 50);
      const result = field.format(75);
      expect(result).toBe('75');
    });

    it('should validate slider range', () => {
      const field = new SliderPropertyField(definition, 50);

      expect(field.validate(50)).toBeNull();
      expect(field.validate(-1)?.code).toBeDefined();
      expect(field.validate(150)?.code).toBeDefined();
    });

    it('should get slider config', () => {
      const field = new SliderPropertyField(definition, 50);
      const config = field.getSliderConfig();

      expect(config.min).toBe(0);
      expect(config.max).toBe(100);
      expect(config.step).toBe(1);
    });
  });

  // ============================================================================
  // PropertyFieldFactory 测试
  // ============================================================================

  describe('PropertyFieldFactory', () => {
    it('should create text field', () => {
      const definition: PropertyDefinition = {
        name: 'test',
        label: '测试',
        type: PropertyType.Text,
        defaultValue: '',
      };

      const field = PropertyFieldFactory.create(PropertyType.Text, definition, 'value');
      expect(field).toBeInstanceOf(PropertyField);
      expect(field.getType()).toBe(PropertyType.Text);
    });

    it('should create number field', () => {
      const definition: PropertyDefinition = {
        name: 'count',
        label: '数量',
        type: PropertyType.Number,
        defaultValue: 0,
      };

      const field = PropertyFieldFactory.create(PropertyType.Number, definition, 0);
      expect(field).toBeInstanceOf(PropertyField);
      expect(field.getType()).toBe(PropertyType.Number);
    });

    it('should create color field', () => {
      const definition: PropertyDefinition = {
        name: 'color',
        label: '颜色',
        type: PropertyType.Color,
        defaultValue: '#000000',
      };

      const field = PropertyFieldFactory.create(PropertyType.Color, definition, '#000000');
      expect(field).toBeInstanceOf(PropertyField);
      expect(field.getType()).toBe(PropertyType.Color);
    });

    it('should throw error for unknown type', () => {
      const definition: PropertyDefinition = {
        name: 'unknown',
        label: '未知',
        type: 'unknownType' as PropertyType,
        defaultValue: null,
      };

      expect(() => {
        PropertyFieldFactory.create('unknownType' as PropertyType, definition, null);
      }).toThrow('未知属性类型');
    });

    it('should register custom field type', () => {
      PropertyFieldFactory.register({
        type: 'custom' as PropertyType,
        parse: (raw) => raw,
        format: (value) => String(value),
        validate: () => null,
      });

      const registration = PropertyFieldFactory.getRegistration('custom' as PropertyType);
      expect(registration).toBeDefined();
      expect(registration?.type).toBe('custom');
    });

    it('should get all registered types', () => {
      const types = PropertyFieldFactory.getAllTypes();
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain(PropertyType.Text);
      expect(types).toContain(PropertyType.Number);
    });

    it('should create field using custom component', () => {
      class CustomField extends PropertyField {
        parse(rawValue: string) {
          return rawValue.toUpperCase();
        }
        format(value: any) {
          return String(value);
        }
        validate() {
          return null;
        }
      }

      PropertyFieldFactory.register({
        type: 'customComponent' as PropertyType,
        parse: (raw) => raw,
        format: (value) => String(value),
        validate: () => null,
        component: CustomField,
      });

      const definition: PropertyDefinition = {
        name: 'test',
        label: '测试',
        type: 'customComponent' as PropertyType,
        defaultValue: '',
      };

      const field = PropertyFieldFactory.create(
        'customComponent' as PropertyType,
        definition,
        ''
      );

      expect(field).toBeInstanceOf(CustomField);
      expect(field.parse('hello')).toBe('HELLO');
    });
  });

  // ============================================================================
  // PropertyField 基类测试
  // ============================================================================

  describe('PropertyField Base Class', () => {
    const definition: PropertyDefinition = {
      name: 'test',
      label: '测试',
      type: PropertyType.Text,
      defaultValue: '',
    };

    it('should get definition', () => {
      const field = new TextPropertyField(definition, '');
      expect(field.getDefinition()).toBe(definition);
    });

    it('should get and set error', () => {
      const field = new TextPropertyField(definition, '');
      expect(field.getError()).toBeUndefined();

      const error = {
        code: 'TEST_ERROR' as any,
        message: '测试错误',
      };

      field.setError(error);
      expect(field.getError()).toBe(error);
    });

    it('should get type from definition', () => {
      const field = new TextPropertyField(definition, '');
      expect(field.getType()).toBe(PropertyType.Text);
    });
  });
});
