# 中医诊所管理系统 - 设计文档

## 1. 项目概述

### 1.1 项目目标

为个人中医诊所打造一款轻量级、移动优先的诊所管理系统。系统以 iPad/iPhone 为主要使用设备，采用 PWA 技术实现类原生应用体验。核心功能包括：

- **患者管理**：患者档案的增删改查、搜索与归档
- **预约排程**：日历视图、今日排程、时间冲突检测
- **就诊记录**：中医四诊记录、针灸穴位、中药处方
- **知情同意**：手写签名采集与安全存储
- **短信提醒**：预约确认、24小时/2小时提醒（可选功能）

### 1.2 设计原则

- **移动优先**：所有界面优先适配 iPad 竖屏（768px），同时兼容 iPhone 和桌面端
- **简洁高效**：减少操作步骤，常用功能一键可达
- **中医专业**：界面风格融合中医传统美学，使用温暖自然的配色
- **离线可用**：通过 Service Worker 缓存关键资源，弱网环境下仍可浏览

---

## 2. 技术栈

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 前端框架 | React | 19.x | 生态丰富、组件化开发 |
| 构建工具 | Vite | 8.x | 极速热更新、原生 ESM |
| 样式方案 | Tailwind CSS | 4.x | 原子化 CSS、高效开发 |
| UI 组件 | Radix UI + 自定义组件 | - | 无障碍、无样式约束 |
| 路由 | React Router | 7.x | 声明式路由、嵌套布局 |
| 状态管理 | TanStack Query | 5.x | 服务端状态管理、自动缓存 |
| 动画 | Framer Motion | 12.x | 流畅的页面过渡 |
| PWA | vite-plugin-pwa | 1.x | 自动生成 Service Worker |
| 后端 | Supabase | - | PostgreSQL + Auth + Storage + Edge Functions |
| 短信 | Twilio | - | 可靠的 SMS API（可选） |

---

## 3. 数据库架构

### 3.1 ER 关系图

```
patients (1) ──→ (N) appointments
patients (1) ──→ (N) visit_records
patients (1) ──→ (N) consent_records
patients (1) ──→ (N) sms_log
visit_records (1) ──→ (N) acupuncture_details
visit_records (1) ──→ (N) herbal_prescriptions
herbal_prescriptions (1) ──→ (N) herb_items
appointments (1) ──→ (N) sms_log
```

### 3.2 表结构说明

#### patients（患者表）

核心业务表，存储患者基本信息和医疗背景。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| first_name / last_name | TEXT | 姓名 |
| phone | TEXT | 手机号（必填，用于短信通知） |
| email | TEXT | 邮箱（可选） |
| date_of_birth | DATE | 出生日期 |
| gender | ENUM | 性别 |
| avatar_url | TEXT | 头像地址（存储在 Supabase Storage） |
| emergency_contact_name/phone | TEXT | 紧急联系人 |
| allergies | TEXT | 过敏信息 |
| medical_history | TEXT | 既往病史 |
| notes | TEXT | 备注 |
| consent_signed | BOOLEAN | 是否已签署知情同意 |
| last_visit_at | TIMESTAMPTZ | 最近就诊时间 |
| is_archived | BOOLEAN | 是否归档 |

自动维护 `updated_at` 时间戳（通过触发器）。

#### appointments（预约表）

管理所有预约信息，支持多种状态流转。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| patient_id | UUID | 关联患者（外键） |
| start_time / end_time | TIMESTAMPTZ | 预约时间段 |
| service_type | ENUM | 服务类型：针灸/中药复诊/初诊/复诊/其他 |
| status | ENUM | 状态：已预约/已确认/已到店/就诊中/已完成/已取消/未到 |
| notes | TEXT | 预约备注 |
| sms_confirmation_sent | BOOLEAN | 确认短信已发送 |
| sms_reminder_24h_sent | BOOLEAN | 24h提醒已发送 |
| sms_reminder_2h_sent | BOOLEAN | 2h提醒已发送 |

状态流转：`scheduled → confirmed → arrived → in_progress → completed`

#### blocked_times（休息/屏蔽时间表）

管理医生不接诊的时间段。

| 字段 | 类型 | 说明 |
|------|------|------|
| start_time / end_time | TIMESTAMPTZ | 屏蔽时间段 |
| reason | TEXT | 原因 |
| recurring | BOOLEAN | 是否重复 |
| recurrence_rule | TEXT | iCal RRULE 格式 |

#### visit_records（就诊记录表）

