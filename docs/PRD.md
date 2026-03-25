# Image Background Remover — MVP 需求文档

## 1. 产品概述

| 项目 | 内容 |
|------|------|
| 产品名称 | BGRemover |
| 核心关键词 | image background remover |
| 一句话定位 | 免费在线 AI 抠图工具，上传即用，秒出透明 PNG |
| 目标用户 | 电商卖家、自媒体创作者、设计师、普通用户 |
| 核心价值 | 零门槛（无需注册）、速度快、效果好 |

---

## 2. 技术架构

| 层级 | 选型 |
|------|------|
| 前端框架 | Next.js (App Router) + TypeScript |
| 样式 | Tailwind CSS v4 |
| 抠图引擎 | Remove.bg API |
| 部署 | Cloudflare Pages |
| 存储 | 无（内存处理，不落盘） |
| CDN | Cloudflare 自带 |

**架构图：**

```
用户浏览器
  ↓ 上传图片
Cloudflare Pages (Next.js)
  ↓ 转发图片
Remove.bg API
  ↓ 返回透明 PNG
Cloudflare Pages
  ↓ 返回给浏览器
用户浏览器（内存中展示/下载）
```

---

## 3. MVP 功能清单

### P0 — 必须有（上线最低要求）

| # | 功能 | 描述 | 验收标准 |
|---|------|------|----------|
| 1 | 图片上传 | 支持拖拽 + 点击上传 | 支持 PNG/JPG/WebP，≤25MB |
| 2 | AI 抠图 | 调用 Remove.bg API 去除背景 | 返回透明 PNG，处理时间 <10s |
| 3 | 结果预览 | Before/After 对比滑块 | 可左右拖动对比原图与结果 |
| 4 | 下载结果 | 一键下载透明 PNG | 文件名含 `removed-bg`，格式为 PNG |
| 5 | 重新上传 | 处理完成后可上传新图 | 点击"New Image"回到上传状态 |
| 6 | 错误处理 | 上传失败/API 异常友好提示 | 非图片文件、超大文件、API 报错均有提示 |
| 7 | 响应式布局 | 移动端 + 桌面端适配 | 主流设备（375px~1440px）可正常使用 |
| 8 | SEO 基础 | Meta 标签 + OG + 结构化数据 | Google Rich Results 测试通过 |

### P1 — 应该有（上线后一周内迭代）

| # | 功能 | 描述 |
|---|------|------|
| 9 | 多图批量处理 | 一次上传多张，逐张处理 |
| 10 | 自定义背景色 | 提供白色/自定义颜色背景选项 |
| 11 | 图片裁剪 | 抠图后可裁剪/调整尺寸 |
| 12 | 使用次数限制 | 基于 IP/Cookie 的每日免费次数限制（防刷） |
| 13 | Google Analytics | 接入 GA4 追踪用户行为 |
| 14 | Sitemap + robots.txt | 自动生成，提交 Search Console |

### P2 — 锦上添花（按数据驱动决策）

| # | 功能 | 描述 |
|---|------|------|
| 15 | 用户注册/登录 | 邮箱注册，解锁更多次数 |
| 16 | 付费订阅 | 高清下载 / 无限次数 / API 接口 |
| 17 | 历史记录 | 登录用户可查看近期处理记录 |
| 18 | 更多 AI 功能 | 背景替换、图片增强、物体移除 |
| 19 | 多语言 | 英文 + 中文 + 日文等 |

---

## 4. 页面结构

```
/                   ← 首页（上传 + 工具 + SEO 内容）
/api/remove-bg      ← API 路由（代理 Remove.bg）
/blog               ← [P1] SEO 博客（长尾词内容）
/pricing            ← [P2] 定价页
/login              ← [P2] 登录页
```

### 首页模块（从上到下）

1. **Header** — Logo + 导航（How it works / FAQ）
2. **Hero** — 标题 + 副标题 + 上传区域
3. **How it works** — 三步流程图（上传 → AI处理 → 下载）
4. **Use Cases** — 四个使用场景卡片
5. **FAQ** — 5 个常见问题（含 SEO 长尾词）
6. **Footer** — 版权信息

---

## 5. SEO 策略

### 目标关键词矩阵

| 优先级 | 关键词 | 月搜索量（估） | 对应页面 |
|--------|--------|---------------|----------|
| 主词 | image background remover | 90K+ | 首页 |
| 主词 | remove background from image | 60K+ | 首页 |
| 长尾 | remove background from photo free | 20K+ | 首页/Blog |
| 长尾 | transparent background maker | 15K+ | Blog |
| 长尾 | png background remover | 10K+ | Blog |
| 长尾 | how to remove background in photoshop | 30K+ | Blog |
| 长尾 | product photo background remover | 8K+ | Blog |

### 技术 SEO 清单

- [x] 语义化 HTML（h1/h2/h3 层级正确）
- [x] JSON-LD 结构化数据（SoftwareApplication）
- [x] Open Graph + Twitter Card
- [x] Meta description 含主关键词
- [ ] Sitemap.xml（P1）
- [ ] robots.txt（P1）
- [ ] Canonical URL
- [ ] 图片 alt 标签优化
- [ ] Core Web Vitals 优化（LCP < 2.5s）

---

## 6. API 设计

### POST /api/remove-bg

**Request:**
```
Content-Type: multipart/form-data
Body: image (File, ≤25MB, image/png|jpeg|webp)
```

**Response (成功):**
```
Status: 200
Content-Type: image/png
Body: <binary PNG data>
```

**Response (失败):**
```json
{
  "error": "Background removal failed"
}
```

### 限制

- Remove.bg 免费额度：50 次/月（预览质量）
- 付费 plan：$0.20/张（高清）起
- API 超时：30s

---

## 7. 非功能需求

| 指标 | 目标 |
|------|------|
| 首屏加载 | < 2s (Cloudflare CDN) |
| 抠图处理 | < 10s（取决于图片大小和 Remove.bg） |
| 可用性 | 99.9%（Cloudflare Pages SLA） |
| 隐私 | 图片仅在内存中处理，不持久化存储 |
| 浏览器支持 | Chrome/Safari/Firefox/Edge 最近两个版本 |
| 移动适配 | iOS Safari + Android Chrome |

---

## 8. 里程碑

| 阶段 | 内容 | 时间 |
|------|------|------|
| **M0 — 代码完成** | P0 功能开发完毕，本地可运行 | ✅ 已完成 |
| **M1 — 部署上线** | Cloudflare Pages 部署，绑定域名，配置 API Key | 1 天 |
| **M2 — SEO 冷启动** | 提交 Search Console，发布 3 篇 Blog | 1 周 |
| **M3 — P1 迭代** | 批量处理、防刷限制、GA4 | 2 周 |
| **M4 — 变现测试** | 付费功能上线，观察转化 | 1 个月 |

---

## 9. 风险与应对

| 风险 | 影响 | 应对策略 |
|------|------|----------|
| Remove.bg 免费额度不够 | 用户体验差 | 初期控制推广节奏；流量起来后升级付费 plan 或切换自建模型 |
| Remove.bg API 不稳定 | 服务中断 | 增加备选 API（Clipdrop）作降级方案 |
| SEO 竞争激烈 | 排名上不去 | 走长尾词 + Blog 内容矩阵 + 工具外链策略 |
| 被恶意刷量 | API 费用暴增 | P1 加 IP 限频 + Cloudflare WAF 规则 |

---

*文档版本：v1.0 | 更新时间：2026-03-25*
