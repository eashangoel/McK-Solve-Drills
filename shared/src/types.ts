import type { Game, SubskillKey } from './config.js';

export type Mode = 'full' | 'drill';

/* ------------------------------------------------------------------ */
/* Process tracking                                                    */
/* ------------------------------------------------------------------ */

export type EventType =
  | 'stage_enter'
  | 'stage_exit'
  | 'first_action'
  | 'select'
  | 'deselect'
  | 'change'
  | 'answer'
  | 'submit'
  | 'tool_open';

export interface TrackedEvent {
  /** ms since session start */
  tsMs: number;
  stage: string;
  type: EventType;
  payload?: Record<string, unknown>;
}

export interface StageMetric {
  stage: string;
  budgetMs: number;
  durationMs: number;
  firstActionMs: number | null;
  revisions: number;
  precision?: number;
  recall?: number;
  stageScore?: number;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

export interface ScoreBreakdown {
  /** 0-100 per named sub-skill; drives the weak-spots view. */
  subskills: Partial<Record<SubskillKey, number>>;
  /** Free-form per-stage notes shown on the results screen. */
  notes: { label: string; detail: string; earned: number; possible: number }[];
}

export interface SessionScores {
  productScore: number;
  processScore: number;
  combinedScore: number;
  breakdown: ScoreBreakdown;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export interface SessionRow {
  id: number;
  runId: string | null;
  game: Game;
  mode: Mode;
  seed: number;
  templateId: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  timeBudgetMs: number;
  productScore: number | null;
  processScore: number | null;
  combinedScore: number | null;
}

export interface SessionDetail extends SessionRow {
  scenario: unknown;
  answers: unknown;
  breakdown: ScoreBreakdown | null;
  stages: StageMetric[];
}

export interface FinalizePayload {
  answers: unknown;
  events: TrackedEvent[];
  stages: StageMetric[];
  durationMs: number;
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export interface TrendPoint {
  date: string;
  game: Game;
  productScore: number;
  processScore: number;
  combinedScore: number;
  durationMs: number;
}

export interface WeakSpot {
  key: SubskillKey;
  label: string;
  recentAvg: number;
  overallAvg: number;
  delta: number;
  sampleSize: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  /** ISO dates (YYYY-MM-DD) with at least one completed session */
  activeDays: string[];
  playedToday: boolean;
}

export type { Game, SubskillKey };
