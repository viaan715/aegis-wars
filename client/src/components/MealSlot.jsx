import { mealTypeColor } from '../theme/colors.js';

export default function MealSlot({
  item,
  isFavorite,
  onSwap,
  onToggleFavorite,
  onOpenDetail,
  swapping,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  isDropTarget,
}) {
  const { recipe } = item;
  const color = mealTypeColor(item.mealType);

  if (!recipe) {
    return (
      <div className="flex h-full flex-col justify-between rounded-lg border-2 border-dashed border-flame/40 bg-flame/5 p-2 text-xs text-flame">
        <span>No recipe matches your current diet restrictions for this slot.</span>
      </div>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex h-full flex-col justify-between rounded-lg border-l-[6px] bg-white p-2 text-xs shadow-sm transition hover:shadow-md ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDropTarget ? 'ring-2 ring-brand-500' : ''}`}
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
        <div className="mt-1 text-ink/50">{recipe.nutrition.calories} kcal</div>
      </div>
      {onSwap && (
        <button
          onClick={onSwap}
          disabled={swapping}
          className="mt-2 rounded-md px-2 py-1 font-semibold transition hover:brightness-95 disabled:opacity-50"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {swapping ? 'Swapping...' : 'Swap'}
        </button>
      )}
    </div>
  );
}
