import { useNavigate } from 'react-router-dom';
import type { SessionScores, SeaWolfScenario, SeaWolfAnswers, Site } from '@solve/shared';
import { evaluateTrio } from '@solve/shared';
import { ScoreRing } from '../../components/ScoreRing.js';
import { scoreTone } from '../../lib/format.js';

interface Props {
  result: SessionScores & { scenario: unknown };
  answers: SeaWolfAnswers;
  onAgain?: () => void;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

function label(site: Site, key: string): string {
  if (key.startsWith('trait:')) {
    const t = key.slice(6);
    return site.traits.find((x) => x.key === t)?.label ?? t;
  }
  return site.attributes.find((a) => a.key === key)?.label ?? key;
}

/** Post-run review: your actual trio evaluated against every constraint, plus a worked example. */
export function Results({ result, answers, onAgain }: Props) {
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

          const siteAns = answers.sites?.[site.id];
          const yourTrio = site.candidates.filter((m) => siteAns?.trio?.includes(m.id));
          const checks = yourTrio.length ? evaluateTrio(site, yourTrio) : [];
          const yourBinding = new Set(siteAns?.priorities ?? []);
          const trueBinding = new Set(site.bindingKeys);

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

              {yourTrio.length === 3 ? (
                <div className="your-trio">
                  <div className="stat-label" style={{ marginBottom: 8 }}>Your treatment trio</div>
                  <div className="table-wrap" style={{ borderRadius: 12 }}>
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Culture</th>
                          {site.attributes.map((a) => (
                            <th key={a.key} className="num">{a.label}</th>
                          ))}
                          <th>Traits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yourTrio.map((m) => (
                          <tr key={m.id}>
                            <td style={{ fontStyle: 'italic' }}>{m.name}</td>
                            {site.attributes.map((a) => (
                              <td key={a.key} className="num">{m.attrs[a.key]}</td>
                            ))}
                            <td>
                              {site.traits.filter((t) => m.traits[t.key]).map((t) => t.label).join(', ') || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="constraint-checks">
                    {checks.map((c) => (
                      <div className="constraint-check" key={c.key} data-met={c.met}>
                        <span className="constraint-check-mark">{c.met ? '✓' : '✗'}</span>
                        <span className="constraint-check-label">{label(site, c.key)}</span>
                        <span className="constraint-check-detail mono">{c.detail}</span>
                      </div>
                    ))}
                  </div>

                  <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
                    <span className="stat-label" style={{ marginRight: 2 }}>You prioritised</span>
                    {[...yourBinding].map((k) => (
                      <span
                        key={k}
                        className={`chip ${trueBinding.has(k) ? 'chip-good' : ''}`}
                      >
                        {label(site, k)}
                      </span>
                    ))}
                    {[...trueBinding].filter((k) => !yourBinding.has(k)).length > 0 && (
                      <>
                        <span className="stat-label" style={{ margin: '0 2px' }}>· actually binding</span>
                        {[...trueBinding]
                          .filter((k) => !yourBinding.has(k))
                          .map((k) => (
                            <span key={k} className="chip chip-warn">{label(site, k)}</span>
                          ))}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="banner" data-tone="bad" style={{ marginTop: 12 }}>
                  No treatment trio was submitted for this site.
                </div>
              )}

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
                            avg {round1(avg)} in {site.ranges[a.key].min}–
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
        {onAgain ? (
          <button className="btn btn-primary btn-lg" onClick={onAgain}>
            Run it again
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={() => nav('/play/seawolf')}>
            Practice again
          </button>
        )}
      </div>
    </div>
  );
}
