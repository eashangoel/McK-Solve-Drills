import { useState } from 'react';
import type { RedrockScenarioPublic } from '@solve/shared';
import { ExhibitView, ExhibitHeader } from '../../components/ExhibitView.js';

type CasePublic = RedrockScenarioPublic['cases'][number];

interface Props {
  cases: CasePublic[];
  values: Record<string, number | null>;
  onChange: (id: string, value: number | null) => void;
  onDone: () => void;
}

/** Stage 4. Six independent rapid-fire questions, one exhibit each. */
export function Cases({ cases, values, onChange, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const c = cases[idx];
  const answered = cases.filter((q) => values[q.id] != null).length;
  const last = idx === cases.length - 1;

  if (!c) return null;

  return (
    <div className="fade-in">
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>Rapid-fire cases</h2>
        <div className="note">{answered} of {cases.length} answered</div>
      </div>

      <div className="case-progress">
        {cases.map((q, i) => (
          <button
            key={q.id}
            className="case-pip"
            data-state={values[q.id] != null ? 'done' : i === idx ? 'current' : 'todo'}
            onClick={() => setIdx(i)}
            aria-label={`Question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="card case-card">
        <div className="question-index">Case {idx + 1}</div>
        <div className="question-prompt" style={{ fontSize: '1.02rem' }}>{c.prompt}</div>

        <div className="case-exhibit">
          <ExhibitHeader exhibit={c.exhibit} />
          <ExhibitView exhibit={c.exhibit} height={190} />
        </div>

        {c.choices ? (
          <div className="option-list">
            {c.choices.map((ch) => (
              <button
                key={ch.id}
                className="option"
                aria-pressed={values[c.id] === ch.value}
                onClick={() => onChange(c.id, ch.value)}
              >
                <span className="option-mark" />
                <span className="mono">{ch.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="answer-row">
            <input
              className="answer-input mono"
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="—"
              value={values[c.id] ?? ''}
              onChange={(ev) => onChange(c.id, ev.target.value === '' ? null : Number(ev.target.value))}
            />
            {c.unit && <span className="answer-unit">{c.unit}</span>}
          </div>
        )}

        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn btn-ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
            ← Previous
          </button>
          <div className="spacer" />
          {last ? (
            <button className="btn btn-primary" onClick={onDone}>
              Submit study
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setIdx(idx + 1)}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
