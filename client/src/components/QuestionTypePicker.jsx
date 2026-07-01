import { useState } from 'react';
import { QUESTION_TYPES } from '../lib/questionTypes.js';
import './QuestionTypePicker.css';

export default function QuestionTypePicker({ onPick }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="type-picker">
      <button type="button" className="btn btn-primary" onClick={() => setOpen((o) => !o)}>
        + Add question
      </button>
      {open && (
        <>
          <button type="button" className="type-picker-backdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="type-picker-menu card">
            {QUESTION_TYPES.map((q) => (
              <button
                key={q.type}
                type="button"
                className="type-picker-item"
                onClick={() => {
                  onPick(q.type);
                  setOpen(false);
                }}
              >
                <span className="tag-mono type-picker-tag">{q.tag}</span>
                <span className="type-picker-text">
                  <span className="type-picker-label">{q.label}</span>
                  <span className="muted type-picker-hint">{q.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
