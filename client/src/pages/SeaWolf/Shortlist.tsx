import { SEAWOLF, type SitePublic } from '@solve/shared';
import { MicrobeCard } from './MicrobeCard.js';
import { SiteRequirements } from './SiteRequirements.js';

interface Props {
  site: SitePublic;
  accepted: string[];
  shortlist: string[];
  onToggle: (id: string) => void;
  onDone: () => void;
}

/** Step 3. Narrow the accepted cultures to a prospect pool. */
export function Shortlist({ site, accepted, shortlist, onToggle, onDone }: Props) {
  const pool = site.candidates.filter((m) => accepted.includes(m.id));
  const set = new Set(shortlist);
  const cap = Math.min(SEAWOLF.prospectPool, pool.length);
  const full = shortlist.length >= cap;

  return (
    <div className="fade-in">
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>Prospect pool</h2>
        <div className="note">
          {shortlist.length} of {cap} selected from the {pool.length} you kept.
        </div>
      </div>

      <SiteRequirements site={site} />

      <div className="microbe-grid">
        {pool.map((m) => (
          <MicrobeCard
            key={m.id}
            microbe={m}
            site={site}
            state={set.has(m.id) ? 'selected' : 'neutral'}
            disabled={!set.has(m.id) && full}
            onClick={() => onToggle(m.id)}
          />
        ))}
      </div>

      <div className="stage-foot">
        <div className="note">Only the pool carries forward to the final treatment.</div>
        <button
          className="btn btn-primary btn-lg"
          onClick={onDone}
          disabled={shortlist.length < SEAWOLF.finalTeam}
        >
          Choose the trio →
        </button>
      </div>
    </div>
  );
}
