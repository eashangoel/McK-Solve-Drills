import { useState } from 'react';

interface Props {
  prompt: string;
  note: string;
  items: { id: string; text: string }[];
  order: string[];
  onReorder: (order: string[]) => void;
  onDone: () => void;
}

/**
 * The opening prioritisation task. Draggable, with keyboard-accessible move
 * controls so the task never depends on a pointer.
 */
export function Ranking({ prompt, note, items, order, onReorder, onDone }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const byId = new Map(items.map((i) => [i.id, i]));
  const list = order.length ? order : items.map((i) => i.id);

  const move = (id: string, delta: number) => {
    const idx = list.indexOf(id);
    const next = idx + delta;
    if (next < 0 || next >= list.length) return;
    const copy = [...list];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    onReorder(copy);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const copy = list.filter((x) => x !== dragId);
    copy.splice(copy.indexOf(targetId), 0, dragId);
    onReorder(copy);
    setDragId(null);
    setOverId(null);
  };

  return (
    <div className="fade-in rank-wrap">
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>{prompt}</h2>
        <div className="note">{note}</div>
      </div>

      <ol className="rank-list">
        {list.map((id, i) => {
          const item = byId.get(id);
          if (!item) return null;
          return (
            <li
              key={id}
              className="rank-item"
              draggable
              data-dragging={dragId === id || undefined}
              data-over={overId === id && dragId !== id ? true : undefined}
              onDragStart={() => setDragId(id)}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                dropOn(id);
              }}
            >
              <span className="rank-number mono">{i + 1}</span>
              <span className="rank-text">{item.text}</span>
              <span className="rank-controls">
                <button
                  className="rank-btn"
                  onClick={() => move(id, -1)}
                  disabled={i === 0}
                  aria-label={`Move "${item.text}" up`}
                  type="button"
                >
                  ↑
                </button>
                <button
                  className="rank-btn"
                  onClick={() => move(id, 1)}
                  disabled={i === list.length - 1}
                  aria-label={`Move "${item.text}" down`}
                  type="button"
                >
                  ↓
                </button>
              </span>
              <span className="rank-grip" aria-hidden="true">⠿</span>
            </li>
          );
        })}
      </ol>

      <div className="stage-foot">
        <div className="note">Drag to reorder, or use the arrows. Top of the list is highest priority.</div>
        <button className="btn btn-primary btn-lg" onClick={onDone}>
          Lock in priorities →
        </button>
      </div>
    </div>
  );
}
