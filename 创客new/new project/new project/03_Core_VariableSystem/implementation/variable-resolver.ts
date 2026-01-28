/**
 * 微信小程序可视化开发平台 - VariableResolver 类实现
 *
 * 解析和访问变量路径,如 "player.health", "items[0].name"
 * GDevelop 中没有对应实现,这是新增的功能
 */

import { Variable } from './variable';
import { VariablesContainer } from './variables-container';
import {
  VariableValue,
  PathSegment,
  PathSegmentType,
  ParsedPath,
  VariableOperationResult,
} from './types';

/**
 * VariableResolver 类
 * 解析和访问变量路径
 *
 * 支持的路径格式:
 * - player.health - 点号访问结构体属性
 * - items[0] - 方括号访问数组索引
 * - player.inventory.items[0].name - 嵌套访问
 * - obj["key"] - 方括号访问结构体属性 (带引号)
 */
export class VariableResolver {
  private container: VariablesContainer;

  /**
   * 构造函数
   * @param container 变量容器
   */
  constructor(container: VariablesContainer) {
    this.container = container;
  }

  /**
   * 设置变量容器
   */
  setContainer(container: VariablesContainer): void {
    this.container = container;
  }

  /**
   * 获取变量容器
   */
  getContainer(): VariablesContainer {
    return this.container;
  }

  // ============================================================================
  // 路径解析
  // ============================================================================

  /**
   * 解析变量路径
   * @param path 路径字符串
   * @returns 解析后的路径对象
   *
   * @example
   * parsePath("player.health") => { root: "player", segments: [{ type: "Property", value: "health" }] }
   * parsePath("items[0]") => { root: "items", segments: [{ type: "Index", value: 0 }] }
   * parsePath("player.inventory.items[0].name") => { root: "player", segments: [...] }
   */
  parsePath(path: string): ParsedPath {
    if (!path || path.trim() === '') {
      throw new Error('Path cannot be empty');
    }

    const segments: PathSegment[] = [];
    let current = path.trim();

    // 提取根变量名
    const rootMatch = current.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (!rootMatch) {
      throw new Error(`Invalid path: ${path}`);
    }

    const root = rootMatch[1];
    current = current.substring(root.length);

    // 解析后续的访问路径
    while (current.length > 0) {
      if (current.startsWith('.')) {
        // 点号访问: .property
        current = current.substring(1);
        const propertyMatch = current.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (!propertyMatch) {
          throw new Error(`Invalid property access in path: ${path}`);
        }
        segments.push({
          type: PathSegmentType.Property,
          value: propertyMatch[1],
        });
        current = current.substring(propertyMatch[1].length);
      } else if (current.startsWith('[')) {
        // 方括号访问: [index] 或 ["key"]
        current = current.substring(1);
        const closeBracketIndex = current.indexOf(']');
        if (closeBracketIndex === -1) {
          throw new Error(`Unclosed bracket in path: ${path}`);
        }

        const bracketContent = current.substring(0, closeBracketIndex).trim();

        // 检查是否是数字索引
        if (/^\d+$/.test(bracketContent)) {
          segments.push({
            type: PathSegmentType.Index,
            value: parseInt(bracketContent, 10),
          });
        } else if (
          (bracketContent.startsWith('"') && bracketContent.endsWith('"')) ||
          (bracketContent.startsWith("'") && bracketContent.endsWith("'"))
        ) {
          // 字符串键 (带引号)
          const key = bracketContent.substring(1, bracketContent.length - 1);
          segments.push({
            type: PathSegmentType.Property,
            value: key,
          });
        } else {
          throw new Error(`Invalid bracket content in path: ${path}`);
        }

        current = current.substring(closeBracketIndex + 1);
      } else {
        throw new Error(`Invalid path syntax: ${path}`);
      }
    }

    return {
      root,
      segments,
      raw: path,
    };
  }

  // ============================================================================
  // 变量解析和访问
  // ============================================================================

