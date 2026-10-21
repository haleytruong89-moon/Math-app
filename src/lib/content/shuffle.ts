// S5: the order in which C2 lines and C3 choices are shown. Deterministic (seeded by the item id), so the server
// can map a shown position back to the authored one; never the identity, so the authored (right) order never shows.
// Pure and dependency-free: it is also bundled for the browser through grade.ts.

/** FNV-1a, 32 bit. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 */
function rng(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `order[p]` = the authored index shown at position p. */
export function displayOrder(seed: string, n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  const r = rng(hash(seed));
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (n >= 2 && order.every((v, i) => v === i)) order.push(order.shift()!);
  return order;
}
