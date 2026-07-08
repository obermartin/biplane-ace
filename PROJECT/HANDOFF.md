# TINY ACES — GLB Asset Integration (Handoff Brief)

## Project

`tiny-aces.html` is a complete, working single-file HTML/Three.js (r128, cdnjs) isometric
arcade biplane shoot-em-up. Tilt-shift post-processing, 12fps stop-motion particles,
procedurally generated levels, planar water reflections. All vehicle/building models are
currently procedural, built via a `Builder` class (merged BufferGeometry, vertex colors,
one shared `MeshPhongMaterial` called `MAT`: `vertexColors:true, flatShading:true`).

## Task

Introduce a GLB loading pipeline that replaces procedural models with authored assets
where a file exists, falling back to the procedural builder otherwise.
Start with the player biplane: `assets/biplane_player.glb` (already authored).

## Project setup

```
tiny-aces/
  tiny-aces.html
  assets/
    biplane_player.glb
```

Serve locally (GLB fetch fails on file:// due to CORS): `python3 -m http.server` or
`npx serve`. Add a note to the README about this.

## Loader requirements

1. Use `GLTFLoader` matching Three r128 — cdnjs hosts
   `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/GLTFLoader.js`
   (the non-module `examples/js` build, matching how three.min.js is included).
2. Boot-time manifest, e.g.:
   ```js
   const ASSETS = { biplane_player: 'assets/biplane_player.glb' };
   ```
   Load all entries before showing the menu (or show menu and hot-swap when ready —
   loading is fast; pick the simpler option). A missing/failed file must NOT break the
   game: log a console warning and use the procedural fallback.
3. Integration point: the model factory functions. E.g. `makeBiplane(PLAYER_PAINT)` for
   the player (called once, mesh stored at `player.mesh` in `fxGroup`). Wrap factories:
   if a loaded GLB exists for that unit, clone it (`SkeletonUtils` not needed — no
   skinning; `scene.clone(true)` is fine); otherwise call the procedural builder.

## Asset conventions (already agreed with the author — enforce, don't change)

- Format: GLB, exported from Blender, transforms applied, Y-up (Blender default export).
- Nose/forward along **+Z**, up +Y. Game code steers assuming +Z forward.
- Scale in game units: player biplane ≈ **9 units wingspan**. If the loaded model's
  bounding box deviates wildly, log its size to help the author calibrate — do NOT
  auto-rescale silently.
- Vertex colors (or small palette texture). On load, traverse the scene and normalize
  materials to match the game look: `MeshPhongMaterial`, `flatShading:true`,
  `vertexColors` if the geometry has a color attribute, `map` preserved if present,
  `shininess:6`. Set `castShadow=true` on all meshes.
- Named moving parts inside the GLB (separate child objects, origins on their pivot):
  - `prop` — spins around local **Z** (game does `prop.rotation.z += …` per tick)
  - `turret` — yaws around local **Y** (`turret.rotation.y = angle`);
    battleship uses `turret1`, `turret2`, `turret3`
  - `legs` (tripod: 3 objects), `limbs` (robot: 4 objects) — swing around local **X**
- After loading, map named nodes into `mesh.userData` exactly as the procedural
  builders do, so the existing animation code works unchanged:
  `userData.prop`, `userData.turret`, `userData.turrets` (array), `userData.legs`
  (array), `userData.limbs` (array), `userData.eye` where applicable.

## Existing code landmarks (grep for these)

- `function makeBiplane(P)` … `makeBomber`, `makeBalloon`, `makeTank`, `makeTruck`,
  `makeBoat`, `makeBattleship`, `makeZeppelin`, `makeSaucer`, `makeTripod`, `makeRobot`
- `PLAYER_PAINT` / `ENEMY_PAINT` — paint schemes for procedural biplanes; loaded GLBs
  ignore these (colors are baked), but keep the factory signature.
- `player.mesh` creation near `/* PLAYER */` section; `spawnEnemy()` calls
  `def.make()` per enemy type in `ETYPES`.
- `syncEnemies()` reads the `userData` fields listed above each stop-motion tick.
- Static scenery uses the `Builder` merge — GLB scenery/buildings are a LATER phase and
  will need InstancedMesh; do not tackle in this pass.

## Acceptance checklist

- [ ] Game runs unchanged with an empty `assets/` folder (fallback path).
- [ ] With `biplane_player.glb` present, the player flies the authored model; prop spins;
      shadows cast; tilt-shift/reflections unaffected.
- [ ] Wrong-scale or wrong-orientation model produces a helpful console warning
      (bounding-box size + forward-axis hint), not silent weirdness.
- [ ] No regression in load time > ~1s; no errors in console.
- [ ] Keep everything in the single HTML file except the assets folder.

## Verification

`node --check` on the extracted `<script id="game">` block after edits
(awk between the script tags), then manual smoke test in the browser via local server.
