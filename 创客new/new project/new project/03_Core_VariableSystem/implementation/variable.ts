/**
 * 微信小程序可视化开发平台 - Variable 类实现
 *
 * 参考 GDevelop 的 Variable.h/cpp 实现
 * 支持基本类型 (Number, String, Boolean) 和集合类型 (Structure, Array)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  VariableType,
  VariableValue,
  SerializedVariable,
  VariableOperationResult,
} from './types';

/**
 * Variable 类
 * 表示一个可以存储不同类型值的变量
 *
 * 参考 GDevelop gd::Variable
 */
export class Variable {
  private type: VariableType;
  private numberValue: number = 0;
  private stringValue: string = '';
  private boolValue: boolean = false;
  private children: Map<string, Variable> = new Map();
  private childrenArray: Variable[] = [];
  private folded: boolean = false;
  private persistentUuid: string = '';

  /**
   * 构造函数
   * @param initialValue 初始值 (可选)
   */
  constructor(initialValue?: VariableValue) {
    if (initialValue === undefined || initialValue === null) {
      this.type = VariableType.Number;
      this.numberValue = 0;
    } else if (typeof initialValue === 'number') {
      this.type = VariableType.Number;
      this.numberValue = isNaN(initialValue) ? 0 : initialValue;
    } else if (typeof initialValue === 'string') {
      this.type = VariableType.String;
      this.stringValue = initialValue;
    } else if (typeof initialValue === 'boolean') {
      this.type = VariableType.Boolean;
      this.boolValue = initialValue;
    } else if (Array.isArray(initialValue)) {
      this.type = VariableType.Array;
      this.childrenArray = initialValue.map((item) => new Variable(item));
    } else if (typeof initialValue === 'object') {
      this.type = VariableType.Structure;
      for (const [key, value] of Object.entries(initialValue)) {
        this.children.set(key, new Variable(value));
      }
    } else {
      this.type = VariableType.Unknown;
    }
  }

  // ============================================================================
  // 类型管理
  // ============================================================================

  /**
   * 获取变量类型
   */
  getType(): VariableType {
    return this.type;
  }

  /**
   * 检查是否是基本类型
   */
  isPrimitive(): boolean {
    return Variable.isPrimitiveType(this.type);
  }

  /**
   * 静态方法:检查类型是否是基本类型
   */
  static isPrimitiveType(type: VariableType): boolean {
    return (
      type === VariableType.Number ||
      type === VariableType.String ||
      type === VariableType.Boolean
    );
  }

  /**
   * 转换变量类型
   */
  castTo(newType: VariableType): void {
    if (this.type === newType) {
      return;
    }

    switch (newType) {
      case VariableType.Number:
        this.numberValue = this.getAsNumber();
        this.type = VariableType.Number;
        this.clearCollections();
        break;

      case VariableType.String:
        this.stringValue = this.getAsString();
        this.type = VariableType.String;
        this.clearCollections();
        break;

      case VariableType.Boolean:
        this.boolValue = this.getAsBoolean();
        this.type = VariableType.Boolean;
        this.clearCollections();
        break;

      case VariableType.Structure:
        this.type = VariableType.Structure;
        this.children.clear();
        this.childrenArray = [];
        break;

      case VariableType.Array:
        this.type = VariableType.Array;
        this.children.clear();
        this.childrenArray = [];
        break;

      default:
        this.type = VariableType.Unknown;
        this.clearCollections();
    }
  }

  private clearCollections(): void {
    this.children.clear();
    this.childrenArray = [];
  }

  // ============================================================================
  // 基本类型值访问
  // ============================================================================

  /**
   * 获取数字值
   */
  getValue(): number {
    return this.getAsNumber();
  }

  /**
   * 设置数字值
   */
  setValue(value: number): void {
    this.numberValue = isNaN(value) ? 0 : value;
    this.type = VariableType.Number;
  }

  /**
   * 获取字符串值
   */
  getString(): string {
    return this.getAsString();
  }

  /**
   * 设置字符串值
   */
  setString(value: string): void {
    this.stringValue = value;
    this.type = VariableType.String;
  }

