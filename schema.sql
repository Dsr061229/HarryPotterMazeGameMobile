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

-- 公开读取：排行榜 / 战绩查询继续走 anon SELECT，保证即使 Worker 临时不可达
-- 也能看到排行榜，稳定可玩。
DROP POLICY IF EXISTS "public_read" ON users;
CREATE POLICY "public_read" ON users FOR SELECT USING (true);

-- ===== 后端已锁死：移除 anon 直接写库的兜底策略 =====
-- 现在所有写入（注册 / 战绩 / 封禁）必须经过 Cloudflare Worker，
-- 由 Worker 用 service_role key + token 鉴权写入；前端只持有 anon key，
-- 只能读、不能写，无法伪造成绩。
-- Worker 临时不可达时，战绩会先进入 localStorage 离线队列，恢复后自动补传。
DROP POLICY IF EXISTS "anon_insert_fallback" ON users;
DROP POLICY IF EXISTS "anon_update_score_fallback" ON users;
