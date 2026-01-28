import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Variable, VariableScope, VariableType } from '@/types/variable';
import { useProjectStore } from './projectStore';

interface VariableStore {
  // 全局变量
  globalVariables: Variable[];

  // 选中的变量
  selectedVariableId: string | null;

  // 操作
  addVariable: (scope: VariableScope, variable: Omit<Variable, 'id'>) => Variable;
  updateVariable: (variableId: string, updates: Partial<Variable>) => void;
  deleteVariable: (variableId: string) => void;
  selectVariable: (variableId: string | null) => void;

  // 获取变量
  getVariablesByScope: (scope: VariableScope) => Variable[];
  getVariableByName: (name: string, scope: VariableScope) => Variable | undefined;

  // 批量操作
  importVariables: (variables: Variable[]) => void;
  exportVariables: () => Variable[];
}

export const useVariableStore = create<VariableStore>()((set, get) => ({
  globalVariables: [],
  selectedVariableId: null,

  addVariable: (scope: VariableScope, variableData: Omit<Variable, 'id'>) => {
    const newVariable: Variable = {
      ...variableData,
      id: uuidv4(),
    };

    if (scope.scope === 'global') {
      set((state) => ({
        globalVariables: [...state.globalVariables, newVariable],
      }));
    } else if (scope.scope === 'page' && scope.entityId) {
      // 更新页面的 pageData
      const { currentProject, updatePage } = useProjectStore.getState();
      if (currentProject) {
        const page = currentProject.pages.find((p) => p.id === scope.entityId);
        if (page) {
          updatePage({
            ...page,
            pageData: {
              ...page.pageData,
              [newVariable.name]: newVariable.initialValue,
            },
          });
        }
      }
    }

    return newVariable;
  },

  updateVariable: (variableId: string, updates: Partial<Variable>) => {
    set((state) => ({
      globalVariables: state.globalVariables.map((v) =>
        v.id === variableId ? { ...v, ...updates } : v
      ),
    }));
  },

  deleteVariable: (variableId: string) => {
    set((state) => ({
      globalVariables: state.globalVariables.filter((v) => v.id !== variableId),
      selectedVariableId:
        state.selectedVariableId === variableId ? null : state.selectedVariableId,
    }));
  },

  selectVariable: (variableId: string | null) => {
    set({ selectedVariableId: variableId });
  },

  getVariablesByScope: (scope: VariableScope) => {
    const { globalVariables } = get();

    if (scope.scope === 'global') {
      return globalVariables;
    }

    if (scope.scope === 'page' && scope.entityId) {
      const { currentProject } = useProjectStore.getState();
      if (currentProject) {
        const page = currentProject.pages.find((p) => p.id === scope.entityId);
        if (page && page.pageData) {
          return Object.entries(page.pageData).map(([name, value]) => ({
            id: `page_${scope.entityId}_${name}`,
            name,
            type: (typeof value === 'number' ? 'number' :
                   typeof value === 'boolean' ? 'boolean' :
                   typeof value === 'object' ? (Array.isArray(value) ? 'array' : 'object') :
                   'string') as VariableType,
            initialValue: value,
          }));
        }
      }
    }

    return [];
  },

  getVariableByName: (name: string, scope: VariableScope) => {
    const variables = get().getVariablesByScope(scope);
    return variables.find((v) => v.name === name);
  },

  importVariables: (variables: Variable[]) => {
    set((state) => ({
      globalVariables: [...state.globalVariables, ...variables],
    }));
  },

  exportVariables: () => {
    return get().globalVariables;
  },
}));
