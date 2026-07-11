import { useEffect } from 'react';
import { mealTypeColor, dietColor, categoryColor } from '../theme/colors.js';

function formatQuantity(q) {
  return Number.isInteger(q) ? String(q) : q.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export default function RecipeDetailModal({ recipe, isFavorite, onToggleFavorite, onClose, rating, onRate, onDelete }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!recipe) return null;

  const mealColor = mealTypeColor(recipe.mealType);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={recipe.name}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-2xl animate-card-settle overflow-hidden rounded-t-2xl bg-paper shadow-2xl sm:rounded-2xl"
      >
        {/* punch-hole spine — the recipe-box card cue */}
        <div className="hidden w-10 flex-none flex-col items-center gap-5 border-r border-paper-line/80 bg-paper py-8 sm:flex">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="h-3 w-3 rounded-full bg-gray-50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]" />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
            <div>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ backgroundColor: mealColor.bg, color: mealColor.text }}
              >
                {recipe.mealType}
              </span>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                {recipe.name}
              </h2>
              {recipe.isCustom && (
                <span className="mt-1 inline-block rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/50">
                  Your recipe
                </span>
              )}
            </div>
            <div className="flex flex-none items-center gap-1">
              {onRate && (
                <>
                  <button
                    onClick={() => onRate(recipe.id, rating === 1 ? null : 1)}
                    title={rating === 1 ? 'Remove thumbs up' : 'Thumbs up'}
                    className={`text-xl leading-none ${rating === 1 ? 'text-brand-600' : 'text-paper-line hover:text-brand-500'}`}
                  >
                    👍
                  </button>
                  <button
                    onClick={() => onRate(recipe.id, rating === -1 ? null : -1)}
                    title={rating === -1 ? 'Remove thumbs down' : 'Thumbs down'}
                    className={`text-xl leading-none ${rating === -1 ? 'text-flame' : 'text-paper-line hover:text-flame'}`}
                  >
                    👎
                  </button>
                </>
              )}
              <button
                onClick={() => onToggleFavorite(recipe.id)}
                title={isFavorite ? 'Remove favorite' : 'Add favorite'}
                className={`text-2xl leading-none ${isFavorite ? 'text-yellow-500' : 'text-paper-line hover:text-yellow-400'}`}
              >
                ★
              </button>
              <button
                onClick={onClose}
                aria-label="Close recipe"
                className="rounded-full p-1 text-xl leading-none text-ink/50 hover:bg-ink/5 hover:text-ink"
              >
                &times;
              </button>
            </div>
          </div>

          {recipe.diets.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6 pt-4 sm:px-8">
              {recipe.diets.map((diet, i) => {
                const c = dietColor(diet);
                return (
                  <span
                    key={diet}
                    className="rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide"
                    style={{
                      backgroundColor: c.bg,
                      color: c.text,
                      borderColor: c.dot,
                      transform: i % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)',
                    }}
                  >
                    {diet}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mx-6 my-5 border-t border-dashed border-paper-line sm:mx-8" />

          <div className="grid gap-6 px-6 pb-6 sm:grid-cols-5 sm:px-8 sm:pb-8">
            <div className="sm:col-span-2">
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-ink/70">
                Ingredients
              </h3>
              <ul className="mt-3 space-y-2 font-mono text-sm text-ink">
                {recipe.ingredients.map((ing) => {
                  const c = categoryColor(ing.category);
                  return (
                    <li key={ing.name} className="flex items-center justify-between gap-3 border-b border-paper-line/70 pb-1">
                      <span className="flex items-center gap-2 capitalize">
                        <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: c.dot }} />
                        {ing.name}
                      </span>
                      <span className="flex-none whitespace-nowrap pl-3 text-ink/60">
                        {formatQuantity(ing.quantity)} {ing.unit}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-ink/50">Serves {recipe.baseServings}</p>
            </div>

            <div className="sm:col-span-3">
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-ink/70">
                Method
              </h3>
              <ol className="mt-3 space-y-3">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink">
                    <span
                      className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 font-mono text-xs font-semibold"
                      style={{ borderColor: mealColor.dot, color: mealColor.text }}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex flex-wrap gap-4 rounded-lg border border-paper-line bg-white/50 px-4 py-3 font-mono text-xs text-ink">
                <span>
                  <strong className="font-semibold">{recipe.nutrition.calories}</strong> kcal
                </span>
                <span>
                  <strong className="font-semibold">{recipe.nutrition.protein}g</strong> protein
                </span>
                <span>
                  <strong className="font-semibold">{recipe.nutrition.carbs}g</strong> carbs
                </span>
                <span>
                  <strong className="font-semibold">{recipe.nutrition.fat}g</strong> fat
                </span>
                <span className="text-ink/50">per serving</span>
              </div>

              {recipe.isCustom && onDelete && (
                <button
                  onClick={() => onDelete(recipe.id)}
                  className="mt-4 text-xs font-medium text-flame hover:underline"
                >
                  Delete this recipe
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
