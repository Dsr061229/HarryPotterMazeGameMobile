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

-- 公开读取排行榜。
DROP POLICY IF EXISTS "public_read" ON users;
CREATE POLICY "public_read" ON users FOR SELECT USING (true);

-- GitHub Pages 临时直连兜底：允许普通玩家注册。
-- 这只适合小规模、非敏感排行榜；长期建议改为只走 Cloudflare Worker。
DROP POLICY IF EXISTS "anon_insert_fallback" ON users;
CREATE POLICY "anon_insert_fallback" ON users
  FOR INSERT TO anon
  WITH CHECK (
    uid ~ '^[A-Za-z0-9]{2,20}$'
    AND wins = 0
    AND losses = 0
    AND total_score = 0
    AND banned = false
  );

-- 允许未封禁用户累计战绩，但不允许前端解除封禁或改 uid。
DROP POLICY IF EXISTS "anon_update_score_fallback" ON users;
CREATE POLICY "anon_update_score_fallback" ON users
  FOR UPDATE TO anon
  USING (banned = false)
  WITH CHECK (banned = false);

-- 部署 Worker 并写入 DEFAULT_API_BASE 后，如果想关闭前端直连写库，
-- 可以执行下面两句删除 anon 写入策略：
--
-- DROP POLICY IF EXISTS "anon_insert_fallback" ON users;
-- DROP POLICY IF EXISTS "anon_update_score_fallback" ON users;
