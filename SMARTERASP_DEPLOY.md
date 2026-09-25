# SmarterASP deployment

## Current hosting values

- Hosting plan: `W60-EU` trial
- PostgreSQL host: `pg6001.site4now.net`
- PostgreSQL port: `6432`
- Database name: `db_acefff_mo3adala`
- Database user: `acefff_mo3adala`
- Node startup file: `server/index.js`

## Configure the hosted API

Set these environment variables in the SmarterASP Node.js application settings. Never commit the password or the complete URL to GitHub.

```text
NODE_ENV=production
DATABASE_SSL=true
DATABASE_POOL_MAX=5
DATABASE_URL=postgresql://acefff_mo3adala:YOUR_DB_PASSWORD@pg6001.site4now.net:6432/db_acefff_mo3adala
```

The backend automatically selects PostgreSQL when `DATABASE_URL` exists. Without it, local development uses SQLite.

## First migration

Run the migration once from a machine that has the database password configured:

```powershell
$env:DATABASE_URL='postgresql://acefff_mo3adala:YOUR_DB_PASSWORD@pg6001.site4now.net:6432/db_acefff_mo3adala'
npm run migrate:postgres
```

The migration creates the schema and copies the current SQLite pages, leads, programs, and audit logs.

## Deployment notes

SmarterASP hosts Node.js behind IIS and supplies the runtime port through `process.env.PORT`; the API already uses that dynamic port. The host also requires the installed `node_modules` directory for Node.js deployment, so the deployment process must install or upload dependencies before starting the app.
