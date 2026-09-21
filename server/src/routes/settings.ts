import { Router } from 'express';
import { DEFAULT_BUDGETS } from '@solve/shared';
import { setSetting } from '../db.js';
import { allBudgets } from '../budgets.js';

export const settingsRouter = Router();

settingsRouter.get('/', (_req, res) => {
  res.json({ budgets: allBudgets(), defaults: DEFAULT_BUDGETS });
});

settingsRouter.put('/budgets', (req, res) => {
  const incoming = req.body ?? {};
  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in DEFAULT_BUDGETS)) continue;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) continue;
    setSetting(`budget.${key}`, String(Math.round(n)));
  }
  res.json({ budgets: allBudgets() });
});

settingsRouter.post('/budgets/reset', (_req, res) => {
  for (const [key, value] of Object.entries(DEFAULT_BUDGETS)) {
    setSetting(`budget.${key}`, String(value));
  }
  res.json({ budgets: allBudgets() });
});
