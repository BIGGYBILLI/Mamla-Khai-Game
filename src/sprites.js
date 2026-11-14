// All scenery, traffic and characters are drawn procedurally into offscreen
// canvases once at boot. The renderer just blits them.
import { roundRectPath, rand, clamp } from './utils.js';

export const SPRITES = {};

function mk(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext('2d');
  draw(ctx, c.width, c.height);
  return c;
}

function reg(key, canvas, worldH, anchorX = 0.5) {
  SPRITES[key] = { canvas, worldH, anchorX };
  return SPRITES[key];
}

function glow(ctx, x, y, r, color, inner = 0.9) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = inner;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ------------------------------------------------------------------ */
/*  TRAFFIC                                                            */
/* ------------------------------------------------------------------ */

function rearCar(body, accent) {
  return mk(240, 184, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 8, 98, 9, 'rgba(0,0,0,0.45)');

    // wheels
    ctx.fillStyle = '#08090d';
    roundRectPath(ctx, 20, 136, 42, 38, 9);
    ctx.fill();
    roundRectPath(ctx, 178, 136, 42, 38, 9);
    ctx.fill();
    ctx.fillStyle = '#1b1d24';
    roundRectPath(ctx, 27, 146, 28, 16, 5);
    ctx.fill();
    roundRectPath(ctx, 185, 146, 28, 16, 5);
    ctx.fill();

    const g = ctx.createLinearGradient(0, 70, 0, 172);
    g.addColorStop(0, accent);
    g.addColorStop(0.5, body);
    g.addColorStop(1, '#101116');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(28, 158);
    ctx.quadraticCurveTo(20, 128, 30, 112);
    ctx.lineTo(52, 102);
    ctx.lineTo(64, 66);
    ctx.quadraticCurveTo(120, 58, 176, 66);
    ctx.lineTo(188, 102);
    ctx.lineTo(210, 112);
    ctx.quadraticCurveTo(220, 128, 212, 158);
    ctx.quadraticCurveTo(120, 172, 28, 158);
    ctx.closePath();
    ctx.fill();

    // rear glass
    const gl = ctx.createLinearGradient(0, 66, 0, 106);
    gl.addColorStop(0, '#202b3a');
    gl.addColorStop(1, '#0a0e15');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.moveTo(74, 70);
    ctx.lineTo(166, 70);
    ctx.lineTo(180, 100);
    ctx.lineTo(60, 100);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,190,230,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(84, 74);
    ctx.lineTo(140, 74);
    ctx.stroke();

    // tail lights
    ctx.save();
    ctx.shadowColor = 'rgba(255,40,24,0.95)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ff3a22';
    roundRectPath(ctx, 40, 112, 46, 15, 6);
    ctx.fill();
    roundRectPath(ctx, 154, 112, 46, 15, 6);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffd0c8';
    roundRectPath(ctx, 46, 116, 16, 6, 3);
    ctx.fill();
    roundRectPath(ctx, 160, 116, 16, 6, 3);
    ctx.fill();

    // plate + bumper
    ctx.fillStyle = '#d9dde2';
    roundRectPath(ctx, 96, 134, 50, 17, 3);
    ctx.fill();
    ctx.fillStyle = '#22262c';
    ctx.fillRect(102, 140, 38, 3);
    ctx.fillRect(102, 145, 26, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRectPath(ctx, 34, 158, 172, 12, 5);
    ctx.fill();
  });
}

function frontCar(body, accent) {
  return mk(240, 184, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 8, 98, 9, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = '#08090d';
    roundRectPath(ctx, 20, 136, 42, 38, 9);
    ctx.fill();
    roundRectPath(ctx, 178, 136, 42, 38, 9);
    ctx.fill();

    const g = ctx.createLinearGradient(0, 70, 0, 172);
    g.addColorStop(0, accent);
    g.addColorStop(0.45, body);
    g.addColorStop(1, '#0d0e13');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(28, 158);
    ctx.quadraticCurveTo(20, 128, 30, 112);
    ctx.lineTo(52, 102);
    ctx.lineTo(64, 66);
    ctx.quadraticCurveTo(120, 58, 176, 66);
    ctx.lineTo(188, 102);
    ctx.lineTo(210, 112);
    ctx.quadraticCurveTo(220, 128, 212, 158);
    ctx.quadraticCurveTo(120, 172, 28, 158);
    ctx.closePath();
    ctx.fill();

    // headlights
    ctx.save();
    ctx.shadowColor = 'rgba(255,238,190,0.95)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#fff3cf';
    roundRectPath(ctx, 36, 108, 48, 20, 8);
    ctx.fill();
    roundRectPath(ctx, 156, 108, 48, 20, 8);
    ctx.fill();
    ctx.restore();
    glow(ctx, 60, 118, 34, 'rgba(255,240,200,0.5)', 0.7);
    glow(ctx, 180, 118, 34, 'rgba(255,240,200,0.5)', 0.7);

    // windshield
    ctx.fillStyle = 'rgba(20,28,40,0.9)';
    ctx.beginPath();
    ctx.moveTo(70, 68);
    ctx.lineTo(170, 68);
    ctx.lineTo(184, 100);
    ctx.lineTo(56, 100);
    ctx.closePath();
    ctx.fill();
    // grille
    ctx.fillStyle = '#0a0b10';
    roundRectPath(ctx, 92, 132, 56, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#b9bdc4';
    ctx.fillRect(96, 137, 48, 3);
    ctx.fillRect(96, 144, 48, 3);
  });
}

