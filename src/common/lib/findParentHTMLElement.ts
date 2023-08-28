export function findParentHTMLElement(from: Element, tester: (ele: Element) => boolean) {
  let cur: Element | null = from;

  for (let i = 0; i < 99 && cur; i++) {
    if (tester(cur)) return cur;
    cur = cur.parentElement;
  }
}
