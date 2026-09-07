# Audit repairs — 8 September 2026

This implements the eight confirmed findings in [the latest audit](LATEST-AUDIT-2026-09-07.md), on top of the already present gameplay update. The earlier audit remains a historical record of the defects.

## Changes

| Finding | Implemented behaviour | Verification |
| --- | --- | --- |
| R01: overnight deliveries disable saving | An unfinished daily favour keeps its type and recipient across dawn. Completed tutorial deliveries cannot increment their original counter. An extra sack from an older save can still be unloaded safely. | Water, fodder and grain each survive save/reload, dawn, delivery, and another reload. Completed truck count remains 3 and saves succeed. |
| R02: unsafe imports | A shared allowlist controls serialized/restored simulation fields. Nested daily/story/memory/account data is checked; identities must be known, enum indices must be integers, and markup/prototype keys are rejected. Jobs and nearby prompts escape saved text. | Crafted backup rejected through the actual file-import UI. Valid backup still imports/reloads; added runtime-only fields do not overwrite the running simulation. Fractional rank, invalid age and malformed daily job are rejected. |
| R03: narrow phone planner | Two columns now apply only above 700 pixels. Phones stack the project details and map, retaining the named selector and full-width action. | Selected well details and action checked at 320, 360, 390 and 667 pixels; screenshots inspected at 320 pixels. |
| R04: errand clock reverses/skips time | `advanceVillageTime()` owns phase boundaries for both normal ticks and the long route. Nighttime crossing attempts ask the player to wait for daylight without changing time or stage. | Daytime t=470 plus 90 seconds becomes night t=80. Night t=149 remains unchanged. |
| R05: story hides night duties | The village objective selects urgent elected-night duties before consulting an optional story. Removed the second story wrapper that bypassed this rule. | Active basket route/delivery at night still points to the Sabha. |
| R06: spending after a lost mandate | `publicWorksPermission()` checks elected rank, mandate and daylight. Both planner and story use it, including inside purchase callbacks. | Lane/water options are disabled after a loss; calling the callback cannot spend coins. |
| R07: accounts disappear on reload | The save schema includes the last dawn summary and finished-at-dusk count. Older saves may omit them. | Summary matches before/after reload and the completion count survives. |
| R08: blocking Sabha dialogue | New `sabha-ui.js` presents speakers through the shared bubble system. A compact, collapsible vote panel leaves the simulation running. Hear next can replace a speech; unrelated conversation can interrupt it. Closing the discussion preserves unrelated speech and allows the vote to be resumed that night. | Walk during speech, interact with the clerk, close/resume the discussion, hear another speaker and complete a vote without pausing. |

The vote panel uses its own element IDs so it cannot conflict with election screens. Speaking to another person collapses the choices; the panel hides outside the hall or while a normal menu is open. It includes named controls and keyboard focus styles.

## Files and ownership

- `village-life.js`: daily-job lifecycle, safe repeat deliveries, escaped text, objective priority and save allowlist use.
- `persistence.js`: shared save fields, nested validation and backward-compatible optional accounts.
- `game.js`: shared time advancement and spending permission, Sabha voting integration and indoor speech positions.
- `village-story.js`: daylight crossing rules, normal phase transitions and shared public-spending checks.
- `sabha-ui.js`, `astra.css`, `index.html`, `boot.js`: nonblocking Sabha controls, phone planner layout and startup dependency check.
- `tests/audit-fixes.cjs`: transition/import/phone/Sabha regressions. `tests/gameplay.cjs` follows the new vote interface; `package.json` includes the new suite in the complete check and formatter.
- `README.md`, `CHANGELOG.md`, `PERFORMANCE.md`: current controls, save behaviour, accurate tutorial-election wording and refreshed performance evidence.

This release also includes the gameplay work already present when the fixes began: gradual approval, daily favours, morning accounts, election consequences, clearer objectives, the basket risk, reduced toolbar, merged neem trunks and the rebuilt banyan. Its detailed list is in `CHANGELOG.md`; these were preserved while repairing their edge cases.

## Validation

Passed the existing smoke/integration, seven phone dimensions, three speech layouts, performance invariants, repair regressions, gameplay suite, and the new audit-fix suite. The new gameplay and audit-fix suites also passed with the software-renderer settings used by CI (Low, DPR 0.35). First-party JavaScript syntax was checked. Release validation checks the content hashes of all 15 local runtime assets.

The new async import test waits for validation to finish rather than assuming a file change event completes its asynchronous read immediately. The existing carrying-resource test warms the pool and checks bounded growth; this run held at 906 → 906 geometries across 30 cycles.

Updated ten-scenario benchmark data: [raw results](fixes-2026-09-08/benchmark-results.json). Starting-view observations were 108 draw calls in phone emulation and 1,047 on desktop High. Scene randomness means these are observations, not strict before/after guarantees. Desktop emulation does not establish physical-phone FPS, battery use or thermal performance.

Screenshots: [320-pixel planner](../qa/fixed-planner-320.png), [390-pixel planner](../qa/fixed-planner-390.png), [phone Sabha](../qa/fixed-sabha-phone.png). Earlier user screenshots were preserved; broad test output was generated in a separate temporary copy.

## Remaining limits

Physical Android/iPhone/Safari and low-end laptop sessions still need hands-on validation. The tutorial's first election is an earned fixed 12/15 result; daily errands and the market story remain authored gameplay. The quality governor changes resolution/shadows rather than rebuilding the initially selected geometry tier. The project still has a large shared simulation module; this patch centralizes the rules responsible for the audited regressions without attempting a complete engine rewrite.

Hosted CI and deployment results are reported with the release once available.
