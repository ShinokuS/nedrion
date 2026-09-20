# Native asset rendering

- Hero: `Tarot_Bard_Pit_Fighter_01`, complete human frames at scale 1. Never replace with an enlarged 16 px NPC or manually separated equipment layers.
- Hero frame anchors are explicit per motion and direction in `world.js`. Inventory equipment does not change the character.
- Interface scale is integral at viewports at least 720 px tall. Smaller screens fit the 720 px layout. Text is rasterized at resolution 4; bitmap art uses nearest sampling.
- Item art has one scale derived from its inventory footprint. Equipment panels and cursor previews must not enlarge it independently.
- Socket geometry uses the item footprint, centered inside the equipment frame. RMB holds a socketed gem, LMB inserts, dropping commits a transfer; cancel retains ownership.
- Q/R/F are assignable from equipped usable skill gems. Assigned skills fire manually toward the cursor; unassigned skills remain automatic. E remains contextual interaction; movement is keyboard only.
- Navigation cells and graph edges are checked with the movement collision function. Waypoints are retained until reached to avoid cutting furniture corners. Spawns require a reachable graph anchor.
- Minimap contours describe actual terrain boundaries only. Unexplored walkable neighbours must not produce a wall. Visible enemies are red; explored storage/portals/runes remain marked.
- Autumn districts use native woodland enemies, storage variants, at most two camp landmarks and one fountain. Ground remains a continuous source patch; never randomly shuffle autotile subtiles.

Validation: Node regressions in tests/, development browser suite at `?smoke`, isolated visual scenes at `?inspect=vendor`, `?inspect=raid`, `?inspect=interaction`. Fixtures restore the previous saved profile on exit. They are excluded from production entry points.

Original font binaries and skeletal animation metadata are not present in the supplied PNG collection. Georgia is currently used for Russian interface text; exact typographic parity with Hero Siege is not established.
