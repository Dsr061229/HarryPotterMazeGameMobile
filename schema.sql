-- 用户表
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 安全默认：公开读取，写入由后端 SUPABASE_SERVICE_KEY 完成。
DROP POLICY IF EXISTS "public_read" ON users;
CREATE POLICY "public_read" ON users FOR SELECT USING (true);

-- 不要给 anon/authenticated 开放 INSERT/UPDATE/DELETE。
-- GitHub Pages 前端只调用 Cloudflare Worker；注册、战绩、封禁和删除都由
-- Worker 使用 SUPABASE_SERVICE_KEY 完成。
--
-- 如果以前为了前端直连开启过 anon 写入策略，部署 Worker 后请删除它们：
-- DROP POLICY IF EXISTS "anon_insert_fallback" ON users;
-- DROP POLICY IF EXISTS "anon_update_score_fallback" ON users;
