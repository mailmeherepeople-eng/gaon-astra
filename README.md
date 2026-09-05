# Gaon Astra

A third-person 3D village game built on **Gaon 3D**, with Gaon Codex's warm interface direction, persistent explanations and adapted soundscape. Explore Lakshmanpur, help neighbours, build, vote and see what happens. Revision is optional.

## Play

From this directory run `python -m http.server 8773`, then open http://localhost:8773.

No build step. Three.js is vendored locally; optional Google fonts fall back to installed fonts without internet.

- WASD / arrows: move relative to the camera. Shift: run. Space: jump.
- Click the village to capture the mouse; move it to look. Escape releases it. Scroll changes camera distance.
- E: use doors, talk, pump water, water saplings, load the truck, clear litter and greet animals.
- J: open or close the field journal. Neighbour jobs lets you track a favour. Pause saves your village.
- Touch: left side moves, right side looks; E and Jump buttons provide actions.
- Sound on/off controls the adapted Gaon Codex ambience, footsteps and cues.

## Your first village day

You begin as an ordinary villager. Fill and deliver water to Naresh, collect and sort three patches of litter, feed a cow, load three grain sacks onto Hari’s truck, and water the saplings. Items appear in your hand. A short action takes time and cancels if you walk away; deliveries and completed favours are remembered.

Five favours earn a nomination. Visit the map table inside the Panchayat Bhavan to attend the story’s next election. After the ballot result, you become a Panchayat member and unlock the public works budget and village planner. This is a compressed fictional election, not a claim that doing chores automatically confers public office. The opening has longer days and no forced bedtime or surprise resource penalties.

## What is included

The original 3D buildings, named villagers, home interiors, Panchayat hall, treasury, land planner, policies, elections, ranks, economy and day/night problems remain. Additions include a consistent human character rig, six roaming cattle, nine chickens, domestic details, local roof/plaster textures, interactive village props, a persistent event journal, and 24 chapter notes with 24 recall checks and 24 self-marked written questions.

Notes cover the supplied NCERT Class 6 **chapters 9–14**: family and community, government, rural and urban local government, work and economic sectors. They do not cover the entire social-science textbook. Learning progress, written drafts, sound preference and recent journal entries save locally. **Village progress now saves locally**, including favours, carried items, elections, resources and construction. Continue from the opening screen, or explicitly start a new village. Exam results have not been validated with students.

## Project map

- `index.html`: retained Gaon 3D simulation, renderer and interiors, with targeted fixes.
- `world-art.js`: shared friendly character rigs, coordinated cattle gait, detailed houses, foliage, fields, wells and market models.
- `village-life.js`: neighbour jobs, carrying, nomination/election, saves, pause and interior cutaways.
- `astra.js`: village interactions, animals, visual details and optional journal UI.
- `astra.css`: Codex-inspired paper, terracotta and green interface, responsive rules.
- `lessons.js`: original explanations and practice grounded in the supplied textbook.
- `audio.js`: Gaon Codex soundscape adapted to Astra and safe local storage.
- `vendor/`: original bundled Three.js and its licence.
- `POLISH-PASS.md`: latest implementation and validation details.
- `AUDIT.md`: merge decisions, visual audit and validation.
- `FUN-ROADMAP.md`: prioritised ideas derived from the supplied mechanics catalogue.
- `CURRICULUM.md`: chapter mapping and assessment limits.
- `textbook/`: local source PDFs, deliberately excluded from Git as in the source games.

This is a new local Git repository. No GitHub remote or hosted deployment is configured.

## Browser checks

With the local server running on port 8773, install the development dependency using `npm install`, then run `npm test`. Tests use an installed Microsoft Edge browser. `ASTRA_URL` can point at a different local server, and `PLAYWRIGHT_MODULE` can point at an existing Playwright installation. Screenshots are written to `qa/`.
