const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  loginWithGoogle: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),
  resendVerification: () => request('/auth/resend-verification', { method: 'POST' }),
  verifyEmail: (token) => request('/auth/verify-email', { method: 'POST', body: { token } }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) =>
    request('/auth/reset-password', { method: 'POST', body: { token, password } }),

  getMe: () => request('/profile/me'),
  updateMe: (payload) => request('/profile/me', { method: 'PATCH', body: payload }),
  getDiets: () => request('/profile/diets'),

  getRecipes: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/recipes${qs ? `?${qs}` : ''}`);
  },
  getRecipe: (id) => request(`/recipes/${id}`),
  createCustomRecipe: (payload) => request('/recipes', { method: 'POST', body: payload }),
  deleteCustomRecipe: (id) => request(`/recipes/${id}`, { method: 'DELETE' }),

  getRatings: () => request('/ratings'),
  setRating: (recipeId, rating) => request(`/ratings/${recipeId}`, { method: 'PUT', body: { rating } }),
  clearRating: (recipeId) => request(`/ratings/${recipeId}`, { method: 'DELETE' }),

  generateMealPlan: (template) => request('/mealplans/generate', { method: 'POST', body: { template } }),
  getCurrentMealPlan: () => request('/mealplans/current'),
  getMealPlanHistory: () => request('/mealplans/history'),
  getMealPlanById: (id) => request(`/mealplans/${id}`),
  swapMeal: (dayIndex, mealType) =>
    request(`/mealplans/current/items/${dayIndex}/${mealType}`, { method: 'PATCH' }),
  swapMealPositions: (mealType, dayIndexA, dayIndexB) =>
    request('/mealplans/current/items/swap-positions', {
      method: 'PATCH',
      body: { mealType, dayIndexA, dayIndexB },
    }),

  getGroceryList: () => request('/grocery/current'),
  toggleGroceryItem: (id, checked) =>
    request(`/grocery/items/${id}`, { method: 'PATCH', body: { checked } }),

  getPantry: () => request('/pantry'),
  addPantryItem: (payload) => request('/pantry', { method: 'POST', body: payload }),
  updatePantryItem: (id, quantity) =>
    request(`/pantry/${id}`, { method: 'PATCH', body: { quantity } }),
  deletePantryItem: (id) => request(`/pantry/${id}`, { method: 'DELETE' }),

  getFavorites: () => request('/favorites'),
  addFavorite: (recipeId) => request('/favorites', { method: 'POST', body: { recipeId } }),
  removeFavorite: (recipeId) => request(`/favorites/${recipeId}`, { method: 'DELETE' }),

  sendToInstacart: () => request('/instacart/send', { method: 'POST' }),
};
