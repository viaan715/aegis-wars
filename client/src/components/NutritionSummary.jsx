const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function NutritionSummary({ nutrition }) {
  if (!nutrition) return null;

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-3 font-semibold text-brand-800">Nutrition summary (per person)</h2>
      <div className="mb-4 grid grid-cols-4 gap-3 text-center">
        {['calories', 'protein', 'carbs', 'fat'].map((key) => (
          <div key={key} className="rounded bg-brand-50 p-2">
            <div className="text-lg font-bold text-brand-800">{nutrition.week[key]}</div>
            <div className="text-xs uppercase text-gray-500">
              {key === 'calories' ? 'kcal / week' : `${key} (g) / week`}
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-1">Day</th>
              <th className="py-1 text-right">Cal</th>
              <th className="py-1 text-right">Protein</th>
              <th className="py-1 text-right">Carbs</th>
              <th className="py-1 text-right">Fat</th>
            </tr>
          </thead>
          <tbody>
            {nutrition.perDay.map((day) => (
              <tr key={day.dayIndex} className="border-t border-gray-100">
                <td className="py-1 font-medium">{DAY_LABELS[day.dayIndex]}</td>
                <td className="py-1 text-right">{day.calories}</td>
                <td className="py-1 text-right">{day.protein}g</td>
                <td className="py-1 text-right">{day.carbs}g</td>
                <td className="py-1 text-right">{day.fat}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DAY_LABELS };
