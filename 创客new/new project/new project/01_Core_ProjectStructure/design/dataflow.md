# 项目结构管理模块 - 数据流设计文档

## 1. 数据流概述

本文档描述了项目结构管理模块中数据的流动路径、状态变化和事务处理机制。

## 2. 核心数据流

### 2.1 项目创建流程

```
用户请求创建项目
    ↓
MiniProgramProjectManager.createProject()
    ↓
1. 生成项目ID (UUID v4)
    ↓
2. 创建默认配置
    ├─> 默认 WindowConfig
    ├─> 空的 pages 数组
    ├─> 空的 resources 数组
    └─> 空的 variables 数组
    ↓
3. 创建 MiniProgramProject 对象
    ↓
4. 存储到 projects Map
    ↓
5. 触发 'project:created' 事件
    ↓
返回 MiniProgramProject 对象
```

**数据验证点**:
- ✓ 项目名称非空且长度合法
- ✓ AppID 格式正确(如果提供)
- ✓ 版本号符合语义化版本规范

**异常处理**:
- 参数验证失败 → 抛出 ValidationError
- 内存不足 → 抛出 Error

### 2.2 添加页面流程

```
用户请求添加页面
    ↓
MiniProgramProjectManager.addPage(projectId, pageOptions)
    ↓
1. 获取项目对象
    ├─> 项目不存在? → 抛出 ProjectNotFoundError
    └─> 继续
    ↓
2. 验证页面路径唯一性
    ├─> 路径已存在? → 抛出 ValidationError
    └─> 继续
    ↓
3. 生成页面ID (UUID v4)
    ↓
4. 创建 Page 对象
    ├─> 设置页面配置
    ├─> 初始化空组件数组
    ├─> 初始化空变量数组
    └─> 初始化生命周期事件
    ↓
5. 添加到 project.pages 数组
    ↓
6. 更新 project.updatedAt
    ↓
7. 触发 'page:added' 事件
    ↓
返回 Page 对象
```

**数据验证点**:
- ✓ 项目ID存在
- ✓ 页面路径符合微信小程序规范
- ✓ 页面路径在项目内唯一
- ✓ 页面名称非空

**状态变化**:
- `project.pages.length` 增加 1
- `project.updatedAt` 更新为当前时间

### 2.3 添加组件流程

```
用户请求添加组件
    ↓
ComponentTreeManager.addComponent(page, component, parentId?, index?)
    ↓
1. 验证组件数据
    ├─> 组件类型有效? → 继续
    └─> 无效 → 抛出 ValidationError
    ↓
2. 生成组件ID (UUID v4)
    ↓
3. 设置组件默认值
    ├─> properties: []
    ├─> style: {}
    ├─> events: []
    └─> children: []
    ↓
4. 确定插入位置
    ├─> parentId 为空?
    │   └─> 添加到 page.components (根级别)
    └─> parentId 存在?
        ├─> 查找父组件 (findComponent)
        │   ├─> 找到? → 继续
        │   └─> 未找到? → 抛出 ComponentNotFoundError
        └─> 添加到 parent.children
    ↓
5. 在指定位置插入组件
    ├─> index 指定? → 插入到指定索引
    └─> index 未指定? → 追加到末尾
    ↓
6. 验证组件树有效性
    ├─> 检测循环引用
    ├─> 检测嵌套深度
    └─> 有效? → 继续
    ↓
7. 触发 'component:added' 事件
    ↓
完成
```

**数据验证点**:
- ✓ 组件类型在允许的类型列表中
- ✓ 父组件存在(如果指定)
- ✓ 父组件允许有子组件
- ✓ 无循环引用
- ✓ 嵌套深度 ≤ 10

**状态变化**:
- `page.components` 或 `parent.children` 数组增加元素
- 组件树深度可能增加

### 2.4 移动组件流程

```
用户请求移动组件
    ↓
ComponentTreeManager.moveComponent(page, componentId, newParentId?, index?)
    ↓
1. 查找要移动的组件
    ├─> 找到? → 保存组件引用
    └─> 未找到? → 抛出 ComponentNotFoundError
    ↓
2. 验证目标位置
    ├─> newParentId 存在?
    │   ├─> 查找新父组件
    │   ├─> 找到? → 继续
    │   └─> 未找到? → 抛出 ComponentNotFoundError
    └─> newParentId 为空? → 移到根级别
    ↓
3. 检测是否会造成循环引用
    ├─> 新父组件是当前组件的子孙?
    │   └─> 是 → 抛出 ValidationError
    └─> 否 → 继续
    ↓
4. 从原位置移除组件
    ├─> 调用 removeComponentRecursive()
    └─> 保持组件对象引用
    ↓
5. 插入到新位置
    ├─> newParentId 为空?
    │   └─> 插入到 page.components[index]
    └─> newParentId 存在?
        └─> 插入到 parent.children[index]
    ↓
6. 触发 'component:moved' 事件
    ↓
完成
```

