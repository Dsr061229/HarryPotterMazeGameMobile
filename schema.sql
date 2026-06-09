-- 用户表
CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  rank_score INTEGER DEFAULT 0,
  last_health INTEGER DEFAULT 100,
  banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许任何人读取
CREATE POLICY "public_read" ON users FOR SELECT USING (true);

-- 允许任何人插入（注册）
CREATE POLICY "public_insert" ON users FOR INSERT WITH CHECK (true);

-- 允许任何人更新（对局记录）
CREATE POLICY "public_update" ON users FOR UPDATE USING (true);
