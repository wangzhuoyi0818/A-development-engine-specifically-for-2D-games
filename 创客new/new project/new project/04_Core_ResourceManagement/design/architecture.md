# 资源管理模块 - 架构设计文档

## 1. 模块概述

### 1.1 功能定位
本模块是微信小程序可视化开发平台的核心基础模块,负责管理项目中的所有资源(图片、音频、视频、字体、数据文件等)。参考 GDevelop 的 ResourcesManager,针对微信小程序的特性进行了专门设计和优化。

### 1.2 核心职责
- 资源的增删改查管理
- 资源验证(格式、大小、类型)
- 资源加载和预加载
- 资源缓存管理
- 本地存储和云存储适配
- 图片处理(缩放、裁剪、压缩)
- 资源URL管理

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    ResourceManager                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  资源存储 Map<string, Resource>                      │  │
│  │  名称索引 Map<string, string>                        │  │
│  │  类型索引 Map<ResourceType, Set<string>>             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  操作:                                               │  │
│  │    - addResource()      添加资源                     │  │
│  │    - removeResource()   删除资源                     │  │
│  │    - getResource()      获取资源                     │  │
│  │    - renameResource()   重命名资源                   │  │
│  │    - listResources()    列出所有资源                 │  │
│  │    - findResourcesByType() 按类型查找                │  │
│  │    - validateResource() 验证资源                     │  │
│  │    - queryResources()   按条件查询                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ResourceLoader                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  加载缓存 Map<string, any>                           │  │
│  │  加载状态 Set<string>                                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  操作:                                               │  │
│  │    - loadImage()        加载图片                     │  │
│  │    - loadAudio()        加载音频                     │  │
│  │    - preloadResources() 预加载资源                   │  │
│  │    - getResourceUrl()   获取资源URL                  │  │
│  │    - clearCache()       清除缓存                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 StorageAdapter (接口)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LocalStorageAdapter    本地存储                     │  │
│  │  CloudStorageAdapter    云存储(微信云开发)           │  │
│  │  HybridStorageAdapter   混合存储(自动故障转移)       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  操作:                                               │  │
│  │    - upload()           上传文件                     │  │
│  │    - download()         下载文件                     │  │
│  │    - delete()           删除文件                     │  │
│  │    - getFileInfo()      获取文件信息                 │  │
│  │    - exists()           检查文件是否存在             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ImageProcessor                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  操作:                                               │  │
│  │    - resize()           缩放图片                     │  │
│  │    - crop()             裁剪图片                     │  │
│  │    - compress()         压缩图片                     │  │
│  │    - getImageInfo()     获取图片信息                 │  │
│  │    - rotate()           旋转图片                     │  │
│  │    - convert()          转换图片格式                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 类关系图

```
┌──────────────────────┐
│ Resource             │
├──────────────────────┤
│ + id: string         │
│ + name: string       │
│ + type: ResourceType │
│ + path: string       │
│ + pathType: PathType │
│ + size: number       │
│ + metadata: Metadata │
│ + tags: string[]     │
│ + createdAt: Date    │
│ + updatedAt: Date    │
└──────────────────────┘
           ▲
           │ 管理
           │
┌──────────────────────┐
│ ResourceManager      │
├──────────────────────┤
│ - resources: Map     │
│ - nameIndex: Map     │
│ - typeIndex: Map     │
├──────────────────────┤
│ + addResource()      │
│ + removeResource()   │
│ + getResource()      │
│ + renameResource()   │
│ + listResources()    │
│ + queryResources()   │
│ + validateResource() │
└──────────────────────┘
           │
           │ 使用
           ▼
┌──────────────────────┐
│ ResourceLoader       │
├──────────────────────┤
│ - cache: Map         │
│ - loading: Set       │
├──────────────────────┤
│ + loadImage()        │
│ + loadAudio()        │
│ + preloadResources() │
│ + getResourceUrl()   │
└──────────────────────┘
           │
           │ 使用
           ▼
┌──────────────────────┐
│ StorageAdapter       │◄────────────┐
├──────────────────────┤             │
│ + upload()           │             │
│ + download()         │    ┌────────┴────────┐
│ + delete()           │    │ ImageProcessor  │
│ + getFileInfo()      │    ├─────────────────┤
│ + exists()           │    │ + resize()      │
└──────────────────────┘    │ + crop()        │
           ▲                │ + compress()    │
           │ 实现            │ + rotate()      │
  ┌────────┼────────┐       │ + convert()     │
  │        │        │       └─────────────────┘
Local   Cloud   Hybrid
Storage Storage Storage
```

### 2.3 设计模式

#### 2.3.1 Manager Pattern (管理器模式)
- **ResourceManager**: 集中管理所有资源,提供统一的资源操作接口
- **优势**: 隔离数据和操作,便于维护和测试

