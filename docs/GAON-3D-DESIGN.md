# Gaon: from villager to Mayor

A minimalist base-building game for Class 6 social science. Thronefall's shape (one avatar, walk to a plot and pay to build, days to build and nights to survive), Age of Empires' ages (the settlement advances through tiers), Civilization's policies (resolutions passed at the Sabha). Civics (chapters 9 to 12) and economics (chapters 13 and 14) run as one system: the economy pays for the buildings, the buildings win the elections, the elections unlock the tiers.

Prototype: `index.html`, low-poly 3D (Three.js from a CDN, flat-shaded boxes and cones, one sun with shadows, night lighting), keyboard, mouse and touch. `index-2d.html` is the same game with a 2D canvas renderer for offline use. Both cover the first three ages and three ranks. This document carries the whole arc; `SYLLABUS.md` says what the book contains that the game does not.

## The daily loop (current build)

1. **Wake at home.** The player's own house sits in the middle of the village, below the Panchayat Bhavan.
2. **Walk to the Panchayat.** The night's income has gone into the treasury; entering collects it. Every third morning the Gram Sabha meets here first: election, then one policy.
3. **Plan on the land map.** A top-down map of Lakshmanpur; tap a plot, pay, queue it. Petitions to the block and State are sent from the same map. Locked plots show the rank they need.
4. **Walk out and watch.** Every queued site gets a scaffold and rises through the day; it completes at dusk. The village is the progress bar.
5. **Be home by dark.** At night the house is the goal. Sleeping runs the night at triple speed; problems still fire and the log reports them. Staying out costs happiness.
6. **The first thief comes by day, once.** The player can stop him by hand. After that thieves come only at night, and only a police post, petitioned from the State by a Sarpanch, catches them.

## The night (current build)

1. **Dusk: everyone gathers at the Panchayat Bhavan.** Lamps are lit, villagers walk in, the goal marker moves to the Bhavan. Nothing else can be done until you take your seat. Skip the meeting and it is held without you: the chair decides, approval drops.
2. **The village speaks.** Four or five named villagers (Ramesh the farmer, Meera Devi with the cows, Bhagwati the elder, Suraj who wants work, Hari Singh the shopkeeper, Anita the student) each say a line. If tonight has a real problem, its owner raises it as a proposal: a night watch for the thief, a drain dug before the river reaches the houses, a clean-up drive, sending for the doctor, calling the Patwari with the old map. Standing needs appear too: spend the treasury on the school, the market, the well, the road.
3. **The vote.** As a villager you have one vote, like every adult. As a Panchayat member you have two, one as a villager and one in the council. The rest of the votes are simulated from what hurts the villagers most. The count is shown.
4. **The chair decides.** Until you are Sarpanch, Kamla Devi chairs. She follows the majority about seven times in ten; otherwise she picks what she prefers (she likes roads), and the screen says so: the majority does not bind the chair, the chair answers at the next election. As Sarpanch the decision is yours: follow the majority for a small approval gain, overrule it for a small loss.
5. **The resolution acts tonight or tomorrow.** Watch makes thieves flee; the drain halves the flood; the clean-up, doctor and Patwari clear their problems; a funded building costs half on tomorrow's land map.
6. **Lantern walk, on a budget.** After the meeting a point light rides with you and problems are visible only inside it (or everywhere, if the Bal Sabha resolution has passed). Reaching a problem reports it; reported problems are fixed by the Panchayat at dawn and add approval. The budget is the rank: a villager has a quarter of the night, a Panchayat member six tenths, a Sarpanch the whole night and chooses when to sleep. When the budget runs out the lamps go out and sleep is forced.
7. **Watch the night.** Asleep, the camera drifts between the night's problems while they play out at triple speed and the log reports each one. Late sleepers lose happiness.

## What the player does, minute to minute

