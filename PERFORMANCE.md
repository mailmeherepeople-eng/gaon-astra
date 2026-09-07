# Performance: September repair release

Current measurements supersede the earlier pump-only table. The earlier 512-call observation and subsequent 664/686-call observations were snapshots with different renderer/camera state, not physical-phone budgets.

## Changes

- Every active instanced mesh receives conservative aggregate instance bounds and culling, including later construction. Shared geometry buffers remain shared.
- Desktop canopy density is 1,050 leaves instead of 2,100; phone density remains 700. Tree replacement now targets explicit trees and preserves interactive landmarks.
- High quality caps DPR at 1.5 and the main shadow map at 2048; shadows cover a 64 m square around the player rather than 180 m. Low caps DPR at 1 and disables real-time shadows. Shared-texture contact blobs ground outdoor actors and the indoor player.
- Auto uses a 12-second warm-up, a rolling frame sample and 15-second cooldown. Sustained p75 frame times above 24 ms lower one quality level. Paused/hidden/loading outliers are excluded. It only steps down during a session; choosing Auto again resets the trial. An explicit Low/High choice takes precedence.
- Carrying models are pooled, plain world materials are cached, lane geometry remains cached, and outdoor animal gait work is skipped indoors.
- HUD/objective updates remain change-driven, paused rendering remains capped at four refreshes per second, and hidden tabs skip rendering. Dialogue retains cached size measurements.
- Three.js is pinned to 0.185.1 with color-space API migration and lighting adjustment. WebGL 2 is now required.

## Representative scenarios

Headless Edge 152.0.4191.66 on the development computer; phone emulation is 390×844 at device scale 3 with Low quality (render DPR 1), desktop is 1440×900 at device scale 1 with High quality. Each scenario warms for 900 ms and samples 90 animation frames. Raw camera, DPR, median/p95 and resource values are in [benchmark-results.json](audits/benchmark-results.json).

| Profile | Scenario | Median calls | Median triangles |
| --- | --- | ---: | ---: |
| phone emulation | start | 206 | 94,458 |
| phone emulation | pump | 191 | 93,834 |
| phone emulation | crowded | 459 | 125,427 |
| phone emulation | night | 297 | 105,205 |
| phone emulation | interior | 54 | 3,606 |
| desktop | start | 1,573 | 390,950 |
| desktop | pump | 1,423 | 366,822 |
| desktop | crowded | 2,193 | 614,171 |
| desktop | night | 1,574 | 354,601 |
| desktop | interior | 110 | 18,754 |

The new starting location faces the pump and differs from the old house-door start, so that row is not an identical-camera before/after comparison. The crowded scenario deliberately groups the village population. Scene generation still contains randomness, and shadows add work on High; counts will vary between runs. The focused performance regression suite produced another phone pump observation of 147 calls / 87,714 triangles and desktop 1,587 calls / 499,834 triangles.

Recorded median/p95 animation intervals were around 6.9/7.0 ms on this computer. These describe the desktop display/browser scheduler and are **not a claim of 144 FPS on a phone**, GPU timing or sustained thermal performance. Resource counts can rise as previously unseen scenery is first uploaded; the carrying regression separately verifies no per-cycle growth after warm-up (940 → 940 over 30 cycles).

## Reproduce

Serve the repo on port 8773, then run `npm run benchmark`. Run `npm run test:all` for the functional and performance invariants. Set `PLAYWRIGHT_CHANNEL=chromium` when using Playwright's installed Chromium instead of Edge.

## Still requires physical devices

Record 10–20-minute sessions on a named Android phone, an iPhone/Safari device and a low-end laptop. Include walking, crowded views, day/night, room transitions and repeated deliveries. Compare median/p95 frame times, input responsiveness, battery/thermal behavior and quality changes. A desktop viewport emulation cannot close that validation work.
