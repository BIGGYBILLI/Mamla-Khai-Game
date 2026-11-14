# মামলা খাই — Mamla Khai

A browser arcade game set on **300 Feet, Dhaka** at night. Pick a car or a bike,
drive badly, and watch the fine calculator on the right climb until a police
checkpost finally catches you.

No downloads, no frameworks, no build step — plain HTML, CSS and ES modules on a
2D canvas with a pseudo-3D (Out Run style) road renderer. Runs on phones, tablets
and desktops; keyboard, touch buttons or both.

## Play it

**Live:** <https://biggybilli.github.io/Mamla-Khai-Game/> — hosted on GitHub Pages
from this repo's `main` branch.

To run it locally, serve the folder over HTTP (ES modules do not load from `file://`):

```bash
npm run dev            # http://127.0.0.1:5178
# or pick a port
PORT=5199 npm run dev
```

There is no install step and no dependencies. Any static file server works
(`python -m http.server`, nginx, a Worker, …); `dev-server.mjs` is the 40-line
server used for local development.

## How to play

| Action | Keyboard | Touch |
| --- | --- | --- |
| Steer | `←` `→` / `A` `D` | ◀ ▶ pad |
| Accelerate | `↑` / `W` | GAS |
| Brake | `↓` / `S` / `Space` | BRAKE |
| Pause | `Esc` | ❚❚ button |

Before you ride you choose the things that make a case:

- **Car** — 6 seats. Seatbelt on/off. More than 5 people is overloading.
- **Bike** — up to 4 riders (driver + 3). Helmet on/off. 3 or more riders is triple riding.

You also choose whether you have a **licence**. Without one the station adds a
50% surcharge on top of everything else, plus the base ৳25,000.

## Violations and fines

| Case | Approx. fine |
| --- | --- |
| Over-speeding | ৳3,000 + ৳120 per km/h over the limit |
| No seatbelt / no helmet | ৳1,000 each |
| Triple riding / overloading | ৳2,500 / ৳3,000 |
| Signal breaking | ৳3,000 |
| Wrong-side driving | ৳10,000 |
| Rough driving (zig-zagging) | ৳5,000 |
| Accident | ৳5,000 + damage compensation |
| Fled a checkpost | ৳3,000 |
| Failure to stop at a checkpost | ৳5,000 |
| No licence | ৳25,000 + 50% of everything else |

Hitting a vehicle wrecks it: it tilts, smokes and is cleared off the road for good,
never to be met again. Only traffic still ahead of your bumper can be hit, so a car
you have overtaken can never reach back at you. Your own ride has a life bar — every
accident costs condition and adds a repair bill to the calculator.

## Checkposts

A checkpoint shows up ahead with a red siren wash, a distance read-out and a
highlighted officer. Levels escalate as you escape:

1. One barrier — slip round the far-left lane.
2. Two barriers — thread the gap near the median.
3. A narrow gap — precision driving.
4. Full blockade — everybody ends up at the station with a printed challan.

The officer and the journalists (who rush at you with camera flashes) mark where
the gap is. Drive through it at speed to escape. Hit a barrier and the car is
stopped dead on the spot — officers and reporters surround it and the run ends with
an itemised receipt, even if the bodywork is untouched.

## Project layout

```
index.html          screens: menu, setup, HUD, pause, receipt
styles.css          night-neon UI, responsive + mobile dock
dev-server.mjs      dependency-free local static server
src/config.js       vehicles, lane geometry, fine table
src/road.js         looping 3000-segment track + scenery placement
src/render.js       pseudo-3D projection, road, skyline, sprites, player
src/sprites.js      procedural art: traffic, police, lamps, billboards
src/vehicles.js     the two player vehicles (also used for previews)
src/game.js         physics, traffic, signals, checkpoints, violations
src/fines.js        fine ledger, no-licence surcharge, final bill
src/audio.js        WebAudio engine drone, siren, crash, camera flashes
src/ui.js           screens, fine calculator, toasts, receipt
src/main.js         boot + input + game loop
```

`window.__mamla` exposes the running game (handy for tuning from the console).

## Notes

- Everything is drawn procedurally — there are no image or audio assets, so the
  whole game is a few dozen KB and stays sharp at any resolution.
- Rendering quality adapts to viewport size; the road uses ~150–220 segments of
  draw distance.
- Sound needs one tap/key press to start (browser autoplay rules). The ♪ button
  mutes it.

Hosting and backend (leaderboards, challan history) are deliberately out of scope
for this version.
