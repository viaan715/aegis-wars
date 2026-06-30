# Aegis Wars

A browser-based top-down tank combat game built in vanilla JavaScript and HTML5 canvas. Features wave-based enemy combat, capture zone objectives, an XP/rank progression system, multiple playable tanks and maps, and local splitscreen.

## Development

```bash
npm install
npm run dev       # starts a local dev server with hot reload
```

## Production build

```bash
npm run build      # outputs a static build to dist/
npm run preview    # serves the dist/ build locally to sanity-check it
```

The build is fully static (no server/backend required) and uses relative
asset paths (`base: './'` in `vite.config.js`), so the contents of `dist/`
can be hosted from any subpath — a CDN, a subfolder on your own domain, or
zipped up as-is for a storefront like itch.io or Gumroad.

### Publishing to itch.io

1. `npm run build`
2. Zip the **contents** of `dist/` (not the folder itself) into a single `.zip`.
3. Upload that zip as an HTML5 project on itch.io and set `index.html` as
   the embed file.

## Project structure

```
index.html            Page shell — markup and element IDs only, no inline logic
src/
  main.js              Entry point: wires up DOM events and boots the game
  style.css             All game/UI styling
  constants.js           Shared constants (canvas size, etc.)
  dom.js / canvas.js      Small DOM/canvas element lookup helpers
  audio.js                 Procedural sound engine (Web Audio, no audio files)
  progression.js            XP, ranks, and unlock state (persisted to localStorage)
  data/                      Static game data (tanks, enemy types, maps, ammo, ranks)
  ui/                        Screen navigation, tank/map selection, friends/lobby UI
  game/
    state.js                  Shared mutable game state
    entities.js                 Tank/enemy factory functions
    scene.js                     Map/wave setup, start/stop game flow
    combat.js                     Armor, damage, firing, artillery
    ai.js                          Enemy and AI co-pilot behavior
    update.js                       Per-frame simulation tick
    render.js                        Canvas drawing
    input.js                          Mouse/keyboard handlers
    loop.js                           requestAnimationFrame loop
```

This is a structural refactor of the original single-file prototype into
ES modules with a Vite build pipeline — all game logic and balance values
were carried over unchanged.
