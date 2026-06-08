const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'data.json') : path.join(__dirname, 'data.json');
const ADMIN_PW_HASH = '$2a$10$18ET.WigOb24EdGlSHQ/Z.Nf2G7S50reC.LF6xUaEgqWhg225oh8C'; // 061229

app.use(express.json());
app.use(express.static(__dirname));

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (e) { return { users: {} }; }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ===== 用户 API =====

// 登录/注册
app.post('/api/login', (req, res) => {
  const { uid } = req.body;
  if (!uid || !/^[a-zA-Z0-9]{2,20}$/.test(uid)) {
    return res.status(400).json({ error: '无效的 UID' });
  }
  const db = loadData();
  if (db.users[uid] && db.users[uid].banned) {
    return res.status(403).json({ error: '该账号已被禁用' });
  }
  const isNew = !db.users[uid];
  if (isNew) {
    db.users[uid] = { wins: 0, losses: 0, totalScore: 0, createdAt: Date.now(), banned: false };
  }
  saveData(db);
  res.json({ ok: true, isNew, user: db.users[uid] });
});

// 管理员登录
app.post('/api/admin/login', (req, res) => {
  const { uid, password } = req.body;
  if (uid !== 'Dsr') return res.status(401).json({ error: '非管理员' });
  const valid = bcrypt.compareSync(password, ADMIN_PW_HASH);
  if (!valid) return res.status(401).json({ error: '密码错误' });
  res.json({ ok: true, token: ADMIN_PW_HASH });
});

// 记录对局结果
app.post('/api/result', (req, res) => {
  const { uid, won, score } = req.body;
  if (!uid) return res.status(400).json({ error: '缺少 UID' });
  const db = loadData();
  if (!db.users[uid]) {
    db.users[uid] = { wins: 0, losses: 0, totalScore: 0, createdAt: Date.now(), banned: false };
  }
  const u = db.users[uid];
  if (u.banned) return res.status(403).json({ error: '已禁用' });
  if (won) u.wins++; else u.losses++;
  u.totalScore += (score || 0);
  saveData(db);
  res.json({ ok: true });
});

// 用户战绩
app.get('/api/stats/:uid', (req, res) => {
  const { uid } = req.params;
  if (!uid) return res.status(400).json({ error: '缺少 UID' });
  const db = loadData();
  const u = db.users[uid];
  if (!u) return res.status(404).json({ error: '用户不存在' });
  res.json({ uid, wins: u.wins, losses: u.losses, totalScore: u.totalScore });
});

// 排行榜
app.get('/api/leaderboard', (req, res) => {
  const db = loadData();
  const list = [];
  for (const uid in db.users) {
    const u = db.users[uid];
    if (!u.banned) list.push({ uid, score: u.totalScore || 0, wins: u.wins || 0 });
  }
  list.sort((a, b) => b.score - a.score);
  res.json(list.slice(0, 50));
});

// ===== 管理 API（需 token） =====

function checkAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_PW_HASH) return res.status(401).json({ error: '无权限' });
  next();
}

app.get('/api/admin/users', checkAdmin, (req, res) => {
  const db = loadData();
  const list = [];
  for (const uid in db.users) {
    const u = db.users[uid];
    list.push({ uid, wins: u.wins, losses: u.losses, totalScore: u.totalScore, banned: u.banned });
  }
  res.json(list);
});

app.post('/api/admin/toggleban', checkAdmin, (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: '缺少 UID' });
  const db = loadData();
  if (db.users[uid]) {
    db.users[uid].banned = !db.users[uid].banned;
    saveData(db);
  }
  res.json({ ok: true });
});

app.post('/api/admin/remove', checkAdmin, (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: '缺少 UID' });
  const db = loadData();
  delete db.users[uid];
  saveData(db);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Maze Game Server running on port ${PORT}`);
  // 首次运行时初始化管理员密码哈希
  if (!fs.existsSync(DATA_FILE)) {
    saveData({ users: {} });
  }
});
