# September repair release: detailed change report

Implemented against the merged audit of `f0a8aa9`. Release version: **0.2.0**.

This report separates implemented changes from validation that needs real hardware or players. The audit IDs below refer to [the consolidated audit](FULL-AUDIT-2026-09-07.md). That audit preserves the original evidence; this report is the current implementation status.

## 1. Session reliability and saves

**A01, A02, B05, B06**

- Fixed villager dawn so it clears the full-screen sleeping layer and resets input as well as the simulation sleep flag.
- Added an explicit session-start flag. Opening/reloading the welcome screen no longer creates a village save or an incorrect Continue action.
- Replaced the game-over reload action with an explicit village reset. It clears the primary and previous village saves before reloading, preventing unload autosave from restoring the failed state. Separate journal progress remains intact.
- Added a reset failure message/retry for unavailable browser storage.
- Moved validation and storage ownership into `persistence.js`. Checks cover save version, required numeric state, known buildings/jobs/policies, resident references, arrays, carried items and story state.
- Restore copies approved simulation fields without replacing simulation methods or live room/input state. Resident actors are rebuilt from canonical identities.
- Saves return a success/failure result. Both phone menu and desktop pause display that result instead of unconditionally claiming success.
- Retain the previous valid save and fall back to it if the primary save is invalid. A good backup is not replaced by malformed input.
- Save on meaningful actions, periodic active play and page visibility changes, with session/loss/error guards.
- Added downloadable JSON backups and validated import in Settings. Import describes replacement, protects the restored data from unload autosave, and requires a reload into that state.
- Keep the latest validated snapshot in memory, so export can still work after a storage-write failure while the page remains open.
- Added one-time runtime recovery: stop the failed simulation, clear held controls, show a readable alert and protect the last good save. A failing tick no longer repeats every frame.
- Added `boot.js` for errors before initialization completes, rejected promises and graphics-context loss.
- CI exposed a slow-network startup race: the animation loop could run between script downloads before speech initialized. Startup now waits for all scripts to load; a delayed-speech-download regression verifies this path.

**Verified:** untouched-intro reload; loss/restart; ordinary job/election/construction reload; quota failure with truthful status and exportable state; dawn; controlled tick failure with one recovery alert. These are browser regressions, not a guarantee that local storage can never be lost.

## 2. Scenery and camera correctness

**B04**

- Tagged authored trees explicitly and restricted the tree-art replacement to those objects.
- Preserved the community garden root, its saplings and its interaction. Watering still changes the saplings.
- Preserved the original distinctive banyan and its platform/roots instead of hiding it and substituting a generic tree.
- Filter camera-ray hits by object and ancestor visibility, so hidden scenery cannot act as an accidental camera wall. Intended visible landmarks still block the camera.

**Verified:** the garden is visible; the garden job completes in integration; scene/camera screenshots inspected. A full walk around every map boundary is not an automated visual guarantee.

## 3. Rendering and long-session performance

**A03, A06, A14, B01, B02, B07, B09**

- Added aggregate bounds and enabled culling for instanced scenery, including dynamically built objects. Bounds account for active instance transforms. Identical clones retain shared geometry buffers.
- Reduced desktop canopy density from 2,100 to 1,050 leaves; phone density remains 700. Instanced scenery now includes the correct tree objects rather than every root containing tree-like geometry.
- Added persisted Auto, Low and High settings available on mouse and touch devices.
- Low caps render DPR at 1 and disables live shadows. High caps DPR at 1.5 and shadow maps at 2048 instead of 4096. The intermediate Auto level uses DPR 1.25 and 1024 shadows.
- Focused the main shadow camera around the player: High covers a 64 m square, rather than the previous 180 m square; the intermediate level covers 48 m.
- Auto waits through warm-up, samples sustained frame time, and steps down with a cooldown. It ignores paused/hidden frames and large loading outliers. It does not repeatedly move quality up and down; an explicit user setting takes precedence.
- Added pooled ground-contact blobs for outdoor people, cows and hens, plus the indoor player. They share geometry/texture, follow terrain, shrink/fade during jumps, and follow actor visibility and scene changes.
- Pooled each carried-item model. Repeated pickup/use no longer creates eight new fodder geometries every cycle.
- Cached plain world materials instead of recreating identical standard materials.
- Skip outdoor animal movement/gait work in interiors. Existing path caching, change-driven HUD, paused-frame limit and hidden-tab suspension remain.
- Debounced written journal storage by 350 ms and flush on page hide/visibility change. The learning record is no longer serialized synchronously on each keystroke.
- Added a multi-scenario benchmark with starting, pump, crowded, night and interior views on both graphics profiles, raw camera settings and median/p95 intervals.

