import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { categoryColor } from '../theme/colors.js';

const pantryColor = categoryColor('pantry');

export default function PantryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('each');

  function load() {
    setLoading(true);
    api
      .getPantry()
      .then((data) => setItems(data.pantryItems))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await api.addPantryItem({ ingredientName: name, quantity: Number(quantity), unit });
      setName('');
      setQuantity('');
      setUnit('each');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deletePantryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">What you've got on hand</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Pantry</h1>
      </div>
      <p className="text-sm text-ink/50">
        Items you already have on hand are subtracted from your generated grocery list.
      </p>

      <form onSubmit={handleAdd} className="card-pop flex flex-wrap items-end gap-2 p-4">
        <div>
          <label className="block text-xs font-medium text-ink/50">Ingredient</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. eggs"
            className="w-40 rounded-lg border-2 border-ink/15 px-2 py-1.5 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/50">Quantity</label>
          <input
            required
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24 rounded-lg border-2 border-ink/15 px-2 py-1.5 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/50">Unit</label>
          <input
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="each, cup, oz..."
            className="w-28 rounded-lg border-2 border-ink/15 px-2 py-1.5 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg px-4 py-2 font-semibold shadow-sm transition hover:-translate-y-px hover:shadow-md"
          style={{ backgroundColor: pantryColor.dot, color: pantryColor.text }}
        >
          Add
        </button>
      </form>

      {error && <p className="text-sm font-medium text-flame">{error}</p>}

      {loading ? (
        <p className="text-ink/50">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-ink/50">Your pantry is empty.</p>
      ) : (
        <table className="card-pop w-full">
          <thead className="text-left text-sm" style={{ backgroundColor: pantryColor.bg, color: pantryColor.text }}>
            <tr>
              <th className="px-4 py-2">Ingredient</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Unit</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-ink/10 text-sm">
                <td className="px-4 py-2">{item.ingredientName}</td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">{item.unit}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleDelete(item.id)} className="font-medium text-flame hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