  /**
   * 解析路径并返回对应的变量
   * @param path 路径字符串
   * @param createIfNotExist 如果路径不存在,是否自动创建 (默认 false)
   * @returns 变量对象,如果不存在且不自动创建则返回 null
   */
  resolve(path: string, createIfNotExist: boolean = false): Variable | null {
    try {
      const parsed = this.parsePath(path);

      // 获取根变量
      let current: Variable | null = createIfNotExist
        ? this.container.get(parsed.root)
        : this.container.getOrNull(parsed.root);

      if (!current) {
        return null;
      }

      // 遍历路径段
      for (const segment of parsed.segments) {
        if (segment.type === PathSegmentType.Property) {
          const propertyName = segment.value as string;
          if (createIfNotExist) {
            current = current.getChild(propertyName);
          } else {
            current = current.getChildOrNull(propertyName);
            if (!current) {
              return null;
            }
          }
        } else if (segment.type === PathSegmentType.Index) {
          const index = segment.value as number;
          if (createIfNotExist) {
            current = current.getAtIndex(index);
          } else {
            current = current.getAtIndexOrNull(index);
            if (!current) {
              return null;
            }
          }
        }
      }

      return current;
    } catch (error) {
      console.error(`Error resolving path "${path}":`, error);
      return null;
    }
  }

  /**
   * 获取变量值
   * @param path 路径字符串
   * @param defaultValue 默认值 (路径不存在时返回)
   * @returns 变量值
   */
  getValue(path: string, defaultValue?: VariableValue): VariableValue {
    const variable = this.resolve(path, false);
    if (!variable) {
      return defaultValue !== undefined ? defaultValue : null;
    }
    return variable.getAsValue();
  }

