# Latest changes audit — 7 September 2026

## Verdict and scope

The local gameplay update improves the village substantially, but should not be published as-is. Three high-priority findings remain: a normal daily-job transition can disable saving, imported backup text can execute script, and the planner has regressed on narrow phones. Five further issues concern time, objective priority, public-spending permissions, save continuity and the speech-bubble requirement.

This audits the uncommitted working tree over `a467a97bf9aeb539bbc7187e3c6a1901719e04c4`, including `CHANGELOG.md` and `tests/gameplay.cjs`. Remote `main` was fetched and still points to that commit. The new local gameplay changes are not on the shared live site. No game code was changed or pushed during this audit. Tests ran against an isolated copy to preserve existing local changes and QA screenshots.

Source review covered the changes in game, world art, village life/story, quality, phone UI and CSS, plus persistence, speech, boot, release tooling, CI, tests and prior audit claims. It is not a physical-device certification or an assertion that every possible gameplay state was exhaustively explored.

## Confirmed findings

### R01 — P1: an overnight grain sack permanently invalidates subsequent saves

**Source:** `village-life.js:569–591`, `:681–711`; validation in `persistence.js:22–28`.

Complete the original truck job, so `state.loads` is 3. On day 4, pick up the daily grain sack and keep it through dawn. Day 5 replaces the favour with a water delivery, but preserves the carried grain. Unloading it now misses the daily-truck branch and increments the original counter to 4. Every subsequent village save fails validation. The last good save survives, but further progress cannot be saved through ordinary play.

**Reproduced:** day 4 truck → day 5 water → unload → `loads: 4`; save returns `ok: false`, “Save could not be validated.”

**Fix:** separate original-job progress from repeat deliveries; explicitly resolve or retain in-flight daily jobs at dawn. A sack must remain deliverable without changing completed initial-job counters. Test carry → dawn → delivery → save → reload for all three repeat jobs.

### R02 — P1: imported daily-favour text executes HTML/script

**Source:** `persistence.js:7–125`, `village-life.js:900–912`, import handling in `quality.js:213–243`.

The new `state.daily` object has no schema validation. Its `who` value is inserted directly into the Jobs screen HTML, including the objective title. A backup accepted through Settings can contain an image with an event handler in that field.

**Reproduced through the actual import UI:** import a locally generated test backup, continue the restored village, open Neighbour jobs; a harmless event handler sets `window.auditMarkupExecuted` to true. No external data was sent. This requires a player to import a crafted backup; it is not an unsolicited remote exploit. Executed code nevertheless runs in the game's origin and can affect browser saves.

**Fix:** validate all new nested save fields, restrict identity to known actor IDs, and render saved strings with `textContent` or escaping. Validation and safe rendering should both be present. Also reject fractional/out-of-range enum indices: `rank: 1.5` currently passes validation even though rendering indexes `RANKS` with it. Restore should use an explicit permitted-field schema rather than accepting every non-function property already present in `S`.

### R03 — P1: the widened planner breaks the phone detail column

**Source:** `astra.css:764–766`, overriding the earlier responsive `.plan` rules.

The new `.plan-card .plan` rule applies a two-column grid at every width. Its higher specificity beats the existing phone layout; the side panel retains its earlier phone ordering.

**Measured:** at 390×844, columns are `90px 240px`; at 320×568, they are `20px 240px`. The panel's text wraps into a narrow vertical strip. The card has no horizontal overflow, so a simple overflow assertion misses the defect. The named select survives, but reading and using project details becomes difficult.

**Fix:** scope the two-column rule to sufficiently wide screens, explicitly restore one column on phones, and test a selected project, its cost, description and action button at 320, 360 and 390 pixels.

Screenshots: [390 pixels](latest-review-2026-09-07/audit-planner-390.png), [320 pixels](latest-review-2026-09-07/audit-planner-320.png).

### R04 — P2: the safe route reverses time near dusk and can skip the rest of night

**Source:** `village-story.js:354–356`.

The route applies `Math.min(S.dayLen - 30, S.t + 90)` regardless of the current phase. At daytime `t=470`, taking the route sets time backwards to 450. At nighttime `t=149`, it sets time to 239 although the night lasts 150 seconds; the next simulation tick advances to dawn, potentially applying missed-meeting/late penalties.

**Fix:** either restrict the errand to daylight or advance elapsed time through the normal phase-transition logic. A cost must never decrease elapsed time. Test early day, the last 30 seconds of day, night and a pending Sabha.

### R05 — P2: an active optional story hides the elected-day objective

**Source:** `village-life.js:838–842`, `village-story.js:246–298`.

Story targets always win before `electedTarget()`. With an undelivered basket at night, the objective continues to say “Deliver Meera’s basket to Hari” when the player should attend the Sabha. A funded project awaiting tomorrow similarly overrides the meeting/home sequence. This defeats the new objective guidance in exactly the mixed state where a player needs it.

