import { Router } from 'express';
import { SUBSKILLS, type SubskillKey, type WeakSpot, type StreakInfo } from '@solve/shared';
import { db } from '../db.js';

export const statsRouter = Router();

/** ISO timestamp -> local YYYY-MM-DD (streaks are a human-calendar notion). */
function localDay(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00`) - Date.parse(`${a}T00:00:00`)) / 86_400_000);
}

/** GET /api/stats/sessions — the personal leaderboard feed. */
statsRouter.get('/sessions', (req, res) => {
  const game = typeof req.query.game === 'string' && req.query.game !== 'all' ? req.query.game : null;
  const limit = Math.min(Number(req.query.limit) || 500, 2000);

  const rows = db
    .prepare(
      `SELECT id, run_id, game, mode, started_at, completed_at, duration_ms, time_budget_ms,
              product_score, process_score, combined_score, template_id
       FROM sessions
       WHERE completed_at IS NOT NULL ${game ? 'AND game = ?' : ''}
       ORDER BY completed_at DESC
       LIMIT ?`,
    )
    .all(...(game ? [game, limit] : [limit])) as any[];

  res.json(
    rows.map((r) => ({
      id: r.id,
      runId: r.run_id,
      game: r.game,
      mode: r.mode,
      templateId: r.template_id,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      durationMs: r.duration_ms,
      timeBudgetMs: r.time_budget_ms,
      productScore: r.product_score,
      processScore: r.process_score,
      combinedScore: r.combined_score,
      day: localDay(r.completed_at),
    })),
  );
});

/** GET /api/stats/trends — time series for the dashboard charts. */
statsRouter.get('/trends', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, game, completed_at, duration_ms, product_score, process_score, combined_score
       FROM sessions WHERE completed_at IS NOT NULL ORDER BY completed_at ASC`,
    )
    .all() as any[];

  const stages = db
    .prepare(
      `SELECT s.game, sm.stage, sm.duration_ms, s.completed_at
       FROM stage_metrics sm JOIN sessions s ON s.id = sm.session_id
       WHERE s.completed_at IS NOT NULL ORDER BY s.completed_at ASC`,
    )
    .all() as any[];

  res.json({
    sessions: rows.map((r) => ({
      id: r.id,
      game: r.game,
      date: localDay(r.completed_at),
      completedAt: r.completed_at,
      productScore: r.product_score,
      processScore: r.process_score,
      combinedScore: r.combined_score,
      durationMs: r.duration_ms,
    })),
    stages: stages.map((s) => ({
      game: s.game,
      stage: s.stage,
      durationMs: s.duration_ms,
      date: localDay(s.completed_at),
    })),
  });
});

/**
 * GET /api/stats/weak-spots — compares each sub-skill's recent average against
 * its all-time average and against the other sub-skills, so the view answers
 * "what is lagging" rather than just "what is low".
 */
statsRouter.get('/weak-spots', (req, res) => {
  const recentN = Number(req.query.recent) || 5;
  const rows = db
    .prepare(
      `SELECT breakdown_json, completed_at FROM sessions
       WHERE completed_at IS NOT NULL AND breakdown_json IS NOT NULL
       ORDER BY completed_at DESC`,
    )
    .all() as any[];

  const all = new Map<string, number[]>();
  const recent = new Map<string, number[]>();
  const seenPerKey = new Map<string, number>();

  for (const row of rows) {
    let parsed: any;
    try {
      parsed = JSON.parse(row.breakdown_json);
    } catch {
      continue;
    }
    for (const [k, v] of Object.entries(parsed?.subskills ?? {})) {
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      if (!all.has(k)) all.set(k, []);
      all.get(k)!.push(v);
      const seen = seenPerKey.get(k) ?? 0;
      if (seen < recentN) {
        if (!recent.has(k)) recent.set(k, []);
        recent.get(k)!.push(v);
        seenPerKey.set(k, seen + 1);
      }
    }
  }

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  const spots: WeakSpot[] = [...all.entries()]
    .filter(([k]) => k in SUBSKILLS)
    .map(([k, values]) => {
      const r = recent.get(k) ?? values;
      return {
        key: k as SubskillKey,
        label: SUBSKILLS[k as SubskillKey],
        recentAvg: Math.round(avg(r) * 10) / 10,
        overallAvg: Math.round(avg(values) * 10) / 10,
        delta: Math.round((avg(r) - avg(values)) * 10) / 10,
        sampleSize: values.length,
      };
    })
    .sort((a, b) => a.recentAvg - b.recentAvg);

  res.json(spots);
});

/** GET /api/stats/streak — daily-practice consistency. */
statsRouter.get('/streak', (_req, res) => {
  const rows = db
    .prepare('SELECT completed_at FROM sessions WHERE completed_at IS NOT NULL')
    .all() as any[];

  const days = [...new Set(rows.map((r) => localDay(r.completed_at)))].sort();
  const today = localDay(new Date().toISOString());

  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // Current streak counts back from today, or from yesterday if today is unplayed.
  let current = 0;
  const set = new Set(days);
  const startOffset = set.has(today) ? 0 : 1;
  for (let i = startOffset; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = localDay(d.toISOString());
    if (set.has(key)) current++;
    else break;
  }
  if (startOffset === 1 && current === 0) current = 0;

  const info: StreakInfo = {
    current,
    longest,
    activeDays: days,
    playedToday: set.has(today),
  };
  res.json(info);
});

/** GET /api/stats/summary — headline numbers for the home screen. */
statsRouter.get('/summary', (_req, res) => {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n, AVG(product_score) AS p, AVG(process_score) AS q,
              MAX(combined_score) AS best
       FROM sessions WHERE completed_at IS NOT NULL`,
    )
    .get() as any;
  const perGame = db
    .prepare(
      `SELECT game, COUNT(*) AS n, AVG(combined_score) AS avg, MAX(combined_score) AS best
       FROM sessions WHERE completed_at IS NOT NULL GROUP BY game`,
    )
    .all() as any[];
  res.json({
    total: row.n ?? 0,
    avgProduct: row.p,
    avgProcess: row.q,
    bestCombined: row.best,
    perGame: perGame.map((g) => ({ game: g.game, count: g.n, avg: g.avg, best: g.best })),
  });
});
