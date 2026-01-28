/**
 * 使用示例 - 完整的项目创建流程
 *
 * 本示例演示如何使用项目结构管理模块创建一个完整的微信小程序项目
 */

import {
  MiniProgramProjectManager,
  ComponentTreeManager,
} from './index';
import type { Component } from './types';

// ============================================================================
// 示例 1: 创建基础项目
// ============================================================================

console.log('========================================');
console.log('示例 1: 创建基础项目');
console.log('========================================\n');

const projectManager = new MiniProgramProjectManager();

// 创建项目
const project = projectManager.createProject({
  name: '我的待办事项小程序',
  appId: 'wx1234567890abcdef',
  version: '1.0.0',
  description: '一个简单的待办事项管理小程序',
});

console.log('✓ 项目创建成功');
console.log('  项目ID:', project.id);
console.log('  项目名称:', project.name);
console.log('  版本:', project.version);
console.log();

// ============================================================================
// 示例 2: 添加页面
// ============================================================================

console.log('========================================');
console.log('示例 2: 添加页面');
console.log('========================================\n');

// 添加首页
const indexPage = projectManager.addPage(project.id, {
  name: '首页',
  path: 'pages/index/index',
  config: {
    navigationBarTitleText: '待办事项',
  },
});

console.log('✓ 首页创建成功');
console.log('  页面ID:', indexPage.id);
console.log('  页面路径:', indexPage.path);
console.log();

// 添加详情页
const detailPage = projectManager.addPage(project.id, {
  name: '详情页',
  path: 'pages/detail/detail',
  config: {
    navigationBarTitleText: '任务详情',
  },
});

console.log('✓ 详情页创建成功');
console.log('  页面ID:', detailPage.id);
console.log('  页面路径:', detailPage.path);
console.log();

// ============================================================================
// 示例 3: 构建首页组件树
// ============================================================================

console.log('========================================');
console.log('示例 3: 构建首页组件树');
console.log('========================================\n');

const componentManager = new ComponentTreeManager();

// 创建容器组件
const container: Component = {
  id: 'main-container',
  type: 'view',
  name: '主容器',
  properties: [],
  style: {
    padding: '20rpx',
    backgroundColor: '#f5f5f5',
  },
  events: [],
  children: [],
  dataBindings: [],
};

componentManager.addComponent(indexPage, container);
console.log('✓ 添加主容器');

// 添加标题
const title: Component = {
  id: 'title',
  type: 'text',
  name: '标题',
  properties: [
    {
      name: 'text',
      value: '我的待办事项',
      type: 'string',
    },
  ],
  style: {
    fontSize: '32rpx',
    fontWeight: 'bold',
    marginBottom: '20rpx',
  },
  events: [],
  children: [],
  dataBindings: [],
};

componentManager.addComponent(indexPage, title, 'main-container');
console.log('✓ 添加标题');

// 添加任务列表容器
const taskList: Component = {
  id: 'task-list',
  type: 'scroll-view',
  name: '任务列表',
  properties: [
    {
      name: 'scroll-y',
      value: true,
      type: 'boolean',
    },
  ],
  style: {
    height: '600rpx',
  },
  events: [],
  children: [],
  dataBindings: [],
  listRendering: {
    dataSource: 'tasks',
    itemName: 'task',
    indexName: 'index',
    key: 'id',
  },
};

componentManager.addComponent(indexPage, taskList, 'main-container');
console.log('✓ 添加任务列表');

// 添加任务项
const taskItem: Component = {
  id: 'task-item',
  type: 'view',
  name: '任务项',
  properties: [],
  style: {
    padding: '20rpx',
    marginBottom: '10rpx',
    backgroundColor: '#ffffff',
    borderRadius: '8rpx',
  },
  events: [
    {
      name: 'tap',
      handler: 'onTaskTap',
      params: {
        taskId: '{{task.id}}',
      },
    },
  ],
  children: [],
  dataBindings: [],
};

componentManager.addComponent(indexPage, taskItem, 'task-list');
console.log('✓ 添加任务项');

// 添加任务标题
const taskTitle: Component = {
  id: 'task-title',
  type: 'text',
  name: '任务标题',
  properties: [],
  style: {
    fontSize: '28rpx',
  },
  events: [],
  children: [],
  dataBindings: [
    {
      property: 'text',
      dataPath: 'task.title',
      mode: 'oneWay',
    },
  ],
};

componentManager.addComponent(indexPage, taskTitle, 'task-item');
console.log('✓ 添加任务标题');

// 添加任务描述
const taskDesc: Component = {
  id: 'task-desc',
  type: 'text',
  name: '任务描述',
  properties: [],
  style: {
    fontSize: '24rpx',
    color: '#999999',
    marginTop: '10rpx',
  },
  events: [],
  children: [],
  dataBindings: [
    {
      property: 'text',
      dataPath: 'task.description',
      mode: 'oneWay',
    },
  ],
};

componentManager.addComponent(indexPage, taskDesc, 'task-item');
console.log('✓ 添加任务描述');

// 添加新建按钮
const addButton: Component = {
  id: 'add-button',
  type: 'button',
  name: '新建按钮',
  properties: [
    {
      name: 'type',
      value: 'primary',
      type: 'string',
    },
  ],
  style: {
    position: 'fixed',
    bottom: '50rpx',
    right: '50rpx',
    width: '100rpx',
    height: '100rpx',
    borderRadius: '50%',
  },
  events: [
    {
      name: 'tap',
      handler: 'onAddTap',
      actions: [
        {
          type: 'navigate',
          params: {
            url: '/pages/add/add',
          },
        },
      ],
    },
  ],
  children: [],
  dataBindings: [],
};

