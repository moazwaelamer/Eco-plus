import { paginationSchema, toPage } from './pagination.js';

describe('toPage', () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: 100 - i }));

  it('returns a cursor when there is another page', () => {
    const page = toPage(rows(4), 3); // fetched limit + 1
    expect(page.items).toHaveLength(3);
    expect(page.nextCursor).toBe(98);
  });

  it('returns no cursor on the last page', () => {
    expect(toPage(rows(3), 3).nextCursor).toBeNull();
    expect(toPage([], 3)).toEqual({ items: [], nextCursor: null });
  });
});

describe('paginationSchema', () => {
  it('defaults the limit to 20 and caps it at 50', () => {
    expect(paginationSchema.parse({}).limit).toBe(20);
    expect(paginationSchema.safeParse({ limit: '51' }).success).toBe(false);
    expect(paginationSchema.parse({ limit: '5', cursor: '7' })).toEqual({ limit: 5, cursor: 7 });
  });
});
