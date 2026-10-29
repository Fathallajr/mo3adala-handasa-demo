const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
	max: Number(process.env.DATABASE_POOL_MAX || 5)
});

let schemaPromise;

function ensureSchema() {
	if (!schemaPromise) {
		schemaPromise = pool.query(`
			CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
			CREATE TABLE IF NOT EXISTS pages (key TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL);
			CREATE TABLE IF NOT EXISTS leads (
				id TEXT PRIMARY KEY, name TEXT NOT NULL, whatsapp TEXT NOT NULL UNIQUE, school TEXT DEFAULT '',
				student_type TEXT DEFAULT '', program TEXT DEFAULT '', source TEXT DEFAULT '', status TEXT NOT NULL,
				notes TEXT DEFAULT '', attribution JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ
			);
			CREATE TABLE IF NOT EXISTS customers (
				id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE,
				status TEXT NOT NULL DEFAULT 'new', notes TEXT DEFAULT '',
				created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ
			);
			CREATE TABLE IF NOT EXISTS programs (
				id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, category TEXT NOT NULL,
				language TEXT NOT NULL, price NUMERIC NOT NULL DEFAULT 0, features JSONB NOT NULL DEFAULT '[]'::jsonb,
				is_active BOOLEAN NOT NULL DEFAULT TRUE, enrollment_status TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ
			);
			CREATE TABLE IF NOT EXISTS audit_logs (
				id TEXT PRIMARY KEY, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
				actor TEXT DEFAULT '', ip TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL
			);
			CREATE TABLE IF NOT EXISTS analytics_sessions (
				id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL, first_seen TIMESTAMPTZ NOT NULL, last_seen TIMESTAMPTZ NOT NULL,
				started_at TIMESTAMPTZ NOT NULL, ended_at TIMESTAMPTZ, ip_address TEXT DEFAULT '', ip_hash TEXT DEFAULT '', country TEXT DEFAULT '', region TEXT DEFAULT '', city TEXT DEFAULT '',
				device TEXT DEFAULT '', browser TEXT DEFAULT '', os TEXT DEFAULT '', referrer TEXT DEFAULT '', landing_path TEXT DEFAULT '',
				acquisition_source TEXT DEFAULT '', acquisition_medium TEXT DEFAULT '', acquisition_campaign TEXT DEFAULT '', user_agent TEXT DEFAULT '',
				page_views INTEGER NOT NULL DEFAULT 0, duration_seconds INTEGER NOT NULL DEFAULT 0
			);
			CREATE INDEX IF NOT EXISTS analytics_sessions_last_seen_idx ON analytics_sessions(last_seen);
			CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_idx ON analytics_sessions(visitor_id);
			CREATE TABLE IF NOT EXISTS analytics_page_views (
				id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE, path TEXT NOT NULL, title TEXT DEFAULT '', component TEXT DEFAULT '',
				entered_at TIMESTAMPTZ NOT NULL, exited_at TIMESTAMPTZ, active_seconds INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL
			);
			CREATE INDEX IF NOT EXISTS analytics_page_views_session_idx ON analytics_page_views(session_id);
			CREATE INDEX IF NOT EXISTS analytics_page_views_created_idx ON analytics_page_views(created_at);
			CREATE TABLE IF NOT EXISTS feedbacks (
				id TEXT PRIMARY KEY, name TEXT NOT NULL, university TEXT DEFAULT '', batch TEXT DEFAULT '',
				rating INTEGER NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
				created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ
			);
			CREATE TABLE IF NOT EXISTS wheel_state (
				id INTEGER PRIMARY KEY CHECK (id = 1), data JSONB NOT NULL
			);
			CREATE TABLE IF NOT EXISTS wheel_claims (
				token TEXT PRIMARY KEY, name TEXT NOT NULL, whatsapp TEXT NOT NULL UNIQUE,
				program TEXT NOT NULL, gift TEXT NOT NULL, notes TEXT DEFAULT '', claimed_at TIMESTAMPTZ NOT NULL
			);
			CREATE TABLE IF NOT EXISTS free_code_requests (
				id TEXT PRIMARY KEY, name TEXT NOT NULL, whatsapp TEXT NOT NULL UNIQUE,
				program TEXT NOT NULL, requested_at TIMESTAMPTZ NOT NULL
			);
			CREATE TABLE IF NOT EXISTS assets (
				filename TEXT PRIMARY KEY, mime_type TEXT NOT NULL, data BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL
			);
			CREATE TABLE IF NOT EXISTS admin_sessions (
				token TEXT PRIMARY KEY, expires_at TIMESTAMPTZ NOT NULL, role TEXT NOT NULL DEFAULT 'admin',
				username TEXT NOT NULL DEFAULT '', permissions JSONB NOT NULL DEFAULT '[]'::jsonb
			);
			CREATE TABLE IF NOT EXISTS admin_activity_sessions (
				token TEXT PRIMARY KEY, username TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT 'admin',
				login_at TIMESTAMPTZ NOT NULL, last_seen TIMESTAMPTZ NOT NULL, logout_at TIMESTAMPTZ
			);
			CREATE TABLE IF NOT EXISTS admin_users (
				username TEXT PRIMARY KEY, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
				role TEXT NOT NULL DEFAULT 'editor', permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
				is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ
			);
			CREATE TABLE IF NOT EXISTS finance_accounts (
				id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, opening_balance NUMERIC NOT NULL DEFAULT 0,
				is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ
			);
			CREATE TABLE IF NOT EXISTS finance_transactions (
				id TEXT PRIMARY KEY, kind TEXT NOT NULL, account_id TEXT, from_account_id TEXT,
				to_account_id TEXT, amount NUMERIC NOT NULL, occurred_at DATE NOT NULL, category TEXT DEFAULT '',
				description TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'posted',
				source_type TEXT DEFAULT '', source_id TEXT DEFAULT '', created_by TEXT DEFAULT '',
				created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ, void_reason TEXT DEFAULT ''
			);
			CREATE INDEX IF NOT EXISTS finance_transactions_date_idx ON finance_transactions(occurred_at);
			CREATE INDEX IF NOT EXISTS finance_transactions_source_idx ON finance_transactions(source_type, source_id);
			CREATE TABLE IF NOT EXISTS finance_payroll_payments (
				id TEXT PRIMARY KEY, employee_id INTEGER NOT NULL, month TEXT NOT NULL, amount NUMERIC NOT NULL,
				transaction_id TEXT, status TEXT NOT NULL DEFAULT 'paid', approved_by TEXT DEFAULT '',
				created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ, UNIQUE(employee_id, month)
			);
			CREATE TABLE IF NOT EXISTS finance_audit_logs (
				id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL,
				before_data JSONB NOT NULL DEFAULT '{}'::jsonb, after_data JSONB NOT NULL DEFAULT '{}'::jsonb,
				reason TEXT DEFAULT '', actor TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL
			);
			CREATE TABLE IF NOT EXISTS finance_loans (
				id TEXT PRIMARY KEY, lender_account_id TEXT NOT NULL, borrower_account_id TEXT NOT NULL, amount NUMERIC NOT NULL,
				repaid_amount NUMERIC NOT NULL DEFAULT 0, occurred_at DATE NOT NULL, due_at DATE, reason TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'open',
				transfer_transaction_id TEXT NOT NULL, created_by TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ, cancel_reason TEXT DEFAULT ''
			);
			ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';
			ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT '';
			ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
			ALTER TABLE leads ADD COLUMN IF NOT EXISTS attribution JSONB NOT NULL DEFAULT '{}'::jsonb;
			ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS batch TEXT DEFAULT '';
			ALTER TABLE wheel_claims ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
			ALTER TABLE finance_transactions DROP COLUMN IF EXISTS counterparty;
		`).then(async result => {
			await pool.query("INSERT INTO finance_accounts(id,name,opening_balance,is_active,created_at) VALUES ('application','أبلكيشن',0,TRUE,NOW()),('studio','استوديو',0,TRUE,NOW()) ON CONFLICT (id) DO NOTHING");
			return result;
		});
	}
	return schemaPromise;
}

