/**
 * 微信小程序可视化开发平台 - VariablesContainer 类实现
 *
 * 参考 GDevelop 的 VariablesContainer.h/cpp 实现
 * 管理一组变量,支持全局、页面、组件等不同作用域
 */

import { v4 as uuidv4 } from 'uuid';
import { Variable } from './variable';
import {
  VariableSourceType,
  SerializedVariablesContainer,
  VariableOperationResult,
} from './types';

/**
 * VariablesContainer 类
 * 管理一组变量的容器
 *
 * 参考 GDevelop gd::VariablesContainer
 */
export class VariablesContainer {
  private sourceType: VariableSourceType;
  private variables: Array<{ name: string; variable: Variable }> = [];
  private persistentUuid: string = '';

  /**
   * 构造函数
   * @param sourceType 变量来源类型
   */
  constructor(sourceType: VariableSourceType = VariableSourceType.Unknown) {
    this.sourceType = sourceType;
  }

  // ============================================================================
  // 作用域管理
  // ============================================================================

  /**
   * 获取变量来源类型
   */
  getSourceType(): VariableSourceType {
    return this.sourceType;
  }

  /**
   * 设置变量来源类型
   */
  setSourceType(sourceType: VariableSourceType): void {
    this.sourceType = sourceType;
  }

  // ============================================================================
  // 变量查询
  // ============================================================================

  /**
   * 检查是否存在指定名称的变量
   */
  has(name: string): boolean {
    return this.variables.some((v) => v.name === name);
  }

  /**
   * 获取指定名称的变量
   * 如果不存在,则创建一个新的变量
   */
  get(name: string): Variable {
    const entry = this.variables.find((v) => v.name === name);
    if (entry) {
      return entry.variable;
    }

    // 不存在则创建新变量
    const newVar = new Variable();
    this.variables.push({ name, variable: newVar });
    return newVar;
  }

  /**
   * 获取指定索引位置的变量
   */
  getAt(index: number): Variable | null {
    if (index < 0 || index >= this.variables.length) {
      return null;
    }
    return this.variables[index].variable;
  }

  /**
   * 获取指定名称的变量 (只读,不存在返回 null)
   */
  getOrNull(name: string): Variable | null {
    const entry = this.variables.find((v) => v.name === name);
    return entry ? entry.variable : null;
  }

  /**
   * 获取变量数量
   */
  count(): number {
    return this.variables.length;
  }

  /**
   * 获取指定索引位置的变量名
   */
  getNameAt(index: number): string | null {
    if (index < 0 || index >= this.variables.length) {
      return null;
    }
    return this.variables[index].name;
  }

  /**
   * 获取指定名称变量的索引位置
   */
  getPosition(name: string): number {
    return this.variables.findIndex((v) => v.name === name);
  }

  /**
   * 获取所有变量名
   */
  getAllNames(): string[] {
    return this.variables.map((v) => v.name);
  }

  // ============================================================================
  // 变量插入
  // ============================================================================

  /**
   * 插入新的空变量
   * @param name 变量名
   * @param position 插入位置 (默认末尾)
   * @returns 新创建的变量
   */
  insertNew(name: string, position?: number): Variable {
    // 检查是否已存在
    if (this.has(name)) {
      throw new Error(`Variable "${name}" already exists`);
    }

    const newVar = new Variable();
    const entry = { name, variable: newVar };

    if (position === undefined || position < 0 || position >= this.variables.length) {
      // 插入到末尾
      this.variables.push(entry);
    } else {
      // 插入到指定位置
      this.variables.splice(position, 0, entry);
    }

    return newVar;
  }

  /**
   * 插入已有变量的副本
   * @param name 变量名
   * @param variable 要插入的变量
   * @param position 插入位置 (默认末尾)
   * @returns 新创建的变量
   */
  insert(name: string, variable: Variable, position?: number): Variable {
    // 检查是否已存在
    if (this.has(name)) {
      throw new Error(`Variable "${name}" already exists`);
    }

    const clonedVar = variable.clone();
    const entry = { name, variable: clonedVar };

    if (position === undefined || position < 0 || position >= this.variables.length) {
      // 插入到末尾
      this.variables.push(entry);
    } else {
      // 插入到指定位置
      this.variables.splice(position, 0, entry);
    }

    return clonedVar;
  }

