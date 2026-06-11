-- 用户表
CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许任何人读取
CREATE POLICY "public_read" ON users FOR SELECT USING (true);

-- 写入、更新、删除应由后端使用 SUPABASE_SERVICE_KEY 完成。
-- 不要给 anon/authenticated 角色开放 INSERT/UPDATE/DELETE，否则排行榜和封禁都可被客户端篡改。
