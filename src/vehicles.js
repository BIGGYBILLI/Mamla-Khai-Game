// The player's ride, drawn as vector art from behind (third person).
// Used both in the live scene and for the setup previews.
import { roundRectPath, clamp } from './utils.js';

const DESIGN = { car: 340, bike: 210 };

function shadow(ctx, width) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.6);
  g.addColorStop(0, 'rgba(0,0,0,0.62)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.scale(1, 0.18);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function headlightBloom(ctx) {
  const g = ctx.createRadialGradient(0, -30, 6, 0, -30, 130);
  g.addColorStop(0, 'rgba(255,240,198,0.20)');
  g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, -30, 130, 0, Math.PI * 2);
  ctx.fill();
}

function drawCar(ctx, opts) {
  const people = opts.people || 1;
  shadow(ctx, 340);

  // wheels
  for (const sx of [-1, 1]) {
    ctx.fillStyle = '#08090d';
    roundRectPath(ctx, sx * 120 - 30, -66, 60, 64, 12);
    ctx.fill();
    ctx.fillStyle = '#1d2027';
    roundRectPath(ctx, sx * 120 - 22, -54, 44, 30, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRectPath(ctx, sx * 120 - 14, -50, 28, 8, 4);
    ctx.fill();
  }

  // body
  const body = ctx.createLinearGradient(0, -196, 0, -40);
  body.addColorStop(0, '#e0665a');
  body.addColorStop(0.35, '#b8392f');
  body.addColorStop(0.8, '#6d1d19');
  body.addColorStop(1, '#2c0d0c');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-154, -54);
  ctx.quadraticCurveTo(-166, -104, -146, -128);
  ctx.lineTo(-112, -142);
  ctx.lineTo(-92, -186);
  ctx.quadraticCurveTo(0, -206, 92, -186);
  ctx.lineTo(112, -142);
  ctx.lineTo(146, -128);
  ctx.quadraticCurveTo(166, -104, 154, -54);
  ctx.quadraticCurveTo(0, -26, -154, -54);
  ctx.closePath();
  ctx.fill();

  // rear glass
  const glass = ctx.createLinearGradient(0, -186, 0, -128);
  glass.addColorStop(0, '#2c3d52');
  glass.addColorStop(0.55, '#121b27');
  glass.addColorStop(1, '#070b11');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(-80, -180);
  ctx.lineTo(80, -180);
  ctx.lineTo(104, -136);
  ctx.lineTo(-104, -136);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,195,235,0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-62, -174);
  ctx.lineTo(26, -174);
  ctx.stroke();

  // passengers in the back window
  if (people > 1) {
    const visible = Math.min(3, people - 1);
    for (let i = 0; i < visible; i++) {
      const px = -46 + i * 46;
      ctx.fillStyle = 'rgba(12,16,22,0.75)';
      ctx.beginPath();
      ctx.arc(px, -158, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(20,26,34,0.7)';
      roundRectPath(ctx, px - 19, -146, 38, 14, 6);
      ctx.fill();
    }
  }

  // spoiler
  ctx.fillStyle = '#1a0d0c';
  roundRectPath(ctx, -130, -158, 260, 12, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.fillRect(-128, -157, 256, 3);

  // tail lights
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.shadowColor = 'rgba(255,40,20,0.95)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ff3b22';
    roundRectPath(ctx, sx * 92 - 34, -118, 68, 24, 9);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,190,170,0.9)';
    roundRectPath(ctx, sx * 92 - 24, -112, 26, 8, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,235,225,0.55)';
    roundRectPath(ctx, sx * 92 + 4, -112, 22, 8, 4);
    ctx.fill();
  }

  // plate + bumper
  ctx.fillStyle = '#e7e2d6';
  roundRectPath(ctx, -46, -92, 92, 30, 5);
  ctx.fill();
  ctx.fillStyle = '#20242a';
  ctx.font = 'bold 13px "Hind Siliguri", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ঢাকা-গ ৩০০', 0, -72);

  ctx.fillStyle = '#14161b';
  roundRectPath(ctx, -140, -62, 280, 22, 9);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(-134, -60, 268, 3);

  // exhaust
  ctx.fillStyle = '#2a2d34';
  roundRectPath(ctx, -150, -46, 26, 12, 5);
  ctx.fill();
  roundRectPath(ctx, 124, -46, 26, 12, 5);
  ctx.fill();

  headlightBloom(ctx);
}

