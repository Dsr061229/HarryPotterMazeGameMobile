# HarryPotterMazeGameMobile

暮篱迷宫移动端 Web 游戏。前端使用原生 JS + Three.js，数据优先走 Express API，再自动降级到 Supabase REST，最后落到 localStorage 离线队列。

## 推荐部署

- 前端：GitHub Pages。
- 数据：Supabase PostgreSQL。
- 后端：有免费额度的平台都可以，优先 Cloudflare Workers/Pages Functions、Render、Deno Deploy 这类不强依赖信用卡的方案。

当前前端支持三层数据链路：

1. 配置了 `?api=https://your-api.example.com` 时，优先访问后端 `/api/*`。
2. 后端未配置或超时时，普通玩家登录、战绩、统计、排行榜会尝试 Supabase REST 兜底。
3. Supabase 也失败时，战绩写入本地 `maze_pending_results` 队列；下次登录或打开统计时自动补传。

管理员登录、封禁、删除仍然只允许通过后端 API。

## 本地运行

1. 安装依赖：`npm install`
2. 启动 API：`npm start`
3. 打开 `index.html` 或用静态服务器访问前端。

本地前端默认请求 `http://localhost:8080/api/*`。生产环境可用查询参数配置一次后端地址：

`https://dsr061229.github.io/HarryPotterMazeGameMobile/?api=https://your-api.example.com`

前端会保存到 `localStorage.maze_api_base`。

## 环境变量

- `SUPABASE_URL`：Supabase REST 地址，默认指向当前项目。
- `SUPABASE_SERVICE_KEY`：服务端写数据库使用，生产环境必须配置。
- `ADMIN_PW_HASH`：管理员密码 bcrypt hash。
- `ADMIN_TOKEN_SECRET`：管理员短期 token 签名密钥，生产环境必须配置为独立随机值。
- `PORT`：API 端口，默认 `8080`。

## 数据库权限

执行 `schema.sql` 创建 `users` 表。安全默认是只开放公开读取，注册和写战绩通过后端完成。

如果暂时没有稳定后端，又希望 GitHub Pages 直连 Supabase 写入，请在 Supabase SQL Editor 手动执行 `schema.sql` 末尾的“临时直连兜底模式”策略。这个模式适合当前小规模、非敏感数据，但任何人都能用 anon key 写战绩，长期更推荐后端代理。

## 检查

运行 `npm run check` 做基础 JavaScript 语法检查。
