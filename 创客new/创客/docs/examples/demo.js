// 游戏项目管理系统演示

// 模拟导入相关模块（由于使用了ES6模块和Flow，这里直接内联代码）
const GAME_TYPES = {
  action: {
    name: '动作游戏',
    icon: '⚔️',
    color: '#FF5722',
    description: '强调操作技巧和反应速度的游戏',
  },
  puzzle: {
    name: '益智游戏',
    icon: '🧩',
    color: '#9C27B0',
    description: '考验逻辑思维和解谜能力的游戏',
  },
  casual: {
    name: '休闲游戏',
    icon: '🎮',
    color: '#4CAF50',
    description: '轻松简单、易于上手的游戏',
  },
  adventure: {
    name: '冒险游戏',
    icon: '🗺️',
    color: '#2196F3',
    description: '探索世界、完成任务的游戏',
  },
  strategy: {
    name: '策略游戏',
    icon: '♟️',
    color: '#FF9800',
    description: '需要规划和战术思考的游戏',
  },
  rpg: {
    name: '角色扮演',
    icon: '🎭',
    color: '#E91E63',
    description: '扮演角色、发展能力的游戏',
  },
  simulation: {
    name: '模拟游戏',
    icon: '🏗️',
    color: '#00BCD4',
    description: '模拟真实或虚拟场景的游戏',
  },
  sports: {
    name: '体育游戏',
    icon: '⚽',
    color: '#8BC34A',
    description: '模拟各种体育运动的游戏',
  },
  other: {
    name: '其他',
    icon: '📦',
    color: '#9E9E9E',
    description: '其他类型的游戏',
  },
};

const RESOURCE_TYPES = {
  image: {
    name: '图片',
    icon: '🖼️',
    extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'],
    description: '图片资源（精灵、背景、UI等）',
  },
  audio: {
    name: '音频',
    icon: '🔊',
    extensions: ['.mp3', '.wav', '.ogg', '.aac', '.m4a'],
    description: '音频资源（音效、音乐）',
  },
  model3D: {
    name: '3D模型',
    icon: '🎲',
    extensions: ['.glb', '.gltf'],
    description: '3D模型资源',
  },
  video: {
    name: '视频',
    icon: '🎬',
    extensions: ['.mp4', '.webm', '.ogv'],
    description: '视频资源',
  },
  font: {
    name: '字体',
    icon: '🔤',
    extensions: ['.ttf', '.otf', '.woff', '.woff2'],
    description: '字体资源',
  },
  json: {
    name: '数据',
    icon: '📄',
    extensions: ['.json'],
    description: 'JSON数据文件',
  },
  tilemap: {
    name: '瓦片地图',
    icon: '🗺️',
    extensions: ['.json', '.ldtk', '.tmj', '.tsj'],
    description: '瓦片地图和瓦片集',
  },
};

const getGameTypeConfig = (gameType) => {
  return GAME_TYPES[gameType] || GAME_TYPES.other;
};

const getResourceTypeConfig = (resourceType) => {
  return RESOURCE_TYPES[resourceType];
};

// 简化的MetadataStorage类
class MetadataStorage {
  constructor() {
    this.projects = [];
  }

  getAllProjects() {
    return this.projects;
  }

  saveProject(project) {
    const index = this.projects.findIndex(p => p.projectId === project.projectId);
    if (index >= 0) {
      this.projects[index] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      this.projects.push(project);
    }
  }

  clearAll() {
    this.projects = [];
  }
}

// 简化的ProjectClassifier类
class ProjectClassifier {
  groupByGameType(projects) {
    const grouped = {};
    projects.forEach(project => {
      const type = project.gameType;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(project);
    });
    return grouped;
  }

  getFavoriteProjects(projects) {
    return projects.filter(p => p.favorite);
  }

