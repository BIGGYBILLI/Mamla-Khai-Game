// Pseudo-3D road renderer (Out Run style projection) tuned for a night
// stretch of the 300 Feet Road: canal water, sodium lamps, flyovers and traffic.
import { SEGMENT_LENGTH, ROAD_WIDTH, FIELD_OF_VIEW, MEDIAN_HALF } from './config.js';
import { SPRITES, SKYLINE, buildSkyline } from './sprites.js';
import { mix, clamp, lerp } from './utils.js';
import { drawVehicle } from './vehicles.js';

const FOG = '#0b0a16';

const C = {
  ground: '#080c0b',
  groundAlt: '#0a0f0d',
  water: '#04090f',
  waterAlt: '#061019',
  waterSheen: '#0d2430',
  shoulder: '#3b3b42',
  shoulderDark: '#2a2a30',
  road: '#24252b',
  roadAlt: '#202127',
  roadLit: '#33333a',
  rumbleA: '#d8a02a',
  rumbleB: '#131418',
  lane: '#d7dade',
  median: '#43444a',
  hedge: '#0f2615',
  wall: '#3d3d44',
  wallDark: '#2b2b31',
};

function project(p, cameraX, cameraY, cameraZ, cameraDepth, W, H, roadWidth) {
  p.camera.x = (p.world.x || 0) - cameraX;
  p.camera.y = (p.world.y || 0) - cameraY;
  p.camera.z = (p.world.z || 0) - cameraZ;
  const z = p.camera.z || -1;
  p.screen.scale = cameraDepth / z;
  p.screen.x = Math.round(W / 2 + (p.screen.scale * p.camera.x * W) / 2);
  p.screen.y = Math.round(H / 2 - (p.screen.scale * p.camera.y * H) / 2);
  p.screen.w = Math.round((p.screen.scale * roadWidth * W) / 2);
}

