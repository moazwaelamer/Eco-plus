import { orderWithGoogle } from './google-routes.js';

const stops = [
  { id: 1, lat: 30.01, lng: 31 },
  { id: 2, lat: 30.02, lng: 31 },
  { id: 3, lat: 30.03, lng: 31 },
];
const start = { lat: 30, lng: 31 };

const answer = (body: unknown, ok = true, status = 200) =>
  (async () => ({ ok, status, json: async () => body })) as unknown as typeof fetch;

describe('orderWithGoogle', () => {
  it('reorders stops using the optimized indexes', async () => {
    const f = answer({ routes: [{ optimizedIntermediateWaypointIndex: [2, 0, 1] }] });
    const out = await orderWithGoogle('key', start, stops, f);
    expect(out.map((s) => s.id)).toEqual([3, 1, 2]);
  });

  it('sends the key and asks for waypoint optimisation', async () => {
    let seen: { headers: Record<string, string>; body: string } | undefined;
    const f = (async (_url: string, init: { headers: Record<string, string>; body: string }) => {
      seen = init;
      return { ok: true, status: 200, json: async () => ({ routes: [{ optimizedIntermediateWaypointIndex: [0, 1, 2] }] }) };
    }) as unknown as typeof fetch;
    await orderWithGoogle('secret', start, stops, f);
    expect(seen?.headers['X-Goog-Api-Key']).toBe('secret');
    expect(JSON.parse(seen!.body).optimizeWaypointOrder).toBe(true);
  });

  it('rejects an error status', async () => {
    await expect(orderWithGoogle('key', start, stops, answer({}, false, 403))).rejects.toThrow('403');
  });

  it('rejects an order that is not a permutation', async () => {
    const f = answer({ routes: [{ optimizedIntermediateWaypointIndex: [0, 0, 1] }] });
    await expect(orderWithGoogle('key', start, stops, f)).rejects.toThrow('unusable');
  });

  it('refuses more than 25 stops', async () => {
    const many = Array.from({ length: 26 }, (_, i) => ({ id: i + 1, lat: 30, lng: 31 }));
    await expect(orderWithGoogle('key', start, many, answer({}))).rejects.toThrow('Too many');
  });
});
