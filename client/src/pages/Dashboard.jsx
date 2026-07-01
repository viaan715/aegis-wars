import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { api } from '../lib/api.js';
import AppNav from '../components/AppNav.jsx';
import './Dashboard.css';

function heatState(form) {
  if (form.status !== 'published') return 'draft';
  return form.responseCount > 0 ? 'answered' : 'published';
}

function heatLabel(form) {
  if (form.status !== 'published') return 'Draft';
  return form.responseCount > 0 ? 'Collecting responses' : 'Published';
}

export default function Dashboard() {
  const { token, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState(null);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.listForms(token);
      setForms(data.forms);
      setUsage(data.usage);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    setCreating(true);
    setError('');
    try {
      const { form } = await api.createForm(token, { title: 'Untitled form' });
      navigate(`/forms/${form.id}/edit`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(formId, title) {
    if (!window.confirm(`Delete "${title}"? This also deletes its responses. This can't be undone.`)) return;
    await api.deleteForm(token, formId);
    load();
  }

  async function handleTogglePublish(form) {
    if (form.status === 'published') {
      await api.unpublishForm(token, form.id);
    } else {
      await api.publishForm(token, form.id);
    }
    load();
  }

  async function handleUpgrade() {
    await api.upgrade(token);
    await refreshUser();
    load();
  }

  function handleCopyLink(slug, formId) {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 1600);
  }

  const atFormLimit = usage && usage.maxForms !== null && usage.formCount >= usage.maxForms;

  return (
    <div className="app-shell">
      <AppNav />
      <main className="container dashboard">
        <div className="spread dashboard-header">
          <div>
            <h1 className="display-heading">Your forms</h1>
            <p className="muted">Every piece on the bench, in one place.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={creating || atFormLimit}>
            {creating ? 'Creating…' : 'Create form'}
          </button>
        </div>

        {usage && user?.plan === 'free' && (
          <div className="card usage-banner">
            <div>
              <p className="usage-banner-title">
                {usage.formCount} of {usage.maxForms} forms used on the Free plan
              </p>
              <p className="muted">Upgrade to Pro for unlimited forms and responses.</p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleUpgrade}>
              Upgrade to Pro
            </button>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        {forms === null ? (
          <p className="muted">Loading…</p>
        ) : forms.length === 0 ? (
          <div className="card empty-state">
            <h2>No forms yet.</h2>
            <p className="muted">Build your first one — it takes about two minutes.</p>
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={creating}>
              Create your first form
            </button>
          </div>
        ) : (
          <div className="form-grid">
            {forms.map((form) => (
              <div key={form.id} className="card form-card scroll-fade-in">
                <div className="row form-card-status">
                  <span className="heat-dot" data-state={heatState(form)} />
                  <span className="tag-mono">{heatLabel(form).toUpperCase()}</span>
                </div>
                <h2 className="form-card-title">{form.title}</h2>
                <p className="muted form-card-desc">{form.description || 'No description yet.'}</p>
                <p className="tag-mono form-card-count">
                  {form.responseCount} response{form.responseCount === 1 ? '' : 's'}
                </p>
                <div className="form-card-actions">
                  <Link to={`/forms/${form.id}/edit`} className="btn btn-secondary btn-sm">
                    Edit
                  </Link>
                  <Link to={`/forms/${form.id}/responses`} className="btn btn-secondary btn-sm">
                    Results
                  </Link>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleTogglePublish(form)}>
                    {form.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  {form.status === 'published' && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleCopyLink(form.slug, form.id)}>
                      {copiedId === form.id ? 'Copied!' : 'Copy link'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm form-card-delete"
                    onClick={() => handleDelete(form.id, form.title)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
