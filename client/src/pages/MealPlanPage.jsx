import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import MealSlot from '../components/MealSlot.jsx';
import NutritionSummary, { DAY_LABELS } from '../components/NutritionSummary.jsx';
import RecipeDetailModal from '../components/RecipeDetailModal.jsx';
import { mealTypeColor } from '../theme/colors.js';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const TEMPLATES = [
  { value: '', label: 'No theme' },
  { value: 'high-protein', label: 'High protein' },
  { value: 'lower-calorie', label: 'Lower calorie' },
  { value: 'budget-friendly', label: 'Budget-friendly' },
];

export default function MealPlanPage() {
  const [mealPlan, setMealPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [ratings, setRatings] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [swappingKey, setSwappingKey] = useState(null);
  const [error, setError] = useState('');
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [template, setTemplate] = useState('');
  const [dragSource, setDragSource] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [planData, favData, ratingData] = await Promise.all([
        api.getCurrentMealPlan(),
        api.getFavorites(),
        api.getRatings(),
      ]);
      setMealPlan(planData.mealPlan);
      setItems(planData.items);
      setNutrition(planData.nutrition);
      setFavoriteIds(new Set(favData.favorites.map((r) => r.id)));
      setRatings(new Map(ratingData.ratings.map((r) => [r.recipe_id, r.rating])));
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
      const data = await api.generateMealPlan(template || undefined);
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

  async function handleDropSwap(mealType, dayIndexA, dayIndexB) {
    setDragOverKey(null);
    setDragSource(null);
    if (dayIndexA === dayIndexB) return;
    setError('');
    try {
      const data = await api.swapMealPositions(mealType, dayIndexA, dayIndexB);
      setItems(data.items);
      setNutrition(data.nutrition);
    } catch (err) {
      setError(err.message);
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

  if (loading) return <div className="text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Plan ahead</p>
          <h1 className="font-display text-2xl font-semibold text-ink">Weekly meal plan</h1>
          {mealPlan && (
            <p className="text-sm text-ink/50">
              Week of {mealPlan.weekStartDate} · household of {mealPlan.householdSize} ·{' '}
              <Link to="/history" className="font-medium text-brand-700 hover:underline">
                view past weeks
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="rounded-lg border-2 border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? 'Generating...' : mealPlan ? 'Regenerate full week' : 'Generate my meal plan'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-flame">{error}</p>}

      {!mealPlan && !generating && (
        <p className="text-ink/50">
          No meal plan yet. Set your dietary restrictions and household size on your Profile page,
          then click &ldquo;Generate my meal plan&rdquo;.
        </p>
      )}

      {mealPlan && (
        <>
          <p className="eyebrow">Tip: drag a meal onto another day (same meal type) to swap them</p>
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
                    const key = `${dayIndex}-${mealType}`;
                    return (
                      <div key={key} className="min-h-[110px]">
                        <MealSlot
                          item={item}
                          isFavorite={item.recipe ? favoriteIds.has(item.recipe.id) : false}
                          swapping={swappingKey === key}
                          onSwap={() => handleSwap(dayIndex, mealType)}
                          onToggleFavorite={handleToggleFavorite}
                          onOpenDetail={setDetailRecipe}
                          draggable={Boolean(item.recipe)}
                          isDropTarget={dragOverKey === key}
                          onDragStart={() => setDragSource({ mealType, dayIndex })}
                          onDragOver={(e) => {
                            if (dragSource && dragSource.mealType === mealType) {
                              e.preventDefault();
                              setDragOverKey(key);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragSource && dragSource.mealType === mealType) {
                              handleDropSwap(mealType, dragSource.dayIndex, dayIndex);
                            }
                          }}
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
        </>
      )}

      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          isFavorite={favoriteIds.has(detailRecipe.id)}
          onToggleFavorite={handleToggleFavorite}
          rating={ratings.get(detailRecipe.id)}
          onRate={handleRate}
          onClose={() => setDetailRecipe(null)}
        />
      )}
    </div>
  );
}
