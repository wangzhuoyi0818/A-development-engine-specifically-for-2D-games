/**
 * 组件编辑器模块入口
 *
 * 导出所有公共接口和类
 */

// 类型定义
export * from './types';

// 组件库
export { WxComponentLibrary, wxComponentLibrary } from './component-library';

// 属性编辑器
export { PropertyEditor, PropertyEditorFactory, PropertyValidationError } from './property-editor';

// 组件编辑器
export {
  ComponentEditor,
  ComponentEditorManager,
  componentEditorManager,
  ComponentEditorError,
} from './component-editor';

export type { ComponentData } from './component-editor';
