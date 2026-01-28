/**
 * 数据管理生成器测试
 */

import { describe, it, expect } from 'vitest';
import { DataManagerGenerator, generateData, generateSetData } from '../data-manager-generator';
import type { Variable } from '../../../../01_Core_ProjectStructure/implementation/types';
import type { GenerationContext } from '../types';

describe('DataManagerGenerator', () => {
  const createContext = (): GenerationContext => ({
    type: 'page',
    name: 'test',
    variables: [],
    imports: new Set(),
    methods: new Map(),
    helpers: new Map(),
    indentLevel: 0,
    inAsyncContext: false,
    requiredAPIs: new Set(),
    config: { target: 'page' },
  });

  describe('generateDataObject', () => {
    it('should generate empty data object', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();

      const result = generator.generateDataObject([], context);

      expect(result).toBe('data: {}');
    });

    it('should generate data with string variable', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();

      const variables: Variable[] = [
        {
          id: 'var-1',
          name: 'title',
          type: 'string',
          initialValue: 'Hello',
        },
      ];

      const result = generator.generateDataObject(variables, context);

      expect(result).toContain('data:');
      expect(result).toContain('title');
      expect(result).toContain('Hello');
    });

    it('should generate data with number variable', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();

      const variables: Variable[] = [
        {
          id: 'var-1',
          name: 'count',
          type: 'number',
          initialValue: 42,
        },
      ];

      const result = generator.generateDataObject(variables, context);

      expect(result).toContain('count');
      expect(result).toContain('42');
    });

    it('should generate data with multiple variables', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();

      const variables: Variable[] = [
        { id: '1', name: 'title', type: 'string', initialValue: 'Test' },
        { id: '2', name: 'count', type: 'number', initialValue: 0 },
        { id: '3', name: 'visible', type: 'boolean', initialValue: true },
      ];

      const result = generator.generateDataObject(variables, context);

      expect(result).toContain('title');
      expect(result).toContain('count');
      expect(result).toContain('visible');
    });

    it('should handle array type', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();

      const variables: Variable[] = [
        {
          id: 'var-1',
          name: 'items',
          type: 'array',
          initialValue: [1, 2, 3],
        },
      ];

      const result = generator.generateDataObject(variables, context);

      expect(result).toContain('items');
    });

    it('should handle object type', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();

      const variables: Variable[] = [
        {
          id: 'var-1',
          name: 'user',
          type: 'object',
          initialValue: { name: 'test' },
        },
      ];

      const result = generator.generateDataObject(variables, context);

      expect(result).toContain('user');
    });
  });

  describe('generateSetDataCall', () => {
    it('should generate setData call', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();

      const updates = { title: 'New Title', count: 1 };
      const result = generator.generateSetDataCall(updates, context);

      expect(result).toContain('this.setData');
      expect(result).toContain('title');
      expect(result).toContain('count');
    });

    it('should handle empty updates', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();

      const result = generator.generateSetDataCall({}, context);

      expect(result).toBe('');
    });
  });

  describe('generateProperties', () => {
    it('should generate properties for component', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();
      context.type = 'component';

      const properties = [
        { name: 'title', type: 'string', defaultValue: '' },
        { name: 'count', type: 'number', defaultValue: 0 },
      ];

      const result = generator.generateProperties(properties, context);

      expect(result).toContain('properties:');
      expect(result).toContain('title');
      expect(result).toContain('count');
    });

    it('should handle empty properties', () => {
      const generator = new DataManagerGenerator();
      const context = createContext();

      const result = generator.generateProperties([], context);

      expect(result).toBe('properties: {}');
    });
  });

  describe('validate', () => {
    it('should validate valid variables', () => {
      const generator = new DataManagerGenerator();

      const input = {
        variables: [
          { id: '1', name: 'title', type: 'string' as const, initialValue: 'test' },
          { id: '2', name: 'count', type: 'number' as const, initialValue: 0 },
        ],
      };

      const result = generator.validate(input);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid variable names', () => {
      const generator = new DataManagerGenerator();

      const input = {
        variables: [
          { id: '1', name: '123invalid', type: 'string' as const, initialValue: '' },
        ],
      };

      const result = generator.validate(input);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect duplicate variable names', () => {
      const generator = new DataManagerGenerator();

      const input = {
        variables: [
          { id: '1', name: 'title', type: 'string' as const, initialValue: '' },
          { id: '2', name: 'title', type: 'string' as const, initialValue: '' },
        ],
      };

      const result = generator.validate(input);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about invalid initial values', () => {
      const generator = new DataManagerGenerator();

      const input = {
        variables: [
          { id: '1', name: 'count', type: 'number' as const, initialValue: 'not a number' },
        ],
      };

      const result = generator.validate(input);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('utility functions', () => {
    it('generateData should work', () => {
      const variables: Variable[] = [
        { id: '1', name: 'title', type: 'string', initialValue: 'test' },
      ];

      const result = generateData(variables);

      expect(result).toContain('title');
    });

    it('generateSetData should work', () => {
      const updates = { title: 'new' };
      const result = generateSetData(updates);

      expect(result).toContain('this.setData');
      expect(result).toContain('title');
    });
  });
});
