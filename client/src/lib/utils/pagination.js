const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Pick a window of up to `max` page numbers centred on the current page
export function pageWindow(current, total, max = 5) {
  if (total <= max) return range(1, total);
  const start = Math.min(Math.max(1, current - Math.floor(max / 2)), total - max + 1);
  return range(start, start + max - 1);
}
