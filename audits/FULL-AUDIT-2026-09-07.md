# Gaon Astra: consolidated product, performance and code audit

Reviewed 7 September 2026 against commit `f0a8aa9`.

**Historical audit status:** implementation now lives in [the repair report](REPAIR-REPORT-2026-09-07.md). The following preserves the pre-repair findings. This was the single merged repair plan for the original audit and the additional user-supplied audit. Runtime fixes and deployment have not started in this consolidation pass. Original finding IDs A01–A15 are retained below for traceability; B01–B10 capture additional findings. The implementation order in this report supersedes the original order.

## Consolidation verdict

The additional audit is substantially correct and materially changes the priorities. Broken session transitions, invisible interactive scenery, uncullable instancing and inconsistent deployment assets belong ahead of new story content. The original audit's save failures, carrying-resource leak, canceled touch input, planner usability, NPC identity and gameplay recommendations remain open.

Three qualifications matter:

- **The live host does send cache headers.** Both the deployed HTML and `world-art.js` returned `Cache-Control: max-age=600`, ETags and Last-Modified headers. Unversioned URLs still allow mixed releases; the proposed asset-versioning repair remains valid. The localhost server is not evidence of GitHub Pages cache policy.
- **Three.js r128 does not use a mesh-level bounding sphere in its object-frustum test.** Its `Frustum.intersectsObject` reads `geometry.boundingSphere`. Simply assigning `mesh.boundingSphere` and enabling culling would be incorrect here. Bounds must include all active instance transforms, with correct ownership when geometry is shared, or use an explicit compatible culling implementation.
- **Attribution is present; the complete vendor license is missing.** The vendor header contains the Three.js copyright and MIT SPDX identifier. Include the full matching license text rather than describing the renderer as completely unattributed.

The new diagnostic is `merged-verification.cjs`; raw output is `merged-verification.json`. Like the earlier probes, it changes state only inside isolated browser contexts. Its culling experiment restores original geometry and flags afterward. It is not a committed runtime implementation or a physical-phone benchmark.

## Additional verified findings

### B01 — P1: instanced scenery bypasses frustum culling

**Location:** `world-art.js:61`, `:71`, `:100`, `:141` and the vendored r128 frustum implementation.

The current probe found **301 instanced meshes, all 301 with culling disabled**, including 286 canopy meshes. Active canopy leaves total 600,600 on desktop and 200,200 on the phone profile. These counts differ slightly from the supplied audit's 300/287; the underlying finding is confirmed.

An in-memory experiment computed conservative aggregate bounds from each active instance, used independently owned geometry bounds compatible with r128, and enabled culling. At the same starting view, submitted triangles fell from **624,359 to 150,759 on the phone profile (76%)**, and from **1,593,578 to 611,778 on desktop (62%)**. Calls fell from 921 to 654 and 2,133 to 1,915 respectively. These are single diagnostic renders, including renderer/shadow behavior, not average gameplay counts or measured speedups. GPU timing, visual correctness and allocation costs still need validation.

**Repair:** bound canopy, field and roof batches correctly; share compatible bounds for identical clones, avoid duplicating every leaf buffer as the diagnostic does, and recompute only when instance transforms/counts change. Account for any animated displacement. Preserve shadow-camera culling as well as the main camera.

**Acceptance:** traverse and rotate through the village, including its edges, at multiple zooms and quality settings. No disappearing fields/roofs, canopy popping or missing shadow casters. Compare representative frame costs before/after on named devices. This is the strongest newly demonstrated rendering opportunity, not proof that it will dominate every device's frame time.

### B02 — P1: device classification gives weak laptops the most expensive graphics

**Location:** graphics initialization in `index.html`; `world-art.js:100`, `:147`; menu in `mobile-ui.js`.

The phone tier depends on coarse pointer plus viewport size. Desktop receives 2,100 leaves per canopy and a 4096 shadow map regardless of GPU capability. Pointer type describes input, not rendering capacity.

**Repair:** add an Auto/Low/High quality setting with a persisted explicit choice. Auto should observe sustained frame times after warm-up and step down render pixel ratio and shadow resolution, with cooldowns and hysteresis to avoid oscillation. Exclude hidden/paused frames and loading spikes; account for display refresh rates. Keep changes infrequent and dispose/rebuild shadow resources correctly. Measure culling first before choosing thresholds. A recoverable manual Low option must work on every input type.

**Acceptance:** simulated slow-frame tests verify state transitions and stable settings; physical low-end laptop and phone sessions verify responsiveness and thermal behavior. A governor cannot promise smoothness where CPU work remains excessive.

### B03 — P1: unversioned assets permit mixed deployments

