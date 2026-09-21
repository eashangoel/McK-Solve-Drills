import { Router } from 'express';
import {
  COMBINED_BLEND,
  GAMES,
  Rng,
  randomSeed,
  getGameModule,
  hasGameModule,
  emptyBreakdown,
  type Game,
  type FinalizePayload,
  type StageMetric,
} from '@solve/shared';
import { db, getBudget } from '../db.js';
import { computeProcessScore, addProcessSubskills } from '../scoring/process.js';
import { budgetsForGame, totalBudgetFor } from '../budgets.js';

export const sessionsRouter = Router();

function isGame(v: unknown): v is Game {
  return typeof v === 'string' && (GAMES as readonly string[]).includes(v);
}

/** POST /api/sessions — generate a scenario and open a session. */
sessionsRouter.post('/', (req, res) => {
  const { game, mode = 'drill', runId = null, seed: seedIn } = req.body ?? {};
  if (!isGame(game)) return res.status(400).json({ error: 'unknown game' });
  if (!hasGameModule(game)) {
    return res.status(501).json({ error: `${game} is not implemented yet` });
  }

  const seed = Number.isInteger(seedIn) ? Number(seedIn) : randomSeed();
  const budgets = budgetsForGame(game);
  const { templateId, scenario } = getGameModule(game).generate(new Rng(seed), budgets);
  const startedAt = new Date().toISOString();
  const timeBudgetMs = totalBudgetFor(game);

  const info = db
    .prepare(
      `INSERT INTO sessions (run_id, game, mode, seed, template_id, started_at, time_budget_ms, scenario_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(runId, game, mode, seed, templateId, startedAt, timeBudgetMs, JSON.stringify(scenario));

  res.json({
    id: Number(info.lastInsertRowid),
    game,
    mode,
    seed,
    templateId,
    startedAt,
    timeBudgetMs,
    budgets,
    scenario: getGameModule(game).redact(scenario),
  });
});

/** GET /api/sessions/:id — resume an open session. */
sessionsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'not found' });
  const scenario = JSON.parse(row.scenario_json);
  const mod = hasGameModule(row.game) ? getGameModule(row.game) : null;
  res.json({
    id: row.id,
    game: row.game,
    mode: row.mode,
    seed: row.seed,
    templateId: row.template_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    timeBudgetMs: row.time_budget_ms,
    budgets: budgetsForGame(row.game),
    productScore: row.product_score,
    processScore: row.process_score,
    combinedScore: row.combined_score,
    breakdown: row.breakdown_json ? JSON.parse(row.breakdown_json) : null,
    answers: row.answers_json ? JSON.parse(row.answers_json) : null,
    // A finished session may show its answer key; a live one may not.
    scenario: row.completed_at ? scenario : mod ? mod.redact(scenario) : scenario,
  });
});

/** POST /api/sessions/:id/finalize — grade, score and close out. */
sessionsRouter.post('/:id/finalize', (req, res) => {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'not found' });
  if (row.completed_at) return res.status(409).json({ error: 'already finalized' });

  const payload = req.body as FinalizePayload;
  let stages: StageMetric[] = Array.isArray(payload.stages) ? payload.stages : [];
  const scenario = JSON.parse(row.scenario_json);

  let productScore = 0;
  let breakdown = emptyBreakdown();
  if (hasGameModule(row.game)) {
    const mod = getGameModule(row.game);
    // Fill in metrics that depend on the answer key before scoring process.
    if (mod.augmentStages) stages = mod.augmentStages(scenario, payload.answers, stages);
    const graded = mod.grade(scenario, payload.answers, stages);
    productScore = graded.productScore;
    breakdown = graded.breakdown;
  }

  const process = computeProcessScore(stages);
  addProcessSubskills(breakdown, process);
  const combined =
    Math.round(
      (productScore * COMBINED_BLEND.product + process.score * COMBINED_BLEND.process) * 10,
    ) / 10;

  const completedAt = new Date().toISOString();

  db.transaction(() => {
    db.prepare(
      `UPDATE sessions SET completed_at = ?, duration_ms = ?, product_score = ?,
         process_score = ?, combined_score = ?, answers_json = ?, breakdown_json = ?
       WHERE id = ?`,
    ).run(
      completedAt,
      payload.durationMs ?? null,
      productScore,
      process.score,
      combined,
      JSON.stringify(payload.answers ?? null),
      JSON.stringify(breakdown),
      row.id,
    );

    const insStage = db.prepare(
      `INSERT INTO stage_metrics (session_id, stage, budget_ms, duration_ms, first_action_ms, revisions, precision, recall, stage_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const s of stages) {
      insStage.run(
        row.id,
        s.stage,
        s.budgetMs ?? null,
        s.durationMs ?? null,
        s.firstActionMs ?? null,
        s.revisions ?? 0,
        s.precision ?? null,
        s.recall ?? null,
        s.stageScore ?? null,
      );
    }

    const insEvent = db.prepare(
      'INSERT INTO events (session_id, ts_ms, stage, type, payload_json) VALUES (?, ?, ?, ?, ?)',
    );
    for (const e of payload.events ?? []) {
      insEvent.run(row.id, e.tsMs, e.stage ?? null, e.type, e.payload ? JSON.stringify(e.payload) : null);
    }
  })();

  res.json({
    id: row.id,
    productScore,
    processScore: process.score,
    combinedScore: combined,
    breakdown,
    processComponents: process.components,
    scenario, // full, answer key included, for the review screen
  });
});

/** DELETE /api/sessions/:id — discard an abandoned run. */
sessionsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
