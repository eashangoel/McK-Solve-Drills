import { SEAWOLF, type SitePublic } from '@solve/shared';
import { MicrobeCard } from './MicrobeCard.js';

interface Props {
  site: SitePublic;
  shortlist: string[];
  trio: string[];
  onToggle: (id: string) => void;
  onDone: () => void;
  isLastSite: boolean;
}

/**
 * Step 4. Commit three cultures. The tray shows each candidate's raw values
 * beside the target bands but computes nothing — working the average out is
 * the skill being practised.
 */
export function FinalTrio({ site, shortlist, trio, onToggle, onDone, isLastSite }: Props) {
  const pool = site.candidates.filter((m) => shortlist.includes(m.id));
  const chosen = site.candidates.filter((m) => trio.includes(m.id));
  const full = trio.length >= SEAWOLF.finalTeam;
  const label = (k: string) => site.traits.find((t) => t.key === k)?.label ?? k;

  return (
    <div className="fade-in">
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>Final treatment</h2>
        <div className="note">
          {trio.length} of {SEAWOLF.finalTeam} committed.
        </div>
      </div>

      <div className="trio-layout">
        <div className="microbe-grid" data-cols="2">
          {pool.map((m) => (
            <MicrobeCard
              key={m.id}
              microbe={m}
              site={site}
              state={trio.includes(m.id) ? 'selected' : 'neutral'}
              disabled={!trio.includes(m.id) && full}
              onClick={() => onToggle(m.id)}
            />
          ))}
        </div>

        <aside className="trio-tray">
          <div className="journal-head">
            <span className="stat-label">Working tray</span>
            <span className="chip">{trio.length}/{SEAWOLF.finalTeam}</span>
          </div>

          <div className="table-wrap" style={{ borderRadius: 12 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Attribute</th>
                  {[0, 1, 2].map((i) => (
                    <th key={i} className="num">{chosen[i] ? `#${i + 1}` : '—'}</th>
                  ))}
                  <th className="num">Target</th>
                </tr>
              </thead>
              <tbody>
                {site.attributes.map((a) => (
                  <tr key={a.key}>
                    <td>{a.label}</td>
                    {[0, 1, 2].map((i) => (
                      <td key={i} className="num">
                        {chosen[i] ? chosen[i].attrs[a.key] : '·'}
                      </td>
                    ))}
                    <td className="num" style={{ color: 'var(--accent)' }}>
                      {site.ranges[a.key].min}–{site.ranges[a.key].max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tray-checks">
            <div className="tray-check">
              <span>Required trait</span>
              <span className="mono">
                {chosen.some((m) => m.traits[site.desirableTrait]) ? 'present' : 'absent'} ·{' '}
                {label(site.desirableTrait)}
              </span>
            </div>
            <div className="tray-check">
              <span>Disqualifying trait</span>
              <span className="mono">
                {chosen.some((m) => m.traits[site.forbiddenTrait]) ? 'PRESENT' : 'clear'} ·{' '}
                {label(site.forbiddenTrait)}
              </span>
            </div>
          </div>

          <div className="tray-hint">
            Averages are yours to work out. The tray reports raw values only.
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={onDone}
            disabled={!full}
          >
            {isLastSite ? 'Submit programme' : 'Commit and go to next site →'}
          </button>
        </aside>
      </div>
    </div>
  );
}
