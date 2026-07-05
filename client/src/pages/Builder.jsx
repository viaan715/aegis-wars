import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import { blankQuestion } from '../lib/questionTypes.js';
import AppNav from '../components/AppNav.jsx';
import QuestionEditorCard from '../components/QuestionEditorCard.jsx';
import QuestionTypePicker from '../components/QuestionTypePicker.jsx';
import FillFormView from '../components/FillFormView.jsx';
import { useRandomTextColors } from '../lib/randomTextColors.js';
import './Builder.css';

const THEME_SWATCHES = ['#c99a46', '#4a6c8c', '#3f7d5c', '#8a5cf5', '#d9534f', '#1b1e24'];

const SAVE_LABEL = {
  idle: '',
  unsaved: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'All changes saved',
  error: 'Could not save',
};

export default function Builder() {
  const { id } = useParams();
  const { token } = useAuth();

  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [publishError, setPublishError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const saveTimer = useRef(null);
  const savingRef = useRef(false);
  const skipNextAutosave = useRef(true);
  const rootRef = useRandomTextColors();

  useEffect(() => {
    api
      .getForm(token, id)
      .then((data) => {
        setMeta(data.form);
        setQuestions(data.questions);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load this form'));
  }, [token, id]);

  const persist = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaveStatus('saving');
    try {
      await api.updateForm(token, id, {
        title: meta.title,
        description: meta.description,
        layout: meta.layout,
        themeColor: meta.themeColor,
        thankYouTitle: meta.thankYouTitle,
        thankYouMessage: meta.thankYouMessage,
        questions,
      });
      // Local state is already the source of truth for what was just saved —
      // avoid overwriting it with the response, which could clobber edits
      // made while this request was in flight.
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    } finally {
      savingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id, meta, questions]);

  useEffect(() => {
    if (!meta) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    setSaveStatus('unsaved');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persist();
    }, 1200);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.title, meta?.description, meta?.layout, meta?.themeColor, meta?.thankYouTitle, meta?.thankYouMessage, questions]);

  useEffect(() => {
    if (saveStatus !== 'unsaved' && saveStatus !== 'saving') return;
    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  function updateMeta(patch) {
    setMeta((prev) => ({ ...prev, ...patch }));
  }

  function addQuestion(type) {
    setQuestions((prev) => [...prev, blankQuestion(type)]);
  }

  function updateQuestion(index, updated) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  }

  function removeQuestion(index) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function duplicateQuestion(index) {
    setQuestions((prev) => {
      const copy = { ...prev[index], id: `new-${Math.random().toString(36).slice(2, 10)}` };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }

  function moveQuestion(index, direction) {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function reorderTo(targetIndex) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setQuestions((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  }

  async function handlePublishToggle() {
    setPublishError('');
    clearTimeout(saveTimer.current);
    if (saveStatus === 'unsaved' || saveStatus === 'error') {
      await persist();
    }
    try {
      const data = meta.status === 'published' ? await api.unpublishForm(token, id) : await api.publishForm(token, id);
      setMeta((prev) => ({ ...prev, ...data.form }));
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : 'Could not update publish state');
    }
  }

  if (loadError) {
    return (
      <div className="app-shell" ref={rootRef}>
        <AppNav />
        <main className="container builder-error">
          <p className="error-text">{loadError}</p>
          <Link to="/dashboard" className="btn btn-secondary">
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (!meta) return null;

  const shareUrl = `${window.location.origin}/f/${meta.slug}`;

  return (
    <div className="app-shell" ref={rootRef}>
      <AppNav
        actions={
          <>
            <span className="save-status muted">{SAVE_LABEL[saveStatus]}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPreview(true)}>
              Preview
            </button>
            <Link to={`/forms/${id}/responses`} className="btn btn-ghost btn-sm">
              Results
            </Link>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePublishToggle}>
              {meta.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </>
        }
      />

      <main className="container builder">
        {meta.status === 'published' && (
          <div className="card share-banner">
            <span className="tag-mono">LIVE</span>
            <a href={shareUrl} target="_blank" rel="noreferrer" className="share-link">
              {shareUrl}
            </a>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              Copy
            </button>
          </div>
        )}
        {publishError && <p className="error-text">{publishError}</p>}

        <div className="builder-layout">
          <div className="builder-main">
            <div className="card builder-meta">
              <input
                className="input builder-title-input"
                value={meta.title}
                onChange={(e) => updateMeta({ title: e.target.value })}
                placeholder="Untitled form"
              />
              <textarea
                className="textarea builder-desc-input"
                value={meta.description}
                onChange={(e) => updateMeta({ description: e.target.value })}
                placeholder="Add a description respondents will see (optional)"
              />
            </div>

            {questions.map((q, index) => (
              <div
                key={q.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorderTo(index)}
                className="drag-wrap"
              >
                <QuestionEditorCard
                  question={q}
                  index={index}
                  total={questions.length}
                  onChange={(updated) => updateQuestion(index, updated)}
                  onRemove={() => removeQuestion(index)}
                  onMove={(direction) => moveQuestion(index, direction)}
                  onDuplicate={() => duplicateQuestion(index)}
                />
              </div>
            ))}

            <QuestionTypePicker onPick={addQuestion} />
          </div>

          <aside className="builder-sidebar">
            <div className="card sidebar-card">
              <h2 className="sidebar-title">Fill experience</h2>
              <div className="layout-toggle">
                <button
                  type="button"
                  className={`layout-toggle-btn${meta.layout !== 'classic' ? ' is-active' : ''}`}
                  onClick={() => updateMeta({ layout: 'typeform' })}
                >
                  One at a time
                </button>
                <button
                  type="button"
                  className={`layout-toggle-btn${meta.layout === 'classic' ? ' is-active' : ''}`}
                  onClick={() => updateMeta({ layout: 'classic' })}
                >
                  All on one page
                </button>
              </div>
            </div>

            <div className="card sidebar-card">
              <h2 className="sidebar-title">Accent color</h2>
              <div className="swatch-row">
                {THEME_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`swatch${meta.themeColor === color ? ' is-active' : ''}`}
                    style={{ background: color }}
                    onClick={() => updateMeta({ themeColor: color })}
                    aria-label={color}
                  />
                ))}
                <input
                  type="color"
                  className="swatch-custom"
                  value={meta.themeColor}
                  onChange={(e) => updateMeta({ themeColor: e.target.value })}
                  aria-label="Custom color"
                />
              </div>
            </div>

            <div className="card sidebar-card">
              <h2 className="sidebar-title">Thank-you screen</h2>
              <div className="field">
                <input
                  className="input"
                  value={meta.thankYouTitle}
                  onChange={(e) => updateMeta({ thankYouTitle: e.target.value })}
                  placeholder="Thanks — that's recorded."
                />
              </div>
              <div className="field">
                <textarea
                  className="textarea"
                  rows={2}
                  value={meta.thankYouMessage}
                  onChange={(e) => updateMeta({ thankYouMessage: e.target.value })}
                  placeholder="Optional message shown after submitting (e.g. what happens next)"
                />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showPreview && (
        <div className="preview-overlay">
          <div className="preview-bar">
            <span className="tag-mono">PREVIEW</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPreview(false)}>
              Back to editor
            </button>
          </div>
          <div className="preview-frame">
            <FillFormView form={meta} questions={questions} mode="preview" />
          </div>
        </div>
      )}
    </div>
  );
}
