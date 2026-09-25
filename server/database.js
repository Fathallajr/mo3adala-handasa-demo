// Production uses PostgreSQL when DATABASE_URL is configured.
// Local development keeps the existing SQLite adapter so the project remains easy to run.
module.exports = process.env.DATABASE_URL
	? require('./database-postgres')
	: require('./database-sqlite');
