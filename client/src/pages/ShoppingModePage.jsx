import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { groupByCategory } from '../utils/grocery.js';
import { categoryColor } from '../theme/colors.js';

export default function ShoppingModePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getGroceryList()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(item) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)));
    try {
      await api.toggleGroceryItem(item.id, !item.checked);
    } catch (err) {
      setError(err.message);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i)));
    }
  }

  const groups = useMemo(() => groupByCategory(items), [items]);
  const gotCount = items.filter((i) => i.checked).length;
  const progress = items.length === 0 ? 0 : Math.round((gotCount / items.length) * 100);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper">
      <div className="flex-none border-b border-paper-line bg-paper/95 px-4 pb-3 pt-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <p className="font-display text-lg font-semibold text-ink">Shopping mode</p>
          <button
            onClick={() => navigate('/grocery')}
            className="rounded-full border border-ink/20 px-3 py-1 text-sm text-ink/70 hover:bg-ink/5"
          >
            Exit
          </button>
        </div>
        <div className="mx-auto mt-3 flex max-w-2xl items-center gap-3">
          <span className="font-mono text-sm text-ink/70">
            {gotCount} of {items.length} got
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-line/70">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {loading && <p className="text-ink/60">Loading...</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}

          {!loading && items.length === 0 && (
            <p className="text-ink/60">
              Nothing to shop for yet — generate a meal plan and grocery list first.
            </p>
          )}

          {groups.map(([category, categoryItems]) => {
            const c = categoryColor(category);
            return (
            <div key={category}>
              <div className="relative inline-block">
                <span
                  className="absolute -top-2 left-2 -rotate-2 rounded-sm px-3 py-0.5"
                  style={{ backgroundColor: c.dot, opacity: 0.55 }}
                />
                <h2 className="relative font-display text-base font-semibold uppercase tracking-[0.15em] text-ink">
                  {category}
                </h2>
              </div>
              <ul className="mt-2 divide-y divide-paper-line/70 overflow-hidden rounded-xl border border-paper-line bg-white/60">
                {categoryItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleToggle(item)}
                      className="flex w-full items-center gap-4 px-4 py-4 text-left active:bg-paper-line/30"
                    >
                      <span
                        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 transition-colors ${
                          item.checked ? 'border-flame bg-flame' : 'border-ink/30'
                        }`}
                      >
                        {item.checked && (
                          <svg
                            className="h-4 w-4 animate-stamp-in text-paper"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 10l4 4 8-8" />
                          </svg>
                        )}
                      </span>
                      <span
                        className={`flex-1 text-lg leading-snug transition-opacity ${
                          item.checked ? 'text-flame/70 line-through opacity-60' : 'text-ink'
                        }`}
                      >
                        {item.quantity} {item.unit} {item.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            );
          })}
        </div>
      </div>

      <div className="flex-none border-t border-paper-line bg-paper/95 px-4 py-4 backdrop-blur sm:px-8">
        <button
          onClick={() => navigate('/grocery')}
          className="mx-auto block w-full max-w-2xl rounded-xl bg-brand-700 py-4 text-center font-display text-lg font-semibold text-white hover:bg-brand-800"
        >
          Done shopping
        </button>
      </div>
    </div>
  );
}
