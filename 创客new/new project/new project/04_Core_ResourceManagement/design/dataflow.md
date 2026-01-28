# 资源管理模块 - 数据流设计文档

## 1. 概述

本文档描述资源管理模块中各种操作的数据流动和处理流程,确保数据在各个组件之间正确传递和处理。

## 2. 核心数据流

### 2.1 资源添加流程

```
用户操作
   ↓
选择文件
   ↓
验证文件 ────────┐
   ↓             │
   ├─ 检查格式   │
   ├─ 检查大小   │ 验证失败 → 抛出 ValidationError
   ├─ 检查名称   │
   └─ 检查路径   │
   ↓             │
创建 Resource 对象
   ↓
生成 UUID
   ↓
检测路径类型 (local/cloud/network)
   ↓
存储到 Map
   ↓
更新索引 ────────┐
   ├─ nameIndex  │
   └─ typeIndex  │
   ↓             │
返回 Resource    │
```

**关键步骤**:
1. 文件验证(格式、大小、名称)
2. 资源对象创建
3. 索引更新(名称索引、类型索引)
4. 返回资源对象

**数据验证**:
- 文件格式: 必须在 SUPPORTED_FORMATS 列表中
- 文件大小: 不能超过 RESOURCE_SIZE_LIMITS
- 资源名称: 长度 1-100,不能重复

### 2.2 资源加载流程

```
请求加载资源
   ↓
检查缓存 ─────── 命中缓存 → 返回缓存数据
   ↓ 未命中
检查是否正在加载 ─ 是 → 等待加载完成
   ↓ 否
标记为加载中
   ↓
根据资源类型选择加载方法
   ├─ Image → loadImage()
   ├─ Audio → loadAudio()
   └─ Video → loadVideo()
   ↓
调用微信 API
   ├─ wx.getImageInfo()
   ├─ wx.createInnerAudioContext()
   └─ (视频直接返回路径)
   ↓
等待加载完成
   ↓
存入缓存
   ↓
移除加载中标记
   ↓
返回加载结果
```

**关键步骤**:
1. 缓存检查(避免重复加载)
2. 加载状态检查(避免并发加载)
3. 调用对应的加载方法
4. 结果缓存
5. 返回加载数据

**超时处理**:
- 默认超时: 30秒
- 超时后: 抛出 LoadTimeoutError
- 清理: 移除加载中标记

### 2.3 资源预加载流程

```
预加载请求
   ↓
资源列表
   ↓
按类型排序 ──────┐
   ├─ Image 优先 │
   ├─ Audio 次之 │
   └─ 其他最后    │
   ↓             │
按并发数分批 (默认5)
   ↓
批次1 ───────────┐
   ├─ 资源1 → loadResource()
   ├─ 资源2 → loadResource()
   ├─ 资源3 → loadResource()
   ├─ 资源4 → loadResource()
   └─ 资源5 → loadResource()
   ↓
等待批次完成
   ↓
批次2 ───────────┐
   └─ ...         │
   ↓             │
收集加载结果
   ├─ 成功: { success: true, duration }
   └─ 失败: { success: false, error, duration }
   ↓
调用完成回调
   ↓
返回结果数组
```

**关键步骤**:
1. 资源按类型排序(图片优先)
2. 分批并发加载
3. 收集加载结果
4. 调用完成回调

**优化策略**:
- 并发控制: 避免同时加载过多资源
- 优先级: 重要资源优先加载
- 错误隔离: 单个失败不影响其他资源

### 2.4 文件上传流程 (StorageAdapter)

```
选择本地文件
   ↓
确定上传目标 (local/cloud)
   ↓
┌─────────┴─────────┐
│                   │
Local              Cloud
   ↓                  ↓
读取文件           wx.cloud.uploadFile()
   ↓                  ↓
确保目录存在        上传到云存储
   ↓                  ↓
写入目标路径        获取 fileID
   ↓                  ↓
返回本地路径        返回 cloud://...
   │                  │
   └─────────┬─────────┘
             ↓
        更新资源路径
             ↓
        返回新路径
```

**关键步骤**:
1. 选择存储目标(本地或云)
2. 调用对应适配器的上传方法
3. 获取上传后的路径
4. 更新资源信息

