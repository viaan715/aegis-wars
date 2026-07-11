import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function MealPlanHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMealPlanHistory()
      .then((data) => setHistory(data.history))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Every week, kept</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Meal plan history</h1>
      </div>

      {error && <p className="text-sm font-medium text-flame">{error}</p>}

      {loading ? (
        <p className="text-ink/50">Loading...</p>
      ) : history.length === 0 ? (
        <p className="text-ink/50">No past meal plans yet.</p>
      ) : (
        <div className="card-pop divide-y divide-ink/10">
          {history.map((plan, i) => (
            <Link
              key={plan.id}
              to={`/history/${plan.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-brand-50"
            >
              <div>
                <p className="font-medium text-ink">Week of {plan.weekStartDate}</p>
                <p className="text-xs text-ink/50">
                  Household of {plan.householdSize} · generated {new Date(plan.createdAt).toLocaleDateString()}
                </p>
              </div>
              {i === 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
                  Current
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
