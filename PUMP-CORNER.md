# Pump corner: a playable graphics benchmark

**Historical benchmark.** Its shared visual treatment has now been expanded in `world-art.js`. The corner shortcut has been retired; start or continue the full village at `http://127.0.0.1:8773/`. See `POLISH-PASS.md` for the current implementation.

## What changed

- One existing house at game coordinates 1040, 860 has a new exterior: overlapping curved terracotta tiles, a pitched roof with timber structure, lime-plaster walls with fine surface variation, exposed brick courses, recessed timber door, shuttered windows with grilles, a small veranda and stone steps. Its resident, door interaction and interior remain connected to the original game.
- The pump is now a rounded cast-metal assembly with mounting bolts, a lever, bent spout, concrete apron, drainage stones and a handled metal bucket. The existing water/garden interaction drives its animation.
- The corner has textured earth with a fading boundary, a dampened area near the pump, scattered stones, grass, a low brick boundary and a charpai with individual woven ropes.
- A new tree uses branching geometry and 2,100 compound-leaf cards in an instanced mesh. Grass, roof tiles and scattered stones are also instanced to avoid one draw call per object.
- The player and one nearby resident have smoother body shapes, facial features, shaped hands, sandals, cotton clothing and a gamcha. They retain the existing walk rig and the same neutral adult height as the other villagers.
- One existing cow has a new smooth exterior with a muzzle, eyes, horns, ears, hump, articulated legs, tail and bell. It retains its roaming and greeting behaviour.
- Shadow resolution is concentrated around the player when close to the sample, then returns to the wider village coverage outside it.

The surrounding village retains the previous visual style. This is a scoped, more natural **stylised** benchmark, not a photorealistic conversion of the whole game.

## Assets and implementation

All meshes and material maps shipped in this pass are generated locally by `pump-corner.js`. There are no new downloads or external asset licences required to play. Materials use roughness, metalness and small surface bump variation. The earlier optional Google font requests remain unchanged; installed font fallbacks work if those requests are blocked.

`astra.js` still contains the same simulation extensions and learning UI. Startup now waits for `pump-corner.js` to install its model overrides before the first frame, avoiding a race that could show the old house. `index.html` preserves the detailed player's material instead of overwriting it with the old flat material each frame.

## Checks

Desktop Edge at 1440×900 and emulated touch at 390×844:

- Sample shortcut starts at the corner; no uncaught JavaScript or shader errors.
- Correct detailed house is rendered and E enters its existing resident's interior.
- Pump water appears, water reaches the garden, and the cow's greeting response works.
- Journal opens and closes from the house interior.
- Detailed and original human rigs retain matching neutral standing height.
- Touch E and Jump controls remain available.
- Representative desktop view: roughly 600–750 draw calls and 115,000–120,000 triangles, including the original village. A short 90-frame test completed without a stall; this is not a low-end-phone performance certification.

## Next decision

Judge this corner in motion before expanding the treatment. For a larger jump to photorealism, the next pass would need sculpted/skinned character and animal assets, photographic material scans, and more complete environmental lighting. The current benchmark establishes believable construction, scale and surface detail while keeping the game editable and self-contained.
