# Phone playability audit

## Findings and changes

- Persistent stats, four toolbar buttons and the objective card stacked over the world. Phone layouts now show a compact objective, day clock and a 44-pixel Menu button. Menu pauses and saves play, with full stats, objective details, jobs, journal and sound inside.
- Prompts and toast notifications competed with the joystick and action buttons. Prompts now sit above the controls in portrait and between them in landscape, with bounded, scrollable content. Only the newest toast appears, and it yields to an active prompt.
- Desktop spacing and fixed viewport heights crowded smaller screens. Phone dialogs use the dynamic viewport, safe-area padding and vertical scrolling. Journal navigation remains accessible while scrolling.
- The floating joystick could remain displaced or keep moving after opening a screen. Opening a screen, rotating the phone or losing focus now clears touch movement; releasing a drag returns the stick to its resting position.
- The touch action button used a keyboard label. It now says Use.
- World labels now respect the bottom of the compact top bar.

## Validation

Edge touch emulation: 320×568, 360×640, 375×667, 390×844, 412×915, 667×375 and 844×390. Automated checks cover prompt/control separation, controls inside viewport, touch bucket filling, menu/jobs/journal navigation, movement reset, elected stats and JavaScript errors. Portrait and landscape screenshots are in `qa/phone-*.png`.

Existing desktop smoke and integration checks pass, including jobs, elections, construction, saves, journal and interiors. Physical iOS/Android device testing remains outstanding; emulation does not reproduce browser chrome or hardware performance.
