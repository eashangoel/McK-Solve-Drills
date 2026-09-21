import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { DEFAULT_BUDGETS } from '@solve/shared';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '../../data');
fs.mkdirSync(dataDir, { recursive: true });

export const DB_PATH = process.env.SOLVE_DB ?? path.join(dataDir, 'solvetrainer.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Migrations are append-only. Each entry runs once, in order, and is recorded
 * in `schema_migrations`. Never edit a migration that has already shipped —
 * add a new one, so an existing .db file keeps its history.
 */
const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: '001_init',
    sql: `
      CREATE TABLE sessions (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id          TEXT,
        game            TEXT NOT NULL,
        mode            TEXT NOT NULL,
        seed            INTEGER NOT NULL,
        template_id     TEXT NOT NULL,
        started_at      TEXT NOT NULL,
        completed_at    TEXT,
        duration_ms     INTEGER,
        time_budget_ms  INTEGER NOT NULL,
        product_score   REAL,
        process_score   REAL,
        combined_score  REAL,
        scenario_json   TEXT NOT NULL,
        answers_json    TEXT,
        breakdown_json  TEXT
      );

      CREATE INDEX idx_sessions_game ON sessions(game);
      CREATE INDEX idx_sessions_completed ON sessions(completed_at);
      CREATE INDEX idx_sessions_run ON sessions(run_id);

      CREATE TABLE stage_metrics (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id      INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        stage           TEXT NOT NULL,
        budget_ms       INTEGER,
        duration_ms     INTEGER,
        first_action_ms INTEGER,
        revisions       INTEGER NOT NULL DEFAULT 0,
        precision       REAL,
        recall          REAL,
        stage_score     REAL
      );

      CREATE INDEX idx_stage_session ON stage_metrics(session_id);

      CREATE TABLE events (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id    INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        ts_ms         INTEGER NOT NULL,
        stage         TEXT,
        type          TEXT NOT NULL,
        payload_json  TEXT
      );

      CREATE INDEX idx_events_session ON events(session_id);

      CREATE TABLE settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `,
  },
];

db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
)`);

const applied = new Set(
  db.prepare('SELECT id FROM schema_migrations').all().map((r: any) => r.id as string),
);

const recordMigration = db.prepare(
  'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)',
);

for (const m of MIGRATIONS) {
  if (applied.has(m.id)) continue;
  db.transaction(() => {
    db.exec(m.sql);
    recordMigration.run(m.id, new Date().toISOString());
  })();
  console.log(`[db] applied migration ${m.id}`);
}

/* ------------------------------------------------------------------ */
/* Settings helpers                                                    */
/* ------------------------------------------------------------------ */

const upsertSetting = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
);

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  upsertSetting.run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as {
    key: string;
    value: string;
  }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Seed default budgets once, without clobbering anything already customised. */
for (const [key, value] of Object.entries(DEFAULT_BUDGETS)) {
  if (getSetting(`budget.${key}`) === null) {
    setSetting(`budget.${key}`, String(value));
  }
}

export function getBudget(key: keyof typeof DEFAULT_BUDGETS): number {
  const raw = getSetting(`budget.${key}`);
  return raw === null ? DEFAULT_BUDGETS[key] : Number(raw);
}

console.log(`[db] ready at ${DB_PATH}`);
