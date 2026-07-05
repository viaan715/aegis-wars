import db from './db.js';

export function questionsForForm(formId) {
  return db
    .prepare('SELECT * FROM questions WHERE form_id = ? ORDER BY order_index ASC')
    .all(formId)
    .map((q) => ({ ...q, options: JSON.parse(q.options || '[]'), required: !!q.required }));
}

export function serializeForm(form) {
  const responseCount = db
    .prepare('SELECT COUNT(*) AS n FROM responses WHERE form_id = ?')
    .get(form.id).n;
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    slug: form.slug,
    layout: form.layout,
    themeColor: form.theme_color,
    status: form.status,
    thankYouTitle: form.thank_you_title,
    thankYouMessage: form.thank_you_message,
    createdAt: form.created_at,
    updatedAt: form.updated_at,
    responseCount,
  };
}
