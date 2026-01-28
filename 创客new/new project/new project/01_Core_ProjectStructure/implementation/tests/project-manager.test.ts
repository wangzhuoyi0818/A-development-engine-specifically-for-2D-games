/**
 * 项目管理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MiniProgramProjectManager,
  ProjectNotFoundError,
  PageNotFoundError,
  ValidationError,
  SerializationError,
} from '../core';
import type {
  MiniProgramProject,
  Page,
  ProjectOptions,
} from '../types';

describe('MiniProgramProjectManager', () => {
  let manager: MiniProgramProjectManager;

  beforeEach(() => {
    manager = new MiniProgramProjectManager();
  });

  // ==========================================================================
  // 项目创建测试
  // ==========================================================================

  describe('createProject', () => {
    it('应该成功创建项目', () => {
      const options: ProjectOptions = {
        name: '测试项目',
        appId: 'wx1234567890abcdef',
        version: '1.0.0',
        description: '这是一个测试项目',
      };

      const project = manager.createProject(options);

      expect(project.id).toBeDefined();
      expect(project.name).toBe('测试项目');
      expect(project.appId).toBe('wx1234567890abcdef');
      expect(project.version).toBe('1.0.0');
      expect(project.description).toBe('这是一个测试项目');
      expect(project.pages).toEqual([]);
      expect(project.globalComponents).toEqual([]);
      expect(project.resources).toEqual([]);
      expect(project.globalVariables).toEqual([]);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('应该创建具有默认配置的项目', () => {
      const project = manager.createProject({ name: '测试项目' });

      expect(project.config).toBeDefined();
      expect(project.config.window).toBeDefined();
      expect(project.config.window.navigationBarBackgroundColor).toBe('#ffffff');
      expect(project.config.window.navigationBarTextStyle).toBe('black');
    });

    it('应该拒绝空项目名称', () => {
      expect(() => {
        manager.createProject({ name: '' });
      }).toThrow(ValidationError);

      expect(() => {
        manager.createProject({ name: '   ' });
      }).toThrow(ValidationError);
    });

    it('应该拒绝过长的项目名称', () => {
      const longName = 'a'.repeat(51);

      expect(() => {
        manager.createProject({ name: longName });
      }).toThrow(ValidationError);
    });

    it('应该拒绝无效的版本号', () => {
      expect(() => {
        manager.createProject({ name: '测试', version: '1.0' });
      }).toThrow(ValidationError);

      expect(() => {
        manager.createProject({ name: '测试', version: 'v1.0.0' });
      }).toThrow(ValidationError);
    });

    it('应该接受语义化版本号', () => {
      const project1 = manager.createProject({ name: '测试1', version: '1.0.0' });
      expect(project1.version).toBe('1.0.0');

      const project2 = manager.createProject({ name: '测试2', version: '1.2.3-alpha.1' });
      expect(project2.version).toBe('1.2.3-alpha.1');
    });

    it('应该拒绝无效的AppID', () => {
      expect(() => {
        manager.createProject({ name: '测试', appId: 'invalid' });
      }).toThrow(ValidationError);

      expect(() => {
        manager.createProject({ name: '测试', appId: 'wx123' });
      }).toThrow(ValidationError);
    });

    it('应该接受有效的AppID', () => {
      const project = manager.createProject({
        name: '测试',
        appId: 'wx1234567890abcdef',
      });

      expect(project.appId).toBe('wx1234567890abcdef');
    });
  });

  // ==========================================================================
  // 项目管理测试
  // ==========================================================================

  describe('项目管理', () => {
    let projectId: string;

    beforeEach(() => {
      const project = manager.createProject({ name: '测试项目' });
      projectId = project.id;
    });

    it('应该能获取项目', () => {
      const project = manager.getProject(projectId);
      expect(project.id).toBe(projectId);
      expect(project.name).toBe('测试项目');
    });

    it('应该在获取不存在的项目时抛出错误', () => {
      expect(() => {
        manager.getProject('non-existent-id');
      }).toThrow(ProjectNotFoundError);
    });

    it('应该能检查项目是否存在', () => {
      expect(manager.hasProject(projectId)).toBe(true);
      expect(manager.hasProject('non-existent-id')).toBe(false);
    });

    it('应该能删除项目', () => {
      manager.deleteProject(projectId);
      expect(manager.hasProject(projectId)).toBe(false);
    });

    it('应该在删除不存在的项目时抛出错误', () => {
      expect(() => {
        manager.deleteProject('non-existent-id');
      }).toThrow(ProjectNotFoundError);
    });

    it('应该能列出所有项目', () => {
      const project2 = manager.createProject({ name: '项目2' });
      const projects = manager.listProjects();

      expect(projects).toHaveLength(2);
      expect(projects.find((p) => p.id === projectId)).toBeDefined();
      expect(projects.find((p) => p.id === project2.id)).toBeDefined();
    });

    it('应该能更新项目信息', () => {
      const updatedProject = manager.updateProject(projectId, {
        name: '新名称',
        version: '2.0.0',
        description: '新描述',
      });

      expect(updatedProject.name).toBe('新名称');
      expect(updatedProject.version).toBe('2.0.0');
      expect(updatedProject.description).toBe('新描述');
    });

    it('更新项目应该更新时间戳', () => {
      const original = manager.getProject(projectId);
      const originalTimestamp = original.updatedAt.getTime();

      // 等待一毫秒确保时间戳不同
      setTimeout(() => {
        manager.updateProject(projectId, { name: '新名称' });
        const updated = manager.getProject(projectId);

        expect(updated.updatedAt.getTime()).toBeGreaterThan(originalTimestamp);
      }, 1);
    });
  });

  // ==========================================================================
  // 页面管理测试
  // ==========================================================================

  describe('页面管理', () => {
    let projectId: string;

    beforeEach(() => {
      const project = manager.createProject({ name: '测试项目' });
      projectId = project.id;
    });

    it('应该能添加页面', () => {
      const page = manager.addPage(projectId, {
        name: '首页',
        path: 'pages/index/index',
      });

      expect(page.id).toBeDefined();
      expect(page.name).toBe('首页');
      expect(page.path).toBe('pages/index/index');
      expect(page.components).toEqual([]);
      expect(page.variables).toEqual([]);

      const project = manager.getProject(projectId);
      expect(project.pages).toHaveLength(1);
      expect(project.pages[0].id).toBe(page.id);
    });

    it('应该拒绝无效的页面路径', () => {
      expect(() => {
        manager.addPage(projectId, {
          name: '首页',
          path: 'invalid-path',
        });
      }).toThrow(ValidationError);

      expect(() => {
        manager.addPage(projectId, {
          name: '首页',
          path: 'pages/index',
        });
      }).toThrow(ValidationError);
    });

    it('应该拒绝重复的页面路径', () => {
      manager.addPage(projectId, {
        name: '首页',
        path: 'pages/index/index',
      });

      expect(() => {
        manager.addPage(projectId, {
          name: '首页2',
          path: 'pages/index/index',
        });
      }).toThrow(ValidationError);
    });

    it('应该能移除页面', () => {
      const page1 = manager.addPage(projectId, {
        name: '页面1',
        path: 'pages/page1/page1',
      });

      const page2 = manager.addPage(projectId, {
        name: '页面2',
        path: 'pages/page2/page2',
      });

      manager.removePage(projectId, page1.id);

      const project = manager.getProject(projectId);
      expect(project.pages).toHaveLength(1);
      expect(project.pages[0].id).toBe(page2.id);
    });

    it('应该拒绝删除最后一个页面', () => {
      const page = manager.addPage(projectId, {
        name: '首页',
        path: 'pages/index/index',
      });

      expect(() => {
        manager.removePage(projectId, page.id);
      }).toThrow(ValidationError);
    });

    it('应该在移除不存在的页面时抛出错误', () => {
      expect(() => {
        manager.removePage(projectId, 'non-existent-id');
      }).toThrow(PageNotFoundError);
    });

    it('应该能更新页面', () => {
      const page = manager.addPage(projectId, {
        name: '首页',
        path: 'pages/index/index',
      });

      const updated = manager.updatePage(projectId, page.id, {
        name: '新首页',
        path: 'pages/home/home',
      });

      expect(updated.name).toBe('新首页');
      expect(updated.path).toBe('pages/home/home');
    });

    it('应该能获取页面', () => {
      const page = manager.addPage(projectId, {
        name: '首页',
        path: 'pages/index/index',
      });

      const retrieved = manager.getPage(projectId, page.id);
      expect(retrieved.id).toBe(page.id);
      expect(retrieved.name).toBe('首页');
    });

    it('应该能重新排序页面', () => {
      const page1 = manager.addPage(projectId, {
        name: '页面1',
        path: 'pages/page1/page1',
      });

      const page2 = manager.addPage(projectId, {
        name: '页面2',
        path: 'pages/page2/page2',
      });

      const page3 = manager.addPage(projectId, {
        name: '页面3',
        path: 'pages/page3/page3',
      });

      // 重新排序: 3, 1, 2
      manager.reorderPages(projectId, [page3.id, page1.id, page2.id]);

      const project = manager.getProject(projectId);
      expect(project.pages[0].id).toBe(page3.id);
      expect(project.pages[1].id).toBe(page1.id);
      expect(project.pages[2].id).toBe(page2.id);
    });

    it('应该拒绝无效的页面排序', () => {
      const page1 = manager.addPage(projectId, {
        name: '页面1',
        path: 'pages/page1/page1',
      });

      expect(() => {
        manager.reorderPages(projectId, [page1.id, 'non-existent-id']);
      }).toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // 序列化测试
  // ==========================================================================

  describe('序列化', () => {
    let projectId: string;

    beforeEach(() => {
      const project = manager.createProject({
        name: '测试项目',
        appId: 'wx1234567890abcdef',
        version: '1.0.0',
      });

      projectId = project.id;

      manager.addPage(projectId, {
        name: '首页',
        path: 'pages/index/index',
      });
    });

    it('应该能序列化项目', () => {
      const json = manager.serializeProject(projectId);

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed.id).toBe(projectId);
      expect(parsed.name).toBe('测试项目');
      expect(parsed.appId).toBe('wx1234567890abcdef');
      expect(parsed.pages).toHaveLength(1);
    });

    it('应该能反序列化项目', () => {
      const json = manager.serializeProject(projectId);
      const newManager = new MiniProgramProjectManager();
      const loaded = newManager.deserializeProject(json);

      expect(loaded.id).toBe(projectId);
      expect(loaded.name).toBe('测试项目');
      expect(loaded.appId).toBe('wx1234567890abcdef');
      expect(loaded.pages).toHaveLength(1);
      expect(loaded.createdAt).toBeInstanceOf(Date);
      expect(loaded.updatedAt).toBeInstanceOf(Date);
    });

    it('应该拒绝无效的JSON', () => {
      const newManager = new MiniProgramProjectManager();

      expect(() => {
        newManager.deserializeProject('invalid json');
      }).toThrow(SerializationError);
    });

    it('应该拒绝缺少必需字段的数据', () => {
      const newManager = new MiniProgramProjectManager();

      expect(() => {
        newManager.deserializeProject('{"name": "test"}');
      }).toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // 配置管理测试
  // ==========================================================================

  describe('配置管理', () => {
    let projectId: string;

    beforeEach(() => {
      const project = manager.createProject({ name: '测试项目' });
      projectId = project.id;
    });

    it('应该能更新项目配置', () => {
      manager.updateProjectConfig(projectId, {
        debug: true,
      });

      const project = manager.getProject(projectId);
      expect(project.config.debug).toBe(true);
    });

    it('应该能更新窗口配置', () => {
      manager.updateWindowConfig(projectId, {
        navigationBarTitleText: '新标题',
        navigationBarBackgroundColor: '#000000',
      });

      const project = manager.getProject(projectId);
      expect(project.config.window.navigationBarTitleText).toBe('新标题');
      expect(project.config.window.navigationBarBackgroundColor).toBe('#000000');
    });

    it('应该能更新TabBar配置', () => {
      manager.updateTabBarConfig(projectId, {
        color: '#999999',
        selectedColor: '#ff0000',
        backgroundColor: '#ffffff',
        list: [
          {
            pagePath: 'pages/index/index',
            text: '首页',
          },
        ],
      });

      const project = manager.getProject(projectId);
      expect(project.config.tabBar).toBeDefined();
      expect(project.config.tabBar!.color).toBe('#999999');
      expect(project.config.tabBar!.list).toHaveLength(1);
    });
  });

  // ==========================================================================
  // 事务测试
  // ==========================================================================

  describe('事务', () => {
    let projectId: string;

    beforeEach(() => {
      const project = manager.createProject({ name: '测试项目' });
      projectId = project.id;
    });

    it('应该能开始事务', () => {
      const transaction = manager.beginTransaction(projectId);

      expect(transaction.id).toBeDefined();
      expect(transaction.projectId).toBe(projectId);
      expect(transaction.operations).toEqual([]);
      expect(transaction.snapshot).toBeDefined();
    });

    it('应该能提交事务', () => {
      const transaction = manager.beginTransaction(projectId);

      manager.addPage(projectId, {
        name: '新页面',
        path: 'pages/new/new',
      });

      manager.commitTransaction(transaction);

      const project = manager.getProject(projectId);
      expect(project.pages).toHaveLength(1);
    });

    it('应该能回滚事务', () => {
      const transaction = manager.beginTransaction(projectId);

      manager.addPage(projectId, {
        name: '新页面',
        path: 'pages/new/new',
      });

      manager.rollbackTransaction(transaction);

      const project = manager.getProject(projectId);
      expect(project.pages).toHaveLength(0);
    });
  });
});