**关键逻辑**:
- 移动前必须检测循环引用
- 移除和插入必须是原子操作
- 保持组件的完整性(包括所有子组件)

**状态变化**:
- 原父组件的 children 数组减少元素
- 新父组件的 children 数组增加元素
- 组件树结构改变

### 2.5 序列化流程

```
用户请求序列化项目
    ↓
MiniProgramProjectManager.serializeProject(projectId)
    ↓
1. 获取项目对象
    ├─> 项目不存在? → 抛出 ProjectNotFoundError
    └─> 继续
    ↓
2. 转换 Date 对象
    ├─> createdAt → ISO 8601 字符串
    └─> updatedAt → ISO 8601 字符串
    ↓
3. 递归序列化组件树
    ├─> 遍历每个 Page
    └─> 递归遍历 components
        ├─> 序列化组件属性
        ├─> 序列化组件样式
        ├─> 序列化组件事件
        └─> 递归序列化 children
    ↓
4. JSON.stringify()
    ├─> 使用 2 空格缩进
    └─> 生成格式化的 JSON 字符串
    ↓
5. 返回 JSON 字符串
```

**序列化输出格式**:
```json
{
  "id": "uuid-v4",
  "name": "我的小程序",
  "version": "1.0.0",
  "appId": "wx1234567890",
  "config": {
    "window": { ... },
    "tabBar": { ... }
  },
  "pages": [
    {
      "id": "page-uuid",
      "name": "首页",
      "path": "pages/index/index",
      "components": [
        {
          "id": "comp-uuid",
          "type": "view",
          "children": [ ... ]
        }
      ]
    }
  ],
  "createdAt": "2026-01-23T10:00:00.000Z",
  "updatedAt": "2026-01-23T10:30:00.000Z"
}
```

### 2.6 反序列化流程

```
用户请求反序列化项目
    ↓
MiniProgramProjectManager.deserializeProject(json)
    ↓
1. JSON.parse(json)
    ├─> 解析成功? → 继续
    └─> 解析失败? → 抛出 SerializationError
    ↓
2. 验证数据结构
    ├─> 使用 Zod schema 验证
    ├─> 验证通过? → 继续
    └─> 验证失败? → 抛出 ValidationError
    ↓
3. 转换数据类型
    ├─> ISO 字符串 → Date 对象
    └─> 其他类型转换
    ↓
4. 重建对象引用
    ├─> 重建 Page 对象
    └─> 递归重建 Component 树
    ↓
5. 存储到 projects Map
    ↓
6. 触发 'project:loaded' 事件
    ↓
返回 MiniProgramProject 对象
```

**数据验证点**:
- ✓ JSON 格式正确
- ✓ 必需字段存在
- ✓ 数据类型正确
- ✓ 组件树结构有效
- ✓ 无循环引用

## 3. 事务处理流程

### 3.1 事务生命周期

```
beginTransaction(projectId)
    ↓
创建 Transaction 对象
    ├─> id: UUID v4
    ├─> projectId
    ├─> operations: []
    ├─> snapshot: deepClone(project)
    └─> createdAt: new Date()
    ↓
返回 Transaction 对象
    ↓
执行操作 (addPage, removeComponent, etc.)
    ↓
每个操作记录到 transaction.operations
    ├─> type: 'add' | 'remove' | 'update'
    ├─> target: 'page' | 'component'
    ├─> data: 操作数据
    └─> rollbackData: 回滚数据
    ↓
提交或回滚
    ├─> commitTransaction()
    │   ├─> 清理 snapshot
    │   └─> 删除 Transaction 对象
    └─> rollbackTransaction()
        ├─> 恢复 snapshot
        └─> 删除 Transaction 对象
```

### 3.2 回滚机制

```
rollbackTransaction(transaction)
    ↓
1. 获取事务快照
    ↓
2. 逆序遍历 operations
    ├─> type: 'add'
    │   └─> 执行删除操作
    ├─> type: 'remove'
    │   └─> 执行添加操作
    └─> type: 'update'
        └─> 恢复到 rollbackData
    ↓
3. 恢复完整快照
    ├─> 替换 project 对象
    └─> 确保数据一致性
    ↓
4. 清理事务对象
    ↓
5. 触发 'transaction:rollback' 事件
```

## 4. 数据一致性保证

### 4.1 原子操作

所有修改操作必须是原子的:
- 要么完全成功
- 要么完全失败并回滚

实现方式:
```typescript
try {
  const transaction = manager.beginTransaction(projectId);

  // 执行多个操作
  manager.addPage(projectId, page1);
  manager.addPage(projectId, page2);

  // 提交事务
  manager.commitTransaction(transaction);
} catch (error) {
  // 自动回滚
  manager.rollbackTransaction(transaction);
  throw error;
}
```

### 4.2 引用完整性

确保所有引用都指向有效对象:
- 页面引用的组件必须存在
- 组件的父组件必须存在
- 数据绑定引用的变量必须存在

检查点:
- 添加组件时检查父组件
- 删除组件时检查子组件
- 移动组件时检查循环引用