**Location:** stylesheet and script URLs in `index.html`.

All runtime script URLs, the vendor script and local CSS are unversioned. The supplied user's stale-file observation is credible; this pass verified the mechanism and actual host headers, not that exact historical browser cache.

**Repair:** automate a common release identifier on every first-party script/style and version the vendor URL, or preferably generate content-hashed assets. Publish a consistent release and preserve referenced old assets where appropriate. Do not rely on a hard refresh or claim there are no cache headers. GitHub Pages does not provide the same header controls as a custom server.

**Acceptance:** load the previous release, deploy the next release, and navigate normally using a warm browser cache. Confirm HTML, scripts and CSS belong to the intended release. Test back/forward and reload as well as an empty cache.

### B04 — P1: the tree-art replacement hides gameplay landmarks and leaves an invisible camera obstacle

**Location:** `world-art.js:141`; camera blocker registration `index.html:782` and collision query `:884`.

The replacement identifies entire scene roots by the presence of any descendant dodecahedron geometry. The garden contains such geometry, so its whole root is hidden. The probe confirms `garden.visible === false` while its job still exists. The original banyan is also hidden/replaced by generic neem art, while a hidden blocker at world position (125, 0, 90) remains in the camera's blocker list.

**Repair:** replace explicitly tagged tree objects, never infer an entire gameplay root's type from a descendant's geometry. Restore the community garden and a recognizable banyan. Update camera/physical collision registration to match visible intended world objects, including ancestor visibility. Avoid globally dropping legitimate invisible collision helpers.

**Acceptance:** walk to and complete the garden task; identify the banyan; rotate the camera around both. Verify their interactions, labels, collisions and new art bounds together.

### B05 — P1: restarting after game over restores the failed save; merely viewing the intro creates a save

**Location:** `index.html:604`; `village-life.js:9`, `:76`, `:79`.

The game-over action reloads the page; the unconditional unload handler saves the failed simulation. A controlled happiness-zero loss reproduced another game over after restarting, with happiness still zero. Separately, reloading the untouched welcome page created a village save and changed its action to “Continue your village.”

**Repair:** track explicit session-start and terminal states. Implement a fresh-village transition that cannot be overwritten by unload autosave, while preserving separate journal progress. Define restart versus continue clearly and integrate with A02's save result/schema/recovery work.

**Acceptance:** lose, restart, play and reload successfully; opening and leaving the welcome page creates no village save. A normal ongoing game still resumes, and journal progress remains intact.

### B06 — P1: frame errors repeat without player-visible recovery

**Location:** frame loop in `index.html`.

Scheduling the next frame before work prevents the loop from silently dying, but a controlled throwing tick produced 51 page errors during the diagnostic with no alert banner. The exact count is environment-dependent; the repeated failure is confirmed.

**Repair:** handle the first fatal update failure once, stop repeating the failing simulation work, clear held input and show a readable recovery banner. Avoid autosaving potentially inconsistent state. Keep enough diagnostics for debugging and offer a safe reload/recovery action. A banner alone does not fix the repeated work.

**Acceptance:** injected tick and render failures produce one bounded report and one usable recovery UI; they neither flood logs nor replace the last good save. Test storage failures separately so a recoverable save warning does not unnecessarily terminate play.

### B07 — P2: shadowless characters lack ground contact

**Location:** phone shadow setting in `index.html`; soft shadow texture/material in `world-art.js:33–35`.

Disabling real-time shadows removes character contact cues. Reuse the existing soft texture for pooled ground-aligned blobs beneath people and animals. Follow ground height, vary opacity/size with jumping, and hide them with absent or indoor actors as appropriate. Keep draw cost modest through sharing/batching; the static scenery blobs already present are not substitutes for actor grounding.

**Acceptance:** inspect movement, slopes, jumps and room transitions on Low quality; contact looks natural and does not introduce z-fighting or a significant draw-call increase.

### B08 — P2: short desktop prompts clip; copy does not match input or permissions

**Location:** `astra.css:61`; `village-life.js:59`; Panchayat door copy at `index.html:556`.

At 900×400 with mouse input, the prompt's measured left edge is **−80 CSS pixels**. The short-window rule changes left/right but retains the translated centering layout. The phone menu also inherits “E to interact · Jobs button,” and the Panchayat door promises coins to an ordinary villager who cannot collect them.

**Repair:** use one explicit prompt positioning model per layout, with safe-area and bounded overflow behavior. Generate instructions from available controls and actions from actual eligibility. Combine with A04/A05/A07/A09/A12; keep ordinary conversation in nonblocking speech bubbles.

**Acceptance:** prompt bounds at short mouse windows as well as phone portrait/landscape; phone instructions name visible controls; villager/elected/collected states each have truthful door text.

