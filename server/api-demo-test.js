const fs = require('fs/promises');
const path = require('path');
const Database = require('better-sqlite3');

const base = process.env.API_BASE_URL || 'http://localhost:3001/api';
const username = process.env.ADMIN_USERNAME || 'jr1';
const password = process.env.ADMIN_PASSWORD || 'jr1';
const wheelStateFile = path.join(__dirname, 'data', 'wheel-state.json');
const databaseFile = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'app.db');

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
  const originalWheelState = await fs.readFile(wheelStateFile, 'utf8');
  const suffix = String(Date.now()).slice(-9);
  const popupPhone = `01${suffix}`;
  const batchPhone = `01${String(Number(suffix) + 2).padStart(9, '0').slice(-9)}`;
  const wheelPhone = `01${String(Number(suffix) + 1).padStart(9, '0').slice(-9)}`;
  let feedbackId = '';

  try {
    let result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    assert(result.response.ok && result.body?.token, 'demo login failed');
    const headers = { Authorization: `Bearer ${result.body.token}` };

    result = await request('/launch-offer', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Demo Popup Lead', whatsapp: popupPhone, school: 'Demo Popup School',
        studentType: 'المعاهد الفنية', program: 'معادلة هندسة عربي',
        source: 'automated-demo', consent: 'نعم', attribution: '{}'
      })
    });
    assert(result.response.status === 201 && result.body?.localSaved === true, 'popup form API did not save locally');

    result = await request('/launch-offer', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Demo Batch Lead', whatsapp: batchPhone, school: 'Demo Batch School',
        studentType: 'الثانوية الصناعية نظام 3 سنوات', program: 'معادلة حاسبات عربي',
        source: 'automated-demo-batch', consent: 'نعم', attribution: '{}'
      })
    });
    assert(result.response.status === 201 && result.body?.localSaved === true, 'batch-2027 form API did not save locally');

    result = await request('/feedback', {
      method: 'POST',
      body: JSON.stringify({ name: 'Demo Feedback', university: 'Demo University', rating: 5, message: 'Demo feedback for API integration testing.' })
    });
    assert(result.response.status === 201 && result.body?.id, 'feedback API did not save locally');
    feedbackId = result.body.id;

    result = await request('/admin/feedback?page=1&limit=20', { headers });
    assert(result.response.ok && result.body?.data?.some(item => item.id === feedbackId), 'admin feedback API did not read demo feedback');

    result = await request('/wheel/options');
    assert(result.response.ok && Array.isArray(result.body) && result.body.length > 0, 'wheel options API failed');
    let spin = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      // Each attempt represents a fresh demo visitor. A real visitor is
      // intentionally limited to MAX_WHEEL_ATTEMPTS by the API.
      const sessionId = `demo-wheel-${Date.now()}-${attempt}`;
      result = await request('/wheel/spin', { method: 'POST', body: JSON.stringify({ action: 'spin', sessionId }) });
      assert(result.response.ok && result.body?.token && result.body?.gift, `wheel spin API failed on attempt ${attempt + 1}`);
      spin = result.body;
      if (spin.gift.available) break;
    }
    assert(spin, 'wheel did not return a demo result');
    assert(spin.gift.available, 'wheel demo did not produce a claimable prize after 30 attempts');

    result = await request('/wheel/claim', {
      method: 'POST',
      body: JSON.stringify({ name: 'Demo Wheel User', whatsapp: wheelPhone, program: 'معادلة هندسة عربي', wheelToken: spin.token })
    });
    assert(result.response.ok && result.body?.success === true && result.body?.localSaved === true, 'wheel claim API did not save locally');

    console.log('Demo API test passed: popup form, batch-2027 form, feedback form, wheel spin + claim, and admin read-back.');
  } finally {
    await fs.writeFile(wheelStateFile, originalWheelState, 'utf8');
    const db = new Database(databaseFile);
    db.prepare('DELETE FROM feedbacks WHERE id = ?').run(feedbackId);
    const leads = db.prepare('SELECT id FROM leads WHERE whatsapp IN (?, ?, ?)').all(popupPhone, batchPhone, wheelPhone);
    for (const lead of leads) {
      db.prepare('DELETE FROM audit_logs WHERE entity_id = ?').run(lead.id);
      db.prepare('DELETE FROM leads WHERE id = ?').run(lead.id);
    }
    db.close();
  }
}

main().catch(error => {
  console.error(`Demo API test failed: ${error.message}`);
  process.exitCode = 1;
});
