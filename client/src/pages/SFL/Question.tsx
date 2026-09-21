interface Props {
  index: number;
  total: number;
  phase: 1 | 2 | 3;
  situation: string;
  prompt: string;
  options: { id: string; text: string }[];
  chosen: string | null;
  onChoose: (id: string) => void;
  onNext: () => void;
  isLast: boolean;
}

const PHASE_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Getting oriented',
  2: 'Complications',
  3: 'Under pressure',
};

/** One situational-judgement question. Information arrives as you go. */
export function Question({
  index,
  total,
  phase,
  situation,
  prompt,
  options,
  chosen,
  onChoose,
  onNext,
  isLast,
}: Props) {
  return (
    <div className="fade-in sfl-question">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <span className="chip chip-accent">{PHASE_LABEL[phase]}</span>
        <span className="note">Question {index} of {total}</span>
      </div>

      <div className="situation-card">
        <p>{situation}</p>
      </div>

      <div className="question-prompt" style={{ margin: '20px 0 14px', fontSize: '1.05rem' }}>
        {prompt}
      </div>

      <div className="option-list">
        {options.map((o) => (
          <button
            key={o.id}
            className="option"
            aria-pressed={chosen === o.id}
            onClick={() => onChoose(o.id)}
            type="button"
          >
            <span className="option-mark" />
            <span>{o.text}</span>
          </button>
        ))}
      </div>

      <div className="stage-foot">
        <div className="note">
          {chosen ? 'You can change this before moving on.' : 'Choose the strongest next action.'}
        </div>
        <button className="btn btn-primary btn-lg" onClick={onNext} disabled={!chosen}>
          {isLast ? 'Submit' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