每次就诊的详细中医诊疗记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| patient_id | UUID | 关联患者 |
| appointment_id | UUID | 关联预约（可选） |
| visit_datetime | TIMESTAMPTZ | 就诊时间 |
| chief_complaint | TEXT | 主诉 |
| treatment_type | ENUM | 治疗类型：针灸/中药/针灸+中药/问诊/其他 |
| doctor_notes | TEXT | 医生笔记 |
| tongue_diagnosis | TEXT | 舌诊 |
| pulse_diagnosis | TEXT | 脉诊 |
| tcm_pattern | TEXT | 中医辨证（证型） |

#### acupuncture_details（针灸详情表）

| 字段 | 类型 | 说明 |
|------|------|------|
| visit_record_id | UUID | 关联就诊记录 |
| acupoints | TEXT[] | 穴位数组 |
| needle_retention_min | INTEGER | 留针时间（分钟） |
| needle_gauge | TEXT | 针号 |
| technique_notes | TEXT | 手法备注 |
| moxa_used | BOOLEAN | 是否用艾灸 |
| electro_stim_used | BOOLEAN | 是否用电针 |
| cupping_used | BOOLEAN | 是否用拔罐 |

#### herbal_prescriptions（中药处方表）

| 字段 | 类型 | 说明 |
|------|------|------|
| visit_record_id | UUID | 关联就诊记录 |
| formula_name | TEXT | 方剂名 |
| instructions | TEXT | 用法用量 |
| duration_days | INTEGER | 服用天数 |
| refills | INTEGER | 续配次数 |

#### herb_items（中药药材表）

| 字段 | 类型 | 说明 |
|------|------|------|
| prescription_id | UUID | 关联处方 |
| herb_name_pinyin | TEXT | 拼音名（必填） |
| herb_name_chinese | TEXT | 中文名 |
| herb_name_latin | TEXT | 拉丁名 |
| dosage_grams | NUMERIC(6,1) | 剂量（克） |
| processing_method | TEXT | 炮制方法 |
| sort_order | INTEGER | 排序 |

#### consent_records（知情同意表）

| 字段 | 类型 | 说明 |
|------|------|------|
| patient_id | UUID | 关联患者 |
| visit_record_id | UUID | 关联就诊记录（可选） |
| consent_type | ENUM | 类型：初次同意/针灸同意/治疗后确认 |
| signature_url | TEXT | 签名图片URL |
| signed_at | TIMESTAMPTZ | 签署时间 |
| ip_address | TEXT | IP地址 |
| witness_name | TEXT | 见证人 |

#### common_templates（常用模板表）

预设的文本模板，加速录入。

| 字段 | 类型 | 说明 |
|------|------|------|
| category | ENUM | 分类：主诉/医生笔记/治疗方案/医嘱 |
| title | TEXT | 模板标题 |
| content | TEXT | 模板内容 |
| is_active | BOOLEAN | 是否启用 |

#### common_acupoints（常用穴位表）

穴位参考数据库。

| 字段 | 类型 | 说明 |
|------|------|------|
| code | TEXT | 穴位代码（如 ST36） |
| name_pinyin | TEXT | 拼音名（如 Zusanli） |
| name_chinese | TEXT | 中文名（如 足三里） |
| meridian | TEXT | 所属经络 |
| common_uses | TEXT | 常见适应症 |
| is_favorite | BOOLEAN | 收藏标记 |

#### common_formulas（常用方剂表）

经典方剂及其默认药材组合。

| 字段 | 类型 | 说明 |
|------|------|------|
| name_pinyin | TEXT | 拼音名 |
| name_chinese | TEXT | 中文名 |
| category | TEXT | 分类 |
| default_herbs | JSONB | 默认药材列表 |
| instructions | TEXT | 用法用量 |

#### sms_log（短信日志表）

记录所有发送的短信。

| 字段 | 类型 | 说明 |
|------|------|------|
| appointment_id | UUID | 关联预约 |
| patient_id | UUID | 关联患者 |
| phone_number | TEXT | 发送号码 |
| message_type | TEXT | 消息类型 |
| message_body | TEXT | 消息内容 |
| twilio_sid | TEXT | Twilio 消息 SID |
| status | TEXT | 发送状态 |

---

## 4. 前端架构

### 4.1 目录结构

