import type {
  FinalizePayload,
  Game,
  SessionScores,
  StreakInfo,
  WeakSpot,
} from '@solve/shared';

const BASE = '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface StartedSession {
  id: number;
  game: Game;
  mode: string;
  seed: number;
  templateId: string;
  startedAt: string;
  timeBudgetMs: number;
  budgets: Record<string, number>;
  scenario: unknown;
}

export interface LeaderboardRow {
  id: number;
  runId: string | null;
  game: Game;
  mode: string;
  templateId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  timeBudgetMs: number;
  productScore: number;
  processScore: number;
  combinedScore: number;
  day: string;
}

export interface Summary {
  total: number;
  avgProduct: number | null;
  avgProcess: number | null;
  bestCombined: number | null;
  perGame: { game: Game; count: number; avg: number; best: number }[];
}

export interface Trends {
  sessions: {
    id: number;
    game: Game;
    date: string;
    completedAt: string;
    productScore: number;
    processScore: number;
    combinedScore: number;
    durationMs: number;
  }[];
  stages: { game: Game; stage: string; durationMs: number; date: string }[];
}

export const api = {
  health: () => req<{ ok: boolean; implemented: Record<Game, boolean> }>('/health'),

  startSession: (game: Game, mode: 'full' | 'drill', runId?: string) =>
    req<StartedSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ game, mode, runId: runId ?? null }),
    }),

  getSession: (id: number) => req<any>(`/sessions/${id}`),

  finalize: (id: number, payload: FinalizePayload) =>
    req<SessionScores & { processComponents: unknown; scenario: unknown }>(
      `/sessions/${id}/finalize`,
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  abandon: (id: number) => req<{ ok: true }>(`/sessions/${id}`, { method: 'DELETE' }),

  leaderboard: (game: Game | 'all' = 'all') =>
    req<LeaderboardRow[]>(`/stats/sessions?game=${game}`),

  trends: () => req<Trends>('/stats/trends'),
  weakSpots: (recent = 5) => req<WeakSpot[]>(`/stats/weak-spots?recent=${recent}`),
  streak: () => req<StreakInfo>('/stats/streak'),
  summary: () => req<Summary>('/stats/summary'),

  settings: () =>
    req<{ budgets: Record<string, number>; defaults: Record<string, number> }>('/settings'),
  saveBudgets: (budgets: Record<string, number>) =>
    req<{ budgets: Record<string, number> }>('/settings/budgets', {
      method: 'PUT',
      body: JSON.stringify(budgets),
    }),
  resetBudgets: () =>
    req<{ budgets: Record<string, number> }>('/settings/budgets/reset', { method: 'POST' }),
};
