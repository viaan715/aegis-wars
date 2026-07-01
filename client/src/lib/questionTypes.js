export const QUESTION_TYPES = [
  { type: 'short_text', tag: 'ABC', label: 'Short answer', hint: 'A single line of text' },
  { type: 'long_text', tag: 'PARA', label: 'Long answer', hint: 'A multi-line paragraph' },
  { type: 'number', tag: '123', label: 'Number', hint: 'A numeric value' },
  { type: 'email', tag: '@', label: 'Email', hint: 'A valid email address' },
  { type: 'multiple_choice', tag: 'ONE', label: 'Multiple choice', hint: 'Pick exactly one option' },
  { type: 'checkboxes', tag: 'MANY', label: 'Checkboxes', hint: 'Pick any number of options' },
  { type: 'dropdown', tag: 'LIST', label: 'Dropdown', hint: 'Pick one from a dropdown list' },
  { type: 'rating', tag: '1-5', label: 'Rating', hint: 'A 1 to 5 star rating' },
  { type: 'scale', tag: '0-10', label: 'Linear scale', hint: 'A 0 to 10 scale (e.g. NPS)' },
  { type: 'date', tag: 'DATE', label: 'Date', hint: 'A calendar date' },
  { type: 'file_upload', tag: 'FILE', label: 'File upload', hint: 'Respondents attach a file' },
];

export const CHOICE_TYPES = new Set(['multiple_choice', 'checkboxes', 'dropdown']);

export function questionMeta(type) {
  return QUESTION_TYPES.find((q) => q.type === type);
}

export function blankQuestion(type) {
  return {
    id: `new-${Math.random().toString(36).slice(2, 10)}`,
    type,
    label: '',
    description: '',
    options: CHOICE_TYPES.has(type) ? ['Option 1', 'Option 2'] : [],
    required: false,
  };
}
