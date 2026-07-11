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
      <h1 className="text-2xl font-bold text-brand-800">Meal plan history</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : history.length === 0 ? (
        <p className="text-gray-500">No past meal plans yet.</p>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white shadow">
          {history.map((plan, i) => (
            <Link
              key={plan.id}
              to={`/history/${plan.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-brand-50"
            >
              <div>
                <p className="font-medium text-ink">Week of {plan.weekStartDate}</p>
                <p className="text-xs text-gray-500">
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
