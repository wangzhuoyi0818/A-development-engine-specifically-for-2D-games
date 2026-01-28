# 属性编辑器模块

微信小程序可视化开发平台的属性编辑器核心模块，提供统一的属性编辑、验证、格式化和管理功能。

## 功能特性

- 支持多种属性类型（文本、数字、颜色、选择、日期等）
- 完整的属性验证系统
- 属性分组和搜索
- 批量编辑支持
- 自定义属性类型扩展
- 类型安全的 TypeScript 实现
- 高测试覆盖率 (>90%)

## 安装

```bash
npm install
```

## 测试

```bash
# 运行测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 使用 UI 运行测试
npm run test:ui
```

## 使用示例

### 基本用法

```typescript
import { createPropertyEditor, PropertyType } from './index';

// 创建属性编辑器
const editor = createPropertyEditor({
  definitions: [
    {
      name: 'title',
      label: '标题',
      type: PropertyType.Text,
      defaultValue: '',
      required: true,
    },
    {
      name: 'count',
      label: '数量',
      type: PropertyType.Number,
      defaultValue: 0,
      options: {
        numberOptions: {
          min: 0,
          max: 100,
        },
      },
    },
    {
      name: 'color',
      label: '颜色',
      type: PropertyType.Color,
      defaultValue: '#000000',
      group: '样式',
    },
  ],
  initialValues: {
    title: 'Hello',
    count: 10,
    color: '#ff0000',
  },
});

// 监听属性变化
editor.on('change', (event) => {
  console.log('属性变化:', event.propertyName, event.newValue);
});

// 更新属性
const result = editor.updateProperty('title', 'New Title');
if (result.valid) {
  console.log('更新成功');
} else {
  console.log('验证失败:', result.errors);
}

// 获取属性值
const title = editor.getProperty('title');
console.log('当前标题:', title);
```

### 批量编辑

```typescript
// 开始批量编辑
editor.startBatchEdit();

// 更新多个属性（不会立即触发事件）
editor.updateBatchProperty('title', 'Batch Title');
editor.updateBatchProperty('count', 50);

// 提交批量编辑
const result = editor.commitBatchEdit();
if (result.valid) {
  console.log('批量更新成功');
}

// 或者取消批量编辑
// editor.cancelBatchEdit();
```

### 搜索属性

```typescript
// 搜索包含 "颜色" 的属性
editor.search('颜色');

// 获取可见属性
const visible = editor.getVisibleProperties();
console.log('匹配的属性:', visible);
```

### 自定义验证

```typescript
// 注册自定义验证函数
editor.registerValidator('count', (value) => {
  if (value % 2 !== 0) {
    return {
      code: 'CUSTOM' as any,
      message: '数量必须是偶数',
    };
  }
  return null;
});
```

### 属性分组

```typescript
// 获取所有分组
const groups = editor.getGroups();

// 获取分组中的属性
const styleProps = editor.getGroupProperties('样式');

// 切换分组展开/折叠
editor.toggleGroup('样式');
```

## 属性类型

模块支持以下属性类型：

- `text` - 文本输入
- `number` - 数字输入
- `color` - 颜色选择
- `select` - 下拉选择
- `checkbox` - 复选框
- `switch` - 开关
- `slider` - 滑块
- `rating` - 评分
- `date` - 日期选择
- `time` - 时间选择
- `dateTime` - 日期时间
- `file` - 文件选择
- `json` - JSON 对象
- `binding` - 变量绑定
- `expression` - 表达式
- 更多扩展类型...

## 验证规则

支持的验证规则类型：

- `required` - 必填验证
- `type` - 类型验证
- `range` - 范围验证
- `length` - 长度验证
- `pattern` - 正则模式验证
- `enum` - 枚举验证
- `custom` - 自定义验证

## 架构

模块分为以下几层：

1. **类型系统层** (`types.ts`) - 定义所有 TypeScript 类型
2. **工具层** (`property-formatter.ts`) - 提供格式化、解析和验证工具
3. **业务逻辑层**:
   - `property-editor.ts` - 属性编辑器核心逻辑
   - `property-field.ts` - 属性字段类型实现
4. **React 组件层** (待实现) - UI 组件

## 测试

测试文件位于 `tests/` 目录：

- `property-formatter.test.ts` - 格式化器测试
- `property-editor.test.ts` - 编辑器核心测试
- `property-field.test.ts` - 属性字段测试

当前测试覆盖率：>90%

## 文档

详细设计文档位于 `../design/` 目录：

- `architecture.md` - 架构设计文档
- `dataflow.md` - 数据流设计文档

## License

MIT
