/** Game identifiers used everywhere (DB, routes, UI). */
export const GAMES = ['redrock', 'seawolf', 'sfl'] as const;
export type Game = (typeof GAMES)[number];

export const GAME_META: Record<
  Game,
  { name: string; short: string; initials: string; blurb: string; accent: string }
> = {
  redrock: {
    name: 'Redrock Study',
    short: 'Redrock',
    initials: 'RS',
    blurb: 'Triage exhibits, run the numbers, defend a recommendation.',
    accent: 'ember',
  },
  seawolf: {
    name: 'Sea Wolf',
    short: 'Sea Wolf',
    initials: 'SW',
    blurb: 'Match microbe cultures to contaminated sites under hard constraints.',
    accent: 'tide',
  },
  sfl: {
    name: 'Sustainable Futures Lab',
    short: 'Futures Lab',
    initials: 'FL',
    blurb: 'Judgement calls on a live project with incomplete information.',
    accent: 'moss',
  },
};

/**
 * Default time budgets in milliseconds. Editable at runtime from Settings;
 * these are only the fallback values seeded into the DB on first boot.
 * Real-assessment reference points: Redrock ~35 min, Sea Wolf ~30 min,
 * SFL ~20 min.
 */
export const DEFAULT_BUDGETS = {
  redrock_total: 35 * 60_000,
  redrock_investigation: 12 * 60_000,
  redrock_analysis: 10 * 60_000,
  redrock_report: 5 * 60_000,
  redrock_cases: 8 * 60_000,
  seawolf_total: 30 * 60_000,
  seawolf_site: 10 * 60_000,
  sfl_total: 20 * 60_000,
} as const;

/** Structural constants for Sea Wolf. Mirrors the real game's shape. */
export const SEAWOLF = {
  sitesPerSession: 3,
  characteristicsShown: 7,
  characteristicsToPrioritize: 2,
  candidates: 12,
  prospectPool: 6,
  finalTeam: 3,
  /** 3 numeric attribute ranges + 1 required trait + 1 forbidden trait = 5 checks */
  criteriaPerSite: 5,
  penaltyPerMissedCriterion: 20,
} as const;

/** Structural constants for Redrock. */
export const REDROCK = {
  exhibitsMin: 8,
  exhibitsMax: 10,
  analysisQuestions: 4,
  reportQuestions: 3,
  caseQuestions: 6,
} as const;

/** Structural constants for Sustainable Futures Lab. */
export const SFL = {
  questionsPerSession: 13,
  /** Q1 is always a drag-to-rank prioritisation, like the real module. */
  rankingQuestions: 1,
  optionPoints: { best: 100, good: 60, weak: 25, poor: 0 },
} as const;

/**
 * Product-score weights per game. Each value is a fraction of that game's
 * 0-100 product score.
 */
export const PRODUCT_WEIGHTS = {
  redrock: {
    investigation: 0.15,
    analysis: 0.35,
    report: 0.2,
    cases: 0.3,
  },
} as const;

/**
 * Process-score weights. McKinsey does not publish its formula; these four
 * components mirror the telemetry the real assessment is documented to watch:
 * how time is allocated, how quickly you commit, how much you churn, and how
 * selectively you gather data.
 */
export const PROCESS_WEIGHTS = {
  pacing: 0.35,
  decisiveness: 0.2,
  revisions: 0.2,
  dataDiscipline: 0.25,
} as const;

/** Combined score blend. */
export const COMBINED_BLEND = { product: 0.6, process: 0.4 } as const;

/** Sub-skill keys tracked for the weak-spots view. Add freely. */
export const SUBSKILLS = {
  'redrock.investigation_precision': 'Exhibit triage precision',
  'redrock.investigation_recall': 'Exhibit triage recall',
  'redrock.analysis_accuracy': 'Quantitative analysis',
  'redrock.report_quality': 'Synthesis & recommendation',
  'redrock.cases_accuracy': 'Rapid-fire cases',
  'seawolf.categorisation': 'Candidate screening',
  'seawolf.constraint_accuracy': 'Constraint satisfaction',
  'seawolf.prioritisation': 'Constraint prioritisation',
  'sfl.judgment': 'Situational judgement',
  'sfl.prioritisation': 'Prioritisation',
  'process.pacing': 'Pacing vs budget',
  'process.decisiveness': 'Decisiveness',
  'process.revisions': 'Revision discipline',
  'process.data_discipline': 'Data discipline',
} as const;

export type SubskillKey = keyof typeof SUBSKILLS;
