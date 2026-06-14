# HarryPotterMazeGameMobile

暮篱迷宫移动端 Web 游戏。前端使用原生 JS + Three.js，部署在 GitHub Pages；生产后端使用 Cloudflare Workers 代理 Supabase，长期免费额度足够小规模游戏使用。

## 当前架构

- 前端：GitHub Pages。
- 后端：Cloudflare Workers，源码在 `worker/index.mjs`。
- 数据库：Supabase PostgreSQL。
- 云端兜底：优先请求 Worker；如果 Worker 未部署或暂时不可达，普通玩家登录、战绩、统计和排行榜会尝试 Supabase anon REST。
- 本地兜底：如果 Worker 和 Supabase 都不可达，战绩先进入 `localStorage.maze_pending_results`，下次登录或打开统计时补传。

Supabase `service_role` key 只能放在 Cloudflare Worker secret 里，不能写进前端。当前前端只暴露 anon key，用于小规模游戏的临时可用性兜底；长期仍建议部署 Worker。

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

执行 `schema.sql` 创建 `users` 表。当前为了 GitHub Pages 在没有 Worker 时也能用，保留受限的 anon 插入和战绩更新策略。

注意：anon 写入策略能提高连接成功率，但无法阻止懂接口的人伪造成绩。等 Cloudflare Worker 部署稳定后，可以删除 anon 写入策略，只让 Worker 使用 `SUPABASE_SERVICE_KEY` 写库。

## API 安全

- 普通玩家登录后，Worker 返回用户 token；战绩写入必须带 `x-user-token`。
- 管理员登录后，Worker 返回短期管理员 token；封禁、删除、用户列表必须带 `x-admin-token`。
- Worker 使用 CORS allowlist，只允许 GitHub Pages 和本地开发地址调用。
- 如果没有 Worker，普通玩家会退回 Supabase anon REST；管理员功能仍然必须使用后端。

## 检查

```bash
npm run check
```

该命令会检查 Express、本地入口、前端脚本和 Cloudflare Worker 的 JavaScript 语法。
