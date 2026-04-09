# bg-remover 源码阅读地图

## 一、先看这 6 个文件，10 分钟内抓全局

### 1. `README.md`
重点：
- 技术栈
- 部署目标
- 环境变量
- D1 / Cloudflare / Google OAuth 依赖
- 产品功能列表

### 2. `package.json`
重点：
- scripts
- dependencies

### 3. `src/app/page.tsx`
重点：
- 页面结构
- 动态加载 `BgRemover`
- AuthButton 怎么挂进去
- 首页如何同时承担营销页和工具页

### 4. `src/components/BgRemover.tsx`
重点：
- state 设计
- `fetchQuota`
- `processImage`
- 错误处理
- 下载逻辑
- before/after 对比 UI

### 5. `functions/api/remove-bg.js`
重点：
- session/user 判定
- guest 判定
- planCode 来源
- 过期套餐降级
- quota 检查
- credits fallback
- 第三方 API 路由
- usage 记录

### 6. `db/schema.sql`
重点：
- users
- usage_logs
- guest_usage_logs
- payment_orders
- user_credits

## 二、第二层阅读：理解规则从哪来

### 7. `functions/api/plan-config.js`
后端真实规则源。

### 8. `functions/api/usage.js`
配额系统底座，负责：
- 月份范围计算
- user usage 统计
- guest usage 统计
- guest id / cookie

### 9. `functions/api/quota.js`
把复杂逻辑整理成统一 quota 返回。

### 10. `src/lib/pricing.ts`
前端展示用 pricing 配置。

## 三、第三层阅读：理解认证系统

### 11. `functions/api/auth/_lib.js`
重点：
- Google OAuth URL 构造
- code exchange
- profile fetch
- session token 签名
- cookie 读写

### 12. `functions/api/auth/db.js`
重点：
- upsertUser
- getUserByGoogleSub
- getUserWithSession

## 四、第四层阅读：理解商业化骨架

### 13. `src/components/AccountPageClient.tsx`
重点：
- 当前套餐
- 使用记录
- credits
- upgrade 引导
- payment success 提示

注意：这里有 `today_used` / `daily_limit` 命名，但后端其实是月额度。

### 14. `docs/PRD.md`
看产品目标和范围。

### 15. `docs/pricing-strategy.md`
看商业化逻辑。

## 五、外围补充文件

### 16. `functions/api/stats.js`
站点统计指标。

### 17. `next.config.ts`
确认 Next 导出和 Cloudflare 兼容策略。

### 18. `.github/workflows/deploy.yml`
查看 CI/CD 发布流程。

### 19. `scripts/update-cloudflare-env.sh`
查看环境变量维护方式。

### 20. `.env.example`
确认运行依赖的 secrets。

## 六、推荐阅读顺序

```text
1. README.md
2. package.json
3. src/app/page.tsx
4. src/components/BgRemover.tsx
5. functions/api/remove-bg.js
6. db/schema.sql
7. functions/api/plan-config.js
8. functions/api/usage.js
9. functions/api/quota.js
10. functions/api/auth/_lib.js
11. functions/api/auth/db.js
12. src/components/AccountPageClient.tsx
13. src/lib/pricing.ts
14. docs/PRD.md
15. docs/pricing-strategy.md
```

如果只看最关键三份：

```text
1. src/components/BgRemover.tsx
2. functions/api/remove-bg.js
3. db/schema.sql
```

## 七、带着问题去看代码

### 看 `BgRemover.tsx`
- 用户完整操作路径是什么？
- 前端做了哪些校验？
- 哪些校验必须依赖后端？
- UI 状态切换是否清晰？

### 看 `remove-bg.js`
- 真正业务规则写在哪？
- 套餐与额度怎么判定？
- 游客和登录用户的分流有没有漏洞？
- 哪些逻辑已经太胖了？

### 看 `schema.sql`
- 产品想长期保存哪些业务事实？
- 是否已经具备付费产品骨架？
- 哪些表现在还没被完整用起来？

### 看 auth 文件
- session 是谁签发的？
- session 怎么校验？
- 用户身份如何映射到 DB？
- 方案适不适合 Cloudflare？

### 看 pricing / quota
- 展示规则和真实规则是否一致？
- 月额度 / 日额度 / credits 有没有冲突？

## 八、文件重要性分级

### 核心文件
- `src/components/BgRemover.tsx`
- `functions/api/remove-bg.js`
- `db/schema.sql`

### 次核心文件
- `functions/api/usage.js`
- `functions/api/quota.js`
- `functions/api/auth/_lib.js`
- `functions/api/plan-config.js`

### 可后看文件
- `src/components/AccountPageClient.tsx`
- `src/lib/pricing.ts`
- `docs/PRD.md`
- `docs/pricing-strategy.md`

### 外围文件
- `next.config.ts`
- `.github/workflows/deploy.yml`
- `scripts/update-cloudflare-env.sh`

## 九、如果你要接手改项目，先盯这 5 点

1. `remove-bg.js` 是否还能继续堆逻辑
2. quota 语义到底是不是月额度，统一命名
3. auth 回调 / session 是否完整
4. account 相关接口是否和前端字段对齐
5. 支付表虽然有了，但支付闭环是否真的可跑

## 十、最省力的阅读策略

第一遍：
- `BgRemover.tsx`
- `remove-bg.js`

第二遍：
- `plan-config.js`
- `usage.js`
- `quota.js`

第三遍：
- `auth/_lib.js`
- `auth/db.js`

第四遍：
- `schema.sql`
- `AccountPageClient.tsx`
- `pricing.ts`

这样能最快理解：上传链路、规则系统、认证系统、商业化骨架。