  getRecentProjects(projects, limit = 10) {
    return [...projects]
      .sort((a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime())
      .slice(0, limit);
  }

  getProjectStats(projects) {
    const stats = {
      total: projects.length,
      favorites: 0,
      byGameType: {},
      byCategory: {},
      totalResources: {
        images: 0,
        audio: 0,
        models3D: 0,
        videos: 0,
        fonts: 0,
        other: 0,
      },
      allTags: new Set(),
    };

    projects.forEach(project => {
      if (project.favorite) {
        stats.favorites++;
      }

      const gameType = project.gameType;
      stats.byGameType[gameType] = (stats.byGameType[gameType] || 0) + 1;

      const category = project.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      stats.totalResources.images += project.resources.images;
      stats.totalResources.audio += project.resources.audio;
      stats.totalResources.models3D += project.resources.models3D;
      stats.totalResources.videos += project.resources.videos || 0;
      stats.totalResources.fonts += project.resources.fonts || 0;
      stats.totalResources.other += project.resources.other || 0;

      project.tags.forEach(tag => stats.allTags.add(tag));
    });

    return {
      ...stats,
      allTags: Array.from(stats.allTags),
    };
  }

  searchProjects(projects, searchText) {
    if (!searchText) return projects;

    const searchLower = searchText.toLowerCase();
    return projects.filter(
      p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        p.category.toLowerCase().includes(searchLower)
    );
  }

  suggestTags(projects, currentProject) {
    const similarProjects = projects.filter(
      p => p.gameType === currentProject.gameType && p.projectId !== currentProject.projectId
    );

    const tagFrequency = {};
    similarProjects.forEach(project => {
      project.tags.forEach(tag => {
        if (!currentProject.tags.includes(tag)) {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        }
      });
    });

    return Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }
}

const metadataStorage = new MetadataStorage();
const projectClassifier = new ProjectClassifier();

// 演示数据
const demoProjects = [
  {
    projectId: 'demo-001',
    name: '我的第一个动作游戏',
    description: '一个简单的平台跳跃游戏',
    gameType: 'action',
    tags: ['平台跳跃', '2D', '初学者'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    lastOpened: '2024-01-20T15:30:00Z',
    favorite: true,
    category: '我的项目',
    resources: {
      images: 25,
      audio: 8,
      models3D: 0,
      videos: 0,
      fonts: 2,
      other: 3,
    },
    projectPath: '/projects/action-game-1',
  },
  {
    projectId: 'demo-002',
    name: '益智拼图游戏',
    description: '经典的数字拼图游戏',
    gameType: 'puzzle',
    tags: ['数字', '益智', '经典'],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    lastOpened: '2024-01-18T14:20:00Z',
    favorite: false,
    category: '我的项目',
    resources: {
      images: 15,
      audio: 5,
      models3D: 0,
      videos: 0,
      fonts: 1,
      other: 1,
    },
    projectPath: '/projects/puzzle-game-1',
  },
  {
    projectId: 'demo-003',
    name: '休闲农场模拟',
    description: '经营自己的虚拟农场',
    gameType: 'simulation',
    tags: ['农场', '经营', '休闲'],
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
    lastOpened: '2024-01-19T16:45:00Z',
    favorite: true,
    category: '模板项目',
    resources: {
      images: 45,
      audio: 12,
      models3D: 8,
      videos: 2,
      fonts: 3,
      other: 5,
    },
    projectPath: '/projects/farm-sim-1',
  },
];

console.log('🎮 游戏项目管理系统演示');
console.log('=====================================\n');

// 1. 显示游戏类型配置
console.log('📋 支持的游戏类型:');
Object.entries(GAME_TYPES).forEach(([key, config]) => {
  console.log(`  ${config.icon} ${config.name} (${key}): ${config.description}`);
});
console.log();

// 2. 显示资源类型配置
console.log('📁 支持的资源类型:');
Object.entries(RESOURCE_TYPES).forEach(([key, config]) => {
  console.log(`  ${config.icon} ${config.name}: ${config.extensions.join(', ')}`);
});
console.log();

// 3. 演示项目分类功能
console.log('🔍 项目筛选和分类演示:');

// 添加演示项目到存储
demoProjects.forEach(project => {
  metadataStorage.saveProject(project);
});

const allProjects = metadataStorage.getAllProjects();
console.log(`📊 总项目数: ${allProjects.length}`);

// 按游戏类型分组
const groupedByType = projectClassifier.groupByGameType(allProjects);
console.log('\n🎯 按游戏类型分组:');
Object.entries(groupedByType).forEach(([type, projects]) => {
  const config = getGameTypeConfig(type);
  console.log(`  ${config.icon} ${config.name}: ${projects.length} 个项目`);
});

// 获取收藏项目
const favorites = projectClassifier.getFavoriteProjects(allProjects);
console.log(`\n⭐ 收藏项目: ${favorites.length} 个`);
favorites.forEach(project => {
  console.log(`  - ${project.name}`);
});

// 获取最近项目
const recent = projectClassifier.getRecentProjects(allProjects, 3);
console.log(`\n🕐 最近项目:`);
recent.forEach(project => {
  console.log(`  - ${project.name} (最后打开: ${new Date(project.lastOpened).toLocaleDateString('zh-CN')})`);
});

// 4. 演示项目统计
console.log('\n📈 项目统计信息:');
const stats = projectClassifier.getProjectStats(allProjects);
console.log(`  总项目数: ${stats.total}`);
console.log(`  收藏项目: ${stats.favorites}`);
console.log(`  总资源数: ${stats.totalResources.images} 图片, ${stats.totalResources.audio} 音频, ${stats.totalResources.models3D} 3D模型`);

console.log('\n🏷️  所有标签:');
stats.allTags.forEach(tag => {
  console.log(`  - ${tag}`);
});

// 5. 演示搜索功能
console.log('\n🔎 搜索演示:');
const searchResults = projectClassifier.searchProjects(allProjects, '益智');
console.log(`搜索"益智"的结果 (${searchResults.length} 个):`);
searchResults.forEach(project => {
  console.log(`  - ${project.name}: ${project.description}`);
});

// 6. 演示标签建议
console.log('\n💡 标签建议演示:');
const currentProject = allProjects[0]; // 第一个项目
const suggestions = projectClassifier.suggestTags(allProjects, currentProject);
console.log(`为项目"${currentProject.name}"建议的标签:`);
suggestions.forEach(tag => {
  console.log(`  - ${tag}`);
});

console.log('\n✅ 演示完成！');
console.log('=====================================');

// 清理演示数据
metadataStorage.clearAll();
console.log('🧹 已清理演示数据');