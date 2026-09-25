const fs = require('fs/promises');
const path = require('path');
const Database = require('better-sqlite3');

const base = process.env.API_BASE_URL || 'http://localhost:3001/api';
const username = process.env.ADMIN_USERNAME || 'jr1';
const password = process.env.ADMIN_PASSWORD || 'jr1';
const storeFile = path.join(__dirname, 'data', 'content-store.json');
const databaseFile = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'app.db');

async function request(route, options = {}) {
	const response = await fetch(`${base}${route}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
	let body = null;
	try { body = await response.json(); } catch {}
	return { response, body };
}

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

async function main() {
	const originalStore = await fs.readFile(storeFile, 'utf8');
	let testPhone = '';
	try {
		let result = await request('/health');
		assert(result.response.ok && result.body?.ok === true, 'health check failed');

		result = await request('/admin/dashboard/summary');
		assert(result.response.status === 401, 'protected endpoint accepted an unauthenticated request');

		result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
		assert(result.response.ok && result.body?.token, 'admin login failed');
		const token = result.body.token;
		const headers = { Authorization: `Bearer ${token}` };

		for (const route of ['/auth/me', '/admin/dashboard/summary', '/admin/leads?page=1&limit=5', '/admin/programs', '/admin/wheel/claims']) {
			result = await request(route, { headers });
			assert(result.response.ok, `${route} failed with ${result.response.status}`);
		}
		result = await request('/admin/leads/export?from=2020-01-01&to=2099-12-31', { headers });
		assert(result.response.ok && (result.body === null || result.response.headers.get('content-type')?.includes('text/csv')), 'lead export failed');
		result = await request('/wheel/options');
		assert(result.response.ok && Array.isArray(result.body), 'wheel options failed');
		result = await request('/wheel/check?whatsapp=01000000000');
		assert(result.response.ok && result.body?.registered === false, 'wheel phone check failed');
		result = await request('/openapi.json');
		assert(result.response.ok && result.body?.paths?.['/api/wheel/claim'] && result.body?.paths?.['/api/admin/leads'], 'OpenAPI contract is missing required paths');

		testPhone = `01${String(Date.now()).slice(-9)}`;
		const lead = { name: 'API Smoke Test', whatsapp: testPhone, program: 'smoke-test', source: 'automated-test' };
		result = await request('/leads', { method: 'POST', body: JSON.stringify(lead) });
		assert(result.response.status === 201, `lead creation failed with ${result.response.status}`);
		result = await request('/leads', { method: 'POST', body: JSON.stringify(lead) });
		assert(result.response.status === 409 && result.body?.alreadyRegistered === true, 'duplicate phone was not rejected');

		console.log('API smoke test passed: auth, permissions, dashboard, leads, duplicate phone, wheel, and OpenAPI.');
	} finally {
		await fs.writeFile(storeFile, originalStore, 'utf8');
		if (testPhone) {
			const db = new Database(databaseFile);
			const lead = db.prepare('SELECT id FROM leads WHERE whatsapp = ?').get(testPhone);
			if (lead) {
				db.prepare('DELETE FROM audit_logs WHERE entity_id = ?').run(lead.id);
				db.prepare('DELETE FROM leads WHERE id = ?').run(lead.id);
			}
			db.close();
		}
	}
}

main().catch(error => { console.error(`API smoke test failed: ${error.message}`); process.exitCode = 1; });
