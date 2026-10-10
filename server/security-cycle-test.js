const Database = require('better-sqlite3');
const path = require('path');

const base = process.env.API_BASE_URL || 'http://localhost:3001/api';
const adminUsername = process.env.ADMIN_USERNAME || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const databaseFile = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'app.db');

async function request(route, options = {}) {
  const { headers = {}, ...init } = options;
  const response = await fetch(`${base}${route}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(username, password) {
  const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  assert(result.response.ok && result.body?.token, `login failed for ${username}`);
  return { Authorization: `Bearer ${result.body.token}` };
}

async function expectStatus(route, status, headers, options = {}) {
  const result = await request(route, { ...options, headers });
  assert(result.response.status === status, `${route}: expected ${status}, received ${result.response.status}`);
  return result;
}

async function main() {
  if (!adminUsername || !adminPassword) throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD before running the security cycle test.');

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const scopedUsername = `security.scope.${suffix}@example.com`;
  const employeeUsername = `security.employee.${suffix}@example.com`;
  const tempPassword = `Security-${suffix}-LongPassword`;
  let adminHeaders;
  let scopedHeaders;
  let employeeHeaders;
  const snapshotDb = new Database(databaseFile, { readonly: true });
  const employeePage = snapshotDb.prepare('SELECT data FROM pages WHERE key = ?').get('employees');
  snapshotDb.close();
  let linkedEmployeeId = null;
  try { linkedEmployeeId = JSON.parse(employeePage?.data || '{}')?.items?.[0]?.id; } catch {}
  assert(Number.isInteger(Number(linkedEmployeeId)) && Number(linkedEmployeeId) > 0, 'no employee record is available for the isolation test');

  try {
    adminHeaders = await login(adminUsername, adminPassword);

    let result = await expectStatus('/admin/dashboard/summary', 200, adminHeaders);
    assert(result.body && typeof result.body === 'object', 'admin dashboard did not return JSON');

    result = await request('/admin/users', {
      method: 'POST', headers: adminHeaders,
      body: JSON.stringify({ username: scopedUsername, password: tempPassword, permissions: ['schools'] })
    });
    assert(result.response.status === 201, `scoped user creation failed: ${result.response.status}`);
    scopedHeaders = await login(scopedUsername, tempPassword);

    await expectStatus('/content/employees', 403, scopedHeaders);
    await expectStatus('/admin/finance/accounts', 403, scopedHeaders);
    await expectStatus('/admin/users', 403, scopedHeaders);
    await expectStatus('/admin/dashboard/summary', 403, scopedHeaders);

    result = await request('/admin/users', {
      method: 'POST', headers: adminHeaders,
      body: JSON.stringify({ username: employeeUsername, password: tempPassword, permissions: ['employees', `employee:${linkedEmployeeId}`] })
    });
    assert(result.response.status === 201, `employee-scoped user creation failed: ${result.response.status}`);
    employeeHeaders = await login(employeeUsername, tempPassword);

    result = await expectStatus('/content/employees', 200, employeeHeaders);
    const employees = Array.isArray(result.body?.items) ? result.body.items : [];
    assert(employees.length > 0 && employees.some(item => String(item.id) === String(linkedEmployeeId)), 'employee account cannot see its own profile');
    assert(employees.filter(item => String(item.id) !== String(linkedEmployeeId)).every(item => !item.whatsapp), 'employee account can see a coworker phone number');
    assert(employees.filter(item => String(item.id) !== String(linkedEmployeeId)).every(item => !item.email), 'employee account can see a coworker email');

    result = await expectStatus('/admin/finance/payroll?month=2026-10', 200, employeeHeaders);
    assert(Array.isArray(result.body?.lines) && result.body.lines.every(line => String(line.employeeId) === String(linkedEmployeeId)), 'employee payroll was not scoped to the linked employee');
    await expectStatus('/admin/finance/accounts', 403, employeeHeaders);
    await expectStatus('/admin/finance/payroll/2026-10/approve', 403, employeeHeaders, { method: 'POST', body: JSON.stringify({ accountId: 'application', payments: [{ employeeId: linkedEmployeeId }] }) });

    result = await request(`/admin/users/${encodeURIComponent(scopedUsername)}`, { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ isActive: false }) });
    assert(result.response.ok, 'could not disable temporary user');
    await expectStatus('/auth/me', 401, scopedHeaders);

    console.log('Security cycle passed: scoped page access, employee data masking, payroll row isolation, write protection, and session revocation.');
  } finally {
    if (adminHeaders) {
      for (const username of [scopedUsername, employeeUsername]) {
        try { await request(`/admin/users/${encodeURIComponent(username)}`, { method: 'DELETE', headers: adminHeaders }); } catch {}
      }
    }
    const db = new Database(databaseFile);
    db.prepare('DELETE FROM admin_sessions WHERE username IN (?, ?)').run(scopedUsername, employeeUsername);
    db.prepare('DELETE FROM admin_users WHERE username IN (?, ?)').run(scopedUsername, employeeUsername);
    db.close();
  }
}

main().catch(error => { console.error(`Security cycle failed: ${error.message}`); process.exitCode = 1; });
