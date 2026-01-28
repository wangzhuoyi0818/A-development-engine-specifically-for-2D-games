#!/usr/bin/env node

/**
 * AI游戏生成器 - 命令行工具
 *
 * 使用方法:
 *   npx tsx src/cli.ts "创建一个点击游戏"
 *   npm run cli "创建一个点击游戏"
 */

import { AIGameGenerator } from './ai-generator';
import { validatePrompt, formatProjectInfo } from './utils';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🎮 AI游戏生成器 CLI\n');

  // 获取命令行参数
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  npm run cli "游戏描述"');
    console.log('\n示例:');
    console.log('  npm run cli "创建一个点击收集星星的游戏，60秒倒计时"');
    console.log('  npm run cli "做一个跑酷游戏，角色跳跃躲避障碍"');
    process.exit(1);
  }

  const prompt = args.join(' ');

  // 验证提示词
  console.log('📝 验证游戏描述...');
  const validation = validatePrompt(prompt);

  if (!validation.valid) {
    console.error('\n❌ 描述验证失败:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  if (validation.suggestions.length > 0) {
    console.log('\n💡 建议:');
    validation.suggestions.forEach(sug => console.log(`  - ${sug}`));
  }

  // 获取API密钥
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('\n❌ 错误: 未找到OPENAI_API_KEY环境变量');
    console.log('\n请设置环境变量:');
    console.log('  export OPENAI_API_KEY=your-api-key');
    console.log('或在 .env 文件中配置');
    process.exit(1);
  }

  try {
    // 创建生成器
    const generator = new AIGameGenerator(apiKey);

    console.log('\n' + '='.repeat(60));
    console.log('开始生成游戏项目...');
    console.log('='.repeat(60) + '\n');

    // 生成项目
    const project = await generator.generateFromPrompt(prompt);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 生成成功！');
    console.log('='.repeat(60) + '\n');

    // 显示项目信息
    console.log(formatProjectInfo(project));

    // 保存到文件
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `project-${timestamp}.json`);

    fs.writeFileSync(outputFile, JSON.stringify(project, null, 2), 'utf-8');
    console.log(`\n💾 项目已保存到: ${outputFile}`);

    // 获取使用统计
    const usage = await generator.getUsage();
    console.log('\n📊 Token使用:');
    console.log(`  总计: ${usage.totalTokens} tokens`);
    console.log(`  预估成本: $${usage.estimatedCost.toFixed(4)}`);

    console.log('\n🎉 完成！');

  } catch (error: any) {
    console.error('\n❌ 生成失败:', error.message);
    if (error.stack) {
      console.error('\n堆栈跟踪:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 运行
main().catch(error => {
  console.error('发生未预期的错误:', error);
  process.exit(1);
});
