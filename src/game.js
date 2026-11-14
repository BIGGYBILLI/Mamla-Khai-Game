import {
  VEHICLES,
  SEGMENT_LENGTH,
  MEDIAN_HALF,
  LANE_X,
  FINE_RULES,
} from './config.js';
import { createLedger, addFine, setFine, applySetupFines, buildBill, ledgerTotal } from './fines.js';
import { clamp, rand, pick, signedDelta } from './utils.js';

const KMH_FACTOR = 0.004; // world units -> metres, roughly
const MAX_LIFE = 100;

// half-length in world units, used for the bumper-to-bumper collision test
const TRAFFIC_HALF_L = { car: 440, bus: 900, truck: 820, rickshaw: 360, bike: 220 };

const TRAFFIC_KINDS = [
  { kind: 'car', weight: 5, width: 0.075, rear: ['carRear0', 'carRear1', 'carRear2', 'carRear3', 'carRear4'], front: ['carFront0', 'carFront1', 'carFront2', 'carFront3', 'carFront4'] },
  { kind: 'bus', weight: 2, width: 0.105, rear: ['busRear'], front: ['busFront'] },
  { kind: 'truck', weight: 2, width: 0.1, rear: ['truckRear'], front: ['truckFront'] },
  { kind: 'rickshaw', weight: 3, width: 0.07, rear: ['rickshawRear'], front: ['rickshawFront'] },
  { kind: 'bike', weight: 2, width: 0.042, rear: ['bikeRear'], front: ['bikeFront'] },
];

// One fixed cruise speed per lane, in world units per second (12000 = 180 km/h).
// Every car in a lane travels at exactly that speed, so nobody ever closes the
// gap on the car in front — traffic keeps its line and never swaps paint.
// Kerb lane is the slowest, the median lane the quickest, as on the real road.
const TRAFFIC_LANES = [
  { x: LANE_X.left[0], speed: 2900 },  // ~44 km/h
  { x: LANE_X.left[1], speed: 3700 },  // ~56 km/h
  { x: LANE_X.left[2], speed: 4500 },  // ~68 km/h
  { x: LANE_X.right[0], speed: -2900 },
  { x: LANE_X.right[1], speed: -3700 },
  { x: LANE_X.right[2], speed: -4500 },
];
const TRAFFIC_PER_LANE = 2;      // cars kept ahead in every lane
const TRAFFIC_SEED_FROM = 14000; // first car ahead of the player
const TRAFFIC_SEED_TO = 120000;  // last one at the start of a run
const TRAFFIC_MIN_GAP = 16000;   // a lane never holds two cars closer than this
const TRAFFIC_SPAWN_MIN = 52000; // new cars appear beyond the draw distance
const TRAFFIC_SPAWN_MAX = 120000;
const TRAFFIC_DESPAWN_BEHIND = -2500; // once behind you, a car is gone for good
const TRAFFIC_WRECK_FADE = 0.7;       // seconds a wreck takes to clear off the road

// Every checkpost blocks the driver's own carriageway only. The escape is
// either the gap left on the far left, or the oncoming lanes.
const CHECKPOINTS = {
  1: { blocked: [[-0.6, -0.02]], officer: -0.03, hint: 'toast.checkpostGap' },
  2: { blocked: [[-1.0, -0.42]], officer: -0.44, hint: 'toast.checkpostGap' },
  3: { blocked: [[-1.0, -0.7], [-0.48, -0.02]], officer: -0.5, hint: 'toast.checkpostGap' },
  4: { blocked: [[-1.0, -0.02]], officer: -0.03, hint: 'toast.checkpostBlock' },
};

function weightedKind() {
  const total = TRAFFIC_KINDS.reduce((s, k) => s + k.weight, 0);
  let r = Math.random() * total;
  for (const k of TRAFFIC_KINDS) {
    r -= k.weight;
    if (r <= 0) return k;
  }
  return TRAFFIC_KINDS[0];
}

