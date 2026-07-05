import { formatAnswer } from '../lib/formatAnswer.jsx';
import './CreateFormModal.css';
import './ResponseDetailModal.css';

export default function ResponseDetailModal({ response, questions, onClose }) {
  const byQuestion = Object.fromEntries(response.answers.map((a) => [a.questionId, a.value]));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card response-detail-card" onClick={(e) => e.stopPropagation()}>
        <div className="spread modal-header">
          <div>
            <h2 className="modal-title">Response</h2>
            <p className="tag-mono response-detail-time">{new Date(response.submittedAt).toLocaleString()}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="response-detail-list">
          {questions.map((q) => (
            <div key={q.id} className="response-detail-row">
              <p className="response-detail-label">{q.label}</p>
              <p className="response-detail-value">{formatAnswer(byQuestion[q.id])}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
