import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

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
      <h1 className="text-2xl font-bold text-brand-800">Pantry</h1>
      <p className="text-sm text-gray-500">
        Items you already have on hand are subtracted from your generated grocery list.
      </p>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 rounded-lg bg-white p-4 shadow">
        <div>
          <label className="block text-xs text-gray-500">Ingredient</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. eggs"
            className="w-40 rounded border border-gray-300 px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Quantity</label>
          <input
            required
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24 rounded border border-gray-300 px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Unit</label>
          <input
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="each, cup, oz..."
            className="w-28 rounded border border-gray-300 px-2 py-1"
          />
        </div>
        <button type="submit" className="rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
          Add
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Your pantry is empty.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg bg-white shadow">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-4 py-2">Ingredient</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Unit</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100 text-sm">
                <td className="px-4 py-2">{item.ingredientName}</td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">{item.unit}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">
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