  // ============================================================================
  // 变量删除
  // ============================================================================

  /**
   * 移除指定名称的变量
   * @returns 是否移除成功
   */
  remove(name: string): boolean {
    const index = this.getPosition(name);
    if (index === -1) {
      return false;
    }

    this.variables.splice(index, 1);
    return true;
  }

  /**
   * 移除指定索引位置的变量
   * @returns 是否移除成功
   */
  removeAt(index: number): boolean {
    if (index < 0 || index >= this.variables.length) {
      return false;
    }

    this.variables.splice(index, 1);
    return true;
  }

  /**
   * 递归移除指定变量
   */
  removeRecursively(variable: Variable): boolean {
    // 先在顶层查找
    for (let i = 0; i < this.variables.length; i++) {
      if (this.variables[i].variable === variable) {
        this.variables.splice(i, 1);
        return true;
      }
    }

    // 在子变量中递归查找
    for (const entry of this.variables) {
      const v = entry.variable;
      if (v.getType() === 'Structure') {
        for (const [childName, child] of v.getAllChildren()) {
          if (child === variable) {
            v.removeChild(childName);
            return true;
          }
        }
      } else if (v.getType() === 'Array') {
        const arr = v.getAllChildrenArray();
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] === variable) {
            v.removeAtIndex(i);
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 清空所有变量
   */
  clear(): void {
    this.variables = [];
  }

  // ============================================================================
  // 变量重命名
  // ============================================================================

  /**
   * 重命名变量
   * @param oldName 旧名称
   * @param newName 新名称
   * @returns 是否重命名成功
   */
  rename(oldName: string, newName: string): boolean {
    if (oldName === newName) {
      return true;
    }

    // 检查新名称是否已存在
    if (this.has(newName)) {
      return false;
    }

    const entry = this.variables.find((v) => v.name === oldName);
    if (!entry) {
      return false;
    }

    entry.name = newName;
    return true;
  }

  // ============================================================================
  // 变量位置调整
  // ============================================================================

  /**
   * 交换两个变量的位置
   */
  swap(firstIndex: number, secondIndex: number): boolean {
    if (
      firstIndex < 0 ||
      firstIndex >= this.variables.length ||
      secondIndex < 0 ||
      secondIndex >= this.variables.length
    ) {
      return false;
    }

    const temp = this.variables[firstIndex];
    this.variables[firstIndex] = this.variables[secondIndex];
    this.variables[secondIndex] = temp;
    return true;
  }

  /**
   * 移动变量到新位置
   */
  move(oldIndex: number, newIndex: number): boolean {
    if (
      oldIndex < 0 ||
      oldIndex >= this.variables.length ||
      newIndex < 0 ||
      newIndex >= this.variables.length
    ) {
      return false;
    }

    const [movedEntry] = this.variables.splice(oldIndex, 1);
    this.variables.splice(newIndex, 0, movedEntry);
    return true;
  }

  // ============================================================================
  // 变量遍历
  // ============================================================================

  /**
   * 遍历所有变量
   */
  forEach(callback: (name: string, variable: Variable, index: number) => void): void {
    this.variables.forEach((entry, index) => {
      callback(entry.name, entry.variable, index);
    });
  }

  /**
   * 查找匹配搜索条件的变量
   */
  forEachVariableMatchingSearch(
    search: string,
    callback: (name: string, variable: Variable) => void
  ): void {
    const searchLower = search.toLowerCase();

    for (const entry of this.variables) {
      if (entry.name.toLowerCase().includes(searchLower)) {
        callback(entry.name, entry.variable);
      }
    }
  }

  /**
   * 筛选变量
   */
  filter(predicate: (name: string, variable: Variable) => boolean): Array<{
    name: string;
    variable: Variable;
  }> {
    return this.variables.filter((entry) => predicate(entry.name, entry.variable));
  }

  /**
   * 查找变量
   */
  find(
    predicate: (name: string, variable: Variable) => boolean
  ): { name: string; variable: Variable } | undefined {
    return this.variables.find((entry) => predicate(entry.name, entry.variable));
  }

  // ============================================================================
  // 批量操作
  // ============================================================================

  /**
   * 从另一个容器复制所有变量
   */
  copyFrom(other: VariablesContainer): void {
    this.clear();
    this.sourceType = other.sourceType;
    this.persistentUuid = other.persistentUuid;

    other.forEach((name, variable) => {
      this.variables.push({ name, variable: variable.clone() });
    });
  }

  /**
   * 合并另一个容器的变量 (重复的不覆盖)
   */
  mergeFrom(other: VariablesContainer, overwrite: boolean = false): void {
    other.forEach((name, variable) => {
      if (!this.has(name)) {
        this.variables.push({ name, variable: variable.clone() });
      } else if (overwrite) {
        const existing = this.get(name);
        existing.setFromValue(variable.getAsValue());
      }
    });
  }

  // ============================================================================
  // 持久化UUID
  // ============================================================================

  /**
   * 重置持久化UUID
   */
  resetPersistentUuid(): VariablesContainer {
    this.persistentUuid = uuidv4();
    return this;
  }

  /**
   * 清除持久化UUID
   */
  clearPersistentUuid(): VariablesContainer {
    this.persistentUuid = '';
    return this;
  }

  /**
   * 获取持久化UUID
   */
  getPersistentUuid(): string {
    return this.persistentUuid;
  }

  // ============================================================================
  // 序列化/反序列化
  // ============================================================================

  /**
   * 序列化为 JSON
   */
  toJSON(): SerializedVariablesContainer {
    return {
      sourceType: this.sourceType,
      variables: this.variables.map((entry) => ({
        name: entry.name,
        variable: entry.variable.toJSON(),
      })),
      persistentUuid: this.persistentUuid || undefined,
    };
  }

  /**
   * 从 JSON 反序列化
   */
  static fromJSON(json: SerializedVariablesContainer): VariablesContainer {
    const container = new VariablesContainer(json.sourceType);
    container.persistentUuid = json.persistentUuid || '';

    for (const entry of json.variables) {
      container.variables.push({
        name: entry.name,
        variable: Variable.fromJSON(entry.variable),
      });
    }

    return container;
  }

  /**
   * 导出为普通对象 (用于调试和展示)
   */
  toPlainObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const entry of this.variables) {
      obj[entry.name] = entry.variable.getAsValue();
    }
    return obj;
  }

