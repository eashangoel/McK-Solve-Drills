interface Props {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'good' | 'warn' | 'bad' | 'muted' | 'accent';
}

/** Single headline number with a caption. */
export function Stat({ label, value, hint, tone = 'muted' }: Props) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" data-tone={tone}>{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
