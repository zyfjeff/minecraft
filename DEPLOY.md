# CraftWords — 阿里云 ECS（Ubuntu）部署手册

本项目是 **纯静态前端**（Vite 5 + React 18 + PWA）+ **Supabase 后端**（认证/
数据库/RLS）。前端 `npm run build` 产物 `dist/` 直接由 Nginx 托管，无 Node
进程常驻。Supabase 可二选一：

- **A. Supabase Cloud**（推荐）：零运维，ECS 只跑 Nginx
- **B. ECS 同机自建 Supabase**：用 docker compose，需要 4G+ 内存

下文以 **Ubuntu 22.04 LTS + Cloud Supabase** 为主线，自建 Supabase 写在第八节。

---

## 一、ECS 与域名准备

### 1. 购买 ECS

| 项 | 推荐值 | 说明 |
|---|---|---|
| 镜像 | Ubuntu 22.04 64 位 | 24.04 同样可用 |
| 规格 | 2 vCPU / 2G | 仅前端；自建 Supabase 至少 2C4G |
| 系统盘 | ESSD 40G | |
| 带宽 | 按量 3M / 包月 1M+ | PWA 首次加载约 900KB |
| 安全组 | 入方向 22 / 80 / 443 | 22 建议限制源 IP |

记下 **公网 IP**，后续解析用。

### 2. 域名解析

阿里云 → 云解析 DNS → 添加 A 记录：

```
@        A    <ECS 公网 IP>
www      A    <ECS 公网 IP>
```

DNS 生效（`dig +short your-domain.com` 返回 ECS IP）后再做 HTTPS。

### 3. 首次登录 ECS

```bash
ssh root@<ECS 公网 IP>
```

建议立即创建非 root 用户：

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
# 测试免密登录后再禁用 root：
sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl reload ssh
```

后续步骤都以 `deploy` 用户执行，需提权时加 `sudo`。

---

## 二、安装基础软件

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx ufw

# Node.js 20 LTS（NodeSource 官方源）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
npm -v

# 防火墙：放开 SSH + HTTP + HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

> ⚠️ 阿里云**安全组**和 ECS 内部 `ufw` 是两层独立防火墙，两边都要放行 80/443。

---

## 三、拉取代码并构建

```bash
sudo mkdir -p /var/www && sudo chown deploy:deploy /var/www
cd /var/www
git clone <your-git-repo-url> craftwords
cd craftwords
```

> 国内 ECS 拉 GitHub 可能慢，可改 `git config --global http.https://github.com.proxy ...`
> 或用 Gitee 镜像。npm 也建议换源：`npm config set registry https://registry.npmmirror.com`

填写环境变量（**这些值会在 build 时打进 JS bundle**，不是运行时读）：

```bash
cp .env.local.example .env.local
nano .env.local
```

填入 Supabase 的：

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...（anon public key）
```

构建：

```bash
npm ci                  # 严格按 package-lock 安装
npm run test            # 跑 72 个 vitest 用例（可选但建议）
npm run build           # 输出 dist/
ls dist/                # 应有 index.html + assets/ + sw.js + manifest.webmanifest
```

---

## 四、Nginx 站点配置

### 1. 写站点 conf

```bash
sudo nano /etc/nginx/sites-available/craftwords
```

粘贴以下内容（替换 `your-domain.com`）：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/craftwords/dist;
    index index.html;

    # gzip：JS/CSS/JSON 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json
               application/manifest+json image/svg+xml;

    # PWA：sw.js / manifest 必须不缓存，否则用户拿不到新版本
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires off;
    }
    location = /manifest.webmanifest {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # 带 hash 的资源永久缓存（assets/index-XXXX.js）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # SPA 路由 fallback：所有未匹配的路径都返回 index.html，由 React Router 接管
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 2. 启用站点

```bash
sudo ln -sf /etc/nginx/sites-available/craftwords /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t                # 语法检查
sudo systemctl reload nginx
```

浏览器访问 `http://your-domain.com` 应能看到登录页。

---

## 五、HTTPS（Let's Encrypt 免费证书）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com \
     --agree-tos -m you@example.com --redirect
```

certbot 会：

- 自动改写 `craftwords` 的 nginx conf 加 `listen 443 ssl;`
- 把 80 → 443 自动 301
- 写 `/etc/cron.d/certbot` 自动续期（90 天）

验证续期：

```bash
sudo certbot renew --dry-run
```

> PWA / Service Worker 必须 HTTPS 才生效，这一步不能省。

---

## 六、Supabase Cloud 后端配置

迁移脚本部署到 Supabase Cloud 项目：

```bash
# 本地开发机或 ECS 上：
sudo apt install -y postgresql-client    # 装 psql
cd /var/www/craftwords/supabase-migration
export DATABASE_URL="postgresql://postgres:<db-password>@db.<ref>.supabase.co:5432/postgres"
./run-all.sh
```

成功后回到 Supabase Dashboard：

1. **Authentication → URL Configuration**：
   - Site URL = `https://your-domain.com`
   - Redirect URLs 加 `https://your-domain.com/**`
