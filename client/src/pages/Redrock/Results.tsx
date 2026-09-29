import { useNavigate } from 'react-router-dom';
import type { SessionScores, RedrockScenario, RedrockAnswers } from '@solve/shared';
import { ScoreRing } from '../../components/ScoreRing.js';
import { ExhibitView, ExhibitHeader } from '../../components/ExhibitView.js';
import { scoreTone } from '../../lib/format.js';

interface Props {
  result: SessionScores & { scenario: unknown };
  answers: RedrockAnswers;
  onAgain?: () => void;
}

const near = (a: number | null | undefined, b: number, tol: number) =>
  a != null && Number.isFinite(a) && Math.abs(a - b) <= tol;

/** A submitted-value-vs-correct-value row, used throughout this screen. */
function AnswerRow({
  yours,
  correct,
  correctLabel = 'Correct answer',
  right,
}: {
  yours: string;
  correct: string;
  correctLabel?: string;
  right: boolean;
}) {
  return (
    <div className="answer-compare">
      <div className="answer-compare-cell" data-tone={right ? 'good' : 'bad'}>
        <div className="answer-compare-label">Your answer</div>
        <div className="answer-compare-value mono">{yours}</div>
      </div>
      <div className="answer-compare-arrow">{right ? '✓' : '→'}</div>
      <div className="answer-compare-cell" data-tone="accent">
        <div className="answer-compare-label">{correctLabel}</div>
        <div className="answer-compare-value mono">{correct}</div>
      </div>
    </div>
  );
}

