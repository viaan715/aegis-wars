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
    <div className="card-pop mx-auto max-w-lg p-8">
      <p className="eyebrow mb-1">Your account</p>
      <h1 className="mb-2 font-display text-2xl font-semibold text-ink">Your profile</h1>
      <p className="mb-6 text-sm text-ink/60">
        Signed in as <span className="font-medium text-ink">{user?.email}</span>
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
            className="mt-1 w-32 rounded-lg border-2 border-ink/15 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-ink/50">
            Ingredient quantities in your grocery list scale to this many people.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Dietary restrictions</label>
          <p className="mt-1 text-xs text-ink/50">
            Recipes must satisfy every restriction you select.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {diets.map((diet) => {
              const c = dietColor(diet);
              const active = selectedDiets.includes(diet);
              return (
                <label
                  key={diet}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition"
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

        {status && <p className="text-sm font-medium text-brand-700">{status}</p>}
        <button type="submit" className="btn-primary">
          Save profile
        </button>
      </form>
    </div>
  );
}
