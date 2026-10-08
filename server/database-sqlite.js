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
  CREATE TABLE IF NOT EXISTS assets (
    filename TEXT PRIMARY KEY, mime_type TEXT NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY, expires_at TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin',
    username TEXT NOT NULL DEFAULT '', permissions TEXT NOT NULL DEFAULT '[]'
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
`);
try { db.prepare("ALTER TABLE admin_sessions ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE admin_sessions ADD COLUMN username TEXT NOT NULL DEFAULT ''").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.prepare("ALTER TABLE admin_sessions ADD COLUMN permissions TEXT NOT NULL DEFAULT '[]'").run(); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
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
	db.prepare('INSERT INTO finance_transactions(id,kind,account_id,from_account_id,to_account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id, input.kind, input.accountId || null, input.fromAccountId || null, input.toAccountId || null, Number(input.amount), input.occurredAt, input.category || '', input.description || '', input.status || 'posted', input.sourceType || '', input.sourceId || '', input.createdBy || '', now, null);
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
			if (existing?.status === 'paid') { result.push({ ...existing, amount: Number(existing.amount) }); continue; }
			let transactionId = null;
			if (Number(payment.amount) > 0) {
				transactionId = crypto.randomUUID();
				db.prepare('INSERT INTO finance_transactions(id,kind,account_id,amount,occurred_at,category,description,status,source_type,source_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(transactionId, 'expense', accountId, Number(payment.amount), `${month}-01`, 'رواتب', `راتب شهر ${month}`, 'posted', 'payroll', `${payment.employeeId}:${month}`, approvedBy || '', now);
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

module.exports = { readStore, writeStore, savePage, updateEmployeeProfile, createEmployeeWithAccount, createLead, getLead, updateLead, createAuditLog, deleteLead, listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, findCustomerByPhone, readWheelState, writeWheelState, createWheelClaim, findWheelClaimByPhone, listWheelClaims, updateWheelClaim, deleteWheelClaim, countWheelClaims, writeAsset, readAsset, createAdminSession, getAdminSession, deleteAdminSession, deleteAdminSessionsForUsername, findAdminUser, listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, getMetadata, setMetadata, createFeedback, listFeedback, getFeedback, updateFeedback, updateFeedbackBatch, setMissingFeedbackBatch, listPublishedFeedback, listFinanceAccounts, listFinanceTransactions, createFinanceTransaction, updateFinanceTransaction, voidFinanceTransaction, listFinancePayrollPayments, resetFinancePayrollPayment, createFinancePayrollPayment, listFinanceAuditLogs, getFinanceSummary, approveFinancePayroll, databaseFile };
