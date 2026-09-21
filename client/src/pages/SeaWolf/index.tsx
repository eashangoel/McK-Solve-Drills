import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SEAWOLF,
  type SeaWolfScenarioPublic,
  type SeaWolfAnswers,
  type SiteAnswer,
  type SessionScores,
} from '@solve/shared';
import { api, type StartedSession } from '../../api.js';
import { useProcessTracker } from '../../tracking/useProcessTracker.js';
import { Timer } from '../../components/Timer.js';
import { Priorities } from './Priorities.js';
import { Screen } from './Screen.js';
import { Shortlist } from './Shortlist.js';
import { FinalTrio } from './FinalTrio.js';
import { Results } from './Results.js';

type Step = 'priorities' | 'screen' | 'shortlist' | 'trio';
const STEPS: Step[] = ['priorities', 'screen', 'shortlist', 'trio'];
const STEP_LABEL: Record<Step, string> = {
  priorities: 'Priorities',
  screen: 'Screening',
  shortlist: 'Prospect pool',
  trio: 'Treatment',
};
/** Share of the per-site budget allotted to each step. */
const STEP_WEIGHT: Record<Step, number> = {
  priorities: 0.15,
  screen: 0.35,
  shortlist: 0.2,
  trio: 0.3,
};

const emptySite = (): SiteAnswer => ({ priorities: [], accepted: [], shortlist: [], trio: [] });

export function SeaWolfGame({ mode = 'drill' }: { mode?: 'full' | 'drill' }) {
  const nav = useNavigate();
  const tracker = useProcessTracker();
  const [session, setSession] = useState<StartedSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [siteIdx, setSiteIdx] = useState(0);
  const [step, setStep] = useState<Step>('priorities');
  const [result, setResult] = useState<(SessionScores & { scenario: unknown }) | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);

  const [answers, setAnswers] = useState<SeaWolfAnswers>({ sites: {} });

  const scenario = session?.scenario as SeaWolfScenarioPublic | undefined;
  const site = scenario?.sites[siteIdx];
  const siteBudget = session?.budgets.site ?? 0;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    api
      .startSession('seawolf', mode)
      .then((s) => {
        setSession(s);
        const first = (s.scenario as SeaWolfScenarioPublic).sites[0];
        tracker.enterStage(`priorities:${first.id}`, (s.budgets.site ?? 0) * STEP_WEIGHT.priorities);
      })
      .catch((e) => setError(e.message));
  }, [mode, tracker]);

  const patchSite = useCallback(
    (siteId: string, patch: Partial<SiteAnswer>) => {
      setAnswers((prev) => ({
        sites: {
          ...prev.sites,
          [siteId]: { ...(prev.sites[siteId] ?? emptySite()), ...patch },
        },
      }));
    },
    [],
  );

  /** Toggling a membership list, counting a removal as a revision. */
  const toggleIn = useCallback(
    (siteId: string, field: keyof SiteAnswer, id: string, stage: string) => {
      setAnswers((prev) => {
        const cur = prev.sites[siteId] ?? emptySite();
        const list = cur[field] as string[];
        const has = list.includes(id);
        if (has) tracker.countRevision(stage, { item: id });
        tracker.logAction(has ? 'deselect' : 'select', { item: id }, stage);
        return {
          sites: {
            ...prev.sites,
            [siteId]: { ...cur, [field]: has ? list.filter((x) => x !== id) : [...list, id] },
          },
        };
      });
    },
    [tracker],
  );

  const submit = useCallback(
    async (finalAnswers: SeaWolfAnswers) => {
      if (!session || submitting) return;
      setSubmitting(true);
      const payload = tracker.build();
      try {
        const res = await api.finalize(session.id, { ...payload, answers: finalAnswers });
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
    if (!scenario || !site) return;
    const curStage = `${step}:${site.id}`;
    tracker.exitStage(curStage);

    const stepIdx = STEPS.indexOf(step);
    if (stepIdx < STEPS.length - 1) {
      const next = STEPS[stepIdx + 1];
      tracker.enterStage(`${next}:${site.id}`, siteBudget * STEP_WEIGHT[next]);
      setStep(next);
    } else if (siteIdx < scenario.sites.length - 1) {
      const nextSite = scenario.sites[siteIdx + 1];
      tracker.enterStage(`priorities:${nextSite.id}`, siteBudget * STEP_WEIGHT.priorities);
      setSiteIdx(siteIdx + 1);
      setStep('priorities');
    } else {
      void submit(answers);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scenario, site, step, siteIdx, siteBudget, tracker, answers, submit]);

  if (error) {
    return (
      <div className="fade-in">
        <div className="banner" data-tone="bad">Could not start Sea Wolf: {error}</div>
        <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => nav('/')}>
          Back to Today
        </button>
      </div>
    );
  }

  if (result) {
    return <Results result={result} onAgain={() => window.location.reload()} />;
  }

  if (!session || !scenario || !site) {
    return (
      <div className="fade-in">
        <div className="skeleton" style={{ height: 120, marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  const cur = answers.sites[site.id] ?? emptySite();
  const stepIdx = STEPS.indexOf(step);
  const isLastSite = siteIdx === scenario.sites.length - 1;

  return (
    <div data-accent="tide">
      <header className="stage-bar">
        <div>
          <div className="eyebrow">Sea Wolf · {scenario.title}</div>
          <h1 style={{ fontSize: '1.5rem' }}>{site.name}</h1>
        </div>
        <div className="row">
          <div className="site-pips">
            {scenario.sites.map((s, i) => (
              <span
                key={s.id}
                className="site-pip"
                data-state={i < siteIdx ? 'done' : i === siteIdx ? 'current' : 'todo'}
                title={s.name}
              />
            ))}
          </div>
          <div className="stage-steps">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className="stage-step"
                data-state={i < stepIdx ? 'done' : i === stepIdx ? 'current' : 'todo'}
              >
                <span className="stage-step-dot">{i < stepIdx ? '✓' : i + 1}</span>
                <span>{STEP_LABEL[s]}</span>
              </div>
            ))}
          </div>
          <Timer startedAt={tracker.startedAt} budgetMs={session.timeBudgetMs} label="Programme" />
        </div>
      </header>

      {step === 'priorities' && (
        <Priorities
          site={site}
          siteIndex={siteIdx}
          selected={cur.priorities}
          onToggle={(k) => toggleIn(site.id, 'priorities', k, `priorities:${site.id}`)}
          onDone={advance}
        />
      )}

      {step === 'screen' && (
        <Screen
          site={site}
          accepted={cur.accepted}
          onToggle={(id) => toggleIn(site.id, 'accepted', id, `screen:${site.id}`)}
          onDone={advance}
        />
      )}

      {step === 'shortlist' && (
        <Shortlist
          site={site}
          accepted={cur.accepted}
          shortlist={cur.shortlist}
          onToggle={(id) => toggleIn(site.id, 'shortlist', id, `shortlist:${site.id}`)}
          onDone={advance}
        />
      )}

      {step === 'trio' && (
        <FinalTrio
          site={site}
          shortlist={cur.shortlist}
          trio={cur.trio}
          onToggle={(id) => toggleIn(site.id, 'trio', id, `trio:${site.id}`)}
          onDone={advance}
          isLastSite={isLastSite}
        />
      )}

      {submitting && (
        <div className="banner" data-tone="info" style={{ marginTop: 16 }}>Scoring…</div>
      )}
    </div>
  );
}

export { SEAWOLF };
