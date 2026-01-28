/**
 * 代码格式化器测试
 */

import { describe, it, expect } from 'vitest';
import { CodeFormatter, formatCode, beautifyObject } from '../formatter';

describe('CodeFormatter', () => {
  describe('format', () => {
    it('should format basic code', () => {
      const formatter = new CodeFormatter();
      const code = `const x=1;const y=2;`;

      const formatted = formatter.format(code);

      expect(formatted).toBeTruthy();
      expect(formatted).toContain('const');
    });

    it('should handle single quotes', () => {
      const formatter = new CodeFormatter({ quotes: 'single' });
      const code = `const name = "test"`;

      const formatted = formatter.format(code);

      expect(formatted).toContain("'test'");
    });

    it('should handle double quotes', () => {
      const formatter = new CodeFormatter({ quotes: 'double' });
      const code = `const name = 'test'`;

      const formatted = formatter.format(code);

      expect(formatted).toContain('"test"');
    });
  });

  describe('indent', () => {
    it('should add indentation', () => {
      const formatter = new CodeFormatter();
      const code = 'const x = 1';

      const indented = formatter.indent(code, 2);

      expect(indented).toMatch(/^\s{4}/); // 2 levels * 2 spaces
    });

    it('should handle multiple lines', () => {
      const formatter = new CodeFormatter();
      const code = 'line1\nline2\nline3';

      const indented = formatter.indent(code, 1);

      const lines = indented.split('\n');
      expect(lines).toHaveLength(3);
      lines.forEach((line) => {
        if (line.trim().length > 0) {
          expect(line).toMatch(/^\s{2}/);
        }
      });
    });
  });

  describe('beautifyObject', () => {
    it('should beautify simple object', () => {
      const formatter = new CodeFormatter();
      const obj = { name: 'test', age: 18 };

      const result = formatter.beautifyObject(obj);

      expect(result).toContain('name');
      expect(result).toContain('test');
      expect(result).toContain('age');
      expect(result).toContain('18');
    });

    it('should beautify nested object', () => {
      const formatter = new CodeFormatter();
      const obj = {
        user: {
          name: 'test',
          profile: {
            age: 18,
          },
        },
      };

      const result = formatter.beautifyObject(obj);

      expect(result).toContain('user');
      expect(result).toContain('name');
      expect(result).toContain('profile');
    });

    it('should beautify array', () => {
      const formatter = new CodeFormatter();
      const obj = { items: [1, 2, 3] };

      const result = formatter.beautifyObject(obj);

      expect(result).toContain('items');
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    it('should handle empty object', () => {
      const formatter = new CodeFormatter();
      const obj = {};

      const result = formatter.beautifyObject(obj);

      expect(result).toBe('{}');
    });

    it('should handle null and undefined', () => {
      const formatter = new CodeFormatter();

      expect(formatter.beautifyObject(null)).toBe('null');
      expect(formatter.beautifyObject(undefined)).toBe('undefined');
    });
  });

  describe('formatPageOrComponent', () => {
    it('should format Page structure', () => {
      const formatter = new CodeFormatter();
      const code = `Page({data:{x:1},onLoad(){console.log('test')}})`;

      const formatted = formatter.formatPageOrComponent(code);

      expect(formatted).toContain('Page(');
      expect(formatted).toContain('data:');
      expect(formatted).toContain('onLoad');
    });

    it('should format Component structure', () => {
      const formatter = new CodeFormatter();
      const code = `Component({properties:{},methods:{handleTap(){}}})`;

      const formatted = formatter.formatPageOrComponent(code);

      expect(formatted).toContain('Component(');
      expect(formatted).toContain('properties');
      expect(formatted).toContain('methods');
    });
  });

  describe('utility functions', () => {
    it('formatCode should work', () => {
      const code = 'const x=1';
      const formatted = formatCode(code);

      expect(formatted).toBeTruthy();
    });

    it('beautifyObject should work', () => {
      const obj = { x: 1 };
      const result = beautifyObject(obj);

      expect(result).toContain('x');
      expect(result).toContain('1');
    });
  });
});
