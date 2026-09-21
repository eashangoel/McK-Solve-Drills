/** Data shapes for the Sustainable Futures Lab judgement module. */

export type Tier = 'best' | 'good' | 'weak' | 'poor';

/** Detail slots filled per run so a repeated template does not read identically. */
export interface SflContext {
  site: string;
  ecosystem: string;
  sponsor: string;
  sponsorOrg: string;
  lead: string;
  analyst: string;
  partner: string;
  partnerOrg: string;
  deadlineWeeks: number;
  daysLeft: number;
  budgetPressure: string;
  contaminant: string;
  season: string;
}

export interface OptionTemplate {
  text: string;
  tier: Tier;
  why: string;
}

export interface QuestionTemplate {
  id: string;
  /** 1 = orientation, 2 = complication, 3 = decision under pressure. */
  phase: 1 | 2 | 3;
  /** Judgement skill exercised, shown in the review. */
  theme: string;
  situation: string;
  prompt: string;
  options: OptionTemplate[];
}

export interface RankingTemplate {
  id: string;
  prompt: string;
  note: string;
  /** Listed in their correct priority order; the generator shuffles them. */
  items: { id: string; text: string; why: string }[];
}

/* ---- Generated, run-specific shapes ---- */

export interface SflOption {
  id: string;
  text: string;
  /* answer key */
  tier: Tier;
  points: number;
  why: string;
}

export interface SflQuestion {
  id: string;
  templateId: string;
  phase: 1 | 2 | 3;
  theme: string;
  situation: string;
  prompt: string;
  options: SflOption[];
}

export interface SflRanking {
  id: string;
  templateId: string;
  prompt: string;
  note: string;
  /** Presented in shuffled order. */
  items: { id: string; text: string }[];
  /* answer key */
  idealOrder: string[];
  rationale: { id: string; why: string }[];
}

export interface SflScenario {
  templateId: string;
  title: string;
  context: SflContext;
  briefing: string;
  ranking: SflRanking;
  questions: SflQuestion[];
}

export interface SflScenarioPublic {
  templateId: string;
  title: string;
  briefing: string;
  ranking: { id: string; prompt: string; note: string; items: { id: string; text: string }[] };
  questions: {
    id: string;
    phase: 1 | 2 | 3;
    situation: string;
    prompt: string;
    options: { id: string; text: string }[];
  }[];
}

export interface SflAnswers {
  /** Item ids in the order the candidate placed them. */
  ranking: string[];
  /** question id -> chosen option id */
  choices: Record<string, string>;
}
