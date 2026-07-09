import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <h1 className="text-2xl font-bold text-brand-800">Favorite recipes</h1>
      <p className="text-sm text-gray-500">
        Favorited recipes are prioritized when generating or swapping meals.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : favorites.length === 0 ? (
        <p className="text-gray-500">
          No favorites yet — star recipes from your meal plan to see them here.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((recipe) => (
            <div key={recipe.id} className="rounded-lg bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{recipe.name}</h2>
                <button
                  onClick={() => handleRemove(recipe.id)}
                  title="Remove favorite"
                  className="text-yellow-500 hover:text-yellow-600"
                >
                  ★
                </button>
              </div>
              <p className="mt-1 text-xs uppercase text-gray-400">{recipe.mealType}</p>
              <p className="mt-2 text-sm text-gray-600">{recipe.nutrition.calories} kcal / serving</p>
              <p className="mt-1 text-xs text-gray-500">{recipe.diets.join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
