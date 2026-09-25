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
				notes TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ
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
			CREATE TABLE IF NOT EXISTS wheel_state (
				id INTEGER PRIMARY KEY CHECK (id = 1), data JSONB NOT NULL
			);
		`);
	}
	return schemaPromise;
}

async function readStore() {
	await ensureSchema();
	const [pages, leads, programs, auditLogs] = await Promise.all([
		pool.query('SELECT key, data, updated_at AS "updatedAt" FROM pages'),
		pool.query('SELECT id,name,whatsapp,school,student_type AS "studentType",program,source,status,notes,created_at AS "createdAt",updated_at AS "updatedAt" FROM leads ORDER BY created_at DESC'),
		pool.query('SELECT id,name,slug,category,language,price,features,is_active AS "isActive",enrollment_status AS "enrollmentStatus",created_at AS "createdAt",updated_at AS "updatedAt" FROM programs ORDER BY created_at DESC'),
		pool.query('SELECT id,action,entity_type AS "entityType",entity_id AS "entityId",actor,ip,created_at AS "createdAt" FROM audit_logs ORDER BY created_at DESC')
	]);
	return {
		pages: Object.fromEntries(pages.rows.map(row => [row.key, { data: row.data, updatedAt: row.updatedAt }])),
		leads: leads.rows,
		programs: programs.rows.map(row => ({ ...row, price: Number(row.price), isActive: Boolean(row.isActive) })),
		auditLogs: auditLogs.rows
	};
}

async function writeStore(store) {
	await ensureSchema();
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query('TRUNCATE pages, leads, programs, audit_logs');
		for (const [key, value] of Object.entries(store.pages || {})) {
			await client.query('INSERT INTO pages(key,data,updated_at) VALUES ($1,$2::jsonb,$3)', [key, JSON.stringify(value.data ?? {}), value.updatedAt || new Date().toISOString()]);
		}
		for (const lead of store.leads || []) {
			await client.query(`INSERT INTO leads(id,name,whatsapp,school,student_type,program,source,status,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [lead.id, lead.name || '', lead.whatsapp || '', lead.school || '', lead.studentType || '', lead.program || '', lead.source || '', lead.status || 'new', lead.notes || '', lead.createdAt || new Date().toISOString(), lead.updatedAt || null]);
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

module.exports = { readStore, writeStore, readWheelState, writeWheelState, databaseFile: null, pool, ensureSchema };
