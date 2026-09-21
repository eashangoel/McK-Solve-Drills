import type { SitePublic } from '@solve/shared';

/** Always-visible reminder of what the site demands. */
export function SiteRequirements({ site }: { site: SitePublic }) {
  const label = (k: string) => site.traits.find((t) => t.key === k)?.label ?? k;

  return (
    <div className="requirements">
      {site.attributes.map((a) => (
        <div className="req" key={a.key}>
          <div className="req-label">{a.label}</div>
          <div className="req-value mono">
            {site.ranges[a.key].min} – {site.ranges[a.key].max}
          </div>
          <div className="req-note">trio average</div>
        </div>
      ))}
      <div className="req" data-tone="good">
        <div className="req-label">Required trait</div>
        <div className="req-value">{label(site.desirableTrait)}</div>
        <div className="req-note">at least one culture</div>
      </div>
      <div className="req" data-tone="bad">
        <div className="req-label">Disqualifying trait</div>
        <div className="req-value">{label(site.forbiddenTrait)}</div>
        <div className="req-note">none may carry it</div>
      </div>
    </div>
  );
}
