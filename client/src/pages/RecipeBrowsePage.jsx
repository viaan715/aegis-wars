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
        <div>
          <p className="eyebrow mb-1">The full catalog</p>
          <h1 className="font-display text-2xl font-semibold text-ink">Browse recipes</h1>
        </div>
        <Link to="/recipes/new" className="btn-primary">
          + Add your own recipe
        </Link>
      </div>

      <div className="card-pop space-y-3 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search recipes by name..."
          className="w-full rounded-lg border-2 border-ink/15 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMealType('')}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${mealType === '' ? 'bg-ink text-white' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'}`}
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

      {error && <p className="text-sm font-medium text-flame">{error}</p>}

      {loading ? (
        <p className="text-ink/50">Loading...</p>
      ) : recipes.length === 0 ? (
        <p className="text-ink/50">No recipes match those filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => {
            const mealColor = mealTypeColor(recipe.mealType);
            const rating = ratings.get(recipe.id);
            return (
              <button
                key={recipe.id}
                onClick={() => setDetailRecipe(recipe)}
                className="card-pop border-t-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderTopColor: mealColor.dot }}
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
                {recipe.isCustom && <p className="eyebrow mt-0.5">Your recipe</p>}
                <p className="mt-1 text-sm text-ink/60">{recipe.nutrition.calories} kcal / serving</p>
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
