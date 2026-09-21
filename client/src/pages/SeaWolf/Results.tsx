import { useNavigate } from 'react-router-dom';
import type { SessionScores, SeaWolfScenario } from '@solve/shared';
import { ScoreRing } from '../../components/ScoreRing.js';
import { scoreTone } from '../../lib/format.js';

interface Props {
  result: SessionScores & { scenario: unknown };
  onAgain: () => void;
}

/** Post-run review: which constraints were missed, and a trio that would have worked. */
export function Results({ result, onAgain }: Props) {
  const nav = useNavigate();
  const scenario = result.scenario as SeaWolfScenario;
  const notes = result.breakdown?.notes ?? [];

  return (
    <div className="fade-in" data-accent="tide">
      <div className="page-head">
        <div className="eyebrow">Sea Wolf complete</div>
        <h1>{scenario.title}</h1>
      </div>

      <div className="results-rings">
        <div className="card results-ring-card">
          <ScoreRing value={result.productScore} label="Product" size={118} />
          <div>
            <div className="card-title">Product score</div>
            <div className="card-sub">Mean of the three sites, 20 points per constraint met.</div>
          </div>
        </div>
        <div className="card results-ring-card">
          <ScoreRing value={result.processScore} label="Process" size={118} />
          <div>
            <div className="card-title">Process score</div>
            <div className="card-sub">Pacing, decisiveness, revisions and screening discipline.</div>
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
        <h2>Site by site</h2>
      </div>

      <div className="grid" style={{ gap: 12 }}>
        {scenario.sites.map((site) => {
          const note = notes.find((n) => n.label === site.name);
          const pct = note ? (note.earned / Math.max(note.possible, 1)) * 100 : 0;
          const example = site.candidates.filter((m) => site.exampleTrio.includes(m.id));
          const traitLabel = (k: string) => site.traits.find((t) => t.key === k)?.label ?? k;

          return (
            <div className="card" key={site.id}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="card-title">{site.name}</div>
                  <div className="card-sub">{site.setting}</div>
                </div>
                <span className={`chip chip-${scoreTone(pct)}`}>
                  {note?.earned ?? 0} / {note?.possible ?? 5} constraints
                </span>
              </div>

              <div className="card-sub" style={{ marginTop: 12 }}>{note?.detail}</div>

              <details style={{ marginTop: 14 }}>
                <summary className="details-summary">
                  Show a trio that would have scored 100
                </summary>
                <div className="worked-trio">
                  {example.map((m) => (
                    <div className="worked-microbe" key={m.id}>
                      <div className="worked-name">{m.name}</div>
                      <div className="worked-attrs mono">
                        {site.attributes.map((a) => (
                          <span key={a.key}>
                            {a.label.split(' ')[0]} {m.attrs[a.key]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="worked-averages">
                    {site.attributes.map((a) => {
                      const avg =
                        example.reduce((s, m) => s + m.attrs[a.key], 0) / Math.max(example.length, 1);
                      return (
                        <div key={a.key} className="worked-avg">
                          <span>{a.label}</span>
                          <span className="mono">
                            avg {Math.round(avg * 10) / 10} in {site.ranges[a.key].min}–
                            {site.ranges[a.key].max}
                          </span>
                        </div>
                      );
                    })}
                    <div className="worked-avg">
                      <span>Required · {traitLabel(site.desirableTrait)}</span>
                      <span className="mono">carried</span>
                    </div>
                    <div className="worked-avg">
                      <span>Disqualifying · {traitLabel(site.forbiddenTrait)}</span>
                      <span className="mono">excluded</span>
                    </div>
                  </div>
                  <div className="tray-hint">
                    {site.validTrioCount} of the 220 possible trios satisfied every constraint here.
                  </div>
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
