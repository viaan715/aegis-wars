// Each entry: bg (chip fill), text (chip label), border/dot (accent).
// Used via inline style so Tailwind's JIT scanner doesn't need to see static class names.

export const MEAL_TYPE_COLORS = {
  breakfast: { bg: '#FFF1D6', text: '#92400E', dot: '#F5A524' },
  lunch: { bg: '#E8F5D0', text: '#3F6212', dot: '#84CC16' },
  dinner: { bg: '#EDE4FF', text: '#5B21B6', dot: '#A78BFA' },
  snack: { bg: '#FDE3EE', text: '#9D174D', dot: '#F472B6' },
};

export const DIET_COLORS = {
  vegetarian: { bg: '#E3F5E1', text: '#166534', dot: '#4ADE80' },
  vegan: { bg: '#DFF6EF', text: '#0F766E', dot: '#2DD4BF' },
  'gluten-free': { bg: '#FBF0CF', text: '#854D0E', dot: '#EAB308' },
  'dairy-free': { bg: '#E0F2FE', text: '#075985', dot: '#38BDF8' },
  keto: { bg: '#F3E8FF', text: '#6B21A8', dot: '#C084FC' },
  'low-carb': { bg: '#FFE4E1', text: '#9F1239', dot: '#FB7185' },
  paleo: { bg: '#FDE6D8', text: '#9A3412', dot: '#FB923C' },
  'nut-free': { bg: '#E5E7FF', text: '#3730A3', dot: '#818CF8' },
};

export const CATEGORY_COLORS = {
  produce: { bg: '#E7F6E0', text: '#166534', dot: '#4ADE80' },
  dairy: { bg: '#FFF8DB', text: '#854D0E', dot: '#FDE047' },
  meat: { bg: '#FDE2E1', text: '#991B1B', dot: '#F87171' },
  seafood: { bg: '#DFF7F6', text: '#0E7490', dot: '#22D3EE' },
  bakery: { bg: '#F5E6D3', text: '#78350F', dot: '#D9A066' },
  pantry: { bg: '#F0EEDB', text: '#4D4A1F', dot: '#BFB65A' },
  frozen: { bg: '#E6F4FB', text: '#1E4E6B', dot: '#7DD3FC' },
  spices: { bg: '#FBDCCB', text: '#9A3412', dot: '#F0653C' },
  other: { bg: '#EDEBF5', text: '#4C1D95', dot: '#A78BFA' },
};

const FALLBACK = { bg: '#F1F5F9', text: '#334155', dot: '#94A3B8' };

export function mealTypeColor(mealType) {
  return MEAL_TYPE_COLORS[mealType] ?? FALLBACK;
}
export function dietColor(diet) {
  return DIET_COLORS[diet] ?? FALLBACK;
}
export function categoryColor(category) {
  return CATEGORY_COLORS[category] ?? FALLBACK;
}
