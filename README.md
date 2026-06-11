# HarryPotterMazeGameMobile

暮篱迷宫移动端 Web 游戏，前端使用 Three.js，后端使用 Express 代理 Supabase 数据访问。

当前推荐部署形态：

- 前端：GitHub Pages。
- 后端：优先放到 Cloudflare Workers/Pages Functions 一类的免费边缘函数；如果暂时没有后端，前端会自动进入 localStorage 离线模式。
- 数据：Supabase PostgreSQL。生产环境不要让前端直连写库。

## 本地运行

1. 安装依赖：`npm install`
2. 启动 API：`npm start`
3. 用静态服务器打开 `index.html`，或直接用浏览器打开文件进行本地调试。

本地前端会请求 `http://localhost:8080/api/*`。

生产环境默认不硬编码后端地址。部署后可用查询参数配置一次：

`https://dsr061229.github.io/HarryPotterMazeGameMobile/?api=https://your-api.example.com`

前端会把该地址保存到 `localStorage.maze_api_base`。没有配置 API 时，普通玩家仍可离线游玩和本地记录战绩，但排行榜、封禁、删除等管理能力不可用。

## 环境变量

- `SUPABASE_URL`：Supabase REST 地址，默认指向当前项目。
- `SUPABASE_SERVICE_KEY`：服务端写数据库使用，生产环境必须配置。
- `ADMIN_PW_HASH`：管理员密码 bcrypt hash。
- `ADMIN_TOKEN_SECRET`：管理员短期 token 签名密钥，生产环境必须配置为独立随机值。
- `PORT`：API 端口，默认 `8080`。

## 数据库权限

执行 `schema.sql` 创建 `users` 表。RLS 只开放公开读取，注册、记录结果、封禁和删除都应通过服务端完成。

## 检查

运行 `npm run check` 做基础 JavaScript 语法检查。