### B09 — P2: performance documentation and automation do not represent the full play session

**Location:** `PERFORMANCE.md`; `tests/`; package scripts. Consolidates A06 and A11 rather than replacing them.

The existing document explicitly describes a close pump view, but its headline table is too favorable to stand for normal play. The original audit recorded 686 phone calls; the supplied audit reported 664; this new starting-view diagnostic recorded 921. These are different observations, not interchangeable stable budgets. This probe's pump snapshot had 718 calls and 614,479 triangles; camera, timing, shadows and renderer state must be fixed before drawing exact comparisons. The supplied “15% heavier” is not a universal multiplier.

**Repair:** retain historical numbers with their scenario labels and publish repeatable starting, walking/crowded, night, interior and interaction-loop scenarios. Record device/browser/build, viewport/DPR, camera, quality, warm-up, median/p95 frame times, draw calls, triangles and resource growth. Include sustained physical-device sessions. Remove or rewrite obsolete `tests/pump-corner.cjs`; include all active suites in the documented release command and CI, with a lockfile and reproducible dependencies.

**Acceptance:** another person can reproduce the scenario and understand its variance; no pump snapshot is presented as typical physical-phone FPS. Tests cover normal player navigation and the newly reproduced failures, not only direct state manipulation.

### B10 — P2: accessibility, dependency and maintenance debt need a tracked pass

**Location:** `index.html:5`, `:8–9`, `:75`, `:86`; `vendor/`; source/doc structure. Consolidates A10–A12/A15.

Viewport zoom is explicitly disabled. Google Fonts adds an external request dependency despite the vendored renderer. The small muted text color `#9a9282` is used by policy sources and hints and needs contrast remediation against its actual rendered surfaces; transparent labels must also be checked over changing scenery. A complete rendered contrast inventory and assistive-technology audit remain to be done. These are not claims of whole-product WCAG certification or a proven font-related frame-time bottleneck.

**Repair:** allow browser/text zoom while keeping game gestures scoped to the play surface; improve contrast and support enlarged text. Self-host only the font files/weights actually needed with their licenses, or use robust local fallbacks. Add the full Three.js license. Plan a separately tested renderer upgrade: r128 age is maintenance risk, not by itself proof of a vulnerability. Check changed rendering/color APIs, visuals and performance before migration. Format the 2,400-character lines, consolidate system ownership incrementally, and identify one current documentation entry point with older reports labeled historical.

**Acceptance:** UI remains usable with zoom/enlarged text and keyboard access; contrast is measured in real states; font failure does not block play. Dependency/license inventory is complete, runtime upgrade has visual regressions checked, and the full suite runs reproducibly. Avoid a simultaneous renderer upgrade and giant behavioral rewrite.

## Assessment

**Gaon Astra has a strong setting and a working first playable loop, but it is still a prototype rather than a dependable, replayable village-life game.** The phone HUD, non-blocking speech and lighter graphics are meaningful improvements. The next priority is reliability and a more understandable first session, followed by deeper consequences for a small number of actions.

The strongest concept is already in `FUN-ROADMAP.md`: **a village where your neighbours remember what you do**. The current implementation remembers completed jobs and shared village statistics. It does not yet consistently express that memory through individual people, changing routines, or follow-up stories. That is the largest opportunity for fun and identity.

This pass produces findings and a repair plan. It makes no changes to gameplay or the deployed site. The diagnostic scripts use isolated browser contexts and deliberately altered simulation state to reproduce edge cases; they are not player-facing features.

## Scope and evidence

- Reviewed the nine first-party runtime/source files: `index.html`, `astra.css`, `astra.js`, `village-life.js`, `world-art.js`, `audio.js`, `lessons.js`, `mobile-ui.js`, and `speech-ui.js`.
- Reviewed package scripts, all six test files, the vendored Three.js header, and the README, product, design, curriculum, roadmap and prior audit documents. The entire third-party minified renderer was not independently audited.
- Ran all five active suites: smoke, gameplay integration, mobile, speech and performance. All passed. Mobile covered seven viewport sizes; speech covered phone portrait, landscape and desktop; performance covered phone and desktop profiles.
- Added diagnostic probes in `full-review.cjs` and `edge-review.cjs`. Their outputs are `runtime-findings.json` and `edge-findings.json`. Screenshots are in this directory.
- Inspected the initial phone view and phone planner visually. Edge probes covered sleeping across dawn, touch cancellation, storage failure, repeated carrying, planner lifecycle, population changes, missing legacy controls, and oversized dialogue.
- No physical Android/iPhone testing or student enjoyment study was performed. Desktop touch emulation is not evidence of physical-device FPS, thermal stability, Safari compatibility or learning effectiveness. Synthetic stress cases are marked below.

