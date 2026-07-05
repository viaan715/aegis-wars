import { queryOne, queryAll } from './db.js';

export async function questionsForForm(formId) {
  const rows = await queryAll('SELECT * FROM questions WHERE form_id = $1 ORDER BY order_index ASC', [formId]);
  return rows.map((q) => ({ ...q, options: JSON.parse(q.options || '[]'), required: !!q.required }));
}

export async function serializeForm(form) {
  // COUNT(*) comes back as a string from pg (it's a bigint on the wire) — coerce to a number.
  const row = await queryOne('SELECT COUNT(*) AS n FROM responses WHERE form_id = $1', [form.id]);
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
    responseCount: Number(row.n),
  };
}
