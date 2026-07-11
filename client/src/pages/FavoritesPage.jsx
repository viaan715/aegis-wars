import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import RecipeDetailModal from '../components/RecipeDetailModal.jsx';
import { mealTypeColor, dietColor } from '../theme/colors.js';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailRecipe, setDetailRecipe] = useState(null);

  useEffect(() => {
    api
      .getFavorites()
      .then((data) => setFavorites(data.favorites))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(recipeId) {
    try {
      await api.removeFavorite(recipeId);
      setFavorites((prev) => prev.filter((r) => r.id !== recipeId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Recipes you love</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Favorite recipes</h1>
      </div>
      <p className="text-sm text-ink/50">
        Favorited recipes are prioritized when generating or swapping meals.
      </p>

      {error && <p className="text-sm font-medium text-flame">{error}</p>}

      {loading ? (
        <p className="text-ink/50">Loading...</p>
      ) : favorites.length === 0 ? (
        <p className="text-ink/50">
          No favorites yet — star recipes from your meal plan to see them here.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((recipe) => {
            const mealColor = mealTypeColor(recipe.mealType);
            return (
              <div key={recipe.id} className="card-pop border-t-4 p-4" style={{ borderTopColor: mealColor.dot }}>
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => setDetailRecipe(recipe)}
                    className="text-left font-semibold hover:text-brand-700 hover:underline"
                  >
                    {recipe.name}
                  </button>
                  <button
                    onClick={() => handleRemove(recipe.id)}
                    title="Remove favorite"
                    className="flex-none text-yellow-500 hover:text-yellow-600"
                  >
                    ★
                  </button>
                </div>
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase"
                  style={{ backgroundColor: mealColor.bg, color: mealColor.text }}
                >
                  {recipe.mealType}
                </span>
                <p className="mt-2 text-sm text-ink/60">{recipe.nutrition.calories} kcal / serving</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {recipe.diets.map((diet) => {
                    const c = dietColor(diet);
                    return (
                      <span
                        key={diet}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        {diet}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          isFavorite={favorites.some((r) => r.id === detailRecipe.id)}
          onToggleFavorite={handleRemove}
          onClose={() => setDetailRecipe(null)}
        />
      )}
    </div>
  );
}
