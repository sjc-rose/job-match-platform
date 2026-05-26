# AI Job Match Platform / 招聘匹配平台

一个面向中国招聘市场的职位匹配网站。项目支持邮箱登录、求职偏好维护、职位搜索、匹配评分、推荐职位、收藏职位、求职进度跟踪，以及用于开发测试的后台职位管理。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- Supabase PostgreSQL
- Supabase Auth
- Vercel

## 核心功能

- 用户登录、注册、退出
- 求职偏好 Profile：目标岗位、城市、薪资、学历、经验、技能、自我介绍
- 职位搜索：按关键词、城市、学历、薪资、经验进行匹配
- Match Score：根据 UserProfile 计算职位匹配度和推荐理由
- 推荐职位：按匹配度推荐 active 职位，并排除已处理申请记录
- 收藏职位：按用户隔离保存收藏
- 申请记录：记录未申请、已申请、面试中、Offer、拒绝、放弃等状态
- 搜索记录：按用户保存最近搜索
- 职位状态：active / inactive / expired

## 页面列表

- `/`：首页和核心入口
- `/login`：登录
- `/signup`：注册
- `/profile`：我的资料 / 求职偏好
- `/search`：职位搜索
- `/recommendations`：推荐职位
- `/jobs/[id]`：职位详情
- `/favorites`：我的收藏
- `/applications`：求职进度和进度统计

## 后台功能

后台仍使用独立的 `ADMIN_PASSWORD` cookie 保护，不和普通用户登录混用。

- `/admin`：后台首页
- `/admin/jobs`：职位管理、筛选、分页、编辑、删除、批量删除
- `/admin/jobs/new`：新增职位
- `/admin/jobs/[id]/edit`：编辑职位
- `/admin/import`：JSON / CSV 导入、导入前预览、数据源选择、去重和质量反馈
- `/admin/sources`：数据源管理
- `/admin/stats`：后台统计面板
- `/admin/maintenance`：系统维护和生产健康检查

## 数据库模型概览

- `Job`：职位数据，包含 source、标题、公司、城市、薪资、学历、经验、描述、申请链接、状态等
- `FavoriteJob`：用户收藏职位
- `SearchHistory`：用户搜索记录
- `ApplicationRecord`：用户申请状态和备注
- `UserProfile`：用户求职偏好
- `DataSource`：后台数据源配置

## 环境变量

复制 `.env.example` 为 `.env.local`，并填写自己的配置。不要提交真实密钥。

```bash
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADMIN_PASSWORD=
CRON_SECRET=
```

说明：

- `DATABASE_URL`：应用运行时使用的 Supabase PostgreSQL 连接串，通常可使用连接池地址。
- `DIRECT_URL`：Prisma migration 使用的直连数据库地址。
- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase anon public key。
- `ADMIN_PASSWORD`：后台管理密码；本地未设置时项目会使用开发默认密码。
- `CRON_SECRET`：Vercel Cron 调用 `/api/admin/maintenance` 时使用的保护密钥。

## 本地运行

安装依赖：

```bash
npm install
```

生成 Prisma Client：

```bash
npm run prisma:generate
```

启动开发环境：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## Prisma Migration

校验 schema：

```bash
npm run prisma:validate
```

创建并执行 migration：

```bash
npx prisma migrate dev --name your_migration_name
```

只生成 Prisma Client：

```bash
npm run prisma:generate
```

打开 Prisma Studio：

```bash
npm run prisma:studio
```

## Vercel 部署

1. 在 Supabase 创建项目并准备 PostgreSQL 连接串。
2. 在 Vercel 项目中配置环境变量：`DATABASE_URL`、`DIRECT_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`ADMIN_PASSWORD`、`CRON_SECRET`。
3. 本地确认 migration 已执行到目标数据库。
4. 推送到 GitHub 后由 Vercel 自动构建部署。
5. 部署后检查 `/login`、`/search`、`/recommendations`、`/admin/login` 等关键页面。

## Vercel Cron

项目根目录的 `vercel.json` 已配置每天执行一次维护检查：

```json
{
  "crons": [
    {
      "path": "/api/admin/maintenance",
      "schedule": "0 2 * * *"
    }
  ]
}
```

时间为 UTC。Vercel 在设置 `CRON_SECRET` 后会自动用 `Authorization: Bearer <CRON_SECRET>` 调用 Cron endpoint。修改 `vercel.json` 或 Vercel 环境变量后需要重新部署。

## Production Troubleshooting

- 健康检查地址：`/api/health`。
- 正常时会返回 `ok: true`、`database: "ok"`、`authEnv: "ok"` 和核心数据量。
- 数据库不可达时会返回 `ok: false`、`database: "error"`、`message: "Database unavailable"`，不会暴露真实连接串或 secret。
- Vercel 必须配置：`DATABASE_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`ADMIN_PASSWORD`。
- 如果启用 Cron，必须配置 `CRON_SECRET`。
- 如果使用 Prisma migration，建议同时配置 `DIRECT_URL`。
- 修改 Vercel 环境变量后必须 Redeploy，新变量才会进入运行时。
- Prisma `P1001 Can't reach database server` 通常说明 `DATABASE_URL` 错误、数据库暂停、网络不可达或连接池地址不适合当前运行环境。
- 查看错误：进入 Vercel Project → Logs，按请求路径筛选 `/api/health`、`/api/admin/maintenance` 或具体页面路径。
- 后台维护页：登录 `/admin/login` 后访问 `/admin/maintenance`，点击“立即执行维护检查”查看数据库连接和数据质量状态。

## 常用命令

```bash
npm run dev
npm run lint
npm run build
npm run prisma:validate
npm run prisma:generate
npm run prisma:studio
```

## 后续优化方向

- 接入合规的真实职位数据来源或自有职位库同步任务
- 增加更细粒度的用户权限与后台角色
- 优化 Match Score 权重和可解释性
- 增加职位推荐的反馈机制
- 为搜索、导入、后台管理补充自动化测试
- 增加邮件通知或申请提醒