function drawBike(ctx, opts) {
  shadow(ctx, 200);
  const people = opts.people || 1;
  const riders = clamp(people, 1, 4);

  // rear wheel
  ctx.fillStyle = '#07080b';
  roundRectPath(ctx, -26, -120, 52, 120, 22);
  ctx.fill();
  ctx.fillStyle = '#171a20';
  roundRectPath(ctx, -18, -104, 36, 92, 16);
  ctx.fill();
  ctx.fillStyle = '#2a2f39';
  roundRectPath(ctx, -9, -92, 18, 66, 8);
  ctx.fill();

  // exhaust + swingarm
  ctx.fillStyle = '#4a4f58';
  roundRectPath(ctx, 20, -62, 44, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#22262d';
  ctx.beginPath();
  ctx.moveTo(-20, -66);
  ctx.lineTo(30, -54);
  ctx.lineTo(30, -44);
  ctx.lineTo(-20, -56);
  ctx.closePath();
  ctx.fill();

  // pillion riders — shifted to the sides so a triple ride is obvious
  for (let i = riders - 1; i >= 1; i--) {
    const off = i * 16;
    const px = (i % 2 ? 1 : -1) * 26;
    ctx.fillStyle = i % 2 ? '#51406a' : '#3a4a63';
    roundRectPath(ctx, px - 25, -166 - off, 50, 64, 17);
    ctx.fill();
    ctx.fillStyle = i % 2 ? '#22262f' : '#1d222b';
    roundRectPath(ctx, px - 22, -116 - off, 18, 30, 8);
    ctx.fill();
    ctx.fillStyle = i % 2 ? '#4c3a58' : '#36465c';
    ctx.beginPath();
    ctx.arc(px, -174 - off, 19, 0, Math.PI * 2);
    ctx.fill();
    if (opts.helmet) {
      ctx.fillStyle = '#101318';
      ctx.beginPath();
      ctx.ellipse(px, -176 - off, 21, 21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,180,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(px, -180 - off, 13, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#5b3d2c';
      ctx.beginPath();
      ctx.arc(px, -176 - off, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a1d15';
      ctx.beginPath();
      ctx.arc(px, -184 - off, 17, Math.PI, 0);
      ctx.fill();
    }
  }

  // rider legs
  ctx.fillStyle = '#1b1f27';
  roundRectPath(ctx, -34, -88, 26, 62, 10);
  ctx.fill();
  roundRectPath(ctx, 8, -88, 26, 62, 10);
  ctx.fill();

  // rider torso
  const jacket = ctx.createLinearGradient(0, -196, 0, -80);
  jacket.addColorStop(0, '#5b80ad');
  jacket.addColorStop(0.5, '#3b5480');
  jacket.addColorStop(1, '#1d2839');
  ctx.fillStyle = jacket;
  ctx.beginPath();
  ctx.moveTo(-32, -80);
  ctx.quadraticCurveTo(-46, -164, -22, -186);
  ctx.quadraticCurveTo(0, -196, 22, -186);
  ctx.quadraticCurveTo(46, -164, 32, -80);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(170,215,255,0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-27, -168);
  ctx.lineTo(-29, -104);
  ctx.stroke();

  // arms
  ctx.strokeStyle = '#3a5372';
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-24, -170);
  ctx.lineTo(-52, -132);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(24, -170);
  ctx.lineTo(52, -132);
  ctx.stroke();

  // backpack
  ctx.fillStyle = '#2c2438';
  roundRectPath(ctx, -24, -168, 48, 60, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRectPath(ctx, -20, -164, 40, 22, 8);
  ctx.fill();

  // helmet
  ctx.fillStyle = '#0f1319';
  ctx.beginPath();
  ctx.ellipse(0, -200, 34, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  if (opts.helmet) {
    ctx.fillStyle = 'rgba(120,190,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, -206, 23, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-8, -212, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb524';
    ctx.fillRect(-34, -204, 68, 5);
  } else {
    // bare head
    ctx.fillStyle = '#6a4832';
    ctx.beginPath();
    ctx.arc(0, -198, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1d15';
    ctx.beginPath();
    ctx.arc(0, -206, 25, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,190,0.12)';
    ctx.beginPath();
    ctx.ellipse(0, -196, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // tail light
  ctx.save();
  ctx.shadowColor = 'rgba(255,40,24,0.95)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ff3a22';
  roundRectPath(ctx, -16, -136, 32, 15, 6);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,210,200,0.8)';
  roundRectPath(ctx, -9, -132, 18, 5, 2);
  ctx.fill();

  // plate
  ctx.fillStyle = '#e7e2d6';
  roundRectPath(ctx, -22, -112, 44, 16, 3);
  ctx.fill();
  ctx.fillStyle = '#20242a';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ঢাকা-হ ১১', 0, -100);

  headlightBloom(ctx);
}

const RENDERERS = { car: drawCar, bike: drawBike };

/**
 * Draw a vehicle centred at cx, resting on baseY, `width` pixels wide.
 */
export function drawVehicle(ctx, id, cx, baseY, width, opts = {}) {
  const dw = DESIGN[id] || 320;
  const scale = width / dw;
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.rotate(opts.tilt || 0);
  ctx.scale(scale, scale);
  ctx.translate(0, opts.bounce || 0);
  (RENDERERS[id] || drawCar)(ctx, opts);
  ctx.restore();
}

export function vehicleWidthRatio(id) {
  return id === 'bike' ? 0.42 : 0.66;
}

const ART_HEIGHT = { car: 218, bike: 252 };

/** Width (px) that keeps the whole ride inside a maxWidth x maxHeight box. */
export function previewWidth(id, maxHeight, maxWidth) {
  const designW = DESIGN[id] || 320;
  const artH = ART_HEIGHT[id] || 220;
  const scale = Math.min(maxWidth / designW, maxHeight / artH);
  return designW * scale;
}
