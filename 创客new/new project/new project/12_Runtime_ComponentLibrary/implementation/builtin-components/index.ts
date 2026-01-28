/**
 * 内置组件导出
 */

export { builtinViewComponents, viewComponent, scrollViewComponent, swiperComponent } from './view-components';
export { builtinContentComponents, textComponent, iconComponent, richTextComponent } from './content-components';
export { builtinFormComponents, buttonComponent, inputComponent, checkboxComponent } from './form-components';
export { builtinMediaComponents, imageComponent, videoComponent, audioComponent } from './media-components';
export {
  builtinMapCanvasNavigatorComponents,
  mapComponent,
  canvasComponent,
  navigatorComponent,
} from './map-canvas-navigator-components';

import { builtinViewComponents } from './view-components';
import { builtinContentComponents } from './content-components';
import { builtinFormComponents } from './form-components';
import { builtinMediaComponents } from './media-components';
import { builtinMapCanvasNavigatorComponents } from './map-canvas-navigator-components';

/**
 * 所有内置组件
 */
export const ALL_BUILTIN_COMPONENTS = [
  ...builtinViewComponents,
  ...builtinContentComponents,
  ...builtinFormComponents,
  ...builtinMediaComponents,
  ...builtinMapCanvasNavigatorComponents,
];

/**
 * 按分类组织的组件
 */
export const COMPONENTS_BY_CATEGORY = {
  'view-container': builtinViewComponents,
  'basic-content': builtinContentComponents,
  form: builtinFormComponents,
  media: builtinMediaComponents,
  map: [builtinMapCanvasNavigatorComponents[0]],
  canvas: [builtinMapCanvasNavigatorComponents[1]],
  navigation: [builtinMapCanvasNavigatorComponents[2], builtinMapCanvasNavigatorComponents[3]],
  'open-ability': [builtinMapCanvasNavigatorComponents[4], builtinMapCanvasNavigatorComponents[5]],
};

/**
 * 获取组件总数
 */
export function getTotalComponentCount(): number {
  return ALL_BUILTIN_COMPONENTS.length;
}

/**
 * 按名称查找组件
 */
export function findComponentByName(name: string) {
  return ALL_BUILTIN_COMPONENTS.find((comp) => comp.name === name);
}

/**
 * 按ID查找组件
 */
export function findComponentById(id: string) {
  return ALL_BUILTIN_COMPONENTS.find((comp) => comp.id === id);
}
