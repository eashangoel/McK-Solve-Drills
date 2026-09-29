import { Router } from 'express';
import { DEFAULT_BUDGETS } from '@solve/shared';
import { setSetting } from '../db.js';
import { allBudgets } from '../budgets.js';
import { asyncHandler } from '../asyncHandler.js';

export const settingsRouter = Router();

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ budgets: await allBudgets(), defaults: DEFAULT_BUDGETS });
  }),
);

settingsRouter.put(
  '/budgets',
  asyncHandler(async (req, res) => {
    const incoming = req.body ?? {};
    for (const [key, value] of Object.entries(incoming)) {
      if (!(key in DEFAULT_BUDGETS)) continue;
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) continue;
      await setSetting(`budget.${key}`, String(Math.round(n)));
    }
    res.json({ budgets: await allBudgets() });
  }),
);

settingsRouter.post(
  '/budgets/reset',
  asyncHandler(async (_req, res) => {
    for (const [key, value] of Object.entries(DEFAULT_BUDGETS)) {
      await setSetting(`budget.${key}`, String(value));
    }
    res.json({ budgets: await allBudgets() });
  }),
);
