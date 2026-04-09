# bg-remover 架构分析

## 1. 项目定位

这是一个 AI 抠图 Web 应用，核心目标是：

- 游客可直接上传图片去背景
- 登录用户有更高额度
- 不同套餐有不同月额度和文件大小限制
- 有账号中心、使用记录、统计能力
- 部署目标是 Cloudflare Pages + Pages Functions + D1
- 核心图像处理依赖第三方 API：优先 Clipdrop，兜底 Remove.bg

本质上它是：

> 一个基于 Next.js 的前端站点 + Cloudflare Serverless API + D1 配额/用户数据库 + 第三方 AI 图像能力整合层

## 2. 总体架构

```text
[Browser / User]
    ↓
[Next.js App Router 前端页面]
    ↓ fetch /api/*
[Cloudflare Pages Functions API]
    ↓
 ├─ [Google OAuth 会话]
 ├─ [D1 数据库：用户/用量/订单/积分]
 └─ [第三方抠图 API：Clipdrop / Remove.bg]
    ↓
[返回 PNG 结果或配额信息]
```

## 3. 前端架构

### 3.1 页面入口：`src/app/page.tsx`

承担三件事：

1. 营销首页
2. 工具入口
3. 认证入口

这是典型 SaaS 首页打法。

### 3.2 核心交互组件：`src/components/BgRemover.tsx`

状态机：

```ts
"idle" | "processing" | "done" | "error"
```

负责：

- 上传文件
- 校验格式/大小
- 请求 `/api/quota`
- 请求 `/api/remove-bg`
- 显示处理中动画
- 显示 before/after 对比滑块
- 下载结果 PNG
- 错误态展示

### 3.3 账户页：`AccountPageClient.tsx`

负责展示：

- 用户基本资料
- 当前 plan
- 额度使用情况
- 剩余额度
- credit balance
- 最近使用记录
- 升级入口

### 3.4 定价模型：`src/lib/pricing.ts`

前端有完整套餐展示配置：guest / free / pro / business。

## 4. 后端/API 架构

后端采用 Cloudflare Pages Functions。

### 4.1 `/api/remove-bg`

处理链路：

1. 识别用户身份
2. 确定 plan
3. 额度校验
4. 文件校验
5. 调用第三方抠图能力
6. 记账 / 记录 usage
7. 返回 PNG 二进制

### 4.2 `/api/quota`

给前端提供当前用户的套餐和可用额度。

### 4.3 `/api/stats`

提供：

- 总处理次数
- 总用户数

### 4.4 认证层：`functions/api/auth/*`

实现：

- Google OAuth
- HMAC session cookie
- 用户落库

## 5. 数据库架构

D1 中的核心表：

- `users`
- `usage_logs`
- `guest_usage_logs`
- `payment_orders`
- `user_credits`

## 6. 配额和计费设计

后端真实套餐规则在 `functions/api/plan-config.js`：

- guest: 5/月，10MB
- free: 20/月，15MB
- pro: 200/月，25MB
- business: 800/月，50MB

这是按月配额，不是按天。

## 7. 部署架构

- 前端：Next.js App Router，静态导出到 `out`
- 后端：Cloudflare Pages Functions
- 数据库：Cloudflare D1
- 发布：`pnpm build` + `wrangler pages deploy out`

## 8. 设计优点

- 职责分层较清楚
- 产品化意识强
- Cloudflare 适配合理
- 游客机制可用
- 第三方能力可切换

## 9. 当前风险与问题

### 9.1 额度语义命名不一致

账户页里有 `today_used` / `daily_limit`，但后端实际逻辑是月额度。

### 9.2 `remove-bg.js` 业务耦合偏重

这个接口同时承担：

- 身份识别
- 套餐判定
- 过期降级
- 额度校验
- credits 判定
- 文件校验
- 第三方 API 调用
- 记账
- 返回结果

### 9.3 支付体系只预埋了一半

schema 有订单和积分表，但支付闭环未完全展开。

### 9.4 游客额度防刷能力有限

目前主要依赖 guest cookie。

### 9.5 日志粒度偏粗

目前主要记录成功使用，不利于排障和供应商分析。

### 9.6 没有对象存储层

短期简单省钱，但会限制历史记录、异步任务、重新下载等能力。

### 9.7 认证体系轻量但扩展性一般

适合 MVP，不一定适合长期复杂账号体系。

## 10. 总结判断

这是一个面向抠图场景的轻量 SaaS MVP，架构选择偏务实，前后端边界基本合理，商业化骨架已经搭好，但后端业务层和命名一致性还需要整理。