```
frontend/src/
├── main.tsx                 # 入口：React 渲染、Provider 注入
├── App.tsx                  # 路由配置、鉴权守卫
├── app.css                  # 全局样式、Tailwind 主题变量
├── types/
│   └── index.ts             # TypeScript 类型定义
├── lib/
│   ├── supabase.ts          # Supabase 客户端初始化
│   ├── auth-context.tsx     # 认证上下文（React Context）
│   ├── constants.ts         # 枚举标签、颜色映射
│   └── utils.ts             # 工具函数
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx     # 应用外壳（响应式布局容器）
│   │   ├── Sidebar.tsx      # 桌面端侧边栏
│   │   ├── BottomNav.tsx    # 移动端底部导航
│   │   └── Header.tsx       # 顶部标题栏
│   └── ui/                  # 基础 UI 组件（基于 Radix UI）
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── select.tsx
└── pages/
    ├── LoginPage.tsx         # 登录页
    ├── TodaySchedulePage.tsx # 今日排程（首页）
    ├── CalendarPage.tsx      # 日历视图
    ├── PatientRecordsPage.tsx# 患者列表
    ├── PatientDetailPage.tsx # 患者详情
    ├── VisitFormPage.tsx     # 就诊记录表单
    ├── VisitDetailPage.tsx   # 就诊记录详情
    └── SignaturePage.tsx     # 签名采集页
```

### 4.2 路由设计

| 路径 | 页面 | 说明 |
|------|------|------|
| `/login` | LoginPage | 登录页（无需鉴权） |
| `/` | TodaySchedulePage | 今日排程（默认首页） |
| `/calendar` | CalendarPage | 日历视图 |
| `/patients` | PatientRecordsPage | 患者列表 |
| `/patients/:id` | PatientDetailPage | 患者详情 |
| `/visits/new` | VisitFormPage | 新建就诊记录 |
| `/visits/:id` | VisitDetailPage | 就诊记录详情 |
| `/signature/:type` | SignaturePage | 签名采集 |

所有 `/` 下的路由均包裹在 `ProtectedRoute` 中，未登录用户自动跳转到 `/login`。

### 4.3 状态管理策略

- **服务端状态**：使用 TanStack Query（React Query）管理所有 Supabase 数据查询。配置 5 分钟 staleTime，窗口获得焦点时自动刷新。
- **认证状态**：通过 `AuthProvider`（React Context）管理，监听 Supabase Auth 的 `onAuthStateChange` 事件。
- **本地 UI 状态**：使用 React `useState`/`useReducer`，不引入额外状态管理库。

### 4.4 组件设计原则

- 基础 UI 组件（`components/ui/`）使用 `class-variance-authority` 实现多变体支持
- 使用 `tailwind-merge` 合并 Tailwind 类名，避免冲突
- 所有组件支持 `className` prop 以便外部定制
- 对话框、弹窗基于 Radix UI 的无障碍原语

---

## 5. 配色方案与设计系统

### 5.1 配色方案

灵感来源于中医传统美学，使用温暖的自然色调：

| 变量 | 色值 | 用途 |
|------|------|------|
| `--color-primary` | `#2D5F3D` | 主色（墨绿色）— 导航栏、按钮、强调 |
| `--color-primary-foreground` | `#FAFDF7` | 主色上的文字 |
| `--color-secondary` | `#8B6F4E` | 辅助色（褐色）— 中药相关标签 |
| `--color-secondary-foreground` | `#FAFDF7` | 辅助色上的文字 |
| `--color-accent` | `#C4956A` | 强调色（暖金色）— 针灸标签、高亮 |
| `--color-accent-foreground` | `#1A1A1A` | 强调色上的文字 |
| `--color-muted` | `#F5F0EB` | 柔和背景色 |
| `--color-muted-foreground` | `#6B6560` | 次要文字 |
| `--color-destructive` | `#B04A4A` | 危险/取消（红色） |
| `--color-background` | `#FAFAF7` | 页面背景（温暖米白） |
| `--color-foreground` | `#1A1A1A` | 主要文字 |
| `--color-card` | `#FFFFFF` | 卡片背景 |
| `--color-border` | `#E2DCD5` | 边框 |
| `--color-ring` | `#2D5F3D` | 焦点环 |

### 5.2 圆角系统

| 变量 | 值 | 用途 |
|------|------|------|
| `--radius-sm` | `0.375rem` | 小组件（Badge） |
| `--radius-md` | `0.5rem` | 输入框 |
| `--radius-lg` | `0.75rem` | 卡片 |
| `--radius-xl` | `1rem` | 大容器、对话框 |

### 5.3 字体

使用系统原生字体栈，优先中文字体：

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
             'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
