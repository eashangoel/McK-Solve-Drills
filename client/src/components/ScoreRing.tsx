import { scoreTone } from '../lib/format.js';

interface Props {
  value: number | null;
  size?: number;
  label?: string;
  thickness?: number;
}

/** Circular score gauge used on results screens and the dashboard. */
export function ScoreRing({ value, size = 96, label, thickness = 8 }: Props) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  const tone = scoreTone(value);

  return (
    <div className="score-ring" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={`${label ?? 'Score'}: ${value == null ? 'none' : Math.round(value)} out of 100`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--bg-3)" strokeWidth={thickness}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`var(--${tone === 'muted' ? 'ink-3' : tone})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 700ms var(--ease)' }}
        />
      </svg>
      <div className="score-ring-inner">
        <div className="score-ring-value num" style={{ fontSize: size * 0.26 }}>
          {value == null ? '—' : Math.round(value)}
        </div>
        {label && <div className="score-ring-label">{label}</div>}
      </div>
    </div>
  );
}