2. **Authentication → Providers → Email**：开 Confirm email（按需）
3. 注册首个 admin 账号 → 在 SQL Editor 执行：
   ```sql
   INSERT INTO public.admin_users (user_id, email, note)
   SELECT id, email, 'first admin'
     FROM auth.users WHERE email = 'you@example.com'
   ON CONFLICT (user_id) DO NOTHING;
   ```

迁移脚本细节见 [supabase-migration/README.md](./supabase-migration/README.md)。

---

## 七、后续更新（拉新代码 → 重新发布）

写一个 `/var/www/craftwords/deploy.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /var/www/craftwords
git fetch --all
git reset --hard origin/main
npm ci
npm run build
# 原子切换：先构建到临时目录再 rename，避免 nginx 中途读到半成品
# （vite 直接覆盖 dist 也行，单页面项目影响小，简化版本如下）
sudo systemctl reload nginx
echo "==> deployed at $(date)"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

> 切环境变量（如换 Supabase 项目）：编辑 `.env.local` 后必须重新 `npm run build`，
> 因为 `VITE_*` 是 **构建时常量**，运行时改文件不生效。

---

## 八、（可选）ECS 同机自建 Supabase

仅在不想用 Cloud 时选这条路。**最低 4GB 内存**，否则 GoTrue + PostgREST + Postgres
+ Studio 同时跑会 OOM。

### 1. 装 Docker

```bash
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker deploy
newgrp docker
```

### 2. 拉官方 self-hosted

```bash
cd ~ && git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
nano .env       # 改 POSTGRES_PASSWORD / JWT_SECRET / ANON_KEY / SERVICE_ROLE_KEY
                # 强烈建议：openssl rand -base64 48 生成新密钥
docker compose pull
docker compose up -d
```

启动后 `docker compose ps` 应有 9 个服务 healthy。

### 3. 跑迁移脚本

```bash
cd /var/www/craftwords/supabase-migration
export DATABASE_URL="postgresql://postgres:<your-pwd>@127.0.0.1:5432/postgres"
./run-all.sh
```

### 4. Nginx 反向代理 Supabase

在 craftwords 站点 conf 里加（或单独建 `api.your-domain.com`）：

```nginx
location /supabase/ {
    proxy_pass http://127.0.0.1:8000/;       # Kong 网关
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;  # Realtime websocket
    proxy_set_header Connection "upgrade";
}
```

`.env.local` 改成：

```
VITE_SUPABASE_URL=https://your-domain.com/supabase
VITE_SUPABASE_ANON_KEY=<.env 里的 ANON_KEY>
```

重新 `npm run build` + `sudo systemctl reload nginx`。

---

## 九、运维清单

| 任务 | 命令 |
|---|---|
| 看 Nginx 日志 | `sudo tail -f /var/log/nginx/{access,error}.log` |
| 强制刷新 PWA 缓存 | 浏览器 DevTools → Application → Service Workers → Unregister |
| 备份 Supabase Cloud | `pg_dump --no-owner $DATABASE_URL > backup-$(date +%F).sql` |
| 备份自建 Postgres | `docker compose exec db pg_dump -U postgres > backup.sql` |
| 监控带宽 | `vnstat -d` 或阿里云 ECS 监控面板 |
| 续费证书 | 自动；手动 `sudo certbot renew` |

---

## 十、常见问题

**Q1. 部署后白屏，控制台报 `Failed to load module script: MIME type is text/html`**
→ Nginx SPA fallback 顺序错了，把静态资源 fallback 给了 index.html。
检查 `try_files $uri $uri/ /index.html;` 里的 `$uri` 在前。

**Q2. PWA 提示更新但点了不刷新**
→ `sw.js` 被缓存了。第四节 nginx conf 里那段 `Cache-Control: no-cache` 必须有。

**Q3. 登录后跳回首页报 `redirect_uri not allowed`**
→ Supabase Dashboard → Auth → URL Configuration 里加 `https://your-domain.com/**`。

**Q4. 国内访问 youtube.com 嵌入的视频加载慢**
→ 这是 YouTube IFrame 直连，不经 ECS。可让用户挂代理，或换无墙的视频源。

**Q5. ECS 内存不够**
→ 自建 Supabase 至少 4G。如果只跑前端，2G 够用。
加 swap：
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 十一、首次部署核对清单

- [ ] ECS 安全组开 22/80/443
- [ ] 域名 A 记录指向 ECS 公网 IP
- [ ] 装 Node 20 + Nginx + Certbot
- [ ] `.env.local` 填真实 Supabase URL/Key
- [ ] `npm ci && npm run build` 成功
- [ ] Nginx 站点 conf 已启用，`nginx -t` 通过
- [ ] HTTP 能访问到登录页
- [ ] `certbot --nginx` 拿到证书，HTTPS 跳转生效
- [ ] Supabase 跑完 19 个迁移脚本
- [ ] Supabase Auth Site URL / Redirect URL 已配
- [ ] 注册首个 admin 账号并写入 `admin_users`
- [ ] PWA 离线页面能加载（DevTools → Application → Service Workers 显示 activated）
- [ ] Lighthouse Performance > 80
