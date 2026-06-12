const DEFAULT_SUPABASE_URL = 'https://psadnnnoyeqinuixwumj.supabase.co/rest/v1';
const ADMIN_UID = 'Dsr';
const ADMIN_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const USER_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

const DEFAULT_ALLOWED_ORIGINS = [
  'https://dsr061229.github.io',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000'
];

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return preflight(request, env);
    try {
      return await route(request, env);
    } catch (e) {
      console.error('worker error:', e && e.message ? e.message : e);
      return json(request, env, { error: '服务器错误' }, 500);
    }
  }
};

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'GET' && path === '/api/health') {
    assertConfig(env);
    return json(request, env, { ok: true, service: 'maze-worker' });
  }

  if (request.method === 'POST' && path === '/api/auth') {
    const body = await readJson(request);
    const uid = normalizeUid(body.uid);
    if (!uid) return json(request, env, { error: '无效的UID' }, 400);

    let rows = await supaFetch(env, 'GET', '/users?select=*&uid=eq.' + encodeURIComponent(uid));
    let user = rows && rows.length ? rows[0] : null;
    if (user && user.banned) return json(request, env, { error: '该账号已被禁用' }, 403);

    const isNew = !user;
    if (isNew) {
      const created = await createUser(env, uid);
      user = created || { uid, wins: 0, losses: 0, total_score: 0, banned: false };
    }

    const token = await makeToken(env, 'user', uid, USER_TOKEN_TTL_MS);
    return json(request, env, { ok: true, isNew, user, token });
  }

  if (request.method === 'POST' && path === '/api/result') {
    const body = await readJson(request);
    const uid = normalizeUid(body.uid);
    if (!uid) return json(request, env, { error: '缺少UID' }, 400);
    if (!(await verifyToken(env, request.headers.get('x-user-token'), 'user', uid))) {
      return json(request, env, { error: '请重新登录后同步战绩' }, 401);
    }

    const won = body.won === true;
    const score = Math.round(clampNumber(body.score, 0, 100000));
    const hp = body.health !== undefined ? Math.ceil(clampNumber(body.health, 0, 500)) : 0;

    const rows = await supaFetch(env, 'GET', '/users?select=*&uid=eq.' + encodeURIComponent(uid));
    if (!rows || !rows.length) return json(request, env, { error: '用户不存在' }, 404);

    const u = rows[0];
    if (u.banned) return json(request, env, { error: '该账号已被禁用' }, 403);

    await supaFetch(env, 'PATCH', '/users?uid=eq.' + encodeURIComponent(uid), {
      wins: won ? (u.wins || 0) + 1 : (u.wins || 0),
      losses: won ? (u.losses || 0) : (u.losses || 0) + 1,
      total_score: (u.total_score || 0) + score + (won ? 500 : 0) + hp
    });

    return json(request, env, { ok: true });
  }

  const statsMatch = path.match(/^\/api\/stats\/([A-Za-z0-9]{2,20})$/);
  if (request.method === 'GET' && statsMatch) {
    const uid = statsMatch[1];
    const rows = await supaFetch(env, 'GET', '/users?select=*&uid=eq.' + encodeURIComponent(uid));
    if (!rows || !rows.length) return json(request, env, { error: '用户不存在' }, 404);
    return json(request, env, rows[0]);
  }

  if (request.method === 'GET' && path === '/api/leaderboard') {
    const rows = await supaFetch(env, 'GET', '/users?select=uid,wins,total_score&banned=eq.false&order=total_score.desc&limit=20');
    return json(request, env, rows || []);
  }

  if (request.method === 'POST' && path === '/api/admin/login') {
    const body = await readJson(request);
    if (body.uid !== ADMIN_UID) return json(request, env, { error: '非管理员' }, 401);
    if (!(await verifyAdminPassword(env, body.password))) {
      return json(request, env, { error: '密码错误' }, 401);
    }
    await ensureAdminUser(env);
    const token = await makeToken(env, 'admin', ADMIN_UID, ADMIN_TOKEN_TTL_MS);
    return json(request, env, { ok: true, token, uid: ADMIN_UID });
  }

  if (request.method === 'GET' && path === '/api/admin/users') {
    const admin = await requireAdmin(request, env);
    if (admin) return admin;
    const rows = await supaFetch(env, 'GET', '/users?select=*&order=total_score.desc');
    return json(request, env, rows || []);
  }

  if (request.method === 'POST' && path === '/api/admin/toggleban') {
    const admin = await requireAdmin(request, env);
    if (admin) return admin;
    const body = await readJson(request);
    const uid = normalizeUid(body.uid);
    if (!uid) return json(request, env, { error: '缺少UID' }, 400);
    if (uid === ADMIN_UID) return json(request, env, { error: '不能禁用管理员' }, 400);
    const rows = await supaFetch(env, 'GET', '/users?select=banned&uid=eq.' + encodeURIComponent(uid));
    if (!rows || !rows.length) return json(request, env, { error: '用户不存在' }, 404);
    await supaFetch(env, 'PATCH', '/users?uid=eq.' + encodeURIComponent(uid), { banned: !rows[0].banned });
    return json(request, env, { ok: true });
  }

  if (request.method === 'POST' && path === '/api/admin/remove') {
    const admin = await requireAdmin(request, env);
    if (admin) return admin;
    const body = await readJson(request);
    const uid = normalizeUid(body.uid);
    if (!uid) return json(request, env, { error: '缺少UID' }, 400);
    if (uid === ADMIN_UID) return json(request, env, { error: '不能删除管理员' }, 400);
    await supaFetch(env, 'DELETE', '/users?uid=eq.' + encodeURIComponent(uid));
    return json(request, env, { ok: true });
  }

  return json(request, env, { error: 'Not Found' }, 404);
}