## UI health score

These are review scores, not an accessibility certification or a measure of enjoyment.

| Dimension | Score | Reason |
| --- | --- | --- |
| Accessibility | 2/4 | Named dialogs, visible focus and speech announcements help; the planner has no equivalent keyboard/list interaction, small text is common, and viewport zoom is disabled. |
| Performance | 2/4 | Recent phone reductions and UI caching work, but carrying leaks GPU geometry and scene complexity remains substantial. |
| Responsive design | 3/4 | Ordinary phone controls and prompts pass bounds tests; planning, enlarged text and longer dialogue need further work. |
| Theming | 2/4 | Coherent paper/terracotta identity, but colors and component rules are duplicated across inline and external CSS. |
| Visual consistency | 3/4 | The village has a recognizable visual identity; several old panel, card and accent-border treatments remain inconsistent. |
| **Total** | **12/20** | **Significant work remains, despite the successful recent fixes.** |

The visual identity passes the basic distinctiveness test. A new visual theme is not a priority. The inconsistencies mainly come from accumulated component overrides rather than a missing art direction.

## Original findings retained in the merged backlog

The original audit contributes 15 findings: 3 P1, 10 P2 and 2 P3. The B findings above add new failures and expand overlapping topics; they should not be summed as 25 independent bugs. P1 means address before wider playtesting; P2 means the next development pass; P3 means maintainability/polish. There is no demonstrated P0 issue. Design opportunities later in this report are hypotheses, not additional confirmed bugs.

### A01 — P1: the sleep overlay survives dawn for an ordinary villager

**Location:** `village-life.js:23`; `index.html:607`, original `dawn()` at `index.html:309`.

The relaxed opening replaces the original dawn handler. It clears `S.asleep`, but does not hide `#sleep`. The probe slept just before the night ended and advanced the normal simulation: the result was `phase: day`, `asleep: false`, **sleepOverlay: true**. The world can continue underneath a misleading full-screen sleeping layer. This is particularly confusing because the opening explicitly allows players to rest at home.

**Repair:** centralize sleep/wake transitions so every rank exits the visual sleep state, clears the correct input state and restores the expected location/camera. Keep economy rules separate from that shared transition.

**Acceptance:** enter the bed as a villager and as an elected member, cross dawn, and verify the overlay, movement, interaction, camera and save/reload behavior. Cover both voluntary and forced sleep.

### A02 — P1: failed saves are reported as successful

**Location:** `village-life.js:9–11`, `mobile-ui.js:12–14`, `astra.js:6`.

The save function catches storage failures and returns no success/failure result. The phone menu always says “Village saved.” A probe that made `localStorage.setItem` throw `QuotaExceededError` still received that success message. Learning saves also swallow errors. Players could invest time while believing progress is safe.

Save validation is also minimal: a matching version and two arrays are enough to accept a save. An incomplete structured save with an empty building list was accepted in the probe; it did not immediately crash, so this is a resilience gap rather than a demonstrated startup crash.

**Repair:** return a save result, display actual status and last successful save time, validate required fields and entity references, and retain a recoverable previous save. Add export/import for player-owned backups. Save at important boundaries and on page visibility changes, without falsely claiming guaranteed persistence.

**Acceptance:** test unavailable storage, quota failure, malformed JSON, structurally incomplete saves, migration, reload after each completed job, and recovery without overwriting a good backup.

### A03 — P1: carrying items grows allocated GPU geometry

**Location:** `village-life.js:37` and the `take()`/completion paths immediately below it.

`visuals()` removes carried meshes with `carried.clear()` and creates new geometries for the next item. Removed GPU geometries are not disposed or reused. Twelve fodder pickup/feed cycles raised `renderer.info.memory.geometries` from **145 to 241**, an increase of **96**. This matches the eight newly created fodder rods per pickup.

This is a long-session problem that a short stationary performance test cannot catch. A game that initially feels smooth can become more expensive as the player keeps interacting.

**Repair:** build reusable carrying models once and toggle visibility, or explicitly dispose owned geometry/materials when removing them. Do not dispose shared world materials. Apply an ownership/lifetime convention to rooms, temporary effects and construction scenery too.

**Acceptance:** after warm-up, 100 pickup/use cycles should not cause geometry counts to grow with every cycle. Follow with a real-device session and memory observation.

### A04 — P2: touch cancellation leaves the action button held

**Location:** `index.html:283–292`.

Joystick cancellation is handled, but the Use and Jump buttons have only down/up/leave handlers. A Use `pointerdown` followed by `pointercancel` leaves `acting: true`. The next press cannot create a fresh action edge until a release resets it. This can feel like an ignored tap after an interrupted gesture.

