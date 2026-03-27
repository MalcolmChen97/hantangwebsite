# 中医诊所管理系统 - 部署指南

## 目录

1. [环境准备](#1-环境准备)
2. [Supabase 后端配置](#2-supabase-后端配置)
3. [前端项目配置](#3-前端项目配置)
4. [部署方案](#4-部署方案)
5. [短信功能配置（可选）](#5-短信功能配置可选)
6. [PWA 安装指南](#6-pwa-安装指南)
7. [部署检查清单](#7-部署检查清单)
8. [常见问题与排查](#8-常见问题与排查)

---

## 1. 环境准备

### 1.1 必需工具

| 工具 | 版本要求 | 安装方式 |
|------|----------|----------|
| Node.js | >= 18.x | [nodejs.org](https://nodejs.org/) |
| npm | >= 9.x | 随 Node.js 安装 |
| Git | >= 2.x | [git-scm.com](https://git-scm.com/) |

### 1.2 可选工具

| 工具 | 用途 | 安装方式 |
|------|------|----------|
| Supabase CLI | 创建项目、推送迁移、部署 Edge Functions、获取 API 密钥 | `npm install -g supabase` |
| Twilio 账号 | 短信通知功能 | [twilio.com](https://www.twilio.com/) |

### 1.3 必需账号

- **Supabase 账号**：[supabase.com](https://supabase.com/) — 免费方案即可开始
- **Twilio 账号**（可选）：仅在需要短信功能时创建

---

## 2. Supabase 后端配置

以下步骤默认在终端完成：先安装 [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)（`npm install -g supabase`），并在仓库中 **`cd backend`** 再执行子命令（CLI 读取 `supabase/config.toml` 与 `supabase/migrations/`）。

### 2.1 创建 Supabase 项目（CLI）

```bash
supabase login

# 若无组织，可先创建（按提示输入组织名称）
supabase orgs create

# 查看组织 ID（创建项目时必填 --org-id）
supabase orgs list

# 创建项目（名称、区域、数据库密码请按需修改；区域代码见 CLI 提示或官方文档）
supabase projects create zhongyi-clinic \
  --org-id <your-org-id> \
  --db-password '<你的数据库密码>' \
  --region ap-southeast-1

# 查看 Reference ID（即下文中的 project-ref）
supabase projects list
```

等待 CLI 返回项目就绪后，继续下一步。

### 2.2 获取项目 URL 与 API 密钥（CLI）

将 `<your-project-ref>` 换成上一步列表中的项目 Reference ID：

```bash
# JSON 输出便于复制 anon / service_role（service_role 仅服务端与自动化使用，勿写入前端）
supabase projects api-keys --project-ref <your-project-ref> -o json
```

从中可得到：

- **Project URL**：形如 `https://<project-ref>.supabase.co`（与你 Dashboard 中一致）
- **Anon Key**：给前端 `VITE_SUPABASE_ANON_KEY`
- **Service Role Key**：给 Edge Functions、定时任务、`curl` 创建用户等后端场景；**切勿**提交到 Git 或暴露给浏览器

### 2.3 链接远程库并推送数据库迁移

迁移文件位于 `backend/supabase/migrations/`（00001–00011 及 **00012** Realtime、**00013** 存储桶与 Storage 策略）：

```bash
cd backend

supabase link --project-ref <your-project-ref>

# 将迁移推送到远程 Postgres（含表、RLS、存储桶、storage.objects 策略、appointments 的 Realtime 发布）
supabase db push
```

> **重要**：迁移按文件名顺序执行；若你曾在 Dashboard 手工建过同名策略或桶，可能导致 `CREATE POLICY` / 对象冲突，需先清理或改用全新项目后再 `db push`。

### 2.4 导入种子数据（CLI）

种子文件：`backend/seed/seed_data.sql`（`supabase/config.toml` 的 `[db.seed]` 已引用）。

**推荐（空库一次做完迁移 + 种子）**：

```bash
cd backend
supabase db push --include-seed
```

**若已执行过 `db push`，只需补跑种子**：用与 [5.4](#54-配置定时提醒pg_cron) 相同的 Postgres 直连 URI（`SUPABASE_DB_URL`）执行：

```bash
cd backend
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f seed/seed_data.sql
```

> 种子含多条 `INSERT`，对已有数据的数据库重复执行可能触发唯一约束错误；仅建议在空表或已清空相关表后执行。

本地 Docker 开发可用 `supabase db reset`（重建本地库并应用迁移 + 种子）。

导入内容：穴位（common_acupoints）、方剂（common_formulas）、文本模板（common_templates）。

### 2.5 存储桶与 Storage 策略

**无需再打开 Dashboard。** 存储桶 `avatars` / `signatures` 及对应 RLS 已包含在迁移 **00013** 中，随 `supabase db push` 一并创建。  
本地 `supabase start` 时，`config.toml` 里的 `[storage.buckets.*]` 与 `supabase seed buckets`（可选）可用于对齐本地桶配置。

### 2.6 创建管理员账号命令行

Supabase CLI 暂无统一子命令创建用户，可使用 **Auth Admin API**（需 Service Role Key，勿泄露）：

```bash
export SUPABASE_URL="https://<your-project-ref>.supabase.co"
export SERVICE_ROLE_KEY="<service_role_jwt>"

curl -sS -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "请改为强密码",
    "email_confirm": true
  }'
```

成功后用该邮箱与密码在网页端登录。

### 2.7 启用 Realtime（已含在迁移中）

`appointments` 表已包含在迁移 **00012**（`ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments`）中，**执行 `supabase db push` 后即生效**，无需在 Dashboard 的 Replication 页面手动勾选。

---

## 3. 前端项目配置

### 3.1 获取代码

```bash
git clone <仓库地址>
cd zhongyi/frontend
```

### 3.2 安装依赖

```bash
npm install
```

### 3.3 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入 Supabase 凭证：

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **安全提醒**：Anon Key 是公开的客户端密钥，可以安全地放在前端代码中。Service Role Key 绝不能放在前端。

### 3.4 本地开发

```bash
npm run dev
```

访问 `http://localhost:5173`，使用 [2.6](#26-创建管理员账号命令行) 中创建的管理员账号登录。

### 3.5 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

---

## 4. 部署方案

### 方案 A：Vercel（推荐）

最简单的部署方式，适合大多数情况。

1. 将代码推送到 GitHub 仓库
2. 登录 [vercel.com](https://vercel.com/)，点击 **Import Project**
3. 选择 GitHub 仓库
4. 配置项目：
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量：
   - `VITE_SUPABASE_URL` = 你的 Supabase 项目 URL
   - `VITE_SUPABASE_ANON_KEY` = 你的 Supabase Anon Key
6. 点击 **Deploy**

部署完成后，Vercel 会提供一个 `*.vercel.app` 域名。

> **提示**：如需自定义域名，在 Vercel 的 **Settings → Domains** 中添加。

### 方案 B：Netlify

1. 登录 [netlify.com](https://netlify.com/)
2. 点击 **Add new site → Import an existing project**
3. 连接 GitHub 仓库
4. 配置构建：
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. 在 **Site settings → Environment variables** 中添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. 触发部署

### 方案 C：自托管（Nginx）

适合已有服务器的情况。

**1. 构建前端：**

```bash
cd frontend
npm install
npm run build
```

**2. 上传 `dist/` 到服务器**

**3. Nginx 配置参考：**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS（推荐）
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/zhongyi/dist;
    index index.html;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker 不缓存
    location /sw.js {
        add_header Cache-Control "no-cache";
    }

    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}
```

**4. 重载 Nginx：**

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. 短信功能配置（可选）

> **注意**：短信功能默认不激活。即使不配置 Twilio，系统的其他功能均可正常使用。

### 5.1 创建 Twilio 账号

1. 访问 [twilio.com](https://www.twilio.com/) 并注册账号
2. 完成账号验证
3. 在 Console 中获取：
   - **Account SID**：`ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. 在 **Phone Numbers** 中购买一个号码（或使用试用号码）

### 5.2 部署 Edge Functions

```bash
cd backend

# 确保已安装 Supabase CLI 并已链接项目
supabase login
supabase link --project-ref <your-project-ref>

# 部署 send-sms 函数
supabase functions deploy send-sms

# 部署 sms-reminder-cron 函数
supabase functions deploy sms-reminder-cron
```

### 5.3 设置 Secrets

```bash
supabase secrets set \
  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  TWILIO_PHONE_NUMBER=+1234567890
```

### 5.4 配置定时提醒（pg_cron）

使用 **psql** 连接**直连 Postgres**（不要用 REST API）。在 [Dashboard → Project Settings → Database](https://supabase.com/dashboard) 复制 **Connection string → URI**（或使用「Session mode」连接串），设为例示环境变量 `SUPABASE_DB_URL`（含密码，勿提交到 Git）。

1. 编辑 `backend/supabase/sql/sms_cron_schedule.sql`，将 `PLACEHOLDER_FUNCTIONS_URL` 替换为：

   `https://<your-project-ref>.supabase.co/functions/v1/sms-reminder-cron`

   将 `PLACEHOLDER_SERVICE_ROLE` 替换为 **Service Role JWT**（与 `Authorization: Bearer` 后一致，无多余空格）。

2. 在 `backend/` 下执行：

```bash
cd backend
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/sql/sms_cron_schedule.sql
```

若任务已存在需要重配，可先执行 [5.6](#56-取消定时任务) 取消后再跑上述脚本。

### 5.5 测试短信

使用 curl 测试 send-sms 函数：

```bash
curl -X POST 'https://xxxxxxxx.supabase.co/functions/v1/send-sms' \
  -H 'Authorization: Bearer <YOUR_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "+1234567890",
    "body": "测试消息 - 中医诊所管理系统",
    "patient_id": "<any-patient-uuid>",
    "message_type": "confirmation"
  }'
```

如果一切正常，应收到 `{"success": true, "sid": "SMxxxxxxx"}` 响应，并在指定手机上收到短信。

### 5.6 取消定时任务

如果需要停止定时提醒，使用与 [5.4](#54-配置定时提醒pg_cron) 相同的 `SUPABASE_DB_URL`：

```bash
cd backend
psql "$SUPABASE_DB_URL" -c "SELECT cron.unschedule('sms-reminders');"
```

---

## 6. PWA 安装指南

### 6.1 iPhone / iPad 安装

1. 使用 **Safari** 打开系统 URL（如 `https://your-domain.com`）
2. 登录系统确认功能正常
3. 点击底部 **分享按钮**（方框加向上箭头的图标）
4. 向下滚动找到 **"添加到主屏幕"**
5. 修改名称（可选），点击 **添加**
6. 主屏幕上将出现应用图标，点击即可以全屏模式打开

### 6.2 Android 安装

1. 使用 **Chrome** 打开系统 URL
2. 点击浏览器菜单（三个点）
3. 选择 **"添加到主屏幕"** 或 **"安装应用"**
4. 确认安装

### 6.3 桌面端安装

1. 使用 Chrome/Edge 打开系统 URL
2. 地址栏右侧会出现安装图标
3. 点击 **安装** 即可

---

## 7. 部署检查清单

### 必做项

- [ ] Supabase 项目已创建
- [ ] 已通过 `supabase db push` 应用全部迁移（00001 - 00013，含存储与 Realtime）
- [ ] 种子数据已导入（穴位、方剂、模板）
- [ ] 存储桶与 Storage 策略已由迁移 00013 创建（`db push` 后生效）
- [ ] 管理员账号已通过 Admin API（[2.6](#26-创建管理员账号命令行)）或等价方式创建
- [ ] appointments 表 Realtime 已由迁移 00012 启用（`db push` 后生效）
- [ ] 前端已部署（Vercel / Netlify / 自托管）
- [ ] 环境变量已正确设置（VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY）
- [ ] 能正常登录系统
- [ ] PWA 在 iPhone/iPad 上测试正常

### 可选项

- [ ] 自定义域名已配置
- [ ] HTTPS 证书已安装（自托管）
- [ ] Twilio 账号已创建
- [ ] Edge Functions 已部署（send-sms, sms-reminder-cron）
- [ ] Twilio Secrets 已设置
- [ ] pg_cron 定时任务已配置
- [ ] 短信发送已测试成功

---

## 8. 常见问题与排查

### 8.1 登录失败

**问题**：输入正确的邮箱密码后无法登录

**排查步骤**：
1. 确认 `.env` 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 正确
2. 确认用户已在 Supabase Auth 中创建且状态为 "Confirmed"
3. 打开浏览器开发者工具的 Network 面板，查看请求响应

### 8.2 数据加载为空

**问题**：登录成功但看不到任何数据

**排查步骤**：
1. 确认所有迁移已按顺序执行
2. 确认 RLS 策略已创建（执行了 `00010_create_rls_policies.sql`）
3. 使用 `supabase inspect db table-stats --linked` 或对 `SUPABASE_DB_URL` 执行 `psql -c '\dt public.*'` 检查表与行数
4. 检查 RLS：确认已执行迁移 00010；可选 `supabase db lint --linked` 或查询 `pg_policies`

### 8.3 图片上传失败

**问题**：无法上传头像或签名

**排查步骤**：
1. 确认存储桶已创建（avatars, signatures）
2. 确认存储策略已配置（允许认证用户上传）
3. 检查文件大小是否超出限制
4. 检查文件类型是否在允许的 MIME 类型中

### 8.4 PWA 无法安装

**问题**：Safari 中没有"添加到主屏幕"选项

**排查步骤**：
1. 确认使用的是 Safari 浏览器（iOS 上仅 Safari 支持 PWA）
2. 确认网站使用 HTTPS（PWA 要求安全上下文）
3. 确认 `manifest.json` 正确生成（访问 `<your-url>/manifest.webmanifest`）
4. 确认 Service Worker 正常注册（开发者工具 → Application → Service Workers）

### 8.5 短信发送失败

**问题**：调用 send-sms 函数返回错误

**排查步骤**：
1. 检查 Edge Functions 日志：`supabase functions logs send-sms`
2. 确认 Twilio Secrets 已正确设置
3. 确认 Twilio 账号有足够余额
4. 确认发送号码格式正确（需包含国家代码，如 `+86xxx`）
5. 如果使用 Twilio 试用账号，接收号码需要在 Twilio 控制台中验证

### 8.6 定时提醒不工作

**问题**：预约提醒短信没有自动发送

**排查步骤**：
1. 确认 pg_cron 扩展已启用
2. 检查 cron 任务是否存在：
   ```sql
   SELECT * FROM cron.job;
   ```
3. 检查任务执行日志：
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
   ```
4. 确认 sms-reminder-cron 函数已部署
5. 确认 Service Role Key 在 cron SQL 中正确

### 8.7 构建失败

**问题**：`npm run build` 报错

**排查步骤**：
1. 确认 Node.js 版本 >= 18
2. 删除 `node_modules` 和 `package-lock.json`，重新 `npm install`
3. 检查 TypeScript 错误：`npx tsc --noEmit`
4. 确认环境变量在构建环境中已设置

### 8.8 Vercel 部署失败

**问题**：Vercel 构建或部署时报错

**排查步骤**：
1. 确认 Root Directory 设置为 `frontend`
2. 确认环境变量已在 Vercel 项目设置中添加
3. 查看 Vercel 构建日志定位错误
4. 确认 `package.json` 中的依赖都可以正常安装
