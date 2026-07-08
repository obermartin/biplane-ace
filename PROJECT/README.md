# TINY ACES

A miniature isometric arcade biplane shoot-em-up. No build step — plain HTML/CSS/JS
served over HTTP.

## Running

The game loads GLB assets over `fetch`, which browsers block on `file://` URLs.
**Serve the folder over HTTP** instead of double-clicking the file:

```sh
python3 -m http.server
# or: npx serve
```

then open <http://localhost:8000/tiny-aces.html>.

Opening via `file://` still works — the GLB fetches fail with a console warning and
the game falls back to the built-in procedural models.

## Project structure

```
tiny-aces.html    thin shell: markup + script tags
css/style.css     UI styling
js/               game modules, one per concern
assets/           authored GLB models
```

The modules are **classic scripts sharing one global scope** (not ES modules) and are
loaded in numbered order by `tiny-aces.html` — top-level `const`s from earlier files
are visible to later ones, so **load order matters**. Keep new files numbered and
respect definition-before-use for anything referenced at top level (references from
inside functions are fine in any order).

| File | Concern |
|---|---|
| `js/01-utils.js` | math helpers, RNG, error overlay |
| `js/02-audio.js` | WebAudio sfx |
| `js/03-renderer.js` | renderer, camera, tilt-shift post, water reflection targets |
| `js/04-input.js` | mouse/keyboard, cursor ray |
| `js/05-builder.js` | shared materials, procedural geometry `Builder` |
| `js/06-particles.js` | stop-motion instanced particles |
| `js/07-popups.js` | score popups, announcements |
| `js/08-projectiles.js` | bullet meshes |
| `js/09-models.js` | procedural vehicle/unit factories (`makeBiplane`, …) |
| `js/10-assets.js` | GLB pipeline: `ASSETS` manifest, loader, `makeUnit()` |
| `js/11-state.js` | global game state `G` |
| `js/12-terrain.js` | terrain/scenery helpers |
| `js/13`–`15-gen-*.js` | per-campaign level generators (+ `GENS`) |
| `js/16-enemies.js` | `ETYPES`, spawn/AI/sync |
| `js/17-combat.js` | damage + bullet simulation |
| `js/18-powerups.js` | power-ups |
| `js/19-player.js` | player state, flight model, GLB hot-swap |
| `js/20-levels.js` | campaigns, level load/clear |
| `js/21-menu.js` | menu/screens |
| `js/22-hud.js` | HUD |
| `js/23-main.js` | main loop + boot |

Verify after edits: `for f in js/*.js; do node --check "$f"; done`

## GLB assets

Authored models live in `assets/` and are wired up in the `ASSETS` manifest in
[js/10-assets.js](js/10-assets.js). A missing or broken file never breaks the game;
the procedural builder from `js/09-models.js` is used instead. Asset fetches are
cache-busted, so a plain browser reload picks up a re-exported GLB.

Asset conventions (see HANDOFF.md for details): GLB from Blender, transforms applied,
exported with **+Y Up**, nose toward Blender **−Y** (= game +Z after export), vertex
colors, real game-unit scale (player biplane = 11.6 units wingspan), moving parts as
named child objects (`prop` single / `prop1..n` multi, `turret` / `turret1..3`,
`leg*`, `limb*`, `eye`) with origins on their pivots.
