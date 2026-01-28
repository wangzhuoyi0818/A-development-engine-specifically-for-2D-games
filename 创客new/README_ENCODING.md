# 终端编码问题解决方案

## 问题
PowerShell 显示中文乱码

## 快速解决

### 方法 1: 运行修复脚本
```powershell
.\fix-encoding.ps1
```

### 方法 2: 使用批处理文件（推荐，避免编码问题）
```cmd
run-test.bat
```

### 方法 3: 手动设置
在 PowerShell 中执行：
```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

## 运行 API 测试

设置编码后运行：
```powershell
node test-anthropic-api.js
```

或直接使用：
```cmd
run-test.bat
```

## 永久解决方案

编辑 PowerShell 配置文件 `$PROFILE`，添加：
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
```