/** Post-run review: scores, where marks went, and every answer against the key. */
export function Results({ result, answers, onAgain }: Props) {
  const nav = useNavigate();
  const scenario = result.scenario as RedrockScenario;
  const notes = result.breakdown?.notes ?? [];
  const rep = scenario.report;
  const repAns = answers.report ?? { optionId: null, blanks: {}, chartId: null };

  const chosenOption = rep.options.find((o) => o.id === repAns.optionId);
  const decisionOwn = answers.analysis?.[rep.decisionQuestionId];
  const impliedVerdict =
    decisionOwn == null ? null : decisionOwn >= rep.threshold ? rep.verdictAbove : rep.verdictBelow;
  const recommendationConsistent = !!chosenOption && chosenOption.verdict === impliedVerdict;
  const trueCorrectOption = rep.options.find((o) => o.verdict === rep.correctVerdict);
  // Did the textbook-correct call differ from what the candidate's OWN
  // analysis figure implied? If so, the report is graded as consistent (it
  // followed your figure faithfully) even though your underlying figure was
  // itself wrong — worth surfacing so the two failures aren't conflated.
  const ownAnalysisWasOffOnDecision = impliedVerdict != null && rep.correctVerdict !== impliedVerdict;

  const chosenChart = rep.chartChoices.find((c) => c.id === repAns.chartId);
  const correctChart = rep.chartChoices.find((c) => c.id === rep.correctChartId);

  return (
    <div className="fade-in" data-accent="ember">
      <div className="page-head">
        <div className="eyebrow">Redrock Study complete</div>
        <h1>{scenario.title}</h1>
      </div>

      <div className="results-rings">
        <div className="card results-ring-card">
          <ScoreRing value={result.productScore} label="Product" size={118} />
          <div>
            <div className="card-title">Product score</div>
            <div className="card-sub">Correctness of what you submitted.</div>
          </div>
        </div>
        <div className="card results-ring-card">
          <ScoreRing value={result.processScore} label="Process" size={118} />
          <div>
            <div className="card-title">Process score</div>
            <div className="card-sub">Pacing, decisiveness, revisions and data discipline.</div>
          </div>
        </div>
        <div className="card results-ring-card">
          <ScoreRing value={result.combinedScore} label="Combined" size={118} />
          <div>
            <div className="card-title">Combined</div>
            <div className="card-sub">60% product, 40% process.</div>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>Where the marks went</h2>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        {notes.map((n) => (
          <div className="card breakdown-row" key={n.label}>
            <div>
              <div className="card-title">{n.label}</div>
              <div className="card-sub">{n.detail}</div>
            </div>
            <div className={`chip chip-${scoreTone((n.earned / Math.max(n.possible, 1)) * 100)}`}>
              {n.earned} / {n.possible}
            </div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2>Analysis</h2>
        <div className="note">Your submitted value against the correct one, within tolerance.</div>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        {scenario.analysis.map((q, i) => {
          const yours = answers.analysis?.[q.id];
          const right = near(yours, q.answer, q.tolerance);
          return (
            <div className="card" key={q.id}>
              <div className="question-index">Q{i + 1}</div>
              <div className="card-title" style={{ marginTop: 4 }}>{q.prompt}</div>
              <AnswerRow
                yours={yours != null ? `${yours}${q.unit}` : 'no answer'}
                correct={`${q.answer}${q.unit}`}
                right={right}
              />
              <div className="card-sub" style={{ marginTop: 10 }}>{q.explanation}</div>
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <h2>Report</h2>
        <div className="note">
          Blanks are graded against your own analysis figures, not the true ones — carrying a
          number through accurately earns credit even if that number was itself wrong.
        </div>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        <div className="card">
          <div className="card-title">Recommendation</div>
          <AnswerRow
            yours={chosenOption ? `We recommend ${chosenOption.text}.` : 'no answer'}
            correct={
              impliedVerdict
                ? `${rep.options.find((o) => o.verdict === impliedVerdict)?.text ?? '—'} (from your own figures)`
                : '—'
            }
            correctLabel="Consistent with your figures"
            right={recommendationConsistent}
          />
          {trueCorrectOption && ownAnalysisWasOffOnDecision && (
            <div className="banner" data-tone="info" style={{ marginTop: 12 }}>
              The textbook-correct recommendation was actually{' '}
              <strong>{trueCorrectOption.text}</strong> — your analysis figure for this decision
              was itself off, which is why it's marked wrong above in the Analysis section.
            </div>
          )}
        </div>

        {rep.blanks.map((b) => {
          const own = answers.analysis?.[b.fromQuestionId];
          const yours = repAns.blanks?.[b.id];
          const q = scenario.analysis.find((a) => a.id === b.fromQuestionId);
          const right = own != null && near(yours, own, Math.max(q?.tolerance ?? 0.05, 0.05));
          return (
            <div className="card" key={b.id}>
              <div className="card-title">{b.label}</div>
              <AnswerRow
                yours={yours != null ? `${yours}${b.unit}` : 'no answer'}
                correct={own != null ? `${own}${b.unit}` : '—'}
                correctLabel="Your own analysis figure"
                right={right}
              />
            </div>
          );
        })}

        <div className="card">
          <div className="card-title">Supporting exhibit</div>
          <AnswerRow
            yours={chosenChart?.label ?? 'no answer'}
            correct={correctChart?.label ?? '—'}
            right={repAns.chartId === rep.correctChartId}
          />
        </div>
      </div>

      <div className="section-head">
        <div className="note">Which exhibits mattered</div>
      </div>
      <div className="grid" style={{ gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))' }}>
        {scenario.exhibits.map((e) => {
          const needed = scenario.relevantExhibitIds.includes(e.id);
          const picked = answers.journal.includes(e.id);
          return (
            <div className="card" key={e.id} data-needed={needed || undefined}>
              <div className="row-between">
                <ExhibitHeader exhibit={e} />
                <div className="row" style={{ gap: 6 }}>
                  {picked && <span className="chip chip-accent">In your journal</span>}
                  <span className={needed ? 'chip chip-good' : 'chip'}>
                    {needed ? 'Needed' : 'Decoy'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <div className="note">Rapid-fire cases</div>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        {scenario.cases.map((c, i) => {
          const yours = answers.cases?.[c.id];
          const right = near(yours, c.answer, c.tolerance);
          return (
            <div className="card" key={c.id}>
              <div className="question-index">Case {i + 1}</div>
              <div className="card-title" style={{ marginTop: 4 }}>{c.prompt}</div>
              <AnswerRow
                yours={yours != null ? `${yours}${c.unit}` : 'no answer'}
                correct={`${c.answer}${c.unit}`}
                right={right}
              />
              <div className="card-sub" style={{ marginTop: 10 }}>{c.explanation}</div>
              <details style={{ marginTop: 12 }}>
                <summary className="details-summary">Show exhibit</summary>
                <div style={{ marginTop: 10 }}>
                  <ExhibitView exhibit={c.exhibit} height={170} />
                </div>
              </details>
            </div>
          );
        })}
      </div>

      <div className="stage-foot">
        <button className="btn btn-ghost" onClick={() => nav('/progress')}>
          View progress
        </button>
        {onAgain ? (
          <button className="btn btn-primary btn-lg" onClick={onAgain}>
            Run it again
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={() => nav('/play/redrock')}>
            Practice again
          </button>
        )}
      </div>
    </div>
  );
}
