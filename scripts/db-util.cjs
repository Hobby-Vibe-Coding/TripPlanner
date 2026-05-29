/**
 * db-util.cjs — Database helper used by dev-start scripts.
 * Replaces all psql CLI calls so developers only need Node.js installed.
 *
 * Usage (called by dev-start.ps1 / dev-start.sh):
 *   node scripts/db-util.cjs ping              → "ok" | exit 2 (db missing) | exit 1 (no connection)
 *   node scripts/db-util.cjs db-exists <name>  → prints "1" or "0"
 *   node scripts/db-util.cjs create-db <name>  → creates DB, prints "created" or "already-exists"
 *   node scripts/db-util.cjs run-file <path>   → executes a .sql file
 */

'use strict';

const { Client } = require('pg');
const fs   = require('fs');
const path = require('path');

const [,, op, arg] = process.argv;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const DB_URL = process.env.DATABASE_URL;

// Replace the database name in the URL with "postgres" (maintenance DB)
function maintenanceUrl(url) {
  return url.replace(/\/([^/?]+)(\?.*)?$/, '/postgres$2');
}

// Split a SQL file into individual statements, handling comments and blank lines.
function splitStatements(sql) {
  return sql
    .replace(/--[^\n]*/g, '')          // strip single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')  // strip block comments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function withClient(url, fn) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

async function main() {
  switch (op) {

    // Test if the database is reachable
    case 'ping': {
      try {
        await withClient(DB_URL, async (c) => c.query('SELECT 1'));
        console.log('ok');
        process.exit(0);
      } catch (e) {
        if (e.code === '3D000') {
          // "database does not exist" — PG is running, DB just needs creation
          console.log('db-missing');
          process.exit(2);
        }
        process.exit(1);
      }
    }

    // Check if a named database exists (prints "1" or "0")
    case 'db-exists': {
      if (!arg) { console.error('Usage: db-exists <dbname>'); process.exit(1); }
      const exists = await withClient(maintenanceUrl(DB_URL), async (c) => {
        const r = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [arg]);
        return r.rows.length > 0;
      });
      console.log(exists ? '1' : '0');
      process.exit(0);
    }

    // Create a database (safe to call if it already exists)
    case 'create-db': {
      if (!arg) { console.error('Usage: create-db <dbname>'); process.exit(1); }
      const safe = arg.replace(/[^a-zA-Z0-9_-]/g, ''); // sanitize
      await withClient(maintenanceUrl(DB_URL), async (c) => {
        const exists = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [safe]);
        if (exists.rows.length > 0) {
          console.log('already-exists');
        } else {
          await c.query(`CREATE DATABASE "${safe}"`);
          console.log('created');
        }
      });
      process.exit(0);
    }

    // Execute a .sql file against DATABASE_URL
    case 'run-file': {
      if (!arg) { console.error('Usage: run-file <path>'); process.exit(1); }
      const filePath = path.resolve(arg);
      if (!fs.existsSync(filePath)) {
        console.error('File not found: ' + filePath);
        process.exit(1);
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      const statements = splitStatements(sql);
      await withClient(DB_URL, async (c) => {
        for (const stmt of statements) {
          await c.query(stmt);
        }
      });
      console.log('ok (' + statements.length + ' statements)');
      process.exit(0);
    }

    default:
      console.error('Unknown op: ' + op + '. Available: ping, db-exists, create-db, run-file');
      process.exit(1);
  }
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
