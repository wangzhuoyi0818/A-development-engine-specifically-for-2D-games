# AI游戏生成器 - 实现代码

这是微信小程序可视化开发平台的第16个模块：AI游戏生成器。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置你的OpenAI API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. 运行示例

```bash
npm run dev
```

## 📦 使用方法

### 基础使用

```typescript
import { AIGameGenerator } from '@miniprogram-platform/ai-game-generator';

// 创建生成器
const generator = new AIGameGenerator('your-api-key');

// 描述你想要的游戏
const project = await generator.generateFromPrompt(`
  创建一个点击收集星星的游戏，
  60秒倒计时，点击得分
`);

console.log('生成的项目:', project);
```

### 获取优化建议

```typescript
const suggestions = await generator.optimizeProject(project);
suggestions.forEach(s => {
  console.log(`[${s.type}] ${s.description}`);
});
```

## 🏗️ 项目结构

```
src/
├── index.ts                 # 主入口
├── types/                   # TypeScript类型定义
│   └── index.ts
├── services/                # AI服务
│   └── ai-service.ts
├── templates/               # 游戏模板
│   ├── index.ts
│   └── click-game.ts
├── ai-generator.ts          # 主生成器
├── prompt-parser.ts         # 提示词解析器
├── template-engine.ts       # 模板引擎
└── project-generator.ts     # 项目生成器
```

## 🧪 运行测试

```bash
# 运行测试
npm test

# 运行测试并查看UI
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

**注意**: 测试需要真实的OpenAI API密钥。在CI环境中应该mock AI服务。

## 📝 支持的游戏类型

当前版本（MVP）支持：

- ✅ **点击类游戏** - 点击收集物品，计分计时

计划支持：

- 🔜 跑酷类游戏
- 🔜 答题类游戏
- 🔜 拼图类游戏

## 🔧 开发

### 构建

```bash
npm run build
```

构建输出在 `dist/` 目录。

### 添加新模板

1. 在 `src/templates/` 创建新模板文件
2. 在 `src/templates/index.ts` 中导出
3. 在 `template-engine.ts` 中注册

示例：

```typescript
// src/templates/my-game.ts
export const myGameTemplate: GameTemplate = {
  id: 'my-game',
  name: '我的游戏',
  gameType: 'custom',
  // ... 其他配置
};
```

## ⚠️ 注意事项

### API密钥安全

- **不要**将API密钥提交到Git仓库
- 使用环境变量存储敏感信息
- 生产环境应使用后端代理调用AI服务

### 成本控制

- 每次生成大约消耗 1000-2000 tokens
- GPT-4成本约 $0.03-0.06 每次生成
- 考虑使用GPT-3.5以降低成本

### 生成质量

当前为MVP版本，生成质量依赖：

- 提示词的清晰度
- AI模型的理解能力
- 模板的完整性

## 📚 更多文档

- [核心接口定义](../INTERFACES.md)
- [实现指南](../MIGRATION_GUIDE.md)
- [模块README](../README.md)

## 🐛 问题反馈

如遇到问题，请检查：

1. API密钥是否正确配置
2. 网络连接是否正常
3. 提示词是否足够清晰

## 📄 许可证

MIT
