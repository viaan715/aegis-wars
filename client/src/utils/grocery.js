export function groupByCategory(items) {
  const groups = {};
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}
