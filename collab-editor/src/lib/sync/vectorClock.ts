/**
 * Vector Clock for distributed conflict detection.
 * Each node (user) maintains a counter. When merging, we take
 * the max of each element. This enables deterministic ordering of events.
 */
export type VectorClock = Record<string, number>;

export function createVectorClock(nodeId: string): VectorClock {
  return { [nodeId]: 0 };
}

export function incrementClock(clock: VectorClock, nodeId: string): VectorClock {
  return { ...clock, [nodeId]: (clock[nodeId] ?? 0) + 1 };
}

export function mergeClock(a: VectorClock, b: VectorClock): VectorClock {
  const merged: VectorClock = { ...a };
  for (const [node, count] of Object.entries(b)) {
    merged[node] = Math.max(merged[node] ?? 0, count);
  }
  return merged;
}

export type ClockComparison = 'before' | 'after' | 'concurrent' | 'equal';

export function compareClock(a: VectorClock, b: VectorClock): ClockComparison {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aLessOrEqual = true;
  let bLessOrEqual = true;

  for (const key of allKeys) {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    if (av > bv) bLessOrEqual = false;
    if (bv > av) aLessOrEqual = false;
  }

  if (aLessOrEqual && bLessOrEqual) return 'equal';
  if (aLessOrEqual) return 'before';
  if (bLessOrEqual) return 'after';
  return 'concurrent';
}