async function readStore() {
	await ensureSchema();
	const [pages, leads, programs, auditLogs, feedbacks] = await Promise.all([
		pool.query('SELECT key, data, updated_at AS "updatedAt" FROM pages'),
		pool.query('SELECT id,name,whatsapp,school,student_type AS "studentType",program,source,status,notes,attribution,created_at AS "createdAt",updated_at AS "updatedAt" FROM leads ORDER BY created_at DESC'),
		pool.query('SELECT id,name,slug,category,language,price,features,is_active AS "isActive",enrollment_status AS "enrollmentStatus",created_at AS "createdAt",updated_at AS "updatedAt" FROM programs ORDER BY created_at DESC'),
		pool.query('SELECT id,action,entity_type AS "entityType",entity_id AS "entityId",actor,ip,created_at AS "createdAt" FROM audit_logs ORDER BY created_at DESC')
		,pool.query('SELECT id,name,university,batch,rating,message,status,created_at AS "createdAt",updated_at AS "updatedAt" FROM feedbacks ORDER BY created_at DESC')
	]);
	return {
		pages: Object.fromEntries(pages.rows.map(row => [row.key, { data: row.data, updatedAt: row.updatedAt }])),
		leads: leads.rows,
		programs: programs.rows.map(row => ({ ...row, price: Number(row.price), isActive: Boolean(row.isActive) })),
		auditLogs: auditLogs.rows,
		feedbacks: feedbacks.rows
	};
}

async function writeStore(store) {
	await ensureSchema();
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		// Pages have their own atomic savePage() path. Do not rewrite them from
		// this potentially stale full-store snapshot: program/lead updates used
		// to bring back old CMS content and silently delete newer news.
		await client.query('TRUNCATE leads, programs, audit_logs');
		for (const lead of store.leads || []) {
			await client.query(`INSERT INTO leads(id,name,whatsapp,school,student_type,program,source,status,notes,attribution,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)`, [lead.id, lead.name || '', lead.whatsapp || '', lead.school || '', lead.studentType || '', lead.program || '', lead.source || '', lead.status || 'new', lead.notes || '', JSON.stringify(lead.attribution || {}), lead.createdAt || new Date().toISOString(), lead.updatedAt || null]);
		}
		for (const program of store.programs || []) {
			await client.query(`INSERT INTO programs(id,name,slug,category,language,price,features,is_active,enrollment_status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11)`, [program.id, program.name || '', program.slug || '', program.category || '', program.language || 'ar', Number(program.price || 0), JSON.stringify(program.features || []), program.isActive !== false, program.enrollmentStatus || 'open', program.createdAt || new Date().toISOString(), program.updatedAt || null]);
		}
		for (const log of store.auditLogs || []) {
			await client.query(`INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [log.id || `${log.createdAt || Date.now()}-${Math.random()}`, log.action || '', log.entityType || '', log.entityId || '', log.actor || '', log.ip || '', log.createdAt || new Date().toISOString()]);
		}
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

async function savePage(key, data, updatedAt) {
	await ensureSchema();
	const result = await pool.query(
		'INSERT INTO pages(key,data,updated_at) VALUES ($1,$2::jsonb,$3) ON CONFLICT(key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at RETURNING data, updated_at AS "updatedAt"',
		[key, JSON.stringify(data ?? {}), updatedAt || new Date().toISOString()]
	);
	return { data: result.rows[0].data, updatedAt: result.rows[0].updatedAt };
}

async function updateEmployeeProfile({ employeeId, employee, email, updatedAt }) {
	await ensureSchema();
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const pageResult = await client.query('SELECT data FROM pages WHERE key = $1 FOR UPDATE', ['employees']);
		const page = pageResult.rows[0]?.data || { items: [] };
		const items = Array.isArray(page.items) ? page.items : [];
		const index = items.findIndex(item => String(item?.id) === String(employeeId));
		if (index < 0) throw Object.assign(new Error('الموظف غير موجود.'), { code: 'EMPLOYEE_NOT_FOUND' });
		const current = items[index];
		const currentEmail = String(current.email || '').trim().toLowerCase();
		const nextEmail = String(email || '').trim().toLowerCase();
		if (nextEmail !== currentEmail) {
			if ((await client.query('SELECT 1 FROM admin_users WHERE lower(username) = lower($1)', [nextEmail])).rowCount) throw Object.assign(new Error('هذا البريد مستخدم بالفعل.'), { code: 'DUPLICATE_EMAIL' });
			const result = await client.query('UPDATE admin_users SET username = $1, updated_at = $2 WHERE lower(username) = lower($3)', [nextEmail, updatedAt, currentEmail]);
			if (!result.rowCount) throw Object.assign(new Error('لا يوجد حساب دخول مرتبط بهذا الموظف.'), { code: 'EMPLOYEE_ACCOUNT_NOT_FOUND' });
			await client.query('DELETE FROM admin_sessions WHERE lower(username) = lower($1)', [currentEmail]);
		}
		const savedEmployee = { ...current, ...employee, id: current.id, email: nextEmail };
		const nextPage = { ...page, items: items.map((item, itemIndex) => itemIndex === index ? savedEmployee : item) };
		await client.query('UPDATE pages SET data = $1::jsonb, updated_at = $2 WHERE key = $3', [JSON.stringify(nextPage), updatedAt, 'employees']);
		await client.query('INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [crypto.randomUUID(), 'updated', 'employee', String(employeeId), '', '', updatedAt]);
		await client.query('COMMIT');
		return { data: nextPage, employee: savedEmployee };
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally { client.release(); }
}

async function createEmployeeWithAccount({ employee, email, passwordHash, passwordSalt, createdAt }) {
	await ensureSchema();
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const pageResult = await client.query('SELECT data FROM pages WHERE key = $1 FOR UPDATE', ['employees']);
		const page = pageResult.rows[0]?.data || { items: [] };
		const items = Array.isArray(page.items) ? page.items : [];
		const nextId = items.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0) + 1;
		const savedEmployee = { ...employee, id: nextId };
		const nextPage = { ...page, items: [...items, savedEmployee] };
		const updatedAt = createdAt || new Date().toISOString();
		await client.query(
			'INSERT INTO pages(key,data,updated_at) VALUES ($1,$2::jsonb,$3) ON CONFLICT(key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at',
			['employees', JSON.stringify(nextPage), updatedAt]
		);
		await client.query(
			'INSERT INTO admin_users(username,password_hash,password_salt,role,permissions,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)',
			[email, passwordHash, passwordSalt, 'employee', JSON.stringify(['employees', `employee:${nextId}`]), true, updatedAt, null]
		);
		await client.query(
			'INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
			[crypto.randomUUID(), 'created', 'employee', String(nextId), '', '', updatedAt]
		);
		await client.query('COMMIT');
		return { data: nextPage, employee: savedEmployee, employeeId: String(nextId) };
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

async function createLead(lead, auditLog) {
	await ensureSchema();
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(`INSERT INTO leads(id,name,whatsapp,school,student_type,program,source,status,notes,attribution,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)`, [lead.id, lead.name, lead.whatsapp, lead.school, lead.studentType, lead.program, lead.source, lead.status, lead.notes, JSON.stringify(lead.attribution || {}), lead.createdAt, lead.updatedAt]);
		await client.query(`INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [auditLog.id, auditLog.action, auditLog.entityType, auditLog.entityId, auditLog.actor || '', auditLog.ip || '', auditLog.createdAt]);
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		if (error?.code === '23505') { error.code = 'DUPLICATE_PHONE'; }
		throw error;
	} finally {
		client.release();
	}
	return lead;
}

