export function calcPOT(v: number) {
  let pot: number = 0;

  // 求最近 2 次幂
  for (let i = 1; i < 32; i++) {
    const a = 1 << i;
    const b = 1 << (i + 1);

    if (a <= v && v < b) {
      pot = a;
      break;
    }
  }

  return pot;
}
