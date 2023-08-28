export function getInternalRandomString(short?: boolean) {
  // prettier-ignore
  const a = Math.random().toString(32).slice(2, 7);
  if (short) return a;

  const b = new Date().valueOf().toString(32);
  return [a, b].join('');
}