**Verified:** the targeted carrying test remained at **940 geometries before and after 30 warmed-up cycles**. All 206 instanced meshes in the tested initial scene had culling and positive bounds. The focused performance suite passed path-cache/HUD/paused-render invariants.

Representative phone-emulation outdoor observations: **191–459 calls and 93,834–125,427 triangles** across the benchmark scenarios. Interior: 54 calls / 3,606 triangles. The focused suite produced a separate pump snapshot of 147 calls / 87,714 triangles. These variations are documented rather than selecting only the kindest result. See [PERFORMANCE.md](../PERFORMANCE.md) and [raw measurements](benchmark-results.json).

**Limit:** these are desktop browser observations. No physical-phone FPS, battery or thermal claim is made. High quality still costs materially more in crowded scenes; Low is available on laptops too.

## 4. Mobile controls, UI and accessibility

**A04, A05, A07, A09, A12, A13, B08, B10**

- Reset Use, Jump and action-edge state on pointer cancellation, blur and visibility changes, preventing a canceled gesture from swallowing the next tap.
- Scoped game gesture suppression to the canvas and game controls. Removed the viewport's disabled zoom; reading panels permit pan/pinch zoom.
- Added camera-distance and run/walk controls in Settings without adding permanent phone HUD buttons.
- Corrected short-desktop prompt positioning by removing the inherited centering transform from the short-window layout. Scroll bounds remain explicit.
- Added a native named plot selector alongside the planner canvas. Projects expose names, cost, plot number and locked state, providing keyboard and precise touch access.
- Reset planner selection each time it opens; refresh options after construction is queued. The planner ResizeObserver disconnects when its screen closes or is replaced, and its temporary API is cleared.
- Moved a new player's spawn onto a lane with the pump in view. The first objective names the immediate action, not just the favour title.
- Objectives now distinguish filling, delivering, feeding, lifting and sorting. Phone copy points to actual Menu/Use controls; desktop retains E guidance.
- Panchayat door text reflects the player's eligibility instead of promising unavailable public money to a villager.
- Elected play keeps 480-second days and 150-second nights instead of abruptly accelerating. Its guidance explains budget collection, project selection and the dusk completion cycle.
- Kept normal conversations nonblocking. Long bubbles have a viewport-aware maximum height and scrolling; speaker positioning still caches dimensions.
- Added spoken lines to the persistent Village memories journal so a player can reread an interrupted conversation.
- Increased muted source/hint readability and gave overhead names an opaque contrasting background. Removed Google Fonts requests and use installed/system font fallbacks.
- Included selects in the dialog keyboard focus loop.

**Verified:** seven phone sizes from 320×568 through 844×390; three speech layouts; short 900×400 prompt bounds; long speech at 568×320; named plot selection; normal keyboard walking toward the opening objective; nonblocking speech while interacting and talking to another person.

**Limit:** no comprehensive assistive-technology or WCAG certification is claimed. Browser zoom/large-text and transparent world-label states still deserve hands-on accessibility testing.

## 5. Villagers, gameplay and the concept

**A07–A09 and the six design recommendations**

- Prioritized the existing named story neighbours in the outdoor roster, including previously missing Naresh and Kamla Devi.
- Use canonical names/resident records when spawning; synchronize actor count when population shrinks and hide unused actor meshes. Restored saves rebuild the roster consistently.
- Added remembered-favour lines for Naresh, Meera, Prakash, Hari and Kamla. The same name-based memory applies indoors and outdoors.
- Added a saved, optional **Meera's market morning** story after the first water favour, accessible from the tools/menu.
- Added a visible carried basket and two physical routes: a short crossing requiring a deliberate stop, or a longer clear lane. Each has a checkpoint and a distinct response; neither imposes an unrecoverable failure.
- Delivery to Hari connects the earlier personal favour to two neighbours' competing public needs.
- Added a choice between a 20-coin lane repair and a 20-coin water collection stand. Only one can be chosen in this story, and the choice spends the existing public works budget.
- Added a next-day objective, persistent project state, visible project geometry and a follow-up response. The affected neighbour periodically heads toward the improvement.
- Retained optional learning and removed the implication that women's representation is an unlockable happiness/election bonus. The saved policy ID now describes meeting access/childcare; the election advantage was removed. Old Sarpanch-choice copy now explicitly identifies the decision as a simplified fictional mechanic.