**故障转移**:
- HybridStorageAdapter 自动切换
- 云存储失败 → 本地存储
- 本地存储失败 → 云存储

### 2.5 图片处理流程

```
原始图片路径
   ↓
选择处理操作
   ├─ resize (缩放)
   ├─ crop (裁剪)
   ├─ compress (压缩)
   ├─ rotate (旋转)
   └─ convert (转换)
   ↓
验证参数
   ├─ 尺寸限制
   ├─ 质量范围
   └─ 角度有效性
   ↓
获取原始图片信息
   ↓
创建 Canvas
   ↓
绘制处理后的图片
   ├─ ctx.drawImage() (缩放/裁剪)
   ├─ ctx.rotate() (旋转)
   └─ quality 参数 (压缩)
   ↓
导出临时文件
   ↓
返回处理后路径
```

**关键步骤**:
1. 参数验证
2. 获取原始图片信息
3. Canvas 绘制
4. 导出临时文件
5. 返回新路径

**性能优化**:
- Canvas 离屏渲染
- 批量处理
- 结果缓存

## 3. 数据状态管理

### 3.1 资源状态

```typescript
interface ResourceState {
  // 资源元数据
  resource: Resource;

  // 加载状态
  loadState: 'idle' | 'loading' | 'loaded' | 'error';

  // 缓存状态
  cached: boolean;

  // 最后访问时间
  lastAccessTime: Date;
}
```

### 3.2 加载器状态

```typescript
interface LoaderState {
  // 缓存数据
  cache: Map<string, any>;

  // 正在加载的资源
  loading: Set<string>;

  // 缓存大小
  cacheSize: number;
}
```

### 3.3 存储适配器状态

```typescript
interface AdapterState {
  // 适配器类型
  type: 'local' | 'cloud' | 'hybrid';

  // 是否可用
  available: boolean;

  // 最后操作时间
  lastOperationTime: Date;
}
```

## 4. 事件流

### 4.1 资源管理事件

```
资源添加
   → resource:added { resource }
   → index:updated

资源删除
   → resource:removed { resourceId }
   → cache:cleared { resourceId }
   → index:updated

资源重命名
   → resource:renamed { oldName, newName }
   → index:updated

资源更新
   → resource:updated { resourceId, updates }
```

### 4.2 加载事件

```
开始加载
   → load:start { resourceId }

加载进度
   → load:progress { resourceId, progress }

加载完成
   → load:complete { resourceId, data }
   → cache:set { resourceId, data }

加载失败
   → load:error { resourceId, error }
   → cache:miss { resourceId }
```

### 4.3 存储事件

```
上传开始
   → upload:start { filePath }

上传进度
   → upload:progress { filePath, progress }

上传完成
   → upload:complete { filePath, remotePath }

上传失败
   → upload:error { filePath, error }

下载开始
   → download:start { remotePath }

下载完成
   → download:complete { remotePath, localPath }

下载失败
   → download:error { remotePath, error }
```

## 5. 错误处理流

### 5.1 验证错误流

```
输入数据
   ↓
验证器
   ↓
验证失败 ─────────┐
   ↓              │
收集错误信息      │
   ├─ code        │
   ├─ message     │
   ├─ field       │
   └─ details     │
   ↓              │
创建 ValidationResult
   ↓
返回给调用者
   ↓
调用者处理错误
   ├─ 显示错误消息
   ├─ 重试
   └─ 取消操作
```

### 5.2 加载错误流

```
加载请求
   ↓
调用 API
   ↓
API 失败 ─────────┐
   ↓              │
捕获错误          │
   ↓              │
创建 ResourceLoadError
   ├─ message     │
   ├─ code        │
   └─ details     │
   ↓              │
清理加载状态      │
   ├─ 移除 loading 标记
   └─ 不缓存结果  │
   ↓              │
抛出错误          │
   ↓
调用者处理
   ├─ 显示错误
   ├─ 重试
   └─ 降级方案
```

### 5.3 存储错误流

```
存储操作
   ↓
适配器调用
   ↓
操作失败 ─────────┐
   ↓              │
检查错误类型      │
   ├─ 权限错误    │
   ├─ 空间不足    │
   ├─ 网络错误    │
   └─ 其他错误    │
   ↓              │
创建 StorageAdapterError
   ↓
尝试故障转移 (HybridAdapter)
   ├─ 云 → 本地
   └─ 本地 → 云
   ↓
返回结果或抛出错误
```

