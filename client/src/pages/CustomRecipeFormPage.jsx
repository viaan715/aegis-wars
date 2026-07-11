import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const CATEGORIES = ['produce', 'dairy', 'meat', 'seafood', 'bakery', 'pantry', 'frozen', 'spices', 'other'];

function emptyIngredient() {
  return { name: '', quantity: '', unit: '', category: 'produce' };
}

export default function CustomRecipeFormPage() {
  const navigate = useNavigate();
  const [allDiets, setAllDiets] = useState([]);
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState('dinner');
  const [baseServings, setBaseServings] = useState(4);
  const [diets, setDiets] = useState([]);
  const [ingredients, setIngredients] = useState([emptyIngredient()]);
  const [instructions, setInstructions] = useState(['']);
  const [nutrition, setNutrition] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getDiets().then((d) => setAllDiets(d.diets));
  }, []);

  function toggleDiet(diet) {
    setDiets((prev) => (prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]));
  }

  function updateIngredient(index, field, value) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)));
  }

  function updateInstruction(index, value) {
    setInstructions((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createCustomRecipe({
        name,
        mealType,
        baseServings: Number(baseServings),
        diets,
        ingredients: ingredients
          .filter((ing) => ing.name.trim())
          .map((ing) => ({ ...ing, quantity: Number(ing.quantity) })),
        instructions: instructions.filter((s) => s.trim()),
        nutrition: {
          calories: Number(nutrition.calories) || 0,
          protein: Number(nutrition.protein) || 0,
          carbs: Number(nutrition.carbs) || 0,
          fat: Number(nutrition.fat) || 0,
        },
      });
      navigate('/recipes');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-800">Add your own recipe</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
        <div>
          <label className="block text-sm font-medium">Recipe name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Meal type</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 capitalize focus:border-brand-500 focus:outline-none"
            >
              {MEAL_TYPES.map((mt) => (
                <option key={mt} value={mt}>
                  {mt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Serves</label>
            <input
              type="number"
              min={1}
              required
              value={baseServings}
              onChange={(e) => setBaseServings(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Dietary tags (optional)</label>
          <p className="mt-1 text-xs text-gray-500">Only check what's actually true — these drive whose meal plans this recipe can appear in.</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {allDiets.map((diet) => (
              <label key={diet} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={diets.includes(diet)} onChange={() => toggleDiet(diet)} className="accent-brand-600" />
                {diet}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Ingredients</label>
            <button
              type="button"
              onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
              className="text-sm text-brand-700 hover:underline"
            >
              + Add ingredient
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  placeholder="name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                  className="w-32 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <input
                  placeholder="qty"
                  type="number"
                  min={0}
                  step="any"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <input
                  placeholder="unit"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <select
                  value={ing.category}
                  onChange={(e) => updateIngredient(i, 'category', e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm capitalize"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600"
                    aria-label="Remove ingredient"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Instructions</label>
            <button
              type="button"
              onClick={() => setInstructions((prev) => [...prev, ''])}
              className="text-sm text-brand-700 hover:underline"
            >
              + Add step
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {instructions.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2 flex-none text-sm text-gray-400">{i + 1}.</span>
                <textarea
                  value={step}
                  onChange={(e) => updateInstruction(i, e.target.value)}
                  rows={2}
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setInstructions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="mt-2 text-red-600"
                    aria-label="Remove step"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Nutrition (per serving)</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {['calories', 'protein', 'carbs', 'fat'].map((field) => (
              <div key={field}>
                <label className="block text-xs capitalize text-gray-500">{field}</label>
                <input
                  type="number"
                  min={0}
                  value={nutrition[field]}
                  onChange={(e) => setNutrition((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save recipe'}
        </button>
      </form>
    </div>
  );
}
