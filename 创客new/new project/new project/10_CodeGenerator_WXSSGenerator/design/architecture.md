# WXSS生成器 - 架构设计

## 1. 概述

WXSS生成器负责将可视化设计的组件样式定义转换为微信小程序的WXSS样式代码。支持rpx单位、CSS预处理器功能、主题系统和响应式设计。

## 2. 核心组件

### 2.1 WXSSGenerator (主生成器)

**职责**:
- 协调整个WXSS生成流程
- 管理全局样式和组件样式
- 输出格式化的WXSS代码

**核心方法**:
```typescript
class WXSSGenerator {
  generateWXSS(components: Component[], options?: WXSSGenerateOptions): string
  generateComponentWXSS(component: Component, options?: WXSSGenerateOptions): string
  generateThemeWXSS(theme: Theme): string
}
```

### 2.2 StyleCompiler (样式编译器)

**职责**:
- 将 ComponentStyle 对象编译为CSS规则
- 处理单位转换 (rpx, px, %, vw, vh)
- 生成响应式媒体查询
- 支持CSS嵌套和变量

**核心方法**:
```typescript
class StyleCompiler {
  compileStyle(style: ComponentStyle, selector: string): CSSRule[]
  convertUnit(value: string, unit: CSSUnit): string
  generateMediaQuery(breakpoint: Breakpoint, rules: CSSRule[]): string
  compileNested(styles: NestedStyles): CSSRule[]
}
```

### 2.3 ThemeManager (主题管理器)

**职责**:
- 管理全局主题变量
- 支持主题继承和覆盖
- 生成CSS变量声明

**核心方法**:
```typescript
class ThemeManager {
  defineTheme(theme: Theme): void
  getThemeVariables(): Record<string, string>
  applyTheme(themeName: string): string
  extendTheme(baseName: string, overrides: Partial<Theme>): Theme
}
```

### 2.4 CSSFormatter (格式化器)

**职责**:
- 生成格式规范的WXSS代码
- 支持压缩和美化两种模式
- 生成源代码映射 (可选)

**核心方法**:
```typescript
class CSSFormatter {
  format(rules: CSSRule[], options?: FormatOptions): string
  minify(css: string): string
  beautify(css: string, options?: BeautifyOptions): string
  generateSourceMap(css: string, original: Component[]): SourceMap
}
```

### 2.5 CSSValidator (验证器)

**职责**:
- 验证CSS选择器有效性
- 检查单位使用规范
- 检查微信小程序WXSS兼容性

**核心方法**:
```typescript
class CSSValidator {
  validateSelector(selector: string): ValidationResult
  validateUnit(value: string): ValidationResult
  validateProperty(property: string, value: string): ValidationResult
  checkCompatibility(css: string): CompatibilityReport
}
```

## 3. 数据流

```
组件树 (Component[])
    ↓
[WXSSGenerator]
    ↓
样式提取 → ComponentStyle[]
    ↓
[StyleCompiler]
    ↓
CSS规则生成 → CSSRule[]
    ↓
单位转换 (rpx)
    ↓
嵌套展开
    ↓
变量替换
    ↓
[ThemeManager] (可选)
    ↓
主题变量注入
    ↓
[CSSValidator]
    ↓
验证和兼容性检查
    ↓
[CSSFormatter]
    ↓
格式化/压缩
    ↓
WXSS代码输出
```

## 4. rpx单位处理

### 4.1 转换规则

微信小程序使用rpx作为响应式单位，1rpx = 屏幕宽度 / 750。

**转换策略**:
- 保留原始rpx值
- px转rpx: 可选，通过配置启用
- 自动判断: 字体大小使用px，其他使用rpx

### 4.2 实现示例

```typescript
// 输入
{
  width: '200rpx',
  fontSize: '14px',
  padding: '10'  // 默认rpx
}

// 输出
.component {
  width: 200rpx;
  font-size: 14px;
  padding: 10rpx;
}
```

## 5. CSS预处理器功能

### 5.1 CSS变量

```typescript
// 输入
{
  variables: {
    primaryColor: '#007aff',
    spacing: '10rpx'
  },
  style: {
    color: 'var(--primary-color)',
    padding: 'var(--spacing)'
  }
}

// 输出
:root {
  --primary-color: #007aff;
  --spacing: 10rpx;
}

.component {
  color: var(--primary-color);
  padding: var(--spacing);
}
```

### 5.2 CSS嵌套

```typescript
// 输入
{
  '.container': {
    padding: '20rpx',
    '.header': {
      fontSize: '16px'
    },
    '&:hover': {
      backgroundColor: '#f0f0f0'
    }
  }
}

// 输出
.container {
  padding: 20rpx;
}

.container .header {
  font-size: 16px;
}

.container:hover {
  background-color: #f0f0f0;
}
```

### 5.3 混合 (Mixins)

```typescript
// 定义混合
const mixins = {
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
};

// 使用
{
  mixin: 'flexCenter',
  padding: '20rpx'
}

// 输出
.component {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
}
```

