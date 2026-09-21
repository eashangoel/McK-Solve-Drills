import { DEFAULT_BUDGETS, type Game } from '@solve/shared';
import { getSetting } from './db.js';

type BudgetKey = keyof typeof DEFAULT_BUDGETS;

function read(key: BudgetKey): number {
  const raw = getSetting(`budget.${key}`);
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

/** Per-stage budgets for a game, keyed by the short stage name. */
export function budgetsForGame(game: Game): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of GAME_KEYS[game]) {
    out[key.replace(`${game}_`, '')] = read(key);
  }
  return out;
}

export function totalBudgetFor(game: Game): number {
  return read(`${game}_total` as BudgetKey);
}

export function allBudgets(): Record<string, number> {
  return Object.fromEntries(
    (Object.keys(DEFAULT_BUDGETS) as BudgetKey[]).map((k) => [k, read(k)]),
  );
}