```

---

## 6. PWA 策略

### 6.1 Service Worker

使用 `vite-plugin-pwa` 自动生成 Service Worker，采用 Workbox 策略：

- **registerType**: `autoUpdate` — 新版本自动激活，无需用户手动刷新
- **预缓存**: 所有 JS、CSS、HTML、图片、字体文件
- **运行时缓存**:
  - Supabase REST API (`/rest/v1/*`): `NetworkFirst` 策略，5秒超时后读缓存，最多缓存100条，1小时过期
  - Supabase Storage (`/storage/*`): `CacheFirst` 策略，最多缓存200项，30天过期

### 6.2 Web App Manifest

```json
{
  "name": "中医诊所管理系统",
  "short_name": "中医诊所",
  "theme_color": "#2D5F3D",
  "background_color": "#FAFAF7",
  "display": "standalone",
  "orientation": "any"
}
```

图标配置：
- `icon-192.png` — 标准图标
- `icon-512.png` — 高清图标
- `icon-512-maskable.png` — 自适应图标（maskable）

### 6.3 离线策略

- 静态资源完全离线可用（预缓存）
- API 数据在弱网/离线时回退到缓存
- Storage 文件（头像、签名图片）采用缓存优先策略

### 6.4 iOS 安全区域

通过 CSS `env()` 函数适配刘海屏和圆角屏：

```css
:root {
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
  --safe-area-left: env(safe-area-inset-left);
  --safe-area-right: env(safe-area-inset-right);
}
```

同时禁用 iOS 过度滚动弹性效果：`overscroll-behavior: none`

---

## 7. 短信集成设计

### 7.1 架构概览

```
前端 → Supabase Edge Function (send-sms) → Twilio API → 患者手机
pg_cron → Edge Function (sms-reminder-cron) → Twilio API → 患者手机
```

> **注意**: 短信功能默认不激活，需要配置 Twilio 凭证后方可使用。

### 7.2 Edge Functions

#### send-sms

单条短信发送函数，接受 POST 请求：

```json
{
  "to": "+1234567890",
  "body": "消息内容",
  "patient_id": "uuid",
  "appointment_id": "uuid",
  "message_type": "confirmation"
}
```

功能：
- 验证 Authorization header
- 调用 Twilio API 发送短信
- 将发送记录写入 `sms_log` 表
- 更新 `appointments` 表的短信标志位

#### sms-reminder-cron

定时任务函数，每15分钟执行一次：

- **24小时提醒**：查找23-25小时后的预约，发送提醒
- **2小时提醒**：查找1.75-2.25小时后的预约，发送提醒
- 仅发送给状态为 `scheduled` 或 `confirmed` 的预约
- 跳过已发送过提醒的预约（通过标志位判断）
- 跳过没有手机号的患者

### 7.3 消息类型

| 类型 | 触发时机 | 消息模板 |
|------|----------|----------|
| `confirmation` | 创建/确认预约时 | 预约确认通知 |
| `reminder_24h` | 预约前24小时（定时） | 明天预约提醒 |
| `reminder_2h` | 预约前2小时（定时） | 即将就诊提醒 |
| `reschedule` | 改期时 | 改期通知 |
| `cancel` | 取消时 | 取消通知 |

### 7.4 Twilio 配置

需要设置的 Supabase Secrets：

| Secret | 说明 |
|--------|------|
| `TWILIO_ACCOUNT_SID` | Twilio 账号 SID |
| `TWILIO_AUTH_TOKEN` | Twilio 认证令牌 |
| `TWILIO_PHONE_NUMBER` | Twilio 发送号码 |

### 7.5 pg_cron 调度

```sql
SELECT cron.schedule('sms-reminders', '*/15 * * * *', $$
  SELECT net.http_post(
    url := '<SUPABASE_URL>/functions/v1/sms-reminder-cron',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>'),
    body := '{}'::jsonb
  );