**Reproduced:** rank 1, night, `sabhaDone=false`, story stage `deliver` → the returned objective remains the basket delivery.

**Fix:** give time-sensitive duties priority, with the optional story shown separately or explicitly selected. Test every active story stage across dusk and dawn.

### R06 — P2: story spending bypasses a lost mandate

**Source:** `village-story.js:161–184`; compare `game.js:1586–1593`.

The planner blocks spending on the day a re-election is lost. The story's public project checks rank and available coins but never checks `mandateLost`. Opening the story through Neighbour jobs still permits spending 20 public coins that day, contradicting “No plan from you today.”

**Reproduced:** day 4, `mandateLost=4`, 80 coins → choose lane → 60 coins and project `lane`.

**Fix:** centralize permission to authorize public work and use it in both the planner and story. If story projects are an intentional exception, define that exception in the rules and player-facing explanation.

### R07 — P2: the new accounts lose continuity after reload

**Source:** save field list in `village-life.js:74–103`; `game.js:887`, `:1115`, `:1186`, `:1202`.

`S.lastDawn` and `S.finishedAtDusk` are not serialized. Reload after the accounts and the pause/phone menu loses the actual reasons happiness and approval changed, falling back to generic advice. Reload between dusk and dawn and the next accounts omit the just-finished construction count.

**Confirmed:** both fields are absent from a successful exported save after being populated.

**Fix:** persist a validated compact summary/count or derive it from durable events. Add reload tests at both points.

### R08 — P2: the Sabha still uses blocking dialogue panels

**Source:** `game.js:1305–1371`, `screen()` at `:834`.

Ordinary conversations use speech bubbles and allow movement/interactions. The night Sabha still inserts villagers' spoken lines into a full-screen list and pauses the world. This remains an exception to the earlier requirement that everyone speak in bubbles and speaking not prevent other actions. This is retained behaviour, not a new regression.

**Fix:** deliver spoken lines through the shared dialogue system; keep a separate compact vote/decision interface where an explicit choice is necessary. Test leaving a conversation, speaking to another character and returning to the vote.

## Gameplay, fun and intuitiveness

- **Keep:** the readable elected-day sequence, concrete morning accounts, remembered-favour dialogue rotation, a recurring reason to see neighbours, fewer toolbar buttons, Meera offering her errand in the world, and visible use of the chosen project. These connect the management layer to the village better than the previous build.
- **The first election remains predetermined.** Entry requires all five favours, so `2 + backing.length * 2` always produces 12/15 during normal play. The presentation now explains the result, but it does not create an uncertain election. Either describe it as the tutorial's earned outcome or introduce meaningful competing priorities; do not claim variable electoral stakes from the formula alone.
- **Daily favours repeat a fixed three-day cycle.** Water, fodder and grain give useful activity, but are still the initial tasks repeated. Variation in circumstances, dialogue and consequences will matter more than adding more identical deliveries. Resolve R01 before expanding this system.
- **The basket spill is primarily a detour.** The spilled flag changes dialogue and sends the player along the safe route; it does not change the subsequent project choice or reward. That can suit a gentle game, but the language about losing half the vegetables currently promises more consequence than the state model delivers.
- **The morning accounts are always modal.** Useful on the first elected dawn; repeated mandatory reading may interrupt free exploration. Consider a compact morning notice with optional accounts history after the first introduction. This is a design recommendation, not a correctness failure.
- **Guidance still needs one owner.** Jobs, story and the elected day each choose directions independently. R05 is an actual result of that competition. A single objective selector with explicit priority/selection would make the game easier to extend.

## Performance and art

The batching change reduces draw submissions in the refreshed scenarios. All 207 inspected instanced meshes were culled; the garden was visible, camera regression passed, Three.js reported revision 185, and carrying geometry remained 906 → 906 after warm-up and 30 cycles.

| Profile / scenario | Prior documented calls | Latest measured calls | Latest triangles |
| --- | ---: | ---: | ---: |
| Phone emulation / start | 206 | 119 | 117,438 |
| Phone emulation / pump | 191 | 114 | 114,734 |
| Phone emulation / crowded | 459 | 335 | 146,147 |
| Phone emulation / night | 297 | 173 | 125,925 |
| Phone emulation / interior | 54 | 54 | 3,606 |
| Desktop / start | 1,573 | 1,030 | 388,396 |
| Desktop / pump | 1,423 | 940 | 370,788 |
| Desktop / crowded | 2,193 | 1,619 | 609,167 |
| Desktop / night | 1,574 | 970 | 348,149 |
| Desktop / interior | 110 | 110 | 18,754 |

These are same-harness observations, not deterministic scene-by-scene performance guarantees: world generation contains randomness. Phone start triangles increased from the prior 94,458 while calls fell. Fewer calls does not establish an equivalent FPS gain or lower battery use. The new banyan adds visible geometry; retain that trade-off only after device testing.

