export const formatSize = (size: number, base = 1000): string => {
  if (size < base) return size + '';
  if (size < base * base) return (size / base).toFixed(2) + 'K';
  if (size < base * base * base) return (size / base / base).toFixed(2) + 'M';
  if (size < base * base * base * base) return (size / base / base / base).toFixed(2) + 'G';
  return size + '';
};
