const express = require('express');
const fs = require('fs/promises');
const fssync = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const LAUNCH_OFFER_ENDPOINT = process.env.LAUNCH_OFFER_ENDPOINT || 'https://script.google.com/macros/s/AKfycbzOMDZcgaUgRacnKnqgngxO_97N5iUU9AVoH1bA5HHEFg0LKS3Lju8ku6yl0nYgrLdQ/exec';
const WHEEL_APPS_SCRIPT_ENDPOINT = process.env.WHEEL_APPS_SCRIPT_ENDPOINT || 'https://script.google.com/macros/s/AKfycbyrF6S-pyZys6aKo75ExPWxXCm9F-zIRKr_t-IvV7gyeCGKIBJ-nnISHMlyaRSNk4_r/exec';
const WHEEL_FORWARD_TO_APPS_SCRIPT = process.env.WHEEL_FORWARD_TO_APPS_SCRIPT === 'true';
// Apps Script can be slow while scanning the sheet for an existing phone.
// Give it enough time to finish so the UI does not invite duplicate retries.
const LAUNCH_OFFER_TIMEOUT_MS = 60000;
const WHEEL_CLAIM_TIMEOUT_MS = 30000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'jr1';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'jr1';
const PAGE_KEYS = [
	'home',
	'photos-2025',
	'faq',
	'contact',
	'news-equation',
	'news-app',
	'news-detail',
	'subscription-details',
	'subscription-ab-reviews',
	'subscription-engineer',
	'subscription-intensive',
	'social',
	'engineers',
	'teacher-details',
	'requirements',
	'schools'
	,'batch-2027'
	,'success-stories'
	,'feedback'
	,'subscription-computers'
	,'subscription-engineering-ar'
	,'subscription-engineering-en'
	,'subscription-computers-ar'
	,'subscription-computers-en'
];
const LEAD_STATUSES = ['new', 'contacted', 'interested', 'registered', 'not_interested', 'follow_up', 'closed'];
const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
const DATA_DIR = path.join(__dirname, 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const WHEEL_STATE_FILE = path.join(DATA_DIR, 'wheel-state.json');
const WHEEL_SECRET_FILE = path.join(DATA_DIR, 'wheel-secret.txt');
const WHEEL_APPS_SCRIPT_SECRET = process.env.WHEEL_APPS_SCRIPT_SECRET || readLocalWheelSecret();
const WHEEL_TTL_MS = 30 * 60 * 1000;
const MAX_WHEEL_ATTEMPTS = 3;
const WHEEL_OPTIONS = [
	{ id: 'cash-50', label: '50 جنيه', weight: 30, available: true },
	{ id: 'lucky-chance', label: 'حظ سعيد', weight: 60, available: false },
	{ id: 'discount-10', label: 'خصم 10%', weight: 10, available: true },
	{ id: 'cash-200', label: '200 جنيه', weight: 30, available: true },
	{ id: 'lucky-empty-1', label: 'حظ سعيد', weight: 60, available: false },
	{ id: 'discount-15', label: 'خصم 15%', weight: 10, available: true },
	{ id: 'cash-100', label: '100 جنيه', weight: 30, available: true },
	{ id: 'lucky-empty-2', label: 'حظ سعيد', weight: 60, available: false },
	{ id: 'discount-20', label: 'خصم 20%', weight: 10, available: true },
];
if (process.env.NODE_ENV === 'production' && (ADMIN_USERNAME === 'jr1' || ADMIN_PASSWORD === 'jr1')) {
	throw new Error('Production requires ADMIN_USERNAME and ADMIN_PASSWORD to be changed from the local defaults.');
}
const CORS_ORIGINS = new Set((process.env.CORS_ORIGINS || 'http://localhost:4200,http://localhost:3001')
	.split(',')
	.map(origin => origin.trim())
	.filter(Boolean));
const rateBuckets = new Map();
let storeWriteQueue = Promise.resolve();

function readLocalWheelSecret() {
	try {
		return fssync.readFileSync(WHEEL_SECRET_FILE, 'utf8').trim();
	} catch {
		return '';
	}
}

function createWheelSignature(createdAt, wheelToken, whatsapp, gift) {
	return crypto
		.createHmac('sha256', WHEEL_APPS_SCRIPT_SECRET)
		.update([createdAt, wheelToken, whatsapp, gift].join('|'))
		.digest('hex');
}

function loadTokens() {
	try {
		if (fssync.existsSync(TOKENS_FILE)) {
			const raw = fssync.readFileSync(TOKENS_FILE, 'utf8');
			const data = JSON.parse(raw);
			const map = new Map();
			const now = Date.now();
			for (const [k, v] of Object.entries(data)) {
				if (typeof v === 'number' && v > now) map.set(k, v);
			}
			return map;
		}
	} catch {}
	return new Map();
}

function saveTokens(map) {
	try {
		const obj = Object.fromEntries(map);
		fssync.mkdirSync(DATA_DIR, { recursive: true });
		fssync.writeFileSync(TOKENS_FILE, JSON.stringify(obj), 'utf8');
	} catch {}
}

const TOKENS = loadTokens();
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');

if (!fssync.existsSync(UPLOADS_DIR)) {
	fssync.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const uploadStorage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
		cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
	}
});
const upload = multer({
	storage: uploadStorage,
	limits: { fileSize: 8 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
		cb(null, allowed.includes(file.mimetype));
	}
});