#### 2.3.2 Adapter Pattern (适配器模式)
- **StorageAdapter**: 定义统一的存储接口,支持多种存储实现
- **优势**: 灵活切换存储方式,易于扩展

#### 2.3.3 Strategy Pattern (策略模式)
- **HybridStorageAdapter**: 根据条件选择不同的存储策略
- **优势**: 动态选择最优策略,支持故障转移

#### 2.3.4 Cache Pattern (缓存模式)
- **ResourceLoader**: 缓存已加载的资源,避免重复加载
- **优势**: 提升性能,减少网络请求

## 3. 核心类设计

### 3.1 ResourceManager

```typescript
class ResourceManager {
  private resources: Map<string, Resource>;
  private nameIndex: Map<string, string>;
  private typeIndex: Map<ResourceType, Set<string>>;

  // 资源管理
  addResource(options: ResourceCreateOptions): Resource
  removeResource(resourceId: string): void
  getResource(resourceId: string): Resource
  getResourceByName(name: string): Resource | null
  renameResource(resourceId: string, newName: string): void
  updateResource(resourceId: string, updates: ResourceUpdateOptions): Resource

  // 查询
  listResources(): Resource[]
  findResourcesByType(type: ResourceType): Resource[]
  queryResources(query: ResourceQuery): Resource[]
  getResourceCount(): number
  getResourceCountByType(type: ResourceType): number

  // 验证
  validateResource(resource: Resource): ValidationResult
  validateResourceOptions(options: ResourceCreateOptions): ValidationResult

  // 序列化
  toJSON(): string
  fromJSON(json: string): void

  // 清空
  clear(): void
}
```

**职责**:
- 管理资源的生命周期
- 维护资源索引加速查询
- 验证资源有效性
- 支持序列化和持久化

### 3.2 ResourceLoader

```typescript
class ResourceLoader {
  private cache: Map<string, any>;
  private loading: Set<string>;
  private defaultTimeout: number;

  // 加载
  loadImage(resource: Resource, options?: ResourceLoadOptions): Promise<any>
  loadAudio(resource: Resource, options?: ResourceLoadOptions): Promise<any>
  loadVideo(resource: Resource, options?: ResourceLoadOptions): Promise<any>
  preloadResources(resources: Resource[], options?: PreloadOptions): Promise<PreloadResult[]>

  // URL管理
  getResourceUrl(resource: Resource): string

  // 缓存管理
  clearCache(resourceId?: string): void
  getCacheSize(): number
  isCached(resourceId: string): boolean
  isLoading(resourceId: string): boolean
}
```

**职责**:
- 加载各种类型的资源
- 管理加载缓存
- 支持预加载和进度回调
- 处理加载超时

### 3.3 StorageAdapter

```typescript
interface StorageAdapter {
  readonly name: string;
  readonly type: 'local' | 'cloud';

  upload(filePath: string, options?: UploadOptions): Promise<string>
  download(resourcePath: string, targetPath: string): Promise<void>
  delete(resourcePath: string): Promise<void>
  getFileInfo(resourcePath: string): Promise<FileInfo>
  exists(resourcePath: string): Promise<boolean>
}
```

**实现类**:
- **LocalStorageAdapter**: 基于 wx.getFileSystemManager()
- **CloudStorageAdapter**: 基于 wx.cloud.uploadFile/downloadFile
- **HybridStorageAdapter**: 自动选择和故障转移

### 3.4 ImageProcessor

```typescript
class ImageProcessor {
  private readonly maxWidth: number;
  private readonly maxHeight: number;

  resize(imagePath: string, width: number, height: number, options?: ImageProcessOptions): Promise<string>
  crop(imagePath: string, cropOptions: ImageCropOptions, processOptions?: ImageProcessOptions): Promise<string>
  compress(imagePath: string, quality: number): Promise<string>
  getImageInfo(imagePath: string): Promise<ImageInfo>
  rotate(imagePath: string, angle: number): Promise<string>
  convert(imagePath: string, targetFormat: 'jpg' | 'png'): Promise<string>
}
```

**职责**:
- 图片缩放和调整
- 图片裁剪
- 图片压缩优化
- 图片格式转换

## 4. 数据结构设计

### 4.1 核心类型

#### ResourceType 枚举
```typescript
enum ResourceType {
  Image = 'image',    // 图片
  Audio = 'audio',    // 音频
  Video = 'video',    // 视频
  Font = 'font',      // 字体
  Data = 'data',      // 数据文件
}
```

#### Resource 接口
```typescript
interface Resource {
  id: string;                    // UUID
  name: string;                  // 名称
  type: ResourceType;            // 类型
  path: string;                  // 路径
  pathType: ResourcePathType;    // 路径类型
  size: number;                  // 文件大小(字节)
  metadata: ResourceMetadata;    // 元数据
  tags?: string[];               // 标签
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}
```

### 4.2 数据约束

