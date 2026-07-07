import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { dietColor } from '../theme/colors.js';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [diets, setDiets] = useState([]);
  const [selectedDiets, setSelectedDiets] = useState(user?.dietRestrictions || []);
  const [householdSize, setHouseholdSize] = useState(user?.householdSize || 2);
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.getDiets().then((d) => setDiets(d.diets));
  }, []);

  function toggleDiet(diet) {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    setStatus('Saving...');
    try {
      await api.updateMe({ householdSize: Number(householdSize), dietRestrictions: selectedDiets });
      await refreshUser();
      setStatus('Saved!');
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-lg bg-white p-8 shadow">
      <h1 className="mb-2 text-2xl font-bold text-brand-800">Your profile</h1>
      <p className="mb-6 text-sm text-gray-600">
        Signed in as <span className="font-medium">{user?.email}</span>
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Household size</label>
          <input
            type="number"
            min={1}
            max={20}
            value={householdSize}
            onChange={(e) => setHouseholdSize(e.target.value)}
            className="mt-1 w-32 rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ingredient quantities in your grocery list scale to this many people.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Dietary restrictions</label>
          <p className="mt-1 text-xs text-gray-500">
            Recipes must satisfy every restriction you select.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {diets.map((diet) => {
              const c = dietColor(diet);
              const active = selectedDiets.includes(diet);
              return (
                <label
                  key={diet}
                  className="flex cursor-pointer items-center gap-2 rounded border-2 px-3 py-2 text-sm"
                  style={
                    active
                      ? { borderColor: c.dot, backgroundColor: c.bg, color: c.text }
                      : { borderColor: '#e5e7eb', color: '#374151' }
                  }
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleDiet(diet)}
                    style={{ accentColor: c.dot }}
                  />
                  {diet}
                </label>
              );
            })}
          </div>
        </div>

        {status && <p className="text-sm text-gray-600">{status}</p>}
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          Save profile
        </button>
      </form>
    </div>
  );
}