### 4.3 状态同步

确保派生状态与原始数据同步:
- `project.updatedAt` 在任何修改时更新
- 组件树深度在结构变化时重新计算
- 页面数量计数器保持准确

## 5. 事件流

### 5.1 事件类型

```typescript
// 项目级事件
'project:created'  - 项目创建
'project:updated'  - 项目更新
'project:deleted'  - 项目删除
'project:loaded'   - 项目加载

// 页面级事件
'page:added'       - 页面添加
'page:removed'     - 页面删除
'page:updated'     - 页面更新
'page:reordered'   - 页面重排序

// 组件级事件
'component:added'  - 组件添加
'component:removed' - 组件删除
'component:updated' - 组件更新
'component:moved'   - 组件移动

// 事务级事件
'transaction:begin'    - 事务开始
'transaction:commit'   - 事务提交
'transaction:rollback' - 事务回滚
```

### 5.2 事件流向

```
用户操作
    ↓
Manager 方法调用
    ↓
数据验证
    ↓
数据修改
    ↓
触发事件 (emit)
    ↓
事件监听器执行
    ├─> UI 更新
    ├─> 日志记录
    ├─> 插件回调
    └─> 其他副作用
```

### 5.3 事件数据格式

```typescript
// 项目创建事件
{
  type: 'project:created',
  timestamp: Date,
  data: {
    projectId: string,
    project: MiniProgramProject
  }
}

// 组件添加事件
{
  type: 'component:added',
  timestamp: Date,
  data: {
    projectId: string,
    pageId: string,
    componentId: string,
    parentId?: string,
    component: Component
  }
}
```

## 6. 数据查询流程

### 6.1 查找组件

```
findComponent(components, componentId)
    ↓
遍历 components 数组
    ├─> component.id === componentId?
    │   └─> 返回 component
    └─> 递归查找 component.children
        ├─> 找到? → 返回 component
        └─> 未找到? → 继续下一个
    ↓
返回 null (未找到)
```

**时间复杂度**: O(n), n 为组件总数
**优化方案**: 建立 componentId → component 索引

### 6.2 获取组件路径

```
getComponentPath(components, componentId)
    ↓
递归遍历组件树
    ├─> 当前组件匹配?
    │   └─> 返回 [componentId]
    └─> 递归搜索子组件
        ├─> 找到?
        │   └─> 返回 [currentId, ...childPath]
        └─> 未找到? → 继续
    ↓
返回 null (未找到)
```

**输出示例**: `['root-id', 'parent-id', 'component-id']`

## 7. 性能优化的数据流

### 7.1 缓存层

```
用户请求 → 检查缓存 → 缓存命中? → 返回缓存数据
                           ↓
                       缓存未命中
                           ↓
                    执行实际查询
                           ↓
                    更新缓存
                           ↓
                    返回数据
```

**缓存策略**:
- LRU (最近最少使用) 淘汰
- 修改操作使缓存失效
- 缓存大小限制: 100 个项目

### 7.2 增量更新

```
用户修改单个属性
    ↓
只更新变更的部分
    ├─> 标记修改的对象
    └─> 记录变更路径
    ↓
序列化时只序列化变更部分
    ↓
减少序列化开销
```

### 7.3 批量操作

```
用户请求批量添加组件
    ↓
manager.batchAddComponents(page, components[])
    ↓
1. 开启事务
    ↓
2. 循环添加组件 (内存操作)
    ↓
3. 一次性提交事务
    ↓
4. 触发单个 'components:added' 事件
    ↓
完成
```

**优势**:
- 减少事务开销
- 减少事件触发次数
- 提高性能

## 8. 数据迁移流程

### 8.1 版本升级

```
检测项目版本
    ↓
版本 < 当前版本?
    ├─> 是 → 执行迁移
    │   ├─> 迁移 v1.0 → v1.1
    │   ├─> 迁移 v1.1 → v1.2
    │   └─> ...
    │   ↓
    │   更新项目版本号
    └─> 否 → 直接加载
```

### 8.2 迁移脚本示例

```typescript
const migrations = {
  '1.0.0-to-1.1.0': (project) => {
    // 添加新字段
    project.pages.forEach(page => {
      page.customEvents = page.customEvents || [];
    });
    return project;
  },

  '1.1.0-to-1.2.0': (project) => {
    // 重命名字段
    project.globalComponents = project.components || [];
    delete project.components;
    return project;
  }
};
```

## 9. 数据流监控

### 9.1 日志记录

```
操作执行
    ↓
记录日志
    ├─> 操作类型
    ├─> 时间戳
    ├─> 操作参数
    ├─> 执行结果
    └─> 错误信息 (如果有)
    ↓
写入日志文件 / 发送到监控服务
```

### 9.2 性能监控

```
操作开始
    ↓
记录开始时间
    ↓
执行操作
    ↓
记录结束时间
    ↓
计算耗时
    ↓
超过阈值? → 发出警告
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
