# 🚀 AutoDL 云服务器部署指南

## 📋 AutoDL 特点

- ✅ 已预装 Ubuntu 系统
- ✅ 支持 SSH 和 JupyterLab 访问
- ✅ 有公网端口映射
- ✅ 预装 Python 和常用开发工具

---

## 🎯 超简单部署方案（推荐）

### 方法1️⃣：使用 serve（最快，5分钟搞定）

#### 1. 上传文件到 AutoDL

**方式A - 使用 JupyterLab 上传：**
1. 打开你的 AutoDL 实例的 JupyterLab
2. 点击左上角"上传"按钮
3. 选择本地 `dist` 文件夹内的所有文件
4. 上传到 `/root/miniprogram` 目录

**方式B - 使用 SSH 上传：**
```bash
# 在本地Windows PowerShell或Git Bash中执行
cd "E:\最新\最终融合版_20260127\创客new\创客"

# 压缩dist目录
tar -czf dist.tar.gz dist

# 上传（替换SSH地址和端口）
scp -P [AutoDL端口] dist.tar.gz root@[AutoDL服务器地址]:/root/
```

#### 2. 在 AutoDL 终端运行

打开 JupyterLab 终端，或 SSH 连接后执行：

```bash
# 安装 Node.js（如果未安装）
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 解压文件（如果是上传的压缩包）
cd /root
tar -xzf dist.tar.gz
mv dist miniprogram

# 安装 serve 和 pm2
npm install -g serve pm2

# 启动服务（使用 6006 端口，AutoDL 常用端口）
cd /root/miniprogram
pm2 serve . 6006 --spa --name miniprogram

# 保存进程，设置开机自启
pm2 save
pm2 startup
```

#### 3. 配置 AutoDL 端口映射

1. 登录 AutoDL 控制台
2. 找到你的实例
3. 点击"自定义服务" or "端口映射"
4. 添加端口映射：
   - 容器端口：6006
   - 协议：HTTP
5. 获取映射后的公网地址

#### 4. 访问

```
http://你的AutoDL公网地址:映射端口
```

例如：`http://region-x.autodl.com:12345`

---

## 🔄 方法2️⃣：使用 Nginx（适合需要自定义域名）

### 1. 安装 Nginx

```bash
apt update
apt install -y nginx
```

### 2. 创建项目目录并上传文件

```bash
mkdir -p /var/www/miniprogram
# 然后上传 dist 目录内容到 /var/www/miniprogram
```

### 3. 配置 Nginx

```bash
cat > /etc/nginx/sites-available/miniprogram <<'EOF'
server {
    listen 6006;
    server_name _;

    root /var/www/miniprogram;
    index index.html;

    # 启用gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/miniprogram /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx
```

### 4. 在 AutoDL 控制台映射 6006 端口

---

## 📱 方法3️⃣：使用 Python SimpleHTTPServer（临时测试）

最简单的方式，适合快速测试：

```bash
cd /root/miniprogram
python3 -m http.server 6006
```

> ⚠️ 注意：这个方法适合临时测试，不建议长期使用，因为没有进程守护。

---

## 🎨 AutoDL 一键部署脚本

创建并运行这个脚本：

```bash
cat > /root/autodl_deploy.sh <<'EOF'
#!/bin/bash
set -e

echo "🚀 AutoDL 一键部署脚本"
echo "=============================="

# 1. 安装 Node.js
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# 2. 安装依赖
echo "📦 安装 serve 和 pm2..."
npm install -g serve pm2

# 3. 创建目录
mkdir -p /root/miniprogram

# 4. 提示上传文件
echo ""
echo "📁 请上传 dist 目录内容到 /root/miniprogram"
echo "   可以使用 JupyterLab 上传功能"
echo ""
read -p "文件已上传？按回车继续..." dummy

# 5. 启动服务
cd /root/miniprogram
echo "🚀 启动服务..."
pm2 delete miniprogram 2>/dev/null || true
pm2 serve . 6006 --spa --name miniprogram
pm2 save
pm2 startup

# 6. 显示访问信息
echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 接下来操作："
echo "1. 在 AutoDL 控制台配置端口映射："
echo "   容器端口: 6006"
echo "   协议: HTTP"
echo ""
echo "2. 访问你的网站："
echo "   http://[AutoDL公网地址]:[映射端口]"
echo ""
echo "💡 管理命令："
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs miniprogram"
echo "   重启服务: pm2 restart miniprogram"
echo "   停止服务: pm2 stop miniprogram"
echo ""
EOF

chmod +x /root/autodl_deploy.sh
/root/autodl_deploy.sh
```

