import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api.js';
import FillFormView from '../components/FillFormView.jsx';

export default function FillForm() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    api
      .getPublicForm(slug)
      .then(setData)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load this survey'));
  }, [slug]);

  if (loadError) {
    return (
      <div className="fill-view" style={{ '--fill-accent': '#c99a46' }}>
        <div className="fill-thanks">
          <h1 className="fill-thanks-title">Survey unavailable</h1>
          <p className="fill-thanks-sub">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  async function handleSubmit(answers) {
    setSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      const plain = {};
      for (const [questionId, value] of Object.entries(answers)) {
        if (value instanceof File) {
          formData.append(`file_${questionId}`, value);
        } else {
          plain[questionId] = value;
        }
      }
      formData.append('answers', JSON.stringify(plain));
      await api.submitResponse(slug, formData);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Could not submit your response. Try again.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FillFormView
      form={data.form}
      questions={data.questions}
      mode="live"
      onSubmit={handleSubmit}
      submitting={submitting}
      submitError={submitError}
    />
  );
}
