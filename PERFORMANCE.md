# Phone performance pass

Phones with coarse touch input and a short viewport dimension up to 900 CSS pixels now use a lighter graphics profile. Desktop visuals retain their existing detail.

- Cap rendering at 1.25 device pixels per CSS pixel instead of 2, and disable multisample antialiasing and live shadow maps on phones. Existing painted contact shadows remain.
- Reduce phone foliage, meadow grass, character mesh subdivisions and texture anisotropy.
- Update the objective at most ten times per second and replace its markup only when its contents change. Stop the simulation and village-life layers from competing to rewrite the resource HUD.
- Cache the lane network until building identity, position or construction status changes. Dispose replaced lane geometry.
- Render the paused world at most four times per second; skip rendering and simulation in hidden tabs. Gameplay still updates on animation frames.
- Cache speech-bubble dimensions until text, fonts or viewport change, avoiding layout measurement on every frame. Update clock text only when its value changes.

## Measurements

At the pump-area viewpoint (player 1110,805; camera distance 7, pitch .3, yaw 0), a 390×844 touch viewport with device scale factor 3 gave these diagnostic snapshots:

| Workload | Before | After |
| --- | ---: | ---: |
| Renderer pixel ratio | 2 | 1.25 |
| Live shadow map | 4096×4096 | Disabled |
| Submitted triangles | 1,444,307 | 607,087 |
| Draw calls | 646 | 512 |
| HUD/objective mutations over 3 seconds | 864 | 0 |

Characters and camera collision make triangle and draw-call counts vary between runs. These are workload measurements from desktop Edge touch emulation, not physical-phone FPS measurements. No sustained 60 FPS guarantee is implied. The graphics tradeoff is sparser vegetation, softer rendering and no dynamic cast shadows on phones; UI text stays at native resolution.

Run `npm run test:performance` with the local server running. It checks phone/desktop graphics selection, stationary UI mutations, lane-cache invalidation and paused rendering. Existing smoke, gameplay integration and speech-interaction regressions also pass.
