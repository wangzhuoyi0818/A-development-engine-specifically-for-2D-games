# 项目结构管理模块实现

## 快速开始

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 构建

```bash
npm run build
```

## 使用示例

### 创建项目

```typescript
import { MiniProgramProjectManager } from './index';

const manager = new MiniProgramProjectManager();

const project = manager.createProject({
  name: '我的小程序',
  appId: 'wx1234567890abcdef',
  version: '1.0.0',
  description: '这是一个测试项目',
});

console.log('项目ID:', project.id);
```

### 添加页面

```typescript
const page = manager.addPage(project.id, {
  name: '首页',
  path: 'pages/index/index',
});

console.log('页面ID:', page.id);
```

### 管理组件树

```typescript
import { ComponentTreeManager } from './index';

const treeManager = new ComponentTreeManager();

// 添加根组件
const container = {
  id: 'container',
  type: 'view',
  properties: [],
  style: {},
  events: [],
  children: [],
  dataBindings: [],
};

treeManager.addComponent(page, container);

// 添加子组件
const text = {
  id: 'text1',
  type: 'text',
  properties: [
    {
      name: 'content',
      value: 'Hello World',
      type: 'string',
    },
  ],
  style: { fontSize: '16px' },
  events: [],
  children: [],
  dataBindings: [],
};

treeManager.addComponent(page, text, 'container');
```

### 序列化和反序列化

```typescript
// 序列化项目
const json = manager.serializeProject(project.id);
console.log('JSON:', json);

// 反序列化项目
const newManager = new MiniProgramProjectManager();
const loadedProject = newManager.deserializeProject(json);
console.log('加载的项目:', loadedProject.name);
```

### 使用事务

```typescript
const transaction = manager.beginTransaction(project.id);

try {
  manager.addPage(project.id, {
    name: '页面1',
    path: 'pages/page1/page1',
  });

  manager.addPage(project.id, {
    name: '页面2',
    path: 'pages/page2/page2',
  });

  // 提交事务
  manager.commitTransaction(transaction);
} catch (error) {
  // 回滚事务
  manager.rollbackTransaction(transaction);
  console.error('操作失败，已回滚:', error);
}
```

## API 文档

### MiniProgramProjectManager

#### 项目管理

- `createProject(options: ProjectOptions): MiniProgramProject` - 创建新项目
- `deleteProject(projectId: string): void` - 删除项目
- `getProject(projectId: string): MiniProgramProject` - 获取项目
- `hasProject(projectId: string): boolean` - 检查项目是否存在
- `listProjects(): MiniProgramProject[]` - 列出所有项目
- `updateProject(projectId: string, updates: UpdateProjectOptions): MiniProgramProject` - 更新项目

#### 页面管理

- `addPage(projectId: string, pageOptions: Partial<Page> & { name: string; path: string }): Page` - 添加页面
- `removePage(projectId: string, pageId: string): void` - 移除页面
- `updatePage(projectId: string, pageId: string, updates: Partial<Page>): Page` - 更新页面
- `getPage(projectId: string, pageId: string): Page` - 获取页面
- `reorderPages(projectId: string, pageIds: string[]): void` - 重新排序页面

#### 序列化

- `serializeProject(projectId: string): string` - 序列化项目为 JSON
- `deserializeProject(json: string): MiniProgramProject` - 从 JSON 反序列化项目

#### 配置管理

- `updateProjectConfig(projectId: string, config: Partial<ProjectConfig>): void` - 更新项目配置
- `updateWindowConfig(projectId: string, config: Partial<WindowConfig>): void` - 更新窗口配置
- `updateTabBarConfig(projectId: string, config: TabBarConfig): void` - 更新 TabBar 配置

#### 事务

- `beginTransaction(projectId: string): Transaction` - 开始事务
- `commitTransaction(transaction: Transaction): void` - 提交事务
- `rollbackTransaction(transaction: Transaction): void` - 回滚事务

### ComponentTreeManager

#### 组件操作

- `addComponent(page: Page, component: Component, parentId?: string, index?: number): void` - 添加组件
- `removeComponent(page: Page, componentId: string): boolean` - 移除组件
- `moveComponent(page: Page, componentId: string, newParentId?: string, index?: number): void` - 移动组件
- `updateComponent(page: Page, componentId: string, updates: Partial<Component>): Component` - 更新组件

#### 查询操作

- `findComponent(components: Component[], componentId: string): Component | null` - 查找组件
- `findComponentsByType(components: Component[], type: string): Component[]` - 按类型查找组件
- `getComponentPath(components: Component[], componentId: string): string[] | null` - 获取组件路径
- `getComponentParent(page: Page, componentId: string): Component | null` - 获取父组件
- `getComponentDepth(components: Component[], componentId: string): number` - 获取组件深度

#### 遍历操作

- `traverseComponents(components: Component[], visitor: (component: Component, depth: number) => void): void` - 遍历组件树
- `validateComponentTree(components: Component[]): ValidationResult` - 验证组件树

## 测试覆盖率

当前测试覆盖率目标: **> 90%**

查看覆盖率报告:

```bash
npm run test:coverage
```

## 设计文档

详细的设计文档请查看:

- [架构设计](../design/architecture.md) - 模块架构、类关系、设计模式
- [数据流设计](../design/dataflow.md) - 数据流向、状态变化、事务处理

## 注意事项

### 数据验证

所有公共方法都会进行参数验证:

- 项目名称不能为空,长度不超过 50 个字符
- 版本号必须符合语义化版本规范 (如 1.0.0)
- AppID 必须以 wx 开头后跟 16 位字符
- 页面路径必须符合 `pages/xxx/xxx` 格式
- 组件嵌套深度不超过 10 层

### 异常处理

所有错误都会抛出明确的异常类型:

- `ProjectNotFoundError` - 项目不存在
- `PageNotFoundError` - 页面不存在
- `ComponentNotFoundError` - 组件不存在
- `ValidationError` - 验证失败
- `SerializationError` - 序列化失败

### 性能优化

- 使用 `Map` 存储项目,提供 O(1) 查找性能
- 组件查找使用递归遍历,时间复杂度 O(n)
- 大型项目建议使用事务批量操作

## 开发计划

- [x] 基础项目管理功能
- [x] 页面管理功能
- [x] 组件树管理功能
- [x] 序列化和反序列化
- [x] 事务支持
- [x] 完整的测试用例
- [ ] 性能优化(组件索引)
- [ ] 版本控制支持
- [ ] 协作编辑支持

## 许可证

MIT
