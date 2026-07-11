import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import RecipeDetailModal from '../components/RecipeDetailModal.jsx';
import { mealTypeColor, dietColor } from '../theme/colors.js';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function RecipeBrowsePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [mealType, setMealType] = useState('');
  const [diets, setDiets] = useState([]);
  const [allDiets, setAllDiets] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [ratings, setRatings] = useState(new Map());
  const [detailRecipe, setDetailRecipe] = useState(null);

  useEffect(() => {
    api.getDiets().then((d) => setAllDiets(d.diets));
    Promise.all([api.getFavorites(), api.getRatings()]).then(([favData, ratingData]) => {
      setFavoriteIds(new Set(favData.favorites.map((r) => r.id)));
      setRatings(new Map(ratingData.ratings.map((r) => [r.recipe_id, r.rating])));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const timeout = setTimeout(() => {
      api
        .getRecipes({ q, mealType, diet: diets.join(',') })
        .then((data) => setRecipes(data.recipes))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, mealType, diets]);

  function toggleDiet(diet) {
    setDiets((prev) => (prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]));
  }

  async function handleToggleFavorite(recipeId) {
    try {
      if (favoriteIds.has(recipeId)) {
        await api.removeFavorite(recipeId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      } else {
        await api.addFavorite(recipeId);
        setFavoriteIds((prev) => new Set(prev).add(recipeId));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRate(recipeId, rating) {
    try {
      if (rating === null) {
        await api.clearRating(recipeId);
        setRatings((prev) => {
          const next = new Map(prev);
          next.delete(recipeId);
          return next;
        });
      } else {
        await api.setRating(recipeId, rating);
        setRatings((prev) => new Map(prev).set(recipeId, rating));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(recipeId) {
    try {
      await api.deleteCustomRecipe(recipeId);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setDetailRecipe(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-800">Browse recipes</h1>
        <Link
          to="/recipes/new"
          className="rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          + Add your own recipe
        </Link>
      </div>

      <div className="space-y-3 rounded-lg bg-white p-4 shadow">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search recipes by name..."
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMealType('')}
            className={`rounded-full px-3 py-1 text-sm ${mealType === '' ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            All meals
          </button>
          {MEAL_TYPES.map((mt) => {
            const c = mealTypeColor(mt);
            const active = mealType === mt;
            return (
              <button
                key={mt}
                onClick={() => setMealType(active ? '' : mt)}
                className="rounded-full px-3 py-1 text-sm capitalize"
                style={active ? { backgroundColor: c.dot, color: c.text } : { backgroundColor: c.bg, color: c.text, opacity: 0.6 }}
              >
                {mt}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {allDiets.map((diet) => {
            const c = dietColor(diet);
            const active = diets.includes(diet);
            return (
              <button
                key={diet}
                onClick={() => toggleDiet(diet)}
                className="rounded-full border px-3 py-1 text-xs uppercase tracking-wide"
                style={
                  active
                    ? { backgroundColor: c.dot, color: c.text, borderColor: c.dot }
                    : { backgroundColor: c.bg, color: c.text, borderColor: 'transparent', opacity: 0.6 }
                }
              >
                {diet}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : recipes.length === 0 ? (
        <p className="text-gray-500">No recipes match those filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => {
            const mealColor = mealTypeColor(recipe.mealType);
            const rating = ratings.get(recipe.id);
            return (
              <button
                key={recipe.id}
                onClick={() => setDetailRecipe(recipe)}
                className="rounded-lg bg-white p-4 text-left shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                    style={{ backgroundColor: mealColor.bg, color: mealColor.text }}
                  >
                    {recipe.mealType}
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    {rating === 1 && <span title="Thumbs up">👍</span>}
                    {rating === -1 && <span title="Thumbs down">👎</span>}
                    {favoriteIds.has(recipe.id) && <span className="text-yellow-500">★</span>}
                  </div>
                </div>
                <h2 className="mt-2 font-semibold text-ink">{recipe.name}</h2>
                {recipe.isCustom && <p className="text-[10px] uppercase tracking-wide text-ink/40">Your recipe</p>}
                <p className="mt-1 text-sm text-gray-600">{recipe.nutrition.calories} kcal / serving</p>
              </button>
            );
          })}
        </div>
      )}

      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          isFavorite={favoriteIds.has(detailRecipe.id)}
          onToggleFavorite={handleToggleFavorite}
          rating={ratings.get(detailRecipe.id)}
          onRate={handleRate}
          onDelete={detailRecipe.isCustom ? handleDelete : undefined}
          onClose={() => setDetailRecipe(null)}
        />
      )}
    </div>
  );
}