const openApiDocument = {
	openapi: '3.0.3',
	info: { title: 'Mo3adala Handasa API', version: '1.0.0', description: 'Backend APIs for the public website and admin dashboard.' },
	servers: [{ url: 'http://localhost:3001', description: 'Local development server' }],
	tags: [
		{ name: 'System' },
		{ name: 'Authentication' },
		{ name: 'Content' },
		{ name: 'Leads' },
		{ name: 'Programs' },
		{ name: 'Dashboard' },
		{ name: 'Wheel' }
	],
	components: {
		securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Token' } },
		schemas: {
			Lead: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, whatsapp: { type: 'string' }, school: { type: 'string' }, studentType: { type: 'string' }, program: { type: 'string' }, source: { type: 'string' }, status: { type: 'string', enum: LEAD_STATUSES }, notes: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } },
			WheelGift: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, available: { type: 'boolean' } } },
			Error: { type: 'object', properties: { message: { type: 'string' } } },
			Program: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, slug: { type: 'string' }, category: { type: 'string' }, language: { type: 'string' }, price: { type: 'number' }, features: { type: 'array', items: { type: 'string' } }, isActive: { type: 'boolean' }, enrollmentStatus: { type: 'string', enum: ['open', 'closed'] } } }
		}
	},
	paths: {
		'/api/health': { get: { tags: ['System'], summary: 'Check API health', responses: { 200: { description: 'API is healthy' } } } },
		'/api/auth/login': { post: { tags: ['Authentication'], summary: 'Admin login', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string' }, password: { type: 'string', format: 'password' } } } } } }, responses: { 200: { description: 'Login successful' }, 401: { description: 'Invalid credentials', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } } } } },
		'/api/auth/me': { get: { tags: ['Authentication'], summary: 'Get current admin session', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Current admin' }, 401: { description: 'Unauthorized' } } } },
		'/api/auth/logout': { post: { tags: ['Authentication'], summary: 'Logout current admin session', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Logged out' } } } },
		'/api/content': { get: { tags: ['Content'], summary: 'List public CMS pages', responses: { 200: { description: 'Page summaries' } } } },
		'/api/content/{pageKey}': { get: { tags: ['Content'], summary: 'Get a public CMS page', parameters: [{ name: 'pageKey', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Page content' }, 404: { description: 'Page not found' } } }, put: { tags: ['Content'], summary: 'Save CMS page content', security: [{ bearerAuth: [] }], parameters: [{ name: 'pageKey', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Saved content' }, 401: { description: 'Unauthorized' } } } },
		'/api/admin/leads': { get: { tags: ['Leads'], summary: 'List and filter leads', security: [{ bearerAuth: [] }], parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string', enum: LEAD_STATUSES } }, { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }], responses: { 200: { description: 'Paginated leads' }, 401: { description: 'Unauthorized' } } } },
		'/api/leads': { post: { tags: ['Leads'], summary: 'Create a public lead', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Lead' } } } }, responses: { 201: { description: 'Lead created' }, 400: { description: 'Validation error' } } } },
		'/api/admin/leads/{id}': { get: { tags: ['Leads'], summary: 'Get one lead', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Lead details' }, 404: { description: 'Lead not found' } } }, patch: { tags: ['Leads'], summary: 'Update a lead', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { content: { 'application/json': { schema: { '$ref': '#/components/schemas/Lead' } } } }, responses: { 200: { description: 'Updated lead' }, 404: { description: 'Lead not found' } } } },
		'/api/admin/audit-logs': { get: { tags: ['Dashboard'], summary: 'List admin activity logs', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Activity logs' }, 401: { description: 'Unauthorized' } } } },
		'/api/programs': { get: { tags: ['Programs'], summary: 'List active programs', responses: { 200: { description: 'Active programs' } } } },
		'/api/admin/programs': { get: { tags: ['Programs'], summary: 'List all programs', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Programs' } } }, post: { tags: ['Programs'], summary: 'Create a program', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Program' } } } }, responses: { 201: { description: 'Program created' }, 400: { description: 'Validation error' } } } },
		'/api/admin/programs/{id}': { patch: { tags: ['Programs'], summary: 'Update a program', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { content: { 'application/json': { schema: { '$ref': '#/components/schemas/Program' } } } }, responses: { 200: { description: 'Updated program' }, 404: { description: 'Program not found' } } } },
		'/api/admin/dashboard/summary': { get: { tags: ['Dashboard'], summary: 'Dashboard KPIs and recent activity', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Dashboard summary' }, 401: { description: 'Unauthorized' } } } }
		,'/api/launch-offer': { post: { tags: ['Leads'], summary: 'Register for the launch offer', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Lead' } } } }, responses: { 200: { description: 'Registration forwarded to the external service' }, 400: { description: 'Validation error' }, 409: { description: 'Phone already registered' } } } }
		,'/api/wheel/spin': { post: { tags: ['Wheel'], summary: 'Create or resume a wheel spin', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['sessionId'], properties: { sessionId: { type: 'string', maxLength: 128 } } } } } }, responses: { 200: { description: 'Spin result', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, gift: { '$ref': '#/components/schemas/WheelGift' } } } } } }, 409: { description: 'Wheel already used' } } } }
		,'/api/wheel/claim': { post: { tags: ['Wheel'], summary: 'Claim a winning wheel gift and prevent duplicate phone claims', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'whatsapp', 'program', 'wheelToken'], properties: { name: { type: 'string' }, whatsapp: { type: 'string' }, program: { type: 'string' }, wheelToken: { type: 'string' } } } } } }, responses: { 200: { description: 'Claim result' }, 409: { description: 'Expired spin or duplicate phone' } } } }
		,'/api/wheel/options': { get: { tags: ['Wheel'], summary: 'Get public wheel options', responses: { 200: { description: 'Available wheel options' } } } }
		,'/api/admin/wheel/claims': { get: { tags: ['Wheel'], summary: 'List wheel gift claims', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Wheel claims' }, 401: { description: 'Unauthorized' } } } }
		,'/api/uploads': { post: { tags: ['Content'], summary: 'Upload an image for CMS content', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } } } }, responses: { 200: { description: 'Uploaded asset URL' }, 401: { description: 'Unauthorized' } } } }
	}
};

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));

