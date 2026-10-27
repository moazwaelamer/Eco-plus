import { z } from 'zod';

/** Cursor pagination: newest first. Pass the returned nextCursor to get the next page. */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.coerce.number().int().positive().optional(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export interface Page<T> {
  items: T[];
  nextCursor: number | null;
}

/** Takes rows fetched with `take: limit + 1` and builds the page. */
export function toPage<T extends { id: number }>(rows: T[], limit: number): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]!.id : null };
}
