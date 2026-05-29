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
 */
export function getDb() {
  if (process.env.USE_LOCAL_PG === "true") {
    return makeLocalSql(getPool());
  }
  return neon(process.env.DATABASE_URL);
}

/**
 * Runs fn(txSql) inside a database transaction.
 * For local pg: uses BEGIN/COMMIT on a dedicated client.
 * For Neon: uses the neon().transaction() callback API.
 *
 * Usage:
 *   await withTransaction(async (sql) => {
 *     await sql`INSERT INTO foo VALUES (${x})`;
 *     await sql`INSERT INTO bar VALUES (${y})`;
 *   });
 */
export async function withTransaction(fn) {
  if (process.env.USE_LOCAL_PG === "true") {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const txSql = async (strings, ...values) => {
        let text = "";
        for (let i = 0; i < strings.length; i++) {
          text += strings[i];
          if (i < values.length) text += `$${i + 1}`;
        }
        const result = await client.query(text, values);
        return result.rows;
      };
      const result = await fn(txSql);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } else {
    const sql = neon(process.env.DATABASE_URL);
    return sql.transaction(fn);
  }
}
