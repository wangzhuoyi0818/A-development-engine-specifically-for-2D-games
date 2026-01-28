# 解决方案总结

## 已解决的问题

### 1. 终端乱码问题 ✅

**问题**: PowerShell 显示中文时出现乱码

**解决方案**:
- 将所有脚本输出改为英文，避免编码问题
- 创建了编码修复脚本 `fix-encoding.ps1`
- 创建了批处理文件 `run-test.bat`（推荐使用，避免编码问题）

**使用方法**:
```cmd
run-test.bat
```

或手动设置编码:
```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### 2. Anthropic API 401 错误诊断

**问题**: `{"error":{"code":"","message":"该令牌状态不可用"}}`

**已创建的工具**:
- `test-anthropic-api.js` - API 连接测试脚本
- `ANTHROPIC_API_FIX.md` - 详细的解决方案文档

**可能的原因**:
1. Token 已过期或无效
2. Base URL 配置不正确
3. 服务端点已更改

**下一步**:
1. 运行测试脚本: `node test-anthropic-api.js` 或 `run-test.bat`
2. 检查 Token 是否有效
3. 联系服务提供商获取新的 Token

## 文件说明

### 脚本文件
- `test-anthropic-api.js` - API 测试脚本（英文输出，避免编码问题）
- `run-test.bat` - 批处理文件，自动设置编码并运行测试
- `run-test.ps1` - PowerShell 脚本，设置编码并运行测试
- `fix-encoding.ps1` - 编码修复脚本

### 文档文件
- `ANTHROPIC_API_FIX.md` - API 401 错误详细解决方案
- `TERMINAL_ENCODING_FIX.md` - 终端编码问题解决方案
- `README_ENCODING.md` - 快速参考指南

## 快速开始

### 运行 API 测试（推荐方式）
```cmd
run-test.bat
```

### 手动运行
```powershell
# 设置编码
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 运行测试
node test-anthropic-api.js
```

## 注意事项

1. **编码问题**: 如果仍然看到乱码，使用 `run-test.bat` 而不是 PowerShell
2. **Token 问题**: 401 错误通常表示 Token 无效，需要联系服务提供商
3. **网络问题**: 确保可以访问 `https://code.newcli.com`

## 需要帮助？

如果问题仍然存在：
1. 检查 `ANTHROPIC_API_FIX.md` 获取详细解决方案
2. 运行测试脚本查看具体错误信息
3. 联系服务提供商获取支持
