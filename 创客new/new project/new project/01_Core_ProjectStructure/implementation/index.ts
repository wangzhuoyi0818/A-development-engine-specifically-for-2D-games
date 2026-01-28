/**
 * 微信小程序可视化开发平台 - 项目结构管理模块
 *
 * 导出所有公共 API
 */

// 导出类型定义
export type * from './types';

// 导出项目管理器
export {
  MiniProgramProjectManager,
  ProjectError,
  ProjectNotFoundError,
  PageNotFoundError,
  ValidationError as ProjectValidationError,
  SerializationError,
} from './core';

// 导出组件树管理器
export {
  ComponentTreeManager,
  ComponentError,
  ComponentNotFoundError,
  ValidationError as ComponentValidationError,
} from './component-tree';
