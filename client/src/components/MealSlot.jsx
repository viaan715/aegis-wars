export default function MealSlot({ item, isFavorite, onSwap, onToggleFavorite, swapping }) {
  const { recipe } = item;

  if (!recipe) {
    return (
      <div className="flex h-full flex-col justify-between rounded border border-dashed border-red-300 bg-red-50 p-2 text-xs text-red-700">
        <span>No recipe matches your current diet restrictions for this slot.</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between rounded border border-gray-200 bg-white p-2 text-xs shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-1">
          <span className="font-medium leading-tight">{recipe.name}</span>
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            title={isFavorite ? 'Remove favorite' : 'Add favorite'}
            className={isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}
          >
            ★
          </button>
        </div>
        <div className="mt-1 text-gray-500">{recipe.nutrition.calories} kcal</div>
      </div>
      <button
        onClick={onSwap}
        disabled={swapping}
        className="mt-2 rounded bg-brand-50 px-2 py-1 text-brand-700 hover:bg-brand-100 disabled:opacity-50"
      >
        {swapping ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
}
