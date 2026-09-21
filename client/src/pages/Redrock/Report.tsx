import type { RedrockScenarioPublic } from '@solve/shared';

type ReportPublic = RedrockScenarioPublic['report'];

interface Props {
  report: ReportPublic;
  analysisValues: Record<string, number | null>;
  optionId: string | null;
  blanks: Record<string, number | null>;
  chartId: string | null;
  onOption: (id: string) => void;
  onBlank: (id: string, value: number | null) => void;
  onChart: (id: string) => void;
  onDone: () => void;
}

/**
 * Stage 3. The recommendation is graded against the candidate's own analysis
 * figures, so an earlier arithmetic slip carries forward rather than being
 * punished twice.
 */
export function Report({
  report,
  analysisValues,
  optionId,
  blanks,
  chartId,
  onOption,
  onBlank,
  onChart,
  onDone,
}: Props) {
  const parts = report.sentence.split(/(\{\{\w+\}\})/g);
  const chosen = report.options.find((o) => o.id === optionId);
  const complete = optionId != null && chartId != null && report.blanks.every((b) => blanks[b.id] != null);

  return (
    <div className="fade-in report-wrap">
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>Report</h2>
        <div className="note">{report.preamble}</div>
      </div>

      <div className="card">
        <div className="card-title">Recommendation</div>
        <div className="card-sub" style={{ marginBottom: 14 }}>
          Choose the course of action your figures support.
        </div>
        <div className="option-list">
          {report.options.map((o) => (
            <button
              key={o.id}
              className="option"
              aria-pressed={optionId === o.id}
              onClick={() => onOption(o.id)}
            >
              <span className="option-mark" />
              <span>We recommend {o.text}.</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Complete the summary</div>
        <div className="card-sub" style={{ marginBottom: 16 }}>
          Fill the blanks with the figures you calculated.
        </div>

        <p className="report-sentence">
          {parts.map((part, i) => {
            const m = part.match(/^\{\{(\w+)\}\}$/);
            if (!m) return <span key={i}>{part}</span>;
            const key = m[1];
            if (key === 'option') {
              return (
                <span key={i} className={chosen ? 'slot slot-filled' : 'slot slot-empty'}>
                  {chosen ? chosen.text : 'select a recommendation'}
                </span>
              );
            }
            if (key === 'threshold') {
              return (
                <span key={i} className="slot slot-fixed mono">
                  {report.threshold}
                </span>
              );
            }
            const blank = report.blanks.find((b) => b.id === key);
            if (!blank) return <span key={i}>{part}</span>;
            return (
              <input
                key={i}
                className="slot-input mono"
                type="number"
                step="any"
                inputMode="decimal"
                placeholder={blank.label}
                title={blank.label}
                value={blanks[key] ?? ''}
                onChange={(ev) => onBlank(key, ev.target.value === '' ? null : Number(ev.target.value))}
              />
            );
          })}
        </p>

        <div className="carry-hint">
          Your analysis figures:{' '}
          {report.blanks.map((b) => {
            const v = analysisValues[b.fromQuestionId];
            return (
              <span key={b.id} className="chip" style={{ marginRight: 6 }}>
                {b.label}: <span className="mono">{v ?? '—'}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Supporting exhibit</div>
        <div className="card-sub" style={{ marginBottom: 14 }}>
          Which visual best evidences the recommendation?
        </div>
        <div className="option-list">
          {report.chartChoices.map((c) => (
            <button
              key={c.id}
              className="option"
              aria-pressed={chartId === c.id}
              onClick={() => onChart(c.id)}
            >
              <span className="option-mark" />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stage-foot">
        <div className="note">{complete ? 'Ready to submit.' : 'Complete every field to continue.'}</div>
        <button className="btn btn-primary btn-lg" onClick={onDone}>
          Continue to Cases →
        </button>
      </div>
    </div>
  );
}
