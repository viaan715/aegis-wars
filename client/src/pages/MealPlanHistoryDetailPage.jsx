import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import MealSlot from '../components/MealSlot.jsx';
import NutritionSummary, { DAY_LABELS } from '../components/NutritionSummary.jsx';
import RecipeDetailModal from '../components/RecipeDetailModal.jsx';
import { mealTypeColor } from '../theme/colors.js';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealPlanHistoryDetailPage() {
  const { id } = useParams();
  const [mealPlan, setMealPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailRecipe, setDetailRecipe] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([api.getMealPlanById(id), api.getFavorites()])
      .then(([planData, favData]) => {
        setMealPlan(planData.mealPlan);
        setItems(planData.items);
        setNutrition(planData.nutrition);
        setFavoriteIds(new Set(favData.favorites.map((r) => r.id)));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <div className="text-center text-gray-500">Loading...</div>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!mealPlan) return <p className="text-gray-500">Meal plan not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/history" className="text-sm text-brand-700 hover:underline">
            &larr; Back to history
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-brand-800">Week of {mealPlan.weekStartDate}</h1>
          <p className="text-sm text-gray-500">Household of {mealPlan.householdSize} (read-only)</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-[80px_repeat(7,1fr)] gap-2">
          <div />
          {DAY_LABELS.map((label) => (
            <div key={label} className="text-center font-semibold text-brand-800">
              {label}
            </div>
          ))}
          {MEAL_TYPES.map((mealType) => {
            const color = mealTypeColor(mealType);
            return (
              <Fragment key={mealType}>
                <div className="flex items-center">
                  <span
                    className="rounded-full px-2 py-1 text-xs font-semibold capitalize"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {mealType}
                  </span>
                </div>
                {DAY_LABELS.map((_, dayIndex) => {
                  const item = items.find((i) => i.dayIndex === dayIndex && i.mealType === mealType);
                  if (!item) return <div key={`${mealType}-${dayIndex}`} />;
                  return (
                    <div key={`${dayIndex}-${mealType}`} className="min-h-[110px]">
                      <MealSlot
                        item={item}
                        isFavorite={item.recipe ? favoriteIds.has(item.recipe.id) : false}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenDetail={setDetailRecipe}
                      />
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      <NutritionSummary nutrition={nutrition} />

      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          isFavorite={favoriteIds.has(detailRecipe.id)}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setDetailRecipe(null)}
        />
      )}
    </div>
  );
}