componentManager.addComponent(indexPage, addButton);
console.log('✓ 添加新建按钮');

console.log();

// ============================================================================
// 示例 4: 查询组件树
// ============================================================================

console.log('========================================');
console.log('示例 4: 查询组件树');
console.log('========================================\n');

// 查找组件
const foundTitle = componentManager.findComponent(indexPage.components, 'title');
console.log('✓ 查找标题组件:', foundTitle?.name);

// 获取组件路径
const path = componentManager.getComponentPath(indexPage.components, 'task-title');
console.log('✓ 任务标题路径:', path);

// 获取组件深度
const depth = componentManager.getComponentDepth(indexPage.components, 'task-desc');
console.log('✓ 任务描述深度:', depth);

// 按类型查找组件
const textComponents = componentManager.findComponentsByType(indexPage.components, 'text');
console.log('✓ 文本组件数量:', textComponents.length);

console.log();

// ============================================================================
// 示例 5: 组件树遍历
// ============================================================================

console.log('========================================');
console.log('示例 5: 组件树遍历');
console.log('========================================\n');

console.log('组件树结构:');
componentManager.traverseComponents(indexPage.components, (component, depth) => {
  const indent = '  '.repeat(depth);
  console.log(`${indent}- ${component.name || component.type} (${component.type})`);
});

console.log();

// ============================================================================
// 示例 6: 更新配置
// ============================================================================

console.log('========================================');
console.log('示例 6: 更新配置');
console.log('========================================\n');

// 更新窗口配置
projectManager.updateWindowConfig(project.id, {
  navigationBarBackgroundColor: '#1aad19',
  navigationBarTextStyle: 'white',
});

console.log('✓ 窗口配置已更新');

// 更新 TabBar 配置
projectManager.updateTabBarConfig(project.id, {
  color: '#999999',
  selectedColor: '#1aad19',
  backgroundColor: '#ffffff',
  list: [
    {
      pagePath: 'pages/index/index',
      text: '待办',
      iconPath: '/images/todo.png',
      selectedIconPath: '/images/todo-active.png',
    },
    {
      pagePath: 'pages/done/done',
      text: '已完成',
      iconPath: '/images/done.png',
      selectedIconPath: '/images/done-active.png',
    },
  ],
});

console.log('✓ TabBar 配置已更新');
console.log();

// ============================================================================
// 示例 7: 序列化项目
// ============================================================================

console.log('========================================');
console.log('示例 7: 序列化项目');
console.log('========================================\n');

const json = projectManager.serializeProject(project.id);
console.log('✓ 项目已序列化为 JSON');
console.log('  JSON 长度:', json.length, '字符');

// 保存到文件 (实际使用中)
// import { writeFileSync } from 'fs';
// writeFileSync('project.json', json, 'utf-8');

console.log();

// ============================================================================
// 示例 8: 反序列化项目
// ============================================================================

console.log('========================================');
console.log('示例 8: 反序列化项目');
console.log('========================================\n');

const newManager = new MiniProgramProjectManager();
const loadedProject = newManager.deserializeProject(json);

console.log('✓ 项目已从 JSON 加载');
console.log('  项目名称:', loadedProject.name);
console.log('  页面数量:', loadedProject.pages.length);
console.log('  首页组件数量:', loadedProject.pages[0].components.length);

console.log();

// ============================================================================
// 示例 9: 使用事务
// ============================================================================

console.log('========================================');
console.log('示例 9: 使用事务');
console.log('========================================\n');

const transaction = projectManager.beginTransaction(project.id);

try {
  // 在事务中执行多个操作
  projectManager.addPage(project.id, {
    name: '设置页',
    path: 'pages/settings/settings',
  });

  projectManager.addPage(project.id, {
    name: '关于页',
    path: 'pages/about/about',
  });

  // 提交事务
  projectManager.commitTransaction(transaction);
  console.log('✓ 事务提交成功');
  console.log('  总页面数:', projectManager.getProject(project.id).pages.length);
} catch (error) {
  // 回滚事务
  projectManager.rollbackTransaction(transaction);
  console.log('✗ 事务回滚');
}

console.log();

// ============================================================================
// 示例 10: 验证组件树
// ============================================================================

console.log('========================================');
console.log('示例 10: 验证组件树');
console.log('========================================\n');

const validationResult = componentManager.validateComponentTree(indexPage.components);

console.log('组件树验证结果:');
console.log('  有效:', validationResult.valid ? '✓' : '✗');
console.log('  错误数量:', validationResult.errors.length);
console.log('  警告数量:', validationResult.warnings.length);

if (validationResult.errors.length > 0) {
  console.log('\n错误列表:');
  validationResult.errors.forEach((error) => {
    console.log(`  - ${error.message}`);
  });
}

console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('========================================');
console.log('示例完成!');
console.log('========================================\n');

console.log('成功创建了一个包含以下内容的微信小程序项目:');
console.log('  ✓ 项目配置 (app.json)');
console.log('  ✓ 4 个页面 (首页、详情页、设置页、关于页)');
console.log('  ✓ 完整的首页组件树 (7个组件,3层嵌套)');
console.log('  ✓ TabBar 配置');
console.log('  ✓ 事件绑定和数据绑定');
console.log('  ✓ 序列化和反序列化');
console.log();

console.log('下一步可以:');
console.log('  1. 导出为微信小程序代码 (WXML/WXSS/JS/JSON)');
console.log('  2. 在可视化编辑器中编辑');
console.log('  3. 添加更多页面和组件');
console.log('  4. 配置事件和数据流');
console.log();
