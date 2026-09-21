import type { Microbe, SitePublic } from '@solve/shared';

interface Props {
  microbe: Microbe;
  site: SitePublic;
  state?: 'neutral' | 'accepted' | 'rejected' | 'selected';
  onClick?: () => void;
  compact?: boolean;
  disabled?: boolean;
  badge?: string;
}

/** One candidate culture: its three attribute values and its trait flags. */
export function MicrobeCard({ microbe, site, state = 'neutral', onClick, compact, disabled, badge }: Props) {
  const carriesForbidden = microbe.traits[site.forbiddenTrait];
  const carriesDesirable = microbe.traits[site.desirableTrait];

  return (
    <button
      className="microbe-card"
      data-state={state}
      data-compact={compact || undefined}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <div className="microbe-head">
        <span className="microbe-name">{microbe.name}</span>
        {badge && <span className="chip chip-accent">{badge}</span>}
      </div>

      <div className="microbe-attrs">
        {site.attributes.map((a) => (
          <div className="microbe-attr" key={a.key}>
            <span className="microbe-attr-label">{a.label}</span>
            <span className="microbe-attr-value mono">{microbe.attrs[a.key]}</span>
          </div>
        ))}
      </div>

      <div className="microbe-traits">
        {site.traits.map((t) => {
          const has = microbe.traits[t.key];
          if (!has) return null;
          const role =
            t.key === site.desirableTrait ? 'good' : t.key === site.forbiddenTrait ? 'bad' : 'plain';
          return (
            <span key={t.key} className={`trait-tag trait-${role}`}>
              {t.label}
            </span>
          );
        })}
        {!site.traits.some((t) => microbe.traits[t.key]) && (
          <span className="trait-tag trait-none">No traits</span>
        )}
      </div>

      {(carriesForbidden || carriesDesirable) && !compact && (
        <div className="microbe-flag" data-tone={carriesForbidden ? 'bad' : 'good'}>
          {carriesForbidden ? 'Carries the disqualifying trait' : 'Carries the required trait'}
        </div>
      )}
    </button>
  );
}