function busRear(color) {
  return mk(260, 330, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 8, 108, 10, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = '#08090d';
    roundRectPath(ctx, 18, 268, 48, 54, 10);
    ctx.fill();
    roundRectPath(ctx, 194, 268, 48, 54, 10);
    ctx.fill();

    const g = ctx.createLinearGradient(0, 20, 0, 300);
    g.addColorStop(0, color);
    g.addColorStop(0.6, '#2a2b26');
    g.addColorStop(1, '#14150f');
    ctx.fillStyle = g;
    roundRectPath(ctx, 14, 18, 232, 288, 10);
    ctx.fill();

    // painted band
    ctx.fillStyle = 'rgba(255,196,60,0.75)';
    ctx.fillRect(14, 214, 232, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(14, 230, 232, 5);

    // lit rear window
    const wg = ctx.createLinearGradient(0, 44, 0, 128);
    wg.addColorStop(0, 'rgba(255,208,110,0.85)');
    wg.addColorStop(1, 'rgba(140,96,40,0.7)');
    ctx.fillStyle = wg;
    roundRectPath(ctx, 34, 40, 192, 92, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,14,8,0.55)';
    for (let i = 0; i < 3; i++) ctx.fillRect(48 + i * 62, 44, 8, 84);

    // destination board
    ctx.fillStyle = '#0d0f0c';
    roundRectPath(ctx, 48, 142, 164, 26, 3);
    ctx.fill();
    ctx.fillStyle = '#ffcf66';
    ctx.font = 'bold 17px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ঢাকা মেট্রো', 130, 161);

    // rear grille + lights
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(28, 182, 204, 24);
    ctx.save();
    ctx.shadowColor = 'rgba(255,40,24,0.9)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ff3a22';
    roundRectPath(ctx, 26, 244, 42, 15, 5);
    ctx.fill();
    roundRectPath(ctx, 192, 244, 42, 15, 5);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#e8e2cf';
    roundRectPath(ctx, 96, 240, 68, 20, 3);
    ctx.fill();
    ctx.fillStyle = '#22262c';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('ঢাকা-১১', 130, 254);
  });
}

function truckRear() {
  return mk(260, 330, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 8, 106, 10, 'rgba(0,0,0,0.45)');

    // rear axle shadow under the body
    ctx.fillStyle = '#0b0d10';
    roundRectPath(ctx, 20, 286, 220, 24, 6);
    ctx.fill();

    // wheels
    ctx.fillStyle = '#08090d';
    roundRectPath(ctx, 14, 262, 48, 62, 10);
    ctx.fill();
    roundRectPath(ctx, 198, 262, 48, 62, 10);
    ctx.fill();
    ctx.fillStyle = '#1a1d22';
    roundRectPath(ctx, 25, 276, 26, 28, 6);
    ctx.fill();
    roundRectPath(ctx, 209, 276, 26, 28, 6);
    ctx.fill();

    // cargo body
    const g = ctx.createLinearGradient(0, 0, 0, 292);
    g.addColorStop(0, '#4d565f');
    g.addColorStop(0.55, '#333a42');
    g.addColorStop(1, '#15181c');
    ctx.fillStyle = g;
    roundRectPath(ctx, 10, 6, 240, 268, 6);
    ctx.fill();

    // corrugated panels
    ctx.strokeStyle = 'rgba(0,0,0,0.32)';
    ctx.lineWidth = 3;
    for (let i = 1; i < 5; i++) {
      const x = 10 + (240 / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, 266);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(12, 6 + i * 45);
      ctx.lineTo(248, 6 + i * 45);
      ctx.stroke();
    }

    // tailgate: two doors with hinges and locking bars
    ctx.strokeStyle = 'rgba(8,10,13,0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(130, 10);
    ctx.lineTo(130, 268);
    ctx.stroke();
    ctx.fillStyle = '#20252b';
    for (const y of [68, 206]) {
      roundRectPath(ctx, 118, y, 10, 26, 3);
      ctx.fill();
      roundRectPath(ctx, 132, y, 10, 26, 3);
      ctx.fill();
    }
    ctx.strokeStyle = '#5f6a74';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(94, 36);
    ctx.lineTo(94, 252);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(166, 36);
    ctx.lineTo(166, 252);
    ctx.stroke();

    // painted band
    ctx.fillStyle = 'rgba(255,190,60,0.8)';
    ctx.fillRect(10, 212, 240, 10);

    // rear bumper and underride bar
    ctx.fillStyle = '#1b1f24';
    roundRectPath(ctx, 4, 272, 252, 18, 5);
    ctx.fill();
    ctx.fillStyle = '#2c3238';
    roundRectPath(ctx, 58, 290, 144, 10, 4);
    ctx.fill();

    // mud flaps
    ctx.fillStyle = '#101317';
    roundRectPath(ctx, 20, 292, 44, 30, 4);
    ctx.fill();
    roundRectPath(ctx, 196, 292, 44, 30, 4);
    ctx.fill();

    // tail lights
    ctx.save();
    ctx.shadowColor = 'rgba(255,40,24,0.9)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff3a22';
    roundRectPath(ctx, 22, 244, 38, 16, 5);
    ctx.fill();
    roundRectPath(ctx, 200, 244, 38, 16, 5);
    ctx.fill();
    ctx.restore();

    // number plate
    ctx.fillStyle = '#e8e2cf';
    roundRectPath(ctx, 96, 244, 68, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#22262c';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ঢাকা-১১', 130, 257);
  });
}