  /**
   * 设置变量值
   * @param path 路径字符串
   * @param value 要设置的值
   * @param createIfNotExist 如果路径不存在,是否自动创建 (默认 true)
   * @returns 操作结果
   */
  setValue(
    path: string,
    value: VariableValue,
    createIfNotExist: boolean = true
  ): VariableOperationResult {
    try {
      const variable = this.resolve(path, createIfNotExist);
      if (!variable) {
        return {
          success: false,
          error: `Variable path "${path}" not found`,
        };
      }

      variable.setFromValue(value);
      return {
        success: true,
        data: { path, value },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 检查路径是否存在
   */
  exists(path: string): boolean {
    return this.resolve(path, false) !== null;
  }

  /**
   * 删除指定路径的变量
   */
  delete(path: string): VariableOperationResult {
    try {
      const parsed = this.parsePath(path);

      // 如果是根变量,直接从容器删除
      if (parsed.segments.length === 0) {
        const success = this.container.remove(parsed.root);
        return {
          success,
          error: success ? undefined : `Variable "${parsed.root}" not found`,
        };
      }

      // 找到父变量
      const parentPath = this.getParentPath(path);
      const parentVariable = this.resolve(parentPath, false);
      if (!parentVariable) {
        return {
          success: false,
          error: `Parent variable "${parentPath}" not found`,
        };
      }

      // 删除子变量
      const lastSegment = parsed.segments[parsed.segments.length - 1];
      let success = false;

      if (lastSegment.type === PathSegmentType.Property) {
        success = parentVariable.removeChild(lastSegment.value as string);
      } else if (lastSegment.type === PathSegmentType.Index) {
        success = parentVariable.removeAtIndex(lastSegment.value as number);
      }

      return {
        success,
        error: success ? undefined : `Failed to delete variable at path "${path}"`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ============================================================================
  // 路径操作辅助方法
  // ============================================================================

  /**
   * 获取父路径
   * @example
   * getParentPath("player.health") => "player"
   * getParentPath("items[0].name") => "items[0]"
   */
  private getParentPath(path: string): string {
    const parsed = this.parsePath(path);
    if (parsed.segments.length === 0) {
      return '';
    }

    let parentPath = parsed.root;
    for (let i = 0; i < parsed.segments.length - 1; i++) {
      const segment = parsed.segments[i];
      if (segment.type === PathSegmentType.Property) {
        parentPath += `.${segment.value}`;
      } else if (segment.type === PathSegmentType.Index) {
        parentPath += `[${segment.value}]`;
      }
    }

    return parentPath;
  }

  /**
   * 规范化路径 (将所有方括号属性访问转换为点号访问)
   * @example
   * normalizePath('obj["key"]') => "obj.key"
   */
  normalizePath(path: string): string {
    const parsed = this.parsePath(path);
    let normalized = parsed.root;

    for (const segment of parsed.segments) {
      if (segment.type === PathSegmentType.Property) {
        normalized += `.${segment.value}`;
      } else if (segment.type === PathSegmentType.Index) {
        normalized += `[${segment.value}]`;
      }
    }

    return normalized;
  }

  /**
   * 将路径分割为父路径和子键
   */
  splitPath(path: string): { parent: string; child: string | number } | null {
    const parsed = this.parsePath(path);
    if (parsed.segments.length === 0) {
      return null;
    }

    const lastSegment = parsed.segments[parsed.segments.length - 1];
    const parentPath = this.getParentPath(path);

    return {
      parent: parentPath,
      child: lastSegment.value,
    };
  }

  // ============================================================================
  // 批量操作
  // ============================================================================

  /**
   * 批量获取多个变量的值
   */
  getValues(paths: string[]): Record<string, VariableValue> {
    const result: Record<string, VariableValue> = {};
    for (const path of paths) {
      result[path] = this.getValue(path);
    }
    return result;
  }

  /**
   * 批量设置多个变量的值
   */
  setValues(values: Record<string, VariableValue>): VariableOperationResult {
    const errors: string[] = [];

    for (const [path, value] of Object.entries(values)) {
      const result = this.setValue(path, value);
      if (!result.success) {
        errors.push(`${path}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      data: { successCount: Object.keys(values).length - errors.length, errorCount: errors.length },
    };
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  /**
   * 验证路径格式是否合法
   */
  validatePath(path: string): VariableOperationResult {
    try {
      this.parsePath(path);
      return {
        success: true,
        data: { path },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取路径描述 (用于调试)
   */
  describePath(path: string): string {
    try {
      const parsed = this.parsePath(path);
      const parts: string[] = [`Root: ${parsed.root}`];

      if (parsed.segments.length > 0) {
        parts.push('Segments:');
        parsed.segments.forEach((segment, index) => {
          if (segment.type === PathSegmentType.Property) {
            parts.push(`  [${index}] Property: ${segment.value}`);
          } else {
            parts.push(`  [${index}] Index: ${segment.value}`);
          }
        });
      }

      return parts.join('\n');
    } catch (error) {
      return `Invalid path: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * 列出指定路径下的所有子变量
   */
  listChildren(path: string): string[] {
    const variable = this.resolve(path, false);
    if (!variable) {
      return [];
    }

    const type = variable.getType();
    if (type === 'Structure') {
      return variable.getAllChildrenNames();
    } else if (type === 'Array') {
      const count = variable.getChildrenCount();
      return Array.from({ length: count }, (_, i) => String(i));
    }

    return [];
  }

  /**
   * 深度复制变量到另一个路径
   */
  copy(sourcePath: string, targetPath: string): VariableOperationResult {
    try {
      const sourceVar = this.resolve(sourcePath, false);
      if (!sourceVar) {
        return {
          success: false,
          error: `Source path "${sourcePath}" not found`,
        };
      }

      const cloned = sourceVar.clone();
      return this.setValue(targetPath, cloned.getAsValue(), true);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 移动变量到另一个路径
   */
  move(sourcePath: string, targetPath: string): VariableOperationResult {
    const copyResult = this.copy(sourcePath, targetPath);
    if (!copyResult.success) {
      return copyResult;
    }

    const deleteResult = this.delete(sourcePath);
    if (!deleteResult.success) {
      // 回滚:删除目标路径
      this.delete(targetPath);
      return deleteResult;
    }

    return {
      success: true,
      data: { sourcePath, targetPath },
    };
  }
}
