#!/bin/bash
# 自动部署脚本 - 在服务器上运行

set -e  # 遇到错误立即停止

echo "🚀 开始部署小程序可视化平台..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 创建部署目录
echo -e "${YELLOW}📁 创建部署目录...${NC}"
sudo mkdir -p /var/www/miniprogram
sudo chown -R $USER:$USER /var/www/miniprogram

# 2. 安装Nginx（如果未安装）
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📦 安装Nginx...${NC}"
    if [ -f /etc/debian_version ]; then
        sudo apt update
        sudo apt install -y nginx
    elif [ -f /etc/redhat-release ]; then
        sudo yum install -y nginx
    fi
else
    echo -e "${GREEN}✓ Nginx已安装${NC}"
fi

# 3. 创建Nginx配置
echo -e "${YELLOW}⚙️  配置Nginx...${NC}"
sudo tee /etc/nginx/sites-available/miniprogram > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/miniprogram;
    index index.html;

    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# 4. 启用站点
if [ -d /etc/nginx/sites-enabled ]; then
    sudo ln -sf /etc/nginx/sites-available/miniprogram /etc/nginx/sites-enabled/
fi

# 5. 测试Nginx配置
echo -e "${YELLOW}🔍 测试Nginx配置...${NC}"
sudo nginx -t

# 6. 配置防火墙
echo -e "${YELLOW}🔥 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
fi

# 7. 启动Nginx
echo -e "${YELLOW}🚀 启动Nginx...${NC}"
sudo systemctl restart nginx
sudo systemctl enable nginx

# 8. 获取服务器IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}✅ 部署环境准备完成！${NC}"
echo ""
echo "📋 下一步操作："
echo "1. 将本地构建的 dist 目录上传到服务器"
echo "   命令: scp -r dist/* root@$SERVER_IP:/var/www/miniprogram/"
echo ""
echo "2. 访问你的网站："
echo -e "   ${GREEN}http://$SERVER_IP${NC}"
echo ""
echo "🔒 配置HTTPS（推荐）："
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