export class Game {
  constructor({ road, audio, on }) {
    this.road = road;
    this.audio = audio;
    this.on = on || {};
    this.segments = road.segments;
    this.trackLength = road.trackLength;

    this.phase = 'menu';
    this.paused = false;
    this.vehicleId = 'car';
    this.vehicle = VEHICLES.car;
    this.setup = { people: 1, seatbelt: true, helmet: true, license: true };

    this.position = 12000;
    this.prevPlayerX = -0.5;
    this.playerX = -0.5;
    this.speed = 0;
    this.steer = 0;
    this.time = 0;
    this.distance = 0;
    this.shake = 0;
    this.flash = 0;
    this.hurtFlash = 0;
    this.life = MAX_LIFE;

    this.traffic = [];
    this.checkpoint = null;
    this.checkpointProps = null;
    this.signalStates = {};
    this.signalRel = {};
    this.ledger = createLedger();
    this.lastLedgerVersion = -1;
    this.finalBill = null;

    this.checkpointsPassed = 0;
    this.crashes = 0;
  }

  /* ------------------------------------------------------------------ */

  start(vehicleId, setup) {
    const veh = VEHICLES[vehicleId] || VEHICLES.car;
    this.vehicleId = veh.id;
    this.vehicle = veh;
    this.setup = {
      people: clamp(Math.round(setup.people || 1), 1, veh.maxPeople),
      seatbelt: setup.seatbelt !== false,
      helmet: setup.helmet !== false,
      license: setup.license !== false,
    };

    this.phase = 'playing';
    this.paused = false;
    this.position = 12000;
    this.playerX = -0.56;
    this.prevPlayerX = this.playerX;
    this.speed = 0;
    this.steer = 0;
    this.distance = 0;
    this.topSpeed = 0;
    this.maxKmh = 0;
    this.shake = 0;
    this.flash = 0;
    this.hurtFlash = 0;
    this.life = MAX_LIFE;
    this.lowLifeWarned = false;
    this.crashes = 0;
    this.checkpointsPassed = 0;
    this.resultShown = false;
    this.stopTimer = 0;
    this.wreckTimer = 0;
    this.nextCheckpointAt = 55000;
    this.checkpoint = null;
    this.checkpointProps = null;
    this.finalBill = null;
    this.wrongSideT = 0;
    this.wrongSideFlag = false;
    this.wrongSideCooldown = 0;
    this.roughSwings = [];
    this.roughCooldown = 0;
    this.signalRel = {};
    this.overspeedFlagged = false;
    this.lastLedgerVersion = -1;
    this.ledger = createLedger();
    applySetupFines(this.ledger, veh.id, this.setup);

    for (const s of this.road.signals) {
      this.signalRel[s] = signedDelta(s * SEGMENT_LENGTH, this.position, this.trackLength);
    }

    this.resetTraffic();
    this.updateSignalStates();
    this.audio?.startEngine();
  }

  resetTraffic() {
    for (const seg of this.segments) seg.cars.length = 0;
    this.traffic = [];
    const slot = (TRAFFIC_SEED_TO - TRAFFIC_SEED_FROM) / TRAFFIC_PER_LANE;
    for (let lane = 0; lane < TRAFFIC_LANES.length; lane++) {
      for (let i = 0; i < TRAFFIC_PER_LANE; i++) {
        const car = this.makeCar(lane, TRAFFIC_SEED_FROM + i * slot + rand(-1500, 1500));
        this.traffic.push(car);
        this.attachCar(car);
      }
    }
  }

  makeCar(lane, rel) {
    const spec = weightedKind();
    const def = TRAFFIC_LANES[lane];
    const oncoming = def.speed < 0;
    const z = ((this.position + rel) % this.trackLength + this.trackLength) % this.trackLength;
    return {
      lane,
      z,
      x: def.x,
      kind: spec.kind,
      width: spec.width,
      sprite: pick(oncoming ? spec.front : spec.rear),
      speed: def.speed,
      oncoming,
      hit: false,
      fade: 1,
      tilt: 0,
      segIdx: Math.floor(z / SEGMENT_LENGTH) % this.segments.length,
      rel,
    };
  }

  attachCar(car) {
    const seg = this.segments[car.segIdx];
    if (seg && !seg.cars.includes(car)) seg.cars.push(car);
  }

