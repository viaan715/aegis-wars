import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import { CREDIT_COSTS } from '../lib/credits.js';
import { CHOICE_TYPES, questionMeta } from '../lib/questionTypes.js';
import './QuestionEditorCard.css';

export default function QuestionEditorCard({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  onDuplicate,
  dragHandleProps,
}) {
  const { token, refreshUser } = useAuth();
  const meta = questionMeta(question.type);
  const isChoice = CHOICE_TYPES.has(question.type);
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState('');

  function update(patch) {
    onChange({ ...question, ...patch });
  }

  async function handleImprove() {
    if (!question.label.trim() || improving) return;
    setImproving(true);
    setImproveError('');
    try {
      const result = await api.improveQuestionWithAi(token, question);
      update({ label: result.label, description: result.description });
      await refreshUser();
    } catch (err) {
      setImproveError(err instanceof ApiError ? err.message : 'Could not improve this question');
    } finally {
      setImproving(false);
    }
  }

  function updateOption(i, value) {
    const options = [...question.options];
    options[i] = value;
    update({ options });
  }

  function addOption() {
    update({ options: [...question.options, `Option ${question.options.length + 1}`] });
  }

  function removeOption(i) {
    update({ options: question.options.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="card question-card" {...dragHandleProps}>
      <div className="question-card-top">
        <span className="tag-mono question-type-tag">{meta?.tag ?? question.type}</span>
        <span className="question-card-index tag-mono">
          {index + 1} / {total}
        </span>
        <div className="question-card-move">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
            ↑
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move down"
          >
            ↓
          </button>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleImprove}
          disabled={improving || !question.label.trim()}
          title={`Costs ${CREDIT_COSTS.improveQuestion} credit`}
        >
          {improving ? 'Improving…' : 'Improve with AI'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" className="btn btn-ghost btn-sm question-card-remove" onClick={onRemove}>
          Remove
        </button>
      </div>

      <input
        className="input question-label-input"
        placeholder="Type your question"
        value={question.label}
        onChange={(e) => update({ label: e.target.value })}
      />
      {improveError && <p className="error-text question-improve-error">{improveError}</p>}
      <input
        className="input question-desc-input"
        placeholder="Description (optional)"
        value={question.description}
        onChange={(e) => update({ description: e.target.value })}
      />

      {isChoice && (
        <div className="option-list">
          {question.options.map((opt, i) => (
            <div key={i} className="option-row">
              <input className="input" value={opt} onChange={(e) => updateOption(i, e.target.value)} />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeOption(i)}
                disabled={question.options.length <= 1}
                aria-label="Remove option"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addOption}>
            + Add option
          </button>
        </div>
      )}

      {question.type === 'rating' && <p className="hint-text">Respondents pick a rating from 1 to 5.</p>}
      {question.type === 'scale' && <p className="hint-text">Respondents pick a number from 0 to 10.</p>}
      {question.type === 'file_upload' && <p className="hint-text">Respondents attach one file, up to 10MB.</p>}

      <label className="required-toggle">
        <input type="checkbox" checked={question.required} onChange={(e) => update({ required: e.target.checked })} />
        Required
      </label>
    </div>
  );
}
