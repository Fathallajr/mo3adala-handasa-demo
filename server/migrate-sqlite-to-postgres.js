const Database = require('better-sqlite3');
const database = require('./database-postgres');
const sqliteFile = process.env.SQLITE_FILE || require('path').join(__dirname, 'data', 'app.db');

async function main() {
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
	const sqlite = new Database(sqliteFile, { readonly: true });
	const store = {
		pages: {},
		leads: sqlite.prepare('SELECT key, data, updated_at FROM pages').all().reduce((pages, row) => { pages[row.key] = { data: JSON.parse(row.data), updatedAt: row.updated_at }; return pages; }, {}),
		programs: sqlite.prepare('SELECT id,name,slug,category,language,price,features,is_active AS isActive,enrollment_status AS enrollmentStatus,created_at AS createdAt,updated_at AS updatedAt FROM programs').all().map(row => ({ ...row, features: JSON.parse(row.features || '[]'), isActive: Boolean(row.isActive) })),
		auditLogs: sqlite.prepare('SELECT id,action,entity_type AS entityType,entity_id AS entityId,actor,ip,created_at AS createdAt FROM audit_logs').all()
	};
	store.leads = sqlite.prepare('SELECT id,name,whatsapp,school,student_type AS studentType,program,source,status,notes,created_at AS createdAt,updated_at AS updatedAt FROM leads').all();
	sqlite.close();
	await database.writeStore(store);
	console.log(`Migrated ${Object.keys(store.pages).length} pages, ${store.leads.length} leads, ${store.programs.length} programs to PostgreSQL.`);
	await database.pool.end();
}

main().catch(error => { console.error(`PostgreSQL migration failed: ${error.message}`); process.exitCode = 1; });
