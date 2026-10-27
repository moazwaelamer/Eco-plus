import type { Point } from '../common/geo.js';
import type { StopPoint } from './stop-order.js';

export const GOOGLE_MAX_INTERMEDIATES = 25;
const ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';

const waypoint = (p: Point) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });

/**
 * Asks Google Routes API for the best visiting order (round trip from `start`).
 * Throws when the answer is missing or not a permutation of the stops, so the caller can fall back.
 */
export async function orderWithGoogle(
  apiKey: string,
  start: Point,
  stops: StopPoint[],
  fetchImpl: typeof fetch = fetch,
): Promise<StopPoint[]> {
  if (stops.length === 0) return [];
  if (stops.length > GOOGLE_MAX_INTERMEDIATES) throw new Error('Too many stops for one Routes API request');

  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex',
    },
    body: JSON.stringify({
      origin: waypoint(start),
      destination: waypoint(start),
      intermediates: stops.map(waypoint),
      travelMode: 'DRIVE',
      optimizeWaypointOrder: true,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Routes API answered ${res.status}`);

  const body = (await res.json()) as { routes?: { optimizedIntermediateWaypointIndex?: number[] }[] };
  const indexes = body.routes?.[0]?.optimizedIntermediateWaypointIndex;
  const valid =
    Array.isArray(indexes) &&
    indexes.length === stops.length &&
    new Set(indexes).size === stops.length &&
    indexes.every((i) => Number.isInteger(i) && i >= 0 && i < stops.length);
  if (!valid) throw new Error('Routes API returned an unusable order');
  return indexes.map((i) => stops[i]!);
}