// Cab-over truck seen head on: tall flat face, big split windscreen and a
// proper lorry bumper — not a saloon car, which is what it used to reuse.
function truckFront() {
  return mk(260, 330, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 8, 106, 10, 'rgba(0,0,0,0.4)');

    ctx.fillStyle = '#08090d';
    roundRectPath(ctx, 12, 268, 48, 58, 10);
    ctx.fill();
    roundRectPath(ctx, 200, 268, 48, 58, 10);
    ctx.fill();

    // cab
    const g = ctx.createLinearGradient(0, 18, 0, 300);
    g.addColorStop(0, '#717c88');
    g.addColorStop(0.5, '#4a5158');
    g.addColorStop(1, '#20242a');
    ctx.fillStyle = g;
    roundRectPath(ctx, 10, 22, 240, 258, 12);
    ctx.fill();

    // roof marker lights
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = 'rgba(255,200,90,0.9)';
      roundRectPath(ctx, 62 + i * 28, 14, 14, 8, 3);
      ctx.fill();
    }

    // split windscreen
    const wg = ctx.createLinearGradient(0, 44, 0, 130);
    wg.addColorStop(0, '#2b3a4d');
    wg.addColorStop(1, '#101821');
    ctx.fillStyle = wg;
    roundRectPath(ctx, 26, 46, 208, 84, 8);
    ctx.fill();
    ctx.fillStyle = '#4a5158';
    ctx.fillRect(126, 46, 8, 84);
    ctx.strokeStyle = 'rgba(160,200,240,0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 58);
    ctx.lineTo(92, 58);
    ctx.stroke();

    // wipers
    ctx.strokeStyle = 'rgba(12,16,20,0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(52, 128);
    ctx.lineTo(96, 112);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(168, 128);
    ctx.lineTo(210, 112);
    ctx.stroke();

    // grille
    ctx.fillStyle = '#14181d';
    roundRectPath(ctx, 34, 150, 192, 46, 6);
    ctx.fill();
    ctx.fillStyle = '#b9bdc4';
    for (let i = 0; i < 4; i++) ctx.fillRect(42, 158 + i * 9, 176, 3);

    // headlights
    ctx.save();
    ctx.shadowColor = 'rgba(255,238,190,0.95)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#fff3cf';
    roundRectPath(ctx, 20, 204, 52, 26, 8);
    ctx.fill();
    roundRectPath(ctx, 188, 204, 52, 26, 8);
    ctx.fill();
    ctx.restore();
    glow(ctx, 46, 217, 30, 'rgba(255,240,200,0.45)', 0.7);
    glow(ctx, 214, 217, 30, 'rgba(255,240,200,0.45)', 0.7);

    // bumper
    ctx.fillStyle = '#1c2126';
    roundRectPath(ctx, 4, 240, 252, 30, 7);
    ctx.fill();
    ctx.fillStyle = '#2f353c';
    ctx.fillRect(10, 246, 240, 4);

    // number plate
    ctx.fillStyle = '#e8e2cf';
    roundRectPath(ctx, 94, 278, 72, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#22262c';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ঢাকা-১১', 130, 291);
  });
}

function rickshawRear() {
  return mk(230, 268, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 6, 92, 8, 'rgba(0,0,0,0.5)');

    // wheels
    ctx.fillStyle = '#0a0b0d';
    roundRectPath(ctx, 22, 208, 32, 54, 12);
    ctx.fill();
    roundRectPath(ctx, 176, 208, 32, 54, 12);
    ctx.fill();

    // chassis
    ctx.fillStyle = '#242620';
    roundRectPath(ctx, 30, 190, 170, 44, 8);
    ctx.fill();

    // canopy
    const g = ctx.createLinearGradient(0, 40, 0, 200);
    g.addColorStop(0, '#2f7a4a');
    g.addColorStop(0.55, '#1d5233');
    g.addColorStop(1, '#123221');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(20, 196);
    ctx.lineTo(20, 92);
    ctx.quadraticCurveTo(20, 30, 115, 26);
    ctx.quadraticCurveTo(210, 30, 210, 92);
    ctx.lineTo(210, 196);
    ctx.closePath();
    ctx.fill();

    // painted border
    ctx.strokeStyle = 'rgba(255,196,64,0.85)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(28, 190);
    ctx.lineTo(28, 94);
    ctx.quadraticCurveTo(28, 40, 115, 36);
    ctx.quadraticCurveTo(202, 40, 202, 94);
    ctx.lineTo(202, 190);
    ctx.stroke();

    // rear opening with passengers
    ctx.fillStyle = '#05070a';
    roundRectPath(ctx, 40, 74, 150, 112, 8);
    ctx.fill();
    // silhouettes
    for (let i = 0; i < 3; i++) {
      const x = 66 + i * 49;
      ctx.fillStyle = '#3b3f4a';
      ctx.beginPath();
      ctx.arc(x, 108 + (i % 2) * 6, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a2d36';
      roundRectPath(ctx, x - 22, 124 + (i % 2) * 6, 44, 54, 10);
      ctx.fill();
    }
    // cage bars
    ctx.strokeStyle = 'rgba(200,205,210,0.35)';
    ctx.lineWidth = 3;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(40 + (150 / 4) * i, 74);
      ctx.lineTo(40 + (150 / 4) * i, 186);
      ctx.stroke();
    }

    // decorative panel
    ctx.fillStyle = '#163d27';
    roundRectPath(ctx, 40, 190, 150, 46, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,205,90,0.85)';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 48, 196, 134, 34, 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,215,120,0.9)';
    ctx.font = 'bold 15px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('৩০০ ফুট', 115, 219);

    // tail light
    ctx.save();
    ctx.shadowColor = 'rgba(255,60,30,0.9)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff4a2a';
    roundRectPath(ctx, 96, 240, 38, 12, 4);
    ctx.fill();
    ctx.restore();
  });
}

