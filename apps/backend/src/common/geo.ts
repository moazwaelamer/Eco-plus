import { z } from 'zod';

export const latSchema = z.number().min(-90).max(90);
export const lngSchema = z.number().min(-180).max(180);

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface Point {
  lat: number;
  lng: number;
}

/** Straight-line distance between two coordinates in metres (haversine). */
export function distanceMeters(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rough box around a point, used to pre-filter rows in SQL before the exact distance check. */
export function boundingBox(center: Point, radiusM: number) {
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLng = dLat / Math.max(0.01, Math.cos(toRad(center.lat)));
  return { minLat: center.lat - dLat, maxLat: center.lat + dLat, minLng: center.lng - dLng, maxLng: center.lng + dLng };
}