The benchmark used desktop Edge, Low with DPR 1 for phone emulation and High with DPR 1 for desktop. Around 6.9–7 ms RAF intervals describe this computer's scheduler, not phone GPU timings. `PERFORMANCE.md` adds the new batching claim but still carries the older measurements; refresh it with a clearly dated dataset. Raw new results are preserved beside this report.

Remaining performance work: actual 10–20 minute sessions on Android, iPhone/Safari and a low-end laptop; sustained input latency and thermal behaviour; crowded and newly developed villages. Auto only lowers pixel ratio/shadows, not the initially chosen geometry tier. It also discards all intervals above 250 ms, so sustained extreme slowness supplies no samples for recovery. That is a code-level governor limitation, not a newly measured device failure.

## Previous audit reconciliation

| Earlier items | Current assessment |
| --- | --- |
| A01 / B05 — dawn overlay, game-over reload, intro save | Repair regression suite passes. |
| A02 — truthful save failure | Quota failure is truthful; new R01 disables saving through a different gameplay path. R02 exposes incomplete import validation. |
| A03 — carrying allocation | Current 30-cycle check passes, 906 → 906. |
| A04 — touch cancellation | Existing mobile cancellation tests pass; no new input regression found in this pass. |
| A05 — phone planner | Named select remains; new R03 regresses its detail layout. |
| A06 / B02 / B09 — performance and device tiers | Batching and governor are improvements; physical-device validation and refreshed documentation remain open. |
| A07 / A09 — onboarding and elected pace | Improved start and elected targets; R05 means combined story/night play still misleads. |
| A08 — NPC identity | Core actor-name checks pass. Identity is still spread across resident/actor/name-based systems; no full ID migration. |
| A10 — code ownership | Extracted modules and explicit world/render hooks help. Large global game state and method replacement remain; R05/R06 show why shared rules matter. |
| A11 — tests | All local suites pass, but they miss R01–R07. Add transition and selected-panel assertions, not only happy-path state checks. |
| A12 / B10 — reading, accessibility, dependencies | Zoom restriction removed, local fonts, contrast improvements, current pinned renderer and licence retained. Speech tests pass. Full keyboard/screen-reader and Safari checks remain unverified; Sabha exception is R08. |
| A13 — planner resize lifecycle | Cleanup remains implemented. No new subscription regression identified. |
| A14 — journal write frequency | Debounce retained. |
| A15 — documentation | Historical labels help. New changelog distinguishes unreleased work; current performance table needs refresh. |
| B01 — culling | All 207 inspected instances have culling enabled. |
| B04 — invisible garden/banyan/camera | Current art and repair tests pass; new banyan exists and is visible. |
| B06 — error recovery / startup | Recovery and delayed startup regression pass. |
| B07 — ground contact | Shared contact shadows retained. Indoor NPC grounding remains less complete than player/outdoor actor grounding. |
| B08 — clipped prompts / wrong input copy | Existing short-window and touch tests pass. |

## Verification and release status

- **Passed locally on the isolated latest snapshot:** first-party JavaScript syntax; smoke; integration; seven phone dimensions (320×568 through 844×390); three speech layouts; performance invariants; repair regressions; new gameplay suite; all 14 release asset hashes.
- **Additional audit probes:** reproduced R01–R07; R02 also exercised the real import UI and reload. R08 is directly confirmed by the current dialogue/rendering code.
- **Fresh benchmark:** all ten scenarios completed. Raw data and audit probes are in [latest-review-2026-09-07](latest-review-2026-09-07/). Probe scripts target a disposable server on port 8774 and should only run with disposable browser contexts/saves.
- **GitHub CI:** [run 34125445054](https://github.com/mailmeherepeople-eng/gaon-astra/actions/runs/34125445054) failed on the previously committed strict carrying-geometry equality, `810 !== 809`, at the then-current `tests/repairs.cjs:174`. The latest local test warms the resource pool and allows at most two extra geometries. That revision passes locally, but has not yet produced a green hosted run.
- **Deployment:** Pages for `a467a97` succeeded despite the separate failed game check. The current release process does not make that test failure a deployment gate. A green local audit should not be conflated with green hosted CI or completed physical-phone validation.
- **Build boundary:** source files were not rebuilt in the working tree. The existing latest asset hash tags were verified against the served bytes. No installation, game-source edit, commit or deployment was performed.

## Recommended repair order

1. Fix R01 and R02, with day-transition and actual import/reload regression tests.
2. Restore a usable phone planner (R03), then test selected projects at all narrow sizes.
3. Unify time advancement, objective priority and spending permissions (R04–R06).
4. Preserve accounts across reload and complete the speech presentation requirement (R07–R08).
5. Refresh performance evidence, pass hosted CI, then validate sustained play on real devices before publishing the gameplay update.