function quad(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.quality = { drawDistance: 210, stars: true };
    this.stars = [];
    this.skyGrad = null;
    this.horizonGrad = null;
    this.resize();

    for (let i = 0; i < 110; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.42,
        r: Math.random() * 1.5 + 0.4,
        a: Math.random() * 0.6 + 0.25,
        t: Math.random() * Math.PI * 2,
      });
    }
    buildSkyline();
  }

  resize() {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, cw < 860 ? 1.6 : 2);
    this.width = cw;
    this.height = ch;
    this.dpr = dpr;
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    this.canvas.style.width = cw + 'px';
    this.canvas.style.height = ch + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const small = cw < 860;
    this.quality.drawDistance = small ? 150 : cw < 1300 ? 190 : 220;
    this.buildGradients();
  }

  buildGradients() {
    const ctx = this.ctx;
    const { width: W, height: H } = this;
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    g.addColorStop(0, '#04030a');
    g.addColorStop(0.42, '#090718');
    g.addColorStop(0.72, '#1a1029');
    g.addColorStop(0.9, '#3a2033');
    g.addColorStop(1, '#4a2a30');
    this.skyGrad = g;

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.52, 0, W * 0.5, H * 0.52, W * 0.7);
    glow.addColorStop(0, 'rgba(255,150,70,0.20)');
    glow.addColorStop(0.4, 'rgba(190,90,110,0.09)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    this.horizonGrad = glow;
  }

  /* -------------------------------------------------------------- */

  render(state) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const road = state.road;
    const segments = road.segments;
    const count = segments.length;
    const drawDist = Math.min(this.quality.drawDistance, count);
    const cameraDepth = 1 / Math.tan(((FIELD_OF_VIEW / 2) * Math.PI) / 180);

    const base = road.segmentAt(state.position);
    const basePercent = (state.position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
    const playerY = lerp(base.p1.world.y, base.p2.world.y, basePercent);
    const veh = state.vehicle;
    const cameraHeight = playerY + veh.cameraHeight;
    const cameraZ = state.position;
    const playerX = state.playerX;
    const time = state.time || 0;

    ctx.save();
    // crash shake
    if (state.shake > 0) {
      const s = state.shake;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s * 0.7);
    }

    this.drawSky(state, time);

    // ---------------- road ----------------
    let maxy = H + 40;
    for (let n = 0; n < drawDist; n++) {
      const seg = segments[(base.index + n) % count];
      const looped = seg.index < base.index;
      seg.clip = maxy;
      const zOff = looped ? road.trackLength : 0;
      project(seg.p1, playerX * ROAD_WIDTH, cameraHeight, cameraZ - zOff, cameraDepth, W, H, ROAD_WIDTH);
      project(seg.p2, playerX * ROAD_WIDTH, cameraHeight, cameraZ - zOff, cameraDepth, W, H, ROAD_WIDTH);
      const p1 = seg.p1.screen;
      const p2 = seg.p2.screen;
      if (seg.p1.camera.z <= cameraDepth || p2.y >= p1.y || p2.y >= maxy) continue;

      const fog = Math.pow(n / drawDist, 1.55) * 0.95;
      seg.fog = fog;
      this.drawSegment(seg, p1, p2, fog, n, state);
      maxy = p2.y;
    }

    // ---------------- sprites ----------------
    for (let n = drawDist - 1; n >= 0; n--) {
      const seg = segments[(base.index + n) % count];
      if (seg.p1.camera.z <= cameraDepth) continue;
      if (seg.p1.screen.w <= 0) continue;
      this.drawSegmentSprites(seg, state);
    }

    this.drawCheckpointArray(state, base, count, road.trackLength);

    // ---------------- player ----------------
    this.drawPlayer(state, time);

    ctx.restore();
    this.drawOverlays(state, time);
  }

  /* -------------------------------------------------------------- */
  /*  SKY                                                            */
  /* -------------------------------------------------------------- */

  drawSky(state, time) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const horizon = H * 0.5;

    ctx.fillStyle = '#05040c';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = this.skyGrad;
    ctx.fillRect(0, 0, W, H * 0.64);

    ctx.fillStyle = this.horizonGrad;
    ctx.fillRect(0, 0, W, H * 0.64);

    // stars
    if (this.quality.stars) {
      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i];
        const tw = 0.65 + 0.35 * Math.sin(time * 1.4 + s.t);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = '#dfe8ff';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // moon
    const mx = W * 0.77;
    const my = H * 0.15;
    const mg = ctx.createRadialGradient(mx, my, 4, mx, my, 84);
    mg.addColorStop(0, 'rgba(255,246,220,0.55)');
    mg.addColorStop(0.25, 'rgba(255,240,210,0.14)');
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(mx, my, 84, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff5da';
    ctx.beginPath();
    ctx.arc(mx, my, 16, 0, Math.PI * 2);
    ctx.fill();

    // skyline layers
    const far = SKYLINE.far;
    const near = SKYLINE.near;
    if (far) {
      const fh = H * 0.2;
      const fw = fh * (far.width / far.height);
      ctx.globalAlpha = 0.85;
      for (let i = -1; i <= Math.ceil(W / fw) + 1; i++) {
        ctx.drawImage(far, i * fw, horizon - fh + 6, fw, fh);
      }
      ctx.globalAlpha = 1;
    }
    if (near) {
      const nh = H * 0.17;
      const nw = nh * (near.width / near.height);
      for (let i = -1; i <= Math.ceil(W / nw) + 1; i++) {
        ctx.drawImage(near, i * nw, horizon - nh + 10, nw, nh);
      }
    }

    // haze at horizon
    const hz = ctx.createLinearGradient(0, horizon - H * 0.09, 0, horizon + 4);
    hz.addColorStop(0, 'rgba(30,16,38,0)');
    hz.addColorStop(0.7, 'rgba(120,60,80,0.20)');
    hz.addColorStop(1, 'rgba(200,110,80,0.20)');
    ctx.fillStyle = hz;
    ctx.fillRect(0, horizon - H * 0.09, W, H * 0.09 + 4);
  }

  /* -------------------------------------------------------------- */
  /*  ROAD                                                           */
  /* -------------------------------------------------------------- */

  drawSegment(seg, p1, p2, fog, depth, state) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const x1 = p1.x;
    const y1 = p1.y;
    const w1 = p1.w;
    const x2 = p2.x;
    const y2 = p2.y;
    const w2 = p2.w;
    if (w1 <= 0 || w2 <= 0) return;

    const col = (c) => mix(c, FOG, fog);
    const alt = seg.color === 1;

    // ground + far city ground
    quad(ctx, x1 - w1 * 7, y1, x1 + w1 * 7, y1, x2 + w2 * 7, y2, x2 - w2 * 7, y2, col(alt ? C.groundAlt : C.ground));

    // canal water on both sides
    const wx = 1.08;
    const wo = 2.9;
    const water = col(alt ? C.waterAlt : C.water);
    quad(ctx, x1 - w1 * wo, y1, x1 - w1 * wx, y1, x2 - w2 * wx, y2, x2 - w2 * wo, y2, water);
    quad(ctx, x1 + w1 * wx, y1, x1 + w1 * wo, y1, x2 + w2 * wo, y2, x2 + w2 * wx, y2, water);

    // water shimmer
    if (depth % 5 === 0) {
      const sheen = col(C.waterSheen);
      ctx.globalAlpha = 0.5;
      quad(ctx, x1 - w1 * 2.2, y1, x1 - w1 * 2.0, y1, x2 - w2 * 2.0, y2, x2 - w2 * 2.2, y2, sheen);
      quad(ctx, x1 + w1 * 1.5, y1, x1 + w1 * 1.62, y1, x2 + w2 * 1.62, y2, x2 + w2 * 1.5, y2, sheen);
      ctx.globalAlpha = 1;
    }

    // retaining wall top / shoulder
    const wall = col(C.wall);
    const wallDark = col(C.wallDark);
    quad(ctx, x1 - w1 * 1.13, y1, x1 - w1 * 1.0, y1, x2 - w2 * 1.0, y2, x2 - w2 * 1.13, y2, wall);
    quad(ctx, x1 + w1 * 1.0, y1, x1 + w1 * 1.13, y1, x2 + w2 * 1.13, y2, x2 + w2 * 1.0, y2, wall);

    // wall shading lip
    ctx.globalAlpha = 0.55;
    quad(ctx, x1 - w1 * 1.135, y1, x1 - w1 * 1.11, y1, x2 - w2 * 1.11, y2, x2 - w2 * 1.135, y2, wallDark);
    quad(ctx, x1 + w1 * 1.11, y1, x1 + w1 * 1.135, y1, x2 + w2 * 1.135, y2, x2 + w2 * 1.11, y2, wallDark);
    ctx.globalAlpha = 1;

    // rumble strips (yellow / black hazard)
    const rumble = col(alt ? C.rumbleA : C.rumbleB);
    quad(ctx, x1 - w1, y1, x1 - w1 * 0.955, y1, x2 - w2 * 0.955, y2, x2 - w2, y2, rumble);
    quad(ctx, x1 + w1 * 0.955, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 * 0.955, y2, rumble);

    // road
    const road = alt ? C.roadAlt : C.road;
    quad(ctx, x1 - w1 * 0.955, y1, x1 + w1 * 0.955, y1, x2 + w2 * 0.955, y2, x2 - w2 * 0.955, y2, col(road));

    // sodium lamp pools spilling across the asphalt
    if (seg.lightPool) {
      ctx.globalAlpha = 0.1;
      quad(ctx, x1 - w1 * 0.95, y1, x1 + w1 * 0.95, y1, x2 + w2 * 0.95, y2, x2 - w2 * 0.95, y2, '#ffcf8a');
      ctx.globalAlpha = 1;
    }

    // road sheen (wet asphalt reflections)
    if (depth % 3 === 0) {
      ctx.globalAlpha = 0.16;
      quad(ctx, x1 - w1 * 0.7, y1, x1 - w1 * 0.2, y1, x2 - w2 * 0.2, y2, x2 - w2 * 0.7, y2, '#7f93a8');
      ctx.globalAlpha = 1;
    }

    // lane dashes
    if (depth % 6 < 3) {
      const laneCol = col(C.lane);
      const laneW = 0.008;
      for (const lx of [-0.7, -0.417, 0.417, 0.7]) {
        quad(
          ctx,
          x1 + w1 * (lx - laneW),
          y1,
          x1 + w1 * (lx + laneW),
          y1,
          x2 + w2 * (lx + laneW),
          y2,
          x2 + w2 * (lx - laneW),
          y2,
          laneCol
        );
      }
    }

    // median divider + hedge
    const mw = MEDIAN_HALF;
    quad(ctx, x1 - w1 * mw, y1, x1 + w1 * mw, y1, x2 + w2 * mw, y2, x2 - w2 * mw, y2, col(C.median));
    quad(
      ctx,
      x1 - w1 * mw * 0.66,
      y1,
      x1 + w1 * mw * 0.66,
      y1,
      x2 + w2 * mw * 0.66,
      y2,
      x2 - w2 * mw * 0.66,
      y2,
      col(C.hedge)
    );

  }

  /* -------------------------------------------------------------- */
  /*  SPRITES                                                        */
  /* -------------------------------------------------------------- */

  spriteBox(sprite, seg) {
    const W = this.width;
    const H = this.height;
    const w1 = seg.p1.screen.w;
    if (!sprite || !w1) return null;
    const hpx = w1 * sprite.worldH * (H / W);
    if (hpx < 1.2) return null;
    const img = sprite.canvas;
    const wpx = (hpx * img.width) / img.height;
    return { img, hpx, wpx, anchorX: sprite.anchorX === undefined ? 0.5 : sprite.anchorX };
  }

  blitSprite(sprite, seg, offsetX, opacity, extra) {
    const box = this.spriteBox(sprite, seg);
    if (!box) return;
    const fogFade = 1 - (seg.fog || 0) * 0.9;
    opacity = opacity === undefined ? fogFade : opacity * fogFade;
    if (opacity < 0.02) return;
    const W = this.width;
    const H = this.height;
    const { img, hpx, wpx, anchorX } = box;
    if (hpx > this.height * 1.05) return; // passing directly beside the camera
    const x = seg.p1.screen.x + offsetX * seg.p1.screen.w - wpx * anchorX;
    const y = seg.p1.screen.y - hpx;
    if (x + wpx < -wpx || x > W + wpx) return;

    const clipY = seg.clip;
    let drawH = hpx;
    let srcH = img.height;
    if (y + hpx > clipY) {
      const vis = clipY - y;
      if (vis <= 0) return;
      drawH = vis;
      srcH = img.height * (vis / hpx);
    }
    const ctx = this.ctx;
    ctx.save();
    if (opacity < 1) ctx.globalAlpha = opacity;
    if (extra && extra.rotate) {
      ctx.translate(x + wpx / 2, y + drawH);
      ctx.rotate(extra.rotate);
      ctx.drawImage(img, 0, 0, img.width, srcH, -wpx / 2, -drawH, wpx, drawH);
    } else {
      ctx.drawImage(img, 0, 0, img.width, srcH, x, y, wpx, drawH);
    }
    ctx.restore();
  }

  drawSegmentSprites(seg, state) {
    const ctx = this.ctx;
    const sprites = seg.sprites;
    const time = state.time || 0;

    for (let i = 0; i < sprites.length; i++) {
      const s = sprites[i];
      let entry = SPRITES[s.key];
      if (s.signal !== undefined && state.signalStates) {
        entry = SPRITES[`signal${state.signalStates[s.signal]}`] || entry;
      }
      if (!entry) continue;
      // lamps beyond the draw distance fade out
      this.blitSprite(entry, seg, s.x, 1);
    }

    // checkpoint props attached to this segment
    if (state.checkpointProps) {
      const props = state.checkpointProps.get(seg.index);
      if (props) {
        for (const p of props) {
          const entry = SPRITES[p.key];
          if (!entry) continue;
          let x = p.x;
          if (p.rush) {
            const d = state.checkpoint ? state.checkpoint.distance : 99999;
            const t = clamp(1 - d / 2600, 0, 1);
            x += (state.playerX - p.x) * t * 0.55;
          }
          this.blitSprite(entry, seg, x, p.opacity === undefined ? 1 : p.opacity, p.rotate ? { rotate: p.rotate } : null);
        }
      }
    }

    // traffic
    for (let i = 0; i < seg.cars.length; i++) {
      const car = seg.cars[i];
      const entry = SPRITES[car.sprite];
      if (!entry) continue;
      let x = car.x;
      if (car.hit) x += Math.sin(time * 2 + car.z) * 0.002;
      // a wrecked car fades away as it is cleared off the road
      const alpha = car.hit ? clamp(car.fade, 0, 1) : 1;
      this.blitSprite(entry, seg, x, alpha, car.hit ? { rotate: car.tilt || 0 } : null);
      if (car.hit && alpha > 0.5) this.drawSmoke(seg, car);
    }
  }

  drawSmoke(seg, car) {
    const ctx = this.ctx;
    const box = this.spriteBox(SPRITES.carRear0, seg);
    if (!box) return;
    const baseX = seg.p1.screen.x + car.x * seg.p1.screen.w;
    const baseY = seg.p1.screen.y;
    // the wreck's own fade is its age: 0 at impact, 1 when it is gone
    const age = 1 - clamp(car.fade, 0, 1);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const p = (i / n + age) % 1;
      const radius = box.wpx * (0.12 + p * 0.4);
      const x = baseX + Math.sin(i * 2.4 + age * 7) * box.wpx * 0.18;
      const y = baseY - box.hpx * (0.2 + p * 0.9);
      ctx.globalAlpha = (1 - p) * 0.35;
      ctx.fillStyle = '#8b8f96';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* checkpoint markers that don't sit on a scenery segment */
  drawCheckpointArray(state, base, count, trackLength) {
    const cp = state.checkpoint;
    if (!cp || !cp.markerSeg) return;
    const seg = state.road.segments[cp.markerSeg];
    if (!seg) return;
    if (seg.p1.camera.z <= 0.8) return;
    const s = SPRITES.officer;
    const box = this.spriteBox(s, seg);
    if (!box) return;
    const ctx = this.ctx;
    const bottom = seg.p1.screen.y - box.hpx * 0.98;
    const left = seg.p1.screen.x + cp.markerX * seg.p1.screen.w;
    const bob = Math.sin((state.time || 0) * 5) * box.hpx * 0.06;
    const size = Math.max(8, box.wpx * 0.3);
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#ffb524';
    ctx.shadowColor = 'rgba(255,181,36,0.9)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(left - size, bottom - size * 1.2 + bob);
    ctx.lineTo(left + size, bottom - size * 1.2 + bob);
    ctx.lineTo(left, bottom - size * 0.2 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* -------------------------------------------------------------- */
  /*  PLAYER                                                         */
  /* -------------------------------------------------------------- */

  drawPlayer(state, time) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const veh = state.vehicle;
    const speedPct = clamp(state.speed / veh.worldMax, 0, 1);

    // Same scale as the traffic: a car roughly one car-length ahead. Small
    // enough that the road in front of the bonnet stays readable.
    const baseW = veh.id === 'bike' ? 0.16 : 0.24;
    let width = Math.min(W * baseW, H * 0.33);
    width = Math.max(width, 92);

    const bounce = Math.sin(time * 12 + state.position * 0.0006) * (0.6 + speedPct * 1.4);
    const tilt = state.steer * 0.05 + (state.playerX - state.prevPlayerX || 0) * 1.4;
    const cx = W / 2 + state.steer * W * 0.012;
    const baseY = H * 0.985 + bounce;

    // headlight pool on the road ahead
    const pool = ctx.createRadialGradient(W / 2, H * 0.8, 10, W / 2, H * 0.8, W * 0.55);
    pool.addColorStop(0, 'rgba(255,232,180,0.16)');
    pool.addColorStop(0.4, 'rgba(255,215,150,0.07)');
    pool.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = pool;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);

    drawVehicle(ctx, veh.id, cx, baseY, width, {
      tilt,
      bounce: bounce * 0.4,
      people: state.setup.people,
      helmet: state.setup.helmet,
    });

    // engine smoke once the bodywork is shot
    const life = state.life === undefined ? 100 : state.life;
    if (life <= 35) {
      const intensity = clamp(1 - life / 35, 0.15, 1);
      for (let i = 0; i < 5; i++) {
        const p = (time * 0.55 + i / 5) % 1;
        const r = width * (0.02 + p * 0.07) * (0.7 + intensity * 0.6);
        const x = cx + width * 0.24 + Math.sin(time * 1.7 + i * 1.3) * width * 0.04;
        const y = baseY - width * 0.16 - p * width * 0.5;
        ctx.globalAlpha = (1 - p) * intensity * 0.32;
        ctx.fillStyle = '#9aa0a8';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  /* -------------------------------------------------------------- */
  /*  OVERLAYS                                                       */
  /* -------------------------------------------------------------- */

  drawOverlays(state, time) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;

    // vignette
    if (!this.vignette || this.vignetteW !== W) {
      const v = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.95);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.55)');
      this.vignette = v;
      this.vignetteW = W;
    }
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, W, H);

    // siren wash near checkpoints
    const cp = state.checkpoint;
    if (cp && cp.distance < 7000 && cp.distance > -200) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 7);
      const a = (1 - cp.distance / 7000) * 0.25;
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, `rgba(255,40,50,${a * pulse})`);
      g.addColorStop(0.35, 'rgba(255,40,50,0)');
      g.addColorStop(0.65, `rgba(60,110,255,${a * (1 - pulse)})`);
      g.addColorStop(1, `rgba(60,110,255,${a * (1 - pulse)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // speed streaks
    const speedPct = clamp(state.speed / state.vehicle.worldMax, 0, 1);
    if (speedPct > 0.62) {
      const alpha = (speedPct - 0.62) * 0.5;
      ctx.strokeStyle = `rgba(220,235,255,${alpha * 0.5})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const seed = (i * 97.13 + Math.floor(time * 18 + i) * 13.7) % 100;
        const side = i % 2 ? 1 : -1;
        const x = W / 2 + side * (W * (0.18 + (seed % 40) / 100));
        const y = (seed / 100) * H * 0.9;
        const len = H * (0.05 + speedPct * 0.12) * ((seed % 13) / 13 + 0.4);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + side * 4, y + len);
        ctx.stroke();
      }
    }

    // flash (journalist / police camera)
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${clamp(state.flash, 0, 1) * 0.75})`;
      ctx.fillRect(0, 0, W, H);
    }

    // crash red tint
    if (state.hurtFlash > 0) {
      ctx.fillStyle = `rgba(255,60,40,${clamp(state.hurtFlash, 0, 1) * 0.22})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
