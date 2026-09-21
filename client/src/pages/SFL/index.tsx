import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SflScenarioPublic, SflAnswers, SessionScores } from '@solve/shared';
import { api, type StartedSession } from '../../api.js';
import { useProcessTracker } from '../../tracking/useProcessTracker.js';
import { Timer } from '../../components/Timer.js';
import { Ranking } from './Ranking.js';
import { Question } from './Question.js';
import { Results } from './Results.js';

export function SflGame({ mode = 'drill' }: { mode?: 'full' | 'drill' }) {
  const nav = useNavigate();
  const tracker = useProcessTracker();
  const [session, setSession] = useState<StartedSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 0 = the ranking task, 1..n = the multiple-choice questions. */
  const [step, setStep] = useState(0);
  const [showBriefing, setShowBriefing] = useState(true);
  const [result, setResult] = useState<(SessionScores & { scenario: unknown }) | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);

  const [answers, setAnswers] = useState<SflAnswers>({ ranking: [], choices: {} });

  const scenario = session?.scenario as SflScenarioPublic | undefined;
  const perQuestionBudget = session ? session.timeBudgetMs / 13 : 0;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    api
      .startSession('sfl', mode)
      .then((s) => {
        setSession(s);
        const sc = s.scenario as SflScenarioPublic;
        // Seed the ranking with the order as presented, so a candidate who
        // changes nothing is scored on that arrangement rather than on nothing.
        setAnswers((prev) => ({ ...prev, ranking: sc.ranking.items.map((i) => i.id) }));
      })
      .catch((e) => setError(e.message));
  }, [mode]);

  const beginTimedRun = useCallback(() => {
    setShowBriefing(false);
    tracker.enterStage('ranking', perQuestionBudget);
  }, [tracker, perQuestionBudget]);

  const submit = useCallback(
    async (final: SflAnswers) => {
      if (!session || submitting) return;
      setSubmitting(true);
      const payload = tracker.build();
      try {
        const res = await api.finalize(session.id, { ...payload, answers: final });
        setResult(res);
        window.scrollTo({ top: 0 });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setSubmitting(false);
      }
    },
    [session, tracker, submitting],
  );

  const advance = useCallback(() => {
    if (!scenario) return;
    const curStage = step === 0 ? 'ranking' : `q${step}`;
    tracker.exitStage(curStage);

    if (step < scenario.questions.length) {
      tracker.enterStage(`q${step + 1}`, perQuestionBudget);
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      void submit(answers);
    }
  }, [scenario, step, tracker, perQuestionBudget, answers, submit]);

  const reorder = useCallback(
    (order: string[]) => {
      tracker.countRevision('ranking');
      tracker.logAction('change', undefined, 'ranking');
      setAnswers((prev) => ({ ...prev, ranking: order }));
    },
    [tracker],
  );

  const choose = useCallback(
    (qid: string, optionId: string) => {
      setAnswers((prev) => {
        const had = prev.choices[qid];
        if (had && had !== optionId) tracker.countRevision(`q${step}`, { question: qid });
        tracker.logAction('answer', { question: qid }, `q${step}`);
        return { ...prev, choices: { ...prev.choices, [qid]: optionId } };
      });
    },
    [tracker, step],
  );

  if (error) {
    return (
      <div className="fade-in">
        <div className="banner" data-tone="bad">Could not start the lab: {error}</div>
        <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => nav('/')}>
          Back to Today
        </button>
      </div>
    );
  }

  if (result) return <Results result={result} answers={answers} onAgain={() => window.location.reload()} />;

  if (!session || !scenario) {
    return (
      <div className="fade-in">
        <div className="skeleton" style={{ height: 120, marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  // The briefing sits outside the clock, so reading it is not penalised.
  if (showBriefing) {
    return (
      <div className="fade-in" data-accent="moss">
        <div className="page-head">
          <div className="eyebrow">Sustainable Futures Lab</div>
          <h1>{scenario.title}</h1>
        </div>
        <div className="brief-card">
          <div className="brief-client">Briefing</div>
          <p className="brief-text">{scenario.briefing}</p>
          <div className="brief-objective">
            <span className="chip chip-accent">Format</span>
            <span>
              Thirteen decisions in {Math.round(session.timeBudgetMs / 60000)} minutes. There is no
              arithmetic. Several options are defensible; one is strongest.
            </span>
          </div>
        </div>
        <div className="stage-foot">
          <div className="note">The clock starts when you begin.</div>
          <button className="btn btn-primary btn-lg" onClick={beginTimedRun}>
            Begin
          </button>
        </div>
      </div>
    );
  }

  const total = scenario.questions.length + 1;
  const q = step > 0 ? scenario.questions[step - 1] : null;

  return (
    <div data-accent="moss">
      <header className="stage-bar">
        <div>
          <div className="eyebrow">Sustainable Futures Lab</div>
          <h1 style={{ fontSize: '1.5rem' }}>{scenario.title}</h1>
        </div>
        <div className="row">
          <div className="sfl-progress">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className="sfl-pip"
                data-state={i < step ? 'done' : i === step ? 'current' : 'todo'}
              />
            ))}
          </div>
          <Timer startedAt={tracker.startedAt} budgetMs={session.timeBudgetMs} label="Lab clock" />
        </div>
      </header>

      {step === 0 ? (
        <Ranking
          prompt={scenario.ranking.prompt}
          note={scenario.ranking.note}
          items={scenario.ranking.items}
          order={answers.ranking}
          onReorder={reorder}
          onDone={advance}
        />
      ) : q ? (
        <Question
          index={step + 1}
          total={total}
          phase={q.phase}
          situation={q.situation}
          prompt={q.prompt}
          options={q.options}
          chosen={answers.choices[q.id] ?? null}
          onChoose={(oid) => choose(q.id, oid)}
          onNext={advance}
          isLast={step === scenario.questions.length}
        />
      ) : null}

      {submitting && <div className="banner" data-tone="info" style={{ marginTop: 16 }}>Scoring…</div>}
    </div>
  );
}