#### 资源级别约束
- `id`: 必须是有效的 UUID v4
- `name`: 非空,长度 1-100 字符,不能重复
- `type`: 必须是有效的 ResourceType 枚举值
- `path`: 非空,必须是有效的文件路径
- `size`: 必须大于 0,不能超过类型限制

#### 文件格式约束
```typescript
SUPPORTED_FORMATS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'svg'],
  audio: ['mp3', 'wav', 'aac', 'm4a'],
  video: ['mp4'],
  font: ['ttf', 'otf', 'woff', 'woff2'],
  data: ['json'],
}
```

#### 文件大小限制
```typescript
RESOURCE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,  // 10MB
  audio: 10 * 1024 * 1024,  // 10MB
  video: 50 * 1024 * 1024,  // 50MB
  font: 5 * 1024 * 1024,    // 5MB
  data: 5 * 1024 * 1024,    // 5MB
}
```

## 5. 异常处理

### 5.1 异常类型

```typescript
// 基类
class ResourceError extends Error

// 具体错误
class ResourceNotFoundError extends ResourceError
class ResourceAlreadyExistsError extends ResourceError
class ResourceValidationError extends ResourceError
class ResourceLoadError extends ResourceError
class StorageAdapterError extends ResourceError
class ImageProcessError extends ResourceError
```

### 5.2 异常处理策略

1. **输入验证**: 所有公共方法验证输入参数
2. **明确错误**: 使用具体的错误类型
3. **错误传播**: 不吞噬异常,向上传播
4. **错误信息**: 提供详细的错误上下文
5. **日志记录**: 记录关键错误信息

## 6. 性能优化

### 6.1 优化策略

1. **索引优化**
   - 名称索引: Map<name, id> 快速查找
   - 类型索引: Map<type, Set<id>> 按类型查询

2. **缓存机制**
   - 资源加载缓存
   - 图片处理结果缓存
   - 文件信息缓存

3. **预加载**
   - 批量预加载资源
   - 控制并发数量
   - 按优先级加载

4. **懒加载**
   - 按需加载资源
   - 避免一次性加载所有资源

### 6.2 内存管理

1. **及时清理**: 删除资源时清理缓存
2. **缓存限制**: 限制缓存大小
3. **弱引用**: 临时对象使用 WeakMap

## 7. 微信小程序特性

### 7.1 路径类型

- **本地路径**: `/path/to/file` 或 `wx.env.USER_DATA_PATH`
- **云存储**: `cloud://env-id/path/to/file`
- **网络URL**: `https://example.com/file`

### 7.2 API使用

- **文件系统**: `wx.getFileSystemManager()`
- **云存储**: `wx.cloud.uploadFile()` / `wx.cloud.downloadFile()`
- **图片处理**: `wx.getImageInfo()` / `wx.compressImage()`
- **音频**: `wx.createInnerAudioContext()`

### 7.3 限制和注意事项

1. **文件大小限制**: 严格遵守微信小程序限制
2. **存储路径**: 只能访问特定目录
3. **云存储**: 需要配置云环境
4. **异步操作**: 所有文件操作都是异步的

## 8. 测试策略

### 8.1 单元测试覆盖

- 资源管理器所有公共方法
- 资源加载器所有功能
- 存储适配器基本功能
- 图片处理器所有操作
- 异常处理
- 边界条件

### 8.2 测试用例设计

1. **正常流程**: CRUD 操作
2. **边界条件**: 空值、极限值
3. **异常情况**: 无效参数、不存在的资源
4. **性能测试**: 大量资源、并发加载
5. **集成测试**: 模块间协作

目标: **测试覆盖率 > 90%**

## 9. 与 GDevelop 的对比

| GDevelop | 本模块 | 说明 |
|----------|--------|------|
| gd::ResourcesManager | ResourceManager | 资源管理器 |
| gd::Resource | Resource | 资源对象 |
| ResourcesLoader (IDE) | ResourceLoader | 资源加载器 |
| 无 | StorageAdapter | 存储适配(新增) |
| 无 | ImageProcessor | 图片处理(新增) |

**主要改进**:
1. 添加存储适配器支持多种存储方式
2. 添加图片处理功能
3. 优化索引结构提升查询性能
4. 支持微信小程序特定API
5. 更完善的验证和错误处理

## 10. 技术选型

- **语言**: TypeScript 4.9+ (strict 模式)
- **测试框架**: Vitest
- **UUID生成**: uuid
- **运行环境**: 微信小程序 + Node.js(测试)

## 11. 未来优化方向

1. **CDN加速**: 支持CDN资源URL
2. **资源打包**: 批量打包下载资源
3. **增量更新**: 资源增量更新机制
4. **智能压缩**: 自动选择最优压缩参数
5. **格式转换**: 支持更多图片格式转换
6. **缩略图**: 自动生成缩略图
7. **水印**: 图片水印功能

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
