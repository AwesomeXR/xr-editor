export const reduceMultiContent = (
  list: (string | number)[],
  defaultValue = '<多个值>'
): { content: string; isReduced?: boolean } => {
  const set = new Set(list.map(d => d + ''));

  if (set.size === 1) return { content: list[0] + '' };
  return { content: defaultValue, isReduced: true };
};
