const Database = require('better-sqlite3');
const path = require('path');

const base = process.env.API_BASE_URL || 'http://localhost:3001/api';
const username = process.env.ADMIN_USERNAME || 'jr1';
const password = process.env.ADMIN_PASSWORD || 'jr1';
const databaseFile = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'app.db');
const subscriptionKeys = [
  'subscription-engineering-ar',
  'subscription-engineering-en',
  'subscription-computers-ar',
  'subscription-computers-en'
];

async function request(route, options = {}) {
  const response = await fetch(`${base}${route}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const touched = new Map();
  try {
    let result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    assert(result.response.ok && result.body?.token, 'admin login failed');
    const headers = { Authorization: `Bearer ${result.body.token}` };

    result = await request('/content', { headers });
    assert(result.response.ok, 'content index failed');
    const availableKeys = new Set((result.body || []).map(item => item.key));
    for (const key of ['batch-2027', 'success-stories', 'feedback', 'requirements', ...subscriptionKeys]) {
      assert(availableKeys.has(key), `CMS index is missing ${key}`);
    }

    const keysToVerify = ['batch-2027', ...subscriptionKeys];
    for (const key of keysToVerify) {
      const before = await request(`/content/${key}`);
      touched.set(key, before.response.ok ? before.body : null);
      const marker = `cycle-test-${key}-${Date.now()}`;
      const next = { ...(before.response.ok && before.body ? before.body : {}), __cycleTestMarker: marker };
      result = await request(`/content/${key}`, { method: 'PUT', headers, body: JSON.stringify(next) });
      assert(result.response.ok, `admin save failed for ${key}`);
      result = await request(`/content/${key}`);
      assert(result.response.ok && result.body?.__cycleTestMarker === marker, `public read-back failed for ${key}`);
    }

    result = await request('/openapi.json');
    assert(result.response.ok && result.body?.paths?.['/api/content/{pageKey}'], 'OpenAPI is missing CMS content contract');
    console.log('Admin cycle test passed: login -> admin CMS save -> public read-back for batch and all four subscriptions.');
  } finally {
    const db = new Database(databaseFile);
    const restore = db.prepare('INSERT OR REPLACE INTO pages(key, data, updated_at) VALUES (?, ?, ?)');
    const remove = db.prepare('DELETE FROM pages WHERE key = ?');
    for (const [key, original] of touched) {
      if (original) restore.run(key, JSON.stringify(original), new Date().toISOString());
      else remove.run(key);
    }
    db.close();
  }
}

main().catch(error => { console.error(`Admin cycle test failed: ${error.message}`); process.exitCode = 1; });
