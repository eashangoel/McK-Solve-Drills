/** Data shapes for the Redrock Study module. */

export type ExhibitKind = 'table' | 'bar' | 'line' | 'note';

export interface Exhibit {
  id: string;
  title: string;
  kind: ExhibitKind;
  caption?: string;
  unit?: string;
  /** table */
  columns?: string[];
  rows?: (string | number)[][];
  /** bar / line */
  series?: { name: string; points: { label: string; value: number }[] }[];
  /** note */
  body?: string;
  /** Short tag shown on the card, e.g. "Finance". */
  source?: string;
}

export interface AnalysisQuestion {
  id: string;
  prompt: string;
  /** Suffix shown beside the input. */
  unit: '%' | 'x' | '$m' | 'yrs' | 'k units' | '';
  answer: number;
  /** Absolute tolerance for a correct answer. */
  tolerance: number;
  decimals: number;
  /** Ground truth: exhibits genuinely needed to answer this. */
  requiredExhibits: string[];
  explanation: string;
}

export interface ReportOption {
  id: string;
  text: string;
  /** Which recommendation this option represents. */
  verdict: string;
}

/**
 * The report is graded against the candidate's OWN analysis answers, so an
 * earlier arithmetic error carries forward instead of being double-counted.
 */
export interface ReportStage {
  preamble: string;
  /** Sentence with {{blank}} placeholders. */
  sentence: string;
  options: ReportOption[];
  /** Verdict implied by a correctly computed `decisionValue`. */
  correctVerdict: string;
  /** Which analysis question drives the recommendation. */
  decisionQuestionId: string;
  /** Threshold the decision value is compared against. */
  threshold: number;
  /** 'above' means verdict A when value > threshold. */
  verdictAbove: string;
  verdictBelow: string;
  /** Numeric blanks, each mirroring an analysis question the candidate answered. */
  blanks: { id: string; label: string; fromQuestionId: string; unit: string }[];
  /** Which chart best supports the recommendation. */
  chartChoices: { id: string; label: string }[];
  correctChartId: string;
}

export interface CaseQuestion {
  id: string;
  prompt: string;
  exhibit: Exhibit;
  unit: AnalysisQuestion['unit'];
  answer: number;
  tolerance: number;
  decimals: number;
  explanation: string;
  /** Multiple-choice variant; when present the candidate picks instead of typing. */
  choices?: { id: string; label: string; value: number }[];
}

export interface RedrockScenario {
  templateId: string;
  title: string;
  client: string;
  brief: string;
  objective: string;
  exhibits: Exhibit[];
  /** Union of every exhibit actually needed downstream. */
  relevantExhibitIds: string[];
  analysis: AnalysisQuestion[];
  report: ReportStage;
  cases: CaseQuestion[];
}

/** What the browser receives: identical, minus every answer. */
export interface RedrockScenarioPublic {
  templateId: string;
  title: string;
  client: string;
  brief: string;
  objective: string;
  exhibits: Exhibit[];
  analysis: Omit<AnalysisQuestion, 'answer' | 'tolerance' | 'explanation' | 'requiredExhibits'>[];
  report: Omit<ReportStage, 'correctVerdict' | 'correctChartId' | 'verdictAbove' | 'verdictBelow'>;
  cases: Omit<CaseQuestion, 'answer' | 'tolerance' | 'explanation'>[];
}

export interface RedrockAnswers {
  journal: string[];
  analysis: Record<string, number | null>;
  report: {
    optionId: string | null;
    blanks: Record<string, number | null>;
    chartId: string | null;
  };
  cases: Record<string, number | null>;
}

export interface RedrockTemplate {
  id: string;
  label: string;
  build(rng: import('../../rng.js').Rng): Omit<RedrockScenario, 'templateId' | 'cases'>;
}
