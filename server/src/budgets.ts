import { DEFAULT_BUDGETS, type Game } from '@solve/shared';
import { getSetting } from './db.js';

type BudgetKey = keyof typeof DEFAULT_BUDGETS;

async function read(key: BudgetKey): Promise<number> {
  const raw = await getSetting(`budget.${key}`);
  const n = raw === null ? DEFAULT_BUDGETS[key] : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_BUDGETS[key];
}

const GAME_KEYS: Record<Game, BudgetKey[]> = {
  redrock: [
    'redrock_total',
    'redrock_investigation',
    'redrock_analysis',
    'redrock_report',
    'redrock_cases',
  ],
  seawolf: ['seawolf_total', 'seawolf_site'],
  sfl: ['sfl_total'],
};

/**
 * Reads keys one at a time rather than with Promise.all. Free-tier hosted
 * Postgres (Neon, Supabase and similar) often caps concurrent connections
 * quite low, and there are only ever a handful of budget keys — sequential
 * reads cost a few milliseconds and remove that ceiling as a concern
 * entirely.
 */
async function readAll(keys: BudgetKey[]): Promise<number[]> {
  const out: number[] = [];
  for (const key of keys) out.push(await read(key));
  return out;
}

/** Per-stage budgets for a game, keyed by the short stage name. */
export async function budgetsForGame(game: Game): Promise<Record<string, number>> {
  const keys = GAME_KEYS[game];
  const values = await readAll(keys);
  const out: Record<string, number> = {};
  keys.forEach((key, i) => {
    out[key.replace(`${game}_`, '')] = values[i];
  });
  return out;
}

export async function totalBudgetFor(game: Game): Promise<number> {
  return read(`${game}_total` as BudgetKey);
}

export async function allBudgets(): Promise<Record<string, number>> {
  const keys = Object.keys(DEFAULT_BUDGETS) as BudgetKey[];
  const values = await readAll(keys);
  return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
}