function bikeRear() {
  return mk(160, 240, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 5, 44, 6, 'rgba(0,0,0,0.5)');
    // rear wheel
    ctx.fillStyle = '#0a0b0d';
    roundRectPath(ctx, 64, 168, 32, 64, 12);
    ctx.fill();
    ctx.fillStyle = '#191b20';
    roundRectPath(ctx, 70, 186, 20, 40, 8);
    ctx.fill();

    // rider legs
    ctx.fillStyle = '#20222b';
    roundRectPath(ctx, 50, 150, 26, 54, 10);
    ctx.fill();
    roundRectPath(ctx, 86, 150, 26, 54, 10);
    ctx.fill();

    // torso / jacket
    const g = ctx.createLinearGradient(0, 40, 0, 170);
    g.addColorStop(0, '#2f3c56');
    g.addColorStop(1, '#161b26');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(48, 160);
    ctx.quadraticCurveTo(36, 86, 58, 62);
    ctx.lineTo(102, 62);
    ctx.quadraticCurveTo(124, 86, 112, 160);
    ctx.closePath();
    ctx.fill();

    // arms
    ctx.strokeStyle = '#232b3a';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(58, 78);
    ctx.lineTo(34, 116);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(102, 78);
    ctx.lineTo(126, 116);
    ctx.stroke();

    // backpack
    ctx.fillStyle = '#3a2f45';
    roundRectPath(ctx, 62, 74, 36, 46, 10);
    ctx.fill();

    // helmet
    ctx.fillStyle = '#12151c';
    ctx.beginPath();
    ctx.ellipse(80, 46, 30, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,180,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(80, 42, 22, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.ellipse(80, 46, 12, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // tail light
    ctx.save();
    ctx.shadowColor = 'rgba(255,40,24,0.95)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff3a22';
    roundRectPath(ctx, 70, 158, 22, 10, 4);
    ctx.fill();
    ctx.restore();
  });
}

/* ------------------------------------------------------------------ */
/*  SCENERY                                                            */
/* ------------------------------------------------------------------ */

function lampSprite(mirror) {
  return mk(340, 560, (ctx, w, h) => {
    if (mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    const poleX = 40;
    // pole
    const pg = ctx.createLinearGradient(poleX - 8, 0, poleX + 12, 0);
    pg.addColorStop(0, '#22252b');
    pg.addColorStop(0.4, '#7c818b');
    pg.addColorStop(1, '#232529');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(poleX - 7, h);
    ctx.lineTo(poleX - 4, 132);
    ctx.lineTo(poleX + 5, 132);
    ctx.lineTo(poleX + 10, h);
    ctx.closePath();
    ctx.fill();

    // curved arm
    ctx.strokeStyle = '#565b64';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(poleX, 146);
    ctx.quadraticCurveTo(poleX, 78, poleX + 150, 84);
    ctx.stroke();

    // lamp head
    ctx.fillStyle = '#c9cdd4';
    ctx.beginPath();
    ctx.moveTo(poleX + 140, 68);
    ctx.lineTo(poleX + 196, 68);
    ctx.lineTo(poleX + 188, 100);
    ctx.lineTo(poleX + 148, 100);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8e4';
    roundRectPath(ctx, poleX + 148, 96, 42, 10, 5);
    ctx.fill();

    // glow (kept inside the canvas so there is no visible square edge)
    glow(ctx, poleX + 169, 88, 72, 'rgba(255,206,126,0.4)', 0.9);
    glow(ctx, poleX + 169, 92, 30, 'rgba(255,247,216,0.95)', 1);
  });
}

function palmSprite() {
  return mk(240, 440, (ctx, w, h) => {
    const baseX = w / 2;
    const tg = ctx.createLinearGradient(baseX - 10, 0, baseX + 12, 0);
    tg.addColorStop(0, '#1b2119');
    tg.addColorStop(0.5, '#33402c');
    tg.addColorStop(1, '#141a13');
    ctx.strokeStyle = tg;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, h);
    ctx.quadraticCurveTo(baseX - 12, h * 0.55, baseX + 6, h * 0.36);
    ctx.stroke();

    const cx = baseX + 6;
    const cy = h * 0.35;
    ctx.fillStyle = '#1e2c1f';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(48, 0, 52, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(90,140,80,0.25)';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(38, 0, 40, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
}

function buildingSprite(seed) {
  const w = 300 + ((seed * 47) % 4) * 40;
  const h = 400 + ((seed * 89) % 5) * 90;
  return mk(w, h, (ctx, cw, ch) => {
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, '#121526');
    g.addColorStop(0.7, '#0c0e18');
    g.addColorStop(1, '#080a11');
    ctx.fillStyle = g;
    ctx.fillRect(10, 30, cw - 20, ch - 30);

    // roof parapet
    ctx.fillStyle = '#1a1d2b';
    ctx.fillRect(6, 24, cw - 12, 12);

    // windows
    const cols = Math.max(2, Math.floor((cw - 44) / 34));
    const rows = Math.max(3, Math.floor((ch - 80) / 46));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = Math.sin(seed * 12.9898 + r * 78.233 + c * 37.719) * 43758.5453;
        const lit = on - Math.floor(on) > 0.55;
        const x = 26 + c * ((cw - 52) / cols);
        const y = 52 + r * ((ch - 92) / rows);
        ctx.fillStyle = lit
          ? (c + r) % 3 === 0
            ? 'rgba(255,205,120,0.75)'
            : 'rgba(180,215,255,0.35)'
          : 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, Math.min(18, (cw - 52) / cols - 8), 14);
      }
    }

    // rooftop tank + antenna
    if (seed % 2 === 0) {
      ctx.fillStyle = '#1d2130';
      roundRectPath(ctx, cw * 0.3, 0, 44, 28, 4);
      ctx.fill();
    }
    ctx.strokeStyle = '#1d2130';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cw * 0.72, 24);
    ctx.lineTo(cw * 0.72, -10);
    ctx.stroke();
  });
}

