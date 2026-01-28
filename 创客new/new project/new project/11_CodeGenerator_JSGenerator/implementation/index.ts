/**
 * 微信小程序可视化开发平台 - JavaScript生成器模块入口
 */

// 导出类型
export * from './types';

// 导出主生成器
export { JSGenerator, createJSGenerator, generatePage, generateComponent } from './js-generator';

// 导出子生成器
export { CodeFormatter, createFormatter, formatCode, beautifyObject } from './formatter';
export { ImportGenerator, createImportGenerator, extractImportsFromCode, mergeImports } from './import-generator';
export { DataManagerGenerator, createDataManagerGenerator, generateData, generateSetData } from './data-manager-generator';
export { LifecycleGenerator, createLifecycleGenerator, generateLifecycle } from './lifecycle-generator';
export { EventHandlerGenerator, createEventHandlerGenerator } from './event-handler-generator';
export { MethodGenerator, createMethodGenerator } from './method-generator';

// 默认导出
export { createJSGenerator as default } from './js-generator';
