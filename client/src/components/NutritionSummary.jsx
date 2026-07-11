const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STAT_META = {
  calories: { label: 'Calories', unit: 'kcal / week', bg: '#FFF1D6', dot: '#F5A524', text: '#92400E' },
  protein: { label: 'Protein', unit: 'g / week', bg: '#FDE2E1', dot: '#FB7185', text: '#991B1B' },
  carbs: { label: 'Carbs', unit: 'g / week', bg: '#FBF0CF', dot: '#EAB308', text: '#854D0E' },
  fat: { label: 'Fat', unit: 'g / week', bg: '#E0F2FE', dot: '#38BDF8', text: '#075985' },
};

const BAR_COLOR = '#EA9A1E';

function CalorieBars({ perDay }) {
  const max = Math.max(1, ...perDay.map((d) => d.calories));

  return (
    <div>
      <p className="eyebrow mb-2">Calories per day this week</p>
      <div className="flex h-24 items-end gap-2">
        {perDay.map((day) => {
          const pct = Math.max(6, Math.round((day.calories / max) * 100));
          return (
            <div
              key={day.dayIndex}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${DAY_LABELS[day.dayIndex]}: ${day.calories} kcal`}
            >
              <div
                className="w-full rounded-t-md transition-[height]"
                style={{ height: `${pct}%`, backgroundColor: BAR_COLOR }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2">
        {perDay.map((day) => (
          <span
            key={day.dayIndex}
            className="flex-1 text-center font-mono text-[10px] font-semibold uppercase tracking-wide text-ink/50"
          >
            {DAY_LABELS[day.dayIndex]}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function NutritionSummary({ nutrition }) {
  if (!nutrition) return null;

  return (
    <div className="card-pop p-5">
      <p className="eyebrow mb-1">Per person</p>
      <h2 className="mb-4 font-display text-xl font-semibold text-ink">Nutrition summary</h2>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {['calories', 'protein', 'carbs', 'fat'].map((key) => {
          const meta = STAT_META[key];
          return (
            <div
              key={key}
              className="rounded-lg border-t-4 p-3"
              style={{ borderTopColor: meta.dot, backgroundColor: meta.bg }}
            >
              <div className="eyebrow mb-1" style={{ color: meta.text, opacity: 0.75 }}>
                {meta.label}
              </div>
              <div className="font-display text-2xl font-semibold" style={{ color: meta.text }}>
                {nutrition.week[key]}
              </div>
              <div className="text-[11px]" style={{ color: meta.text, opacity: 0.7 }}>
                {meta.unit}
              </div>
            </div>
          );
        })}
      </div>

      <CalorieBars perDay={nutrition.perDay} />

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50">
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">Cal</th>
              <th className="py-1 text-right font-medium">Protein</th>
              <th className="py-1 text-right font-medium">Carbs</th>
              <th className="py-1 text-right font-medium">Fat</th>
            </tr>
          </thead>
          <tbody>
            {nutrition.perDay.map((day) => (
              <tr key={day.dayIndex} className="border-t border-ink/10">
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
