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
			CREATE TABLE IF NOT EXISTS assets (
				filename TEXT PRIMARY KEY, mime_type TEXT NOT NULL, data BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL
			);
			CREATE TABLE IF NOT EXISTS admin_sessions (
				token TEXT PRIMARY KEY, expires_at TIMESTAMPTZ NOT NULL, role TEXT NOT NULL DEFAULT 'admin',
				username TEXT NOT NULL DEFAULT '', permissions JSONB NOT NULL DEFAULT '[]'::jsonb
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
				description TEXT DEFAULT '', counterparty TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'posted',
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
			ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';
			ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT '';
			ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
			ALTER TABLE leads ADD COLUMN IF NOT EXISTS attribution JSONB NOT NULL DEFAULT '{}'::jsonb;
			ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS batch TEXT DEFAULT '';
			ALTER TABLE wheel_claims ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
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
}

async function getAdminSession(token) {
	await ensureSchema();
	const result = await pool.query('SELECT expires_at AS "expiresAt", role, username, permissions FROM admin_sessions WHERE token = $1', [token]);
	return result.rows[0] || null;
}

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

function financeAccountRow(row) { return row ? { ...row, openingBalance: Number(row.openingBalance), isActive: Boolean(row.isActive) } : null; }
function financeTransactionRow(row) { return row ? { ...row, amount: Number(row.amount), accountId: row.accountId || null, fromAccountId: row.fromAccountId || null, toAccountId: row.toAccountId || null } : null; }
function financePayrollRow(row) { return row ? { ...row, employeeId: Number(row.employeeId), amount: Number(row.amount) } : null; }
const FINANCE_TRANSACTION_SELECT = `SELECT id,kind,account_id AS "accountId",from_account_id AS "fromAccountId",to_account_id AS "toAccountId",amount,occurred_at AS "occurredAt",category,description,counterparty,status,source_type AS "sourceType",source_id AS "sourceId",created_by AS "createdBy",created_at AS "createdAt",updated_at AS "updatedAt",void_reason AS "voidReason" FROM finance_transactions`;

