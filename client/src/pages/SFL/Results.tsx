import { useNavigate } from 'react-router-dom';
import type { SessionScores, SflScenario, SflAnswers, Tier } from '@solve/shared';
import { ScoreRing } from '../../components/ScoreRing.js';
import { scoreTone } from '../../lib/format.js';

interface Props {
  result: SessionScores & { scenario: unknown };
  answers: SflAnswers;
  onAgain: () => void;
}

const TIER_LABEL: Record<Tier, string> = {
  best: 'Strongest',
  good: 'Defensible',
  weak: 'Flawed',
  poor: 'Weakest',
};
const TIER_TONE: Record<Tier, string> = {
  best: 'good',
  good: 'accent',
  weak: 'warn',
  poor: 'bad',
};

/** Post-run review: what you picked, what was strongest, and why. */
export function Results({ result, answers, onAgain }: Props) {
  const nav = useNavigate();
  const scenario = result.scenario as SflScenario;
  const notes = result.breakdown?.notes ?? [];

  const submitted = answers.ranking ?? [];
  const ideal = scenario.ranking.idealOrder;
  const itemText = new Map(scenario.ranking.items.map((i) => [i.id, i.text]));
  const whyById = new Map(scenario.ranking.rationale.map((r) => [r.id, r.why]));

  return (
    <div className="fade-in" data-accent="moss">
      <div className="page-head">
        <div className="eyebrow">Sustainable Futures Lab complete</div>
        <h1>{scenario.title}</h1>
      </div>

      <div className="results-rings">
        <div className="card results-ring-card">
          <ScoreRing value={result.productScore} label="Product" size={118} />
          <div>
            <div className="card-title">Product score</div>
            <div className="card-sub">Quality of your judgement calls.</div>
          </div>
        </div>
        <div className="card results-ring-card">
          <ScoreRing value={result.processScore} label="Process" size={118} />
          <div>
            <div className="card-title">Process score</div>
            <div className="card-sub">Pacing, decisiveness and revision discipline.</div>
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
        <h2>Your priorities against the ideal</h2>
      </div>
      <div className="card">
        <div className="rank-compare">
          <div>
            <div className="stat-label" style={{ marginBottom: 8 }}>You ranked</div>
            <ol className="rank-review">
              {submitted.map((id, i) => {
                const idealPos = ideal.indexOf(id);
                const off = Math.abs(idealPos - i);
                return (
                  <li key={id} data-off={off === 0 ? 'exact' : off === 1 ? 'near' : 'far'}>
                    <span className="mono">{i + 1}</span>
                    <span>{itemText.get(id)}</span>
                    {off > 0 && <span className="rank-delta mono">ideal {idealPos + 1}</span>}
                  </li>
                );
              })}
            </ol>
          </div>
          <div>
            <div className="stat-label" style={{ marginBottom: 8 }}>Ideal order, and why</div>
            <ol className="rank-review">
              {ideal.map((id, i) => (
                <li key={id} data-off="exact">
                  <span className="mono">{i + 1}</span>
                  <span>
                    {itemText.get(id)}
                    <span className="rank-why">{whyById.get(id)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>Every decision reviewed</h2>
        <div className="note">Partial credit applies; several options are defensible.</div>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        {scenario.questions.map((q, i) => {
          const chosenId = answers.choices?.[q.id];
          const chosen = q.options.find((o) => o.id === chosenId);
          const best = q.options.find((o) => o.tier === 'best')!;
          return (
            <div className="card" key={q.id}>
              <div className="row-between" style={{ alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div className="question-index">Q{i + 2} · {q.theme}</div>
                  <div className="card-title" style={{ marginTop: 4 }}>{q.prompt}</div>
                </div>
                <span className={`chip chip-${chosen ? TIER_TONE[chosen.tier] : 'bad'}`}>
                  {chosen ? `${TIER_LABEL[chosen.tier]} · ${chosen.points}` : 'No answer · 0'}
                </span>
              </div>

              {chosen && (
                <div className="review-block" data-tone={TIER_TONE[chosen.tier]}>
                  <div className="review-label">You chose</div>
                  <div className="review-text">{chosen.text}</div>
                  <div className="review-why">{chosen.why}</div>
                </div>
              )}

              {(!chosen || chosen.tier !== 'best') && (
                <div className="review-block" data-tone="good">
                  <div className="review-label">Strongest option</div>
                  <div className="review-text">{best.text}</div>
                  <div className="review-why">{best.why}</div>
                </div>
              )}

              <details style={{ marginTop: 10 }}>
                <summary className="details-summary">Show the situation and all options</summary>
                <p className="card-sub" style={{ margin: '10px 0' }}>{q.situation}</p>
                <div className="grid" style={{ gap: 6 }}>
                  {q.options.map((o) => (
                    <div className="review-block" data-tone={TIER_TONE[o.tier]} key={o.id}>
                      <div className="review-label">{TIER_LABEL[o.tier]} · {o.points} points</div>
                      <div className="review-text">{o.text}</div>
                      <div className="review-why">{o.why}</div>
                    </div>
                  ))}
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
        <button className="btn btn-primary btn-lg" onClick={onAgain}>
          Run it again
        </button>
      </div>
    </div>
  );
}
