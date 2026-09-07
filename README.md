# Gaon Astra

Explore Lakshmanpur, help neighbours, and see how shared decisions change village life. The optional journal covers the supplied Class 6 civics chapters; no quiz gates a favour.

**Play:** [Gaon Astra](https://mailmeherepeople-eng.github.io/gaon-astra/).

This README is the current entry point. [Product principles](PRODUCT.md), [performance measurements](PERFORMANCE.md), [curriculum scope](CURRICULUM.md), and the [latest repair report](audits/FIX-REPORT-2026-09-08.md) have distinct purposes. Earlier audit/polish documents are historical snapshots; the roadmap contains proposals.

## Play and controls

- You start on the lane facing the hand pump. Follow the gold marker and the current action at the top of the screen.
- Desktop: WASD/arrows to walk, Shift to run, Space to jump, E to interact. Click the village to look with the mouse; Escape releases it. Wheel changes camera distance.
- Phone: drag the left side to walk and the right side to look. Use and Jump remain within reach. Menu pauses play and opens jobs, the journal and settings, and explains what moved happiness and approval.
- Settings provides sound on/off, Auto/Low/High graphics, camera distance, a run/walk option, and save export/import. Browser zoom is allowed; gameplay gestures are scoped to the canvas. HUD numbers explain themselves on hover and flash the change when they move.
- At the night Sabha, Hear next plays a neighbour’s speech bubble. Vote & results opens the compact voting panel. You can walk, talk, close the discussion and return to vote. Night duties take priority over optional story directions.
- Conversations use named speech bubbles and leave movement and other interactions available. Long bubbles scroll; recent conversations remain in the journal's Village memories.

## A village day

Complete five favours: deliver water, clear litter, feed a cow, load the harvest and water the garden. Jobs, deliveries and resources save on this browser. Five favours earn a nomination for a compressed fictional election; the tutorial ballot explains the earned 12-of-15 outcome after all five favours. Elected play keeps the same relaxed day length and introduces the public budget and planner. The objective card follows the shape of an elected day: collect the budget, plan, watch the site rise, take your seat at the night Sabha, get home before the lamps go out. Each dawn opens the village accounts: harvest, sales, food eaten, and why happiness and approval moved. Unfinished favours wait across dawn; after completing one, another neighbour asks the next day, the night Sabha counts the neighbours you helped on your side, and losing a re-election means the Sarpanch plans that day's works instead of you.

After helping Naresh, talk to Meera Devi in the village or open **Meera's market morning** from Neighbour jobs. Carry a visible basket along a short crossing, where you must stand still while the basket settles or it spills, or a longer clear route that costs daylight. Deliver it to Hari, and later choose one 20-coin public improvement. Return the next day to see the repaired lane or water collection stand, watch neighbours use it, and hear their response. This is a small authored story, not a procedural quest system.

Representation is treated as a baseline in the story. The optional participation policy concerns meeting access and childcare, not whether women receive representation. Institutional powers and election timing are simplified; the journal explains the curricular context.

## Saves and recovery

A village save starts only after entering play. Successful saves preserve a previous valid copy; invalid data can fall back to that copy. Failed storage writes report failure, and the current validated state can still be exported while the page is open. Import validates nested gameplay data and known identities, replaces village progress and keeps the separate learning journal. The last morning accounts and dusk construction count survive reload.

Game-over restart clears village saves without an unload handler writing the loss back. An unexpected runtime or graphics error pauses the simulation and protects the last good save. Browser storage is not a guaranteed cloud backup; downloaded backups are player-owned.

## Graphics and compatibility

The local renderer is pinned to Three.js 0.185.1 and requires **WebGL 2**. A startup message covers unsupported graphics or initialization failure. No runtime Google Fonts or CDN assets are required.

Low quality uses DPR up to 1 with real-time shadows off and soft actor contact shadows. High caps DPR at 1.5 and uses a 2048 shadow map focused around the player. Auto starts conservatively on touch devices and steps down after sustained slow frames on any input type. See PERFORMANCE.md for the measurement method and physical-device limitations.

## Develop, check and release

```sh
npm ci
npm run build
python -m http.server 8773
```

Open http://localhost:8773. Generated renderer and script/CSS version URLs are committed, so a checkout can also be served immediately. Rebuild after source edits before publishing.

With the server running:

```sh
npm run test:all
npm run benchmark
```

The complete check runs smoke, gameplay/save integration, seven phone sizes, three speech layouts, performance invariants, repair regressions, and overnight-delivery/import/clock/Sabha regressions. `npm test` is the shorter smoke/integration command. Tests default to installed Edge; `PLAYWRIGHT_CHANNEL=chromium` uses Playwright Chromium. `ASTRA_URL` selects another server and `PLAYWRIGHT_MODULE` can select an existing installation. CI installs Chromium and runs the complete check in four independent groups with separate evidence artifacts. Screenshots go to `qa/`; diagnostic JSON goes to `audits/`.

`npm run format` formats first-party source. `npm run build` bundles the pinned renderer, copies its complete license, and derives content-version queries for every local script/style, including the vendor. Commit the generated URLs with the source changes; do not ask players to hard-refresh.

## Source ownership

| File | Responsibility |
| --- | --- |
| game.js | Simulation, input, screen cleanup, world/room lifecycle and explicit extension hooks |
| world-art.js | Authored scenery, character rigs, shared materials and art updates |
| village-life.js | Favours, carrying pools, election onboarding and session-start rules |
| persistence.js / boot.js | Validation, previous-save recovery and bounded error handling |
| quality.js | Instance bounds, quality governor, contact shadows and settings/backups |
| village-story.js | Saved route/project story and neighbour memories |
| astra.js / lessons.js | Journal, learning persistence, animals and chapter content |
| speech-ui.js / sabha-ui.js / mobile-ui.js / astra.css | Speech positioning, compact menu and responsive UI |
| scripts/build.cjs | Reproducible vendor and asset-version generation |

The renderer is covered by [its MIT license](vendor/THREE-LICENSE.txt). Textbook PDFs remain local and excluded from Git. Physical-phone performance, Safari behavior, sustained thermal behavior and student outcomes require testing beyond desktop emulation.

CI uses explicit SwiftShader and Low quality for functional checks on runners without a physical GPU. Local validation covers both phone Low and desktop High. The first CI attempt timed out on the default software graphics path; the test launcher now makes this environment difference explicit.

The Linux CI runner uses a 0.35 render pixel ratio for its real WebGL framebuffer, keeping the full CSS viewport and UI. This avoids treating CPU rasterization speed as a gameplay timer assertion. Normal-resolution Low/High rendering is checked locally; CI is functional coverage, not the performance benchmark.
