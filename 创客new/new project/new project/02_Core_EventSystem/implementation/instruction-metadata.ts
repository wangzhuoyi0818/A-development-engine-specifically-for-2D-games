/**
 * 微信小程序可视化开发平台 - 指令元数据
 *
 * 预定义的条件和动作的元数据
 * 用于验证、编译和执行事件
 */

import { InstructionMetadata } from './types';

// ============================================================================
// 条件元数据
// ============================================================================

/**
 * 预定义的条件元数据列表
 */
export const CONDITION_METADATA: Record<string, InstructionMetadata> = {
  // 比较条件
  comparison: {
    id: 'comparison',
    name: '比较',
    type: 'condition',
    description: '比较两个值是否相等、大于、小于等',
    category: '通用',
    parameters: [
      {
        name: 'leftOperand',
        type: 'expression',
        description: '左操作数',
      },
      {
        name: 'operator',
        type: 'string',
        description: '比较操作符',
        enumValues: ['==', '!=', '>', '<', '>=', '<=', '===', '!=='],
      },
      {
        name: 'rightOperand',
        type: 'expression',
        description: '右操作数',
      },
    ],
    returnType: 'boolean',
  },

  // 变量条件
  variableExists: {
    id: 'variableExists',
    name: '变量存在',
    type: 'condition',
    description: '检查变量是否存在',
    category: '变量',
    parameters: [
      {
        name: 'variableName',
        type: 'variable',
        description: '变量名',
      },
    ],
    returnType: 'boolean',
  },

  variableIsTrue: {
    id: 'variableIsTrue',
    name: '变量为真',
    type: 'condition',
    description: '检查变量值是否为真',
    category: '变量',
    parameters: [
      {
        name: 'variableName',
        type: 'variable',
        description: '变量名',
      },
    ],
    returnType: 'boolean',
  },

  // 字符串条件
  stringContains: {
    id: 'stringContains',
    name: '字符串包含',
    type: 'condition',
    description: '检查字符串是否包含子串',
    category: '字符串',
    parameters: [
      {
        name: 'string',
        type: 'expression',
        description: '字符串',
      },
      {
        name: 'substring',
        type: 'string',
        description: '子串',
      },
    ],
    returnType: 'boolean',
  },

  stringStartsWith: {
    id: 'stringStartsWith',
    name: '字符串开头',
    type: 'condition',
    description: '检查字符串是否以指定值开头',
    category: '字符串',
    parameters: [
      {
        name: 'string',
        type: 'expression',
        description: '字符串',
      },
      {
        name: 'prefix',
        type: 'string',
        description: '前缀',
      },
    ],
    returnType: 'boolean',
  },

  // 数组条件
  arrayContains: {
    id: 'arrayContains',
    name: '数组包含元素',
    type: 'condition',
    description: '检查数组是否包含指定元素',
    category: '数组',
    parameters: [
      {
        name: 'array',
        type: 'expression',
        description: '数组',
      },
      {
        name: 'element',
        type: 'expression',
        description: '元素',
      },
    ],
    returnType: 'boolean',
  },

  arrayLength: {
    id: 'arrayLength',
    name: '数组长度',
    type: 'condition',
    description: '检查数组长度',
    category: '数组',
    parameters: [
      {
        name: 'array',
        type: 'expression',
        description: '数组',
      },
      {
        name: 'operator',
        type: 'string',
        description: '比较操作符',
        enumValues: ['==', '!=', '>', '<', '>=', '<='],
      },
      {
        name: 'length',
        type: 'number',
        description: '长度',
      },
    ],
    returnType: 'boolean',
  },

  // 对象条件
  objectHasProperty: {
    id: 'objectHasProperty',
    name: '对象具有属性',
    type: 'condition',
    description: '检查对象是否具有指定属性',
    category: '对象',
    parameters: [
      {
        name: 'object',
        type: 'expression',
        description: '对象',
      },
      {
        name: 'property',
        type: 'string',
        description: '属性名',
      },
    ],
    returnType: 'boolean',
  },
};

// ============================================================================
// 动作元数据
// ============================================================================

/**
 * 预定义的动作元数据列表
 */