function billboardSprite(text, accent) {
  return mk(440, 300, (ctx, w, h) => {
    ctx.fillStyle = '#20242d';
    ctx.fillRect(96, 150, 16, h - 150);
    ctx.fillRect(w - 112, 150, 16, h - 150);

    ctx.fillStyle = '#12151d';
    ctx.fillRect(20, 18, w - 40, 150);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.strokeRect(26, 24, w - 52, 138);

    ctx.fillStyle = accent;
    ctx.font = 'bold 62px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 96);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('৩০০ ফুট', w / 2, 136);

    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 22;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(26, 24, w - 52, 138);
    ctx.restore();
  });
}

function signalSprite(kind) {
  return mk(260, 460, (ctx, w, h) => {
    ctx.fillStyle = '#3b3f47';
    ctx.fillRect(28, 40, 14, h - 40);
    ctx.fillRect(28, 40, w - 44, 12);

    // housing
    ctx.fillStyle = '#101319';
    roundRectPath(ctx, 140, 52, 62, 150, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, 140, 52, 62, 150, 14);
    ctx.stroke();

    const lamps = [
      { y: 80, color: '#ff3b30', on: kind === 'red' },
      { y: 122, color: '#ffb020', on: kind === 'amber' },
      { y: 164, color: '#35e06b', on: kind === 'green' },
    ];
    for (const l of lamps) {
      ctx.fillStyle = l.on ? l.color : 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      ctx.arc(171, l.y, 16, 0, Math.PI * 2);
      ctx.fill();
      if (l.on) {
        ctx.save();
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.restore();
        glow(ctx, 171, l.y, 54, 'rgba(255,80,60,0.35)', 0.8);
      }
    }
  });
}

/* ------------------------------------------------------------------ */
/*  PEOPLE + CHECKPOST                                                 */
/* ------------------------------------------------------------------ */

function officerSprite() {
  return mk(150, 300, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 6, 36, 7, 'rgba(0,0,0,0.45)');

    // legs
    ctx.fillStyle = '#23262c';
    roundRectPath(ctx, 50, 186, 20, 106, 7);
    ctx.fill();
    roundRectPath(ctx, 80, 186, 20, 106, 7);
    ctx.fill();
    ctx.fillStyle = '#0b0c0f';
    roundRectPath(ctx, 44, 282, 30, 14, 5);
    ctx.fill();
    roundRectPath(ctx, 76, 282, 30, 14, 5);
    ctx.fill();

    // shirt
    const g = ctx.createLinearGradient(0, 90, 0, 200);
    g.addColorStop(0, '#f2f4f6');
    g.addColorStop(1, '#b9bec6');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(48, 190);
    ctx.lineTo(44, 116);
    ctx.quadraticCurveTo(75, 96, 106, 116);
    ctx.lineTo(102, 190);
    ctx.closePath();
    ctx.fill();

    // reflective vest
    ctx.fillStyle = 'rgba(198,255,90,0.9)';
    ctx.beginPath();
    ctx.moveTo(54, 186);
    ctx.lineTo(50, 124);
    ctx.lineTo(100, 124);
    ctx.lineTo(96, 186);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(52, 142, 44, 7);
    ctx.fillRect(52, 164, 44, 7);

    // raised arm
    ctx.strokeStyle = '#e6e9ec';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(100, 128);
    ctx.lineTo(128, 82);
    ctx.lineTo(120, 44);
    ctx.stroke();
    ctx.fillStyle = '#f2f4f6';
    ctx.beginPath();
    ctx.arc(120, 40, 11, 0, Math.PI * 2);
    ctx.fill();
    // baton
    ctx.strokeStyle = '#101216';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(122, 38);
    ctx.lineTo(136, 8);
    ctx.stroke();

    // other arm
    ctx.strokeStyle = '#e6e9ec';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(50, 130);
    ctx.lineTo(36, 176);
    ctx.stroke();

    // head
    ctx.fillStyle = '#8a5a3b';
    ctx.beginPath();
    ctx.arc(75, 84, 20, 0, Math.PI * 2);
    ctx.fill();

    // cap
    ctx.fillStyle = '#f6f7f9';
    ctx.beginPath();
    ctx.arc(75, 72, 22, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(53, 70, 44, 8);
    ctx.fillStyle = '#1e2b4a';
    ctx.fillRect(53, 74, 44, 5);
    ctx.fillStyle = '#121417';
    ctx.beginPath();
    ctx.ellipse(75, 80, 26, 6, 0, 0, Math.PI);
    ctx.fill();

    // highlight aura
    glow(ctx, 78, 150, 92, 'rgba(120,255,190,0.16)', 0.7);
  });
}

