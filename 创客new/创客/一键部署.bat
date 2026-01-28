@echo off
echo ========================================
echo AutoDL 自动部署脚本
echo ========================================
echo.

set SERVER=connect.bjb1.seetacloud.com
set PORT=55567
set USER=root
set PASSWORD=RYzudn9KCm27

echo 正在上传文件...
cd /d "%~dp0"

REM 使用 pscp 上传（需要安装 PuTTY）
where pscp >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo | pscp -P %PORT% -pw %PASSWORD% dist.tar.gz %USER%@%SERVER%:/root/
    if %ERRORLEVEL% EQU 0 (
        echo ✅ 文件上传成功！
        echo.
        echo 正在执行部署命令...

        REM 执行部署命令
        echo | plink -P %PORT% -pw %PASSWORD% %USER%@%SERVER% "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs && npm install -g serve pm2 && mkdir -p /root/miniprogram && cd /root/miniprogram && tar -xzf /root/dist.tar.gz && pm2 delete miniprogram 2>/dev/null || true && pm2 serve /root/miniprogram 6006 --spa --name miniprogram && pm2 save && pm2 startup && echo '✅ 部署完成！' && pm2 status"

        echo.
        echo ========================================
        echo ✅ 部署完成！
        echo ========================================
        echo.
        echo 访问地址：
        echo https://u812392-b4f4-d1b0eded.bjb1.seetacloud.com:8443
        echo.
    ) else (
        echo ❌ 上传失败
    )
) else (
    echo ❌ 未安装 PuTTY 工具
    echo 请使用 JupyterLab 上传方式
    echo.
    echo 或者安装 PuTTY: https://www.putty.org/
)

pause