app.use((req, res, next) => {
	res.setHeader('X-Content-Type-Options', 'nosniff');
	res.setHeader('X-Frame-Options', 'DENY');
	res.setHeader('Referrer-Policy', 'same-origin');
	if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
	next();
});

app.use((req, res, next) => {
	const origin = req.headers.origin;
	if (!origin || CORS_ORIGINS.has(origin)) {
		res.header('Access-Control-Allow-Origin', origin || '*');
	}
	res.header('Vary', 'Origin');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}
	next();
});

function rateLimit({ name, windowMs, max }) {
	return (req, res, next) => {
		const key = `${name}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
		const now = Date.now();
		const current = rateBuckets.get(key);
		if (!current || now - current.startedAt >= windowMs) {
			rateBuckets.set(key, { startedAt: now, count: 1 });
			return next();
		}
		if (current.count >= max) {
			const retryAfter = Math.max(Math.ceil((windowMs - (now - current.startedAt)) / 1000), 1);
			res.setHeader('Retry-After', retryAfter);
			return res.status(429).json({ message: 'Too many requests. Try again later.' });
		}
		current.count += 1;
		next();
	};
}

function getNowIso() {
	return new Date().toISOString();
}

async function readStore() {
	return database.readStore();
}

async function writeStore(store) {
	storeWriteQueue = storeWriteQueue.then(() => database.writeStore(store));
	return storeWriteQueue;
}

function issueToken() {
	const token = crypto.randomBytes(24).toString('hex');
	TOKENS.set(token, Date.now() + TOKEN_TTL_MS);
	saveTokens(TOKENS);
	return token;
}

function requireAdmin(req, res, next) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

	if (!token || !TOKENS.has(token)) {
		return res.status(401).json({ message: 'Unauthorized' });
	}

	const expiresAt = TOKENS.get(token);
	if (Date.now() > expiresAt) {
		TOKENS.delete(token);
		saveTokens(TOKENS);
		return res.status(401).json({ message: 'Session expired' });
	}

	next();
}

function addAuditLog(store, action, entity, entityId, req) {
	store.auditLogs.unshift({
		id: crypto.randomUUID(),
		action,
		entity,
		entityId,
		createdAt: getNowIso(),
		ip: req.ip
	});
	store.auditLogs = store.auditLogs.slice(0, 500);
}

function findLeadByPhone(store, whatsapp) {
	const normalized = normalizePhone(whatsapp);
	return store.leads.find(lead => normalizePhone(lead.whatsapp) === normalized);
}

async function createLead(input, req, options = {}) {
	const store = await readStore();
	const normalizedWhatsapp = normalizePhone(input.whatsapp);
	const existing = findLeadByPhone(store, normalizedWhatsapp);
	if (existing && !options.allowDuplicate) {
		const error = new Error('A lead with this WhatsApp number already exists');
		error.code = 'DUPLICATE_PHONE';
		error.existingLead = existing;
		throw error;
	}
	const now = getNowIso();
	const lead = {
		id: crypto.randomUUID(),
		name: String(input.name || '').trim(),
		whatsapp: normalizedWhatsapp,
		school: String(input.school || '').trim(),
		studentType: String(input.studentType || '').trim(),
		program: String(input.program || '').trim(),
		source: String(input.source || '').trim(),
		status: 'new',
		notes: '',
		createdAt: now,
		updatedAt: now
	};
	store.leads.unshift(lead);
	addAuditLog(store, 'created', 'lead', lead.id, req);
	await writeStore(store);
	return lead;
}

app.get('/api/health', (req, res) => {
	res.json({ ok: true, now: getNowIso() });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get('/api/openapi.json', (req, res) => res.json(openApiDocument));

app.post('/api/auth/login', rateLimit({ name: 'login', windowMs: 15 * 60 * 1000, max: 10 }), (req, res) => {
	const { username, password } = req.body || {};

	if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
		return res.status(401).json({ message: 'Invalid credentials' });
	}

	const token = issueToken();
	res.json({
		token,
		expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString()
	});
});

app.get('/api/auth/me', requireAdmin, (req, res) => {
	res.json({ username: ADMIN_USERNAME, role: 'admin' });
});

app.post('/api/auth/logout', requireAdmin, (req, res) => {
	const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
	TOKENS.delete(token);
	saveTokens(TOKENS);
	res.sendStatus(204);
});

app.post('/api/wheel/spin', rateLimit({ name: 'wheel-spin', windowMs: 15 * 60 * 1000, max: 30 }), (req, res) => {
	const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
	if (!sessionId || sessionId.length > 128) return res.status(400).json({ message: 'Invalid wheel session' });

	const state = readWheelState();
	const now = Date.now();
	for (const [token, spin] of Object.entries(state.spins)) {
		if (!spin || now - spin.createdAt > WHEEL_TTL_MS) delete state.spins[token];
	}
	let existing = Object.values(state.spins).find(spin => spin.sessionId === sessionId);
	if (existing?.claimed) return res.status(409).json({ alreadyUsed: true, message: 'Wheel already used' });
	// Do not reuse pre-fix tokens; Apps Script accepts only the new server-* format.
	if (existing && !String(existing.token || '').startsWith('server-')) {
		delete state.spins[existing.token];
		existing = undefined;
	}
	if (existing && !WHEEL_OPTIONS.some(option => option.id === existing.gift?.id)) {
		delete state.spins[existing.token];
		existing = undefined;
	}
	if (existing?.gift?.available) return res.json({ token: existing.token, gift: existing.gift, attempts: existing.attempts, remainingAttempts: Math.max(MAX_WHEEL_ATTEMPTS - existing.attempts, 0) });
	if (existing && existing.attempts >= MAX_WHEEL_ATTEMPTS) {
		return res.json({ token: existing.token, gift: existing.gift, attempts: existing.attempts, remainingAttempts: 0, exhausted: true });
	}
	const previousAttempts = existing?.attempts || 0;
	if (existing) delete state.spins[existing.token];

	const totalWeight = WHEEL_OPTIONS.reduce((sum, gift) => sum + gift.weight, 0);
	let pick = crypto.randomInt(totalWeight);
	const gift = WHEEL_OPTIONS.find(option => (pick -= option.weight) < 0) || WHEEL_OPTIONS[0];
	const token = `server-${crypto.randomBytes(24).toString('hex')}`;
	state.spins[token] = { token, sessionId, gift, attempts: previousAttempts + 1, createdAt: now, claimed: false };
	saveWheelState(state);
	return res.json({ token, gift, attempts: previousAttempts + 1, remainingAttempts: Math.max(MAX_WHEEL_ATTEMPTS - previousAttempts - 1, 0) });
});

app.get('/api/wheel/options', (_req, res) => {
	res.json(WHEEL_OPTIONS.map(({ id, label, available }) => ({ id, label, available })));
});

async function postToAppsScript(endpoint, values, timeoutMs) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const upstream = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
			body: new URLSearchParams(values).toString(),
			signal: controller.signal
		});
		const responseText = await upstream.text();
		let payload;
		try {
			payload = JSON.parse(responseText);
		} catch {
			throw new Error('invalid-response');
		}
		if (!upstream.ok) throw new Error(payload.message || 'upstream-failed');
		return payload;
	} finally {
		clearTimeout(timeout);
	}
}

// This endpoint is only for the normal site forms. Wheel claims have their own
// endpoint and their own Apps Script deployment below.
const LAUNCH_OFFER_PROGRAMS = [
	// Keep the old values valid so existing saved forms and integrations remain compatible.
	'معادلة هندسة',
	'معادلة حاسبات',
	'معادلة هندسة عربي',
	'معادلة حاسبات عربي',
	'معادلة هندسة إنجليزي',
	'معادلة حاسبات إنجليزي'
];

app.post('/api/launch-offer', rateLimit({ name: 'launch-offer', windowMs: 15 * 60 * 1000, max: 10 }), async (req, res) => {
	const { name, whatsapp, school, studentType, program, source, consent } = req.body || {};
	if (source === 'عجلة الحظ') {
		return res.status(400).json({ success: false, message: 'Wheel claims must use the dedicated wheel service' });
	}
	const cleanWhatsapp = typeof whatsapp === 'string' ? whatsapp.trim() : '';
	const requiredValues = { name, whatsapp: cleanWhatsapp, school, studentType, program, source, consent };
	const values = { ...requiredValues, whatsapp: `'${cleanWhatsapp}` };

	if (Object.values(requiredValues).some(value => typeof value !== 'string' || !value.trim())) {
		return res.status(400).json({ success: false, message: 'Missing required fields' });
	}

	if (!/^01\d{9}$/.test(cleanWhatsapp)) {
		return res.status(400).json({ success: false, message: 'Invalid WhatsApp number' });
	}
	if (!LAUNCH_OFFER_PROGRAMS.includes(program)) {
		return res.status(400).json({ success: false, message: 'Invalid program' });
	}
	const currentStore = await readStore();
	if (findLeadByPhone(currentStore, cleanWhatsapp)) {
		return res.status(409).json({ success: false, alreadyRegistered: true, message: 'هذا الرقم مسجل بالفعل.' });
	}

	try {
		await createLead({ name, whatsapp: cleanWhatsapp, school, studentType, program, source }, req);
	} catch (error) {
		console.error('Failed to save lead locally', error);
	}

	try {
		const payload = await postToAppsScript(LAUNCH_OFFER_ENDPOINT, values, LAUNCH_OFFER_TIMEOUT_MS);
		return res.json({ ...payload, localSaved: true, externalSync: true });
	} catch (error) {
		// The local database is authoritative. Do not tell the student that the
		// registration failed after it was already saved for the admin.
		console.error('External lead sync failed; local lead was saved', error?.message || error);
		return res.status(202).json({ success: true, localSaved: true, externalSync: false, message: 'تم تسجيل بياناتك بنجاح.' });
	}
});

