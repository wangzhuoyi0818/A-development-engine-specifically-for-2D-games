# 快速修复指南

## 问题
Token 认证失败：`用户信息验证失败`

## 立即解决

### 1. 获取新 Token
访问 https://code.newcli.com 获取新的 API Token

### 2. 更新配置

创建 `.env` 文件（如果不存在）：

```env
ANTHROPIC_AUTH_TOKEN=你的新Token
ANTHROPIC_BASE_URL=https://code.newcli.com/claude/super
```

### 3. 验证
```bash
node test-api-comprehensive.js
```

## 原因
当前 Token 已过期或无效，需要从服务提供商获取新 Token。
