import type { SitePublic } from '@solve/shared';
import { SEAWOLF } from '@solve/shared';

interface Props {
  site: SitePublic;
  siteIndex: number;
  selected: string[];
  onToggle: (key: string) => void;
  onDone: () => void;
}

/**
 * Step 1. Every constraint is visible; the judgement is which two will
 * actually bind. Graded against which two eliminate the most trios.
 */
export function Priorities({ site, siteIndex, selected, onToggle, onDone }: Props) {
  const full = selected.length >= SEAWOLF.characteristicsToPrioritize;

  const rows = [
    ...site.attributes.map((a) => ({
      key: a.key,
      label: a.label,
      blurb: `${a.blurb} The trio's average must land inside this band.`,
      detail: `${site.ranges[a.key].min} – ${site.ranges[a.key].max}`,
      role: 'range' as const,
    })),
    ...site.traits.map((t) => ({
      key: `trait:${t.key}`,
      label: t.label,
      blurb:
        t.key === site.desirableTrait
          ? 'At least one culture in the trio must carry this.'
          : t.key === site.forbiddenTrait
            ? 'No culture in the trio may carry this.'
            : 'No requirement attached at this site.',
      detail:
        t.key === site.desirableTrait
          ? 'Required'
          : t.key === site.forbiddenTrait
            ? 'Disqualifying'
            : 'Not constrained',
      role:
        t.key === site.desirableTrait
          ? ('required' as const)
          : t.key === site.forbiddenTrait
            ? ('forbidden' as const)
            : ('neutral' as const),
    })),
  ];

  return (
    <div className="fade-in">
      <div className="site-brief">
        <div className="site-eyebrow">Site {siteIndex + 1} of {SEAWOLF.sitesPerSession}</div>
        <h2>{site.name}</h2>
        <p className="brief-text">{site.brief}</p>
      </div>

      <div className="section-head">
        <h2>Which two constraints will bind?</h2>
        <div className="note">
          {selected.length} of {SEAWOLF.characteristicsToPrioritize} chosen. Pick the two you
          expect to eliminate the most candidates.
        </div>
      </div>

      <div className="char-grid">
        {rows.map((r) => {
          const on = selected.includes(r.key);
          return (
            <button
              key={r.key}
              className="char-card"
              data-role={r.role}
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => onToggle(r.key)}
              type="button"
            >
              <div className="char-head">
                <span className="char-label">{r.label}</span>
                <span className={`chip chip-${r.role === 'required' ? 'good' : r.role === 'forbidden' ? 'bad' : ''}`}>
                  {r.detail}
                </span>
              </div>
              <div className="char-blurb">{r.blurb}</div>
            </button>
          );
        })}
      </div>

      <div className="stage-foot">
        <div className="note">Your call here is scored separately from the treatment itself.</div>
        <button className="btn btn-primary btn-lg" onClick={onDone} disabled={!full}>
          Screen the cultures →
        </button>
      </div>
    </div>
  );
}
