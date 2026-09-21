import { useNavigate } from 'react-router-dom';
import type { SessionScores, RedrockScenario } from '@solve/shared';
import { ScoreRing } from '../../components/ScoreRing.js';
import { ExhibitView, ExhibitHeader } from '../../components/ExhibitView.js';
import { scoreTone } from '../../lib/format.js';

interface Props {
  result: SessionScores & { scenario: unknown };
  onAgain: () => void;
}

/** Post-run review: scores, where marks went, and the worked answers. */
export function Results({ result, onAgain }: Props) {
  const nav = useNavigate();
  const scenario = result.scenario as RedrockScenario;
  const notes = result.breakdown?.notes ?? [];

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
        <h2>Worked answers</h2>
        <div className="note">Analysis</div>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        {scenario.analysis.map((q, i) => (
          <div className="card" key={q.id}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="card-title">Q{i + 1}. {q.prompt}</div>
                <div className="card-sub" style={{ marginTop: 6 }}>{q.explanation}</div>
              </div>
              <div className="chip chip-accent mono">
                {q.answer}{q.unit}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <div className="note">Which exhibits mattered</div>
      </div>
      <div className="grid" style={{ gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))' }}>
        {scenario.exhibits.map((e) => {
          const needed = scenario.relevantExhibitIds.includes(e.id);
          return (
            <div className="card" key={e.id} data-needed={needed || undefined}>
              <div className="row-between">
                <ExhibitHeader exhibit={e} />
                <span className={needed ? 'chip chip-good' : 'chip'}>
                  {needed ? 'Needed' : 'Decoy'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <div className="note">Rapid-fire cases</div>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        {scenario.cases.map((c, i) => (
          <div className="card" key={c.id}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="card-title">Case {i + 1}. {c.prompt}</div>
                <div className="card-sub" style={{ marginTop: 6 }}>{c.explanation}</div>
              </div>
              <div className="chip chip-accent mono">{c.answer}{c.unit}</div>
            </div>
            <details style={{ marginTop: 12 }}>
              <summary className="details-summary">Show exhibit</summary>
              <div style={{ marginTop: 10 }}>
                <ExhibitView exhibit={c.exhibit} height={170} />
              </div>
            </details>
          </div>
        ))}
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
