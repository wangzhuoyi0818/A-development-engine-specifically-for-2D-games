# Anthropic API 401 错误解决方案

## 问题描述
遇到 401 错误：`{"error":{"code":"","message":"该令牌状态不可用 (request id: 20260125165751263886432c3i15nb4)","type":"new_api_error"}}`

## 可能的原因

1. **Token 已过期或无效**
   - Token 可能已经过期
   - Token 可能已被撤销
   - Token 格式不正确

2. **Base URL 配置问题**
   - Base URL 可能不正确
   - 服务端点可能已更改

3. **认证头格式问题**
   - Authorization 头格式可能不正确
   - 可能需要使用不同的认证方式

## 解决方案

### 方案 1: 检查并更新 Token

1. **验证 Token 是否有效**
   - 访问 `https://code.newcli.com` 检查服务状态
   - 确认 Token 是否仍在有效期内
   - 联系服务提供商获取新的 Token

2. **检查 Token 格式**
   - 确保 Token 完整，没有多余的空格或换行符
   - 确认 Token 以 `sk-ant-` 开头

### 方案 2: 检查 Base URL

当前配置的 Base URL: `https://code.newcli.com/claude/super`

1. **验证端点是否正确**
   - 确认服务端点路径是否正确
   - 可能需要使用不同的路径（如 `/claude/v1` 或 `/api/v1`）

2. **测试连接**
   ```bash
   curl -X GET "https://code.newcli.com/claude/super/v1/models" \
     -H "Authorization: Bearer sk-ant-oat01-p_J91U6B3zyXFyVyH9-xF9g4JKimb4mIHZr_UF4mqrGDdWvLj6OXnwyFIcYWiu2XjuFYDkv2jdxvz646ViqaaA-eeC9CwAA"
   ```

### 方案 3: 配置环境变量

如果这些环境变量需要在项目中使用，请创建 `.env` 文件：

**在项目根目录创建 `.env` 文件：**

```env
# Anthropic API 配置
ANTHROPIC_AUTH_TOKEN=sk-ant-oat01-p_J91U6B3zyXFyVyH9-xF9g4JKimb4mIHZr_UF4mqrGDdWvLj6OXnwyFIcYWiu2XjuFYDkv2jdxvz646ViqaaA-eeC9CwAA
ANTHROPIC_BASE_URL=https://code.newcli.com/claude/super
```

**注意：** 如果这是 Vite 项目，环境变量需要以 `VITE_` 开头才能在客户端使用：

```env
VITE_ANTHROPIC_AUTH_TOKEN=sk-ant-oat01-p_J91U6B3zyXFyVyH9-xF9g4JKimb4mIHZr_UF4mqrGDdWvLj6OXnwyFIcYWiu2XjuFYDkv2jdxvz646ViqaaA-eeC9CwAA
VITE_ANTHROPIC_BASE_URL=https://code.newcli.com/claude/super
```

### 方案 4: 检查 Cursor MCP 配置

如果这些环境变量是用于 Cursor 的 MCP 服务器：

1. **检查 Cursor 设置**
   - 打开 Cursor 设置
   - 查找 MCP 或 Anthropic 相关配置
   - 确认环境变量是否正确设置

2. **检查系统环境变量**
   - Windows: 在系统属性 > 环境变量中检查
   - 确保变量名和值都正确

### 方案 5: 使用正确的认证头格式

某些 Anthropic API 代理可能需要不同的认证格式：

1. **尝试使用 `x-api-key` 头**
   ```javascript
   headers: {
     'x-api-key': 'your-token-here'
   }
   ```

2. **尝试使用 `Authorization` 头（当前方式）**
   ```javascript
   headers: {
     'Authorization': 'Bearer your-token-here'
   }
   ```

3. **尝试使用 `anthropic-api-key` 头**
   ```javascript
   headers: {
     'anthropic-api-key': 'your-token-here'
   }
   ```

## 调试步骤

1. **检查网络请求**
   - 打开浏览器开发者工具
   - 查看 Network 标签
   - 找到失败的请求
   - 检查请求头和响应

2. **验证 Token**
   - 使用 curl 或 Postman 测试 API
   - 确认 Token 是否有效

3. **检查服务状态**
   - 访问服务提供商的网站
   - 查看是否有服务公告或状态更新

## 联系支持

如果以上方案都无法解决问题：

1. 联系 `code.newcli.com` 的服务支持
2. 提供错误信息：`request id: 20260125165751263886432c3i15nb4`
3. 询问 Token 状态和有效期

## 临时解决方案

如果需要临时继续工作，可以：

1. 使用官方的 Anthropic API（如果可用）
2. 使用其他 AI 服务提供商
3. 等待 Token 问题解决后再继续
