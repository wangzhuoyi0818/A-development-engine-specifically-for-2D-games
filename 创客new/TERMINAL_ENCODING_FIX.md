# 终端乱码问题解决方案

## 问题
PowerShell 终端显示中文时出现乱码，如：`Ҳ·E:\创客new`

## 快速解决方案

### 方法 1: 使用提供的脚本（推荐）

**PowerShell:**
```powershell
.\fix-encoding.ps1
```

**或者直接运行测试:**
```powershell
.\run-test.ps1
```

**CMD/Batch:**
```cmd
run-test.bat
```

### 方法 2: 手动设置编码

在 PowerShell 中运行：
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```

### 方法 3: 永久设置（推荐）

1. **打开 PowerShell 配置文件:**
```powershell
notepad $PROFILE
```

2. **如果文件不存在，创建它:**
```powershell
New-Item -Path $PROFILE -Type File -Force
notepad $PROFILE
```

3. **添加以下内容到配置文件:**
```powershell
# 设置 UTF-8 编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
```

4. **保存并重新启动 PowerShell**

### 方法 4: 使用 Windows Terminal（最佳方案）

1. 安装 Windows Terminal（如果还没有）
2. 打开 Windows Terminal 设置
3. 在 PowerShell 配置文件中添加：
```json
{
  "defaults": {
    "fontFace": "Consolas",
    "fontSize": 12
  },
  "profiles": {
    "defaults": {
      "font": {
        "face": "Consolas"
      }
    }
  }
}
```

## 验证编码设置

运行以下命令验证编码是否正确：
```powershell
Write-Host "测试中文: 你好，世界！"
[Console]::OutputEncoding.EncodingName
```

应该显示：
- 中文正常显示
- 编码名称包含 "UTF-8"

## 如果仍然有问题

1. **检查系统区域设置:**
   - 控制面板 > 区域 > 管理 > 更改系统区域设置
   - 确保选择了正确的区域

2. **使用 CMD 代替 PowerShell:**
   ```cmd
   chcp 65001
   node test-anthropic-api.js
   ```

3. **使用 Git Bash 或 WSL:**
   - Git Bash 通常默认支持 UTF-8
   - WSL (Windows Subsystem for Linux) 也支持 UTF-8

## 运行测试脚本

设置好编码后，运行：
```powershell
node test-anthropic-api.js
```

或使用提供的包装脚本：
```powershell
.\run-test.ps1
```
