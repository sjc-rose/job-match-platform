# 智能招聘匹配平台

使用 Next.js、TypeScript、App Router 和 Tailwind CSS 构建的招聘匹配平台。

## 本地运行

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

打开浏览器访问：

```text
http://localhost:3000
```

## 主要文件

- `app/page.tsx`：首页
- `app/layout.tsx`：页面布局和元信息
- `app/globals.css`：全局样式和 Tailwind CSS 引入
- `tailwind.config.ts`：Tailwind CSS 配置
- `postcss.config.mjs`：PostCSS 配置

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run prisma:validate
npm run prisma:generate
```

## 数据库

项目已加入 Prisma 和 PostgreSQL schema，后续可连接 Supabase PostgreSQL。

本地配置步骤：

1. 复制 `.env.example` 为 `.env.local`
2. 在 `.env.local` 中填写 `DATABASE_URL`
3. 验证 Prisma schema：

```bash
npm run prisma:validate
```

4. 连接数据库后，可按需生成 Prisma Client 或推送 schema：

```bash
npm run prisma:generate
npm run db:push
```

当前版本只完成数据库基础架构，现有收藏职位功能仍使用浏览器 `localStorage`，没有接真实招聘 API、数据库读写或用户登录。

## 说明

当前只完成本地项目初始化，尚未上传 GitHub。
