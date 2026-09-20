# Ten-minute woodland raid

- Map: 248 × 206 tiles, 48 connected districts (previously 188 × 140, 24). Terrain uses 2048px chunks. Nonwalkable woodland is filled with native undergrowth baked into those chunks.
- Occluders sample several points and retain coverage for 180ms, with a smooth alpha transition. Sword slash uses additive blending because the extracted sprite has an opaque black background.
- Panels inset up to 220 logical pixels on wide screens, preserving the central corridor. Vendor/stash permit movement and close beyond interaction range.
- Meteor (staff), arrow rain (bow), juggernaut (sword), healing (ring/amulet), blink (boots). Healing and blink require a Q/R/F assignment. Space no longer grants a free dash.
- Duration support: +25% effect duration plus level upgrades; applies to arrow rain, rotating sword and blink protection.
- Six equipment variants add damage, armor, movement and healing differences. Dropped equipment rolls bounded socket counts, links and numeric values once, preserving them when moved. Disconnected sockets do not grant support upgrades.
- Enemy population grows by wave up to 220. Elites have speed, armor/health or regeneration modifiers, native glow and labels. Bosses appear once at 180/360/540 seconds. Darkness starts after 600 seconds and closes across the enlarged map.

## Boss fidelity and remaining limits

Original Gurag, Reaper and Shadow Reaper sprites/casting frames are used. The encounters are **adaptations, not complete copies of Hero Siege AI**. They implement warned area strikes, radial projectiles, diagonal scythe attacks for Reapers and summoned enemies for Gurag. Stats and timings are balanced for this prototype. Reaper behavior reference: https://herosiegedata.com/en/bosses (Pentagram Slam, Death Coil, Execution). This community reference does not establish exact internal timing/AI. The official wiki returned 403 during research. Homing skulls, Shadow Lantern mechanics, debuffs, original boss arenas and complete phase logic are not reproduced.

## Verification

Node tests cover 100 connected map seeds, item ownership, socket compatibility, disconnected supports, loot configurations and ring variants. Browser integration tests cover movement with open merchant/stash, all new skills, active-only healing and cooldown, collision-safe blink, timed effects, boss schedule, death/reset, extraction and existing inventory interactions. This is accelerated scenario verification, not a claim of a complete real-time ten-minute balance playtest.