async function deleteLead(id) {
	await ensureSchema();
	const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING id', [id]);
	return result.rowCount > 0;
}

async function getLead(id) {
	await ensureSchema();
	const result = await pool.query('SELECT id,name,whatsapp,school,student_type AS "studentType",program,source,status,notes,attribution,created_at AS "createdAt",updated_at AS "updatedAt" FROM leads WHERE id = $1', [id]);
	return result.rows[0] || null;
}

async function updateLead(id, changes) {
	await ensureSchema();
	const fields = [];
	const values = [];
	if (changes.status !== undefined) { fields.push(`status = $${values.length + 1}`); values.push(changes.status); }
	if (changes.notes !== undefined) { fields.push(`notes = $${values.length + 1}`); values.push(String(changes.notes || '').trim()); }
	if (changes.updatedAt !== undefined) { fields.push(`updated_at = $${values.length + 1}`); values.push(changes.updatedAt); }
	if (!fields.length) return getLead(id);
	values.push(id);
	const result = await pool.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id,name,whatsapp,school,student_type AS "studentType",program,source,status,notes,attribution,created_at AS "createdAt",updated_at AS "updatedAt"`, values);
	return result.rows[0] || null;
}

async function listCustomers() { await ensureSchema(); const result = await pool.query('SELECT id,name,phone,status,notes,created_at AS "createdAt",updated_at AS "updatedAt" FROM customers ORDER BY created_at DESC'); return result.rows; }
async function getCustomer(id) { await ensureSchema(); const result = await pool.query('SELECT id,name,phone,status,notes,created_at AS "createdAt",updated_at AS "updatedAt" FROM customers WHERE id = $1', [id]); return result.rows[0] || null; }
async function createCustomer(customer) { await ensureSchema(); await pool.query('INSERT INTO customers(id,name,phone,status,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [customer.id, customer.name, customer.phone, customer.status || 'new', customer.notes || '', customer.createdAt, customer.updatedAt || null]); return customer; }
async function updateCustomer(id, changes) {
	await ensureSchema(); const fields = [], values = []; const add = (column, value) => { fields.push(`${column} = $${values.length + 1}`); values.push(value); };
	if (changes.name !== undefined) add('name', String(changes.name || '').trim()); if (changes.phone !== undefined) add('phone', String(changes.phone || '').trim()); if (changes.status !== undefined) add('status', changes.status); if (changes.notes !== undefined) add('notes', String(changes.notes || '').trim()); if (changes.updatedAt !== undefined) add('updated_at', changes.updatedAt);
	if (!fields.length) return getCustomer(id); values.push(id); const result = await pool.query(`UPDATE customers SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id,name,phone,status,notes,created_at AS "createdAt",updated_at AS "updatedAt"`, values); return result.rows[0] || null;
}
async function deleteCustomer(id) { await ensureSchema(); const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]); return result.rowCount > 0; }
async function findCustomerByPhone(phone) { await ensureSchema(); const result = await pool.query('SELECT id FROM customers WHERE phone = $1', [phone]); return result.rows[0] || null; }

async function createAuditLog(log) {
	await ensureSchema();
	await pool.query('INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [log.id, log.action || '', log.entityType || '', log.entityId || '', log.actor || '', log.ip || '', log.createdAt || new Date().toISOString()]);
}

async function readWheelState() {
	await ensureSchema();
	const result = await pool.query('SELECT data FROM wheel_state WHERE id = 1');
	const state = result.rows[0]?.data || { spins: {}, claims: {} };
	await migrateWheelClaims(state);
	return state;
}

async function migrateWheelClaims(state) {
	const claims = Object.values(state?.spins || {}).filter(spin => spin?.claimed && spin?.token && spin?.phone);
	for (const spin of claims) {
		await pool.query(`INSERT INTO wheel_claims(token,name,whatsapp,program,gift,claimed_at) VALUES ($1,$2,$3,$4,$5,$6)
			ON CONFLICT DO NOTHING`, [spin.token, spin.name || '', spin.phone, spin.program || '', spin.gift?.label || '', spin.claimedAt || new Date().toISOString()]);
	}
}

async function writeWheelState(state) {
	await ensureSchema();
	await pool.query(`INSERT INTO wheel_state(id, data) VALUES (1, $1::jsonb)
		ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [JSON.stringify(state)]);
}

async function writeAsset({ filename, mimeType, data, createdAt }) {
	await ensureSchema();
	await pool.query(`INSERT INTO assets(filename, mime_type, data, created_at) VALUES ($1,$2,$3,$4)
		ON CONFLICT (filename) DO UPDATE SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data`, [filename, mimeType, data, createdAt || new Date().toISOString()]);
}

async function readAsset(filename) {
	await ensureSchema();
	const result = await pool.query('SELECT filename, mime_type AS "mimeType", data FROM assets WHERE filename = $1', [filename]);
	return result.rows[0] || null;
}

async function createAdminSession(token, expiresAt, role = 'admin', username = '', permissions = []) {
	await ensureSchema();
	await pool.query('INSERT INTO admin_sessions(token, expires_at, role, username, permissions) VALUES ($1, $2, $3, $4, $5::jsonb)', [token, expiresAt, role, username, JSON.stringify(permissions)]);
	await pool.query('INSERT INTO admin_activity_sessions(token, username, role, login_at, last_seen) VALUES ($1, $2, $3, NOW(), NOW())', [token, username, role]);
}

async function getAdminSession(token) {
	await ensureSchema();
	const result = await pool.query('SELECT expires_at AS "expiresAt", role, username, permissions FROM admin_sessions WHERE token = $1', [token]);
	return result.rows[0] || null;
}
async function touchAdminActivity(token, username = '', role = 'admin') { await ensureSchema(); await pool.query('INSERT INTO admin_activity_sessions(token, username, role, login_at, last_seen) VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT(token) DO UPDATE SET username = COALESCE(NULLIF(EXCLUDED.username, \'\'), admin_activity_sessions.username), role = EXCLUDED.role, last_seen = CASE WHEN admin_activity_sessions.logout_at IS NULL THEN EXCLUDED.last_seen ELSE admin_activity_sessions.last_seen END', [token, username, role]); }
async function endAdminActivity(token) { await ensureSchema(); await pool.query('UPDATE admin_activity_sessions SET logout_at = COALESCE(logout_at, NOW()) WHERE token = $1', [token]); }
async function endAdminActivitiesForUsername(username) { if (!username) return; await ensureSchema(); await pool.query('UPDATE admin_activity_sessions SET logout_at = COALESCE(logout_at, NOW()) WHERE username = $1 AND logout_at IS NULL', [username]); }
async function getAdminActivitySession(token) { await ensureSchema(); const result = await pool.query('SELECT token,username,role,login_at AS "loginAt",last_seen AS "lastSeen",logout_at AS "logoutAt" FROM admin_activity_sessions WHERE token = $1', [token]); return result.rows[0] || null; }
async function closeStaleAdminActivitySessions(idleMs = 5 * 60 * 1000) { await ensureSchema(); const cutoff = new Date(Date.now() - Math.max(Number(idleMs) || 0, 0)).toISOString(); await pool.query('UPDATE admin_activity_sessions SET logout_at = COALESCE(logout_at, NOW()) WHERE logout_at IS NULL AND last_seen < $1::timestamptz', [cutoff]); }
async function listAdminActivitySessions(limit = 100) { await closeStaleAdminActivitySessions(); const result = await pool.query('SELECT token,username,role,login_at AS "loginAt",last_seen AS "lastSeen",logout_at AS "logoutAt" FROM admin_activity_sessions ORDER BY login_at DESC LIMIT $1', [Math.min(Math.max(Number(limit) || 100, 1), 200)]); return result.rows; }
async function getAnalyticsSessionDetails(id) { await ensureSchema(); const sessionResult = await pool.query('SELECT id,visitor_id AS "visitorId",first_seen AS "firstSeen",last_seen AS "lastSeen",started_at AS "startedAt",ended_at AS "endedAt",ip_address AS "ipAddress",ip_hash AS "ipHash",country,region,city,device,browser,os,referrer,landing_path AS "landingPath",acquisition_source AS "acquisitionSource",acquisition_medium AS "acquisitionMedium",acquisition_campaign AS "acquisitionCampaign",user_agent AS "userAgent",page_views AS "pageViews",duration_seconds AS "durationSeconds" FROM analytics_sessions WHERE id = $1', [id]); const session = sessionResult.rows[0]; if (!session) return null; const views = await pool.query('SELECT id,path,title,component,entered_at AS "enteredAt",exited_at AS "exitedAt",active_seconds AS "activeSeconds",created_at AS "createdAt" FROM analytics_page_views WHERE session_id = $1 ORDER BY entered_at ASC', [id]); return { ...session, pageViewsDetails: views.rows }; }

