// 变量类型定义
export type VariableType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  initialValue: unknown;
  currentValue?: unknown;
  description?: string;
  readonly?: boolean;
}

export interface VariableScope {
  scope: 'global' | 'page' | 'component';
  entityId?: string;
}

export interface VariableContainer {
  id: string;
  scope: VariableScope;
  variables: Variable[];
}

// 预定义的系统变量
export const SYSTEM_VARIABLES: Variable[] = [
  {
    id: 'sys_app_name',
    name: 'appName',
    type: 'string',
    initialValue: '',
    description: '小程序名称',
    readonly: true,
  },
  {
    id: 'sys_user_info',
    name: 'userInfo',
    type: 'object',
    initialValue: {},
    description: '用户信息',
  },
  {
    id: 'sys_is_logged_in',
    name: 'isLoggedIn',
    type: 'boolean',
    initialValue: false,
    description: '是否已登录',
  },
];
