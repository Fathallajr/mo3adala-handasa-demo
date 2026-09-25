const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
const databaseFile = process.env.SQLITE_FILE || path.join(dataDir, 'app.db');
const legacyStoreFile = path.join(dataDir, 'content-store.json');

fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS pages (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, whatsapp TEXT NOT NULL, school TEXT DEFAULT '',
		student_type TEXT DEFAULT '', program TEXT DEFAULT '', source TEXT DEFAULT '', status TEXT NOT NULL,
		notes TEXT DEFAULT '', attribution TEXT DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS leads_whatsapp_unique ON leads(whatsapp);
  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, category TEXT NOT NULL,
    language TEXT NOT NULL, price REAL NOT NULL DEFAULT 0, features TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1, enrollment_status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
    actor TEXT DEFAULT '', ip TEXT DEFAULT '', created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS wheel_state (
    id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS assets (
    filename TEXT PRIMARY KEY, mime_type TEXT NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY, expires_at TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin'
  );
`);
try { db.prepare("ALTER TABLE admin_sessions ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE leads ADD COLUMN attribution TEXT DEFAULT '{}'").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }

function migrateLegacyStore() {
  if (db.prepare('SELECT value FROM metadata WHERE key = ?').get('legacy-json-migrated')) return;
  let legacy = { pages: {}, leads: [], programs: [], auditLogs: [] };
  try { legacy = JSON.parse(fs.readFileSync(legacyStoreFile, 'utf8')); } catch {}
  const insert = db.transaction(() => {
    const pageInsert = db.prepare('INSERT OR REPLACE INTO pages(key, data, updated_at) VALUES (?, ?, ?)');
    for (const [key, value] of Object.entries(legacy.pages || {})) pageInsert.run(key, JSON.stringify(value.data ?? {}), value.updatedAt || new Date().toISOString());
		const leadInsert = db.prepare(`INSERT OR IGNORE INTO leads(id,name,whatsapp,school,student_type,program,source,status,notes,attribution,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
		for (const lead of Array.isArray(legacy.leads) ? legacy.leads : []) leadInsert.run(lead.id, lead.name || '', lead.whatsapp || '', lead.school || '', lead.studentType || '', lead.program || '', lead.source || '', lead.status || 'new', lead.notes || '', JSON.stringify(lead.attribution || {}), lead.createdAt || new Date().toISOString(), lead.updatedAt || null);
    const programInsert = db.prepare(`INSERT OR IGNORE INTO programs(id,name,slug,category,language,price,features,is_active,enrollment_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    for (const program of Array.isArray(legacy.programs) ? legacy.programs : []) programInsert.run(program.id, program.name || '', program.slug || '', program.category || '', program.language || 'ar', Number(program.price || 0), JSON.stringify(program.features || []), program.isActive === false ? 0 : 1, program.enrollmentStatus || 'open', program.createdAt || new Date().toISOString(), program.updatedAt || null);
    const auditInsert = db.prepare('INSERT OR IGNORE INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES (?,?,?,?,?,?,?)');
    for (const log of Array.isArray(legacy.auditLogs) ? legacy.auditLogs : []) auditInsert.run(log.id || `${log.createdAt || Date.now()}-${Math.random()}`, log.action || '', log.entityType || '', log.entityId || '', log.actor || '', log.ip || '', log.createdAt || new Date().toISOString());
    db.prepare('INSERT INTO metadata(key,value) VALUES (?,?)').run('legacy-json-migrated', new Date().toISOString());
  });
  insert();
}

migrateLegacyStore();

function readStore() {
  const pages = {};
  for (const row of db.prepare('SELECT key, data, updated_at FROM pages').all()) {
    let data = {};
    try { data = JSON.parse(row.data); } catch {}
    pages[row.key] = { data, updatedAt: row.updated_at };
  }
	const leads = db.prepare('SELECT id,name,whatsapp,school,student_type AS studentType,program,source,status,notes,attribution,created_at AS createdAt,updated_at AS updatedAt FROM leads ORDER BY created_at DESC').all().map(lead => { try { lead.attribution = JSON.parse(lead.attribution || '{}'); } catch { lead.attribution = {}; } return lead; });
  const programs = db.prepare('SELECT id,name,slug,category,language,price,features,is_active AS isActive,enrollment_status AS enrollmentStatus,created_at AS createdAt,updated_at AS updatedAt FROM programs ORDER BY created_at DESC').all().map(item => ({ ...item, isActive: Boolean(item.isActive), features: JSON.parse(item.features || '[]') }));
  const auditLogs = db.prepare('SELECT id,action,entity_type AS entityType,entity_id AS entityId,actor,ip,created_at AS createdAt FROM audit_logs ORDER BY created_at DESC').all();
  return { pages, leads, programs, auditLogs };
}

function writeStore(store) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM pages').run();
    const pageInsert = db.prepare('INSERT INTO pages(key,data,updated_at) VALUES (?,?,?)');
    for (const [key, value] of Object.entries(store.pages || {})) pageInsert.run(key, JSON.stringify(value.data ?? {}), value.updatedAt || new Date().toISOString());
    db.prepare('DELETE FROM leads').run();
		const leadInsert = db.prepare(`INSERT INTO leads(id,name,whatsapp,school,student_type,program,source,status,notes,attribution,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
		for (const lead of store.leads || []) leadInsert.run(lead.id, lead.name || '', lead.whatsapp || '', lead.school || '', lead.studentType || '', lead.program || '', lead.source || '', lead.status || 'new', lead.notes || '', JSON.stringify(lead.attribution || {}), lead.createdAt || new Date().toISOString(), lead.updatedAt || null);
    db.prepare('DELETE FROM programs').run();
    const programInsert = db.prepare(`INSERT INTO programs(id,name,slug,category,language,price,features,is_active,enrollment_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    for (const program of store.programs || []) programInsert.run(program.id, program.name, program.slug, program.category, program.language || 'ar', Number(program.price || 0), JSON.stringify(program.features || []), program.isActive === false ? 0 : 1, program.enrollmentStatus || 'open', program.createdAt || new Date().toISOString(), program.updatedAt || null);
    db.prepare('DELETE FROM audit_logs').run();
    const auditInsert = db.prepare('INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES (?,?,?,?,?,?,?)');
    for (const log of store.auditLogs || []) auditInsert.run(log.id || `${log.createdAt || Date.now()}-${Math.random()}`, log.action || '', log.entityType || '', log.entityId || '', log.actor || '', log.ip || '', log.createdAt || new Date().toISOString());
  });
  transaction();
}

function readWheelState() {
	const row = db.prepare('SELECT data FROM wheel_state WHERE id = 1').get();
	try { return row ? JSON.parse(row.data) : { spins: {}, claims: {} }; } catch { return { spins: {}, claims: {} }; }
}

function writeWheelState(state) {
	db.prepare('INSERT INTO wheel_state(id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data').run(JSON.stringify(state));
}

function writeAsset({ filename, mimeType, data, createdAt }) {
	db.prepare('INSERT OR REPLACE INTO assets(filename, mime_type, data, created_at) VALUES (?, ?, ?, ?)').run(filename, mimeType, data, createdAt || new Date().toISOString());
}

function readAsset(filename) {
	const row = db.prepare('SELECT filename, mime_type AS mimeType, data FROM assets WHERE filename = ?').get(filename);
	return row || null;
}

function createAdminSession(token, expiresAt, role = 'admin') {
	db.prepare('INSERT INTO admin_sessions(token, expires_at, role) VALUES (?, ?, ?)').run(token, expiresAt, role);
}

function getAdminSession(token) {
	const row = db.prepare('SELECT expires_at AS expiresAt, role FROM admin_sessions WHERE token = ?').get(token);
	return row || null;
}

function deleteAdminSession(token) {
	db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}

module.exports = { readStore, writeStore, readWheelState, writeWheelState, writeAsset, readAsset, createAdminSession, getAdminSession, deleteAdminSession, databaseFile };
