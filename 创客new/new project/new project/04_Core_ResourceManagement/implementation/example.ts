/**
 * 资源管理模块使用示例
 */

import {
  ResourceManager,
  ResourceLoader,
  LocalStorageAdapter,
  CloudStorageAdapter,
  HybridStorageAdapter,
  ImageProcessor,
  ResourceType,
} from './index';

// ============================================================================
// 示例 1: 基本的资源管理
// ============================================================================

async function basicResourceManagement() {
  console.log('=== 示例 1: 基本的资源管理 ===');

  const manager = new ResourceManager();

  // 添加图片资源
  const imageResource = manager.addResource({
    name: 'app-logo',
    type: ResourceType.Image,
    path: '/images/logo.png',
    size: 12345,
    metadata: {
      width: 256,
      height: 256,
      format: 'png',
    },
    tags: ['logo', 'icon'],
  });

  console.log('添加的资源:', imageResource);

  // 添加音频资源
  const audioResource = manager.addResource({
    name: 'background-music',
    type: ResourceType.Audio,
    path: '/audios/bgm.mp3',
    size: 2048576,
    metadata: {
      duration: 120,
      format: 'mp3',
      bitrate: 128,
    },
  });

  // 列出所有资源
  const allResources = manager.listResources();
  console.log(`总共有 ${allResources.length} 个资源`);

  // 按类型查找
  const images = manager.findResourcesByType(ResourceType.Image);
  console.log(`图片资源: ${images.length} 个`);

  // 查询资源
  const logoResources = manager.queryResources({
    namePattern: 'logo',
  });
  console.log('查询结果:', logoResources);

  // 重命名资源
  manager.renameResource(imageResource.id, 'app-logo-v2');
  console.log('重命名后:', manager.getResource(imageResource.id).name);

  // 删除资源
  manager.removeResource(audioResource.id);
  console.log('删除后资源数:', manager.getResourceCount());
}

// ============================================================================
// 示例 2: 资源加载和缓存
// ============================================================================