function journalistSprite() {
  return mk(150, 300, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 6, 32, 6, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = '#1b1e26';
    roundRectPath(ctx, 54, 180, 18, 110, 6);
    ctx.fill();
    roundRectPath(ctx, 80, 180, 18, 110, 6);
    ctx.fill();

    const g = ctx.createLinearGradient(0, 90, 0, 200);
    g.addColorStop(0, '#4a5568');
    g.addColorStop(1, '#22262f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(48, 190);
    ctx.lineTo(44, 112);
    ctx.quadraticCurveTo(75, 96, 106, 112);
    ctx.lineTo(102, 190);
    ctx.closePath();
    ctx.fill();

    // arms up holding camera
    ctx.strokeStyle = '#3b4657';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(52, 120);
    ctx.lineTo(46, 66);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(98, 120);
    ctx.lineTo(104, 66);
    ctx.stroke();

    // camera
    ctx.fillStyle = '#0d0f14';
    roundRectPath(ctx, 40, 44, 70, 34, 6);
    ctx.fill();
    ctx.fillStyle = '#2a303c';
    roundRectPath(ctx, 54, 34, 26, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#5b6b82';
    ctx.beginPath();
    ctx.arc(76, 61, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0c11';
    ctx.beginPath();
    ctx.arc(76, 61, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.shadowColor = 'rgba(180,220,255,0.9)';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#eaf4ff';
    ctx.fillRect(104, 52, 8, 6);
    ctx.restore();

    // head + cap
    ctx.fillStyle = '#7d5236';
    ctx.beginPath();
    ctx.arc(74, 96, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#151922';
    ctx.beginPath();
    ctx.arc(74, 88, 19, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#151922';
    ctx.fillRect(55, 86, 38, 6);
  });
}

function barrierSprite() {
  return mk(280, 120, (ctx, w, h) => {
    ctx.fillStyle = '#2b2e35';
    ctx.fillRect(40, 60, 12, 58);
    ctx.fillRect(w - 54, 60, 12, 58);
    ctx.fillStyle = '#14161b';
    roundRectPath(ctx, 30, h - 10, 34, 8, 3);
    ctx.fill();
    roundRectPath(ctx, w - 64, h - 10, 34, 8, 3);
    ctx.fill();

    ctx.fillStyle = '#e8e6df';
    roundRectPath(ctx, 6, 26, w - 12, 40, 5);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, 6, 26, w - 12, 40, 5);
    ctx.clip();
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? '#d6362b' : '#f2efe6';
      ctx.save();
      ctx.translate(i * 26, 26);
      ctx.rotate(-0.35);
      ctx.fillRect(0, -10, 15, 70);
      ctx.restore();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, 6, 26, w - 12, 40, 5);
    ctx.stroke();

    // lamp on top
    ctx.fillStyle = '#1a1c22';
    ctx.fillRect(w / 2 - 6, 6, 12, 22);
    ctx.save();
    ctx.shadowColor = '#59a8ff';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#bfe0ff';
    roundRectPath(ctx, w / 2 - 14, 0, 28, 12, 4);
    ctx.fill();
    ctx.restore();
  });
}

function policeCarSprite() {
  return mk(340, 220, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 8, 150, 12, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = '#0a0b0f';
    roundRectPath(ctx, 26, 154, 52, 52, 10);
    ctx.fill();
    roundRectPath(ctx, w - 78, 154, 52, 52, 10);
    ctx.fill();

    const g = ctx.createLinearGradient(0, 60, 0, 200);
    g.addColorStop(0, '#eef2f6');
    g.addColorStop(0.55, '#cfd5dd');
    g.addColorStop(1, '#5a6068');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(26, 176);
    ctx.quadraticCurveTo(18, 136, 36, 118);
    ctx.lineTo(74, 108);
    ctx.lineTo(88, 72);
    ctx.quadraticCurveTo(170, 62, 252, 72);
    ctx.lineTo(266, 108);
    ctx.lineTo(304, 118);
    ctx.quadraticCurveTo(322, 136, 314, 176);
    ctx.quadraticCurveTo(170, 194, 26, 176);
    ctx.closePath();
    ctx.fill();

    // blue stripe
    ctx.fillStyle = '#1d4fa6';
    ctx.fillRect(30, 132, w - 60, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(30, 132, w - 60, 3);

    // rear glass
    ctx.fillStyle = '#101722';
    ctx.beginPath();
    ctx.moveTo(100, 76);
    ctx.lineTo(240, 76);
    ctx.lineTo(254, 108);
    ctx.lineTo(86, 108);
    ctx.closePath();
    ctx.fill();

    // light bar
    ctx.fillStyle = '#101318';
    roundRectPath(ctx, 116, 52, 108, 22, 6);
    ctx.fill();
    ctx.save();
    ctx.shadowColor = 'rgba(255,40,40,0.95)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ff3b30';
    roundRectPath(ctx, 122, 56, 44, 14, 4);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = 'rgba(60,120,255,0.95)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#4a86ff';
    roundRectPath(ctx, 174, 56, 44, 14, 4);
    ctx.fill();
    ctx.restore();

    // tail lights
    ctx.save();
    ctx.shadowColor = 'rgba(255,40,24,0.9)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff3a22';
    roundRectPath(ctx, 48, 158, 38, 12, 5);
    ctx.fill();
    roundRectPath(ctx, w - 86, 158, 38, 12, 5);
    ctx.fill();
    ctx.restore();

    // text on boot
    ctx.fillStyle = '#1d4fa6';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', w / 2, 152);
  });
}

function checkGateSprite() {
  return mk(1400, 400, (ctx, w, h) => {
    // legs
    for (const x of [60, w - 160]) {
      const lg = ctx.createLinearGradient(x, 0, x + 100, 0);
      lg.addColorStop(0, '#24262d');
      lg.addColorStop(0.45, '#6b7079');
      lg.addColorStop(1, '#191b20');
      ctx.fillStyle = lg;
      ctx.fillRect(x, 96, 100, h - 96);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? '#e8bb1f' : '#17181d';
        ctx.fillRect(x, h - 118 + i * 20, 100, 20);
      }
    }

    // overhead beam
    ctx.fillStyle = '#1c1e26';
    roundRectPath(ctx, 8, 34, w - 16, 92, 8);
    ctx.fill();
    ctx.fillStyle = '#3b3e48';
    ctx.fillRect(8, 114, w - 16, 12);

    // sign board
    ctx.fillStyle = '#0b0d12';
    roundRectPath(ctx, w / 2 - 320, 50, 640, 84, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,181,36,0.95)';
    ctx.lineWidth = 5;
    roundRectPath(ctx, w / 2 - 320, 50, 640, 84, 6);
    ctx.stroke();
    ctx.fillStyle = '#ffd77a';
    ctx.font = 'bold 46px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('পুলিশ চেকপোস্ট', w / 2, 110);

    // warning beacons
    const beacons = [
      [180, '#ff3030'],
      [260, '#4a86ff'],
      [w - 260, '#ff3030'],
      [w - 180, '#4a86ff'],
    ];
    for (const [bx, color] of beacons) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 40;
      ctx.fillStyle = color;
      roundRectPath(ctx, bx - 22, 8, 44, 22, 6);
      ctx.fill();
      ctx.restore();
      glow(ctx, bx, 19, 54, color === '#ff3030' ? 'rgba(255,60,50,0.5)' : 'rgba(70,130,255,0.5)', 0.9);
    }

    // under-beam work lights
    for (let i = 0; i < 6; i++) {
      const lx = 300 + i * ((w - 600) / 5);
      ctx.save();
      ctx.shadowColor = 'rgba(255,225,170,0.9)';
      ctx.shadowBlur = 22;
      ctx.fillStyle = '#ffe9bd';
      ctx.fillRect(lx - 10, 126, 20, 6);
      ctx.restore();
    }
  });
}

function adBoxSprite(theme) {
  const themes = [
    { a: '#1d5bb8', b: '#3f8ae4', ink: '#ffffff', text: 'নিরাপদ পথ', sub: '৩০০ ফুট রোড' },
    { a: '#c33127', b: '#e35645', ink: '#ffffff', text: 'ধীরে চলুন', sub: '৩০০ ফুট রোড' },
    { a: '#e2a11c', b: '#f6c84c', ink: '#2c1d04', text: 'হেলমেট পরুন', sub: '৩০০ ফুট রোড' },
  ];
  const th = themes[theme % 3];
  return mk(420, 300, (ctx, w, h) => {
    ellipse(ctx, w / 2, h - 6, 186, 13, 'rgba(0,0,0,0.5)');

    // skids
    ctx.fillStyle = '#101218';
    roundRectPath(ctx, 52, h - 34, 70, 26, 4);
    ctx.fill();
    roundRectPath(ctx, w - 122, h - 34, 70, 26, 4);
    ctx.fill();

    // box body
    const g = ctx.createLinearGradient(0, 120, 0, h - 24);
    g.addColorStop(0, th.b);
    g.addColorStop(0.45, th.a);
    g.addColorStop(1, '#0f1116');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(34, 132);
    ctx.lineTo(80, 100);
    ctx.lineTo(w - 80, 100);
    ctx.lineTo(w - 34, 132);
    ctx.lineTo(w - 34, h - 30);
    ctx.lineTo(34, h - 30);
    ctx.closePath();
    ctx.fill();

    // top face
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(34, 132);
    ctx.lineTo(80, 100);
    ctx.lineTo(w - 80, 100);
    ctx.lineTo(w - 34, 132);
    ctx.closePath();
    ctx.fill();

    // ad panel
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    roundRectPath(ctx, 54, 146, w - 108, 96, 7);
    ctx.fill();

    // QR block
    ctx.fillStyle = th.a;
    roundRectPath(ctx, 72, 160, 54, 54, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if ((r + c * 2) % 3 !== 0) ctx.fillRect(78 + c * 11, 166 + r * 11, 8, 8);
      }
    }

    // ad copy
    ctx.fillStyle = th.ink === '#ffffff' ? th.a : '#4a3309';
    ctx.font = 'bold 32px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(th.text, 144, 192);
    ctx.fillStyle = 'rgba(30,32,40,0.55)';
    ctx.font = '18px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText(th.sub, 146, 218);

    // reflective strip + base
    ctx.fillStyle = '#e9edf2';
    ctx.fillRect(48, h - 52, w - 96, 12);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(48, h - 40, w - 96, 6);

    // amber roof beacon
    ctx.save();
    ctx.shadowColor = 'rgba(255,190,60,0.95)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffd166';
    roundRectPath(ctx, w / 2 - 18, 78, 36, 18, 5);
    ctx.fill();
    ctx.restore();
    glow(ctx, w / 2, 88, 52, 'rgba(255,180,60,0.35)', 0.9);

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, 54, 146, w - 108, 96, 7);
    ctx.stroke();
  });
}

