# HarryPotterMazeGameMobile

暮篱迷宫移动端 Web 游戏。前端使用原生 JS + Three.js，部署在 GitHub Pages；生产后端使用 Cloudflare Workers 代理 Supabase，长期免费额度足够小规模游戏使用。

## 当前架构

- 前端：GitHub Pages。
- 后端：Cloudflare Workers，源码在 `worker/index.mjs`。
- 数据库：Supabase PostgreSQL。
- 本地兜底：如果 Worker 暂时不可达，战绩先进入 `localStorage.maze_pending_results`，下次登录或打开统计时补传。

生产环境不要让前端直连写 Supabase。Supabase `service_role` key 只能放在 Cloudflare Worker secret 里。

## 本地运行

1. 安装依赖：`npm install`
2. 本地 Express API：`SUPABASE_SERVICE_KEY=你的service_role_key npm start`
3. 打开 `index.html` 或用静态服务器访问前端。

本地前端默认请求 `http://localhost:8080/api/*`。

## Cloudflare Worker 部署

第一次部署：

```bash
npx wrangler login
npm run worker:secret -- SUPABASE_SERVICE_KEY
npm run worker:secret -- ADMIN_PASSWORD
npm run worker:secret -- ADMIN_TOKEN_SECRET
npm run worker:deploy
```

说明：

- `SUPABASE_SERVICE_KEY`：Supabase Project Settings 里的 `service_role` key，不要用 anon key。
- `ADMIN_PASSWORD`：管理员 `Dsr` 登录密码，作为 Cloudflare 加密 secret 保存。
- `ADMIN_TOKEN_SECRET`：随机长字符串，用于签发管理员和用户短期 token。

部署成功后，Cloudflare 会给出类似：

`https://harry-potter-maze-api.<你的workers子域>.workers.dev`

把这个地址写入 `src/main.js` 的 `DEFAULT_API_BASE`，再推送 GitHub Pages。临时测试也可以访问：

`https://dsr061229.github.io/HarryPotterMazeGameMobile/?api=https://harry-potter-maze-api.<你的workers子域>.workers.dev`

前端会把该地址保存到 `localStorage.maze_api_base`。

## 数据库权限

执行 `schema.sql` 创建 `users` 表。推荐 RLS 只开放公开读取，注册、写战绩、封禁和删除全部通过 Worker 使用 `SUPABASE_SERVICE_KEY` 完成。

如果以前启用过 anon 写入策略，部署 Worker 后建议删除这些策略，避免客户端绕过后端篡改排行榜。

## API 安全

- 普通玩家登录后，Worker 返回用户 token；战绩写入必须带 `x-user-token`。
- 管理员登录后，Worker 返回短期管理员 token；封禁、删除、用户列表必须带 `x-admin-token`。
- Worker 使用 CORS allowlist，只允许 GitHub Pages 和本地开发地址调用。
- 前端不再默认直连 Supabase 写库。

## 检查

```bash
npm run check
```

该命令会检查 Express、本地入口、前端脚本和 Cloudflare Worker 的 JavaScript 语法。