**Repair:** share cancellation/reset logic across joystick, look, Use, Jump, blur and visibility transitions. Consider pointer capture for held controls.

**Acceptance:** canceled Use/Jump gestures, interrupted multitouch, orientation changes and app switching must leave no held actions or keys; the first returning tap must work.

### A05 — P2: the phone planner is difficult to discover and operate precisely

**Location:** `index.html:452–507`; `astra.css` phone card/plan rules.

At 390 CSS pixels wide, the map is **336 pixels wide** and the selection tolerance works out to a radius of about **12 CSS pixels**. Its dots mostly show prices until selected. The user must discover a building by tapping a small target; adjacent target regions can compete. All plot selection goes through a canvas pointer event. There is no equivalent list or keyboard selection flow.

**Repair:** give the planner a named, selectable building list with price, availability and result. Selecting a row should highlight the same plot on the map. Keep the map for spatial context. Use larger touch targets and retain a visible back/close control when details grow.

**Acceptance:** a new phone player can locate and build a well without guessing which priced circle it is; keyboard users can perform the same task. Test at 320 pixels wide and enlarged text.

### A06 — P2: ordinary gameplay still needs a physical-device performance budget

**Location:** `world-art.js:70–74`, `world-art.js:100–147`; `index.html:614–616`, `index.html:833–905`, `tests/performance.cjs`.

The current audit's phone-profile snapshot reported roughly **614,000 triangles and 686 draw calls** at its test viewpoint. These vary with camera collision, visible actors and procedural layout. The recent reduction is real, but a stationary geometry threshold does not establish a frame-time budget on an actual phone.

The art layer uses many individual materials; for example, market produce creates repeated same-color material instances. That limits batching by material identity. Large instanced vegetation groups span broad areas. Also, much of the outdoor visual update still runs while an interior is rendered.

**Repair:** after A03, profile frame-time percentiles on a named low-end and midrange handset. Reuse materials, split vegetation into spatial batches with distance-based detail, skip off-screen visual animation, and avoid updating outdoor visuals unnecessarily indoors. Add a player-selectable lower-detail mode if the target handset still needs it.

**Acceptance:** record moving-camera, crowded village, interior, night, and 15-minute-session results. Proposed targets should be set against those devices, for example a stable 30 FPS minimum on the chosen low-end device and 60 FPS where feasible. Do not infer those outcomes from triangle counts alone.

### A07 — P2: the first minute and phone controls need more guidance

**Location:** initial `S.player`/camera in `index.html:203–209`, `index.html:272–288`; `village-life.js:54`, opening screen near line 78; `mobile-ui.js`.

The first phone screenshot is dominated by the player's own house and an Enter action, while the objective says “Water for Naresh” and points toward the pump beyond it. The player starts facing the camera, with the house obscuring the forward route. On a phone there is no equivalent to desktop Shift-run or wheel zoom. The objective names the job rather than explicitly naming the immediate action.

**Repair:** start with a clear view of the lane; use “Fill a bucket at the hand pump” then “Take water to Naresh”; briefly teach movement and camera gestures in context. Make a gentle second-stage-stick sprint or another discoverable run option, plus a camera reset/zoom control inside the existing menu. Avoid adding a permanent toolbar.

**Acceptance:** observe unassisted players, measuring time to the first filled bucket, mistaken interactions and navigation stalls. Set targets after observation; current tests teleport to destinations and do not measure this.

### A08 — P2: NPC identity is split between several systems

**Location:** `index.html:196–238`, `village-life.js:6`, `village-life.js:12–16`, `speech-ui.js:18–20`.

Residents, outdoor agents, job owners and the Sarpanch are represented separately. The starting outdoor population includes 15 agents from a 20-name list, so Naresh has an indoor resident entry but no outdoor agent. Kamla also has no starting outdoor agent. Their completion speech falls back to `{n: name}`, and the bubble is anchored to the player when there are no coordinates. A different neighbour can be present indoors and elsewhere without one shared identity.

Another probe reduced population from 15 to 14 through sickness while **15 outdoor agents remained**. The population number and represented inhabitants can diverge.

**Repair:** assign stable NPC IDs and keep one authoritative identity, home, schedule, presence and relationship record. Use explicit indoor/outdoor anchors, or a clearly styled remote message when the speaker is absent. Make population representation intentional instead of incidentally inconsistent.

**Acceptance:** every job owner has a consistent identity and place to meet them; their speech points to them when present; population changes and save/load reconcile agents correctly.

### A09 — P2: elected play changes pace without enough onboarding

