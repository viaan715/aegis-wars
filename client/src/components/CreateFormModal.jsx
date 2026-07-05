import { useState } from 'react';
import { FORM_TEMPLATES } from '../lib/formTemplates.js';
import './CreateFormModal.css';

export default function CreateFormModal({ onClose, onPick, onGenerateAi, creating, aiCreditCost, createCreditCost }) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  async function handleGenerate(e) {
    e.preventDefault();
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setAiError('');
    try {
      await onGenerateAi(prompt.trim());
    } catch (err) {
      setAiError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="spread modal-header">
          <h2 className="modal-title">Start a new form</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="ai-generate-row" onSubmit={handleGenerate}>
          <input
            className="input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a form and let AI draft it, e.g. “a job application for a barista role”"
            disabled={generating}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!prompt.trim() || generating}>
            {generating ? 'Generating…' : `Generate with AI${aiCreditCost ? ` (${aiCreditCost} credit${aiCreditCost === 1 ? '' : 's'})` : ''}`}
          </button>
        </form>
        {aiError && <p className="error-text ai-generate-error">{aiError}</p>}

        <div className="modal-divider">
          <span>or pick a starting point{createCreditCost ? ` — ${createCreditCost} credit${createCreditCost === 1 ? '' : 's'} each` : ''}</span>
        </div>

        <div className="template-grid">
          <button type="button" className="template-card" onClick={() => onPick(null)} disabled={creating}>
            <span className="template-card-name">Start from scratch</span>
            <span className="muted template-card-blurb">A blank form with no questions yet.</span>
          </button>
          {FORM_TEMPLATES.map((t) => (
            <button type="button" key={t.id} className="template-card" onClick={() => onPick(t)} disabled={creating}>
              <span className="template-card-name">{t.name}</span>
              <span className="muted template-card-blurb">{t.blurb}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
