import { nearestNeighbourOrder } from './stop-order.js';

const stop = (id: number, lat: number, lng: number) => ({ id, lat, lng });

describe('nearestNeighbourOrder', () => {
  it('returns nothing for no stops', () => {
    expect(nearestNeighbourOrder([])).toEqual([]);
  });

  it('visits stops along a line in order, starting from the given point', () => {
    const stops = [stop(3, 30.03, 31), stop(1, 30.01, 31), stop(2, 30.02, 31)];
    expect(nearestNeighbourOrder(stops, { lat: 30, lng: 31 }).map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it('starts from the first stop when there is no start point', () => {
    const stops = [stop(5, 30.03, 31), stop(6, 30.01, 31), stop(7, 30.02, 31)];
    expect(nearestNeighbourOrder(stops).map((s) => s.id)).toEqual([5, 7, 6]);
  });

  it('keeps every stop exactly once and does not change the input', () => {
    const stops = [stop(1, 30.1, 31.1), stop(2, 30.5, 31.5), stop(3, 30.2, 31.2), stop(4, 30.3, 31.9)];
    const copy = [...stops];
    const out = nearestNeighbourOrder(stops, { lat: 30, lng: 31 });
    expect(out.map((s) => s.id).sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    expect(stops).toEqual(copy);
  });
});
