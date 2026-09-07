> Historical snapshot. For current behavior and release checks, start with [README.md](README.md). The September repair report supersedes implementation status in this document.

# Whole-village polish and earned responsibility

## Implemented

- Every player, roaming villager and house resident uses a shared adult scale and a single ovoid head with painted eyes, eyebrows, cheeks and a smile. Skin tones, kurta colours and hair vary. No separate jaw, nose spheres or second facial mass.
- Walking cadence responds to travelled distance. Cattle use a four-beat walk, articulated two-segment legs, planted/swinging hoof phases, slower heading changes, head motion and tail motion. Hens now alternate their legs. Grazing companions remain available after the favours.
- The detailed courtyard-house model extends to all home types, with curved tiled roofs, plaster, brick, wooden shutters, veranda and pottery. Public buildings get matching surface detail, signs, windows and pottery. Fields contain instanced stalks and ears; markets contain produce, wooden counters and cloth shades; wells have rounded stonework and water. Dairy yards use the revised cattle model.
- Neem-like foliage, scattered grass, textured soil and lanes, warmer lighting, improved shadows, and a detailed loading truck extend the environment treatment beyond the original benchmark. Static house detail is batched by material to reduce rendering overhead without dropping geometry.
- Interiors have freely orbiting cameras and camera-side cutaways. Overhead beams disappear, near walls and their fittings are hidden, and the camera is no longer trapped inside the walls. Textured furniture, rugs, shelves, pots and indoor shadows add detail.
- Five finite favours: pump/deliver water, collect/sort litter, carry fodder/feed a cow, carry three sacks/load a truck, and water saplings. Visible carrying, brief cancellable actions, directions, a ground waypoint and named responses replace one-click checklist completion.
- Ordinary villagers cannot access the works budget or planner. Guards cover the planner entry, its mutation handler, treasury chest and initial election. Five favours lead to a nomination and fictional ballot, then Panchayat membership unlocks planning. Member status does not grant a second vote.
- The villager opening has eight-minute days and relaxed evenings. No early thief, hunger/population cascade or forced lamp timeout interrupts the favours. The existing economy, construction, policies and later progression remain after election.
- Browser save/resume preserves favours, carried objects, construction, resources, elected rank and simulation state. Pause and an explicit new-village confirmation are available. The separate learning journal remains intact.

## Validation

Automated Edge checks cover the complete five-favour sequence through keyboard interactions, early planner/chest denial, election, unlocked construction and save/reload. Visual smoke checks cover the shared head/scale, moving cattle, all building factories, four indoor camera quadrants, optional recall/written practice, and a narrow-screen jobs layout. Screenshots are in `qa/`.

All artwork in this pass is locally authored geometry or canvas material maps. No external model or image service is required. The result is a more detailed, friendly stylised 3D village; it is not photorealistic scanned art. Classroom enjoyment, exam readiness and long-session performance still need observation with actual students. Chapter coverage is unchanged; see `CURRICULUM.md`.

## Fun audit: what this pass prioritised

The immediate loop now has an understandable intention, a physical action, a visible delivery and a neighbour response. Progress survives closing the tab. The opening gives players time to explore and postpones civic management until they have a reason to care about the village. The next substantial content opportunity is branching neighbour stories and a recurring market day, rather than adding more one-off chores. Those are recorded in `FUN-ROADMAP.md`, not presented as implemented systems.
