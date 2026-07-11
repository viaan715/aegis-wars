export const VALID_DIETS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'keto',
  'low-carb',
  'paleo',
  'nut-free',
];

export function sanitizeDiets(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((d) => VALID_DIETS.includes(d)))];
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    householdSize: user.household_size,
    dietRestrictions: JSON.parse(user.diet_restrictions),
    authProvider: user.google_id ? 'google' : 'password',
    emailVerified: Boolean(user.email_verified),
  };
}
