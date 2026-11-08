import pg from 'pg';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
const connectionString=process.env.DIRECT_URL||process.env.DATABASE_URL;
if(!connectionString) throw Error('Configure DIRECT_URL ou DATABASE_URL.');
const ca=await readFile(new URL('../certs/supabase-ca.crt',import.meta.url),'utf8');
const pool=new pg.Pool({connectionString,ssl:{ca,rejectUnauthorized:true},max:1,connectionTimeoutMillis:15000});
let client;
try {
  client=await pool.connect();
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(824728391)');
  await client.query('CREATE SCHEMA IF NOT EXISTS jb_store');
  await client.query('CREATE TABLE IF NOT EXISTS jb_store.schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  const directory=new URL('../db/postgres/',import.meta.url);
  for(const name of (await readdir(directory)).filter(n=>n.endsWith('.sql')).sort()) {
    const sql=await readFile(new URL(name,directory),'utf8');
    const checksum=createHash('sha256').update(sql).digest('hex');
    const {rows}=await client.query('SELECT checksum FROM jb_store.schema_migrations WHERE name=$1',[name]);
    if(rows.length) {if(rows[0].checksum!==checksum)throw Error('Migração já aplicada foi alterada: '+name);continue;}
    await client.query(sql);
    await client.query('INSERT INTO jb_store.schema_migrations (name,checksum) VALUES ($1,$2)',[name,checksum]);
    console.log('Migração aplicada:',name);
  }
  await client.query('COMMIT');
  const {rows}=await client.query("SELECT tablename FROM pg_tables WHERE schemaname='jb_store' ORDER BY tablename");
  console.log('Supabase: migração concluída. Tabelas:',rows.map(r=>r.tablename).join(', '));
} catch(error) {
  if(client) await client.query('ROLLBACK');
  console.error('Falha na migração:',error.code||'',error.message);
  process.exitCode=1;
} finally {client?.release();await pool.end();}
