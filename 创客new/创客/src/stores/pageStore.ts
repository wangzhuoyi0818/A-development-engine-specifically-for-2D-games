import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Page, ComponentInstance, ComponentEvent, Position, Size, BackgroundLayer } from '@/types/miniprogram';
import { getComponentDefinition } from '@/constants/components';
import { useProjectStore } from './projectStore';

interface PageStore {
  // 状态
  currentPageId: string | null;
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  clipboard: ComponentInstance | null;
  history: Page[];
  historyIndex: number;

  // 页面操作
  setCurrentPage: (pageId: string | null) => void;
  getCurrentPage: () => Page | null;

  // 组件操作
  addComponent: (type: string, options?: { position?: Position; props?: Record<string, unknown>; name?: string }) => ComponentInstance | null;
  updateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  hoverComponent: (id: string | null) => void;
  duplicateComponent: (id: string) => ComponentInstance | null;
  moveComponent: (id: string, position: Position) => void;
  resizeComponent: (id: string, size: Size) => void;
  setComponentZIndex: (id: string, zIndex: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  lockComponent: (id: string, locked: boolean) => void;
  toggleComponentVisibility: (id: string) => void;

  // 剪贴板操作
  copyComponent: (id: string) => void;
  cutComponent: (id: string) => void;
  pasteComponent: (position?: Position) => ComponentInstance | null;

  // 事件操作
  addComponentEvent: (componentId: string, event: Omit<ComponentEvent, 'id'>) => void;
  updateComponentEvent: (componentId: string, eventId: string, event: Partial<ComponentEvent>) => void;
  deleteComponentEvent: (componentId: string, eventId: string) => void;

  // 历史操作
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveHistory: () => void;

  // 批量操作
  deleteSelectedComponents: () => void;
  selectAllComponents: () => void;

  // 背景图层操作
  addBackgroundLayer: (imageUrl: string, name: string) => BackgroundLayer | null;
  deleteBackgroundLayer: (layerId: string) => void;
  updateBackgroundLayer: (layerId: string, updates: Partial<BackgroundLayer>) => void;
  moveBackgroundLayerUp: (layerId: string) => void;
  moveBackgroundLayerDown: (layerId: string) => void;
  toggleBackgroundLayerVisibility: (layerId: string) => void;
}

const MAX_HISTORY = 50;

export const usePageStore = create<PageStore>()((set, get) => ({
  currentPageId: null,
  selectedComponentId: null,
  hoveredComponentId: null,
  clipboard: null,
  history: [],
  historyIndex: -1,

  setCurrentPage: (pageId: string | null) => {
    set({
      currentPageId: pageId,
      selectedComponentId: null,
      hoveredComponentId: null,
      history: [],
      historyIndex: -1,
    });
    // 保存初始状态到历史
    if (pageId) {
      const page = get().getCurrentPage();
      if (page) {
        set({ history: [JSON.parse(JSON.stringify(page))], historyIndex: 0 });
      }
    }
  },

  getCurrentPage: () => {
    const { currentPageId } = get();
    const { currentProject } = useProjectStore.getState();
    if (!currentProject || !currentPageId) return null;
    return currentProject.pages.find((p) => p.id === currentPageId) || null;
  },

  addComponent: (type: string, options?: { position?: Position; props?: Record<string, unknown>; name?: string }) => {
    const page = get().getCurrentPage();
    if (!page) return null;

    const definition = getComponentDefinition(type);
    if (!definition) return null;

    const newComponent: ComponentInstance = {
      id: uuidv4(),
      type,
      name: options?.name || `${definition.name}_${Date.now().toString(36)}`,
      props: { ...definition.defaultProps, ...options?.props },
      styles: { ...definition.defaultStyles },
      events: [],
      children: [],
      position: options?.position || { x: 10, y: 10 },
      size: {
        width: parseInt(String(definition.defaultStyles.width)) || 100,
        height: parseInt(String(definition.defaultStyles.height)) || 50,
      },
      zIndex: page.components.length + 1,
      locked: false,
      visible: true,
      parentId: null,
    };

    const updatedPage: Page = {
      ...page,
      components: [...page.components, newComponent],
    };

    useProjectStore.getState().updatePage(updatedPage);
    get().saveHistory();
    set({ selectedComponentId: newComponent.id });

    return newComponent;
  },

  updateComponent: (id: string, updates: Partial<ComponentInstance>) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const updatedPage: Page = {
      ...page,
      components: page.components.map((comp) =>
        comp.id === id ? { ...comp, ...updates } : comp
      ),
    };

    useProjectStore.getState().updatePage(updatedPage);
  },

  deleteComponent: (id: string) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const updatedPage: Page = {
      ...page,
      components: page.components.filter((comp) => comp.id !== id),
    };

    useProjectStore.getState().updatePage(updatedPage);
    get().saveHistory();

    if (get().selectedComponentId === id) {
      set({ selectedComponentId: null });
    }
  },

  selectComponent: (id: string | null) => {
    set({ selectedComponentId: id });
  },

  hoverComponent: (id: string | null) => {
    set({ hoveredComponentId: id });
  },

  duplicateComponent: (id: string) => {
    const page = get().getCurrentPage();
    if (!page) return null;

    const component = page.components.find((c) => c.id === id);
    if (!component) return null;

    const duplicated: ComponentInstance = {
      ...JSON.parse(JSON.stringify(component)),
      id: uuidv4(),
      name: `${component.name}_copy`,
      position: {
        x: component.position.x + 20,
        y: component.position.y + 20,
      },
      zIndex: page.components.length + 1,
    };

    const updatedPage: Page = {
      ...page,
      components: [...page.components, duplicated],
    };

    useProjectStore.getState().updatePage(updatedPage);
    get().saveHistory();
    set({ selectedComponentId: duplicated.id });

    return duplicated;
  },

  moveComponent: (id: string, position: Position) => {
    get().updateComponent(id, { position });
  },

  resizeComponent: (id: string, size: Size) => {
    get().updateComponent(id, { size });
  },

  setComponentZIndex: (id: string, zIndex: number) => {
    get().updateComponent(id, { zIndex });
  },

  bringToFront: (id: string) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const maxZIndex = Math.max(...page.components.map(c => c.zIndex), 0);
    get().updateComponent(id, { zIndex: maxZIndex + 1 });
  },