  /**
   * 获取布尔值
   */
  getBool(): boolean {
    return this.getAsBoolean();
  }

  /**
   * 设置布尔值
   */
  setBool(value: boolean): void {
    this.boolValue = value;
    this.type = VariableType.Boolean;
  }

  /**
   * 获取任意类型的值
   */
  getAsValue(): VariableValue {
    switch (this.type) {
      case VariableType.Number:
        return this.numberValue;
      case VariableType.String:
        return this.stringValue;
      case VariableType.Boolean:
        return this.boolValue;
      case VariableType.Structure:
        return this.getStructureAsObject();
      case VariableType.Array:
        return this.getArrayAsArray();
      default:
        return null;
    }
  }

  /**
   * 设置任意类型的值
   */
  setFromValue(value: VariableValue): void {
    if (value === null || value === undefined) {
      this.setValue(0);
    } else if (typeof value === 'number') {
      this.setValue(value);
    } else if (typeof value === 'string') {
      this.setString(value);
    } else if (typeof value === 'boolean') {
      this.setBool(value);
    } else if (Array.isArray(value)) {
      this.castTo(VariableType.Array);
      this.childrenArray = value.map((item) => new Variable(item));
    } else if (typeof value === 'object') {
      this.castTo(VariableType.Structure);
      this.children.clear();
      for (const [key, val] of Object.entries(value)) {
        this.children.set(key, new Variable(val));
      }
    }
  }

  // ============================================================================
  // 类型转换辅助方法
  // ============================================================================

  private getAsNumber(): number {
    switch (this.type) {
      case VariableType.Number:
        return this.numberValue;
      case VariableType.String:
        const parsed = parseFloat(this.stringValue);
        return isNaN(parsed) ? 0 : parsed;
      case VariableType.Boolean:
        return this.boolValue ? 1 : 0;
      default:
        return 0;
    }
  }

  private getAsString(): string {
    switch (this.type) {
      case VariableType.String:
        return this.stringValue;
      case VariableType.Number:
        return String(this.numberValue);
      case VariableType.Boolean:
        return String(this.boolValue);
      case VariableType.Structure:
        return JSON.stringify(this.getStructureAsObject());
      case VariableType.Array:
        return JSON.stringify(this.getArrayAsArray());
      default:
        return '';
    }
  }

  private getAsBoolean(): boolean {
    switch (this.type) {
      case VariableType.Boolean:
        return this.boolValue;
      case VariableType.Number:
        return this.numberValue !== 0;
      case VariableType.String:
        return this.stringValue !== '' && this.stringValue !== 'false' && this.stringValue !== '0';
      default:
        return false;
    }
  }

  // ============================================================================
  // 结构体操作
  // ============================================================================

  /**
   * 检查是否有指定的子变量
   */
  hasChild(name: string): boolean {
    return this.children.has(name);
  }

  /**
   * 获取子变量 (不存在则自动创建)
   */
  getChild(name: string): Variable {
    if (this.type !== VariableType.Structure) {
      this.castTo(VariableType.Structure);
    }

    if (!this.children.has(name)) {
      this.children.set(name, new Variable());
    }

    return this.children.get(name)!;
  }

  /**
   * 获取子变量 (只读,不存在返回 null)
   */
  getChildOrNull(name: string): Variable | null {
    if (this.type !== VariableType.Structure) {
      return null;
    }
    return this.children.get(name) || null;
  }

  /**
   * 移除子变量
   */
  removeChild(name: string): boolean {
    if (this.type !== VariableType.Structure) {
      return false;
    }
    return this.children.delete(name);
  }

  /**
   * 重命名子变量
   */
  renameChild(oldName: string, newName: string): boolean {
    if (this.type !== VariableType.Structure) {
      return false;
    }

    if (!this.children.has(oldName) || this.children.has(newName)) {
      return false;
    }

    const child = this.children.get(oldName)!;
    this.children.delete(oldName);
    this.children.set(newName, child);
    return true;
  }

  /**
   * 获取所有子变量名
   */
  getAllChildrenNames(): string[] {
    if (this.type !== VariableType.Structure) {
      return [];
    }
    return Array.from(this.children.keys());
  }

