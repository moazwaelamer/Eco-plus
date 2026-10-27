import { z } from 'zod';

export const latSchema = z.number().min(-90).max(90);
export const lngSchema = z.number().min(-180).max(180);
