/**
 * 组件验证器测试套件
 */

import { describe, it, expect } from 'vitest';
import { ComponentValidator } from '../component-validator';
import { ComponentCategory, PropertyType, ComponentDefinition, PropertyDefinition } from '../types';

describe('ComponentValidator', () => {
  let validator: ComponentValidator;

  beforeEach(() => {
    validator = new ComponentValidator();
  });

  describe('组件定义验证', () => {
    it('应该验证有效的组件定义', () => {
      const component: ComponentDefinition = {
        id: 'valid-component',
        name: 'validComp',
        label: 'Valid Component',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: true,
        isContainer: true,
        isInline: false,
        properties: [],
        events: [],
      };

      const result = validator.validateComponentDefinition(component);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('应该检测缺少的必填字段', () => {
      const component: any = {
        id: 'incomplete',
        // 缺少 name
      };

      const result = validator.validateComponentDefinition(component);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_NAME')).toBe(true);
    });

    it('应该验证ID格式', () => {
      const component: ComponentDefinition = {
        id: 'Invalid-ID!',
        name: 'test',
        label: 'Test',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: true,
        isContainer: true,
        isInline: false,
        properties: [],
        events: [],
      };

      const result = validator.validateComponentDefinition(component);
      expect(result.errors.some((e) => e.code === 'INVALID_ID_FORMAT')).toBe(true);
    });

    it('应该验证属性定义', () => {
      const component: ComponentDefinition = {
        id: 'prop-test',
        name: 'test',
        label: 'Test',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: true,
        isContainer: true,
        isInline: false,
        properties: [
          {
            name: 'enumProp',
            label: 'Enum',
            type: PropertyType.Enum,
            // 缺少 options
          },
        ],
        events: [],
      };

      const result = validator.validateComponentDefinition(component);
      expect(result.errors.some((e) => e.code === 'MISSING_ENUM_OPTIONS')).toBe(true);
    });

    it('应该检测数值范围冲突', () => {
      const component: ComponentDefinition = {
        id: 'range-test',
        name: 'test',
        label: 'Test',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: true,
        isContainer: true,
        isInline: false,
        properties: [
          {
            name: 'numberProp',
            label: 'Number',
            type: PropertyType.Number,
            min: 100,
            max: 50, // 无效：最小值 > 最大值
          },
        ],
        events: [],
      };

      const result = validator.validateComponentDefinition(component);
      expect(result.errors.some((e) => e.code === 'INVALID_NUMBER_RANGE')).toBe(true);
    });
  });

  describe('属性值验证', () => {
    const stringProp: PropertyDefinition = {
      name: 'testString',
      label: 'String Prop',
      type: PropertyType.String,
    };

    const numberProp: PropertyDefinition = {
      name: 'testNumber',
      label: 'Number Prop',
      type: PropertyType.Number,
      min: 0,
      max: 100,
    };

    const enumProp: PropertyDefinition = {
      name: 'testEnum',
      label: 'Enum Prop',
      type: PropertyType.Enum,
      options: [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ],
    };

    it('应该验证字符串值', () => {
      const result = validator.validatePropertyValue(stringProp, 'hello');
      expect(result.valid).toBe(true);
    });

    it('应该验证数值范围', () => {
      const result = validator.validatePropertyValue(numberProp, 50);
      expect(result.valid).toBe(true);

      const tooHigh = validator.validatePropertyValue(numberProp, 150);
      expect(tooHigh.valid).toBe(false);
      expect(tooHigh.errors.some((e) => e.code === 'VALUE_ABOVE_MAX')).toBe(true);
    });

    it('应该验证枚举值', () => {
      const result = validator.validatePropertyValue(enumProp, 'a');
      expect(result.valid).toBe(true);

      const invalid = validator.validatePropertyValue(enumProp, 'c');
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.some((e) => e.code === 'INVALID_ENUM_VALUE')).toBe(true);
    });

    it('应该检测类型不匹配', () => {
      const result = validator.validatePropertyValue(numberProp, 'not a number');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'TYPE_MISMATCH')).toBe(true);
    });

    it('应该检测缺少的必填属性', () => {
      const requiredProp: PropertyDefinition = {
        name: 'required',
        label: 'Required',
        type: PropertyType.String,
        required: true,
      };

      const result = validator.validatePropertyValue(requiredProp, null);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_REQUIRED_PROPERTY')).toBe(true);
    });

    it('应该验证字符串长度', () => {
      const lengthProp: PropertyDefinition = {
        name: 'text',
        label: 'Text',
        type: PropertyType.String,
        minLength: 3,
        maxLength: 10,
      };

      const valid = validator.validatePropertyValue(lengthProp, 'hello');
      expect(valid.valid).toBe(true);

      const tooShort = validator.validatePropertyValue(lengthProp, 'ab');
      expect(tooShort.valid).toBe(false);

      const tooLong = validator.validatePropertyValue(lengthProp, 'hello world!');
      expect(tooLong.valid).toBe(false);
    });

    it('应该验证正则表达式', () => {
      const regexProp: PropertyDefinition = {
        name: 'email',
        label: 'Email',
        type: PropertyType.String,
        pattern: '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$',
      };

      const valid = validator.validatePropertyValue(regexProp, 'test@example.com');
      expect(valid.valid).toBe(true);

      const invalid = validator.validatePropertyValue(regexProp, 'not-an-email');
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.some((e) => e.code === 'PATTERN_MISMATCH')).toBe(true);
    });
  });

  describe('组件嵌套关系验证', () => {
    const parentComponent: ComponentDefinition = {
      id: 'parent',
      name: 'parent',
      label: 'Parent',
      category: ComponentCategory.ViewContainer,
      canHaveChildren: true,
      allowedChildren: ['child'],
      isContainer: true,
      isInline: false,
      properties: [],
      events: [],
    };

    const childComponent: ComponentDefinition = {
      id: 'child',
      name: 'child',
      label: 'Child',
      category: ComponentCategory.BasicContent,
      canHaveChildren: false,
      allowedParents: ['parent'],
      isContainer: false,
      isInline: true,
      properties: [],
      events: [],
    };

    const unallowedComponent: ComponentDefinition = {
      id: 'other',
      name: 'other',
      label: 'Other',
      category: ComponentCategory.BasicContent,
      canHaveChildren: false,
      isContainer: false,
      isInline: true,
      properties: [],
      events: [],
    };

    it('应该验证允许的子组件', () => {
      const result = validator.validateNestingRelationship(parentComponent, childComponent);
      expect(result.valid).toBe(true);
    });

    it('应该拒绝不允许的子组件', () => {
      const result = validator.validateNestingRelationship(parentComponent, unallowedComponent);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'CHILD_NOT_ALLOWED')).toBe(true);
    });

    it('应该检测容器限制冲突', () => {
      const restrictiveParent: ComponentDefinition = {
        id: 'restrictive',
        name: 'restrictive',
        label: 'Restrictive',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: false, // 不允许子组件
        isContainer: true,
        isInline: false,
        properties: [],
        events: [],
      };

      const result = validator.validateNestingRelationship(restrictiveParent, childComponent);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'PARENT_CANNOT_HAVE_CHILDREN')).toBe(true);
    });
  });

  describe('必填属性验证', () => {
    const component: ComponentDefinition = {
      id: 'test',
      name: 'test',
      label: 'Test',
      category: ComponentCategory.ViewContainer,
      canHaveChildren: true,
      isContainer: true,
      isInline: false,
      properties: [
        {
          name: 'required1',
          label: 'Required 1',
          type: PropertyType.String,
          required: true,
        },
        {
          name: 'required2',
          label: 'Required 2',
          type: PropertyType.Number,
          required: true,
        },
        {
          name: 'optional',
          label: 'Optional',
          type: PropertyType.String,
          required: false,
        },
      ],
      events: [],
    };

    it('应该验证所有必填属性', () => {
      const values = {
        required1: 'value1',
        required2: 42,
      };

      const result = validator.validateRequiredProperties(component, values);
      expect(result.valid).toBe(true);
    });

    it('应该检测缺少的必填属性', () => {
      const values = {
        required1: 'value1',
        // 缺少 required2
      };

      const result = validator.validateRequiredProperties(component, values);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
    });
  });

  describe('条件显示验证', () => {
    const conditionalProp: PropertyDefinition = {
      name: 'conditional',
      label: 'Conditional',
      type: PropertyType.String,
      visibleWhen: {
        property: 'type',
        operator: 'equals',
        value: 'advanced',
      },
    };

    it('应该验证等于条件', () => {
      const visible = validator.validateConditionalVisibility(conditionalProp, {
        type: 'advanced',
      });
      expect(visible).toBe(true);

      const hidden = validator.validateConditionalVisibility(conditionalProp, {
        type: 'simple',
      });
      expect(hidden).toBe(false);
    });

    it('应该验证包含条件', () => {
      const prop: PropertyDefinition = {
        name: 'test',
        label: 'Test',
        type: PropertyType.String,
        visibleWhen: {
          property: 'tags',
          operator: 'contains',
          value: 'advanced',
        },
      };

      const visible = validator.validateConditionalVisibility(prop, {
        tags: 'simple,advanced,other',
      });
      expect(visible).toBe(true);
    });

    it('应该验证不相等条件', () => {
      const prop: PropertyDefinition = {
        name: 'test',
        label: 'Test',
        type: PropertyType.String,
        visibleWhen: {
          property: 'disabled',
          operator: 'notEquals',
          value: true,
        },
      };

      const visible = validator.validateConditionalVisibility(prop, {
        disabled: false,
      });
      expect(visible).toBe(true);
    });
  });

  describe('批量验证', () => {
    const components: ComponentDefinition[] = [
      {
        id: 'valid-1',
        name: 'comp1',
        label: 'Component 1',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: true,
        isContainer: true,
        isInline: false,
        properties: [],
        events: [],
      },
      {
        id: 'valid-2',
        name: 'comp2',
        label: 'Component 2',
        category: ComponentCategory.BasicContent,
        canHaveChildren: false,
        isContainer: false,
        isInline: true,
        properties: [],
        events: [],
      },
    ];

    it('应该批量验证组件定义', () => {
      const results = validator.validateComponentDefinitions(components);
      expect(results.size).toBe(2);
      expect(results.get('valid-1')?.valid).toBe(true);
      expect(results.get('valid-2')?.valid).toBe(true);
    });
  });

  describe('快速验证函数', () => {
    it('应该快速验证属性值', () => {
      const prop: PropertyDefinition = {
        name: 'test',
        label: 'Test',
        type: PropertyType.Number,
        min: 0,
        max: 100,
      };

      const { valid } = validator.validatePropertyValue(prop, 50);
      expect(valid).toBe(true);
    });
  });
});