async function resourceLoadingAndCaching() {
  console.log('\n=== 示例 2: 资源加载和缓存 ===');

  const loader = new ResourceLoader();

  // 创建示例资源
  const imageResource = {
    id: 'image-1',
    name: 'test-image',
    type: ResourceType.Image,
    path: '/test.png',
    pathType: 'local' as const,
    size: 1024,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 加载图片(第一次)
  console.log('第一次加载图片...');
  const imageData1 = await loader.loadImage(imageResource, { useCache: false });
  console.log('加载完成:', !!imageData1);
  console.log('缓存大小:', loader.getCacheSize());

  // 加载图片(第二次,使用缓存)
  console.log('\n第二次加载图片(应该使用缓存)...');
  const imageData2 = await loader.loadImage(imageResource);
  console.log('加载完成:', !!imageData2);
  console.log('两次加载结果相同:', imageData1 === imageData2);

  // 检查缓存
  console.log('资源是否已缓存:', loader.isCached('image-1'));

  // 清除缓存
  loader.clearCache('image-1');
  console.log('清除缓存后,资源是否已缓存:', loader.isCached('image-1'));
}

// ============================================================================
// 示例 3: 预加载多个资源
// ============================================================================

async function preloadingMultipleResources() {
  console.log('\n=== 示例 3: 预加载多个资源 ===');

  const loader = new ResourceLoader();

  // 创建一些示例资源
  const resources = Array.from({ length: 5 }, (_, i) => ({
    id: `image-${i}`,
    name: `image-${i}`,
    type: ResourceType.Image,
    path: `/images/image-${i}.png`,
    pathType: 'local' as const,
    size: 1024,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  console.log(`开始预加载 ${resources.length} 个资源...`);

  const results = await loader.preloadResources(resources, {
    concurrency: 3,
    onComplete: (preloadResults) => {
      const successful = preloadResults.filter((r) => r.success).length;
      console.log(`预加载完成: ${successful}/${preloadResults.length} 成功`);
    },
  });

  console.log('预加载结果:', results);
}

// ============================================================================
// 示例 4: 存储适配器使用
// ============================================================================

async function storageAdapterUsage() {
  console.log('\n=== 示例 4: 存储适配器使用 ===');

  // 本地存储适配器
  const localAdapter = new LocalStorageAdapter();
  console.log('本地存储适配器:', localAdapter.name, localAdapter.type);

  // 云存储适配器
  const cloudAdapter = new CloudStorageAdapter('your-cloud-env-id');
  console.log('云存储适配器:', cloudAdapter.name, cloudAdapter.type);

  // 混合存储适配器(自动故障转移)
  const hybridAdapter = new HybridStorageAdapter('your-cloud-env-id');
  console.log('混合存储适配器:', hybridAdapter.name, hybridAdapter.type);

  // 演示文件操作(这些在实际环境中才能真正执行)
  console.log('\n存储适配器接口:');
  console.log('- upload(filePath, options): Promise<string>');
  console.log('- download(resourcePath, targetPath): Promise<void>');
  console.log('- delete(resourcePath): Promise<void>');
  console.log('- getFileInfo(resourcePath): Promise<FileInfo>');
  console.log('- exists(resourcePath): Promise<boolean>');
}

// ============================================================================
// 示例 5: 图片处理
// ============================================================================

async function imageProcessing() {
  console.log('\n=== 示例 5: 图片处理 ===');

  const processor = new ImageProcessor();

  // 缩放图片
  console.log('缩放图片...');
  const resizedPath = await processor.resize('/original.png', 800, 600);
  console.log('缩放后:', resizedPath);

  // 裁剪图片
  console.log('\n裁剪图片...');
  const croppedPath = await processor.crop('/original.png', {
    x: 100,
    y: 100,
    width: 200,
    height: 200,
  });
  console.log('裁剪后:', croppedPath);

  // 压缩图片
  console.log('\n压缩图片...');
  const compressedPath = await processor.compress('/original.png', 75);
  console.log('压缩后:', compressedPath);

  // 获取图片信息
  console.log('\n获取图片信息...');
  const imageInfo = await processor.getImageInfo('/test.png');
  console.log('图片信息:', imageInfo);

  // 旋转图片
  console.log('\n旋转图片...');
  const rotatedPath = await processor.rotate('/original.png', 90);
  console.log('旋转后:', rotatedPath);

  // 转换图片格式
  console.log('\n转换图片格式...');
  const convertedPath = await processor.convert('/original.png', 'jpg');
  console.log('转换后:', convertedPath);
}

// ============================================================================
// 示例 6: 资源验证
// ============================================================================

function resourceValidation() {
  console.log('\n=== 示例 6: 资源验证 ===');

  const manager = new ResourceManager();

  // 有效的资源
  try {
    const validResource = manager.addResource({
      name: 'valid-image',
      type: ResourceType.Image,
      path: '/images/valid.png',
      size: 1024,
    });
    console.log('✓ 有效资源添加成功');
  } catch (error) {
    console.log('✗ 错误:', (error as Error).message);
  }

  // 无效的资源 - 超大文件
  try {
    manager.addResource({
      name: 'huge-image',
      type: ResourceType.Image,
      path: '/images/huge.png',
      size: 20 * 1024 * 1024, // 20MB
    });
  } catch (error) {
    console.log('✗ 超大文件被拒绝:', (error as Error).message);
  }

  // 无效的资源 - 不支持的格式
  try {
    manager.addResource({
      name: 'invalid-format',
      type: ResourceType.Image,
      path: '/images/test.bmp',
      size: 1024,
    });
  } catch (error) {
    console.log('✗ 不支持的格式被拒绝:', (error as Error).message);
  }

  // 无效的资源 - 重复名称
  try {
    manager.addResource({
      name: 'valid-image', // 与第一个资源相同
      type: ResourceType.Image,
      path: '/images/another.png',
      size: 1024,
    });
  } catch (error) {
    console.log('✗ 重复名称被拒绝:', (error as Error).message);
  }
}

// ============================================================================
// 示例 7: 序列化和反序列化
// ============================================================================

function serializationExample() {
  console.log('\n=== 示例 7: 序列化和反序列化 ===');

  // 创建资源管理器并添加一些资源
  const manager1 = new ResourceManager();

  manager1.addResource({
    name: 'image1',
    type: ResourceType.Image,
    path: '/images/image1.png',
    size: 1024,
    metadata: { width: 1920, height: 1080 },
    tags: ['UI', 'background'],
  });

  manager1.addResource({
    name: 'audio1',
    type: ResourceType.Audio,
    path: '/audios/bgm.mp3',
    size: 2048576,
  });

  console.log('原始管理器资源数:', manager1.getResourceCount());

  // 序列化
  const json = manager1.toJSON();
  console.log('序列化后 JSON 长度:', json.length);

  // 反序列化
  const manager2 = new ResourceManager();
  manager2.fromJSON(json);
  console.log('反序列化后资源数:', manager2.getResourceCount());

  // 验证数据完整性
  const resource = manager2.getResourceByName('image1');
  console.log('恢复的资源:', resource?.name, resource?.type);
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  console.log('微信小程序可视化开发平台 - 资源管理模块示例\n');

  try {
    // 同步示例
    await basicResourceManagement();
    resourceValidation();
    serializationExample();

    // 异步示例
    await resourceLoadingAndCaching();
    await preloadingMultipleResources();
    await storageAdapterUsage();
    await imageProcessing();

    console.log('\n✓ 所有示例执行完毕!');
  } catch (error) {
    console.error('错误:', error);
  }
}

// 只在直接运行此文件时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  basicResourceManagement,
  resourceLoadingAndCaching,
  preloadingMultipleResources,
  storageAdapterUsage,
  imageProcessing,
  resourceValidation,
  serializationExample,
};