  /**
   * 从普通对象导入
   */
  fromPlainObject(obj: Record<string, any>): void {
    this.clear();
    for (const [name, value] of Object.entries(obj)) {
      const variable = new Variable(value);
      this.variables.push({ name, variable });
    }
  }

  // ============================================================================
  // 调试和工具方法
  // ============================================================================

  /**
   * 获取容器的字符串表示 (用于调试)
   */
  toString(): string {
    const lines: string[] = [];
    lines.push(`VariablesContainer (${this.sourceType})`);
    lines.push(`Count: ${this.count()}`);
    lines.push('Variables:');

    this.forEach((name, variable, index) => {
      const type = variable.getType();
      const value = variable.getAsValue();
      lines.push(`  [${index}] ${name}: ${type} = ${JSON.stringify(value)}`);
    });

    return lines.join('\n');
  }

  /**
   * 验证容器状态
   */
  validate(): VariableOperationResult {
    const errors: string[] = [];

    // 检查是否有重复的变量名
    const names = new Set<string>();
    for (const entry of this.variables) {
      if (names.has(entry.name)) {
        errors.push(`Duplicate variable name: ${entry.name}`);
      }
      names.add(entry.name);
    }

    // 检查变量名是否合法
    for (const entry of this.variables) {
      if (!entry.name || entry.name.trim() === '') {
        errors.push('Empty variable name found');
      }
    }

    return {
      success: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      data: { errorCount: errors.length },
    };
  }

  // ============================================================================
  // 静态工具方法
  // ============================================================================

  /**
   * 创建一个全局变量容器
   */
  static createGlobalContainer(): VariablesContainer {
    return new VariablesContainer(VariableSourceType.Global);
  }

  /**
   * 创建一个页面变量容器
   */
  static createSceneContainer(): VariablesContainer {
    return new VariablesContainer(VariableSourceType.Scene);
  }

  /**
   * 创建一个组件变量容器
   */
  static createObjectContainer(): VariablesContainer {
    return new VariablesContainer(VariableSourceType.Object);
  }
}
