import { boundingBox, distanceMeters } from './geo.js';

describe('distanceMeters', () => {
  it('is zero for the same point', () => {
    expect(distanceMeters({ lat: 30.05, lng: 31.23 }, { lat: 30.05, lng: 31.23 })).toBe(0);
  });

  it('measures Cairo to Giza about right', () => {
    const d = distanceMeters({ lat: 30.0444, lng: 31.2357 }, { lat: 30.0131, lng: 31.2089 });
    expect(d).toBeGreaterThan(4000);
    expect(d).toBeLessThan(5000);
  });

  it('about 111 m per 0.001 degrees of latitude', () => {
    const d = distanceMeters({ lat: 30, lng: 31 }, { lat: 30.001, lng: 31 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
});

describe('boundingBox', () => {
  it('contains points inside the radius', () => {
    const c = { lat: 30.05, lng: 31.23 };
    const box = boundingBox(c, 150);
    const near = { lat: 30.0508, lng: 31.2308 };
    expect(distanceMeters(c, near)).toBeLessThan(150);
    expect(near.lat).toBeGreaterThan(box.minLat);
    expect(near.lat).toBeLessThan(box.maxLat);
    expect(near.lng).toBeGreaterThan(box.minLng);
    expect(near.lng).toBeLessThan(box.maxLng);
  });
});
