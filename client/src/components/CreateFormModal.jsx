import { FORM_TEMPLATES } from '../lib/formTemplates.js';
import './CreateFormModal.css';

export default function CreateFormModal({ onClose, onPick, creating }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="spread modal-header">
          <h2 className="modal-title">Start a new form</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
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
