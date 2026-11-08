CREATE SCHEMA IF NOT EXISTS jb_store;
REVOKE ALL ON SCHEMA jb_store FROM PUBLIC;
CREATE TABLE IF NOT EXISTS jb_store.products (
  id text PRIMARY KEY, name text NOT NULL, category text NOT NULL,
  price integer NOT NULL CHECK(price >= 0), "oldPrice" integer NOT NULL DEFAULT 0,
  image text NOT NULL, description text NOT NULL, sizes text NOT NULL, colors text NOT NULL,
  stock integer NOT NULL CHECK(stock >= 0), badge text NOT NULL DEFAULT '', active integer NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);
CREATE TABLE IF NOT EXISTS jb_store.users (
  id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
  password text NOT NULL, "createdAt" text NOT NULL
);
CREATE TABLE IF NOT EXISTS jb_store.sessions (
  id text PRIMARY KEY, "userId" text NOT NULL, role text NOT NULL CHECK(role IN ('admin','customer')), expires bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS jb_store.orders (
  id text PRIMARY KEY, "userId" text NOT NULL, customer text NOT NULL, items text NOT NULL,
  total integer NOT NULL CHECK(total >= 0), discount integer NOT NULL CHECK(discount >= 0),
  status text NOT NULL, "createdAt" text NOT NULL, note text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS jb_store.settings (id text PRIMARY KEY, value text NOT NULL);
CREATE TABLE IF NOT EXISTS jb_store.coupons (
  id text PRIMARY KEY, percent integer NOT NULL CHECK(percent BETWEEN 1 AND 90), active integer NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);
CREATE TABLE IF NOT EXISTS jb_store.attempts (id text PRIMARY KEY, count integer NOT NULL, until bigint NOT NULL);
CREATE TABLE IF NOT EXISTS jb_store.product_images (
  id text PRIMARY KEY, data bytea NOT NULL, mime text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON jb_store.orders ("userId");
CREATE INDEX IF NOT EXISTS orders_created_idx ON jb_store.orders ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON jb_store.sessions (expires);
