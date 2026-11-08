import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { supabaseCA } from './database-tls';

let pool: Pool | undefined;
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { ca: supabaseCA, rejectUnauthorized: true },
      max: 3,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 15_000,
      application_name: 'jb-imports-store',
    });
    pool.on('error', (error) => console.error('Database connection:', error.message));
  }
  return pool;
}

function statementSQL(query: string) {
  let index = 0;
  return query
    .replace(/\?/g, () => '$' + ++index)
    .replace(/\b(oldPrice|userId|createdAt)\b/g, '"$1"')
    .replace(/\b(products|users|sessions|orders|settings|coupons|attempts|product_images)\b/g, 'jb_store."$1"');
}
class Statement {
  constructor(readonly query: string, readonly values: unknown[] = []) {}
  bind(...values: unknown[]) { return new Statement(this.query, values); }
  async execute(client?: PoolClient) {
    return (client || getPool()).query<QueryResultRow>(statementSQL(this.query), this.values);
  }
  async first<T = Record<string, any>>(): Promise<T | null> {
    return ((await this.execute()).rows[0] as T) ?? null;
  }
  async all() { return { results: (await this.execute()).rows }; }
  async run() { const result = await this.execute(); return { changes: result.rowCount }; }
}
export const database = {
  prepare(query: string) { return new Statement(query); },
  async batch(statements: Statement[]) {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      for (const statement of statements) await statement.execute(client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  },
};
// Photos are kept in the private Postgres schema, alongside catalog records.
// This uses only the database credentials, without requiring a Supabase service key.
export const images = {
  async get(key: string) {
    const { rows } = await getPool().query('SELECT data, mime FROM jb_store.product_images WHERE id=$1', [key]);
    if (!rows.length) return null;
    return { body: new Uint8Array(rows[0].data), httpMetadata: { contentType: rows[0].mime } };
  },
  async put(key: string, bytes: ArrayBuffer, options: { httpMetadata: { contentType: string } }) {
    await getPool().query('INSERT INTO jb_store.product_images (id, data, mime) VALUES ($1,$2,$3)', [key, Buffer.from(bytes), options.httpMetadata.contentType]);
  },
};