function coneSprite() {
  return mk(60, 90, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ellipse(ctx, w / 2, h - 5, 22, 5, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = '#ff6a1f';
    ctx.beginPath();
    ctx.moveTo(w / 2, 6);
    ctx.lineTo(w - 12, h - 8);
    ctx.lineTo(12, h - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(16, 44, w - 32, 9);
    ctx.fillStyle = '#22242a';
    roundRectPath(ctx, 8, h - 12, w - 16, 10, 3);
    ctx.fill();
  });
}

/* ------------------------------------------------------------------ */
/*  SKYLINE                                                            */
/* ------------------------------------------------------------------ */

function skyline(near) {
  const w = 2048;
  const h = near ? 360 : 300;
  return mk(w, h, (ctx) => {
    const base = near ? '#0c0f1a' : '#11142a';
    const lit = near ? 'rgba(255,196,120,0.42)' : 'rgba(180,200,255,0.22)';
    const lit2 = near ? 'rgba(255,160,90,0.3)' : 'rgba(150,180,240,0.16)';

    let x = 0;
    let i = 0;
    while (x < w) {
      const bw = 40 + Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) * 90;
      const bh = (near ? 60 : 90) + (Math.abs(Math.sin(i * 4.7) * 10000) % 1) * (near ? 230 : 190);
      const y = h - bh;
      ctx.fillStyle = base;
      ctx.fillRect(x, y, bw, bh);
      // roof features
      if (i % 4 === 0) ctx.fillRect(x + bw * 0.3, y - 14, bw * 0.35, 14);
      if (i % 7 === 0) {
        ctx.fillRect(x + bw * 0.6, y - 34, 3, 34);
        ctx.fillStyle = lit2;
        ctx.fillRect(x + bw * 0.6 - 2, y - 38, 7, 5);
        ctx.fillStyle = base;
      }
      // windows
      for (let wy = y + 10; wy < h - 12; wy += 16) {
        for (let wx = x + 6; wx < x + bw - 8; wx += 13) {
          const v = Math.sin(wx * 12.9898 + wy * 78.233) * 43758.5453;
          if (v - Math.floor(v) > 0.7) {
            ctx.fillStyle = lit;
            ctx.fillRect(wx, wy, 5, 7);
          }
        }
      }
      x += bw + 6 + (i % 3) * 8;
      i++;
    }
  });
}

