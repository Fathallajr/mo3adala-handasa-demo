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
				id TEXT PRIMARY KEY, name TEXT NOT NULL, university TEXT DEFAULT '',
				rating INTEGER NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
				created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ
			);
			CREATE TABLE IF NOT EXISTS wheel_state (
				id INTEGER PRIMARY KEY CHECK (id = 1), data JSONB NOT NULL
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
			ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';
			ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT '';
			ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
			ALTER TABLE leads ADD COLUMN IF NOT EXISTS attribution JSONB NOT NULL DEFAULT '{}'::jsonb;
		`);
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
		,pool.query('SELECT id,name,university,rating,message,status,created_at AS "createdAt",updated_at AS "updatedAt" FROM feedbacks ORDER BY created_at DESC')
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
		await client.query('TRUNCATE pages, leads, programs, audit_logs, feedbacks');
		for (const [key, value] of Object.entries(store.pages || {})) {
			await client.query('INSERT INTO pages(key,data,updated_at) VALUES ($1,$2::jsonb,$3)', [key, JSON.stringify(value.data ?? {}), value.updatedAt || new Date().toISOString()]);
		}
		for (const lead of store.leads || []) {
			await client.query(`INSERT INTO leads(id,name,whatsapp,school,student_type,program,source,status,notes,attribution,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)`, [lead.id, lead.name || '', lead.whatsapp || '', lead.school || '', lead.studentType || '', lead.program || '', lead.source || '', lead.status || 'new', lead.notes || '', JSON.stringify(lead.attribution || {}), lead.createdAt || new Date().toISOString(), lead.updatedAt || null]);
		}
		for (const program of store.programs || []) {
			await client.query(`INSERT INTO programs(id,name,slug,category,language,price,features,is_active,enrollment_status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11)`, [program.id, program.name || '', program.slug || '', program.category || '', program.language || 'ar', Number(program.price || 0), JSON.stringify(program.features || []), program.isActive !== false, program.enrollmentStatus || 'open', program.createdAt || new Date().toISOString(), program.updatedAt || null]);
		}
		for (const log of store.auditLogs || []) {
			await client.query(`INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [log.id || `${log.createdAt || Date.now()}-${Math.random()}`, log.action || '', log.entityType || '', log.entityId || '', log.actor || '', log.ip || '', log.createdAt || new Date().toISOString()]);
		}
		for (const feedback of store.feedbacks || []) {
			await client.query(`INSERT INTO feedbacks(id,name,university,rating,message,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [feedback.id, feedback.name || '', feedback.university || '', Number(feedback.rating || 0), feedback.message || '', feedback.status || 'new', feedback.createdAt || new Date().toISOString(), feedback.updatedAt || null]);
		}
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

async function readWheelState() {
	await ensureSchema();
	const result = await pool.query('SELECT data FROM wheel_state WHERE id = 1');
	return result.rows[0]?.data || { spins: {}, claims: {} };
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
async function createFeedback(feedback) { await ensureSchema(); await pool.query('INSERT INTO feedbacks(id,name,university,rating,message,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [feedback.id, feedback.name, feedback.university || '', feedback.rating, feedback.message, feedback.status || 'new', feedback.createdAt, feedback.updatedAt || null]); }
async function updateFeedback(id, changes) { await ensureSchema(); await pool.query('UPDATE feedbacks SET status = COALESCE($1,status), updated_at = COALESCE($2,updated_at) WHERE id = $3', [changes.status || null, changes.updatedAt || null, id]); }
async function listPublishedFeedback() { await ensureSchema(); const result = await pool.query(`SELECT id,name,university,rating,message,status,created_at AS "createdAt",updated_at AS "updatedAt" FROM feedbacks WHERE status = 'published' ORDER BY created_at DESC LIMIT 50`); return result.rows; }

async function deleteAdminSession(token) {
	await ensureSchema();
	await pool.query('DELETE FROM admin_sessions WHERE token = $1', [token]);
}
async function deleteAdminSessionsForUsername(username) { await ensureSchema(); await pool.query('DELETE FROM admin_sessions WHERE username = $1', [username]); }

module.exports = { readStore, writeStore, readWheelState, writeWheelState, writeAsset, readAsset, createAdminSession, getAdminSession, deleteAdminSession, deleteAdminSessionsForUsername, findAdminUser, listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, createFeedback, updateFeedback, listPublishedFeedback, databaseFile: null, pool, ensureSchema };
