import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RedrockScenarioPublic, RedrockAnswers, SessionScores } from '@solve/shared';
import { api, type StartedSession } from '../../api.js';
import { useProcessTracker } from '../../tracking/useProcessTracker.js';
import { Timer } from '../../components/Timer.js';
import { Investigation } from './Investigation.js';
import { Analysis } from './Analysis.js';
import { Report } from './Report.js';
import { Cases } from './Cases.js';
import { Results } from './Results.js';

type Stage = 'investigation' | 'analysis' | 'report' | 'cases' | 'done';

const ORDER: Stage[] = ['investigation', 'analysis', 'report', 'cases'];
const STAGE_LABEL: Record<Stage, string> = {
  investigation: 'Investigation',
  analysis: 'Analysis',
  report: 'Report',
  cases: 'Cases',
  done: 'Results',
};

export function RedrockGame({ mode = 'drill' }: { mode?: 'full' | 'drill' }) {
  const nav = useNavigate();
  const tracker = useProcessTracker();
  const [session, setSession] = useState<StartedSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('investigation');
  const [result, setResult] = useState<(SessionScores & { scenario: unknown }) | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);

  const [answers, setAnswers] = useState<RedrockAnswers>({
    journal: [],
    analysis: {},
    report: { optionId: null, blanks: {}, chartId: null },
    cases: {},
  });

  // Start exactly one session, even under StrictMode double-mount.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    api
      .startSession('redrock', mode)
      .then((s) => {
        setSession(s);
        tracker.enterStage('investigation', s.budgets.investigation ?? 0);
      })
      .catch((e) => setError(e.message));
  }, [mode, tracker]);

  const scenario = session?.scenario as RedrockScenarioPublic | undefined;

  const advance = useCallback(
    (from: Stage, to: Stage) => {
      if (!session) return;
      const extras =
        from === 'investigation' && scenario
          ? journalMetrics(answers.journal, scenario)
          : {};
      tracker.exitStage(from, extras);
      if (to !== 'done') tracker.enterStage(to, session.budgets[to] ?? 0);
      setStage(to);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [session, tracker, answers.journal, scenario],
  );

  const submit = useCallback(async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    tracker.exitStage('cases');
    const payload = tracker.build();
    try {
      const res = await api.finalize(session.id, { ...payload, answers });
      setResult(res);
      setStage('done');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [session, answers, tracker, submitting]);

  /* ---------------- answer handlers, with revision counting ---------------- */

  const toggleJournal = useCallback(
    (id: string) => {
      setAnswers((prev) => {
        const has = prev.journal.includes(id);
        // Removing something already added is a reversal.
        if (has) tracker.countRevision('investigation', { exhibit: id });
        tracker.logAction(has ? 'deselect' : 'select', { exhibit: id }, 'investigation');
        return {
          ...prev,
          journal: has ? prev.journal.filter((x) => x !== id) : [...prev.journal, id],
        };
      });
    },
    [tracker],
  );

  const setAnalysis = useCallback(
    (id: string, value: number | null) => {
      setAnswers((prev) => {
        if (prev.analysis[id] != null && value != null && prev.analysis[id] !== value) {
          tracker.countRevision('analysis', { question: id });
        }
        tracker.logAction('answer', { question: id }, 'analysis');
        return { ...prev, analysis: { ...prev.analysis, [id]: value } };
      });
    },
    [tracker],
  );

  const setCase = useCallback(
    (id: string, value: number | null) => {
      setAnswers((prev) => {
        if (prev.cases[id] != null && value != null && prev.cases[id] !== value) {
          tracker.countRevision('cases', { question: id });
        }
        tracker.logAction('answer', { question: id }, 'cases');
        return { ...prev, cases: { ...prev.cases, [id]: value } };
      });
    },
    [tracker],
  );

  const setReportField = useCallback(
    (patch: Partial<RedrockAnswers['report']>, revised: boolean) => {
      if (revised) tracker.countRevision('report');
      tracker.logAction('answer', undefined, 'report');
      setAnswers((prev) => ({ ...prev, report: { ...prev.report, ...patch } }));
    },
    [tracker],
  );

  /* ---------------- render ---------------- */

  const journalExhibits = useMemo(
    () => (scenario ? scenario.exhibits.filter((e) => answers.journal.includes(e.id)) : []),
    [scenario, answers.journal],
  );

  if (error) {
    return (
      <div className="fade-in">
        <div className="banner" data-tone="bad">Could not start the study: {error}</div>
        <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => nav('/')}>
          Back to Today
        </button>
      </div>
    );
  }

  if (!session || !scenario) {
    return (
      <div className="fade-in">
        <div className="skeleton" style={{ height: 120, marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  if (stage === 'done' && result) {
    return <Results result={result} onAgain={() => window.location.reload()} />;
  }

  const stageIdx = ORDER.indexOf(stage);

  return (
    <div data-accent="ember">
      <header className="stage-bar">
        <div>
          <div className="eyebrow">Redrock Study · {scenario.client}</div>
          <h1 style={{ fontSize: '1.5rem' }}>{scenario.title}</h1>
        </div>
        <div className="row">
          <div className="stage-steps">
            {ORDER.map((s, i) => (
              <div key={s} className="stage-step" data-state={i < stageIdx ? 'done' : i === stageIdx ? 'current' : 'todo'}>
                <span className="stage-step-dot">{i < stageIdx ? '✓' : i + 1}</span>
                <span>{STAGE_LABEL[s]}</span>
              </div>
            ))}
          </div>
          <Timer
            startedAt={tracker.startedAt}
            budgetMs={session.timeBudgetMs}
            label="Study clock"
          />
        </div>
      </header>

      {stage === 'investigation' && (
        <Investigation
          brief={scenario.brief}
          objective={scenario.objective}
          client={scenario.client}
          exhibits={scenario.exhibits}
          journal={answers.journal}
          onToggle={toggleJournal}
          onDone={() => advance('investigation', 'analysis')}
        />
      )}

      {stage === 'analysis' && (
        <Analysis
          questions={scenario.analysis}
          journalExhibits={journalExhibits}
          values={answers.analysis}
          onChange={setAnalysis}
          onDone={() => advance('analysis', 'report')}
        />
      )}

      {stage === 'report' && (
        <Report
          report={scenario.report}
          analysisValues={answers.analysis}
          optionId={answers.report.optionId}
          blanks={answers.report.blanks}
          chartId={answers.report.chartId}
          onOption={(id) => setReportField({ optionId: id }, answers.report.optionId != null)}
          onChart={(id) => setReportField({ chartId: id }, answers.report.chartId != null)}
          onBlank={(id, v) =>
            setReportField(
              { blanks: { ...answers.report.blanks, [id]: v } },
              answers.report.blanks[id] != null,
            )
          }
          onDone={() => advance('report', 'cases')}
        />
      )}

      {stage === 'cases' && (
        <Cases cases={scenario.cases} values={answers.cases} onChange={setCase} onDone={submit} />
      )}

      {submitting && <div className="banner" data-tone="info" style={{ marginTop: 16 }}>Scoring…</div>}
    </div>
  );
}

/**
 * Precision and recall of the journal are computed client-side for telemetry
 * only; the server re-derives them from the answer key when grading.
 * The public scenario carries no answer key, so this uses a neutral estimate
 * and lets the server's own figures win.
 */
function journalMetrics(journal: string[], scenario: RedrockScenarioPublic) {
  // The browser cannot know the ground truth, so report counts and let the
  // server attach the authoritative precision/recall during grading.
  return { stageScore: journal.length / Math.max(scenario.exhibits.length, 1) };
}
