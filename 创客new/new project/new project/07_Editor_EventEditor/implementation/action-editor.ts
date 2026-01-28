/**
 * 动作编辑器
 *
 * 提供动作的编辑功能,包括:
 * - 动作类型选择
 * - 参数编辑
 * - 参数值来源选择 (常量/变量/表达式)
 */

import { v4 as uuid } from 'uuid';
import { Action, Expression } from '../../02_Core_EventSystem/implementation/types';
import { ActionTypeMetadata, OperationResult } from './types';

/**
 * 动作编辑器
 */
export class ActionEditor {
  private availableActionTypes: Map<string, ActionTypeMetadata> = new Map();

  constructor(actionTypes: ActionTypeMetadata[] = []) {
    this.registerActionTypes(actionTypes);
  }

  /**
   * 注册动作类型
   */
  registerActionType(metadata: ActionTypeMetadata): void {
    this.availableActionTypes.set(metadata.type, metadata);
  }

  /**
   * 批量注册动作类型
   */
  registerActionTypes(metadataList: ActionTypeMetadata[]): void {
    for (const metadata of metadataList) {
      this.registerActionType(metadata);
    }
  }

  /**
   * 创建新动作
   */
  createAction(type: string): OperationResult<Action> {
    const metadata = this.availableActionTypes.get(type);
    if (!metadata) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ACTION_TYPE',
          message: `未知的动作类型: ${type}`,
        },
      };
    }

    const parameters: Expression[] = metadata.parameters.map((param) => ({
      value: param.defaultValue?.toString() || '',
      type: 'literal',
    }));

    const action: Action = {
      id: uuid(),
      type: type as any,
      parameters,
      async: metadata.async,
    };

    return {
      success: true,
      data: action,
    };
  }

  /**
   * 克隆动作
   */
  cloneAction(action: Action): Action {
    return JSON.parse(JSON.stringify({
      ...action,
      id: uuid(),
    }));
  }
}

/**
 * 默认的动作类型元数据
 */
export const DEFAULT_ACTION_TYPES: ActionTypeMetadata[] = [
  {
    type: 'setData',
    label: '设置数据',
    description: '设置页面数据',
    icon: 'edit',
    category: '数据',
    parameters: [
      { name: '数据路径', type: 'string', description: '如: data.count' },
      { name: '值', type: 'expression', description: '要设置的值' },
    ],
    example: 'setData("data.count", 10)',
  },
  {
    type: 'navigateTo',
    label: '页面跳转',
    description: '跳转到指定页面',
    icon: 'link',
    category: '导航',
    parameters: [
      { name: '页面路径', type: 'string', description: '如: /pages/detail/detail' },
    ],
    async: true,
    example: 'navigateTo("/pages/detail/detail")',
  },
  {
    type: 'showToast',
    label: '显示提示',
    description: '显示Toast提示',
    icon: 'message',
    category: 'UI',
    parameters: [
      { name: '提示文本', type: 'string', description: '要显示的文本' },
      { name: '图标', type: 'string', optional: true, enumValues: [
        { label: '成功', value: 'success' },
        { label: '错误', value: 'error' },
        { label: '无', value: 'none' },
      ] },
    ],
    async: true,
    example: 'showToast("操作成功", "success")',
  },
];
