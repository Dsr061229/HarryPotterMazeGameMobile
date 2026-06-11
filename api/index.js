const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://psadnnnoyeqinuixwumj.supabase.co/rest/v1';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_iwAnf0X2uoGzL_y8gasb0A_sMII0EVm';
const ADMIN_PW_HASH = process.env.ADMIN_PW_HASH || '$2a$10$18ET.WigOb24EdGlSHQ/Z.Nf2G7S50reC.LF6xUaEgqWhg225oh8C';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || ADMIN_PW_HASH;
const ADMIN_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

const allowedOrigins = [
    'https://dsr061229.github.io',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'https://harrypotter-maze-api.vercel.app'
  ];

app.use(cors({
  origin: function (origin, cb) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

function makeAdminToken(uid) {
  var exp = Date.now() + ADMIN_TOKEN_TTL_MS;
  var payload = uid + ':' + exp;
  var sig = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('hex');
  return Buffer.from(payload + ':' + sig).toString('base64url');
}

function verifyAdminToken(token) {
  try {
    var raw = Buffer.from(token || '', 'base64url').toString('utf8');
    var parts = raw.split(':');
    if (parts.length !== 3) return false;
    var uid = parts[0], exp = Number(parts[1]), sig = parts[2];
    if (uid !== 'Dsr' || !Number.isFinite(exp) || Date.now() > exp) return false;
    var expected = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(uid + ':' + exp).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

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
    if (r.status === 204) return null;
    var cl = r.headers.get('content-length');
    if (cl === '0') return null;
    return r.text().then(function (text) {
      return text ? JSON.parse(text) : null;
    });
  });
}

function clampNumber(value, min, max) {
  var n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

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
      var newUser = { uid: uid, wins: 0, losses: 0, total_score: 0, banned: false };
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
    if (typeof password !== 'string') return res.status(400).json({ error: '缺少密码' });
    var valid = bcrypt.compareSync(password, ADMIN_PW_HASH);
    if (!valid) return res.status(401).json({ error: '密码错误' });
    var data = await supaFetch('GET', '/users?select=uid&uid=eq.Dsr');
    if (!data || !data.length) {
      await supaFetch('POST', '/users', { uid: 'Dsr', wins: 0, losses: 0, total_score: 0, banned: false });
    }
    res.json({ ok: true, token: makeAdminToken('Dsr'), uid: 'Dsr' });
  } catch (e) {
    console.error('/api/admin/login error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 记录对局结果
app.post('/api/result', async function (req, res) {
  try {
    var uid = req.body.uid;
    var won = req.body.won === true;
    var score = Math.round(clampNumber(req.body.score, 0, 100000));
    var health = req.body.health;
    if (!uid) return res.status(400).json({ error: '缺少UID' });

    var data = await supaFetch('GET', '/users?select=*&uid=eq.' + encodeURIComponent(uid));
    if (!data || !data.length) return res.status(404).json({ error: '用户不存在' });

    var u = data[0];
    if (u.banned) return res.status(403).json({ error: '已禁用' });

    var hp = health !== undefined ? Math.ceil(clampNumber(health, 0, 500)) : 0;
    var newWins = won ? (u.wins || 0) + 1 : (u.wins || 0);
    var newLosses = won ? (u.losses || 0) : (u.losses || 0) + 1;
    var newTotalScore = (u.total_score || 0) + score + (won ? 500 : 0) + hp;

    await supaFetch('PATCH', '/users?uid=eq.' + encodeURIComponent(uid), {
      wins: newWins, losses: newLosses, total_score: newTotalScore
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
    var data = await supaFetch('GET', '/users?select=uid,wins,total_score&banned=eq.false&order=total_score.desc&limit=20');
    res.json(data || []);
  } catch (e) {
    console.error('/api/leaderboard error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ===== 管理 API =====

function checkAdmin(req, res, next) {
  var token = req.headers['x-admin-token'];
  if (!verifyAdminToken(token)) return res.status(401).json({ error: '无权限' });
  next();
}

app.get('/api/admin/users', checkAdmin, async function (req, res) {
  try {
    var data = await supaFetch('GET', '/users?select=*&order=total_score.desc');
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
    if (uid === 'Dsr') return res.status(400).json({ error: '不能禁用管理员' });
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
    if (uid === 'Dsr') return res.status(400).json({ error: '不能删除管理员' });
    await supaFetch('DELETE', '/users?uid=eq.' + encodeURIComponent(uid));
    res.json({ ok: true });
  } catch (e) {
    console.error('/api/admin/remove error:', e.message);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = app;
