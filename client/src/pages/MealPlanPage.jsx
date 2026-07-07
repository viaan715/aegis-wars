import { Fragment, useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import MealSlot from '../components/MealSlot.jsx';
import NutritionSummary, { DAY_LABELS } from '../components/NutritionSummary.jsx';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealPlanPage() {
  const [mealPlan, setMealPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [swappingKey, setSwappingKey] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [planData, favData] = await Promise.all([api.getCurrentMealPlan(), api.getFavorites()]);
      setMealPlan(planData.mealPlan);
      setItems(planData.items);
      setNutrition(planData.nutrition);
      setFavoriteIds(new Set(favData.favorites.map((r) => r.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const data = await api.generateMealPlan();
      setMealPlan(data.mealPlan);
      setItems(data.items);
      setNutrition(data.nutrition);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSwap(dayIndex, mealType) {
    const key = `${dayIndex}-${mealType}`;
    setSwappingKey(key);
    setError('');
    try {
      const data = await api.swapMeal(dayIndex, mealType);
      setItems(data.items);
      setNutrition(data.nutrition);
    } catch (err) {
      setError(err.message);
    } finally {
      setSwappingKey(null);
    }
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

  if (loading) return <div className="text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">Weekly meal plan</h1>
          {mealPlan && (
            <p className="text-sm text-gray-500">
              Week of {mealPlan.weekStartDate} · household of {mealPlan.householdSize}
            </p>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {generating ? 'Generating...' : mealPlan ? 'Regenerate full week' : 'Generate my meal plan'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!mealPlan && !generating && (
        <p className="text-gray-500">
          No meal plan yet. Set your dietary restrictions and household size on your Profile page,
          then click &ldquo;Generate my meal plan&rdquo;.
        </p>
      )}

      {mealPlan && (
        <>
          <div className="overflow-x-auto">
            <div className="grid min-w-[900px] grid-cols-[80px_repeat(7,1fr)] gap-2">
              <div />
              {DAY_LABELS.map((label) => (
                <div key={label} className="text-center font-semibold text-brand-800">
                  {label}
                </div>
              ))}
              {MEAL_TYPES.map((mealType) => (
                <Fragment key={mealType}>
                  <div className="flex items-center font-medium capitalize text-gray-600">
                    {mealType}
                  </div>
                  {DAY_LABELS.map((_, dayIndex) => {
                    const item = items.find((i) => i.dayIndex === dayIndex && i.mealType === mealType);
                    if (!item) return <div key={`${mealType}-${dayIndex}`} />;
                    const key = `${dayIndex}-${mealType}`;
                    return (
                      <div key={key} className="min-h-[110px]">
                        <MealSlot
                          item={item}
                          isFavorite={item.recipe ? favoriteIds.has(item.recipe.id) : false}
                          swapping={swappingKey === key}
                          onSwap={() => handleSwap(dayIndex, mealType)}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          <NutritionSummary nutrition={nutrition} />
        </>
      )}
    </div>
  );
}
