/**
 * 微信小程序可视化开发平台 - 变量系统模块
 *
 * 导出所有公共 API
 */

// 类型定义
export * from './types';

// 核心类
export { Variable } from './variable';
export { VariablesContainer } from './variables-container';
export { VariableResolver } from './variable-resolver';
export { ReactiveManager, createReactive } from './reactive';
