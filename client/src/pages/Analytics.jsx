import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { api, ApiError } from '../lib/api.js';
import { formatAnswer } from '../lib/formatAnswer.jsx';
import AppNav from '../components/AppNav.jsx';
import ResponseDetailModal from '../components/ResponseDetailModal.jsx';
import { useRandomTextColors } from '../lib/randomTextColors.js';
import './Analytics.css';

const GOLD = '#c99a46';
const BLUE = '#4a6c8c';

export default function Analytics() {
  const { id } = useParams();
  const { token } = useAuth();
  const [form, setForm] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [responses, setResponses] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const rootRef = useRandomTextColors();

  useEffect(() => {
    Promise.all([api.getForm(token, id), api.getAnalytics(token, id), api.getResponses(token, id)])
      .then(([formData, analyticsData, responsesData]) => {
        setForm(formData);
        setAnalytics(analyticsData);
        setResponses(responsesData);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load results'));
  }, [token, id]);

  async function handleExport() {
    setExporting(true);
    try {
      const { blob, filename } = await api.exportCsv(token, id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not export responses');
    } finally {
      setExporting(false);
    }
  }

  if (error) {
    return (
      <div className="app-shell" ref={rootRef}>
        <AppNav />
        <main className="container">
          <p className="error-text">{error}</p>
        </main>
      </div>
    );
  }

  if (!form || !analytics || !responses) {
    return (
      <div className="app-shell" ref={rootRef}>
        <AppNav />
      </div>
    );
  }

  return (
    <div className="app-shell" ref={rootRef}>
      <AppNav
        actions={
          <>
            <Link to={`/forms/${id}/edit`} className="btn btn-ghost btn-sm">
              Back to editor
            </Link>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport} disabled={exporting || analytics.totalResponses === 0}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </>
        }
      />

      <main className="container analytics">
        <div className="analytics-header">
          <h1 className="display-heading">{form.form.title}</h1>
          <p className="tag-mono">
            {analytics.totalResponses} RESPONSE{analytics.totalResponses === 1 ? '' : 'S'}
          </p>
        </div>

        {analytics.totalResponses === 0 ? (
          <div className="card empty-state">
            <h2>No responses yet.</h2>
            <p className="muted">Share your form's link to start collecting answers.</p>
          </div>
        ) : (
          <div className="question-analytics">
            {analytics.questions.map((q) => (
              <div key={q.questionId} className="card question-analytics-card">
                <div className="spread">
                  <h2 className="question-analytics-title">{q.label}</h2>
                  <span className="tag-mono">{q.answeredCount} ANSWERED</span>
                </div>

                {q.distribution ? (
                  <>
                    {q.average !== undefined && q.average !== null && (
                      <p className="analytics-average">
                        {q.average}
                        <span className="muted"> average</span>
                      </p>
                    )}
                    <div className="chart-wrap">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={q.distribution} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#3a3f4a" vertical={false} />
                          <XAxis dataKey="name" stroke="#cfc9bc" fontSize={12} tickLine={false} />
                          <YAxis stroke="#cfc9bc" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#262a32', border: '1px solid #3a3f4a', borderRadius: 6 }} />
                          <Bar dataKey="count" fill={q.type === 'rating' || q.type === 'scale' ? BLUE : GOLD} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <ul className="sample-list">
                    {q.sampleValues.length === 0 && <li className="muted">No answers yet.</li>}
                    {q.sampleValues.map((v, i) => (
                      <li key={i}>{formatAnswer(v)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {responses.responses.length > 0 && (
          <div className="card responses-table-wrap">
            <h2 className="responses-table-title">All responses</h2>
            <div className="responses-table-scroll">
              <table className="responses-table">
                <thead>
                  <tr>
                    <th>Submitted</th>
                    {responses.questions.map((q) => (
                      <th key={q.id}>{q.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.responses.map((r) => {
                    const byQuestion = Object.fromEntries(r.answers.map((a) => [a.questionId, a.value]));
                    return (
                      <tr key={r.id} className="responses-table-row" onClick={() => setSelectedResponse(r)}>
                        <td className="tag-mono">{new Date(r.submittedAt).toLocaleString()}</td>
                        {responses.questions.map((q) => (
                          <td key={q.id}>{formatAnswer(byQuestion[q.id])}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedResponse && (
        <ResponseDetailModal
          response={selectedResponse}
          questions={responses.questions}
          onClose={() => setSelectedResponse(null)}
        />
      )}
    </div>
  );
}