async function createUser(env, uid) {
  try {
    const created = await supaFetch(env, 'POST', '/users', { uid, wins: 0, losses: 0, total_score: 0, banned: false });
    return created && created.length ? created[0] : null;
  } catch (e) {
    const rows = await supaFetch(env, 'GET', '/users?select=*&uid=eq.' + encodeURIComponent(uid));
    if (rows && rows.length) return rows[0];
    throw e;
  }
}

async function ensureAdminUser(env) {
  const rows = await supaFetch(env, 'GET', '/users?select=uid&uid=eq.' + encodeURIComponent(ADMIN_UID));
  if (!rows || !rows.length) await createUser(env, ADMIN_UID);
}

async function supaFetch(env, method, path, body) {
  assertConfig(env);
  const headers = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
    headers.Prefer = 'return=representation';
  }
  const url = normalizeSupabaseUrl(env.SUPABASE_URL || DEFAULT_SUPABASE_URL) + path;
  const tries = method === 'GET' || method === 'PATCH' ? 2 : 1;
  let lastError;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const r = await fetchWithTimeout(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
      const text = await r.text();
      const data = text ? safeJson(text) : null;
      if (!r.ok) {
        const msg = data && data.message ? data.message : data && data.error ? data.error : 'Supabase ' + r.status;
        throw new Error(msg);
      }
      return data;
    } catch (e) {
      lastError = e;
      if (attempt + 1 < tries) await sleep(120 + attempt * 180);
    }
  }
  throw lastError;
}

function assertConfig(env) {
  if (!env.SUPABASE_SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_KEY');
  if (!env.ADMIN_TOKEN_SECRET) throw new Error('Missing ADMIN_TOKEN_SECRET');
}

async function fetchWithTimeout(url, opts) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout'), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return {};
  }
}

function normalizeUid(uid) {
  if (typeof uid !== 'string') return '';
  const v = uid.trim();
  return /^[A-Za-z0-9]{2,20}$/.test(v) ? v : '';
}

function normalizeSupabaseUrl(url) {
  return String(url || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return { error: text };
  }
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

async function requireAdmin(request, env) {
  const ok = await verifyToken(env, request.headers.get('x-admin-token'), 'admin', ADMIN_UID);
  return ok ? null : json(request, env, { error: '无权限' }, 401);
}

async function verifyAdminPassword(env, password) {
  if (typeof password !== 'string') return false;
  if (env.ADMIN_PASSWORD) return safeEqual(password, env.ADMIN_PASSWORD);
  if (env.ADMIN_PW_SHA256) {
    const hex = await sha256Hex(password);
    return safeEqual(hex, env.ADMIN_PW_SHA256);
  }
  throw new Error('Missing ADMIN_PASSWORD or ADMIN_PW_SHA256');
}

async function makeToken(env, kind, uid, ttlMs) {
  assertConfig(env);
  const exp = Date.now() + ttlMs;
  const payload = kind + ':' + uid + ':' + exp;
  const sig = await hmacHex(env.ADMIN_TOKEN_SECRET, payload);
  return base64urlEncode(payload + ':' + sig);
}

async function verifyToken(env, token, kind, uid) {
  try {
    assertConfig(env);
    const raw = base64urlDecode(token || '');
    const parts = raw.split(':');
    if (parts.length !== 4) return false;
    const [tkKind, tkUid, expText, sig] = parts;
    const exp = Number(expText);
    if (tkKind !== kind || tkUid !== uid || !Number.isFinite(exp) || Date.now() > exp) return false;
    const expected = await hmacHex(env.ADMIN_TOKEN_SECRET, tkKind + ':' + tkUid + ':' + expText);
    return safeEqual(sig, expected);
  } catch (e) {
    return false;
  }
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc(message));
  return hex(sig);
}

async function sha256Hex(value) {
  return hex(await crypto.subtle.digest('SHA-256', enc(value)));
}

function enc(value) {
  return new TextEncoder().encode(String(value));
}

function hex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  a = String(a || '');
  b = String(b || '');
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

function base64urlEncode(text) {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecode(text) {
  const value = String(text || '');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return atob(padded);
}

function allowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(',');
  return raw.split(',').map(v => v.trim()).filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = allowedOrigins(env);
  const allowOrigin = !origin || origin === 'null' || allowed.includes(origin) ? (origin || '*') : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-admin-token,x-user-token',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function preflight(request, env) {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

function json(request, env, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