  /**
   * 获取所有子变量
   */
  getAllChildren(): Map<string, Variable> {
    return this.children;
  }

  /**
   * 将结构体转换为普通对象
   */
  private getStructureAsObject(): { [key: string]: VariableValue } {
    const obj: { [key: string]: VariableValue } = {};
    for (const [key, child] of this.children) {
      obj[key] = child.getAsValue();
    }
    return obj;
  }

  // ============================================================================
  // 数组操作
  // ============================================================================

  /**
   * 获取数组指定索引的变量 (不存在则填充到该索引)
   */
  getAtIndex(index: number): Variable {
    if (this.type !== VariableType.Array) {
      this.castTo(VariableType.Array);
    }

    // 填充数组到指定索引
    while (this.childrenArray.length <= index) {
      this.childrenArray.push(new Variable());
    }

    return this.childrenArray[index];
  }

  /**
   * 获取数组指定索引的变量 (只读,不存在返回 null)
   */
  getAtIndexOrNull(index: number): Variable | null {
    if (this.type !== VariableType.Array || index < 0 || index >= this.childrenArray.length) {
      return null;
    }
    return this.childrenArray[index];
  }

  /**
   * 在数组末尾添加新变量并返回
   */
  pushNew(): Variable {
    if (this.type !== VariableType.Array) {
      this.castTo(VariableType.Array);
    }

    const newVar = new Variable();
    this.childrenArray.push(newVar);
    return newVar;
  }

  /**
   * 移除指定索引的变量
   */
  removeAtIndex(index: number): boolean {
    if (this.type !== VariableType.Array || index < 0 || index >= this.childrenArray.length) {
      return false;
    }

    this.childrenArray.splice(index, 1);
    return true;
  }

  /**
   * 在指定索引插入变量
   */
  insertAtIndex(variable: Variable, index: number): boolean {
    if (this.type !== VariableType.Array) {
      this.castTo(VariableType.Array);
    }

    if (index < 0) {
      return false;
    }

    // 填充数组到指定索引
    while (this.childrenArray.length < index) {
      this.childrenArray.push(new Variable());
    }

    this.childrenArray.splice(index, 0, variable.clone());
    return true;
  }

  /**
   * 移动数组中的子变量
   */
  moveChildInArray(oldIndex: number, newIndex: number): boolean {
    if (
      this.type !== VariableType.Array ||
      oldIndex < 0 ||
      oldIndex >= this.childrenArray.length ||
      newIndex < 0 ||
      newIndex >= this.childrenArray.length
    ) {
      return false;
    }

    const [movedItem] = this.childrenArray.splice(oldIndex, 1);
    this.childrenArray.splice(newIndex, 0, movedItem);
    return true;
  }

  /**
   * 获取数组长度
   */
  getChildrenCount(): number {
    if (this.type === VariableType.Structure) {
      return this.children.size;
    } else if (this.type === VariableType.Array) {
      return this.childrenArray.length;
    }
    return 0;
  }

  /**
   * 获取所有数组子变量
   */
  getAllChildrenArray(): Variable[] {
    return this.childrenArray;
  }

  /**
   * 清空所有子变量
   */
  clearChildren(): void {
    this.children.clear();
    this.childrenArray = [];
  }

  /**
   * 将数组转换为普通数组
   */
  private getArrayAsArray(): VariableValue[] {
    return this.childrenArray.map((child) => child.getAsValue());
  }

  // ============================================================================
  // UI 相关
  // ============================================================================

  /**
   * 设置是否折叠显示
   */
  setFolded(folded: boolean): void {
    this.folded = folded;
  }

  /**
   * 获取是否折叠显示
   */
  isFolded(): boolean {
    return this.folded;
  }

  // ============================================================================
  // 持久化UUID
  // ============================================================================

  /**
   * 重置持久化UUID
   */
  resetPersistentUuid(): Variable {
    this.persistentUuid = uuidv4();
    return this;
  }

