import pg from 'pg';
import { DEFAULT_BUDGETS } from '@solve/shared';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    '[db] DATABASE_URL is not set. Create a free Postgres database (Neon, Vercel Postgres, ' +
      'or Supabase all work) and set DATABASE_URL — in .env for local dev, and in the ' +
      'Vercel project\'s Environment Variables for deploys. See .env.example.',
  );
}

// Vercel's serverless runtime spins up many short-lived function instances, each of which
// would otherwise open its own connection pool; keep that pool to a single connection so a
// burst of invocations doesn't exhaust the database's connection limit. A long-running local
// `npm run dev` process can safely use a normal-sized pool.
const isServerless = !!process.env.VERCEL;

// Managed Postgres providers (Neon, Vercel Postgres, Supabase) terminate TLS with a
// certificate chain Node doesn't always validate out of the box; `sslmode=disable` in the
// connection string (e.g. a local, unencrypted Postgres) opts out of TLS entirely.
const useSsl = !/sslmode=disable/.test(connectionString);

export const pool = new Pool({
  connectionString,
  max: isServerless ? 1 : 5,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  // A background error on an idle client must not crash the process.
  console.error('[db] idle client error', err);
});

/** Runs `sql` and returns every row. */
export async function queryAll<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}

/** Runs `sql` and returns the first row, or undefined. */
export async function queryOne<T = any>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const res = await pool.query(sql, params);
  return res.rows[0] as T | undefined;
}

/** Runs `sql` for its side effect; returns the affected row count. */
export async function execute(sql: string, params: unknown[] = []): Promise<number> {
  const res = await pool.query(sql, params);
  return res.rowCount ?? 0;
}

/**
 * Runs `fn` inside a single transaction on one dedicated connection, and
 * hands back the real `pg` client rather than a `queryOne`-shaped wrapper.
 * A wrapper that always reads `res.rows[0]` breaks the moment a caller runs
 * a multi-statement string (our migration DDL does) — `pg` resolves those
 * with an array of per-statement results, not one result with `.rows`. Every
 * caller here only runs statements for their side effect, so the client's
 * own `query(sql, params?)` is exactly what's needed, unwrapped.
 */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Migrations are append-only. Each entry runs once, in order, and is recorded
 * in `schema_migrations`. Never edit a migration that has already shipped —
 * add a new one, so an existing database keeps its history.
 */
const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: '001_init',
    sql: `
      CREATE TABLE IF NOT EXISTS sessions (
        id              SERIAL PRIMARY KEY,
        run_id          TEXT,
        game            TEXT NOT NULL,
        mode            TEXT NOT NULL,
        seed            INTEGER NOT NULL,
        template_id     TEXT NOT NULL,
        started_at      TEXT NOT NULL,
        completed_at    TEXT,
        duration_ms     INTEGER,
        time_budget_ms  INTEGER NOT NULL,
        product_score   DOUBLE PRECISION,
        process_score   DOUBLE PRECISION,
        combined_score  DOUBLE PRECISION,
        scenario_json   TEXT NOT NULL,
        answers_json    TEXT,
        breakdown_json  TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_game ON sessions(game);
      CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(completed_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_run ON sessions(run_id);

      CREATE TABLE IF NOT EXISTS stage_metrics (
        id              SERIAL PRIMARY KEY,
        session_id      INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        stage           TEXT NOT NULL,
        budget_ms       INTEGER,
        duration_ms     INTEGER,
        first_action_ms INTEGER,
        revisions       INTEGER NOT NULL DEFAULT 0,
        precision       DOUBLE PRECISION,
        recall          DOUBLE PRECISION,
        stage_score     DOUBLE PRECISION
      );

      CREATE INDEX IF NOT EXISTS idx_stage_session ON stage_metrics(session_id);

      CREATE TABLE IF NOT EXISTS events (
        id            SERIAL PRIMARY KEY,
        session_id    INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        ts_ms         INTEGER NOT NULL,
        stage         TEXT,
        type          TEXT NOT NULL,
        payload_json  TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);

      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `,
  },
];

async function runMigrations(): Promise<void> {
  await execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const appliedRows = await queryAll<{ id: string }>('SELECT id FROM schema_migrations');
  const applied = new Set(appliedRows.map((r) => r.id));

  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;
    await withTransaction(async (client) => {
      await client.query(m.sql);
      await client.query('INSERT INTO schema_migrations (id, applied_at) VALUES ($1, $2)', [
        m.id,
        new Date().toISOString(),
      ]);
    });
    console.log(`[db] applied migration ${m.id}`);
  }
}

/**
 * Kicked off once at module load, in both the local server and the Vercel
 * function (a fresh module load per cold start). Every route awaits this
 * before touching the database, so migrations always complete first without
 * re-running on every request within the same warm instance.
 */
export const dbReady: Promise<void> = runMigrations()
  .then(() => seedDefaultBudgets())
  .then(() => {
    console.log('[db] ready');
  })
  .catch((err) => {
    console.error('[db] migration failed', err);
    throw err;
  });

/* ------------------------------------------------------------------ */
/* Settings helpers                                                    */
/* ------------------------------------------------------------------ */

export async function getSetting(key: string): Promise<string | null> {
  const row = await queryOne<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await execute(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value],
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await queryAll<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Seeds default budgets once, without clobbering anything already customised. */
async function seedDefaultBudgets(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_BUDGETS)) {
    const existing = await getSetting(`budget.${key}`);
    if (existing === null) {
      await setSetting(`budget.${key}`, String(value));
    }
  }
}

export async function getBudget(key: keyof typeof DEFAULT_BUDGETS): Promise<number> {
  const raw = await getSetting(`budget.${key}`);
  return raw === null ? DEFAULT_BUDGETS[key] : Number(raw);
}