app.post('/api/leads', rateLimit({ name: 'leads', windowMs: 15 * 60 * 1000, max: 10 }), async (req, res) => {
	const input = req.body || {};
	const name = typeof input.name === 'string' ? input.name.trim() : '';
	const whatsapp = normalizePhone(input.whatsapp);
	if (name.length < 2 || name.length > 120) return res.status(400).json({ message: 'Name must be between 2 and 120 characters' });
	if (!/^01\d{9}$/.test(whatsapp)) return res.status(400).json({ message: 'Invalid WhatsApp number' });
	if (!String(input.program || '').trim()) return res.status(400).json({ message: 'Program is required' });
	let lead;
	try {
		lead = await createLead({ ...input, name, whatsapp }, req);
	} catch (error) {
		if (error.code === 'DUPLICATE_PHONE') {
			return res.status(409).json({ message: 'هذا الرقم مسجل بالفعل', alreadyRegistered: true });
		}
		throw error;
	}
	res.status(201).json(lead);
});

app.get('/api/admin/leads', requireAdmin, async (req, res) => {
	const store = await readStore();
	const search = String(req.query.search || '').trim().toLowerCase();
	const status = String(req.query.status || '').trim();
	const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
	let leads = store.leads;
	if (status && LEAD_STATUSES.includes(status)) leads = leads.filter(lead => lead.status === status);
	if (search) leads = leads.filter(lead => [lead.name, lead.whatsapp, lead.school, lead.program, lead.source].some(value => String(value).toLowerCase().includes(search)));
	const total = leads.length;
	res.json({ data: leads.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

app.get('/api/admin/leads/:id', requireAdmin, async (req, res) => {
	const store = await readStore();
	const lead = store.leads.find(item => item.id === req.params.id);
	if (!lead) return res.status(404).json({ message: 'Lead not found' });
	res.json(lead);
});

app.patch('/api/admin/leads/:id', requireAdmin, async (req, res) => {
	const store = await readStore();
	const lead = store.leads.find(item => item.id === req.params.id);
	if (!lead) return res.status(404).json({ message: 'Lead not found' });
	const allowed = ['name', 'whatsapp', 'school', 'studentType', 'program', 'source', 'status', 'notes'];
	const nextWhatsapp = req.body?.whatsapp !== undefined ? normalizePhone(req.body.whatsapp) : lead.whatsapp;
	if (!/^01\d{9}$/.test(nextWhatsapp)) return res.status(400).json({ message: 'Invalid WhatsApp number' });
	const duplicate = store.leads.find(item => item.id !== lead.id && normalizePhone(item.whatsapp) === nextWhatsapp);
	if (duplicate) return res.status(409).json({ message: 'A lead with this WhatsApp number already exists', alreadyRegistered: true });
	for (const key of allowed) if (req.body?.[key] !== undefined) lead[key] = key === 'whatsapp' ? nextWhatsapp : String(req.body[key]).trim();
	if (!LEAD_STATUSES.includes(lead.status)) return res.status(400).json({ message: 'Invalid lead status' });
	lead.updatedAt = getNowIso();
	addAuditLog(store, 'updated', 'lead', lead.id, req);
	await writeStore(store);
	res.json(lead);
});

app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
	const store = await readStore();
	const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
	res.json({ data: store.auditLogs.slice(0, limit) });
});

app.get('/api/admin/wheel/claims', requireAdmin, (_req, res) => {
	const state = readWheelState();
	const data = Object.values(state.spins)
		.filter(spin => spin?.claimed)
		.sort((a, b) => String(b.claimedAt || '').localeCompare(String(a.claimedAt || '')))
		.map(spin => ({
			token: spin.token,
			name: spin.name || '',
			whatsapp: spin.phone || '',
			program: spin.program || '',
			gift: spin.gift?.label || '',
			claimedAt: spin.claimedAt
		}));
	res.json({ data, total: data.length });
});

function normalizeProgramInput(input, existing = {}) {
	const program = {
		...existing,
		name: String(input.name ?? existing.name ?? '').trim(),
		slug: String(input.slug ?? existing.slug ?? '').trim().toLowerCase(),
		category: String(input.category ?? existing.category ?? '').trim(),
		language: String(input.language ?? existing.language ?? 'ar').trim(),
		price: Number(input.price ?? existing.price ?? 0),
		features: Array.isArray(input.features) ? input.features.map(value => String(value).trim()).filter(Boolean) : (existing.features || []),
		isActive: input.isActive === undefined ? existing.isActive !== false : Boolean(input.isActive),
		enrollmentStatus: input.enrollmentStatus ?? existing.enrollmentStatus ?? 'open'
	};
	if (!program.name || !program.slug || !program.category) return { error: 'name, slug and category are required' };
	if (!Number.isFinite(program.price) || program.price < 0) return { error: 'price must be a non-negative number' };
	if (!['open', 'closed'].includes(program.enrollmentStatus)) return { error: 'invalid enrollmentStatus' };
	return program;
}

app.get('/api/programs', async (req, res) => {
	const store = await readStore();
	res.json(store.programs.filter(program => program.isActive !== false));
});

app.get('/api/admin/programs', requireAdmin, async (req, res) => {
	const store = await readStore();
	res.json({ data: store.programs });
});

app.post('/api/admin/programs', requireAdmin, async (req, res) => {
	const store = await readStore();
	const normalized = normalizeProgramInput(req.body || {});
	if (normalized.error) return res.status(400).json({ message: normalized.error });
	if (store.programs.some(program => program.slug === normalized.slug)) return res.status(409).json({ message: 'A program with this slug already exists' });
	const program = { id: crypto.randomUUID(), ...normalized, createdAt: getNowIso(), updatedAt: getNowIso() };
	store.programs.unshift(program);
	addAuditLog(store, 'created', 'program', program.id, req);
	await writeStore(store);
	res.status(201).json(program);
});

app.patch('/api/admin/programs/:id', requireAdmin, async (req, res) => {
	const store = await readStore();
	const program = store.programs.find(item => item.id === req.params.id);
	if (!program) return res.status(404).json({ message: 'Program not found' });
	const normalized = normalizeProgramInput(req.body || {}, program);
	if (normalized.error) return res.status(400).json({ message: normalized.error });
	if (store.programs.some(item => item.id !== program.id && item.slug === normalized.slug)) return res.status(409).json({ message: 'A program with this slug already exists' });
	Object.assign(program, normalized, { updatedAt: getNowIso() });
	addAuditLog(store, 'updated', 'program', program.id, req);
	await writeStore(store);
	res.json(program);
});

app.get('/api/admin/dashboard/summary', requireAdmin, async (req, res) => {
	const store = await readStore();
	const wheelState = readWheelState();
	const wheelClaimsCount = Object.values(wheelState.spins).filter(spin => spin?.claimed).length;
	const today = new Date().toISOString().slice(0, 10);
	const byStatus = Object.fromEntries(LEAD_STATUSES.map(status => [status, store.leads.filter(lead => lead.status === status).length]));
	const byProgram = {};
	for (const lead of store.leads) byProgram[lead.program || 'unknown'] = (byProgram[lead.program || 'unknown'] || 0) + 1;
	res.json({ totalLeads: store.leads.length, todayLeads: store.leads.filter(lead => lead.createdAt.startsWith(today)).length, wheelClaimsCount, byStatus, byProgram, recentLeads: store.leads.slice(0, 10), recentActivity: store.auditLogs.slice(0, 10) });
});

// Wheel claims are intentionally isolated from every other form and Apps Script.
app.post('/api/wheel/claim', rateLimit({ name: 'wheel-claim', windowMs: 15 * 60 * 1000, max: 10 }), async (req, res) => {
	const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
	const whatsapp = normalizePhone(req.body?.whatsapp);
	const program = typeof req.body?.program === 'string' ? req.body.program.trim() : '';
	const wheelToken = typeof req.body?.wheelToken === 'string' ? req.body.wheelToken.trim() : '';

	if (name.length < 2 || name.length > 120) {
		return res.status(400).json({ success: false, message: 'اكتب اسم صحيح.' });
	}
	if (!/^01\d{9}$/.test(whatsapp)) {
		return res.status(400).json({ success: false, message: 'رقم الواتساب يجب أن يبدأ بـ 01 ويتكون من 11 رقم.' });
	}
	if (![
		'معادلة هندسة',
		'معادلة حاسبات',
		'معادلة هندسة عربي',
		'معادلة حاسبات عربي',
		'معادلة هندسة إنجليزي',
		'معادلة حاسبات إنجليزي'
	].includes(program)) {
		return res.status(400).json({ success: false, message: 'اختار نوع المعادلة.' });
	}
	if (!wheelToken) return res.status(400).json({ success: false, message: 'نتيجة العجلة غير موجودة.' });

	const state = readWheelState();
	const spin = state.spins[wheelToken];
	if (!spin || Date.now() - spin.createdAt > WHEEL_TTL_MS) {
		return res.status(409).json({ success: false, message: 'انتهت صلاحية نتيجة العجلة. لف العجلة من جديد.' });
	}
	if (!spin.gift?.available) {
		return res.status(400).json({ success: false, message: 'هذه النتيجة لا تحتوي على هدية قابلة للاستلام.' });
	}
	if (spin.claimed || state.claims[whatsapp]) {
		const previousSpin = state.spins[state.claims[whatsapp]];
		return res.json({
			success: false,
			alreadyRegistered: true,
			gift: previousSpin?.gift?.label || '',
			message: 'تم استلام هدية العجلة بهذا الرقم من قبل.'
		});
	}
	const store = await readStore();
	if (findLeadByPhone(store, whatsapp)) {
		return res.status(409).json({ success: false, alreadyRegistered: true, message: 'هذا الرقم مسجل بالفعل.' });
	}
	try {
		const createdAt = getNowIso();
		// Save locally first so the admin dashboard always has the claim, even
		// when the optional spreadsheet service is slow or unavailable.
		spin.claimed = true;
		spin.phone = whatsapp;
		spin.name = name;
		spin.program = program;
		spin.claimedAt = createdAt;
		state.spins[wheelToken] = spin;
		state.claims[whatsapp] = wheelToken;
		saveWheelState(state);
		try {
			await createLead({ name, whatsapp, program, source: 'عجلة الحظ', notes: `هدية: ${spin.gift.label}` }, req);
		} catch (error) {
			if (error.code !== 'DUPLICATE_PHONE') throw error;
		}

		let externalSync = false;
		if (WHEEL_FORWARD_TO_APPS_SCRIPT && WHEEL_APPS_SCRIPT_ENDPOINT && WHEEL_APPS_SCRIPT_SECRET) {
			try {
				await postToAppsScript(WHEEL_APPS_SCRIPT_ENDPOINT, {
					name, whatsapp, program, gift: spin.gift.label, wheelToken, createdAt,
					apiSignature: createWheelSignature(createdAt, wheelToken, whatsapp, spin.gift.label),
					sessionId: spin.sessionId
				}, WHEEL_CLAIM_TIMEOUT_MS);
				externalSync = true;
			} catch (syncError) {
				console.error('Optional wheel sync failed; local claim was saved', syncError?.message || syncError);
			}
		}
		return res.json({ success: true, gift: spin.gift.label, localSaved: true, externalSync });
	} catch (error) {
		console.error('Wheel local claim failed', error);
		return res.status(500).json({ success: false, message: 'تعذر حفظ هدية العجلة على السيرفر.' });
	}
});

function noCache(res) {
	res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
}

app.get('/api/content', async (req, res) => {
	noCache(res);
	const store = await readStore();
	const summaries = PAGE_KEYS.map(key => {
		const entry = store.pages[key];
		return {
			key,
			hasContent: Boolean(entry && entry.data),
			updatedAt: entry?.updatedAt
		};
	});

	res.json(summaries);
});

app.get('/api/content/:pageKey', async (req, res) => {
	noCache(res);
	const { pageKey } = req.params;

	if (!PAGE_KEYS.includes(pageKey)) {
		return res.status(404).json({ message: 'Unknown page' });
	}

	const store = await readStore();
	const entry = store.pages[pageKey];

	if (!entry || !entry.data) {
		return res.status(404).json({ message: 'Content not found' });
	}

	res.json(entry.data);
});

app.put('/api/content/:pageKey', requireAdmin, async (req, res) => {
	const { pageKey } = req.params;

	if (!PAGE_KEYS.includes(pageKey)) {
		return res.status(404).json({ message: 'Unknown page' });
	}

	const store = await readStore();
	store.pages[pageKey] = {
		data: req.body,
		updatedAt: getNowIso()
	};

	await writeStore(store);
	res.json(store.pages[pageKey].data);
});

app.post('/api/uploads', requireAdmin, upload.single('file'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'No file uploaded or unsupported format' });
	}

	res.json({ url: `/uploads/${req.file.filename}` });
});

