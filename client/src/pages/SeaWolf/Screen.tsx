import type { SitePublic } from '@solve/shared';
import { MicrobeCard } from './MicrobeCard.js';
import { SiteRequirements } from './SiteRequirements.js';

interface Props {
  site: SitePublic;
  accepted: string[];
  onToggle: (id: string) => void;
  onDone: () => void;
}

/** Step 2. Accept or reject every candidate culture. */
export function Screen({ site, accepted, onToggle, onDone }: Props) {
  const set = new Set(accepted);

  return (
    <div className="fade-in">
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>Screen the cultures</h2>
        <div className="note">
          {accepted.length} accepted · {site.candidates.length - accepted.length} set aside.
          Anything set aside is treated as rejected. Click a card to move it.
        </div>
      </div>

      <SiteRequirements site={site} />

      <div className="microbe-grid">
        {site.candidates.map((m) => (
          <MicrobeCard
            key={m.id}
            microbe={m}
            site={site}
            state={set.has(m.id) ? 'accepted' : 'rejected'}
            onClick={() => onToggle(m.id)}
          />
        ))}
      </div>

      <div className="stage-foot">
        <div className="note">
          Keep what could plausibly belong in a valid trio. Screening quality is tracked.
        </div>
        <button className="btn btn-primary btn-lg" onClick={onDone} disabled={accepted.length < 3}>
          Build prospect pool →
        </button>
      </div>
    </div>
  );
}
