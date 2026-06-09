const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 8080;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://psadnnnoyeqinuixwumj.supabase.co/rest/v1';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_iwAnf0X2uoGzL_y8gasb0A_sMII0EVm';
const ADMIN_PW_HASH = process.env.ADMIN_PW_HASH || '$2a$10$18ET.WigOb24EdGlSHQ/Z.Nf2G7S50reC.LF6xUaEgqWhg225oh8C';

app.use(cors({
  origin: [
    'https://dsr061229.github.io',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'https://harrypotter-maze-game.fly.dev'
  ],
  credentials: true
}));
app.use(express.json());

// 静态文件（直接访问 Fly.io 时也能玩）
app.use(express.static(__dirname));

// 通用 Supabase REST 调用
function supaFetch(method, path, body) {
  var headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
    headers['Prefer'] = 'return=representation';
  }
  var opts = { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined };
  return fetch(SUPABASE_URL + path, opts).then(function (r) {
    if (!r.ok) throw new Error('Supabase ' + r.status + ': ' + path);
    var cl = r.headers.get('content-length');
    return cl === '0' ? null : r.json();
  });
}

// ===== 用户 API =====

// 登录/注册
app.post('/api/auth', async function (req, res) {
  try {
    var uid = req.body.uid;
    if (!uid || !/^[a-zA-Z0-9]{2,20}$/.test(uid)) {
      return res.status(400).json({ error: '无效的UID' });
    }
    var data = await supaFetch('GET', '/users?select=*&uid=eq.' + encodeURIComponent(uid));
    var user = data && data.length ? data[0] : null;
    if (user && user.banned) {
      return res.status(403).json({ error: '该账号已被禁用' });
    }
    var isNew = !user;
    if (isNew) {
      var newUser = { uid: uid, wins: 0, losses: 0, total_score: 0, rank_score: 0, last_health: 100, banned: false };
      await supaFetch('POST', '/users', newUser);
      user = newUser;
    }
    res.json({ ok: true, isNew: isNew, user: user });
  } catch (e) {
    console.error('/api/auth error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 管理员登录
app.post('/api/admin/login', async function (req, res) {
  try {
    var uid = req.body.uid;
    var password = req.body.password;
    if (uid !== 'Dsr') return res.status(401).json({ error: '非管理员' });
    var valid = bcrypt.compareSync(password, ADMIN_PW_HASH);
    if (!valid) return res.status(401).json({ error: '密码错误' });
    // 确保管理员账号存在
    var data = await supaFetch('GET', '/users?select=uid&uid=eq.Dsr');
    if (!data || !data.length) {
      await supaFetch('POST', '/users', { uid: 'Dsr', wins: 0, losses: 0, total_score: 0, rank_score: 0, last_health: 100, banned: false });
    }
    res.json({ ok: true, token: ADMIN_PW_HASH, uid: 'Dsr' });
  } catch (e) {
    console.error('/api/admin/login error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 记录对局结果
app.post('/api/result', async function (req, res) {
  try {
    var uid = req.body.uid;
    var won = req.body.won;
    var score = req.body.score || 0;
    var health = req.body.health;
    if (!uid) return res.status(400).json({ error: '缺少UID' });

    var data = await supaFetch('GET', '/users?select=*&uid=eq.' + encodeURIComponent(uid));
    if (!data || !data.length) return res.status(404).json({ error: '用户不存在' });

    var u = data[0];
    if (u.banned) return res.status(403).json({ error: '已禁用' });

    var hp = health !== undefined ? Math.max(0, Math.ceil(health)) : 0;
    var newWins = won ? (u.wins || 0) + 1 : (u.wins || 0);
    var newLosses = won ? (u.losses || 0) : (u.losses || 0) + 1;
    var newTotalScore = (u.total_score || 0) + score;
    var newRankScore = (u.rank_score || u.total_score || 0) + score + (won ? 500 : 0) + hp;

    await supaFetch('PATCH', '/users?uid=eq.' + encodeURIComponent(uid), {
      wins: newWins, losses: newLosses, total_score: newTotalScore,
      rank_score: newRankScore, last_health: hp
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('/api/result error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 用户战绩
app.get('/api/stats/:uid', async function (req, res) {
  try {
    var uid = req.params.uid;
    var data = await supaFetch('GET', '/users?select=*&uid=eq.' + encodeURIComponent(uid));
    if (!data || !data.length) return res.status(404).json({ error: '用户不存在' });
    res.json(data[0]);
  } catch (e) {
    console.error('/api/stats error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 排行榜
app.get('/api/leaderboard', async function (req, res) {
  try {
    var data = await supaFetch('GET', '/users?select=uid,wins,total_score,rank_score&banned=eq.false&order=rank_score.desc&limit=20');
    res.json(data || []);
  } catch (e) {
    console.error('/api/leaderboard error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ===== 管理 API =====

function checkAdmin(req, res, next) {
  var token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_PW_HASH) return res.status(401).json({ error: '无权限' });
  next();
}

app.get('/api/admin/users', checkAdmin, async function (req, res) {
  try {
    var data = await supaFetch('GET', '/users?select=*&order=rank_score.desc');
    res.json(data || []);
  } catch (e) {
    console.error('/api/admin/users error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/admin/toggleban', checkAdmin, async function (req, res) {
  try {
    var uid = req.body.uid;
    if (!uid) return res.status(400).json({ error: '缺少UID' });
    var data = await supaFetch('GET', '/users?select=banned&uid=eq.' + encodeURIComponent(uid));
    if (!data || !data.length) return res.status(404).json({ error: '用户不存在' });
    await supaFetch('PATCH', '/users?uid=eq.' + encodeURIComponent(uid), { banned: !data[0].banned });
    res.json({ ok: true });
  } catch (e) {
    console.error('/api/admin/toggleban error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/admin/remove', checkAdmin, async function (req, res) {
  try {
    var uid = req.body.uid;
    if (!uid) return res.status(400).json({ error: '缺少UID' });
    await supaFetch('DELETE', '/users?uid=eq.' + encodeURIComponent(uid));
    res.json({ ok: true });
  } catch (e) {
    console.error('/api/admin/remove error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.listen(PORT, '0.0.0.0', function () {
  console.log('Maze Game API Server running on port ' + PORT);
});