  sendToBack: (id: string) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const targetComponent = page.components.find(c => c.id === id);
    if (!targetComponent) return;

    // 重新排序：将目标组件放到最底层
    const sortedComponents = page.components
      .filter(c => c.id !== id)
      .sort((a, b) => a.zIndex - b.zIndex);

    sortedComponents.forEach((comp, index) => {
      get().updateComponent(comp.id, { zIndex: index + 2 });
    });
    get().updateComponent(id, { zIndex: 1 });
  },

  bringForward: (id: string) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const component = page.components.find(c => c.id === id);
    if (!component) return;

    // 找到zIndex比当前组件大的最小的那个组件
    const upperComponents = page.components
      .filter(c => c.zIndex > component.zIndex)
      .sort((a, b) => a.zIndex - b.zIndex);

    if (upperComponents.length > 0) {
      const targetComp = upperComponents[0];
      // 交换zIndex
      const tempZIndex = component.zIndex;
      get().updateComponent(id, { zIndex: targetComp.zIndex });
      get().updateComponent(targetComp.id, { zIndex: tempZIndex });
    }
  },

  sendBackward: (id: string) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const component = page.components.find(c => c.id === id);
    if (!component) return;

    // 找到zIndex比当前组件小的最大的那个组件
    const lowerComponents = page.components
      .filter(c => c.zIndex < component.zIndex)
      .sort((a, b) => b.zIndex - a.zIndex);

    if (lowerComponents.length > 0) {
      const targetComp = lowerComponents[0];
      // 交换zIndex
      const tempZIndex = component.zIndex;
      get().updateComponent(id, { zIndex: targetComp.zIndex });
      get().updateComponent(targetComp.id, { zIndex: tempZIndex });
    }
  },

  lockComponent: (id: string, locked: boolean) => {
    get().updateComponent(id, { locked });
  },

  toggleComponentVisibility: (id: string) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const component = page.components.find((c) => c.id === id);
    if (!component) return;

    get().updateComponent(id, { visible: !component.visible });
  },

  copyComponent: (id: string) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const component = page.components.find((c) => c.id === id);
    if (component) {
      set({ clipboard: JSON.parse(JSON.stringify(component)) });
    }
  },

  cutComponent: (id: string) => {
    get().copyComponent(id);
    get().deleteComponent(id);
  },

  pasteComponent: (position?: Position) => {
    const { clipboard } = get();
    if (!clipboard) return null;

    const page = get().getCurrentPage();
    if (!page) return null;

    const pasted: ComponentInstance = {
      ...JSON.parse(JSON.stringify(clipboard)),
      id: uuidv4(),
      name: `${clipboard.name}_paste`,
      position: position || {
        x: clipboard.position.x + 20,
        y: clipboard.position.y + 20,
      },
      zIndex: page.components.length + 1,
    };

    const updatedPage: Page = {
      ...page,
      components: [...page.components, pasted],
    };

    useProjectStore.getState().updatePage(updatedPage);
    get().saveHistory();
    set({ selectedComponentId: pasted.id });

    return pasted;
  },

  addComponentEvent: (componentId: string, event: Omit<ComponentEvent, 'id'>) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const newEvent: ComponentEvent = {
      ...event,
      id: uuidv4(),
    };

    const updatedPage: Page = {
      ...page,
      components: page.components.map((comp) =>
        comp.id === componentId
          ? { ...comp, events: [...comp.events, newEvent] }
          : comp
      ),
    };

    useProjectStore.getState().updatePage(updatedPage);
    get().saveHistory();
  },

  updateComponentEvent: (
    componentId: string,
    eventId: string,
    event: Partial<ComponentEvent>
  ) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const updatedPage: Page = {
      ...page,
      components: page.components.map((comp) =>
        comp.id === componentId
          ? {
              ...comp,
              events: comp.events.map((e) =>
                e.id === eventId ? { ...e, ...event } : e
              ),
            }
          : comp
      ),
    };

    useProjectStore.getState().updatePage(updatedPage);
  },

  deleteComponentEvent: (componentId: string, eventId: string) => {
    const page = get().getCurrentPage();
    if (!page) return;

    const updatedPage: Page = {
      ...page,
      components: page.components.map((comp) =>
        comp.id === componentId
          ? { ...comp, events: comp.events.filter((e) => e.id !== eventId) }
          : comp
      ),
    };

    useProjectStore.getState().updatePage(updatedPage);
    get().saveHistory();
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const previousPage = history[newIndex];

    useProjectStore.getState().updatePage(JSON.parse(JSON.stringify(previousPage)));
    set({ historyIndex: newIndex });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const nextPage = history[newIndex];

    useProjectStore.getState().updatePage(JSON.parse(JSON.stringify(nextPage)));
    set({ historyIndex: newIndex });
  },

  canUndo: () => get().historyIndex > 0,

  canRedo: () => get().historyIndex < get().history.length - 1,

  saveHistory: () => {
    const page = get().getCurrentPage();
    if (!page) return;

    const { history, historyIndex } = get();

    // 移除当前索引之后的历史
    const newHistory = history.slice(0, historyIndex + 1);

    // 添加当前状态
    newHistory.push(JSON.parse(JSON.stringify(page)));

    // 限制历史记录数量
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  deleteSelectedComponents: () => {
    const { selectedComponentId } = get();
    if (selectedComponentId) {
      get().deleteComponent(selectedComponentId);
    }
  },

  selectAllComponents: () => {
    // 当前只支持单选，这里选择第一个组件
    const page = get().getCurrentPage();
    if (page && page.components.length > 0) {
      set({ selectedComponentId: page.components[0].id });
    }
  },

  // ========== 背景图层操作 ==========
  addBackgroundLayer: (imageUrl: string, name: string) => {
    const page = get().getCurrentPage();
    if (!page) return null;

    const currentLayers = page.backgroundLayers || [];
    const maxOrder = currentLayers.length > 0
      ? Math.max(...currentLayers.map(l => l.order))
      : -1;

    // 根据图层数量自动设置视差速度
    // 第一层：0.2（远景），第二层：0.5（中景），第三层：0.8（近景）
    const defaultParallaxSpeeds = [0.2, 0.5, 0.8];
    const parallaxSpeed = defaultParallaxSpeeds[currentLayers.length] || 0.5;

    const newLayer: BackgroundLayer = {
      id: uuidv4(),
      name: name || `背景图层${currentLayers.length + 1}`,
      imageUrl,
      parallaxSpeed,
      order: maxOrder + 1,
      visible: true,
    };

    const updatedPage: Page = {
      ...page,
      backgroundLayers: [...currentLayers, newLayer],
    };

    useProjectStore.getState().updatePage(updatedPage);
    get().saveHistory();

    return newLayer;
  },

  deleteBackgroundLayer: (layerId: string) => {
    const page = get().getCurrentPage();
    if (!page || !page.backgroundLayers) return;

    const updatedPage: Page = {
      ...page,
      backgroundLayers: page.backgroundLayers.filter(layer => layer.id !== layerId),
    };

    useProjectStore.getState().updatePage(updatedPage);
    get().saveHistory();
  },

  updateBackgroundLayer: (layerId: string, updates: Partial<BackgroundLayer>) => {
    const page = get().getCurrentPage();
    if (!page || !page.backgroundLayers) return;

    const updatedPage: Page = {
      ...page,
      backgroundLayers: page.backgroundLayers.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
    };

    useProjectStore.getState().updatePage(updatedPage);
  },

  moveBackgroundLayerUp: (layerId: string) => {
    const page = get().getCurrentPage();
    if (!page || !page.backgroundLayers) return;

    const layers = [...page.backgroundLayers].sort((a, b) => a.order - b.order);
    const currentIndex = layers.findIndex(l => l.id === layerId);

    if (currentIndex <= 0) return; // 已经在最顶层

    // 交换 order
    const currentLayer = layers[currentIndex];
    const upperLayer = layers[currentIndex - 1];
    const tempOrder = currentLayer.order;

    get().updateBackgroundLayer(currentLayer.id, { order: upperLayer.order });
    get().updateBackgroundLayer(upperLayer.id, { order: tempOrder });
    get().saveHistory();
  },

  moveBackgroundLayerDown: (layerId: string) => {
    const page = get().getCurrentPage();
    if (!page || !page.backgroundLayers) return;

    const layers = [...page.backgroundLayers].sort((a, b) => a.order - b.order);
    const currentIndex = layers.findIndex(l => l.id === layerId);

    if (currentIndex >= layers.length - 1) return; // 已经在最底层

    // 交换 order
    const currentLayer = layers[currentIndex];
    const lowerLayer = layers[currentIndex + 1];
    const tempOrder = currentLayer.order;

    get().updateBackgroundLayer(currentLayer.id, { order: lowerLayer.order });
    get().updateBackgroundLayer(lowerLayer.id, { order: tempOrder });
    get().saveHistory();
  },

  toggleBackgroundLayerVisibility: (layerId: string) => {
    const page = get().getCurrentPage();
    if (!page || !page.backgroundLayers) return;

    const layer = page.backgroundLayers.find(l => l.id === layerId);
    if (!layer) return;

    get().updateBackgroundLayer(layerId, { visible: !layer.visible });
    get().saveHistory();
  },
}));
