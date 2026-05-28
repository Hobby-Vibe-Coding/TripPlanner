import { neon } from "@neondatabase/serverless";
import pg from "pg";

const { Pool } = pg;

// Singleton pool — reused across warm lambda invocations in local dev.
let _pool = null;
function getPool() {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}

// Adapts a tagged-template call to pg's parameterized query format.
// sql`SELECT * FROM users WHERE id = ${id}` → pool.query("SELECT ... $1", [id])
function makeLocalSql(pool) {
  return async function sql(strings, ...values) {
    let text = "";
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) text += `$${i + 1}`;
    }
    const result = await pool.query(text, values);
    return result.rows;
  };
}

/**
 * Returns a tagged-template SQL executor.
 * Uses local node-postgres when USE_LOCAL_PG=true, otherwise Neon serverless.
 *
 * Usage in API handlers:
 *   import { getDb } from "../_db.js";
 *   const sql = getDb();
 *   const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
 */
export function getDb() {
  if (process.env.USE_LOCAL_PG === "true") {
    return makeLocalSql(getPool());
  }
  return neon(process.env.DATABASE_URL);
}
