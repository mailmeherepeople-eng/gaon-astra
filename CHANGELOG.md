# Changelog

## 2026-09-08: gameplay stakes, a readable day, and audit repairs

### Gameplay

- **The tutorial election explains its ballots.** The first election lists who votes for you and why, and the result comes from the favours you did. Losing a later re-election means Kamla Devi plans that day's public works instead of you; the planner explains why.
- **Approval moves gradually** and remembers neighbours helped, instead of dropping from 80 to 40 the morning after election. The HUD flashes the change and explains the number on hover.
- **The night Sabha** seats people with a proposal first, gives the others state-aware lines instead of random filler, and counts the neighbours you helped on your side of the tally.
- **The first night has something gentle to find**: a torn sack of plastic by the chowk to report, with no penalty for missing it.
- **Every dawn opens the village accounts**: harvest, processing, sales, food eaten, spoilage, and why happiness and approval moved. Neighbours gather at the plot the Sabha voted to fund.
- **A neighbour asks a small favour every day** once the first five are done: water at a door, fodder for a cow, or one more sack for Hari.
- **Meera's story has a real risk**: the short crossing requires standing still while the basket settles, and walking off spills it. The clear lane costs daylight. Meera and Hari walk the repaired lane afterwards.
- Remembered-favour lines rotate with normal dialogue instead of replacing it forever.

### UI and intuitiveness

- The objective card follows the elected day: collect the budget, plan, watch the site, take your seat, get home. It no longer contradicts the goal label at night.
- The desktop toolbar has four tools. The story starts by talking to Meera or from a card in Neighbour jobs; sound is in Settings.
- The map table says what it will do: stand for election, collect and plan, or wait for morning.
- Thank-you bubbles appear where you stand. The pump no longer shows a button that does nothing.
- The planner card is wider, labels appear sooner, plots name themselves on hover, and a legend explains the colours.
- The pause and phone menus explain what moved happiness and approval.

### Art and performance

- The banyan at the chowk is rebuilt in the neem material language with branches, aerial roots and instanced leaves.
- Each neem's trunk and branches merge into one draw call.
- The sleep camera snaps above the canopies. The quality profile no longer overrides the canvas stylesheet size.

### Tests and CI

- The carrying-geometry check warms up and asserts no growth instead of exact equality, which failed on the software renderer in CI.
- New `tests/gameplay.cjs` covers the elected-day objective, daily favours, the accounts, elections with stakes, the story spill, the toolbar and HUD copy. It runs in `npm run test:all`.

### Audit repairs

- Unfinished repeat deliveries retain their recipient through dawn and reload; extra sacks never increment the original three-sack counter.
- Backups validate nested job/story/account data and enum indices. Restores use an explicit field list, and saved identity text is escaped in UI.
- The phone planner stacks the project details and map, including on 320-pixel screens.
- The safe route advances through the normal dusk boundary and waits for daylight at night.
- Night duties override story directions. Public project permissions apply to both the map and Meera’s story.
- Morning accounts and dusk completion counts persist across reloads.
- Sabha speeches use the normal bubbles, with a dismissible vote panel and no dialogue movement lock.
- Added regression coverage for all eight findings and refreshed the ten-scenario performance dataset.
