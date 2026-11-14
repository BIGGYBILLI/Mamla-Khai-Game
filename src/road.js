// Track construction: a long looping dual carriageway with curves, lamps,
// buildings, palms and signals.
import { SEGMENT_LENGTH, RUMBLE_LENGTH, ROAD_WIDTH, TRACK_SEGMENTS, LANE_X } from './config.js';
import { rand } from './utils.js';

export class Road {
  constructor() {
    this.segments = [];
    this.signals = [420, 1180, 1960, 2620];
    this.build();
    this.trackLength = this.segments.length * SEGMENT_LENGTH;
    this.addScenery();
  }

  build() {
    const segs = this.segments;
    const lastY = () => (segs.length ? segs[segs.length - 1].p2.world.y : 0);

    const add = (curve) => {
      const n = segs.length;
      const y = lastY();
      segs.push({
        index: n,
        p1: { world: { x: 0, y, z: n * SEGMENT_LENGTH }, camera: {}, screen: {} },
        p2: { world: { x: 0, y, z: (n + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} },
        curve,
        sprites: [],
        cars: [],
        clip: 0,
        lightPool: false,
        color: Math.floor(n / RUMBLE_LENGTH) % 2,
      });
    };

    const straight = (n) => {
      for (let i = 0; i < n; i++) add(0);
    };

    const curve = (n, c) => {
      for (let i = 0; i < n; i++) add(c);
    };

    const easeCurve = (n, c) => {
      const half = Math.floor(n / 2);
      for (let i = 0; i < n; i++) {
        const t = i < half ? i / half : (n - i) / (n - half);
        add(c * t);
      }
    };

    let flip = 1;
    straight(160);
    while (segs.length < TRACK_SEGMENTS - 200) {
      straight(Math.round(rand(60, 150)));
      const strength = rand(0.9, 2.6) * flip;
      curve(Math.round(rand(70, 130)), strength * 0.55);
      easeCurve(Math.round(rand(70, 120)), strength);
      straight(Math.round(rand(80, 170)));
      flip *= -1;
      if (Math.random() < 0.4) {
        curve(Math.round(rand(60, 120)), strength * 0.4);
      }
    }
    while (segs.length < TRACK_SEGMENTS) straight(1);
  }

  addScenery() {
    const segs = this.segments;
    const total = segs.length;

    for (let i = 0; i < total; i++) {
      const seg = segs[i];

      if (i % 6 === 0) {
        seg.sprites.push({ key: 'lampL', x: -1.44, y: 0 });
        seg.sprites.push({ key: 'lampR', x: 1.44, y: 0 });
        for (let k = 0; k < 3; k++) {
          const s = segs[(i + k) % total];
          s.lightPool = true;
        }
      }

      if (i % 9 === 4) {
        const side = i % 18 === 4 ? -1 : 1;
        seg.sprites.push({ key: 'palm', x: side * rand(1.55, 2.1), y: 0 });
      }

      if (i % 13 === 0) {
        const side = i % 26 === 0 ? -1 : 1;
        seg.sprites.push({
          key: `building${(i / 13) % 5 | 0}`,
          x: side * (2.7 + (Math.floor(i / 13) % 3) * 0.8),
          y: 0,
        });
      }

      if (i % 97 === 30) {
        seg.sprites.push({ key: 'billboard0', x: -1.92, y: 0 });
      }
      if (i % 131 === 74) {
        seg.sprites.push({ key: 'billboard1', x: 1.95, y: 0 });
      }
      if (i % 173 === 120) {
        seg.sprites.push({ key: 'billboard2', x: -2.0, y: 0 });
      }

      for (const s of this.signals || []) {
        if (i === s) {
          seg.sprites.push({ key: 'signalGreen', x: -1.1, y: 0, signal: s });
        }
      }
    }
  }

  segmentAt(z) {
    const total = this.segments.length;
    const i = Math.floor(z / SEGMENT_LENGTH) % total;
    return this.segments[(i + total) % total];
  }

  segmentIndexAt(z) {
    const total = this.segments.length;
    const i = Math.floor(z / SEGMENT_LENGTH) % total;
    return (i + total) % total;
  }

  laneCenter(side, lane) {
    return (side === 'left' ? LANE_X.left : LANE_X.right)[lane];
  }
}

export { ROAD_WIDTH };
