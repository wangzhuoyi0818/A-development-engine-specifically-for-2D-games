#!/bin/bash
# AutoDL 一键部署脚本
# 使用方法：在 AutoDL 终端运行 bash autodl_deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   🎮 AutoDL 游戏创作平台部署脚本      ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用 root 用户运行此脚本${NC}"
    echo "切换到 root: sudo su"
    exit 1
fi

# 1. 检查并安装 Node.js
echo -e "${YELLOW}📦 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "正在安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
    apt install -y nodejs
    echo -e "${GREEN}✓ Node.js 安装完成${NC}"
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js 已安装 ($NODE_VERSION)${NC}"
fi

# 2. 安装 serve 和 pm2
echo -e "${YELLOW}📦 安装部署工具...${NC}"
npm install -g serve pm2 --silent 2>/dev/null
echo -e "${GREEN}✓ 部署工具安装完成${NC}"

# 3. 创建项目目录
echo -e "${YELLOW}📁 创建项目目录...${NC}"
mkdir -p /root/miniprogram
cd /root/miniprogram
echo -e "${GREEN}✓ 目录创建完成: /root/miniprogram${NC}"

# 4. 检查文件
echo ""
echo -e "${YELLOW}📂 请上传项目文件到 /root/miniprogram${NC}"
echo ""
echo "上传方式1: 使用 JupyterLab"
echo "  1. 打开 AutoDL 的 JupyterLab"
echo "  2. 导航到 /root/miniprogram 目录"
echo "  3. 点击上传按钮，上传 dist 目录内的所有文件"
echo ""
echo "上传方式2: 使用 SCP 命令"
echo "  scp -P [AutoDL端口] -r dist/* root@[AutoDL地址]:/root/miniprogram/"
echo ""
read -p "文件已上传完成？(y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}请先上传文件，然后重新运行此脚本${NC}"
    exit 1
fi

# 验证文件
if [ ! -f "/root/miniprogram/index.html" ]; then
    echo -e "${RED}❌ 未找到 index.html，请确保文件已正确上传${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 文件验证通过${NC}"

# 5. 选择端口
echo ""
echo -e "${YELLOW}⚙️  配置服务端口${NC}"
echo "AutoDL 常用端口: 6006, 7007, 8008, 9009"
read -p "请输入端口号 [默认: 6006]: " PORT
PORT=${PORT:-6006}

# 检查端口是否被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口 $PORT 已被占用${NC}"
    read -p "是否停止占用该端口的服务？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓ 已释放端口 $PORT${NC}"
    else
        echo -e "${RED}请选择其他端口，然后重新运行脚本${NC}"
        exit 1
    fi
fi

# 6. 启动服务
echo ""
echo -e "${YELLOW}🚀 启动服务...${NC}"

# 删除旧的 pm2 进程
pm2 delete miniprogram 2>/dev/null || true

# 启动新服务
cd /root/miniprogram
pm2 serve . $PORT --spa --name miniprogram

# 保存 pm2 配置
pm2 save

# 设置开机自启
pm2 startup > /dev/null 2>&1

echo -e "${GREEN}✓ 服务启动成功！${NC}"

# 7. 显示部署信息
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          ✅ 部署完成！                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 接下来的操作：${NC}"
echo ""
echo "1️⃣  配置 AutoDL 端口映射："
echo "   - 登录 AutoDL 控制台"
echo "   - 点击实例的【自定义服务】"
echo "   - 添加端口映射："
echo -e "     容器端口: ${GREEN}$PORT${NC}"
echo "     协议: HTTP"
echo ""
echo "2️⃣  访问你的网站："
echo -e "   ${GREEN}http://[AutoDL公网地址]:[映射端口]${NC}"
echo ""
echo -e "${YELLOW}💡 管理命令：${NC}"
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs miniprogram"
echo "   重启服务: pm2 restart miniprogram"
echo "   停止服务: pm2 stop miniprogram"
echo ""
echo -e "${YELLOW}📱 移动端访问：${NC}"
echo "   在手机浏览器输入上述地址即可访问"
echo "   虚拟摇杆支持触摸控制"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# 显示服务状态
pm2 status