async function listFinanceAccounts() { await ensureSchema(); const result = await pool.query('SELECT id,name,opening_balance AS "openingBalance",is_active AS "isActive",created_at AS "createdAt",updated_at AS "updatedAt" FROM finance_accounts ORDER BY created_at ASC'); return result.rows.map(financeAccountRow); }
async function listFinanceTransactions(filters = {}) {
	await ensureSchema(); const values = []; const clauses = ['1=1']; const add = (sql, value) => { values.push(value); clauses.push(`${sql} $${values.length}`); };
	if (filters.kind) add('kind =', filters.kind); if (filters.accountId) { values.push(filters.accountId); const p = values.length; values.push(filters.accountId); const p2 = values.length; values.push(filters.accountId); const p3 = values.length; clauses.push(`(account_id = $${p} OR from_account_id = $${p2} OR to_account_id = $${p3})`); }
	if (filters.status) add('status =', filters.status); if (filters.sourceType) add('source_type =', filters.sourceType); if (filters.from) add('occurred_at >=', filters.from); if (filters.to) add('occurred_at <=', filters.to);
	if (filters.search) { const search = `%${filters.search}%`; values.push(search, search, search); clauses.push(`(description ILIKE $${values.length - 2} OR counterparty ILIKE $${values.length - 1} OR category ILIKE $${values.length})`); }
	let sql = `${FINANCE_TRANSACTION_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY occurred_at DESC, created_at DESC`; if (filters.limit) { values.push(Number(filters.limit)); sql += ` LIMIT $${values.length}`; } if (filters.offset) { values.push(Number(filters.offset)); sql += ` OFFSET $${values.length}`; }
	return (await pool.query(sql, values)).rows.map(financeTransactionRow);
}
async function createFinanceAuditLog(log, client = pool) { await client.query('INSERT INTO finance_audit_logs(id,entity_type,entity_id,action,before_data,after_data,reason,actor,created_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9)', [log.id || crypto.randomUUID(), log.entityType, String(log.entityId), log.action, JSON.stringify(log.beforeData || {}), JSON.stringify(log.afterData || {}), log.reason || '', log.actor || '', log.createdAt || new Date().toISOString()]); }
async function createFinanceTransaction(input) {
	await ensureSchema(); const client = await pool.connect(); const now = input.createdAt || new Date().toISOString(); const id = input.id || crypto.randomUUID();
	try { await client.query('BEGIN'); await client.query('INSERT INTO finance_transactions(id,kind,account_id,from_account_id,to_account_id,amount,occurred_at,category,description,counterparty,status,source_type,source_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)', [id,input.kind,input.accountId||null,input.fromAccountId||null,input.toAccountId||null,Number(input.amount),input.occurredAt,input.category||'',input.description||'',input.counterparty||'',input.status||'posted',input.sourceType||'',input.sourceId||'',input.createdBy||'',now]); const result = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1`, [id])).rows[0]); await createFinanceAuditLog({ entityType:'finance_transaction', entityId:id, action:'created', afterData:result, actor:input.createdBy, createdAt:now }, client); await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function updateFinanceTransaction(id, changes, actor) {
	await ensureSchema(); const client = await pool.connect(); try { await client.query('BEGIN'); const current = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1 FOR UPDATE`, [id])).rows[0]); if (!current) { await client.query('ROLLBACK'); return null; } if (current.status === 'voided') throw Object.assign(new Error('لا يمكن تعديل حركة ملغاة.'), { code:'FINANCE_VOIDED' }); const updatedAt = new Date().toISOString(); await client.query('UPDATE finance_transactions SET occurred_at=$1,category=$2,description=$3,counterparty=$4,updated_at=$5 WHERE id=$6', [changes.occurredAt || current.occurredAt, changes.category ?? current.category, changes.description ?? current.description, changes.counterparty ?? current.counterparty, updatedAt, id]); const result = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1`, [id])).rows[0]); await createFinanceAuditLog({ entityType:'finance_transaction', entityId:id, action:'updated', beforeData:current, afterData:result, actor, createdAt:updatedAt }, client); await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function voidFinanceTransaction(id, reason, actor) {
	await ensureSchema(); const client = await pool.connect(); try { await client.query('BEGIN'); const current = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1 FOR UPDATE`, [id])).rows[0]); if (!current) { await client.query('ROLLBACK'); return null; } if (current.status === 'voided') { await client.query('COMMIT'); return current; } const now = new Date().toISOString(); await client.query('UPDATE finance_transactions SET status=$1,void_reason=$2,updated_at=$3 WHERE id=$4', ['voided', String(reason || '').trim(), now, id]); const result = financeTransactionRow((await client.query(`${FINANCE_TRANSACTION_SELECT} WHERE id = $1`, [id])).rows[0]); await createFinanceAuditLog({ entityType:'finance_transaction', entityId:id, action:'voided', beforeData:current, afterData:result, reason, actor, createdAt:now }, client); await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function listFinancePayrollPayments(month) { await ensureSchema(); const result = await pool.query('SELECT id,employee_id AS "employeeId",month,amount,transaction_id AS "transactionId",status,approved_by AS "approvedBy",created_at AS "createdAt",updated_at AS "updatedAt" FROM finance_payroll_payments WHERE month = $1', [month]); return result.rows.map(financePayrollRow); }