app.use('/uploads', express.static(UPLOADS_DIR));

if (fssync.existsSync(DIST_DIR)) {
	app.use((req, res, next) => {
		if (req.path === '/admin' || req.path.startsWith('/admin/')) {
			res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
		}
		next();
	});
	app.use(express.static(DIST_DIR, {
		setHeaders: (res, filePath) => {
			if (/\.[a-f0-9]{8,}\.(?:js|css|woff2|png|jpe?g|webp|svg|ico)$/i.test(filePath)) {
				res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
				return;
			}
			if (/(?:index\.html|env\.js|robots\.txt|sitemap\.xml)$/i.test(filePath)) {
				res.setHeader('Cache-Control', 'no-cache');
			}
		}
	}));
}

function readWheelState() {
	try {
		if (fssync.existsSync(WHEEL_STATE_FILE)) return JSON.parse(fssync.readFileSync(WHEEL_STATE_FILE, 'utf8'));
	} catch {}
	return { spins: {}, claims: {} };
}

function saveWheelState(state) {
	fssync.mkdirSync(DATA_DIR, { recursive: true });
	const tempFile = `${WHEEL_STATE_FILE}.${process.pid}.tmp`;
	fssync.writeFileSync(tempFile, JSON.stringify(state), 'utf8');
	fssync.renameSync(tempFile, WHEEL_STATE_FILE);
}

function normalizePhone(value) {
	return String(value || '')
		.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - '٠'.charCodeAt(0)))
		.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - '۰'.charCodeAt(0)))
		.replace(/[^0-9]/g, '');
}

app.get('*', (req, res, next) => {
	if (req.path.startsWith('/api')) {
		return next();
	}

	if (fssync.existsSync(INDEX_FILE)) {
		return res.sendFile(INDEX_FILE);
	}

	return res.status(404).send('Build the Angular app first.');
});

app.listen(PORT, () => {
	console.log(`Admin API listening on http://localhost:${PORT}`);
});