- **Walk.** One avatar on a small map: fields to the west, river to the east, the Panchayat Bhavan in the middle. Roads make walking faster.
- **Build by standing on a plot and holding Build.** Coins drain into the plot. Each plot has a fixed building, as in Thronefall, so the decision is which plot to fund first, not what to place.
- **Survive the night.** A thief walks to a field. Rain raises the river and floods the nearest buildings. Plastic piles by the road. Fever appears in the houses. Each problem has a village-level answer (a well drains a small flood, bins plus a segregation policy clear the plastic) and a higher-tier answer (an embankment through the block, a police post from the State, a health sub-centre). The player can run at the thief, and learns, without being told in a textbox, that a villager cannot arrest anyone.
- **Dawn pays.** Primary buildings make grain, milk and wood. Secondary buildings turn them into flour and chairs (wood bought at 600 becomes a chair sold at 1,000, the textbook's own example of value added). Tertiary buildings sell and serve. No market means the middleman buys everything at half price, and milk spoils before it is sold, exactly the Anand farmers' problem before AMUL.
- **Every third evening, the Gram Sabha meets.** Approval (happiness plus what you have built) decides whether the village elects you upward. If you hold a rank, the Sabha passes one resolution from three offered: a policy card with a real source.

## The two ladders

**Rank** is the player's position in Panchayati Raj, then in urban government, then in the State.

| Rank | How it is reached | What it unlocks |
|---|---|---|
| Villager, member of the Gram Sabha | start | Build on own land: house, field, well, dairy, wood lot, market |
| Gram Panchayat member | first election won | Public works: road, school, bins, mill, workshop; vote on policies |
| Sarpanch | second election won | Petition the block and State: police post, embankment, health sub-centre; chair the Sabha |
| Panchayat Samiti member | village reaches town age, election | The map grows to five villages; PMGSY all-weather road; collect plans from Gram Panchayats |
| Zila Parishad member | five villages linked | District plan; funds flow down; Patwari records across the block |
| Ward Committee member | settlement becomes Nagar Panchayat | Wards appear; health camps and campaigns per ward; reporting leaks and drains |
| Councillor, then Chairperson | Municipal Council city | Property tax, water tankers, trade licences, marriage certificates, fire services (Indore's list) |
| Mayor | Municipal Corporation | Three organs at city scale: the council makes bylaws, the commissioner enforces, the court settles disputes; if any organ is starved, unrest |
| MLA, then MP | later grades | The State Assembly and Parliament; out of scope for Class 6 |

**Age** is the settlement's tier, advanced Age-of-Empires style by meeting population and building requirements, then confirmed by a Sabha vote.

| Age | Requirement | Source |
|---|---|---|
| Hamlet | start | Ch 11, Lakshmanpur, 200 houses |
| Gram Panchayat village | 16 people, Panchayat Bhavan, well | Ch 11 |
| Nagar Panchayat town | 40 people, market, school, road | Ch 12, towns below 1 lakh |
| Municipal Council city | 80 people, clinic, mill | Ch 12, 1 to 10 lakh |
| Municipal Corporation | 150 people, wards, three organ buildings | Ch 12, above 10 lakh; Ch 10, organs |

Population numbers are scaled for play. The thresholds keep their order and the names of the bodies stay exact.

## The economy is chapters 13 and 14

- **Sectors as building chains.** Primary (field, dairy, wood lot, later fishing pond and quarry) pulls from nature. Secondary (mill, workshop, later dairy plant and brick kiln) transforms. Tertiary (market, road, school, clinic, later bank, transport, post office) sells and serves. A mill without fields idles; produce without a road spoils. Interdependence is felt as idle buildings and lost income, never stated.
- **Value addition** shows in the numbers: flour is worth double grain, a chair is worth 1,000 against 600 of wood.
- **Payment types** are a policy: pay in kind (mangoes and grain instead of cash), daily wage, monthly salary, each with a different effect on coins and grain.
- **Economic versus non-economic activity.** Workers in buildings earn. Villagers with no job do seva at the community kitchen if the policy is passed, and happiness rises although no coins change hands. Festivals and cleanups are community matters, not government ones.
- **The cooperative** is the economic centrepiece: until the Dairy cooperative resolution passes, a middleman buys milk at half price and milk still spoils. After it, farmers sell as a group at full price. Later ages add the dairy plant (secondary) and retail (tertiary), which is the AMUL story in buildings.

## Civics is the night and the Sabha

- **Three levels of government** are three sources of help with three speeds. The village handles what it can tonight. The block (Panchayat Samiti) and the State answer petitions in days. The Centre appears only when a flood covers vast areas, and it takes longest.
- **Three organs** arrive at city age as three buildings that must all be funded. The council passes bylaws (policies), the commissioner's office enforces them (problems get resolved), the court settles disputes (a dispute problem type that otherwise festers into unrest). Starving one organ produces the disorder the textbook asks the class to imagine.
- **Democracy is the loop.** Elections every three days. Direct democracy at the Gram Sabha (the vote itself). Representative democracy once the town has wards (you are elected by a ward, and other wards elect other members with their own demands). One-third reservation for women as a policy that changes who is in the room and how happy the village is.
- **Citizens' duties** are policies the village must adopt for city services to work: segregation before bins work, reporting leaks before the ward can fix them.

## Problems by age

| Age | Night problems | Village answer | Higher-tier answer |
|---|---|---|---|
| Hamlet, village | thief, small flood, plastic, fever | night watch (community), well, bins with segregation | police post (State), embankment (block), health sub-centre (State) |
| Town | land dispute, low electric wire, drought, school without wall | Patwari records, Bal Sabha reporting, rainwater harvesting, compound wall | Zila Parishad funds, electricity board |
| City | blocked drains, leaking mains, garbage strike, traffic, cybercrime | ward committee, waste segregation, water tanker service | Municipal Corporation, cyber police (State), court |

## Why this is a game and not a quiz

Nothing asks a question. The player is trying to keep coins, grain, people and happiness up while nights take them down, and to win the next election. Every rule of Panchayati Raj and every sector of the economy is a lever the player pulls to do that. The textbook line appears only as a one-line note in the log after something happened (milk spoiled, the thief got away), which is the receipt pattern from the vault, delivered after the consequence rather than before it.

## Next steps for the prototype

1. Second map for the town age with wards and a second village to link (Panchayat Samiti rank).
2. Sound. (The art pass landed 4 September 2026: flat-shaded materials, a low camera with a horizon, sky dome and stars, a dusk and dawn colour ramp, paths that grow with the village, footprint-sized plot markers, lit windows at night.)
3. Balance: a full run to the city should take about twenty minutes; elections should be lost about a third of the time on a first play.
4. A Chronos-style narrator, the District Collector, with one line per dawn.
5. Save and resume, and a teacher view listing which policies the player passed and which problems they solved, which is the assessment without a test.