async function getFinanceSummary({ from, to }) {
	await ensureSchema(); const [accountsResult, periodResult, allResult] = await Promise.all([pool.query('SELECT id,name,opening_balance AS "openingBalance",is_active AS "isActive",created_at AS "createdAt",updated_at AS "updatedAt" FROM finance_accounts ORDER BY created_at ASC'), pool.query('SELECT kind,account_id,from_account_id,to_account_id,amount,category FROM finance_transactions WHERE status=$1 AND occurred_at >= $2 AND occurred_at <= $3', ['posted',from,to]), pool.query('SELECT kind,account_id,from_account_id,to_account_id,amount FROM finance_transactions WHERE status=$1', ['posted'])]);
	const totals = { income:0, expense:0, transfer:0 }; const byCategory = {}; for (const row of periodResult.rows) { totals[row.kind] = (totals[row.kind] || 0) + Number(row.amount); if (row.kind === 'expense') byCategory[row.category || 'أخرى'] = (byCategory[row.category || 'أخرى'] || 0) + Number(row.amount); }
	const balances = accountsResult.rows.map(account => { let balance = Number(account.openingBalance || 0); let income = 0; let expense = 0; for (const row of allResult.rows) { if (row.kind === 'income' && row.account_id === account.id) balance += Number(row.amount); if (row.kind === 'expense' && row.account_id === account.id) balance -= Number(row.amount); if (row.kind === 'transfer' && row.from_account_id === account.id) balance -= Number(row.amount); if (row.kind === 'transfer' && row.to_account_id === account.id) balance += Number(row.amount); } for (const row of periodResult.rows) { if (row.kind === 'income' && row.account_id === account.id) income += Number(row.amount); if (row.kind === 'expense' && row.account_id === account.id) expense += Number(row.amount); } return { ...financeAccountRow(account), balance, income, expense, net: income - expense }; });
	return { ...totals, net: totals.income - totals.expense, balances, byCategory };
}
async function approveFinancePayroll({ month, payments, approvedBy, accountId }) {
	await ensureSchema(); const client = await pool.connect(); try { await client.query('BEGIN'); const account = (await client.query('SELECT id FROM finance_accounts WHERE id=$1 AND is_active=TRUE', [accountId])).rows[0]; if (!account) throw Object.assign(new Error('الخزنة غير موجودة.'), { code:'FINANCE_ACCOUNT_NOT_FOUND' }); const result = []; const now = new Date().toISOString(); for (const payment of payments) { const existing = (await client.query('SELECT id,employee_id AS "employeeId",month,amount,transaction_id AS "transactionId",status,approved_by AS "approvedBy",created_at AS "createdAt",updated_at AS "updatedAt" FROM finance_payroll_payments WHERE employee_id=$1 AND month=$2 FOR UPDATE', [payment.employeeId,month])).rows[0]; if (existing) { result.push(financePayrollRow(existing)); continue; } let transactionId = null; if (Number(payment.amount) > 0) { transactionId = crypto.randomUUID(); const transaction = { id:transactionId, kind:'expense', accountId, amount:Number(payment.amount), occurredAt:`${month}-01`, category:'رواتب', description:`راتب شهر ${month}`, counterparty:payment.employeeName || '', status:'posted', sourceType:'payroll', sourceId:`${payment.employeeId}:${month}`, createdBy:approvedBy || '', createdAt:now }; await client.query('INSERT INTO finance_transactions(id,kind,account_id,amount,occurred_at,category,description,counterparty,status,source_type,source_id,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [transaction.id,transaction.kind,transaction.accountId,transaction.amount,transaction.occurredAt,transaction.category,transaction.description,transaction.counterparty,transaction.status,transaction.sourceType,transaction.sourceId,transaction.createdBy,transaction.createdAt]); await createFinanceAuditLog({ entityType:'finance_transaction',entityId:transactionId,action:'created',afterData:transaction,actor:approvedBy,createdAt:now }, client); }
		const id = crypto.randomUUID(); await client.query('INSERT INTO finance_payroll_payments(id,employee_id,month,amount,transaction_id,status,approved_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [id,payment.employeeId,month,Number(payment.amount),transactionId,'paid',approvedBy||'',now]); const line = { id,employeeId:Number(payment.employeeId),month,amount:Number(payment.amount),transactionId,status:'paid',approvedBy:approvedBy||'',createdAt:now }; await createFinanceAuditLog({ entityType:'payroll_payment',entityId:id,action:'approved',afterData:line,actor:approvedBy,createdAt:now }, client); result.push(line); } await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); if (error?.code === '23505') error.code = 'FINANCE_PAYROLL_DUPLICATE'; throw error; } finally { client.release(); }
}

async function deleteAdminSession(token) {
	await ensureSchema();
	await pool.query('DELETE FROM admin_sessions WHERE token = $1', [token]);
}
async function deleteAdminSessionsForUsername(username) { await ensureSchema(); await pool.query('DELETE FROM admin_sessions WHERE username = $1', [username]); }

module.exports = { readStore, writeStore, savePage, createEmployeeWithAccount, createLead, getLead, updateLead, createAuditLog, deleteLead, listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, findCustomerByPhone, readWheelState, writeWheelState, createWheelClaim, listWheelClaims, updateWheelClaim, deleteWheelClaim, countWheelClaims, writeAsset, readAsset, createAdminSession, getAdminSession, deleteAdminSession, deleteAdminSessionsForUsername, findAdminUser, listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, getMetadata, setMetadata, createFeedback, listFeedback, getFeedback, updateFeedback, updateFeedbackBatch, setMissingFeedbackBatch, listPublishedFeedback, listFinanceAccounts, listFinanceTransactions, createFinanceTransaction, updateFinanceTransaction, voidFinanceTransaction, listFinancePayrollPayments, getFinanceSummary, approveFinancePayroll, databaseFile: null, pool, ensureSchema };
