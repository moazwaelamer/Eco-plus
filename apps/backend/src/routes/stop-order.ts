import { type Point, distanceMeters } from '../common/geo.js';

export interface StopPoint extends Point {
  id: number;
}

/**
 * Greedy nearest-neighbour order: always drive to the closest stop that is left.
 * Starts from `start` when given, otherwise from the first stop in the list.
 * Not optimal, but simple, predictable and fast; Google Routes API replaces it when a key is set.
 */
export function nearestNeighbourOrder(stops: StopPoint[], start?: Point): StopPoint[] {
  const left = [...stops];
  const ordered: StopPoint[] = [];
  let current: Point | undefined = start;
  if (!current) {
    const first = left.shift();
    if (!first) return [];
    ordered.push(first);
    current = first;
  }
  while (left.length > 0) {
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < left.length; i++) {
      const d = distanceMeters(current, left[i]!);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    const [next] = left.splice(best, 1);
    ordered.push(next!);
    current = next!;
  }
  return ordered;
}
