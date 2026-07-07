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
        <h1 className="text-2xl font-bold text-brand-800">Grocery list</h1>
        <div className="flex flex-wrap gap-2">
          {items.length > 0 && (
            <Link
              to="/shopping"
              className="rounded border border-brand-600 px-4 py-2 font-medium text-brand-700 hover:bg-brand-50"
            >
              Enter shopping mode
            </Link>
          )}
          <button
            onClick={handleSendToInstacart}
            disabled={sending || items.length === 0}
            className="rounded bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send to Instacart'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {instacartUrl && (
        <div className="rounded border border-orange-200 bg-orange-50 p-3 text-sm">
          Your Instacart cart is ready:{' '}
          <a href={instacartUrl} target="_blank" rel="noreferrer" className="font-medium text-orange-700 underline">
            Open in Instacart
          </a>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-gray-500">
          Nothing here yet — generate a meal plan first, or everything you need is already in your
          pantry.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map(([category, categoryItems]) => {
          const c = categoryColor(category);
          return (
            <div key={category} className="overflow-hidden rounded-lg bg-white shadow">
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
                    <span className={item.checked ? 'text-gray-400 line-through' : ''}>
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