**Location:** `village-life.js:20–25`, `village-life.js:54`; `index.html:414–438`, `index.html:567–576`.

The first election changes the day from **480 to 180 seconds** and the night from **150 to 100 seconds**, and activates the economy and threat loop. After five favours the tracker becomes a permanent “Visit the planning table” instruction. It does not teach a new sequence such as collect funds, compare needs, build, attend the meeting and return home.

The first election is explicitly fictional and deterministic, which is reasonable for an introduction. The bigger issue is an abrupt switch from relaxed physical helping to timed management.

**Repair:** provide one guided, forgiving elected day. Present the next concrete responsibility, explain the treasury versus available works budget, and show the next meeting/election timing. Offer a relaxed pace without discarding consequences.

**Acceptance:** a player can explain what changed after election, collect and spend funds, see a completed project and recover from a missed meeting without external instructions.

### A10 — P2: the codebase's ownership boundaries invite regressions

**Location:** `index.html`, wrapper assignments in `astra.js`, `world-art.js`, `village-life.js`.

`index.html` is approximately **124 KB across 1,010 lines**, mixing content, state, input, economy, UI, rendering and interiors. Other files redefine global functions such as `dawn`, `draw`, `screen`, `buildRoom`, `buildingMesh`, and `updateAstraWorld`. Several lines contain over a thousand characters. Job timing and saving are reached through a visual-update wrapper, while other simulation work lives in `tick()`.

This makes it easy for a change in one layer to omit lifecycle behavior owned by another, as with the sleep overlay. The old station/trail implementation remains in `astra.js` although `village-life.js` disables `astraNearby`. Its physical noticeboard no longer has that interaction route.

**Repair:** format first, then extract content, save handling, input, simulation, quests, dialogue, UI and rendering behind explicit interfaces. Keep one update sequence: input → simulation/quests → events → UI → render. Remove obsolete systems only after mapping their remaining dependencies. A framework migration is not required for this.

**Acceptance:** each state transition has one owner; changing graphics cannot change quest timing; an NPC or job can be edited without touching the renderer; legacy trails are either deliberately restored or removed.

### A11 — P2: release verification misses important ways real players use the game

**Location:** `package.json`, `tests/`, repository configuration.

All active suites pass, but the broader probes still found A01–A04. Most gameplay tests position the player or call internal helpers directly. They are valuable interaction tests, but do not establish natural navigation, discoverability or long-session stability.

`npm test` runs only smoke and integration; mobile, speech and performance require separate commands. There is no checked-in lockfile or CI workflow. Tests assume locally installed Edge. The old `tests/pump-corner.cjs` targets `#visitCorner` and `PumpCorner`, both absent from the current runtime; it is not an active test.

**Repair:** add one full verification command, reproducible dependency installation and browser setup, CI, deterministic scenario seeds, and distinct artifacts for each run. Add normal-path navigation, sleep, storage failure, pointer cancellation and resource-lifetime regressions. Retire or update the obsolete benchmark.

**Acceptance:** a clean checkout can run the documented checks; a pull request runs them automatically; tests do not require a developer's saved browser or machine-specific module path. Maintain a small physical-device checklist alongside automation.

### A12 — P2: reading needs more control and safer extreme layouts

**Location:** `speech-ui.js:25–35`; `astra.css:30–60`; `index.html:5`.

The speech bubble has no bounded scrollable reading mode or dialogue history. Its position uses a fixed 170-pixel lower reserve. At **568×320**, a synthetic 55-word line created a **266.7-pixel-tall bubble**, extending below the viewport and overlapping Jump. The existing doctor proposal line was tested separately and did fit; the large-line result is an edge/localization stress case, not evidence that every current conversation overflows.

Many secondary labels are 10–12 pixels, and viewport zoom is disabled. An automatic speech timeout is inconvenient for slower readers; interrupted speech is not retained in a conversation log.

**Repair:** keep the brief in-world bubble, but add an optional recent-conversation view and readable text-size setting. Bound long dialogue against actual available space and safe areas. Preserve game gesture handling on the canvas while allowing useful reading controls in panels.

**Acceptance:** long translated lines, enlarged text, orientation changes and interrupted speech remain readable, without blocking gameplay or obscuring controls.

### A13 — P2: the planner does not clean up its resize subscription

**Location:** `index.html:507`; panel closing in `index.html:298–299`.

Each opening creates a `ResizeObserver` for a new map canvas. Closing removes the DOM without disconnecting the observer. Instrumenting five open/close cycles recorded five observed detached canvases and no disconnects. This demonstrates missing cleanup; it is not by itself a measured browser heap leak, since garbage-collection behavior needs separate profiling.