## 6. 响应式设计

### 6.1 断点系统

```typescript
const breakpoints = {
  xs: '0-375px',      // 小屏手机
  sm: '375-667px',    // 常规手机
  md: '667-768px',    // 大屏手机
  lg: '768-1024px',   // 平板
  xl: '1024px+'       // 大屏设备
};
```

### 6.2 媒体查询生成

```typescript
// 输入
{
  base: { fontSize: '14px' },
  responsive: {
    sm: { fontSize: '16px' },
    md: { fontSize: '18px' }
  }
}

// 输出
.component {
  font-size: 14px;
}

@media (min-width: 375px) {
  .component {
    font-size: 16px;
  }
}

@media (min-width: 667px) {
  .component {
    font-size: 18px;
  }
}
```

## 7. 主题系统

### 7.1 主题定义

```typescript
interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    text: string;
    background: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}
```

### 7.2 主题应用

```typescript
// 定义主题
const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#007aff',
    background: '#ffffff',
    text: '#000000',
    // ...
  },
  // ...
};

// 生成CSS变量
:root {
  --color-primary: #007aff;
  --color-background: #ffffff;
  --color-text: #000000;
}

// 组件中使用
.button {
  background-color: var(--color-primary);
  color: var(--color-background);
}
```

## 8. 优化和压缩

### 8.1 压缩策略

- 移除空白和注释
- 合并相同选择器
- 缩短颜色值 (#ffffff → #fff)
- 移除默认值
- 合并相邻属性

### 8.2 示例

```typescript
// 美化模式
.container {
  width: 100%;
  padding: 20rpx;
  background-color: #ffffff;
}

// 压缩模式
.container{width:100%;padding:20rpx;background-color:#fff}
```

## 9. 性能考虑

### 9.1 缓存策略

- 缓存编译结果
- 按组件ID缓存
- 主题变量缓存

### 9.2 增量生成

- 只重新生成修改的组件样式
- 保留未修改组件的缓存

## 10. 错误处理

### 10.1 错误类型

```typescript
class WXSSGeneratorError extends Error {
  code: string;
  details?: any;
}

// 具体错误
- InvalidSelectorError
- InvalidPropertyError
- InvalidValueError
- UnitConversionError
- ThemeNotFoundError
```

### 10.2 验证流程

```
输入验证 → 编译 → 输出验证
    ↓         ↓         ↓
  错误收集  错误收集  错误收集
    ↓         ↓         ↓
      合并错误报告
          ↓
    返回ValidationResult
```

## 11. 可扩展性

### 11.1 插件系统

```typescript
interface WXSSPlugin {
  name: string;
  transform(css: CSSRule[]): CSSRule[];
  validate?(css: string): ValidationResult;
}

// 注册插件
generator.use(autoprefixerPlugin);
generator.use(customOptimizePlugin);
```

### 11.2 自定义转换器

```typescript
interface UnitConverter {
  name: string;
  convert(value: string, options: ConvertOptions): string;
}

// 注册转换器
compiler.registerConverter('rem', remConverter);
```

## 12. 测试策略

### 12.1 单元测试

- 每个类的核心方法测试
- 边界条件测试
- 错误处理测试

### 12.2 集成测试

- 完整生成流程测试
- 主题切换测试
- 响应式生成测试

### 12.3 覆盖率目标

- 语句覆盖率: >90%
- 分支覆盖率: >85%
- 函数覆盖率: >95%

## 13. 兼容性

### 13.1 微信小程序WXSS限制

- 不支持级联选择器的通配符 `*`
- 不支持属性选择器
- 部分CSS3特性不支持

### 13.2 检查清单

- ✓ 选择器类型检查
- ✓ 属性支持检查
- ✓ 单位支持检查
- ✓ 值格式检查

## 14. 输出格式

### 14.1 标准输出

```wxss
/* 自动生成 - 请勿手动修改 */
/* Generated by WXSS Generator */

/* 全局变量 */
:root {
  --color-primary: #007aff;
}

/* 组件样式 */
.container {
  display: flex;
  flex-direction: column;
  padding: 20rpx;
}

.header {
  font-size: 18px;
  font-weight: bold;
}
```

### 14.2 源映射 (可选)

```json
{
  "version": 3,
  "sources": ["component-123.style", "component-456.style"],
  "mappings": "AAAA,CAAC,CAAC;EACA,OAAO,EAAE,IAAI..."
}
```

## 15. 总结

WXSS生成器采用模块化架构，各组件职责清晰：

- **WXSSGenerator**: 总控制器，协调流程
- **StyleCompiler**: 核心编译逻辑，处理样式转换
- **ThemeManager**: 主题系统，管理全局变量
- **CSSFormatter**: 格式化输出，支持美化和压缩
- **CSSValidator**: 验证器，确保兼容性

通过这种设计，系统具有良好的可维护性、可扩展性和性能。