---

## 🔧 AutoDL 端口映射配置

### 1. 登录 AutoDL 控制台
访问：https://www.autodl.com/console/instance/list

### 2. 找到你的实例，点击"自定义服务"

### 3. 添加端口映射
- **容器端口**：6006
- **协议**：HTTP
- 点击"确定"

### 4. 获取访问地址
会生成类似这样的地址：
```
http://region-41.autodl.pro:12345
```

### 5. 访问测试
在浏览器输入生成的地址即可访问你的项目！

---

## 📊 文件上传详细步骤

### 使用 JupyterLab 上传：

1. **打开 JupyterLab**
   - 在 AutoDL 控制台点击"打开 JupyterLab"

2. **创建目录**
   - 在左侧文件浏览器右键 → 新建文件夹 → 命名为 `miniprogram`

3. **进入目录**
   - 双击打开 `miniprogram` 文件夹

4. **批量上传**
   - 点击工具栏的"⬆️上传文件"按钮
   - 选择本地 `E:\最新\最终融合版_20260127\创客new\创客\dist` 目录下的所有文件
   - 开始上传（可能需要一些时间）

5. **验证文件**
   - 确保 `index.html` 和 `assets` 文件夹都已上传

---

## 🐛 常见问题

### 1. 端口被占用
```bash
# 查看占用端口的进程
lsof -i :6006

# 更换端口（例如改成 7007）
pm2 delete miniprogram
pm2 serve . 7007 --spa --name miniprogram
pm2 save
```

### 2. 访问404或白屏
```bash
# 检查文件是否在正确位置
ls -la /root/miniprogram/index.html

# 查看 pm2 日志
pm2 logs miniprogram

# 重启服务
pm2 restart miniprogram
```

### 3. 文件上传慢
```bash
# 使用压缩包方式
# 在本地压缩
tar -czf dist.tar.gz -C dist .

# 上传压缩包（只需上传一个文件）
# 使用 JupyterLab 上传 dist.tar.gz

# 在服务器解压
cd /root/miniprogram
tar -xzf ../dist.tar.gz
```

### 4. AutoDL 实例重启后服务停止
```bash
# pm2 保存配置后会自动恢复，但如果没有，手动启动：
pm2 resurrect
# 或
pm2 start all
```

---

## 🎯 快速操作清单

**第一次部署：**
```bash
# 1. SSH 连接 AutoDL
ssh -p [端口] root@[地址]

# 2. 运行一键脚本
curl -o /root/autodl_deploy.sh https://你的链接/autodl_deploy.sh
bash /root/autodl_deploy.sh

# 3. 上传文件到 /root/miniprogram

# 4. 在 AutoDL 控制台映射 6006 端口

# 5. 访问公网地址
```

**更新部署：**
```bash
# 1. 重新上传 dist 文件覆盖 /root/miniprogram

# 2. 重启服务
pm2 restart miniprogram
```

---

## 💡 AutoDL 优势

- ✅ 免费算力时长（新用户赠送）
- ✅ 按量计费，用多少付多少
- ✅ JupyterLab 方便文件管理
- ✅ 支持自定义镜像保存配置
- ✅ 提供公网访问端口映射

---

## 🆘 需要帮助？

如果遇到问题：

1. **查看服务状态**
   ```bash
   pm2 status
   pm2 logs miniprogram --lines 50
   ```

2. **检查端口**
   ```bash
   netstat -tlnp | grep 6006
   ```

3. **查看 AutoDL 控制台日志**
   在控制台查看实例的系统日志

4. **重新部署**
   ```bash
   pm2 delete miniprogram
   cd /root/miniprogram
   pm2 serve . 6006 --spa --name miniprogram
   pm2 save
   ```

---

## 🎉 完成！

现在你的游戏创作平台已经在 AutoDL 上运行了！

**访问地址：** `http://[你的AutoDL地址]:[映射端口]`

可以分享给朋友，在任何设备上访问！📱💻