$$);
```

---

## 8. 安全设计

### 8.1 行级安全（RLS）

所有数据表均启用 RLS，采用统一策略：

- **SELECT / INSERT / UPDATE / DELETE**：仅允许 `authenticated` 角色
- 未认证用户完全无法访问任何数据

策略通过动态 SQL 批量创建，覆盖全部12张表。

### 8.2 存储安全

| Bucket | 公开性 | 读权限 | 写权限 | 大小限制 | 文件类型 |
|--------|--------|--------|--------|----------|----------|
| `avatars` | 公开 | 所有人 | 认证用户 | 5MB | JPEG, PNG, WebP |
| `signatures` | 私有 | 认证用户 | 认证用户 | 2MB | PNG |

### 8.3 认证

- 使用 Supabase Auth 的邮箱密码认证
- 前端通过 `AuthProvider` 全局管理认证状态
- API 请求自动携带 JWT（Supabase 客户端自动处理）
- Edge Functions 通过 `Authorization` header 验证身份

### 8.4 环境变量

前端仅暴露公开的 Supabase URL 和 Anon Key（通过 `VITE_` 前缀）：

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Service Role Key 仅在 Edge Functions 服务端使用，不暴露给前端。

---

## 9. 响应式设计策略

### 9.1 断点设计

| 断点 | 宽度 | 目标设备 | 布局 |
|------|------|----------|------|
| 默认 | < 768px | iPhone | 单列布局 + 底部导航 |
| `md` | >= 768px | iPad 竖屏 | 侧边栏 + 内容区 |
| `lg` | >= 1024px | iPad 横屏 / 桌面 | 宽侧边栏 + 内容区 |
| `xl` | >= 1280px | 大屏桌面 | 最大宽度限制 |

### 9.2 布局方案

- **AppShell**：响应式外壳组件
  - 移动端：全屏内容 + 固定底部导航栏（BottomNav）
  - 平板/桌面：左侧固定侧边栏（Sidebar）+ 右侧内容区
- **Header**：移动端显示页面标题和返回按钮
- 内容区使用 `max-w-screen-xl mx-auto` 限制最大宽度

### 9.3 触控优化

- 所有可点击元素最小尺寸 44x44px（Apple HIG 推荐）
- 列表项有充足的点击区域和间距
- 滑动手势友好（无横向滚动冲突）

---

## 10. API 设计

### 10.1 Supabase 查询模式

所有数据操作通过 Supabase JS 客户端直接进行，无需自建 REST API。

#### 患者查询

```typescript
// 获取患者列表（搜索 + 分页）
const { data } = await supabase
  .from('patients')
  .select('*')
  .eq('is_archived', false)
  .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
  .order('last_visit_at', { ascending: false, nullsFirst: false })
  .range(offset, offset + limit - 1)

// 获取患者详情（含关联数据）
const { data } = await supabase
  .from('patients')
  .select('*, appointments(*), visit_records(*), consent_records(*)')
  .eq('id', patientId)
  .single()
```

#### 预约查询

```typescript
// 获取今日排程
const { data } = await supabase
  .from('appointments')
  .select('*, patient:patients(id, first_name, last_name, phone, avatar_url)')
  .gte('start_time', todayStart)
  .lte('start_time', todayEnd)
  .order('start_time')

// 获取日历范围内的预约
const { data } = await supabase
  .from('appointments')
  .select('*, patient:patients(id, first_name, last_name)')
  .gte('start_time', rangeStart)
  .lte('end_time', rangeEnd)
  .not('status', 'eq', 'cancelled')
```

#### 就诊记录查询

```typescript
// 获取就诊记录详情（含针灸和处方）
const { data } = await supabase
  .from('visit_records')
  .select(`
    *,
    patient:patients(*),
    acupuncture_details(*),
    herbal_prescriptions(*, herb_items(*))
  `)
  .eq('id', visitId)
  .single()
```

#### 知情同意

```typescript
// 上传签名图片
const { data } = await supabase.storage
  .from('signatures')
  .upload(`${patientId}/${Date.now()}.png`, signatureBlob)

// 创建同意记录
await supabase.from('consent_records').insert({
  patient_id: patientId,
  consent_type: 'acupuncture_consent',
  signature_url: data.path,
  signed_at: new Date().toISOString(),
})
```

### 10.2 实时订阅

预约表启用 Realtime，支持多设备同步：

```typescript
supabase
  .channel('appointments')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' },
    (payload) => { queryClient.invalidateQueries({ queryKey: ['appointments'] }) }
  )
  .subscribe()
```

---

## 附录：迁移文件列表

| 序号 | 文件名 | 说明 |
|------|--------|------|
| 00001 | create_patients.sql | 患者表 + 索引 + 更新触发器 |
| 00002 | create_appointments.sql | 预约表 + 枚举类型 + 索引 |
| 00003 | create_blocked_times.sql | 屏蔽时间表 |
| 00004 | create_visit_records.sql | 就诊记录表 |
| 00005 | create_acupuncture_details.sql | 针灸详情表 |
| 00006 | create_herbal_prescriptions.sql | 处方表 + 药材表 |
| 00007 | create_consent_records.sql | 知情同意表 |
| 00008 | create_templates.sql | 模板 + 穴位 + 方剂表 |
| 00009 | create_sms_log.sql | 短信日志表 |
| 00010 | create_rls_policies.sql | 行级安全策略 |
| 00011 | create_storage.sql | 存储桶配置说明 |
