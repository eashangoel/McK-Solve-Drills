import type { Game, ScoreBreakdown, StageMetric } from '../types.js';
import { Rng } from '../rng.js';

/**
 * Every game plugs in here. Generation and grading are pure functions that
 * know nothing about React — the UI only ever receives a `scenario` object and
 * hands back an `answers` object. Adding a game, or a new scenario template,
 * never requires touching the server or the UI shell.
 */
export interface GameModule<S = unknown, A = unknown> {
  game: Game;
  /** Builds a fresh scenario from a seed. Must be deterministic. */
  generate(rng: Rng, budgets: Record<string, number>): { templateId: string; scenario: S };
  /** Grades submitted answers. Returns a 0-100 product score plus breakdown. */
  grade(scenario: S, answers: A, stages: StageMetric[]): { productScore: number; breakdown: ScoreBreakdown };
  /**
   * Strips the answer key before the scenario is sent to the browser, so the
   * solution never sits in the network tab. The full object stays in SQLite.
   */
  redact(scenario: S): unknown;
  /**
   * Optional. Fills in stage metrics the browser cannot compute because they
   * depend on the answer key — journal precision and recall, for instance.
   * Runs server-side before the process score is calculated.
   */
  augmentStages?(scenario: S, answers: A, stages: StageMetric[]): StageMetric[];
}

const registry = new Map<Game, GameModule<any, any>>();

export function registerGame(mod: GameModule<any, any>): void {
  registry.set(mod.game, mod);
}

export function getGameModule(game: Game): GameModule<any, any> {
  const mod = registry.get(game);
  if (!mod) throw new Error(`No game module registered for "${game}"`);
  return mod;
}

export function hasGameModule(game: Game): boolean {
  return registry.has(game);
}

/** Empty breakdown helper used by every grader. */
export function emptyBreakdown(): ScoreBreakdown {
  return { subskills: {}, notes: [] };
}

/** Registers every implemented game. Phases b-d append their imports here. */
export async function loadAllGames(): Promise<void> {
  await import('./redrock/index.js');
  await import('./seawolf/index.js');
  await import('./sfl/index.js');
}
