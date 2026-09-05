# Gaon Astra: merge and visual audit

Reviewed 5 September 2026. The user's final direction is **fun first; learning accumulates through play**.

## Merge decisions

Gaon 3D is the base, using its working `index.html` at source commit `c95e556`. Its richer village, all original building types, named villagers, interiors, treasury, map planner, day/night economy, proposals, policies, election ladder and teaching messages remain. This is an additive source merge, not a replacement with Codex's smaller world or a Git history merge.

Gaon Codex informed the warm paper/terracotta/green palette, serif headings, clear action hierarchy, persistent journal and explanation style. Its vendored Three.js and actual audio implementation were reused. Its alternate simulation and world coordinates were not substituted. Original project files were left intact.

## Audit findings and changes

| Finding in Gaon 3D | Change in Astra |
|---|---|
| Player is a tapered body with a head and cone hat | Human rig: kurta-shaped torso and hem, scarf, trousers, hands, shoes, hair, nose, eyes and mouth; separate walking arms and legs |
| Villagers use a smaller, random scale than the player | One adult rig, approximately 1.807 world metres in the neutral pose, for the player, wandering villagers and room residents |
| Cattle only bob their heads and are fixed in place | Six roaming cattle with ears, muzzle, eyes, hump and bell; local roaming avoids building/decor footprints |
| No chickens | Nine hens with beaks, combs, feet and tails; walking/pecking and a brief response to feeding |
| Hand pump is scenery | Animated handle and visible water; take water to a garden and watch saplings grow |
| Few reasons to explore between management events | Noticeboard, tracked optional trails, cart loading, litter cleanup and animal greetings; first help earns a small appreciation effect |
| Village has Indian landmarks but flat surfaces feel generic | Preserved banyan, temple, pond, bridge, khaprail and flat roofs; added roof/plaster textures, washing lines, pots, threshold decoration and local-language signs |
| Colours are washed out | Material and ground colour conversion plus sky treatment adjusted; retained time-of-day lighting |
| Interior camera can be obscured by the doorway frame | Camera constrained inside room bounds and below the high beams |
| Teaching messages disappear after a few seconds | Last 80 messages retained in the field journal, with 24 optional chapter notes and practice |
| Initial control list dominates smaller screens | Controls are expandable; the start action is visible at a 390×844 viewport |
| Modal movement keys can remain held | Clear movement/action state when opening and closing overlays; text entry cannot move the player |
| No soundscape in the 3D base | Adapted Codex ambience, footsteps, interaction and completion cues with persistent mute control |
| Game rules could be confused with textbook rules | Label compressed population/time/election rules; distinguish organs from levels, Sabha from Panchayat, and added value from net profit |

## Verification

Headless Microsoft Edge through Playwright, desktop 1440×900 and emulated touch 390×844:

- No uncaught JavaScript errors in the tested paths.
- Pump interaction by E shows water; carrying it to the garden sets its watered state.
- Cart, litter and noticeboard show the correct contextual actions; board opens trails.
- Animals change position over time. All outdoor adults have identical neutral-pose bounds.
- Correct recall feedback works; written drafts, a checked marking point and recall progress survive reload.
- Panchayat entry, 80-coin treasury collection and land planner opening work.
- Home, Panchayat member home, Sarpanch home and ordinary villager house interiors open with their original hotspots.
- Night Sabha opens with original villagers and proposals.
- Desktop journal, intro, village, animals, planner, Sabha and interiors were captured and inspected.
- Touch journal has no page-width overflow; touch controls remain available and transient logs avoid covering prompts.

## Remaining limitations and next audit priorities

1. **Long-session save/resume:** learning saves, but the simulation does not. Add a versioned save before inviting students to invest hours.
2. **Fun needs student playtests:** automated checks establish functionality, not enjoyment or learning transfer. Observe voluntary exploration and whether students want another session.
3. **Short trails are first-pass interactions:** they are not yet multi-stage narrative quests, crafting puzzles or deep animal-care systems. Feeding is a friendly animation, not a nutrition simulation.
4. **World style is intentionally low-poly:** this is a stylised north-Indian foothill village, not photorealism or a representation of every Indian region. Characters share the same hair/rig; richer clothing, faces and occupational props remain valuable.
5. **Navigation:** original villagers use simple destination movement and can overlap one another or scenery. Animals use local footprint avoidance, not full pathfinding. Full navigation and crowd separation are a next pass.
6. **Game systems remain simplified:** two-minute days, fast elections, small population milestones and the treasury loop are play abstractions. Balance a relaxed mode before adding more timers.
7. **Learning scope:** 24 explanations and practice prompts cover the major concepts in chapters 9–14. No claim of guaranteed exam success or full textbook replacement is made; spelling, unseen questions and longer reasoning need classroom validation.
8. **Performance:** tested in desktop Edge and touch emulation. Real low-end Android GPU performance and extended multi-day balance were not certified.

See `FUN-ROADMAP.md` for concrete ways to deepen the game before expanding compulsory teaching UI.
