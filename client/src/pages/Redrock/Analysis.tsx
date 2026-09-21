import { useState } from 'react';
import type { Exhibit } from '@solve/shared';
import { ExhibitView, ExhibitHeader } from '../../components/ExhibitView.js';

interface Question {
  id: string;
  prompt: string;
  unit: string;
  decimals: number;
}

interface Props {
  questions: Question[];
  journalExhibits: Exhibit[];
  values: Record<string, number | null>;
  onChange: (id: string, value: number | null) => void;
  onDone: () => void;
}

/**
 * Stage 2. Quantitative questions answerable only from the journal. The
 * journal sits alongside the questions; nothing else is reachable.
 */
export function Analysis({ questions, journalExhibits, values, onChange, onDone }: Props) {
  const [focus, setFocus] = useState<string | null>(journalExhibits[0]?.id ?? null);
  const answered = questions.filter((q) => values[q.id] != null).length;
  const shown = journalExhibits.find((e) => e.id === focus) ?? journalExhibits[0];

  return (
    <div className="fade-in analysis-split">
      <section>
        <div className="section-head" style={{ marginTop: 0 }}>
          <h2>Analysis</h2>
          <div className="note">{answered} of {questions.length} answered</div>
        </div>

        <div className="grid" style={{ gap: 12 }}>
          {questions.map((q, i) => (
            <div className="card question-card" key={q.id}>
              <div className="question-index">Q{i + 1}</div>
              <div className="question-prompt">{q.prompt}</div>
              <div className="answer-row">
                <input
                  className="answer-input mono"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="—"
                  value={values[q.id] ?? ''}
                  onChange={(ev) => {
                    const raw = ev.target.value;
                    onChange(q.id, raw === '' ? null : Number(raw));
                  }}
                />
                {q.unit && <span className="answer-unit">{q.unit}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="stage-foot">
          <div className="note">The report stage locks these answers.</div>
          <button className="btn btn-primary btn-lg" onClick={onDone}>
            Continue to Report →
          </button>
        </div>
      </section>

      <aside className="journal-pane">
        <div className="journal-head">
          <span className="stat-label">Research journal</span>
          <span className="chip">{journalExhibits.length}</span>
        </div>
        {journalExhibits.length === 0 ? (
          <div className="empty" style={{ padding: 24 }}>
            <h3>Journal is empty</h3>
            <p>You added no exhibits during Investigation.</p>
          </div>
        ) : (
          <>
            <div className="journal-tabs">
              {journalExhibits.map((e) => (
                <button
                  key={e.id}
                  className="journal-tab"
                  aria-pressed={shown?.id === e.id}
                  onClick={() => setFocus(e.id)}
                >
                  {e.title}
                </button>
              ))}
            </div>
            {shown && (
              <div className="card" style={{ padding: 16 }}>
                <ExhibitHeader exhibit={shown} />
                <ExhibitView exhibit={shown} height={200} />
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
