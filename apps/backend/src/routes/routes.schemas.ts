import { z } from 'zod';
import { latSchema, lngSchema } from '../common/geo.js';
import { paginationSchema } from '../common/pagination.js';
import { GOOGLE_MAX_INTERMEDIATES } from './google-routes.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const shipmentIds = z.array(z.number().int().positive()).min(1).max(GOOGLE_MAX_INTERMEDIATES);
const unique = (ids: number[]) => new Set(ids).size === ids.length;

export const createRouteSchema = z.object({
  driverId: z.number().int().positive(),
  vehicleId: z.number().int().positive(),
  routeDate: isoDate,
  shipmentIds: shipmentIds.refine(unique, 'Each shipment can appear once'),
  /** Where the driver starts (for example the warehouse). Without it the first shipment starts the route. */
  start: z.object({ lat: latSchema, lng: lngSchema }).optional(),
});

export const reorderRouteSchema = z.object({
  shipmentIds: shipmentIds.refine(unique, 'Each shipment can appear once'),
});

export const listRoutesSchema = paginationSchema.extend({
  date: isoDate.optional(),
  driverId: z.coerce.number().int().positive().optional(),
  status: z.enum(['planned', 'in_progress', 'done']).optional(),
});

export const driverRoutesSchema = z.object({ date: isoDate.optional() });

export const collectStopSchema = z.object({
  handoverCode: z.string().regex(/^[0-9]{6}$/, 'The code has 6 digits'),
});

export type CreateRouteDto = z.infer<typeof createRouteSchema>;
export type ReorderRouteDto = z.infer<typeof reorderRouteSchema>;
export type ListRoutesDto = z.infer<typeof listRoutesSchema>;
export type DriverRoutesDto = z.infer<typeof driverRoutesSchema>;
export type CollectStopDto = z.infer<typeof collectStopSchema>;