  // A car you have overtaken is unloaded for good — it is never recycled back
  // onto the road. Only cars ahead of you exist.
  removeCar(car) {
    const seg = this.segments[car.segIdx];
    if (seg) {
      const i = seg.cars.indexOf(car);
      if (i >= 0) seg.cars.splice(i, 1);
    }
    const idx = this.traffic.indexOf(car);
    if (idx >= 0) this.traffic.splice(idx, 1);
  }

  // New traffic only ever appears far ahead, beyond the draw distance, so it
  // can never pop in beside the player and no seen car ever drives again.
  spawnCar(lane) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const rel = rand(TRAFFIC_SPAWN_MIN, TRAFFIC_SPAWN_MAX);
      const clash = this.traffic.some((other) => other.lane === lane && Math.abs(other.rel - rel) < TRAFFIC_MIN_GAP);
      if (clash) continue;
      const car = this.makeCar(lane, rel);
      this.traffic.push(car);
      this.attachCar(car);
      return car;
    }
    return null;
  }

  refillLanes() {
    const counts = new Array(TRAFFIC_LANES.length).fill(0);
    for (const car of this.traffic) counts[car.lane]++;
    for (let lane = 0; lane < counts.length; lane++) {
      while (counts[lane] < TRAFFIC_PER_LANE && this.spawnCar(lane)) counts[lane]++;
    }
  }

  /* ------------------------------------------------------------------ */

  get kmh() {
    return (this.speed / this.vehicle.worldMax) * this.vehicle.topKmh;
  }

  get lifePct() {
    return clamp(this.life / MAX_LIFE, 0, 1);
  }

  updateSignalStates() {
    const states = {};
    for (const s of this.road.signals) {
      const phase = (this.time + s * 0.013) % 13;
      states[s] = phase < 5.4 ? 'Red' : phase < 11.8 ? 'Green' : 'Amber';
    }
    this.signalStates = states;
  }

  update(dt, input) {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt * 3.2);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.2);
    this.shake = Math.max(0, this.shake - dt * 60);
    if (this.roughCooldown > 0) this.roughCooldown -= dt;
    if (this.wrongSideCooldown > 0) this.wrongSideCooldown -= dt;

    if (this.phase === 'stopped') return this.updateStopped(dt);
    if (this.phase === 'wrecked') return this.updateWrecked(dt);
    if (this.phase !== 'playing') return;

    const veh = this.vehicle;
    const maxSpeed = veh.worldMax;
    const speedPct = this.speed / maxSpeed;
    this.prevPlayerX = this.playerX;

    // ---- steering ----
    const steerTarget = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.steer += (steerTarget - this.steer) * Math.min(1, dt * 11);
    const steerPower = dt * 2.05 * veh.steer * (0.4 + 0.6 * speedPct);
    this.playerX += steerPower * this.steer;

    // Gentle centrifugal pull — a little softer on the bike.
    const ahead = this.road.segmentAt(this.position + 1200);
    const centrifugalScale = this.vehicleId === 'bike' ? 0.05 : 0.06;
    this.playerX -= dt * speedPct * speedPct * ahead.curve * centrifugalScale;

    // median hop
    if ((this.prevPlayerX < 0 && this.playerX >= 0) || (this.prevPlayerX > 0 && this.playerX <= 0)) {
      this.speed *= 0.9;
      this.shake = Math.max(this.shake, 5);
    }

    const offroad = Math.abs(this.playerX) > 1.02;
    if (Math.abs(this.playerX) > 1.14) {
      this.playerX = clamp(this.playerX, -1.14, 1.14);
      this.speed *= 0.985;
      this.shake = Math.max(this.shake, 3);
    }

    // ---- speed: gentle pull, long run to the top ----
    if (input.gas) this.speed += veh.accel * dt;
    else this.speed -= veh.decel * dt;
    if (input.brake) this.speed -= veh.brake * dt;
    if (offroad) this.speed -= veh.offroadDecel * dt;
    this.speed = clamp(this.speed, 0, maxSpeed);

    // ---- advance ----
    this.position += this.speed * dt;
    this.distance += this.speed * dt;
    if (this.position >= this.trackLength) this.position -= this.trackLength;
    if (this.topSpeed < this.speed) this.topSpeed = this.speed;
    if (this.kmh > this.maxKmh) this.maxKmh = this.kmh;

    // The skyline is fixed scenery: it never slides sideways, at any speed.
    this.updateSignalStates();
    this.updateTraffic(dt);
    this.checkTrafficCollisions();
    if (this.phase !== 'playing') return;
    this.checkSignals();
    this.checkWrongSide(dt, speedPct);
    this.checkRoughDriving(dt, speedPct);
    this.checkSpeeding();
    this.updateCheckpoint(dt);

    this.audio?.setEngine(speedPct, true);

    if (this.ledger.version !== this.lastLedgerVersion) {
      this.lastLedgerVersion = this.ledger.version;
      this.on.fine?.(this.ledger);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  pulled over at a checkpost                                         */
  /* ------------------------------------------------------------------ */

  updateStopped(dt) {
    this.stopTimer += dt;
    this.speed = 0;
    this.updateTraffic(dt);

    const tick = Math.floor(this.stopTimer * 3);
    if (tick !== this.lastFlashTick) {
      this.lastFlashTick = tick;
      this.flash = 0.7;
      this.audio?.flash();
    }

    // The police and the reporters have boxed the car in. It stays stopped and
    // the run ends here — the bodywork may be fine, but you are not driving on.
    if (this.stopTimer > 3 && !this.resultShown) {
      this.resultShown = true;
      this.phase = 'result';
      this.speed = 0;
      this.checkpoint = null;
      this.finalBill = buildBill(this.ledger, this.setup);
      this.audio?.stopSiren();
      this.audio?.stopEngine();
      this.on.result?.(this.finalBill, this.stats());
    }
  }

  /* ------------------------------------------------------------------ */
  /*  out of life                                                        */
  /* ------------------------------------------------------------------ */

  updateWrecked(dt) {
    this.wreckTimer += dt;
    this.speed = 0;
    this.updateTraffic(dt);

    const tick = Math.floor(this.wreckTimer * 3);
    if (tick !== this.lastFlashTick) {
      this.lastFlashTick = tick;
      this.flash = 0.8;
      this.audio?.flash();
    }

    if (this.wreckTimer > 3.2 && !this.resultShown) {
      this.resultShown = true;
      this.phase = 'result';
      this.audio?.stopSiren();
      this.audio?.stopEngine();
      this.on.result?.(this.finalBill, this.stats());
    }
  }

  wreck() {
    if (this.phase !== 'playing') return;
    this.phase = 'wrecked';
    this.wreckTimer = 0;
    this.lastFlashTick = -1;
    this.speed = 0;
    this.shake = 26;
    this.flash = 1;
    this.hurtFlash = 1;
    this.checkpoint = null;

    const total = this.segments.length;
    const props = new Map();
    const addProp = (idx, prop) => {
      const key = ((idx % total) + total) % total;
      if (!props.has(key)) props.set(key, []);
      props.get(key).push(prop);
    };
    const seg = this.road.segmentIndexAt(this.position) + 6;
    const px = clamp(this.playerX, -0.75, 0.75);
    addProp(seg, { key: 'officer', x: px - 0.17 });
    addProp(seg, { key: 'journalist', x: px + 0.13, rush: true });
    addProp(seg - 1, { key: 'journalist', x: px + 0.3, rush: true });
    addProp(seg, { key: 'policeCar', x: px - 0.62 });
    this.checkpointProps = props;

    this.finalBill = buildBill(this.ledger, this.setup);
    this.audio?.stopEngine();
    this.audio?.crash(1);
    this.audio?.startSiren();
    this.on.toast?.('toast.wreck', null, 'bad');
    this.on.fine?.(this.ledger);
  }

  /* ------------------------------------------------------------------ */

  updateTraffic(dt) {
    const total = this.segments.length;
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      car.z += car.speed * dt;
      if (car.z >= this.trackLength) car.z -= this.trackLength;
      if (car.z < 0) car.z += this.trackLength;

      const rel = signedDelta(car.z, this.position, this.trackLength);
      car.rel = rel;

      // A car you hit is wrecked: it fades out and is taken off the road. It
      // must never be met a second time.
      if (car.hit) {
        car.fade -= dt / TRAFFIC_WRECK_FADE;
        if (car.fade <= 0) {
          this.removeCar(car);
          continue;
        }
      }

      // Behind the player means it is gone for good — nothing is recycled.
      if (rel < TRAFFIC_DESPAWN_BEHIND) {
        this.removeCar(car);
        continue;
      }

      const idx = Math.floor(car.z / SEGMENT_LENGTH) % total;
      if (idx !== car.segIdx) {
        const old = this.segments[car.segIdx];
        if (old) {
          const k = old.cars.indexOf(car);
          if (k >= 0) old.cars.splice(k, 1);
        }
        car.segIdx = idx;
        this.attachCar(car);
      }
    }
    this.refillLanes();
  }

  checkTrafficCollisions() {
    const veh = this.vehicle;
    for (const car of this.traffic) {
      if (car.hit) continue;
      // Only a car still ahead of your nose can be hit. The moment you are
      // level with a vehicle you have passed it, so it can never reach back
      // and hit you while you complete the overtake.
      if (car.rel <= 0) continue;
      // Bumper-to-bumper along the road: only a real overlap counts.
      const reach = (veh.hitL + (TRAFFIC_HALF_L[car.kind] || 400)) * 0.62;
      if (car.rel > reach) continue;
      // Side-by-side: the box belongs to the vehicle you are riding, so a bike
      // slips through gaps a car cannot.
      const gap = Math.abs(car.x - this.playerX);
      if (gap > veh.hitW + car.width * 0.55) continue;
      this.crash(car);
    }
  }

  crash(car) {
    car.hit = true;
    car.fade = 1;
    car.tilt = (Math.random() - 0.5) * 0.6;
    const push = Math.sign(car.x - this.playerX || 1) * 0.06;
    car.x = clamp(car.x + push, -0.9, 0.9);
    // It keeps rolling at its lane speed: stalling it here would let the car
    // behind drive straight through it.

    const impact = clamp(Math.abs(this.speed) / this.vehicle.worldMax, 0.25, 1);
    const damage = Math.round(1200 + impact * 5200 + Math.random() * 1800);
    this.speed *= 0.4;
    this.shake = 16 + impact * 12;
    this.hurtFlash = 1;
    this.crashes++;

    this.life = Math.max(0, this.life - (8 + impact * 14));

    addFine(this.ledger, 'accident', FINE_RULES.accident.amount, 'detail.accident', { kind: car.kind });
    addFine(this.ledger, 'damage', damage, 'detail.damage', { kind: car.kind });

    this.audio?.crash(0.6 + impact * 0.5);
    this.on.toast?.('toast.crash', { kind: car.kind, amount: damage }, 'bad');

    if (this.life <= 0) {
      this.wreck();
      return;
    }
    if (!this.lowLifeWarned && this.life <= 30) {
      this.lowLifeWarned = true;
      this.on.toast?.('toast.lifeLow', null, 'bad');
    }
  }

  checkSignals() {
    for (const s of this.road.signals) {
      const z = s * SEGMENT_LENGTH;
      const rel = signedDelta(z, this.position, this.trackLength);
      const prev = this.signalRel[s];
      this.signalRel[s] = rel;
      if (prev === undefined) continue;
      if (prev > 0 && rel <= 0) {
        const state = this.signalStates[s];
        if (state !== 'Green' && this.kmh > 22) {
          setFine(this.ledger, 'signal', FINE_RULES.signal.amount, 'detail.signal');
          this.on.toast?.('toast.signal', null, 'bad');
        }
      }
    }
  }

  checkWrongSide(dt, speedPct) {
    const wrong = this.playerX > MEDIAN_HALF + 0.015 && speedPct > 0.08;
    if (wrong) {
      this.wrongSideT += dt;
      if (this.wrongSideT > 0.9 && !this.wrongSideFlag && this.wrongSideCooldown <= 0) {
        this.wrongSideFlag = true;
        this.wrongSideCooldown = 8;
        addFine(this.ledger, 'wrongSide', FINE_RULES.wrongSide.amount, 'detail.wrongSide');
        this.on.toast?.('toast.wrongSide', null, 'bad');
      }
    } else {
      this.wrongSideT = Math.max(0, this.wrongSideT - dt * 2);
      if (this.wrongSideT === 0) this.wrongSideFlag = false;
    }
  }

  checkRoughDriving(dt, speedPct) {
    if (speedPct < 0.55) {
      this.roughSwings.length = 0;
      return;
    }
    const dir = Math.sign(this.steer);
    if (Math.abs(this.steer) < 0.65) return;
    const last = this.roughSwings[this.roughSwings.length - 1];
    if (!last || last.dir !== dir) {
      if (last && last.dir !== dir) {
        this.roughSwings.push({ dir, t: this.time });
      } else if (!last) {
        this.roughSwings.push({ dir, t: this.time });
      }
    }
    this.roughSwings = this.roughSwings.filter((s) => this.time - s.t < 1.6);
    if (this.roughSwings.length >= 3 && this.roughCooldown <= 0) {
      this.roughCooldown = 7;
      this.roughSwings.length = 0;
      addFine(this.ledger, 'rough', FINE_RULES.rough.amount, 'detail.rough');
      this.on.toast?.('toast.rough', null, 'bad');
    }
  }

  checkSpeeding() {
    const limit = this.vehicle.limit;
    if (this.maxKmh > limit + 3) {
      const over = Math.round(this.maxKmh - limit);
      setFine(this.ledger, 'overspeed', 3000 + over * 120, 'detail.overspeed', {
        kmh: Math.round(this.maxKmh),
        limit,
      });
      if (!this.overspeedFlagged) {
        this.overspeedFlagged = true;
        this.on.toast?.('toast.overspeed', { kmh: Math.round(this.maxKmh) }, 'bad');
      }
    }
  }

  /* ------------------------------------------------------------------ */

  checkpointLevel() {
    return Math.min(4, 1 + Math.floor(this.checkpointsPassed / 2));
  }

  updateCheckpoint(dt) {
    if (!this.checkpoint) {
      if (this.distance > this.nextCheckpointAt) this.spawnCheckpoint();
      return;
    }
    const cp = this.checkpoint;
    cp.distance = signedDelta(cp.z, this.position, this.trackLength);

    // paparazzi flashes as the checkpost gets close
    if (cp.distance > 0 && cp.distance < 15000 && Math.random() < dt * 1.1) {
      this.flash = Math.max(this.flash, 0.3);
      this.audio?.flash();
    }

    if (!cp.resolved && cp.distance <= 0) {
      cp.resolved = true;
      const hit = cp.blocked.some(([a, b]) => this.playerX > a - 0.03 && this.playerX < b + 0.03);
      if (hit) this.stopAtCheckpoint(cp);
      else this.evadeCheckpoint(cp);
    }
  }

  spawnCheckpoint() {
    const level = this.checkpointLevel();
    const config = CHECKPOINTS[level];
    const z = (this.position + 34000) % this.trackLength;
    const segIndex = this.road.segmentIndexAt(z);
    const props = new Map();
    const total = this.segments.length;

    const addProp = (idx, prop) => {
      const key = ((idx % total) + total) % total;
      if (!props.has(key)) props.set(key, []);
      props.get(key).push(prop);
    };

    // advertisement barricades straight across the driver's carriageway
    for (const [a, b] of config.blocked) {
      const width = b - a;
      const boxes = Math.max(2, Math.round(width / 0.22));
      for (let i = 0; i < boxes; i++) {
        const bx = a + (width / boxes) * (i + 0.5);
        addProp(segIndex, { key: `adBox${i % 3}`, x: bx });
      }
      addProp(segIndex - 1, { key: 'cone', x: a + 0.03 });
      addProp(segIndex - 1, { key: 'cone', x: b - 0.03 });
    }

    addProp(segIndex, { key: 'officer', x: config.officer });
    addProp(segIndex - 1, { key: 'journalist', x: config.officer - 0.13, rush: true });
    addProp(segIndex - 1, { key: 'journalist', x: config.officer + 0.11, rush: true });
    addProp(segIndex - 2, { key: 'journalist', x: config.officer + 0.3, rush: true });
    addProp(segIndex, { key: 'policeCar', x: -1.36 });

    this.checkpoint = {
      level,
      z,
      segIndex,
      blocked: config.blocked,
      distance: 34000,
      resolved: false,
      markerSeg: segIndex,
      markerX: config.officer,
    };
    this.checkpointProps = props;
    this.nextCheckpointAt = this.distance + 1e9;
    this.audio?.startSiren();
    this.on.toast?.('toast.checkpost', { level, hint: config.hint }, 'info');
  }

  evadeCheckpoint(cp) {
    this.checkpointsPassed++;
    addFine(this.ledger, 'fled', FINE_RULES.fled.amount, 'detail.fled', { level: cp.level });
    this.on.toast?.('toast.evaded', null, 'good');
    this.audio?.beep(880, 0.12, 'triangle', 0.06);
    this.audio?.stopSiren();
    this.checkpoint = null;
    this.checkpointProps = null;
    this.nextCheckpointAt = this.distance + rand(90000, 130000);
  }

  stopAtCheckpoint(cp) {
    this.phase = 'stopped';
    this.stopTimer = 0;
    this.lastFlashTick = -1;
    this.resultShown = false;
    // Dead stop against the barricade — the car never rolls on from here.
    this.speed = 0;
    this.steer = 0;
    this.position = (cp.z - 140 + this.trackLength) % this.trackLength;
    this.playerX = clamp(this.playerX, -1, 1);
    this.shake = 20;
    this.flash = 0.9;
    this.hurtFlash = 0.8;
    cp.markerSeg = null;

    // Officers and reporters close in and hold the car where it is.
    const total = this.segments.length;
    const props = this.checkpointProps || new Map();
    const addProp = (idx, prop) => {
      const key = ((idx % total) + total) % total;
      if (!props.has(key)) props.set(key, []);
      props.get(key).push(prop);
    };
    const px = clamp(this.playerX, -0.82, 0.82);
    addProp(cp.segIndex, { key: 'officer', x: px - 0.2 });
    addProp(cp.segIndex, { key: 'journalist', x: px + 0.16, rush: true });
    addProp(cp.segIndex, { key: 'journalist', x: px + 0.32, rush: true });
    addProp(cp.segIndex + 1, { key: 'journalist', x: px - 0.35, rush: true });
    addProp(cp.segIndex, { key: 'policeCar', x: px - 0.75 });
    this.checkpointProps = props;

    addFine(this.ledger, 'noStop', FINE_RULES.noStop.amount, 'detail.noStop');
    this.audio?.crash(0.55);
    this.audio?.challan();
    this.audio?.startSiren();
    this.on.toast?.('toast.caught', null, 'bad');
    this.on.fine?.(this.ledger);
  }

  stats() {
    return {
      vehicle: this.vehicleId,
      vehicleId: this.vehicleId,
      distance: Math.round(this.distance * KMH_FACTOR),
      topSpeed: Math.round(this.maxKmh),
      checkpoints: this.checkpointsPassed,
      crashes: this.crashes,
      people: this.setup.people,
      license: this.setup.license,
    };
  }

  totalFine() {
    return ledgerTotal(this.ledger);
  }

  /* ------------------------------------------------------------------ */
  /*  attract mode for the title screen                                  */
  /* ------------------------------------------------------------------ */

  startAttract() {
    this.start('car', { people: 1, seatbelt: true, helmet: true, license: true });
    this.phase = 'menu';
    this.speed = 5400;
    this.life = MAX_LIFE;
    this.checkpoint = null;
    this.checkpointProps = null;
    this.ledger = createLedger();
    this.audio?.stopEngine();
  }

  updateAttract(dt) {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.speed = 5400;
    this.position += this.speed * dt;
    if (this.position >= this.trackLength) this.position -= this.trackLength;
    this.playerX = -0.5 + Math.sin(this.time * 0.34) * 0.2;
    this.steer = Math.cos(this.time * 0.34) * 0.3;
    this.updateSignalStates();
    this.updateTraffic(dt);
  }
}