async function findAdminUser(username) { await ensureSchema(); const result = await pool.query('SELECT username,password_hash AS "passwordHash",password_salt AS "passwordSalt",role,permissions,is_active AS "isActive" FROM admin_users WHERE username = $1', [username]); return result.rows[0] || null; }
async function listAdminUsers() { await ensureSchema(); const result = await pool.query('SELECT username,role,permissions,is_active AS "isActive",created_at AS "createdAt",updated_at AS "updatedAt" FROM admin_users ORDER BY created_at DESC'); return result.rows; }
async function createAdminUser(user) { await ensureSchema(); await pool.query('INSERT INTO admin_users(username,password_hash,password_salt,role,permissions,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)', [user.username, user.passwordHash, user.passwordSalt, user.role || 'editor', JSON.stringify(user.permissions || []), user.isActive !== false, user.createdAt, user.updatedAt || null]); }
async function updateAdminUser(username, changes) { await ensureSchema(); const sets = []; const values = []; const add = (sql, value) => { sets.push(sql.replace('$N', `$${values.length + 1}`)); values.push(value); }; if (changes.passwordHash) { add('password_hash = $N', changes.passwordHash); add('password_salt = $N', changes.passwordSalt); } if (changes.permissions) add('permissions = $N::jsonb', JSON.stringify(changes.permissions)); if (changes.isActive !== undefined) add('is_active = $N', changes.isActive); if (changes.updatedAt) add('updated_at = $N', changes.updatedAt); if (!sets.length) return; values.push(username); await pool.query(`UPDATE admin_users SET ${sets.join(', ')} WHERE username = $${values.length}`, values); }
async function deleteAdminUser(username) { await ensureSchema(); await pool.query('DELETE FROM admin_users WHERE username = $1', [username]); }
async function getMetadata(key) { await ensureSchema(); const result = await pool.query('SELECT value FROM metadata WHERE key = $1', [key]); return result.rows[0]?.value ?? null; }
async function setMetadata(key, value) { await ensureSchema(); await pool.query('INSERT INTO metadata(key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value', [key, String(value)]); }
async function createFeedback(feedback) { await ensureSchema(); await pool.query('INSERT INTO feedbacks(id,name,university,batch,rating,message,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [feedback.id, feedback.name, feedback.university || '', feedback.batch || '', feedback.rating, feedback.message, feedback.status || 'new', feedback.createdAt, feedback.updatedAt || null]); }
async function listFeedback() { await ensureSchema(); const result = await pool.query('SELECT id,name,university,batch,rating,message,status,created_at AS "createdAt",updated_at AS "updatedAt" FROM feedbacks ORDER BY created_at DESC'); return result.rows; }
async function getFeedback(id) { await ensureSchema(); const result = await pool.query('SELECT id,name,university,batch,rating,message,status,created_at AS "createdAt",updated_at AS "updatedAt" FROM feedbacks WHERE id = $1', [id]); return result.rows[0] || null; }
async function updateFeedback(id, changes) { await ensureSchema(); await pool.query('UPDATE feedbacks SET status = COALESCE($1,status), updated_at = COALESCE($2,updated_at) WHERE id = $3', [changes.status || null, changes.updatedAt || null, id]); }
async function updateFeedbackBatch(fromBatch, toBatch, updatedAt) { await ensureSchema(); const result = await pool.query('UPDATE feedbacks SET batch = $1, updated_at = $2 WHERE BTRIM(batch) = $3', [toBatch, updatedAt, fromBatch]); return result.rowCount; }
async function setMissingFeedbackBatch(batch, updatedAt) { await ensureSchema(); const result = await pool.query("UPDATE feedbacks SET batch = $1, updated_at = $2 WHERE batch IS NULL OR BTRIM(batch) = '' OR BTRIM(batch) IN ('غير محدد', 'غير محددة', 'بدون اختيار', 'لم يتم الاختيار')", [batch, updatedAt]); return result.rowCount; }
async function listPublishedFeedback() { await ensureSchema(); const result = await pool.query(`SELECT id,name,university,batch,rating,message,status,created_at AS "createdAt",updated_at AS "updatedAt" FROM feedbacks WHERE status = 'published' ORDER BY created_at DESC LIMIT 50`); return result.rows; }
async function findWheelClaimByPhone(whatsapp) { await ensureSchema(); const state = (await pool.query('SELECT data FROM wheel_state WHERE id = 1')).rows[0]?.data; if (state) await migrateWheelClaims(state); const result = await pool.query('SELECT token,name,whatsapp,program,gift,notes,claimed_at AS "claimedAt" FROM wheel_claims WHERE whatsapp = $1', [whatsapp]); return result.rows[0] || null; }
async function createWheelClaim(claim) { await ensureSchema(); try { await pool.query('INSERT INTO wheel_claims(token,name,whatsapp,program,gift,notes,claimed_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [claim.token, claim.name, claim.whatsapp, claim.program, claim.gift, claim.notes || '', claim.claimedAt]); } catch (error) { if (error?.code === '23505') error.code = 'DUPLICATE_WHEEL_CLAIM'; throw error; } }
async function listWheelClaims() { await ensureSchema(); const state = (await pool.query('SELECT data FROM wheel_state WHERE id = 1')).rows[0]?.data; if (state) await migrateWheelClaims(state); const result = await pool.query('SELECT token,name,whatsapp,program,gift,notes,claimed_at AS "claimedAt" FROM wheel_claims ORDER BY claimed_at DESC'); return result.rows; }
async function updateWheelClaim(token, changes) { await ensureSchema(); const result = await pool.query('UPDATE wheel_claims SET notes = $1 WHERE token = $2 RETURNING token,name,whatsapp,program,gift,notes,claimed_at AS "claimedAt"', [String(changes.notes || '').trim(), token]); return result.rows[0] || null; }
async function deleteWheelClaim(token) { await ensureSchema(); const result = await pool.query('DELETE FROM wheel_claims WHERE token = $1 RETURNING token', [token]); return result.rowCount > 0; }
async function countWheelClaims() { await listWheelClaims(); const result = await pool.query('SELECT COUNT(*)::int AS count FROM wheel_claims'); return result.rows[0].count; }
function buildFreeCodeRequestFilters(filters = {}) {
	const clauses = [];
	const values = [];
	const add = value => { values.push(value); return `$${values.length}`; };
	const search = String(filters.search || '').trim();
	if (search) { const term = add(`%${search}%`); clauses.push(`(name ILIKE ${term} OR whatsapp ILIKE ${term} OR program ILIKE ${term})`); }
	const program = String(filters.program || '').trim();
	if (program) clauses.push(`program = ${add(program)}`);
	const from = String(filters.from || '').trim();
	if (from) clauses.push(`requested_at >= ${add(from)}::date`);
	const to = String(filters.to || '').trim();
	if (to) clauses.push(`requested_at < (${add(to)}::date + INTERVAL '1 day')`);
	return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values };
}
async function createFreeCodeRequest(request) {
	await ensureSchema();
	const result = await pool.query(
		'INSERT INTO free_code_requests(id,name,whatsapp,program,requested_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (whatsapp) DO NOTHING RETURNING id,name,whatsapp,program,requested_at AS "requestedAt"',
		[request.id, request.name, request.whatsapp, request.program, request.requestedAt]
	);
	return result.rows[0] || null;
}
async function findFreeCodeRequestByPhone(whatsapp) { await ensureSchema(); const result = await pool.query('SELECT id,name,whatsapp,program,requested_at AS "requestedAt" FROM free_code_requests WHERE whatsapp = $1', [whatsapp]); return result.rows[0] || null; }
async function listFreeCodeRequests() { await ensureSchema(); const result = await pool.query('SELECT id,name,whatsapp,program,requested_at AS "requestedAt" FROM free_code_requests ORDER BY requested_at DESC'); return result.rows; }
async function listFreeCodeRequestsPage(page = 1, limit = 20, filters = {}) { await ensureSchema(); const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100); const safePage = Math.max(Number(page) || 1, 1); const query = buildFreeCodeRequestFilters(filters); query.values.push(safeLimit, (safePage - 1) * safeLimit); const result = await pool.query(`SELECT id,name,whatsapp,program,requested_at AS "requestedAt" FROM free_code_requests ${query.where} ORDER BY requested_at DESC LIMIT $${query.values.length - 1} OFFSET $${query.values.length}`, query.values); return result.rows; }
async function countFreeCodeRequests(filters = {}) { await ensureSchema(); const query = buildFreeCodeRequestFilters(filters); const result = await pool.query(`SELECT COUNT(*)::int AS count FROM free_code_requests ${query.where}`, query.values); return result.rows[0].count; }

function financeAccountRow(row) { return row ? { ...row, openingBalance: Number(row.openingBalance), isActive: Boolean(row.isActive) } : null; }
function financeTransactionRow(row) { return row ? { ...row, amount: Number(row.amount), accountId: row.accountId || null, fromAccountId: row.fromAccountId || null, toAccountId: row.toAccountId || null } : null; }
function financePayrollRow(row) { return row ? { ...row, employeeId: Number(row.employeeId), amount: Number(row.amount) } : null; }
const FINANCE_TRANSACTION_SELECT = `SELECT id,kind,account_id AS "accountId",from_account_id AS "fromAccountId",to_account_id AS "toAccountId",amount,occurred_at AS "occurredAt",category,description,status,source_type AS "sourceType",source_id AS "sourceId",created_by AS "createdBy",created_at AS "createdAt",updated_at AS "updatedAt",void_reason AS "voidReason" FROM finance_transactions`;

async function listFinanceAccounts() { await ensureSchema(); const result = await pool.query('SELECT id,name,opening_balance AS "openingBalance",is_active AS "isActive",created_at AS "createdAt",updated_at AS "updatedAt" FROM finance_accounts ORDER BY created_at ASC'); return result.rows.map(financeAccountRow); }
async function listFinanceTransactions(filters = {}) {
	await ensureSchema(); const values = []; const clauses = ['1=1']; const add = (sql, value) => { values.push(value); clauses.push(`${sql} $${values.length}`); };
	if (filters.kind) add('kind =', filters.kind); if (filters.accountId) { values.push(filters.accountId); const p = values.length; values.push(filters.accountId); const p2 = values.length; values.push(filters.accountId); const p3 = values.length; clauses.push(`(account_id = $${p} OR from_account_id = $${p2} OR to_account_id = $${p3})`); }
	if (filters.status) add('status =', filters.status); if (filters.sourceType) add('source_type =', filters.sourceType); if (filters.from) add('occurred_at >=', filters.from); if (filters.to) add('occurred_at <=', filters.to);
	if (filters.search) { const search = `%${filters.search}%`; values.push(search, search); clauses.push(`(description ILIKE $${values.length - 1} OR category ILIKE $${values.length})`); }
	let sql = `${FINANCE_TRANSACTION_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY occurred_at DESC, created_at DESC`; if (filters.limit) { values.push(Number(filters.limit)); sql += ` LIMIT $${values.length}`; } if (filters.offset) { values.push(Number(filters.offset)); sql += ` OFFSET $${values.length}`; }
	return (await pool.query(sql, values)).rows.map(financeTransactionRow);
}
async function createFinanceAuditLog(log, client = pool) { await client.query('INSERT INTO finance_audit_logs(id,entity_type,entity_id,action,before_data,after_data,reason,actor,created_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9)', [log.id || crypto.randomUUID(), log.entityType, String(log.entityId), log.action, JSON.stringify(log.beforeData || {}), JSON.stringify(log.afterData || {}), log.reason || '', log.actor || '', log.createdAt || new Date().toISOString()]); }
async function createFinanceTransaction(input) {
	await ensureSchema(); const client = await pool.connect(); const now = input.createdAt || new Date().toISOString(); const id = input.id || crypto.randomUUID();
	try { await client.query('BEGIN'); await client.query('INSERT INTO finance_transactions(id,kind,account_id,from_account_id,to_account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', [id,input.kind,input.accountId||null,input.fromAccountId||null,input.toAccountId||null,Number(input.amount),input.occurredAt,input.category||'',input.description||'',input.status||'posted',input.sourceType||'',input.sourceId||'',input.createdBy||'',now]); const result = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1`, [id])).rows[0]); await createFinanceAuditLog({ entityType:'finance_transaction', entityId:id, action:'created', afterData:result, actor:input.createdBy, createdAt:now }, client); await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function listFinanceLoans() { await ensureSchema(); const result=await pool.query(`SELECT l.id,l.lender_account_id AS "lenderAccountId",l.borrower_account_id AS "borrowerAccountId",l.amount,l.repaid_amount AS "repaidAmount",l.occurred_at AS "occurredAt",l.due_at AS "dueAt",l.reason,l.status,l.transfer_transaction_id AS "transferTransactionId",l.created_by AS "createdBy",l.created_at AS "createdAt",l.updated_at AS "updatedAt",l.cancel_reason AS "cancelReason",la.name AS "lenderName",ba.name AS "borrowerName" FROM finance_loans l JOIN finance_accounts la ON la.id=l.lender_account_id JOIN finance_accounts ba ON ba.id=l.borrower_account_id ORDER BY l.occurred_at DESC,l.created_at DESC`); return result.rows.map(row=>({...row,amount:Number(row.amount),repaidAmount:Number(row.repaidAmount||0),remainingAmount:Math.max(0,Number(row.amount)-Number(row.repaidAmount||0))})); }
async function createFinanceLoan(input) { await ensureSchema(); const client=await pool.connect(); const now=input.createdAt||new Date().toISOString(), id=input.id||crypto.randomUUID(), transferId=crypto.randomUUID(); try { await client.query('BEGIN'); await client.query('INSERT INTO finance_transactions(id,kind,from_account_id,to_account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[transferId,'transfer',input.lenderAccountId,input.borrowerAccountId,Number(input.amount),input.occurredAt,'سلفة بين الخزائن',input.reason||'','posted','inter-vault-loan',id,input.createdBy||'',now]); await client.query('INSERT INTO finance_loans(id,lender_account_id,borrower_account_id,amount,occurred_at,due_at,reason,status,transfer_transaction_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[id,input.lenderAccountId,input.borrowerAccountId,Number(input.amount),input.occurredAt,input.dueAt||null,input.reason||'','open',transferId,input.createdBy||'',now]); await createFinanceAuditLog({entityType:'finance_loan',entityId:id,action:'created',afterData:input,actor:input.createdBy,createdAt:now},client); await client.query('COMMIT'); return (await listFinanceLoans()).find(x=>x.id===id); } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();} }
async function repayFinanceLoan(id, amount, actor, reason='') { await ensureSchema(); const client=await pool.connect(); try { await client.query('BEGIN'); const row=(await client.query(`SELECT l.*,l.lender_account_id AS "lenderAccountId",l.borrower_account_id AS "borrowerAccountId",l.repaid_amount AS "repaidAmount" FROM finance_loans l WHERE l.id=$1 FOR UPDATE`,[id])).rows[0]; if(!row) throw Object.assign(new Error('السلفة غير موجودة.'),{code:'FINANCE_LOAN_NOT_FOUND'}); const remaining=Number(row.amount)-Number(row.repaidAmount||0); if(!['open','partial'].includes(row.status)) throw Object.assign(new Error('السلفة ليست قابلة للسداد.'),{code:'FINANCE_LOAN_CLOSED'}); if(!Number.isFinite(Number(amount))||Number(amount)<=0||Number(amount)>remaining+.005) throw Object.assign(new Error('مبلغ السداد أكبر من المتبقي.'),{code:'FINANCE_LOAN_AMOUNT'}); const now=new Date().toISOString(); await client.query('INSERT INTO finance_transactions(id,kind,from_account_id,to_account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[crypto.randomUUID(),'transfer',row.borrowerAccountId,row.lenderAccountId,Number(amount),row.occurred_at,'سداد سلفة',reason||'سداد سلفة','posted','inter-vault-loan-repayment',id,actor||'',now]); const repaid=Number(row.repaidAmount||0)+Number(amount), status=repaid>=Number(row.amount)-.005?'repaid':'partial'; await client.query('UPDATE finance_loans SET repaid_amount=$1,status=$2,updated_at=$3 WHERE id=$4',[repaid,status,now,id]); await createFinanceAuditLog({entityType:'finance_loan',entityId:id,action:'repaid',beforeData:row,afterData:{repaidAmount:repaid,status},reason,actor,createdAt:now},client); await client.query('COMMIT'); return (await listFinanceLoans()).find(x=>x.id===id); } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();} }
async function cancelFinanceLoan(id, reason, actor) { await ensureSchema(); const client=await pool.connect(); try { await client.query('BEGIN'); const row=(await client.query(`SELECT l.*,l.lender_account_id AS "lenderAccountId",l.borrower_account_id AS "borrowerAccountId",l.repaid_amount AS "repaidAmount" FROM finance_loans l WHERE l.id=$1 FOR UPDATE`,[id])).rows[0]; if(!row)return null; if(!['open','partial'].includes(row.status)) throw Object.assign(new Error('السلفة مغلقة بالفعل.'),{code:'FINANCE_LOAN_CLOSED'}); const remaining=Number(row.amount)-Number(row.repaidAmount||0),now=new Date().toISOString(); if(remaining>0) await client.query('INSERT INTO finance_transactions(id,kind,from_account_id,to_account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[crypto.randomUUID(),'transfer',row.borrowerAccountId,row.lenderAccountId,remaining,row.occurred_at,'إلغاء سلفة',reason,'posted','inter-vault-loan-cancel',id,actor||'',now]); await client.query('UPDATE finance_loans SET repaid_amount=amount,status=$1,cancel_reason=$2,updated_at=$3 WHERE id=$4',['cancelled',reason,now,id]); await client.query('COMMIT'); return (await listFinanceLoans()).find(x=>x.id===id); } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();} }
async function updateFinanceTransaction(id, changes, actor) {
	await ensureSchema(); const client = await pool.connect(); try { await client.query('BEGIN'); const current = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1 FOR UPDATE`, [id])).rows[0]); if (!current) { await client.query('ROLLBACK'); return null; } if (current.status === 'voided') throw Object.assign(new Error('لا يمكن تعديل حركة ملغاة.'), { code:'FINANCE_VOIDED' }); const updatedAt = new Date().toISOString(); await client.query('UPDATE finance_transactions SET occurred_at=$1,category=$2,description=$3,updated_at=$4 WHERE id=$5', [changes.occurredAt || current.occurredAt, changes.category ?? current.category, changes.description ?? current.description, updatedAt, id]); const result = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1`, [id])).rows[0]); await createFinanceAuditLog({ entityType:'finance_transaction', entityId:id, action:'updated', beforeData:current, afterData:result, actor, createdAt:updatedAt }, client); await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function voidFinanceTransaction(id, reason, actor) {
	await ensureSchema(); const client = await pool.connect(); try { await client.query('BEGIN'); const current = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1 FOR UPDATE`, [id])).rows[0]); if (!current) { await client.query('ROLLBACK'); return null; } if (current.status === 'voided') { await client.query('COMMIT'); return current; } const now = new Date().toISOString(); await client.query('UPDATE finance_transactions SET status=$1,void_reason=$2,updated_at=$3 WHERE id=$4', ['voided', String(reason || '').trim(), now, id]); const result = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1`, [id])).rows[0]); await createFinanceAuditLog({ entityType:'finance_transaction', entityId:id, action:'voided', beforeData:current, afterData:result, reason, actor, createdAt:now }, client); await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function listFinancePayrollPayments(month) { await ensureSchema(); const result = await pool.query('SELECT id,employee_id AS "employeeId",month,amount,transaction_id AS "transactionId",status,approved_by AS "approvedBy",created_at AS "createdAt",updated_at AS "updatedAt" FROM finance_payroll_payments WHERE month = $1', [month]); return result.rows.map(financePayrollRow); }
async function resetFinancePayrollPayment(employeeId, month, actor) {
	await ensureSchema(); const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const current = (await client.query('SELECT id,employee_id AS "employeeId",month,amount,transaction_id AS "transactionId",status,approved_by AS "approvedBy",created_at AS "createdAt",updated_at AS "updatedAt" FROM finance_payroll_payments WHERE employee_id=$1 AND month=$2 FOR UPDATE', [employeeId, month])).rows[0];
		if (!current) { await client.query('COMMIT'); return null; }
		if (current.status !== 'paid') { await client.query('COMMIT'); return financePayrollRow(current); }
		const now = new Date().toISOString();
		if (current.transactionId) {
			const transaction = (await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1 FOR UPDATE`, [current.transactionId])).rows[0];
			if (transaction && transaction.status !== 'voided') {
				await client.query('UPDATE finance_transactions SET status=$1,void_reason=$2,updated_at=$3 WHERE id=$4', ['voided', `إرجاع راتب ${current.employeeId} إلى مستحق`, now, current.transactionId]);
				const afterTransaction = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1`, [current.transactionId])).rows[0]);
				await createFinanceAuditLog({ entityType:'finance_transaction', entityId:current.transactionId, action:'voided', beforeData:transaction, afterData:afterTransaction, reason:'إرجاع الحالة إلى مستحق', actor, createdAt:now }, client);
			}
		}
		await client.query('DELETE FROM finance_payroll_payments WHERE id=$1', [current.id]);
		const result = financePayrollRow({ ...current, status:'due', updatedAt:now });
		await createFinanceAuditLog({ entityType:'payroll_payment', entityId:current.id, action:'reset_to_due', beforeData:financePayrollRow(current), afterData:result, reason:'إرجاع الحالة إلى مستحق', actor, createdAt:now }, client);
		await client.query('COMMIT'); return result;
	} catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function listFinanceAuditLogs(entityId = '', limit = 100) { await ensureSchema(); const values = entityId ? [String(entityId), Math.min(Number(limit) || 100, 300)] : [Math.min(Number(limit) || 100, 300)]; const result = await pool.query(entityId ? 'SELECT id,entity_type AS "entityType",entity_id AS "entityId",action,before_data AS "beforeData",after_data AS "afterData",reason,actor,created_at AS "createdAt" FROM finance_audit_logs WHERE entity_id = $1 ORDER BY created_at DESC LIMIT $2' : 'SELECT id,entity_type AS "entityType",entity_id AS "entityId",action,before_data AS "beforeData",after_data AS "afterData",reason,actor,created_at AS "createdAt" FROM finance_audit_logs ORDER BY created_at DESC LIMIT $1', values); return result.rows; }
async function getFinanceSummary({ from, to }) {
	await ensureSchema(); const [accountsResult, periodResult, allResult] = await Promise.all([pool.query('SELECT id,name,opening_balance AS "openingBalance",is_active AS "isActive",created_at AS "createdAt",updated_at AS "updatedAt" FROM finance_accounts ORDER BY created_at ASC'), pool.query('SELECT kind,account_id,from_account_id,to_account_id,amount,category FROM finance_transactions WHERE status=$1 AND occurred_at >= $2 AND occurred_at <= $3', ['posted',from,to]), pool.query('SELECT kind,account_id,from_account_id,to_account_id,amount FROM finance_transactions WHERE status=$1', ['posted'])]);
	const totals = { income:0, expense:0, transfer:0 }; const byCategory = {}; for (const row of periodResult.rows) { totals[row.kind] = (totals[row.kind] || 0) + Number(row.amount); if (row.kind === 'expense') byCategory[row.category || 'أخرى'] = (byCategory[row.category || 'أخرى'] || 0) + Number(row.amount); }
	const balances = accountsResult.rows.map(account => { let balance = Number(account.openingBalance || 0); let income = 0; let expense = 0; for (const row of allResult.rows) { if (row.kind === 'income' && row.account_id === account.id) balance += Number(row.amount); if (row.kind === 'expense' && row.account_id === account.id) balance -= Number(row.amount); if (row.kind === 'transfer' && row.from_account_id === account.id) balance -= Number(row.amount); if (row.kind === 'transfer' && row.to_account_id === account.id) balance += Number(row.amount); } for (const row of periodResult.rows) { if (row.kind === 'income' && row.account_id === account.id) income += Number(row.amount); if (row.kind === 'expense' && row.account_id === account.id) expense += Number(row.amount); } return { ...financeAccountRow(account), balance, income, expense, net: income - expense }; });
	return { ...totals, net: totals.income - totals.expense, balances, byCategory };
}

async function recordAnalyticsHit({ session, pageView }) {
	await ensureSchema();
	const now = new Date().toISOString();
	await pool.query(`INSERT INTO analytics_sessions(id,visitor_id,first_seen,last_seen,started_at,ended_at,ip_address,ip_hash,country,region,city,device,browser,os,referrer,landing_path,acquisition_source,acquisition_medium,acquisition_campaign,user_agent,page_views,duration_seconds)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
		ON CONFLICT(id) DO UPDATE SET last_seen=EXCLUDED.last_seen, ended_at=COALESCE(EXCLUDED.ended_at,analytics_sessions.ended_at), ip_address=COALESCE(NULLIF(EXCLUDED.ip_address,''),analytics_sessions.ip_address), ip_hash=COALESCE(NULLIF(EXCLUDED.ip_hash,''),analytics_sessions.ip_hash),
		page_views=EXCLUDED.page_views, duration_seconds=EXCLUDED.duration_seconds, country=COALESCE(NULLIF(EXCLUDED.country,''),analytics_sessions.country), region=COALESCE(NULLIF(EXCLUDED.region,''),analytics_sessions.region), city=COALESCE(NULLIF(EXCLUDED.city,''),analytics_sessions.city), referrer=COALESCE(NULLIF(EXCLUDED.referrer,''),analytics_sessions.referrer),
		acquisition_source=COALESCE(NULLIF(EXCLUDED.acquisition_source,''),analytics_sessions.acquisition_source), acquisition_medium=COALESCE(NULLIF(EXCLUDED.acquisition_medium,''),analytics_sessions.acquisition_medium), acquisition_campaign=COALESCE(NULLIF(EXCLUDED.acquisition_campaign,''),analytics_sessions.acquisition_campaign)`,
		[session.id,session.visitorId,session.firstSeen||now,session.lastSeen||now,session.startedAt||now,session.endedAt||null,session.ipAddress||'',session.ipHash||'',session.country||'',session.region||'',session.city||'',session.device||'',session.browser||'',session.os||'',session.referrer||'',session.landingPath||'',session.acquisitionSource||'',session.acquisitionMedium||'',session.acquisitionCampaign||'',session.userAgent||'',Number(session.pageViews||0),Number(session.durationSeconds||0)]);
	if (pageView?.id) await pool.query(`INSERT INTO analytics_page_views(id,session_id,path,title,component,entered_at,exited_at,active_seconds,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		ON CONFLICT(id) DO UPDATE SET exited_at=COALESCE(EXCLUDED.exited_at,analytics_page_views.exited_at),active_seconds=GREATEST(analytics_page_views.active_seconds,EXCLUDED.active_seconds)`,
		[pageView.id,session.id,pageView.path||'/',pageView.title||'',pageView.component||'',pageView.enteredAt||now,pageView.exitedAt||null,Number(pageView.activeSeconds||0),pageView.createdAt||now]);
}

async function closeStaleAnalyticsSessions() {
	await ensureSchema();
	await pool.query(`UPDATE analytics_sessions SET ended_at = last_seen WHERE ended_at IS NULL AND last_seen < NOW() - INTERVAL '5 minutes'`);
}

async function getAnalyticsSummary({ from, to, device = '' }) {
	await ensureSchema();
	await closeStaleAnalyticsSessions();
	const sessionParams = device ? [from, to, device] : [from, to];
	const deviceFilter = device ? ' AND device = $3' : '';
	const viewDeviceFilter = device ? ' AND s.device = $3' : '';
	const [sessionsResult, viewsResult] = await Promise.all([
		pool.query(`SELECT id,visitor_id AS "visitorId",first_seen AS "firstSeen",last_seen AS "lastSeen",started_at AS "startedAt",ended_at AS "endedAt",ip_hash AS "ipHash",country,region,city,device,browser,os,referrer,landing_path AS "landingPath",acquisition_source AS "acquisitionSource",acquisition_medium AS "acquisitionMedium",acquisition_campaign AS "acquisitionCampaign",user_agent AS "userAgent",page_views AS "pageViews",duration_seconds AS "durationSeconds" FROM analytics_sessions WHERE last_seen >= $1::date AND last_seen < ($2::date + INTERVAL '1 day')${deviceFilter} ORDER BY last_seen DESC`, sessionParams),
		pool.query(`SELECT pv.id,pv.session_id AS "sessionId",pv.path,pv.title,pv.component,pv.entered_at AS "enteredAt",pv.exited_at AS "exitedAt",pv.active_seconds AS "activeSeconds",pv.created_at AS "createdAt" FROM analytics_page_views pv INNER JOIN analytics_sessions s ON s.id = pv.session_id WHERE pv.created_at >= $1::date AND pv.created_at < ($2::date + INTERVAL '1 day')${viewDeviceFilter} ORDER BY pv.created_at DESC`, sessionParams)
	]);
	const sessions = sessionsResult.rows.map(row => ({ ...row, pageViews:Number(row.pageViews||0), durationSeconds:Number(row.durationSeconds||0) }));
	const pageViews = viewsResult.rows.map(row => ({ ...row, activeSeconds:Number(row.activeSeconds||0) }));
	const pageViewCountBySession = pageViews.reduce((map, row) => map.set(row.sessionId, (map.get(row.sessionId) || 0) + 1), new Map());
	const count = key => Object.entries(sessions.reduce((acc,row) => { const value=row[key]||'غير محدد'; acc[value]=(acc[value]||0)+1; return acc; }, {})).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([label,value])=>({label,value}));
	const daily = {}; const topPages = {};
	for (const row of sessions) { const day=String(row.lastSeen).slice(0,10); daily[day]=(daily[day]||0)+1; }
	for (const row of pageViews) topPages[row.path]=(topPages[row.path]||0)+1;
	const sessionById = new Map(sessions.map(row => [row.id, row])); const performance = {};
	for (const row of pageViews) { const session = sessionById.get(row.sessionId); if (!performance[row.path]) performance[row.path] = { path:row.path, visitors:new Set(), sessions:new Set(), pageViews:0, duration:0 }; const item=performance[row.path]; item.pageViews += 1; item.duration += Number(row.activeSeconds || 0); item.sessions.add(row.sessionId); if (session?.visitorId || session?.ipHash) item.visitors.add(session.visitorId || session.ipHash); }
	for (const item of Object.values(performance)) item.duration = Number(item.duration || 0);
	return { sessions:sessions.length, visitors:new Set(sessions.map(row=>row.visitorId||row.ipHash).filter(Boolean)).size, pageViews:pageViews.length,
		averageSessionDuration:sessions.length?Math.round(sessions.reduce((sum,row)=>sum+row.durationSeconds,0)/sessions.length):0, pagesPerSession:sessions.length?Number((pageViews.length/sessions.length).toFixed(2)):0,
		trafficOverTime:Object.entries(daily).sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,value})), devices:count('device'), countries:count('country'), regions:count('region'), referrers:count('referrer'),
		topPages:Object.entries(topPages).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([path,value])=>({path,value})), performance:Object.values(performance).sort((a,b)=>b.pageViews-a.pageViews).slice(0,20).map(item=>({path:item.path,visitors:item.visitors.size,sessions:item.sessions.size,pageViews:item.pageViews,averageSessionDuration:item.sessions.size?Math.round(item.duration/item.sessions.size):0,pagesPerSession:item.sessions.size?Number((item.pageViews/item.sessions.size).toFixed(2)):0})), recentSessions:sessions.slice(0,25).map(row => ({ ...row, pageViews: pageViewCountBySession.get(row.id) || 0 })), from, to };
}
getAnalyticsSummary.touchAdminActivity = touchAdminActivity;
getAnalyticsSummary.closeStaleAnalyticsSessions = closeStaleAnalyticsSessions;
getAnalyticsSummary.endAdminActivity = endAdminActivity;
getAnalyticsSummary.endAdminActivitiesForUsername = endAdminActivitiesForUsername;
getAnalyticsSummary.getAdminActivitySession = getAdminActivitySession;
getAnalyticsSummary.closeStaleAdminActivitySessions = closeStaleAdminActivitySessions;
getAnalyticsSummary.listAdminActivitySessions = listAdminActivitySessions;
getAnalyticsSummary.getAnalyticsSessionDetails = getAnalyticsSessionDetails;
async function approveFinancePayroll({ month, payments, approvedBy, accountId }) {
	await ensureSchema(); const client = await pool.connect(); try { await client.query('BEGIN'); const account = (await client.query('SELECT id FROM finance_accounts WHERE id=$1 AND is_active=TRUE', [accountId])).rows[0]; if (!account) throw Object.assign(new Error('الخزنة غير موجودة.'), { code:'FINANCE_ACCOUNT_NOT_FOUND' }); const result = []; const now = new Date().toISOString(); for (const payment of payments) { const existing = (await client.query('SELECT id,employee_id AS "employeeId",month,amount,transaction_id AS "transactionId",status,approved_by AS "approvedBy",created_at AS "createdAt",updated_at AS "updatedAt" FROM finance_payroll_payments WHERE employee_id=$1 AND month=$2 FOR UPDATE', [payment.employeeId,month])).rows[0]; if (existing?.status === 'paid') { if (Math.abs(Number(existing.amount) - Number(payment.amount)) >= 0.005) throw Object.assign(new Error('المبلغ المعتمد لا يطابق صافي الراتب.'), { code:'FINANCE_PAYROLL_AMOUNT_MISMATCH' }); result.push(financePayrollRow(existing)); continue; } let transactionId = null; if (Number(payment.amount) > 0) { transactionId = crypto.randomUUID(); const transaction = { id:transactionId, kind:'expense', accountId, amount:Number(payment.amount), occurredAt:`${month}-01`, category:'رواتب', description:`راتب شهر ${month}`, status:'posted', sourceType:'payroll', sourceId:`${payment.employeeId}:${month}`, createdBy:approvedBy || '', createdAt:now }; await client.query('INSERT INTO finance_transactions(id,kind,account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [transaction.id,transaction.kind,transaction.accountId,transaction.amount,transaction.occurredAt,transaction.category,transaction.description,transaction.status,transaction.sourceType,transaction.sourceId,transaction.createdBy,transaction.createdAt]); await createFinanceAuditLog({ entityType:'finance_transaction',entityId:transactionId,action:'created',afterData:transaction,actor:approvedBy,createdAt:now }, client); }
		const id = crypto.randomUUID(); await client.query('INSERT INTO finance_payroll_payments(id,employee_id,month,amount,transaction_id,status,approved_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [id,payment.employeeId,month,Number(payment.amount),transactionId,'paid',approvedBy||'',now]); const line = { id,employeeId:Number(payment.employeeId),month,amount:Number(payment.amount),transactionId,status:'paid',approvedBy:approvedBy||'',createdAt:now }; await createFinanceAuditLog({ entityType:'payroll_payment',entityId:id,action:'approved',afterData:line,actor:approvedBy,createdAt:now }, client); result.push(line); } await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); if (error?.code === '23505') error.code = 'FINANCE_PAYROLL_DUPLICATE'; throw error; } finally { client.release(); }
}

async function deleteAdminSession(token) {
	await ensureSchema();
	await pool.query('DELETE FROM admin_sessions WHERE token = $1', [token]);
}
async function deleteAdminSessionsForUsername(username) { await ensureSchema(); await pool.query('DELETE FROM admin_sessions WHERE username = $1', [username]); }

module.exports = { readStore, writeStore, savePage, updateEmployeeProfile, createEmployeeWithAccount, createLead, getLead, updateLead, createAuditLog, deleteLead, listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, findCustomerByPhone, readWheelState, writeWheelState, createWheelClaim, listWheelClaims, updateWheelClaim, deleteWheelClaim, countWheelClaims, createFreeCodeRequest, findFreeCodeRequestByPhone, listFreeCodeRequests, listFreeCodeRequestsPage, countFreeCodeRequests, writeAsset, readAsset, createAdminSession, getAdminSession, deleteAdminSession, deleteAdminSessionsForUsername, findAdminUser, listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, getMetadata, setMetadata, createFeedback, listFeedback, getFeedback, updateFeedback, updateFeedbackBatch, setMissingFeedbackBatch, listPublishedFeedback, listFinanceAccounts, listFinanceTransactions, createFinanceTransaction, updateFinanceTransaction, voidFinanceTransaction, listFinanceLoans, createFinanceLoan, repayFinanceLoan, cancelFinanceLoan, listFinancePayrollPayments, listFinanceAuditLogs, getFinanceSummary, approveFinancePayroll, recordAnalyticsHit, getAnalyticsSummary, databaseFile: null, pool, ensureSchema };