**Verified:** both route/project branches pass through UI choice, delivery, budget deduction and next-day completion. Existing five-favour/election/construction integration still passes.

**Limit:** this is one authored story, not a recurring quest generator, fully scheduled population simulation or measured 10–15-minute experience. Whether the choices are enjoyable, replayable and educational needs player testing. Additional stories should follow that evidence.

## 6. Codebase, dependencies and releases

**A10, A11, A15, B03, B09, B10**

- Extracted the simulation from the HTML into `game.js` so the HTML is a page shell and the runtime has a named source file.
- Added explicit world-update and before-render hook registries. Art, room cutaways and contact shadows register with those hooks rather than wrapping the draw/update loop repeatedly.
- Split storage/recovery, quality/settings and story state into files with defined ownership.
- Removed the disabled legacy trail interaction/checklist implementation and obsolete introductory flow. Removed the broken `tests/pump-corner.cjs` that referenced deleted controls.
- Formatted all first-party runtime and active test files. The old 2,400-character code lines are gone; some HTML templates remain long and can be extracted further during future feature work.
- Upgraded the local renderer from r128 to **Three.js 0.185.1**, migrated color-space properties and adjusted light intensity for the modern lighting model. Added the complete matching MIT license.
- Added pinned build/format dependencies and `package-lock.json`; npm reported zero known vulnerabilities for the installed dependency tree at installation time. This is not an independent security audit.
- Added a build command that generates the local renderer/license and content-version query strings for every runtime script and local stylesheet, including the vendor and boot scripts. New HTML therefore requests changed asset URLs rather than cached old URLs.
- Added `npm run test:all`, cross-platform browser selection, a repeatable benchmark and a GitHub Actions workflow that installs Chromium, serves the game, runs the complete checks and uploads evidence.
- Rewrote README as the current product/development entry point, replaced the favorable pump-only performance account, and marked old audits/polish notes historical. The roadmap is labeled as proposed work.

**Compatibility change:** the modern renderer requires WebGL 2. Unsupported or disabled graphics now receive a readable startup error. This should be included in physical-device testing; WebGL 1 support was not retained.

**Release limitation:** version queries solve the supplied new-HTML/old-cached-script case. They are not a service worker, offline installation or a fully atomic content-addressed asset archive. An already open page continues its loaded release until reloaded.

## Validation record

- Complete release command passed: smoke; gameplay/save integration; seven phone layouts; three speech layouts; phone/desktop performance invariants; repair regressions.
- Additional regressions cover intro autosave, restart, dawn, canceled input, storage failure, planner selection/cleanup, culling, governor step-down, both story choices, carrying-resource stability, oversized speech and one-time error recovery.
- Representative day/night phone and desktop screenshots were inspected. Renderer migration initially changed scene brightness; lighting was corrected before the final checks.
- Raw results: [repair-results.json](repair-results.json), [benchmark-results.json](benchmark-results.json).
- The final targeted rerun stayed at 938 → 938 carrying geometries; the complete-suite run above stayed at 940 → 940. Scene warm-up differs, while both confirm zero per-cycle growth. The release check also fetched and verified the SHA-derived versions of all 14 local scripts/styles.
- Remaining external validation: named physical Android/iPhone/low-end laptop sessions, Safari, sustained heat/battery behavior, comprehensive accessibility testing and player enjoyment/learning outcomes.

All code changes above are implemented. The external validation limits are deliberately left open; passing desktop automation cannot substitute for those results.

CI uses explicit SwiftShader and Low quality for functional checks on runners without a physical GPU. Local validation covers both phone Low and desktop High. The first CI attempt timed out on the default software graphics path; the test launcher now makes this environment difference explicit.