export const ACTION_METADATA: Record<string, InstructionMetadata> = {
  // ===== 数据操作 =====

  setData: {
    id: 'setData',
    name: '设置页面数据',
    type: 'action',
    description: '设置页面 data 中的数据',
    category: '数据',
    parameters: [
      {
        name: 'key',
        type: 'string',
        description: '数据键名',
      },
      {
        name: 'value',
        type: 'expression',
        description: '数据值',
      },
    ],
    returnType: 'void',
  },

  setVariable: {
    id: 'setVariable',
    name: '设置变量',
    type: 'action',
    description: '设置变量的值',
    category: '数据',
    parameters: [
      {
        name: 'variableName',
        type: 'variable',
        description: '变量名',
      },
      {
        name: 'value',
        type: 'expression',
        description: '新值',
      },
    ],
    returnType: 'void',
  },

  incrementVariable: {
    id: 'incrementVariable',
    name: '增加变量',
    type: 'action',
    description: '增加变量的值',
    category: '数据',
    parameters: [
      {
        name: 'variableName',
        type: 'variable',
        description: '变量名',
      },
      {
        name: 'amount',
        type: 'number',
        description: '增加量',
        defaultValue: 1,
      },
    ],
    returnType: 'void',
  },

  decrementVariable: {
    id: 'decrementVariable',
    name: '减少变量',
    type: 'action',
    description: '减少变量的值',
    category: '数据',
    parameters: [
      {
        name: 'variableName',
        type: 'variable',
        description: '变量名',
      },
      {
        name: 'amount',
        type: 'number',
        description: '减少量',
        defaultValue: 1,
      },
    ],
    returnType: 'void',
  },

  arrayPush: {
    id: 'arrayPush',
    name: '数组追加',
    type: 'action',
    description: '向数组末尾追加元素',
    category: '数据',
    parameters: [
      {
        name: 'array',
        type: 'variable',
        description: '数组变量',
      },
      {
        name: 'element',
        type: 'expression',
        description: '要追加的元素',
      },
    ],
    returnType: 'void',
  },

  arrayRemove: {
    id: 'arrayRemove',
    name: '数组移除',
    type: 'action',
    description: '从数组中移除指定元素',
    category: '数据',
    parameters: [
      {
        name: 'array',
        type: 'variable',
        description: '数组变量',
      },
      {
        name: 'element',
        type: 'expression',
        description: '要移除的元素',
      },
    ],
    returnType: 'void',
  },

  objectSet: {
    id: 'objectSet',
    name: '对象设置属性',
    type: 'action',
    description: '设置对象的属性值',
    category: '数据',
    parameters: [
      {
        name: 'object',
        type: 'variable',
        description: '对象变量',
      },
      {
        name: 'property',
        type: 'string',
        description: '属性名',
      },
      {
        name: 'value',
        type: 'expression',
        description: '属性值',
      },
    ],
    returnType: 'void',
  },

  // ===== 页面导航 =====

  navigateTo: {
    id: 'navigateTo',
    name: '打开页面',
    type: 'action',
    description: '保留当前页面,打开新页面',
    category: '导航',
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: '页面路径',
      },
      {
        name: 'params',
        type: 'object',
        description: '页面参数',
        optional: true,
      },
    ],
    returnType: 'void',
    async: true,
  },

  navigateBack: {
    id: 'navigateBack',
    name: '返回上一页',
    type: 'action',
    description: '关闭当前页面,返回上一页',
    category: '导航',
    parameters: [
      {
        name: 'delta',
        type: 'number',
        description: '返回的页面数量',
        defaultValue: 1,
        optional: true,
      },
    ],
    returnType: 'void',
  },

  redirectTo: {
    id: 'redirectTo',
    name: '重定向',
    type: 'action',
    description: '关闭当前页面,重定向到新页面',
    category: '导航',
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: '页面路径',
      },
    ],
    returnType: 'void',
  },

  // ===== UI 交互 =====

  showToast: {
    id: 'showToast',
    name: '显示提示',
    type: 'action',
    description: '显示消息提示框',
    category: 'UI',
    parameters: [
      {
        name: 'title',
        type: 'string',
        description: '提示内容',
      },
      {
        name: 'icon',
        type: 'string',
        description: '图标',
        enumValues: ['success', 'loading', 'error', 'none'],
        defaultValue: 'none',
        optional: true,
      },
      {
        name: 'duration',
        type: 'number',
        description: '持续时间(毫秒)',
        defaultValue: 1500,
        optional: true,
      },
    ],
    returnType: 'void',
  },

  showModal: {
    id: 'showModal',
    name: '显示模态框',
    type: 'action',
    description: '显示模态对话框',
    category: 'UI',
    parameters: [
      {
        name: 'title',
        type: 'string',
        description: '标题',
      },
      {
        name: 'content',
        type: 'string',
        description: '内容',
      },
      {
        name: 'showCancel',
        type: 'boolean',
        description: '是否显示取消按钮',
        defaultValue: true,
        optional: true,
      },
    ],
    returnType: 'void',
    async: true,
  },

  // ===== 组件操作 =====

  updateComponentProperty: {
    id: 'updateComponentProperty',
    name: '更新组件属性',
    type: 'action',
    description: '更新指定组件的属性',
    category: '组件',
    parameters: [
      {
        name: 'componentId',
        type: 'string',
        description: '组件ID',
      },
      {
        name: 'property',
        type: 'string',
        description: '属性名',
      },
      {
        name: 'value',
        type: 'expression',
        description: '新值',
      },
    ],
    returnType: 'void',
  },

  showComponent: {
    id: 'showComponent',
    name: '显示组件',
    type: 'action',
    description: '显示隐藏的组件',
    category: '组件',
    parameters: [
      {
        name: 'componentId',
        type: 'string',
        description: '组件ID',
      },
    ],
    returnType: 'void',
  },

  hideComponent: {
    id: 'hideComponent',
    name: '隐藏组件',
    type: 'action',
    description: '隐藏显示的组件',
    category: '组件',
    parameters: [
      {
        name: 'componentId',
        type: 'string',
        description: '组件ID',
      },
    ],
    returnType: 'void',
  },

  // ===== 网络操作 =====

  request: {
    id: 'request',
    name: '发起请求',
    type: 'action',
    description: '发起HTTP网络请求',
    category: '网络',
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: '请求URL',
      },
      {
        name: 'method',
        type: 'string',
        description: '请求方法',
        enumValues: ['GET', 'POST', 'PUT', 'DELETE'],
        defaultValue: 'GET',
        optional: true,
      },
      {
        name: 'data',
        type: 'object',
        description: '请求数据',
        optional: true,
      },
      {
        name: 'resultVariable',
        type: 'variable',
        description: '结果存储变量',
        optional: true,
      },
    ],
    returnType: 'void',
    async: true,
  },

  // ===== 媒体操作 =====

  chooseImage: {
    id: 'chooseImage',
    name: '选择图片',
    type: 'action',
    description: '从相册或相机选择图片',
    category: '媒体',
    parameters: [
      {
        name: 'count',
        type: 'number',
        description: '最多可选择的图片数量',
        defaultValue: 1,
        optional: true,
      },
      {
        name: 'resultVariable',
        type: 'variable',
        description: '结果存储变量',
      },
    ],
    returnType: 'void',
    async: true,
  },
};