  /**
   * 清除持久化UUID
   */
  clearPersistentUuid(): Variable {
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
  // 克隆和比较
  // ============================================================================

  /**
   * 克隆变量
   */
  clone(): Variable {
    const cloned = new Variable();
    cloned.type = this.type;
    cloned.numberValue = this.numberValue;
    cloned.stringValue = this.stringValue;
    cloned.boolValue = this.boolValue;
    cloned.folded = this.folded;
    cloned.persistentUuid = this.persistentUuid;

    // 克隆子变量
    for (const [key, child] of this.children) {
      cloned.children.set(key, child.clone());
    }

    for (const child of this.childrenArray) {
      cloned.childrenArray.push(child.clone());
    }

    return cloned;
  }

  /**
   * 比较两个变量是否相等
   */
  equals(other: Variable): boolean {
    if (this.type !== other.type) {
      return false;
    }

    switch (this.type) {
      case VariableType.Number:
        return this.numberValue === other.numberValue;
      case VariableType.String:
        return this.stringValue === other.stringValue;
      case VariableType.Boolean:
        return this.boolValue === other.boolValue;
      case VariableType.Structure:
        if (this.children.size !== other.children.size) {
          return false;
        }
        for (const [key, child] of this.children) {
          const otherChild = other.children.get(key);
          if (!otherChild || !child.equals(otherChild)) {
            return false;
          }
        }
        return true;
      case VariableType.Array:
        if (this.childrenArray.length !== other.childrenArray.length) {
          return false;
        }
        for (let i = 0; i < this.childrenArray.length; i++) {
          if (!this.childrenArray[i].equals(other.childrenArray[i])) {
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  }

  // ============================================================================
  // 序列化/反序列化
  // ============================================================================

  /**
   * 序列化为 JSON
   */
  toJSON(): SerializedVariable {
    const json: SerializedVariable = {
      type: this.type,
      folded: this.folded || undefined,
      persistentUuid: this.persistentUuid || undefined,
    };

    switch (this.type) {
      case VariableType.Number:
        json.value = this.numberValue;
        break;
      case VariableType.String:
        json.value = this.stringValue;
        break;
      case VariableType.Boolean:
        json.value = this.boolValue;
        break;
      case VariableType.Structure:
        json.children = {};
        for (const [key, child] of this.children) {
          json.children[key] = child.toJSON();
        }
        break;
      case VariableType.Array:
        json.childrenArray = this.childrenArray.map((child) => child.toJSON());
        break;
    }

    return json;
  }

  /**
   * 从 JSON 反序列化
   */
  static fromJSON(json: SerializedVariable): Variable {
    const variable = new Variable();
    variable.type = json.type;
    variable.folded = json.folded || false;
    variable.persistentUuid = json.persistentUuid || '';

    switch (json.type) {
      case VariableType.Number:
        variable.numberValue = (json.value as number) || 0;
        break;
      case VariableType.String:
        variable.stringValue = (json.value as string) || '';
        break;
      case VariableType.Boolean:
        variable.boolValue = (json.value as boolean) || false;
        break;
      case VariableType.Structure:
        if (json.children) {
          for (const [key, childJson] of Object.entries(json.children)) {
            variable.children.set(key, Variable.fromJSON(childJson));
          }
        }
        break;
      case VariableType.Array:
        if (json.childrenArray) {
          variable.childrenArray = json.childrenArray.map((childJson) =>
            Variable.fromJSON(childJson)
          );
        }
        break;
    }

    return variable;
  }

  // ============================================================================
  // 静态辅助方法
  // ============================================================================

  /**
   * 创建一个错误的变量 (用于返回错误情况)
   */
  static bad(): Variable {
    const badVar = new Variable();
    badVar.type = VariableType.Unknown;
    return badVar;
  }

  /**
   * 类型字符串转枚举
   */
  static stringAsType(typeStr: string): VariableType {
    switch (typeStr) {
      case 'Number':
        return VariableType.Number;
      case 'String':
        return VariableType.String;
      case 'Boolean':
        return VariableType.Boolean;
      case 'Structure':
        return VariableType.Structure;
      case 'Array':
        return VariableType.Array;
      default:
        return VariableType.Unknown;
    }
  }

  /**
   * 类型枚举转字符串
   */
  static typeAsString(type: VariableType): string {
    return type;
  }
}