## 6. 性能优化数据流

### 6.1 缓存命中流程

```
请求资源
   ↓
检查 cache Map
   ↓
命中 ─────────────┐
   ↓              │
更新访问时间      │
   ↓              │
直接返回缓存数据 ←┘
   ↓
节省网络请求
节省加载时间
```

### 6.2 索引查询流程

```
查询资源
   ↓
选择索引类型
   ├─ 按ID: resources Map (O(1))
   ├─ 按名称: nameIndex Map (O(1))
   └─ 按类型: typeIndex Map (O(1))
   ↓
直接访问 Map
   ↓
返回结果 (无需遍历)
```

### 6.3 批量操作流程

```
批量操作请求
   ↓
收集所有资源ID
   ↓
并发处理 (Promise.all)
   ├─ 操作1
   ├─ 操作2
   ├─ ...
   └─ 操作N
   ↓
等待全部完成
   ↓
合并结果
   ↓
返回结果数组
```

## 7. 数据持久化流

### 7.1 序列化流程

```
ResourceManager 实例
   ↓
调用 toJSON()
   ↓
提取 resources Map
   ↓
转换为数组
   ↓
JSON.stringify()
   ↓
返回 JSON 字符串
   ↓
写入文件/数据库/云存储
```

### 7.2 反序列化流程

```
读取 JSON 字符串
   ↓
JSON.parse()
   ↓
获取资源数组
   ↓
遍历数组
   ↓
转换日期字符串 → Date 对象
   ↓
重建索引
   ├─ resources Map
   ├─ nameIndex Map
   └─ typeIndex Map
   ↓
恢复 ResourceManager 状态
```

## 8. 微信小程序特定数据流

### 8.1 云存储上传流程

```
选择本地文件
   ↓
读取文件路径
   ↓
调用 wx.cloud.uploadFile({
    cloudPath: '目标路径',
    filePath: '本地路径'
})
   ↓
监听上传进度
   ↓
上传完成
   ↓
获取 fileID (cloud://...)
   ↓
保存 fileID 到 Resource
```

### 8.2 图片信息获取流程

```
图片路径
   ↓
调用 wx.getImageInfo({
    src: '图片路径'
})
   ↓
等待回调
   ↓
success: {
    width,
    height,
    path,
    orientation,
    type
}
   ↓
存储到 Resource.metadata
```

## 9. 数据流图示例

### 9.1 完整的资源添加和加载流程

```
[用户] 选择文件
   ↓
[UI] 调用 ResourceManager.addResource()
   ↓
[ResourceManager] 验证 → 创建 → 存储 → 索引
   ↓
[UI] 获取 Resource 对象
   ↓
[UI] 调用 ResourceLoader.loadImage(resource)
   ↓
[ResourceLoader] 检查缓存 → 未命中
   ↓
[ResourceLoader] 调用 wx.getImageInfo()
   ↓
[微信API] 加载图片 → 返回信息
   ↓
[ResourceLoader] 缓存结果 → 返回
   ↓
[UI] 显示图片
```

### 9.2 混合存储上传流程

```
[用户] 上传文件
   ↓
[HybridStorageAdapter] 选择云存储(优先)
   ↓
[CloudStorageAdapter] wx.cloud.uploadFile()
   ↓
[云存储失败]
   ↓
[HybridStorageAdapter] 故障转移 → 本地存储
   ↓
[LocalStorageAdapter] 写入本地文件
   ↓
[LocalStorageAdapter] 返回本地路径
   ↓
[ResourceManager] 更新 Resource.path
```

## 10. 数据一致性保证

### 10.1 索引一致性

- 添加资源: 同时更新 resources、nameIndex、typeIndex
- 删除资源: 同时从三个索引中移除
- 重命名资源: 更新 nameIndex 映射

### 10.2 缓存一致性

- 资源更新: 清除对应缓存
- 资源删除: 清除对应缓存
- 手动刷新: 提供 clearCache() 方法

### 10.3 状态同步

- 加载状态: loading Set 保证不重复加载
- 缓存状态: cache Map 保证数据最新
- 时间戳: updatedAt 记录最后更新时间

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