/**
 * 根据ID获取指令元数据
 */
export function getInstructionMetadata(id: string, type: 'condition' | 'action'): InstructionMetadata | undefined {
  if (type === 'condition') {
    return CONDITION_METADATA[id];
  } else {
    return ACTION_METADATA[id];
  }
}

/**
 * 获取所有条件元数据
 */
export function getAllConditionMetadata(): InstructionMetadata[] {
  return Object.values(CONDITION_METADATA);
}

/**
 * 获取所有动作元数据
 */
export function getAllActionMetadata(): InstructionMetadata[] {
  return Object.values(ACTION_METADATA);
}

/**
 * 根据分类获取指令元数据
 */
export function getInstructionsByCategory(category: string, type?: 'condition' | 'action'): InstructionMetadata[] {
  const metadata = type === 'condition'
    ? CONDITION_METADATA
    : type === 'action'
      ? ACTION_METADATA
      : { ...CONDITION_METADATA, ...ACTION_METADATA };

  return Object.values(metadata).filter(meta => meta.category === category);
}

/**
 * 搜索指令元数据
 */
export function searchInstructions(query: string): InstructionMetadata[] {
  const lowerQuery = query.toLowerCase();
  const allMetadata = [...getAllConditionMetadata(), ...getAllActionMetadata()];

  return allMetadata.filter(meta => {
    // 在名称、描述、关键词中搜索
    const searchIn = [
      meta.name.toLowerCase(),
      meta.description?.toLowerCase() || '',
      ...(meta.keywords?.map(k => k.toLowerCase()) || []),
    ];

    return searchIn.some(text => text.includes(lowerQuery));
  });
}

