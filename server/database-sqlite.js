const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'new', notes TEXT DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT
  );
  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, category TEXT NOT NULL,
    language TEXT NOT NULL, price REAL NOT NULL DEFAULT 0, features TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1, enrollment_status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
    actor TEXT DEFAULT '', ip TEXT DEFAULT '', created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS analytics_sessions (
    id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL,
	started_at TEXT NOT NULL, ended_at TEXT, ip_address TEXT DEFAULT '', ip_hash TEXT DEFAULT '', country TEXT DEFAULT '', region TEXT DEFAULT '', city TEXT DEFAULT '',
    device TEXT DEFAULT '', browser TEXT DEFAULT '', os TEXT DEFAULT '', referrer TEXT DEFAULT '', landing_path TEXT DEFAULT '',
    acquisition_source TEXT DEFAULT '', acquisition_medium TEXT DEFAULT '', acquisition_campaign TEXT DEFAULT '', user_agent TEXT DEFAULT '',
    page_views INTEGER NOT NULL DEFAULT 0, duration_seconds INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS analytics_sessions_last_seen_idx ON analytics_sessions(last_seen);
  CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_idx ON analytics_sessions(visitor_id);
  CREATE TABLE IF NOT EXISTS analytics_page_views (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL, path TEXT NOT NULL, title TEXT DEFAULT '', component TEXT DEFAULT '',
    entered_at TEXT NOT NULL, exited_at TEXT, active_seconds INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES analytics_sessions(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS analytics_page_views_session_idx ON analytics_page_views(session_id);
  CREATE INDEX IF NOT EXISTS analytics_page_views_created_idx ON analytics_page_views(created_at);
  CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, university TEXT DEFAULT '', batch TEXT DEFAULT '',
    rating INTEGER NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL, updated_at TEXT
  );
  CREATE TABLE IF NOT EXISTS wheel_state (
    id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS wheel_claims (
    token TEXT PRIMARY KEY, name TEXT NOT NULL, whatsapp TEXT NOT NULL UNIQUE,
    program TEXT NOT NULL, gift TEXT NOT NULL, notes TEXT DEFAULT '', claimed_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS free_code_requests (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, whatsapp TEXT NOT NULL UNIQUE,
    program TEXT NOT NULL, requested_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS assets (
    filename TEXT PRIMARY KEY, mime_type TEXT NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY, expires_at TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin',
    username TEXT NOT NULL DEFAULT '', permissions TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS admin_activity_sessions (
    token TEXT PRIMARY KEY, username TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT 'admin',
    login_at TEXT NOT NULL, last_seen TEXT NOT NULL, logout_at TEXT
  );
  CREATE TABLE IF NOT EXISTS admin_users (
    username TEXT PRIMARY KEY, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor', permissions TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT
  );
  CREATE TABLE IF NOT EXISTS finance_accounts (
    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, opening_balance REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT
  );
  CREATE TABLE IF NOT EXISTS finance_transactions (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, account_id TEXT, from_account_id TEXT,
    to_account_id TEXT, amount REAL NOT NULL, occurred_at TEXT NOT NULL, category TEXT DEFAULT '',
    description TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'posted',
    source_type TEXT DEFAULT '', source_id TEXT DEFAULT '', created_by TEXT DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT, void_reason TEXT DEFAULT '',
    FOREIGN KEY(account_id) REFERENCES finance_accounts(id),
    FOREIGN KEY(from_account_id) REFERENCES finance_accounts(id),
    FOREIGN KEY(to_account_id) REFERENCES finance_accounts(id)
  );
  CREATE INDEX IF NOT EXISTS finance_transactions_date_idx ON finance_transactions(occurred_at);
  CREATE INDEX IF NOT EXISTS finance_transactions_source_idx ON finance_transactions(source_type, source_id);
  CREATE TABLE IF NOT EXISTS finance_payroll_payments (
    id TEXT PRIMARY KEY, employee_id INTEGER NOT NULL, month TEXT NOT NULL, amount REAL NOT NULL,
    transaction_id TEXT, status TEXT NOT NULL DEFAULT 'paid', approved_by TEXT DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT, UNIQUE(employee_id, month),
    FOREIGN KEY(transaction_id) REFERENCES finance_transactions(id)
  );
  CREATE TABLE IF NOT EXISTS finance_audit_logs (
    id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL,
    before_data TEXT DEFAULT '{}', after_data TEXT DEFAULT '{}', reason TEXT DEFAULT '',
    actor TEXT DEFAULT '', created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS finance_loans (
    id TEXT PRIMARY KEY, lender_account_id TEXT NOT NULL, borrower_account_id TEXT NOT NULL,
    amount REAL NOT NULL, repaid_amount REAL NOT NULL DEFAULT 0, occurred_at TEXT NOT NULL,
    due_at TEXT DEFAULT '', reason TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'open',
    transfer_transaction_id TEXT NOT NULL, created_by TEXT DEFAULT '', created_at TEXT NOT NULL,
    updated_at TEXT, cancel_reason TEXT DEFAULT '',
    FOREIGN KEY(lender_account_id) REFERENCES finance_accounts(id),
    FOREIGN KEY(borrower_account_id) REFERENCES finance_accounts(id),
    FOREIGN KEY(transfer_transaction_id) REFERENCES finance_transactions(id)
  );
  CREATE INDEX IF NOT EXISTS finance_loans_status_idx ON finance_loans(status);
`);
try { db.prepare("ALTER TABLE admin_sessions ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE admin_sessions ADD COLUMN username TEXT NOT NULL DEFAULT ''").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE admin_sessions ADD COLUMN permissions TEXT NOT NULL DEFAULT '[]'").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE analytics_sessions ADD COLUMN ip_address TEXT DEFAULT ''").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE leads ADD COLUMN attribution TEXT DEFAULT '{}'").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE feedbacks ADD COLUMN batch TEXT DEFAULT ''").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE wheel_claims ADD COLUMN notes TEXT DEFAULT ''").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE finance_transactions DROP COLUMN counterparty").run(); } catch (error) { if (!String(error.message).includes('no such column')) throw error; }

function migrateLegacyStore() {
  if (db.prepare('SELECT value FROM metadata WHERE key = ?').get('legacy-json-migrated')) return;
  let legacy = { pages: {}, leads: [], programs: [], auditLogs: [], feedbacks: [] };
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
    const feedbackInsert = db.prepare('INSERT OR IGNORE INTO feedbacks(id,name,university,batch,rating,message,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)');
    for (const feedback of Array.isArray(legacy.feedbacks) ? legacy.feedbacks : []) feedbackInsert.run(feedback.id, feedback.name || '', feedback.university || '', feedback.batch || '', Number(feedback.rating || 0), feedback.message || '', feedback.status || 'new', feedback.createdAt || new Date().toISOString(), feedback.updatedAt || null);
    db.prepare('INSERT INTO metadata(key,value) VALUES (?,?)').run('legacy-json-migrated', new Date().toISOString());
  });
  insert();
}

migrateLegacyStore();

function ensureFinanceAccounts() {
	const insert = db.prepare('INSERT OR IGNORE INTO finance_accounts(id,name,opening_balance,is_active,created_at) VALUES (?,?,?,?,?)');
	const now = new Date().toISOString();
	insert.run('application', 'أبلكيشن', 0, 1, now);
	insert.run('studio', 'استوديو', 0, 1, now);
}

ensureFinanceAccounts();

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
	const feedbacks = db.prepare('SELECT id,name,university,batch,rating,message,status,created_at AS createdAt,updated_at AS updatedAt FROM feedbacks ORDER BY created_at DESC').all();
  return { pages, leads, programs, auditLogs, feedbacks };
}

function writeStore(store) {
  const transaction = db.transaction(() => {
    // Pages have their own atomic savePage() path. Do not rewrite them from
    // this potentially stale full-store snapshot: program/lead updates used
    // to bring back old CMS content and silently delete newer news.
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

function savePage(key, data, updatedAt) {
	const timestamp = updatedAt || new Date().toISOString();
	db.prepare('INSERT INTO pages(key,data,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').run(key, JSON.stringify(data ?? {}), timestamp);
	return { data: data ?? {}, updatedAt: timestamp };
}

function updateEmployeeProfile({ employeeId, employee, email, updatedAt }) {
	return db.transaction(() => {
		const row = db.prepare('SELECT data FROM pages WHERE key = ?').get('employees');
		let page = { items: [] };
		try { page = row?.data ? JSON.parse(row.data) : page; } catch {}
		const items = Array.isArray(page.items) ? page.items : [];
		const index = items.findIndex(item => String(item?.id) === String(employeeId));
		if (index < 0) throw Object.assign(new Error('الموظف غير موجود.'), { code: 'EMPLOYEE_NOT_FOUND' });
		const current = items[index];
		const currentEmail = String(current.email || '').trim().toLowerCase();
		const nextEmail = String(email || '').trim().toLowerCase();
		if (nextEmail !== currentEmail) {
			if (db.prepare('SELECT 1 FROM admin_users WHERE username = ?').get(nextEmail)) throw Object.assign(new Error('هذا البريد مستخدم بالفعل.'), { code: 'DUPLICATE_EMAIL' });
			const result = db.prepare('UPDATE admin_users SET username = ?, updated_at = ? WHERE username = ? AND role = ?').run(nextEmail, updatedAt, currentEmail, 'employee');
			if (!result.changes) throw Object.assign(new Error('لا يوجد حساب دخول مرتبط بهذا الموظف.'), { code: 'EMPLOYEE_ACCOUNT_NOT_FOUND' });
			db.prepare('DELETE FROM admin_sessions WHERE username = ?').run(currentEmail);
		}
		const savedEmployee = { ...current, ...employee, id: current.id, email: nextEmail };
		const nextPage = { ...page, items: items.map((item, itemIndex) => itemIndex === index ? savedEmployee : item) };
		db.prepare('INSERT INTO pages(key,data,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').run('employees', JSON.stringify(nextPage), updatedAt);
		db.prepare('INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES (?,?,?,?,?,?,?)').run(crypto.randomUUID(), 'updated', 'employee', String(employeeId), '', '', updatedAt);
		return { data: nextPage, employee: savedEmployee };
	})();
}

function createEmployeeWithAccount({ employee, email, passwordHash, passwordSalt, createdAt }) {
	return db.transaction(() => {
		const row = db.prepare('SELECT data FROM pages WHERE key = ?').get('employees');
		let page = { items: [] };
		try { page = row?.data ? JSON.parse(row.data) : page; } catch {}
		const items = Array.isArray(page.items) ? page.items : [];
		const nextId = items.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0) + 1;
		const savedEmployee = { ...employee, id: nextId };
		const nextPage = { ...page, items: [...items, savedEmployee] };
		const timestamp = createdAt || new Date().toISOString();
		db.prepare('INSERT INTO pages(key,data,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').run('employees', JSON.stringify(nextPage), timestamp);
		db.prepare('INSERT INTO admin_users(username,password_hash,password_salt,role,permissions,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run(email, passwordHash, passwordSalt, 'employee', JSON.stringify(['employees', `employee:${nextId}`]), 1, timestamp, null);
		db.prepare('INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES (?,?,?,?,?,?,?)').run(crypto.randomUUID(), 'created', 'employee', String(nextId), '', '', timestamp);
		return { data: nextPage, employee: savedEmployee, employeeId: String(nextId) };
	})();
}

function createLead(lead, auditLog) {
	const insert = db.transaction(() => {
		db.prepare(`INSERT INTO leads(id,name,whatsapp,school,student_type,program,source,status,notes,attribution,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(lead.id, lead.name, lead.whatsapp, lead.school, lead.studentType, lead.program, lead.source, lead.status, lead.notes, JSON.stringify(lead.attribution || {}), lead.createdAt, lead.updatedAt);
		db.prepare('INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES (?,?,?,?,?,?,?)').run(auditLog.id, auditLog.action, auditLog.entityType, auditLog.entityId, auditLog.actor || '', auditLog.ip || '', auditLog.createdAt);
	});
	try { insert(); } catch (error) { if (String(error.message).includes('UNIQUE constraint failed: leads.whatsapp')) error.code = 'DUPLICATE_PHONE'; throw error; }
	return lead;
}

function deleteLead(id) {
	return db.prepare('DELETE FROM leads WHERE id = ?').run(id).changes > 0;
}

function listCustomers() { return db.prepare('SELECT id,name,phone,status,notes,created_at AS createdAt,updated_at AS updatedAt FROM customers ORDER BY created_at DESC').all(); }
function getCustomer(id) { return db.prepare('SELECT id,name,phone,status,notes,created_at AS createdAt,updated_at AS updatedAt FROM customers WHERE id = ?').get(id) || null; }
function createCustomer(customer) { db.prepare('INSERT INTO customers(id,name,phone,status,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(customer.id, customer.name, customer.phone, customer.status || 'new', customer.notes || '', customer.createdAt, customer.updatedAt || null); return customer; }
function updateCustomer(id, changes) {
  const fields = [], values = [];
  if (changes.name !== undefined) { fields.push('name = ?'); values.push(String(changes.name || '').trim()); }
  if (changes.phone !== undefined) { fields.push('phone = ?'); values.push(String(changes.phone || '').trim()); }
  if (changes.status !== undefined) { fields.push('status = ?'); values.push(changes.status); }
  if (changes.notes !== undefined) { fields.push('notes = ?'); values.push(String(changes.notes || '').trim()); }
  if (changes.updatedAt !== undefined) { fields.push('updated_at = ?'); values.push(changes.updatedAt); }
  if (!fields.length) return getCustomer(id);
  values.push(id); const result = db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return result.changes ? getCustomer(id) : null;
}
function deleteCustomer(id) { return db.prepare('DELETE FROM customers WHERE id = ?').run(id).changes > 0; }
function findCustomerByPhone(phone) { return db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone) || null; }

function updateLead(id, changes) {
	const fields = [];
	const values = [];
	if (changes.status !== undefined) { fields.push('status = ?'); values.push(changes.status); }
	if (changes.notes !== undefined) { fields.push('notes = ?'); values.push(String(changes.notes || '').trim()); }
	if (changes.updatedAt !== undefined) { fields.push('updated_at = ?'); values.push(changes.updatedAt); }
	if (!fields.length) return getLead(id);
	values.push(id);
	const result = db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...values);
	if (!result.changes) return null;
	return getLead(id);
}

function getLead(id) {
	const lead = db.prepare('SELECT id,name,whatsapp,school,student_type AS studentType,program,source,status,notes,attribution,created_at AS createdAt,updated_at AS updatedAt FROM leads WHERE id = ?').get(id);
	if (!lead) return null;
	try { lead.attribution = JSON.parse(lead.attribution || '{}'); } catch { lead.attribution = {}; }
	return lead;
}

function createAuditLog(log) {
	db.prepare('INSERT INTO audit_logs(id,action,entity_type,entity_id,actor,ip,created_at) VALUES (?,?,?,?,?,?,?)').run(log.id, log.action || '', log.entityType || '', log.entityId || '', log.actor || '', log.ip || '', log.createdAt || new Date().toISOString());
}

function readWheelState() {
	const row = db.prepare('SELECT data FROM wheel_state WHERE id = 1').get();
	let state;
	try { state = row ? JSON.parse(row.data) : { spins: {}, claims: {} }; } catch { state = { spins: {}, claims: {} }; }
	const insert = db.prepare('INSERT OR IGNORE INTO wheel_claims(token,name,whatsapp,program,gift,claimed_at) VALUES (?,?,?,?,?,?)');
	for (const spin of Object.values(state.spins || {}).filter(item => item?.claimed && item?.token && item?.phone)) insert.run(spin.token, spin.name || '', spin.phone, spin.program || '', spin.gift?.label || '', spin.claimedAt || new Date().toISOString());
	return state;
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

function createAdminSession(token, expiresAt, role = 'admin', username = '', permissions = []) {
	db.prepare('INSERT INTO admin_sessions(token, expires_at, role, username, permissions) VALUES (?, ?, ?, ?, ?)').run(token, expiresAt, role, username, JSON.stringify(permissions));
	const now = new Date().toISOString();
	db.prepare('INSERT INTO admin_activity_sessions(token, username, role, login_at, last_seen) VALUES (?, ?, ?, ?, ?)').run(token, username, role, now, now);
}

function getAdminSession(token) {
	const row = db.prepare('SELECT expires_at AS expiresAt, role, username, permissions FROM admin_sessions WHERE token = ?').get(token);
	if (!row) return null;
	try { row.permissions = JSON.parse(row.permissions || '[]'); } catch { row.permissions = []; }
	return row;
}

function deleteAdminSession(token) {
	db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}
function touchAdminActivity(token, username = '', role = 'admin') { const now = new Date().toISOString(); db.prepare(`INSERT INTO admin_activity_sessions(token, username, role, login_at, last_seen) VALUES (?, ?, ?, ?, ?) ON CONFLICT(token) DO UPDATE SET username = COALESCE(NULLIF(excluded.username, ''), admin_activity_sessions.username), role = excluded.role, last_seen = CASE WHEN admin_activity_sessions.logout_at IS NULL THEN excluded.last_seen ELSE admin_activity_sessions.last_seen END`).run(token, username, role, now, now); }
function endAdminActivity(token) { db.prepare('UPDATE admin_activity_sessions SET logout_at = COALESCE(logout_at, ?) WHERE token = ?').run(new Date().toISOString(), token); }
function endAdminActivitiesForUsername(username) { if (!username) return; db.prepare('UPDATE admin_activity_sessions SET logout_at = COALESCE(logout_at, ?) WHERE username = ? AND logout_at IS NULL').run(new Date().toISOString(), username); }
function getAdminActivitySession(token) { return db.prepare('SELECT token,username,role,login_at AS loginAt,last_seen AS lastSeen,logout_at AS logoutAt FROM admin_activity_sessions WHERE token = ?').get(token) || null; }
function closeStaleAdminActivitySessions(idleMs = 5 * 60 * 1000) { const now = Date.now(); const cutoff = new Date(now - Math.max(Number(idleMs) || 0, 0)).toISOString(); db.prepare('UPDATE admin_activity_sessions SET logout_at = COALESCE(logout_at, ?) WHERE logout_at IS NULL AND last_seen < ?').run(new Date(now).toISOString(), cutoff); }
function listAdminActivitySessions(limit = 100) { closeStaleAdminActivitySessions(); return db.prepare('SELECT token,username,role,login_at AS loginAt,last_seen AS lastSeen,logout_at AS logoutAt FROM admin_activity_sessions ORDER BY login_at DESC LIMIT ?').all(Math.min(Math.max(Number(limit) || 100, 1), 200)); }
function getAnalyticsSessionDetails(id) {
	const session = db.prepare('SELECT id,visitor_id AS visitorId,first_seen AS firstSeen,last_seen AS lastSeen,started_at AS startedAt,ended_at AS endedAt,ip_address AS ipAddress,ip_hash AS ipHash,country,region,city,device,browser,os,referrer,landing_path AS landingPath,acquisition_source AS acquisitionSource,acquisition_medium AS acquisitionMedium,acquisition_campaign AS acquisitionCampaign,user_agent AS userAgent,page_views AS pageViews,duration_seconds AS durationSeconds FROM analytics_sessions WHERE id = ?').get(id);
	if (!session) return null;
	const pageViews = db.prepare('SELECT id,path,title,component,entered_at AS enteredAt,exited_at AS exitedAt,active_seconds AS activeSeconds,created_at AS createdAt FROM analytics_page_views WHERE session_id = ? ORDER BY entered_at ASC').all(id);
	return { ...session, pageViewsDetails: pageViews };
}
function deleteAdminSessionsForUsername(username) { db.prepare('DELETE FROM admin_sessions WHERE username = ?').run(username); }

function findAdminUser(username) {
	const row = db.prepare('SELECT username,password_hash AS passwordHash,password_salt AS passwordSalt,role,permissions,is_active AS isActive FROM admin_users WHERE username = ?').get(username);
	if (!row) return null;
	try { row.permissions = JSON.parse(row.permissions || '[]'); } catch { row.permissions = []; }
	row.isActive = Boolean(row.isActive);
	return row;
}

function listAdminUsers() {
	return db.prepare('SELECT username,role,permissions,is_active AS isActive,created_at AS createdAt,updated_at AS updatedAt FROM admin_users ORDER BY created_at DESC').all().map(row => { try { row.permissions = JSON.parse(row.permissions || '[]'); } catch { row.permissions = []; } row.isActive = Boolean(row.isActive); return row; });
}

function createAdminUser(user) {
	db.prepare('INSERT INTO admin_users(username,password_hash,password_salt,role,permissions,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run(user.username, user.passwordHash, user.passwordSalt, user.role || 'editor', JSON.stringify(user.permissions || []), user.isActive === false ? 0 : 1, user.createdAt, user.updatedAt || null);
}

function updateAdminUser(username, changes) {
	const fields = [];
	const values = [];
	if (changes.passwordHash) { fields.push('password_hash = ?', 'password_salt = ?'); values.push(changes.passwordHash, changes.passwordSalt); }
	if (changes.permissions) { fields.push('permissions = ?'); values.push(JSON.stringify(changes.permissions)); }
	if (changes.isActive !== undefined) { fields.push('is_active = ?'); values.push(changes.isActive ? 1 : 0); }
	if (changes.updatedAt) { fields.push('updated_at = ?'); values.push(changes.updatedAt); }
	if (!fields.length) return;
	values.push(username);
	db.prepare(`UPDATE admin_users SET ${fields.join(', ')} WHERE username = ?`).run(...values);
}

function deleteAdminUser(username) { db.prepare('DELETE FROM admin_users WHERE username = ?').run(username); }
function getMetadata(key) { const row = db.prepare('SELECT value FROM metadata WHERE key = ?').get(key); return row?.value ?? null; }
function setMetadata(key, value) { db.prepare('INSERT INTO metadata(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value)); }
function createFeedback(feedback) { db.prepare('INSERT INTO feedbacks(id,name,university,batch,rating,message,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(feedback.id, feedback.name, feedback.university || '', feedback.batch || '', feedback.rating, feedback.message, feedback.status || 'new', feedback.createdAt, feedback.updatedAt || null); }
function listFeedback() { return db.prepare('SELECT id,name,university,batch,rating,message,status,created_at AS createdAt,updated_at AS updatedAt FROM feedbacks ORDER BY created_at DESC').all(); }
function getFeedback(id) { return db.prepare('SELECT id,name,university,batch,rating,message,status,created_at AS createdAt,updated_at AS updatedAt FROM feedbacks WHERE id = ?').get(id) || null; }
function updateFeedback(id, changes) { const fields = []; const values = []; if (changes.status) { fields.push('status = ?'); values.push(changes.status); } if (changes.updatedAt) { fields.push('updated_at = ?'); values.push(changes.updatedAt); } if (!fields.length) return; values.push(id); db.prepare(`UPDATE feedbacks SET ${fields.join(', ')} WHERE id = ?`).run(...values); }
function updateFeedbackBatch(fromBatch, toBatch, updatedAt) { return db.prepare('UPDATE feedbacks SET batch = ?, updated_at = ? WHERE TRIM(batch) = ?').run(toBatch, updatedAt, fromBatch).changes; }
function setMissingFeedbackBatch(batch, updatedAt) { return db.prepare("UPDATE feedbacks SET batch = ?, updated_at = ? WHERE batch IS NULL OR TRIM(batch) = '' OR TRIM(batch) IN ('غير محدد', 'غير محددة', 'بدون اختيار', 'لم يتم الاختيار')").run(batch, updatedAt).changes; }
function listPublishedFeedback() { return db.prepare("SELECT id,name,university,batch,rating,message,status,created_at AS createdAt,updated_at AS updatedAt FROM feedbacks WHERE status = 'published' ORDER BY created_at DESC LIMIT 50").all(); }
function findWheelClaimByPhone(whatsapp) { readWheelState(); return db.prepare('SELECT token,name,whatsapp,program,gift,notes,claimed_at AS claimedAt FROM wheel_claims WHERE whatsapp = ?').get(whatsapp) || null; }
function createWheelClaim(claim) { try { db.prepare('INSERT INTO wheel_claims(token,name,whatsapp,program,gift,notes,claimed_at) VALUES (?,?,?,?,?,?,?)').run(claim.token, claim.name, claim.whatsapp, claim.program, claim.gift, claim.notes || '', claim.claimedAt); } catch (error) { if (String(error.message).includes('UNIQUE constraint failed')) error.code = 'DUPLICATE_WHEEL_CLAIM'; throw error; } }
function listWheelClaims() { readWheelState(); return db.prepare('SELECT token,name,whatsapp,program,gift,notes,claimed_at AS claimedAt FROM wheel_claims ORDER BY claimed_at DESC').all(); }
function updateWheelClaim(token, changes) { const result = db.prepare('UPDATE wheel_claims SET notes = ? WHERE token = ?').run(String(changes.notes || '').trim(), token); return result.changes ? db.prepare('SELECT token,name,whatsapp,program,gift,notes,claimed_at AS claimedAt FROM wheel_claims WHERE token = ?').get(token) : null; }
function deleteWheelClaim(token) { return db.prepare('DELETE FROM wheel_claims WHERE token = ?').run(token).changes > 0; }
function countWheelClaims() { listWheelClaims(); return db.prepare('SELECT COUNT(*) AS count FROM wheel_claims').get().count; }
function buildFreeCodeRequestFilters(filters = {}) {
	const clauses = [];
	const values = [];
	const add = value => { values.push(value); return '?'; };
	const search = String(filters.search || '').trim();
	if (search) { const term = `%${search}%`; clauses.push(`(name LIKE ${add(term)} OR whatsapp LIKE ${add(term)} OR program LIKE ${add(term)})`); }
	const program = String(filters.program || '').trim();
	if (program) clauses.push(`program = ${add(program)}`);
	const from = String(filters.from || '').trim();
	if (from) clauses.push(`date(requested_at) >= date(${add(from)})`);
	const to = String(filters.to || '').trim();
	if (to) clauses.push(`date(requested_at) <= date(${add(to)})`);
	return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values };
}
function createFreeCodeRequest(request) { const result = db.prepare('INSERT INTO free_code_requests(id,name,whatsapp,program,requested_at) VALUES (?,?,?,?,?) ON CONFLICT(whatsapp) DO NOTHING').run(request.id, request.name, request.whatsapp, request.program, request.requestedAt); return result.changes ? request : null; }
function findFreeCodeRequestByPhone(whatsapp) { return db.prepare('SELECT id,name,whatsapp,program,requested_at AS requestedAt FROM free_code_requests WHERE whatsapp = ?').get(whatsapp) || null; }
function listFreeCodeRequests() { return db.prepare('SELECT id,name,whatsapp,program,requested_at AS requestedAt FROM free_code_requests ORDER BY requested_at DESC').all(); }
function listFreeCodeRequestsPage(page = 1, limit = 20, filters = {}) { const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100); const safePage = Math.max(Number(page) || 1, 1); const query = buildFreeCodeRequestFilters(filters); query.values.push(safeLimit, (safePage - 1) * safeLimit); return db.prepare(`SELECT id,name,whatsapp,program,requested_at AS requestedAt FROM free_code_requests ${query.where} ORDER BY requested_at DESC LIMIT ? OFFSET ?`).all(...query.values); }
function countFreeCodeRequests(filters = {}) { const query = buildFreeCodeRequestFilters(filters); return db.prepare(`SELECT COUNT(*) AS count FROM free_code_requests ${query.where}`).get(...query.values).count; }

function listFinanceAccounts() {
	return db.prepare('SELECT id,name,opening_balance AS openingBalance,is_active AS isActive,created_at AS createdAt,updated_at AS updatedAt FROM finance_accounts ORDER BY created_at ASC').all().map(item => ({ ...item, openingBalance: Number(item.openingBalance), isActive: Boolean(item.isActive) }));
}

function financeTransactionRow(row) {
	if (!row) return null;
	return { ...row, amount: Number(row.amount), accountId: row.accountId || null, fromAccountId: row.fromAccountId || null, toAccountId: row.toAccountId || null };
}

function listFinanceTransactions(filters = {}) {
	let sql = `SELECT id,kind,account_id AS accountId,from_account_id AS fromAccountId,to_account_id AS toAccountId,amount,occurred_at AS occurredAt,category,description,status,source_type AS sourceType,source_id AS sourceId,created_by AS createdBy,created_at AS createdAt,updated_at AS updatedAt,void_reason AS voidReason FROM finance_transactions WHERE 1=1`;
	const values = [];
	const add = (fragment, value) => { values.push(value); sql += ` AND ${fragment} ?`; };
	if (filters.kind) add('kind =', filters.kind);
	if (filters.accountId) { values.push(filters.accountId, filters.accountId, filters.accountId); sql += ' AND (account_id = ? OR from_account_id = ? OR to_account_id = ?)'; }
	if (filters.status) add('status =', filters.status);
	if (filters.sourceType) add('source_type =', filters.sourceType);
	if (filters.from) add('occurred_at >=', filters.from);
	if (filters.to) add('occurred_at <=', filters.to);
	if (filters.search) { const search = `%${filters.search}%`; values.push(search, search); sql += ' AND (description LIKE ? OR category LIKE ?)'; }
	sql += ' ORDER BY occurred_at DESC, created_at DESC';
	if (filters.limit) { values.push(Number(filters.limit)); sql += ' LIMIT ?'; }
	if (filters.offset) { values.push(Number(filters.offset)); sql += ' OFFSET ?'; }
	return db.prepare(sql).all(...values).map(financeTransactionRow);
}

function createFinanceAuditLog(log) {
	db.prepare('INSERT INTO finance_audit_logs(id,entity_type,entity_id,action,before_data,after_data,reason,actor,created_at) VALUES (?,?,?,?,?,?,?,?,?)').run(log.id || crypto.randomUUID(), log.entityType, String(log.entityId), log.action, JSON.stringify(log.beforeData || {}), JSON.stringify(log.afterData || {}), log.reason || '', log.actor || '', log.createdAt || new Date().toISOString());
}

function createFinanceTransaction(input) {
	const now = input.createdAt || new Date().toISOString();
	const id = input.id || crypto.randomUUID();
	db.prepare('INSERT INTO finance_transactions(id,kind,account_id,from_account_id,to_account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id, input.kind, input.accountId || null, input.fromAccountId || null, input.toAccountId || null, Number(input.amount), input.occurredAt, input.category || '', input.description || '', input.status || 'posted', input.sourceType || '', input.sourceId || '', input.createdBy || '', now, null);
	const result = financeTransactionRow(db.prepare('SELECT id,kind,account_id AS accountId,from_account_id AS fromAccountId,to_account_id AS toAccountId,amount,occurred_at AS occurredAt,category,description,status,source_type AS sourceType,source_id AS sourceId,created_by AS createdBy,created_at AS createdAt,updated_at AS updatedAt,void_reason AS voidReason FROM finance_transactions WHERE id = ?').get(id));
	createFinanceAuditLog({ entityType: 'finance_transaction', entityId: id, action: 'created', afterData: result, actor: input.createdBy, createdAt: now });
	return result;
}

function updateFinanceTransaction(id, changes, actor) {
	const current = financeTransactionRow(db.prepare('SELECT id,kind,account_id AS accountId,from_account_id AS fromAccountId,to_account_id AS toAccountId,amount,occurred_at AS occurredAt,category,description,status,source_type AS sourceType,source_id AS sourceId,created_by AS createdBy,created_at AS createdAt,updated_at AS updatedAt,void_reason AS voidReason FROM finance_transactions WHERE id = ?').get(id));
	if (!current) return null;
	if (current.status === 'voided') throw Object.assign(new Error('لا يمكن تعديل حركة ملغاة.'), { code: 'FINANCE_VOIDED' });
	const next = { ...current, ...changes, amount: current.amount, kind: current.kind, accountId: current.accountId, fromAccountId: current.fromAccountId, toAccountId: current.toAccountId, sourceType: current.sourceType, sourceId: current.sourceId, updatedAt: new Date().toISOString() };
	db.prepare('UPDATE finance_transactions SET occurred_at=?,category=?,description=?,updated_at=? WHERE id=?').run(next.occurredAt, next.category || '', next.description || '', next.updatedAt, id);
	const result = financeTransactionRow(db.prepare('SELECT id,kind,account_id AS accountId,from_account_id AS fromAccountId,to_account_id AS toAccountId,amount,occurred_at AS occurredAt,category,description,status,source_type AS sourceType,source_id AS sourceId,created_by AS createdBy,created_at AS createdAt,updated_at AS updatedAt,void_reason AS voidReason FROM finance_transactions WHERE id = ?').get(id));
	createFinanceAuditLog({ entityType: 'finance_transaction', entityId: id, action: 'updated', beforeData: current, afterData: result, actor, createdAt: next.updatedAt });
	return result;
}

function voidFinanceTransaction(id, reason, actor) {
	const current = financeTransactionRow(db.prepare('SELECT id,kind,account_id AS accountId,from_account_id AS fromAccountId,to_account_id AS toAccountId,amount,occurred_at AS occurredAt,category,description,status,source_type AS sourceType,source_id AS sourceId,created_by AS createdBy,created_at AS createdAt,updated_at AS updatedAt,void_reason AS voidReason FROM finance_transactions WHERE id = ?').get(id));
	if (!current) return null;
	if (current.status === 'voided') return current;
	const now = new Date().toISOString();
	db.prepare('UPDATE finance_transactions SET status = ?, void_reason = ?, updated_at = ? WHERE id = ?').run('voided', String(reason || '').trim(), now, id);
	const result = financeTransactionRow(db.prepare('SELECT id,kind,account_id AS accountId,from_account_id AS fromAccountId,to_account_id AS toAccountId,amount,occurred_at AS occurredAt,category,description,status,source_type AS sourceType,source_id AS sourceId,created_by AS createdBy,created_at AS createdAt,updated_at AS updatedAt,void_reason AS voidReason FROM finance_transactions WHERE id = ?').get(id));
	createFinanceAuditLog({ entityType: 'finance_transaction', entityId: id, action: 'voided', beforeData: current, afterData: result, reason, actor, createdAt: now });
	return result;
}

function financeLoanRow(row) {
	return row ? { ...row, amount: Number(row.amount), repaidAmount: Number(row.repaidAmount || 0), remainingAmount: Math.max(0, Number(row.amount) - Number(row.repaidAmount || 0)) } : null;
}
function listFinanceLoans() {
	return db.prepare(`SELECT l.id,l.lender_account_id AS lenderAccountId,l.borrower_account_id AS borrowerAccountId,
	 l.amount,l.repaid_amount AS repaidAmount,l.occurred_at AS occurredAt,l.due_at AS dueAt,l.reason,l.status,
	 l.transfer_transaction_id AS transferTransactionId,l.created_by AS createdBy,l.created_at AS createdAt,
	 l.updated_at AS updatedAt,l.cancel_reason AS cancelReason, la.name AS lenderName, ba.name AS borrowerName
	 FROM finance_loans l JOIN finance_accounts la ON la.id=l.lender_account_id JOIN finance_accounts ba ON ba.id=l.borrower_account_id
	 ORDER BY l.occurred_at DESC,l.created_at DESC`).all().map(financeLoanRow);
}
function createFinanceLoan(input) {
	return db.transaction(() => {
		const now = input.createdAt || new Date().toISOString();
		const id = input.id || crypto.randomUUID(); const transferId = crypto.randomUUID();
		db.prepare('INSERT INTO finance_transactions(id,kind,from_account_id,to_account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(transferId, 'transfer', input.lenderAccountId, input.borrowerAccountId, Number(input.amount), input.occurredAt, 'سلفة بين الخزائن', input.reason || '', 'posted', 'inter-vault-loan', id, input.createdBy || '', now);
		const loan = { id, lenderAccountId: input.lenderAccountId, borrowerAccountId: input.borrowerAccountId, amount: Number(input.amount), repaidAmount: 0, occurredAt: input.occurredAt, dueAt: input.dueAt || '', reason: input.reason || '', status: 'open', transferTransactionId: transferId, createdBy: input.createdBy || '', createdAt: now, updatedAt: null, cancelReason: '' };
		db.prepare('INSERT INTO finance_loans(id,lender_account_id,borrower_account_id,amount,repaid_amount,occurred_at,due_at,reason,status,transfer_transaction_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id, loan.lenderAccountId, loan.borrowerAccountId, loan.amount, 0, loan.occurredAt, loan.dueAt, loan.reason, loan.status, transferId, loan.createdBy, now);
		createFinanceAuditLog({ entityType:'finance_loan', entityId:id, action:'created', afterData:loan, actor:input.createdBy, createdAt:now });
		return financeLoanRow(db.prepare(`SELECT l.*, l.lender_account_id AS lenderAccountId,l.borrower_account_id AS borrowerAccountId,l.repaid_amount AS repaidAmount,l.occurred_at AS occurredAt,l.due_at AS dueAt,l.transfer_transaction_id AS transferTransactionId,l.created_by AS createdBy,l.created_at AS createdAt,l.updated_at AS updatedAt,l.cancel_reason AS cancelReason,la.name AS lenderName,ba.name AS borrowerName FROM finance_loans l JOIN finance_accounts la ON la.id=l.lender_account_id JOIN finance_accounts ba ON ba.id=l.borrower_account_id WHERE l.id=?`).get(id));
	})();
}
function repayFinanceLoan(id, amount, actor, reason = '') {
	return db.transaction(() => {
		const current = financeLoanRow(db.prepare(`SELECT l.*, l.lender_account_id AS lenderAccountId,l.borrower_account_id AS borrowerAccountId,l.repaid_amount AS repaidAmount,l.occurred_at AS occurredAt,l.due_at AS dueAt,l.transfer_transaction_id AS transferTransactionId,l.created_by AS createdBy,l.created_at AS createdAt,l.updated_at AS updatedAt,l.cancel_reason AS cancelReason,la.name AS lenderName,ba.name AS borrowerName FROM finance_loans l JOIN finance_accounts la ON la.id=l.lender_account_id JOIN finance_accounts ba ON ba.id=l.borrower_account_id WHERE l.id=?`).get(id));
		if (!current) throw Object.assign(new Error('السلفة غير موجودة.'), { code:'FINANCE_LOAN_NOT_FOUND' });
		if (!['open','partial'].includes(current.status)) throw Object.assign(new Error('السلفة ليست قابلة للسداد.'), { code:'FINANCE_LOAN_CLOSED' });
		const payment = Number(amount); if (!Number.isFinite(payment) || payment <= 0 || payment > current.remainingAmount + 0.005) throw Object.assign(new Error('مبلغ السداد أكبر من المتبقي.'), { code:'FINANCE_LOAN_AMOUNT' });
		const now = new Date().toISOString(); const txId = crypto.randomUUID();
		db.prepare('INSERT INTO finance_transactions(id,kind,from_account_id,to_account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(txId,'transfer',current.borrowerAccountId,current.lenderAccountId,payment,current.occurredAt,'سداد سلفة',reason || 'سداد سلفة','posted','inter-vault-loan-repayment',id,actor || '',now);
		const repaid = current.repaidAmount + payment; const status = repaid >= current.amount - 0.005 ? 'repaid' : 'partial';
		db.prepare('UPDATE finance_loans SET repaid_amount=?,status=?,updated_at=? WHERE id=?').run(repaid,status,now,id);
		const next = financeLoanRow(db.prepare(`SELECT l.*, l.lender_account_id AS lenderAccountId,l.borrower_account_id AS borrowerAccountId,l.repaid_amount AS repaidAmount,l.occurred_at AS occurredAt,l.due_at AS dueAt,l.transfer_transaction_id AS transferTransactionId,l.created_by AS createdBy,l.created_at AS createdAt,l.updated_at AS updatedAt,l.cancel_reason AS cancelReason,la.name AS lenderName,ba.name AS borrowerName FROM finance_loans l JOIN finance_accounts la ON la.id=l.lender_account_id JOIN finance_accounts ba ON ba.id=l.borrower_account_id WHERE l.id=?`).get(id));
		createFinanceAuditLog({entityType:'finance_loan',entityId:id,action:'repaid',beforeData:current,afterData:next,reason,actor,createdAt:now}); return next;
	})();
}
function cancelFinanceLoan(id, reason, actor) {
	return db.transaction(() => {
		const current = financeLoanRow(db.prepare(`SELECT l.*, l.lender_account_id AS lenderAccountId,l.borrower_account_id AS borrowerAccountId,l.repaid_amount AS repaidAmount,l.occurred_at AS occurredAt,l.due_at AS dueAt,l.transfer_transaction_id AS transferTransactionId,l.created_by AS createdBy,l.created_at AS createdAt,l.updated_at AS updatedAt,l.cancel_reason AS cancelReason,la.name AS lenderName,ba.name AS borrowerName FROM finance_loans l JOIN finance_accounts la ON la.id=l.lender_account_id JOIN finance_accounts ba ON ba.id=l.borrower_account_id WHERE l.id=?`).get(id));
		if (!current) return null; if (!['open','partial'].includes(current.status)) throw Object.assign(new Error('السلفة مغلقة بالفعل.'), {code:'FINANCE_LOAN_CLOSED'});
		const remaining=current.remainingAmount; const now=new Date().toISOString(); if (remaining > 0) db.prepare('INSERT INTO finance_transactions(id,kind,from_account_id,to_account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),'transfer',current.borrowerAccountId,current.lenderAccountId,remaining,current.occurredAt,'إلغاء سلفة',reason,'posted','inter-vault-loan-cancel',id,actor || '',now);
		db.prepare('UPDATE finance_loans SET repaid_amount=amount,status=?,cancel_reason=?,updated_at=? WHERE id=?').run('cancelled',reason,now,id); const next=financeLoanRow(db.prepare(`SELECT l.*,l.lender_account_id AS lenderAccountId,l.borrower_account_id AS borrowerAccountId,l.repaid_amount AS repaidAmount,l.occurred_at AS occurredAt,l.due_at AS dueAt,l.transfer_transaction_id AS transferTransactionId,l.created_by AS createdBy,l.created_at AS createdAt,l.updated_at AS updatedAt,l.cancel_reason AS cancelReason,la.name AS lenderName,ba.name AS borrowerName FROM finance_loans l JOIN finance_accounts la ON la.id=l.lender_account_id JOIN finance_accounts ba ON ba.id=l.borrower_account_id WHERE l.id=?`).get(id)); createFinanceAuditLog({entityType:'finance_loan',entityId:id,action:'cancelled',beforeData:current,afterData:next,reason,actor,createdAt:now}); return next;
	})();
}

function listFinancePayrollPayments(month) {
	return db.prepare('SELECT id,employee_id AS employeeId,month,amount,transaction_id AS transactionId,status,approved_by AS approvedBy,created_at AS createdAt,updated_at AS updatedAt FROM finance_payroll_payments WHERE month = ?').all(month).map(item => ({ ...item, amount: Number(item.amount) }));
}

function resetFinancePayrollPayment(employeeId, month, actor) {
	return db.transaction(() => {
		const current = db.prepare('SELECT id,employee_id AS employeeId,month,amount,transaction_id AS transactionId,status,approved_by AS approvedBy,created_at AS createdAt,updated_at AS updatedAt FROM finance_payroll_payments WHERE employee_id = ? AND month = ?').get(employeeId, month);
		if (!current) return null;
		if (current.status !== 'paid') return { ...current, amount: Number(current.amount) };
		const now = new Date().toISOString();
		if (current.transactionId) voidFinanceTransaction(current.transactionId, `إرجاع راتب ${current.employeeId} إلى مستحق`, actor);
		db.prepare('DELETE FROM finance_payroll_payments WHERE id = ?').run(current.id);
		const result = { ...current, amount: Number(current.amount), status: 'due', updatedAt: now };
		createFinanceAuditLog({ entityType: 'payroll_payment', entityId: current.id, action: 'reset_to_due', beforeData: current, afterData: result, reason: 'إرجاع الحالة إلى مستحق', actor, createdAt: now });
		return result;
	})();
}

function listFinanceAuditLogs(entityId = '', limit = 100) {
	const rows = entityId
		? db.prepare('SELECT id,entity_type AS entityType,entity_id AS entityId,action,before_data AS beforeData,after_data AS afterData,reason,actor,created_at AS createdAt FROM finance_audit_logs WHERE entity_id = ? ORDER BY created_at DESC LIMIT ?').all(String(entityId), Math.min(Number(limit) || 100, 300))
		: db.prepare('SELECT id,entity_type AS entityType,entity_id AS entityId,action,before_data AS beforeData,after_data AS afterData,reason,actor,created_at AS createdAt FROM finance_audit_logs ORDER BY created_at DESC LIMIT ?').all(Math.min(Number(limit) || 100, 300));
	return rows.map(row => { try { row.beforeData = JSON.parse(row.beforeData || '{}'); } catch { row.beforeData = {}; } try { row.afterData = JSON.parse(row.afterData || '{}'); } catch { row.afterData = {}; } return row; });
}

function createFinancePayrollPayment(payment) {
	db.prepare('INSERT INTO finance_payroll_payments(id,employee_id,month,amount,transaction_id,status,approved_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(payment.id || crypto.randomUUID(), payment.employeeId, payment.month, Number(payment.amount), payment.transactionId || null, payment.status || 'paid', payment.approvedBy || '', payment.createdAt || new Date().toISOString(), null);
}

function getFinanceSummary({ from, to }) {
	const accounts = listFinanceAccounts();
	const rows = db.prepare('SELECT * FROM finance_transactions WHERE status = ? AND occurred_at >= ? AND occurred_at <= ?').all('posted', from, to);
	const allRows = db.prepare('SELECT * FROM finance_transactions WHERE status = ?').all('posted');
	const totals = { income: 0, expense: 0, transfer: 0 };
	for (const row of rows) totals[row.kind] = (totals[row.kind] || 0) + Number(row.amount || 0);
	const balances = accounts.map(account => {
		let balance = Number(account.openingBalance || 0);
		let income = 0;
		let expense = 0;
		for (const row of allRows) {
			if (row.kind === 'income' && row.account_id === account.id) balance += Number(row.amount);
			if (row.kind === 'expense' && row.account_id === account.id) balance -= Number(row.amount);
			if (row.kind === 'transfer' && row.from_account_id === account.id) balance -= Number(row.amount);
			if (row.kind === 'transfer' && row.to_account_id === account.id) balance += Number(row.amount);
		}
		for (const row of rows) {
			if (row.kind === 'income' && row.account_id === account.id) income += Number(row.amount);
			if (row.kind === 'expense' && row.account_id === account.id) expense += Number(row.amount);
		}
		return { ...account, balance, income, expense, net: income - expense };
	});
	const byCategory = {};
	for (const row of rows.filter(item => item.kind === 'expense')) byCategory[row.category || 'أخرى'] = (byCategory[row.category || 'أخرى'] || 0) + Number(row.amount);
	return { ...totals, net: totals.income - totals.expense, balances, byCategory };
}

function approveFinancePayroll({ month, payments, approvedBy, accountId }) {
	return db.transaction(() => {
		const now = new Date().toISOString();
		const account = db.prepare('SELECT id FROM finance_accounts WHERE id = ? AND is_active = 1').get(accountId);
		if (!account) throw Object.assign(new Error('الخزنة غير موجودة.'), { code: 'FINANCE_ACCOUNT_NOT_FOUND' });
		const result = [];
		for (const payment of payments) {
			const existing = db.prepare('SELECT id,employee_id AS employeeId,month,amount,transaction_id AS transactionId,status,approved_by AS approvedBy,created_at AS createdAt,updated_at AS updatedAt FROM finance_payroll_payments WHERE employee_id = ? AND month = ?').get(payment.employeeId, month);
			if (existing?.status === 'paid') { if (Math.abs(Number(existing.amount) - Number(payment.amount)) >= 0.005) throw Object.assign(new Error('المبلغ المعتمد لا يطابق صافي الراتب.'), { code: 'FINANCE_PAYROLL_AMOUNT_MISMATCH' }); result.push({ ...existing, amount: Number(existing.amount) }); continue; }
			let transactionId = null;
			if (Number(payment.amount) > 0) {
				transactionId = crypto.randomUUID();
				db.prepare('INSERT INTO finance_transactions(id,kind,account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(transactionId, 'expense', accountId, Number(payment.amount), `${month}-01`, 'رواتب', `راتب شهر ${month}`, 'posted', 'payroll', `${payment.employeeId}:${month}`, approvedBy || '', now);
			}
			const id = existing?.id || crypto.randomUUID();
			if (existing) db.prepare('UPDATE finance_payroll_payments SET amount = ?, transaction_id = ?, status = ?, approved_by = ?, updated_at = ? WHERE id = ?').run(Number(payment.amount), transactionId, 'paid', approvedBy || '', now, id);
			else db.prepare('INSERT INTO finance_payroll_payments(id,employee_id,month,amount,transaction_id,status,approved_by,created_at) VALUES (?,?,?,?,?,?,?,?)').run(id, payment.employeeId, month, Number(payment.amount), transactionId, 'paid', approvedBy || '', now);
			result.push({ id, employeeId: payment.employeeId, month, amount: Number(payment.amount), transactionId, status: 'paid', approvedBy, createdAt: now });
			createFinanceAuditLog({ entityType: 'payroll_payment', entityId: id, action: 'approved', afterData: result[result.length - 1], actor: approvedBy, createdAt: now });
		}
		return result;
	})();
}

function recordAnalyticsHit({ session, pageView }) {
	const now = new Date().toISOString();
	const save = db.transaction(() => {
		const existing = db.prepare('SELECT id FROM analytics_sessions WHERE id = ?').get(session.id);
		if (existing) {
			db.prepare(`UPDATE analytics_sessions SET last_seen = ?, ended_at = COALESCE(?, ended_at), ip_address = COALESCE(NULLIF(?, ''), ip_address), ip_hash = COALESCE(NULLIF(?, ''), ip_hash),
				page_views = ?, duration_seconds = ?, country = COALESCE(NULLIF(?, ''), country), region = COALESCE(NULLIF(?, ''), region), city = COALESCE(NULLIF(?, ''), city), referrer = COALESCE(NULLIF(?, ''), referrer), acquisition_source = COALESCE(NULLIF(?, ''), acquisition_source),
				acquisition_medium = COALESCE(NULLIF(?, ''), acquisition_medium), acquisition_campaign = COALESCE(NULLIF(?, ''), acquisition_campaign) WHERE id = ?`)
				.run(session.lastSeen || now, session.endedAt || null, session.ipAddress || '', session.ipHash || '', Number(session.pageViews || 0), Number(session.durationSeconds || 0), session.country || '', session.region || '', session.city || '', session.referrer || '', session.acquisitionSource || '', session.acquisitionMedium || '', session.acquisitionCampaign || '', session.id);
		} else {
			db.prepare(`INSERT INTO analytics_sessions(id,visitor_id,first_seen,last_seen,started_at,ended_at,ip_address,ip_hash,country,region,city,device,browser,os,referrer,landing_path,acquisition_source,acquisition_medium,acquisition_campaign,user_agent,page_views,duration_seconds)
				VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(session.id, session.visitorId, session.firstSeen || now, session.lastSeen || now, session.startedAt || now, session.endedAt || null, session.ipAddress || '', session.ipHash || '', session.country || '', session.region || '', session.city || '', session.device || '', session.browser || '', session.os || '', session.referrer || '', session.landingPath || '', session.acquisitionSource || '', session.acquisitionMedium || '', session.acquisitionCampaign || '', session.userAgent || '', Number(session.pageViews || 0), Number(session.durationSeconds || 0));
		}
		if (pageView?.id) {
			db.prepare(`INSERT INTO analytics_page_views(id,session_id,path,title,component,entered_at,exited_at,active_seconds,created_at) VALUES (?,?,?,?,?,?,?,?,?)
				ON CONFLICT(id) DO UPDATE SET exited_at = COALESCE(excluded.exited_at, analytics_page_views.exited_at), active_seconds = MAX(analytics_page_views.active_seconds, excluded.active_seconds)`).run(pageView.id, session.id, pageView.path || '/', pageView.title || '', pageView.component || '', pageView.enteredAt || now, pageView.exitedAt || null, Number(pageView.activeSeconds || 0), pageView.createdAt || now);
		}
	});
	save();
}

function closeStaleAnalyticsSessions() {
	db.prepare(`UPDATE analytics_sessions SET ended_at = last_seen WHERE ended_at IS NULL AND datetime(last_seen) < datetime('now', '-5 minutes')`).run();
}

function getAnalyticsSummary({ from, to, device = '' }) {
	closeStaleAnalyticsSessions();
	const fromIso = `${from}T00:00:00.000Z`;
	const toIso = `${to}T23:59:59.999Z`;
	const sessionFilter = device ? ' AND device = ?' : '';
	const sessionParams = device ? [fromIso, toIso, device] : [fromIso, toIso];
	const sessions = db.prepare(`SELECT id,visitor_id AS visitorId,first_seen AS firstSeen,last_seen AS lastSeen,started_at AS startedAt,ended_at AS endedAt,ip_hash AS ipHash,country,region,city,device,browser,os,referrer,landing_path AS landingPath,acquisition_source AS acquisitionSource,acquisition_medium AS acquisitionMedium,acquisition_campaign AS acquisitionCampaign,user_agent AS userAgent,page_views AS pageViews,duration_seconds AS durationSeconds FROM analytics_sessions WHERE last_seen >= ? AND last_seen <= ?${sessionFilter} ORDER BY last_seen DESC`).all(...sessionParams);
	const pageViews = db.prepare(`SELECT pv.id,pv.session_id AS sessionId,pv.path,pv.title,pv.component,pv.entered_at AS enteredAt,pv.exited_at AS exitedAt,pv.active_seconds AS activeSeconds,pv.created_at AS createdAt FROM analytics_page_views pv INNER JOIN analytics_sessions s ON s.id = pv.session_id WHERE pv.created_at >= ? AND pv.created_at <= ?${device ? ' AND s.device = ?' : ''} ORDER BY pv.created_at DESC`).all(...sessionParams);
	const pageViewCountBySession = pageViews.reduce((map, row) => map.set(row.sessionId, (map.get(row.sessionId) || 0) + 1), new Map());
	const count = (key) => Object.entries(sessions.reduce((acc, row) => { const value = row[key] || 'غير محدد'; acc[value] = (acc[value] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
	const daily = {};
	for (const row of sessions) { const day = String(row.lastSeen).slice(0, 10); daily[day] = (daily[day] || 0) + 1; }
	const topPages = {};
	for (const row of pageViews) topPages[row.path] = (topPages[row.path] || 0) + 1;
	const sessionById = new Map(sessions.map(row => [row.id, row]));
	const performance = {};
	for (const row of pageViews) {
		const session = sessionById.get(row.sessionId); if (!performance[row.path]) performance[row.path] = { path: row.path, visitors: new Set(), sessions: new Set(), pageViews: 0, duration: 0 };
		const item = performance[row.path]; item.pageViews += 1; item.duration += Number(row.activeSeconds || 0); item.sessions.add(row.sessionId); if (session?.visitorId || session?.ipHash) item.visitors.add(session.visitorId || session.ipHash);
	}
	for (const item of Object.values(performance)) { item.duration = Number(item.duration || 0); }
	return { sessions: sessions.length, visitors: new Set(sessions.map(row => row.visitorId || row.ipHash).filter(Boolean)).size, pageViews: pageViews.length,
		averageSessionDuration: sessions.length ? Math.round(sessions.reduce((sum, row) => sum + Number(row.durationSeconds || 0), 0) / sessions.length) : 0,
		pagesPerSession: sessions.length ? Number((pageViews.length / sessions.length).toFixed(2)) : 0,
		trafficOverTime: Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value })),
		devices: count('device'), countries: count('country'), regions: count('region'), referrers: count('referrer'),
		topPages: Object.entries(topPages).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, value]) => ({ path, value })), performance: Object.values(performance).sort((a, b) => b.pageViews - a.pageViews).slice(0, 20).map(item => ({ path: item.path, visitors: item.visitors.size, sessions: item.sessions.size, pageViews: item.pageViews, averageSessionDuration: item.sessions.size ? Math.round(item.duration / item.sessions.size) : 0, pagesPerSession: item.sessions.size ? Number((item.pageViews / item.sessions.size).toFixed(2)) : 0 })),
		recentSessions: sessions.slice(0, 25).map(row => ({ ...row, pageViews: pageViewCountBySession.get(row.id) || 0 })), from, to };
}

getAnalyticsSummary.touchAdminActivity = touchAdminActivity;
getAnalyticsSummary.closeStaleAnalyticsSessions = closeStaleAnalyticsSessions;
getAnalyticsSummary.endAdminActivity = endAdminActivity;
getAnalyticsSummary.endAdminActivitiesForUsername = endAdminActivitiesForUsername;
getAnalyticsSummary.getAdminActivitySession = getAdminActivitySession;
getAnalyticsSummary.closeStaleAdminActivitySessions = closeStaleAdminActivitySessions;
getAnalyticsSummary.listAdminActivitySessions = listAdminActivitySessions;
getAnalyticsSummary.getAnalyticsSessionDetails = getAnalyticsSessionDetails;

module.exports = { readStore, writeStore, savePage, updateEmployeeProfile, createEmployeeWithAccount, createLead, getLead, updateLead, createAuditLog, deleteLead, listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, findCustomerByPhone, readWheelState, writeWheelState, createWheelClaim, findWheelClaimByPhone, listWheelClaims, updateWheelClaim, deleteWheelClaim, countWheelClaims, createFreeCodeRequest, findFreeCodeRequestByPhone, listFreeCodeRequests, listFreeCodeRequestsPage, countFreeCodeRequests, writeAsset, readAsset, createAdminSession, getAdminSession, deleteAdminSession, deleteAdminSessionsForUsername, findAdminUser, listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, getMetadata, setMetadata, createFeedback, listFeedback, getFeedback, updateFeedback, updateFeedbackBatch, setMissingFeedbackBatch, listPublishedFeedback, listFinanceAccounts, listFinanceTransactions, createFinanceTransaction, updateFinanceTransaction, voidFinanceTransaction, listFinanceLoans, createFinanceLoan, repayFinanceLoan, cancelFinanceLoan, listFinancePayrollPayments, resetFinancePayrollPayment, createFinancePayrollPayment, listFinanceAuditLogs, getFinanceSummary, approveFinancePayroll, recordAnalyticsHit, getAnalyticsSummary, databaseFile };