**Repair:** give screens a cleanup callback and disconnect observers/listeners when closing or replacing them. Apply the same lifecycle convention to future panels.

**Acceptance:** after repeated visits, no planner subscriptions remain registered by the application for a closed screen; confirm heap behavior separately.

### A14 — P3: written answers synchronously save the whole learning record on every keystroke

**Location:** `astra.js:6`, `astra.js:41`.

Every input event serializes and writes the learning record. This may be noticeable on slower storage as written drafts accumulate; this pass did not measure a typing stall.

**Repair:** debounce draft saving, flush on blur/close/visibility change, and share the truthful save-status behavior from A02. Keep completion events immediate.

### A15 — P3: historical documentation is easy to confuse with the current game

**Location:** `README.md:49`, `AUDIT.md`, `SYLLABUS.md`, `PUMP-CORNER.md`, `docs/GAON-3D-DESIGN.md`.

The README still says no remote or hosted deployment exists. The old design describes a second vote for members, although current code adds one vote and current polish notes explicitly reject the extra vote. Earlier audits contain resolved limitations; the benchmark document describes a removed launch control. `CURRICULUM.md` already correctly labels the old syllabus review as historical, which is a useful pattern to extend.

**Repair:** keep one current product/design/status document, mark historical reports prominently, and distinguish implemented, proposed, removed and validated features. Keep the technical audit linked from the current README once its fixes have been scheduled.

## Gameplay and fun: what to strengthen

These are design judgments and testable hypotheses, not claims about what students already enjoy.

### 1. Preserve the setting, deepen the relationships

The village, household tasks, animals and community decisions are a coherent premise. Give three existing neighbours two or three connected beats before adding more people. Completion should change what they say, what they ask, where they spend time, or how they help the player later. A stable NPC model from A08 is the prerequisite.

**Example:** delivering Naresh's water reveals a washing/collection bottleneck. On the next visit he recognizes the help, and the player can help arrange a shared collection point. The visible change is fewer repeated trips, not merely another trust percentage.

### 2. Replace some repetition with small choices

The five opening favours provide working action → feedback → completion loops. Much of their challenge is locating an object and waiting: three litter patches, three sacks, a pump timer. Jump currently has little connection to those goals. The player has limited opportunity to choose an approach or become better at a task.

Add one meaningful variation at a time: choose a short damaged route or a longer safe route, decide which neighbour gets limited help first, guide an animal using positioning, or inspect a clue before taking action. Keep mistakes recoverable and explain their consequences in the world.

**Measure:** do players discuss their choice, try an alternate approach, or improve a second attempt? More chores alone will not establish that.

### 3. Give public projects visible everyday effects

Buildings change numbers, but the most memorable reward would be seeing residents use them: a water queue becomes shorter, the grain route changes, a muddy lane becomes usable, or children gather at the school. Start with one project whose before/after state can be clearly seen.

Keep the budget meaningful. A list of always-positive upgrades is weaker than choosing between two useful projects affecting different neighbours.

### 4. Connect the physical and management halves

The introductory chores and later village planning currently feel like successive systems. Let something experienced personally become the issue discussed at the Sabha. The player should recognize the affected person and place before making the budget decision.

This also makes civics more intuitive: the player already cares about the shared problem, and the journal explains the institution involved.

### 5. Add a reason to see tomorrow

The five jobs are finite. After they are complete, their checklist remains available and the tracker settles on the planner. There is no implemented recurring story generator, market calendar or relationship arc. The existing night/economy loop creates events, but it does not consistently promise a personal next chapter.

The next content investment should be **one short recurring story with a visible payoff**, not the entire feature list in the old roadmap. A seasonal or weekly calendar can follow only once that slice is enjoyable.

### 6. Keep the learning honest and optional

The 24 notes, recall checks and self-marked answers form a useful optional reference. They correctly distinguish recognition, written self-assessment and actual learning validation. No quiz gates the jobs, and the initial election clearly says it is fictional. Preserve those strengths.

Still review the *experience* as well as the notes. For example, treating women's representation as a selectable happiness/election modifier can teach a different lesson from the inclusion discussion in the journal. Population milestones, role ladders and the chair's powers are explicitly simplified in some places and need consistent framing everywhere. These are content-design concerns, not a legal audit; the underlying textbook PDFs and state-specific rules were not independently revalidated in this pass.

Prefer three layers: an understandable fictional scenario, a clear explanation of why the result happened, and an optional accurate reference. Test an unseen situation after play rather than treating checklist completion as learning.

## Recommended next playable slice

Adapt the existing “Meera's market morning” proposal into a bounded **10–15-minute slice**:

1. Start facing the lane. The first instruction names the pump; filling a bucket produces immediate visible and audible feedback.
2. Deliver it to an identifiable neighbour who remembers the help.
3. Accept a market delivery. Choose between a short damaged route and a longer safe one, with a recoverable result.
4. Hear two neighbours explain competing needs at a brief meeting. Spend a limited shared budget on the lane or water collection.
5. Return the next day and see residents use the chosen improvement. Get a different follow-up depending on that choice.

This reuses existing environments, carrying, speech, planning and day transitions. The new work is focused on consequences, identity and continuity. It tests the game's central idea before expanding to a city, multiple villages or a large crafting system.

## Implementation order and acceptance gates

| Pass | Work | Gate before proceeding |
| --- | --- | --- |
| **1. Restore reliable sessions and world interactions** | A01–A04, A13; B04–B06. Sleep/wake, save/restart lifecycle, error recovery, carrying ownership, canceled gestures, planner cleanup, garden/banyan/camera. | Reproduced failures have targeted regressions; loss/restart and continued play work without corrupting progress. Landmarks and their interactions agree. |
| **2. Reduce rendering cost and make releases consistent** | B01–B03, B07; A06/B09. Correct culling, measured adaptive quality, manual menu setting, actor blobs and asset versioning. | No art/shadow popping; bounded long-session resource counts; warm-cache deployment loads a coherent build. Record representative measurements and begin physical-device validation. |
| **3. Make the game understandable and accessible** | A05, A07, A09, A12; B08 and UI portion of B10. Planner list/keyboard access, next-action guidance, role-aware copy, short windows, zoom, contrast and readable bubbles. | Unassisted phone players finish the first favour and understand the next action; mouse/keyboard and enlarged-text layouts also work. Conversation remains nonblocking. |
| **4. Consolidate foundations and release checks** | A08, A10, A11, A14, A15; B09/B10. Stable NPC identity, explicit ownership, formatting, save debounce, full test command/CI/lockfile, licenses/fonts, docs and a separate renderer migration. | Reproducible release checks pass; identity remains consistent indoors/outdoors and through population changes; dependency migration preserves intended visuals and behavior. Add targeted tests and ownership fixes throughout passes 1–3. |
| **5. Prove the concept with a small story** | Market-morning sequence above: remembered help, route choice, shared budget decision and visible next-day payoff. | Players notice and describe consequences and want to see tomorrow. Validate with real playtesting before multiplying quests or systems. |

For interface work, the relevant skill passes are `$impeccable harden`, `$impeccable adapt`, `$impeccable onboard`, `$impeccable clarify` and `$impeccable optimize`, followed by `$impeccable polish`. These can be run individually or in the order above. Re-run the audit after repairs; the acceptance gates matter more than improving a cosmetic score.

## What to keep

- The warm village identity and grounded places/objects.
- A compact phone HUD with tools behind a paused menu.
- Speech that does not lock other interactions.
- Visible carrying and clear action progress.
- The relaxed opening, local save support, and separate learning progress.
- Local geometry and a vendored renderer, so gameplay does not require an external asset service.
- Clear early planner/treasury guards and the optional learning journal.
- The working automated suite and the explicit distinction between emulation, real-device performance and student outcomes.

## File-level follow-up map

| File/group | Next useful improvement |
| --- | --- |
| `index.html` | Extract input, simulation, content and rendering; unify transitions and screen cleanup. |
| `village-life.js` | Save results/schema, carrying resource ownership, stable NPC/job references and progression guidance. |
| `world-art.js` | Shared material instances, explicit resource ownership, spatial/detail budgets. |
| `astra.js` | Remove or restore legacy trails deliberately; consolidate dialog lifecycle and learning persistence. |
| `astra.css` + inline CSS | One source for shared controls, panels, text sizes and tokens; preserve the phone layout gains. |
| `speech-ui.js` | Explicit speaker anchors, long-text layout, optional conversation history. |
| `mobile-ui.js` | Truthful save status, accessible settings, camera/run guidance without HUD clutter. |
| `audio.js` | Retain the compact sound system; profile before optimizing. Completion feedback already exists. |
| `lessons.js` | Readable content records, stable IDs and validation; review claims separately from gameplay balancing. |
| `tests/` + package configuration | One complete verification command, CI, deterministic scenarios and device playthroughs. |
| Documents and screenshots | Current-state index, historical labels, and separate diagnostic evidence from release screenshots. |

**Decision:** implement the merged sequence above, with reliability and rendering improvements first. Keep separate, reviewable changes with the stated acceptance checks. “Fix it all” includes verified engineering repairs and design experiments; enjoyment, physical-device smoothness and educational effectiveness need playtesting and measurement before they can be declared complete.
