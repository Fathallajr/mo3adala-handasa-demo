const Database = require('better-sqlite3');
const database = require('./database-postgres');
const sqliteFile = process.env.SQLITE_FILE || require('path').join(__dirname, 'data', 'app.db');
const wheelStateFile = require('path').join(__dirname, 'data', 'wheel-state.json');
const uploadsDir = require('path').join(__dirname, 'uploads');

async function main() {
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
	const sqlite = new Database(sqliteFile, { readonly: true });
	const store = {
		pages: {},
		leads: sqlite.prepare('SELECT key, data, updated_at FROM pages').all().reduce((pages, row) => { pages[row.key] = { data: JSON.parse(row.data), updatedAt: row.updated_at }; return pages; }, {}),
		programs: sqlite.prepare('SELECT id,name,slug,category,language,price,features,is_active AS isActive,enrollment_status AS enrollmentStatus,created_at AS createdAt,updated_at AS updatedAt FROM programs').all().map(row => ({ ...row, features: JSON.parse(row.features || '[]'), isActive: Boolean(row.isActive) })),
		auditLogs: sqlite.prepare('SELECT id,action,entity_type AS entityType,entity_id AS entityId,actor,ip,created_at AS createdAt FROM audit_logs').all()
	};
	let wheelState = { spins: {}, claims: {} };
	try { wheelState = JSON.parse(require('fs').readFileSync(wheelStateFile, 'utf8')); } catch {}
	store.leads = sqlite.prepare('SELECT id,name,whatsapp,school,student_type AS studentType,program,source,status,notes,created_at AS createdAt,updated_at AS updatedAt FROM leads').all();
	sqlite.close();
	await database.writeStore(store);
	await database.writeWheelState(wheelState);
	let assetCount = 0;
	try {
		const fs = require('fs');
		for (const filename of fs.readdirSync(uploadsDir)) {
			const fullPath = require('path').join(uploadsDir, filename);
			if (!fs.statSync(fullPath).isFile()) continue;
			const mimeType = filename.endsWith('.png') ? 'image/png' : filename.endsWith('.webp') ? 'image/webp' : filename.endsWith('.gif') ? 'image/gif' : 'image/jpeg';
			await database.writeAsset({ filename, mimeType, data: fs.readFileSync(fullPath) });
			assetCount += 1;
		}
	} catch {}
	console.log(`Migrated ${Object.keys(store.pages).length} pages, ${store.leads.length} leads, ${store.programs.length} programs, ${Object.keys(wheelState.claims || {}).length} wheel claims and ${assetCount} uploaded assets to PostgreSQL.`);
	await database.pool.end();
}

main().catch(error => { console.error(`PostgreSQL migration failed: ${error.message}`); process.exitCode = 1; });
