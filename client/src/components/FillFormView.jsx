import { useMemo, useState } from 'react';
import TemperProgress from './TemperProgress.jsx';
import './FillFormView.css';

function QuestionField({ question, value, onChange }) {
  switch (question.type) {
    case 'short_text':
      return (
        <input
          className="fill-input"
          autoFocus
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
        />
      );
    case 'long_text':
      return (
        <textarea
          className="fill-input fill-textarea"
          autoFocus
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
        />
      );
    case 'number':
      return (
        <input
          className="fill-input"
          type="number"
          autoFocus
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
        />
      );
    case 'email':
      return (
        <input
          className="fill-input"
          type="email"
          autoFocus
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="you@example.com"
        />
      );
    case 'date':
      return <input className="fill-input" type="date" autoFocus value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'dropdown':
      return (
        <select className="fill-input" autoFocus value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            Choose one
          </option>
          {question.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case 'multiple_choice':
      return (
        <div className="fill-choice-list">
          {question.options.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`fill-choice${value === opt ? ' is-selected' : ''}`}
              onClick={() => onChange(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    case 'checkboxes': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="fill-choice-list">
          {question.options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                className={`fill-choice${isSelected ? ' is-selected' : ''}`}
                onClick={() => onChange(isSelected ? selected.filter((o) => o !== opt) : [...selected, opt])}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }
    case 'rating':
      return (
        <div className="fill-rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={`fill-star${Number(value) >= n ? ' is-filled' : ''}`}
              onClick={() => onChange(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
            >
              ★
            </button>
          ))}
        </div>
      );
    case 'scale':
      return (
        <div className="fill-scale">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              type="button"
              key={n}
              className={`fill-scale-item${Number(value) === n ? ' is-selected' : ''}`}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      );
    case 'file_upload':
      return (
        <input
          className="fill-input"
          type="file"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      );
    default:
      return null;
  }
}

function isAnswered(value) {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export default function FillFormView({ form, questions, mode = 'live', onSubmit, submitting, submitError }) {
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const accent = form.themeColor || '#c99a46';
  const isTypeform = form.layout !== 'classic';

  const currentQuestion = questions[index];
  const currentValue = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentValid = !currentQuestion || !currentQuestion.required || isAnswered(currentValue);

  const percent = useMemo(() => {
    if (questions.length === 0) return 0;
    return ((index + 1) / questions.length) * 100;
  }, [index, questions.length]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function goNext() {
    setTouched(true);
    if (!currentValid) return;
    setTouched(false);
    if (index < questions.length - 1) setIndex(index + 1);
    else handleSubmit();
  }

  function goBack() {
    setTouched(false);
    if (index > 0) setIndex(index - 1);
  }

  async function handleSubmit() {
    if (mode === 'preview') {
      setSubmitted(true);
      return;
    }
    const missing = questions.find((q) => q.required && !isAnswered(answers[q.id]));
    if (missing) return;
    try {
      await onSubmit(answers);
      setSubmitted(true);
    } catch {
      // onSubmit already recorded the error for display via submitError
    }
  }

  if (submitted) {
    return (
      <div className="fill-view" style={{ '--fill-accent': accent }}>
        <div className="fill-thanks">
          <h1 className="fill-thanks-title">Thanks — that's recorded.</h1>
          <p className="fill-thanks-sub">
            {mode === 'preview' ? 'This is what respondents see after submitting.' : 'You can close this tab now.'}
          </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fill-view" style={{ '--fill-accent': accent }}>
        <div className="fill-thanks">
          <h1 className="fill-thanks-title">No questions yet</h1>
          <p className="fill-thanks-sub">Add at least one question to preview or publish this form.</p>
        </div>
      </div>
    );
  }

  if (isTypeform) {
    return (
      <div className="fill-view" style={{ '--fill-accent': accent }}>
        <div className="fill-progress-bar">
          <TemperProgress percent={percent} />
        </div>
        <div className="fill-typeform">
          <div className="fill-typeform-inner" key={currentQuestion.id}>
            <p className="fill-counter">
              QUESTION {index + 1} OF {questions.length}
            </p>
            <h1 className="fill-question-label">
              {currentQuestion.label}
              {currentQuestion.required && <span className="fill-required-mark">*</span>}
            </h1>
            {currentQuestion.description && <p className="fill-question-desc">{currentQuestion.description}</p>}
            <div className="fill-field-wrap">
              <QuestionField question={currentQuestion} value={currentValue} onChange={(v) => setAnswer(currentQuestion.id, v)} />
            </div>
            {touched && !currentValid && <p className="fill-error">This question needs an answer.</p>}
            {submitError && index === questions.length - 1 && <p className="fill-error">{submitError}</p>}
            <div className="fill-nav">
              <button type="button" className="fill-btn-secondary" onClick={goBack} disabled={index === 0}>
                Back
              </button>
              <button type="button" className="fill-btn-primary" onClick={goNext} disabled={submitting}>
                {index === questions.length - 1 ? (submitting ? 'Submitting…' : 'Submit') : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fill-view" style={{ '--fill-accent': accent }}>
      <form
        className="fill-classic"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          handleSubmit();
        }}
      >
        <header className="fill-classic-header">
          <h1 className="fill-classic-title">{form.title}</h1>
          {form.description && <p className="fill-question-desc">{form.description}</p>}
        </header>
        {questions.map((q) => {
          const value = answers[q.id];
          const valid = !q.required || isAnswered(value);
          return (
            <div key={q.id} className="fill-classic-question">
              <h2 className="fill-question-label fill-question-label-sm">
                {q.label}
                {q.required && <span className="fill-required-mark">*</span>}
              </h2>
              {q.description && <p className="fill-question-desc">{q.description}</p>}
              <QuestionField question={q} value={value} onChange={(v) => setAnswer(q.id, v)} />
              {touched && !valid && <p className="fill-error">This question needs an answer.</p>}
            </div>
          );
        })}
        {submitError && <p className="fill-error">{submitError}</p>}
        <button type="submit" className="fill-btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
