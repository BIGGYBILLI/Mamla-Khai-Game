import { buildSprites } from './sprites.js';
import { Road } from './road.js';
import { Renderer } from './render.js';
import { Game } from './game.js';
import { GameAudio } from './audio.js';
import { UI } from './ui.js';

buildSprites();

const canvas = document.getElementById('game');
const road = new Road();
const renderer = new Renderer(canvas);
const audio = new GameAudio();

const input = { left: false, right: false, gas: false, brake: false };

const game = new Game({
  road,
  audio,
  on: {
    toast: (key, vars, kind) => ui.toast(key, vars, kind),
    fine: () => ui.updateFines(game),
    result: (bill, stats) => {
      ui.showResult(bill, stats);
    },
  },
});

let muted = false;

const ui = new UI({
  onRide: (setup) => {
    audio.init();
    game.start(setup.vehicleId, setup);
    ui.showHud();
    ui.updateFines(game);
    audio.beep(520, 0.08, 'triangle', 0.05);
  },
  onAgain: (setup) => {
    audio.init();
    game.start(setup.vehicleId, setup);
    ui.showHud();
    ui.updateFines(game);
  },
  onMenu: () => {
    game.startAttract();
  },
  onMute: () => {
    muted = !muted;
    audio.setMuted(muted);
    return muted;
  },
  onPause: () => setPaused(true),
  onResume: () => setPaused(false),
  onChangeVehicle: () => quitToSetup(),
});

/* ------------------------------------------------------------------ */
/*  pause                                                              */
/* ------------------------------------------------------------------ */

// Leave the paused run and go straight back to the vehicle picker.
function quitToSetup() {
  game.paused = false;
  input.left = input.right = input.gas = input.brake = false;
  for (const btn of document.querySelectorAll('#touch button.on')) btn.classList.remove('on');
  audio.stopEngine();
  audio.stopSiren();
  game.startAttract();   // park the abandoned run, idle road behind the picker
  ui.showSetup();
}

function setPaused(paused) {
  if (game.phase !== 'playing' || game.paused === paused) return;
  game.paused = paused;
  input.left = input.right = input.gas = input.brake = false;
  for (const btn of document.querySelectorAll('#touch button.on')) btn.classList.remove('on');
  if (paused) {
    audio.stopEngine();
    ui.showPause();
  } else {
    audio.startEngine();
    ui.hidePause();
    last = performance.now();
  }
}

game.startAttract();

/* ------------------------------------------------------------------ */
/*  input                                                              */
/* ------------------------------------------------------------------ */

const KEYMAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'gas',
  KeyW: 'gas',
  ArrowDown: 'brake',
  KeyS: 'brake',
  Space: 'brake',
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    e.preventDefault();
    setPaused(!game.paused);
    return;
  }
  const key = KEYMAP[e.code];
  if (!key) return;
  e.preventDefault();
  if (game.paused) return;
  input[key] = true;
  audio.init();
});
window.addEventListener('keyup', (e) => {
  const key = KEYMAP[e.code];
  if (!key) return;
  e.preventDefault();
  input[key] = false;
});
window.addEventListener('blur', () => {
  input.left = input.right = input.gas = input.brake = false;
});

const touchButtons = document.querySelectorAll('#touch button');
for (const btn of touchButtons) {
  const key = btn.dataset.key;
  const on = (e) => {
    e.preventDefault();
    audio.init();
    input[key] = true;
    btn.classList.add('on');
  };
  const off = (e) => {
    e.preventDefault();
    input[key] = false;
    btn.classList.remove('on');
  };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointercancel', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

/* ------------------------------------------------------------------ */
/*  loop                                                               */
/* ------------------------------------------------------------------ */

window.addEventListener('resize', () => renderer.resize());

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (game.phase === 'menu') {
    game.updateAttract(dt);
  } else if (!game.paused) {
    game.update(dt, input);
  }

  renderer.render(game);
  ui.update(game, now);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Dev handle (used for tuning and manual testing).
window.__mamla = { game, input, ui, audio, renderer, road };

// Pause engine sound when the tab is hidden.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.stopEngine();
  else if (game.phase === 'playing' && !game.paused) {
    audio.startEngine();
  }
});
