export function formatAnswer(value) {
  if (value === undefined || value === null) return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && 'fileName' in value) {
    return (
      <a href={value.url} target="_blank" rel="noreferrer" className="file-link">
        {value.fileName}
      </a>
    );
  }
  return String(value);
}
