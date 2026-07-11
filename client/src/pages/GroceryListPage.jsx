import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { groupByCategory } from '../utils/grocery.js';
import { categoryColor } from '../theme/colors.js';

export default function GroceryListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [instacartUrl, setInstacartUrl] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(null);

  useEffect(() => {
    api
      .getGroceryList()
      .then((data) => {
        setItems(data.items);
        setEstimatedCost(data.estimatedCost);
      })
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

  async function handleSendToInstacart() {
    setSending(true);
    setError('');
    setInstacartUrl('');
    try {
      const data = await api.sendToInstacart();
      setInstacartUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="text-center text-gray-500">Loading...</div>;

  if (error && items.length === 0) {
    return <p className="text-gray-600">{error}</p>;
  }

  const groups = groupByCategory(items);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">This week's list</p>
          <h1 className="font-display text-2xl font-semibold text-ink">Grocery list</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.length > 0 && (
            <Link to="/shopping" className="btn-secondary">
              Enter shopping mode
            </Link>
          )}
          <button
            onClick={handleSendToInstacart}
            disabled={sending || items.length === 0}
            className="rounded-lg bg-flame px-4 py-2.5 font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-flame/90 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send to Instacart'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-flame">{error}</p>}

      {instacartUrl && (
        <div className="rounded-lg border-2 border-flame/30 bg-flame/5 p-3 text-sm">
          Your Instacart cart is ready:{' '}
          <a href={instacartUrl} target="_blank" rel="noreferrer" className="font-semibold text-flame underline">
            Open in Instacart
          </a>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-ink/50">
          Nothing here yet — generate a meal plan first, or everything you need is already in your
          pantry.
        </p>
      )}

      {estimatedCost && items.length > 0 && (
        <div className="card-pop p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Estimated cost</span>
            <span className="font-display text-2xl font-semibold text-brand-700">${estimatedCost.total.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            A rough ballpark by category, not real store prices — there's no pricing feed wired up, this just
            assigns a typical per-item price for each aisle.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map(([category, categoryItems]) => {
          const c = categoryColor(category);
          return (
            <div key={category} className="card-pop border-t-4" style={{ borderTopColor: c.dot }}>
              <h2
                className="flex items-center gap-2 px-4 py-2 font-semibold capitalize"
                style={{ backgroundColor: c.bg, color: c.text }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.dot }} />
                {category}
              </h2>
              <ul className="space-y-1 p-4">
                {categoryItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggle(item)}
                      className="accent-brand-600"
                    />
                    <span className={item.checked ? 'text-ink/30 line-through' : ''}>
                      {item.quantity} {item.unit} {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
