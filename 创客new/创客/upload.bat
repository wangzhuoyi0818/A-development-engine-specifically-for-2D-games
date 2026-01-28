@echo off
REM Windows批处理脚本 - 上传到云服务器
REM 使用前请先安装 WinSCP 或使用以下方式上传

echo ========================================
echo 云服务器部署 - 文件上传脚本
echo ========================================
echo.

REM 设置服务器信息（请修改以下变量）
set SERVER_IP=YOUR_SERVER_IP
set SERVER_USER=root
set SERVER_PATH=/var/www/miniprogram

echo 📦 准备上传文件...
echo 服务器IP: %SERVER_IP%
echo 用户名: %SERVER_USER%
echo 目标路径: %SERVER_PATH%
echo.

echo ========================================
echo 上传方式选择
echo ========================================
echo 1. 使用 WinSCP（推荐）
echo 2. 使用 PSCP（需要安装PuTTY）
echo 3. 手动上传说明
echo ========================================
echo.

choice /C 123 /M "请选择上传方式"

if errorlevel 3 goto MANUAL
if errorlevel 2 goto PSCP
if errorlevel 1 goto WINSCP

:WINSCP
echo.
echo 📥 使用 WinSCP 上传
echo.
echo 请按以下步骤操作：
echo 1. 打开 WinSCP（如未安装请从 https://winscp.net 下载）
echo 2. 新建站点连接：
echo    - 文件协议: SFTP
echo    - 主机名: %SERVER_IP%
echo    - 用户名: %SERVER_USER%
echo    - 密码: [你的服务器密码]
echo 3. 连接后，右侧导航到 %SERVER_PATH%
echo 4. 左侧选择本地 dist 文件夹
echo 5. 将 dist 文件夹内的所有文件拖拽到右侧
echo.
start "" "https://winscp.net/eng/download.php"
pause
exit

:PSCP
echo.
echo 📤 使用 PSCP 上传
echo.
REM 检查是否安装了 pscp
where pscp >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 未检测到 PSCP
    echo 请先安装 PuTTY: https://www.putty.org/
    pause
    exit
)

echo 正在上传文件...
cd /d "%~dp0"
pscp -r dist\* %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 上传完成！
    echo 访问你的网站: http://%SERVER_IP%
) else (
    echo.
    echo ❌ 上传失败，请检查：
    echo - 服务器IP和用户名是否正确
    echo - 网络连接是否正常
    echo - SSH服务是否开启
)
pause
exit

:MANUAL
echo.
echo ========================================
echo 手动上传步骤
echo ========================================
echo.
echo 方案1: 使用 FileZilla
echo ----------------
echo 1. 下载 FileZilla: https://filezilla-project.org/
echo 2. 打开 FileZilla
echo 3. 快速连接：
echo    主机: sftp://%SERVER_IP%
echo    用户名: %SERVER_USER%
echo    密码: [你的密码]
echo    端口: 22
echo 4. 将 dist 目录内容上传到 %SERVER_PATH%
echo.
echo 方案2: 使用 SCP 命令（需要先安装 Git Bash 或 WSL）
echo ----------------
echo scp -r dist/* %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
echo.
echo 方案3: 使用云服务商的文件管理功能
echo ----------------
echo - 阿里云: 云助手
echo - 腾讯云: 文件传输
echo - 华为云: CloudShell
echo.
pause
exit

REM 如果你有配置好SSH密钥，可以使用以下脚本（需要Git Bash或WSL）
REM scp -r dist/* %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
