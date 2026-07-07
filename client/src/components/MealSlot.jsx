import { mealTypeColor } from '../theme/colors.js';

export default function MealSlot({ item, isFavorite, onSwap, onToggleFavorite, onOpenDetail, swapping }) {
  const { recipe } = item;
  const color = mealTypeColor(item.mealType);

  if (!recipe) {
    return (
      <div className="flex h-full flex-col justify-between rounded-lg border border-dashed border-red-300 bg-red-50 p-2 text-xs text-red-700">
        <span>No recipe matches your current diet restrictions for this slot.</span>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col justify-between rounded-lg border-l-4 bg-white p-2 text-xs shadow-sm"
      style={{ borderLeftColor: color.dot }}
    >
      <div>
        <div className="flex items-start justify-between gap-1">
          <button
            onClick={() => onOpenDetail(recipe)}
            className="text-left font-medium leading-tight hover:text-brand-700 hover:underline"
          >
            {recipe.name}
          </button>
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            title={isFavorite ? 'Remove favorite' : 'Add favorite'}
            className={isFavorite ? 'flex-none text-yellow-500' : 'flex-none text-gray-300 hover:text-yellow-400'}
          >
            ★
          </button>
        </div>
        <div className="mt-1 text-gray-500">{recipe.nutrition.calories} kcal</div>
      </div>
      <button
        onClick={onSwap}
        disabled={swapping}
        className="mt-2 rounded px-2 py-1 font-medium hover:brightness-95 disabled:opacity-50"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {swapping ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
}