/* ------------------------------------------------------------------ */
/*  BUILD                                                              */
/* ------------------------------------------------------------------ */

let built = false;

export function buildSprites() {
  if (built) return SPRITES;
  built = true;

  const carColors = [
    ['#cfd2d8', '#8d919a'],
    ['#5d7f96', '#324a5c'],
    ['#8a4b45', '#4f2b28'],
    ['#6a6f57', '#3c4033'],
    ['#3d4060', '#232538'],
  ];

  carColors.forEach(([body, accent], i) => {
    reg(`carRear${i}`, rearCar(body, accent), 0.23);
    reg(`carFront${i}`, frontCar(body, accent), 0.23);
  });

  reg('busRear', busRear('#2c6b45'), 0.37);
  reg('busFront', frontCar('#2c6b45', '#1d4a30'), 0.37);
  reg('truckRear', truckRear(), 0.37);
  reg('truckFront', truckFront(), 0.37);
  reg('rickshawRear', rickshawRear(), 0.27);
  reg('rickshawFront', frontCar('#2f7a4a', '#17442a'), 0.27);
  reg('bikeRear', bikeRear(), 0.24);
  reg('bikeFront', frontCar('#22303f', '#131b25'), 0.24);

  reg('lampL', lampSprite(false), 0.72, 40 / 340);
  reg('lampR', lampSprite(true), 0.72, 1 - 40 / 340);
  reg('palm', palmSprite(), 0.72);
  reg('signalRed', signalSprite('red'), 0.92, 28 / 260);
  reg('signalGreen', signalSprite('green'), 0.92, 28 / 260);
  reg('signalAmber', signalSprite('amber'), 0.92, 28 / 260);

  for (let i = 0; i < 5; i++) reg(`building${i}`, buildingSprite(i + 1), 1.55 + (i % 3) * 0.45);
  reg('billboard0', billboardSprite('৩০০ ফুট', '#ffb524'), 0.42);
  reg('billboard1', billboardSprite('ধীরে চলুন', '#63e6a4'), 0.42);
  reg('billboard2', billboardSprite('হেলমেট পরুন', '#68b7ff'), 0.42);

  reg('officer', officerSprite(), 0.27);
  reg('journalist', journalistSprite(), 0.26);
  reg('barrier', barrierSprite(), 0.24);
  reg('policeCar', policeCarSprite(), 0.36);
  reg('cone', coneSprite(), 0.09);
  reg('checkGate', checkGateSprite(), 0.72);
  reg('adBox0', adBoxSprite(0), 0.15);
  reg('adBox1', adBoxSprite(1), 0.15);
  reg('adBox2', adBoxSprite(2), 0.15);

  return SPRITES;
}

export const SKYLINE = {
  far: null,
  near: null,
};

export function buildSkyline() {
  if (SKYLINE.near) return SKYLINE;
  SKYLINE.far = skyline(false);
  SKYLINE.near = skyline(true);
  return SKYLINE;
}
