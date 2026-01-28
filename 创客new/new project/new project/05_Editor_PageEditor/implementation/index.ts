/**
 * 微信小程序可视化开发平台 - 页面编辑器模块入口
 */

// 导出类型定义
export type * from './types';

// 导出核心类
export { default as CanvasRenderer } from './canvas-renderer';
export { default as SelectionManager } from './selection-manager';
export { default as TransformManager } from './transform-manager';
export { default as CommandManager, CommandFactory } from './editor-commands';

// 导出命令类
export {
  BaseCommand,
  MoveCommand,
  ResizeCommand,
  DeleteCommand,
  AddCommand,
  UpdatePropertiesCommand,
  BatchCommandImpl,
} from './editor-commands';
