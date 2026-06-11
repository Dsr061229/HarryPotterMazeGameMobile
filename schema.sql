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

-- 不要默认给 anon/authenticated 开放 INSERT/UPDATE/DELETE。
-- 否则排行榜和封禁状态都可能被客户端篡改。

-- 临时直连兜底模式：
-- 如果暂时只有 GitHub Pages，没有稳定后端，并且数据不敏感，
-- 可以手动取消下面两条策略的注释，让前端 Supabase REST 兜底能注册和写战绩。
-- 长期建议部署后端代理后再删除这两条策略。
--
-- CREATE POLICY "anon_insert_fallback" ON users
--   FOR INSERT TO anon
--   WITH CHECK (
--     uid ~ '^[A-Za-z0-9]{2,20}$'
--     AND wins = 0
--     AND losses = 0
--     AND total_score = 0
--     AND banned = false
--   );
--
-- CREATE POLICY "anon_update_score_fallback" ON users
--   FOR UPDATE TO anon
--   USING (banned = false)
--   WITH CHECK (banned = false);
