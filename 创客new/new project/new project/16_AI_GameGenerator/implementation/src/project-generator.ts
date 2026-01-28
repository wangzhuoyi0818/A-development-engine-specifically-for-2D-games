/**
 * 项目生成器 - 简化版本
 */
import type {
  IProjectGenerator,
  CustomizedTemplate,
  Project,
  ProjectStructure,
  Page,
  Component,
  Event,
  VariableContainer,
  ComponentDefinition,
} from './types';

export class ProjectGenerator implements IProjectGenerator {
  async generateProject(template: CustomizedTemplate): Promise<Project> {
    const project: Project = {
      name: template.structure.name,
      description: template.structure.description || template.description,
      config: template.structure.config,
      pages: this.generatePages(template),
      resources: template.structure.resources,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return project;
  }

  generateStructure(template: CustomizedTemplate): ProjectStructure {
    return template.structure;
  }

  generatePages(template: CustomizedTemplate): Page[] {
    // 生成游戏主页面
    const gamePage: Page = {
      id: `page-${Date.now()}`,
      name: 'game',
      title: '游戏',
      components: this.generateComponents(template),
      events: this.generateEvents(template),
      variables: this.generateVariables(template),
      style: {
        backgroundColor: template.customization.backgroundColor || '#f0f0f0',
      },
    };

    // 生成结果页面
    const resultPage: Page = {
      id: `page-${Date.now() + 1}`,
      name: 'result',
      title: '结果',
      components: [],
      events: [],
      variables: null,
      style: {},
    };

    return [gamePage, resultPage];
  }

  generateComponents(template: CustomizedTemplate): Component[] {
    return template.components.map((def) => this.componentFromDefinition(def));
  }

  private componentFromDefinition(def: ComponentDefinition): Component {
    const component: Component = {
      id: `comp-${Math.random().toString(36).substr(2, 9)}`,
      type: def.type,
      name: def.name,
      properties: { ...def.properties },
      style: def.properties.style || {},
      events: def.eventBindings || [],
    };

    if (def.children && def.children.length > 0) {
      component.children = def.children.map((child) =>
        this.componentFromDefinition(child)
      );
    }

    return component;
  }

  generateEvents(template: CustomizedTemplate): Event[] {
    return template.events.map((def) => ({
      id: `event-${Math.random().toString(36).substr(2, 9)}`,
      name: def.name,
      type: def.type,
      conditions: def.conditions,
      actions: def.actions,
    }));
  }

  generateVariables(template: CustomizedTemplate): VariableContainer {
    const container: VariableContainer = {};

    template.variables.forEach((varDef) => {
      container[varDef.name] = {
        type: varDef.type,
        value: varDef.initialValue,
        scope: varDef.scope,
      };
    });

    return container;
  }
}
