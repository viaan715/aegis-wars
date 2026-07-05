const BASE = '/api';

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = 'GET', body, token, isForm = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (data && data.error) || 'Something went wrong';
    throw new ApiError(message, res.status, data && data.code);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),

  upgrade: (token) => request('/billing/upgrade', { method: 'POST', token }),
  downgrade: (token) => request('/billing/downgrade', { method: 'POST', token }),

  listForms: (token) => request('/forms', { token }),
  createForm: (token, payload) => request('/forms', { method: 'POST', body: payload, token }),
  getForm: (token, id) => request(`/forms/${id}`, { token }),
  updateForm: (token, id, payload) => request(`/forms/${id}`, { method: 'PUT', body: payload, token }),
  deleteForm: (token, id) => request(`/forms/${id}`, { method: 'DELETE', token }),
  duplicateForm: (token, id) => request(`/forms/${id}/duplicate`, { method: 'POST', token }),
  publishForm: (token, id) => request(`/forms/${id}/publish`, { method: 'POST', token }),
  unpublishForm: (token, id) => request(`/forms/${id}/unpublish`, { method: 'POST', token }),

  getResponses: (token, id) => request(`/forms/${id}/responses`, { token }),
  getAnalytics: (token, id) => request(`/forms/${id}/analytics`, { token }),
  async exportCsv(token, id) {
    const res = await fetch(`${BASE}/forms/${id}/responses/export.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new ApiError('Could not export responses', res.status);
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    return { blob: await res.blob(), filename: match ? match[1] : 'responses.csv' };
  },

  getPublicForm: (slug) => request(`/public/forms/${slug}`),
  submitResponse: (slug, formData) =>
    request(`/public/forms/${slug}/responses`, { method: 'POST', body: formData, isForm: true }),
};

export { ApiError };
