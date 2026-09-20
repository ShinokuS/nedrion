# Mouse interaction and equipment readability

- World objects use left click within interaction distance. WASD movement remains unchanged; clicks do not initiate walking. Inventory, stash and merchant windows allow interaction with uncovered world objects. Picking up an item while the inventory is open refreshes and preserves that inventory.
- E is now an active skill key. Four slots use Q/E/R/F, with an icon picker and an icon to clear a slot. Existing Q/R/F assignments migrate without changing their original keys. Inventory remains available through I, but has no action-bar cell.
- The orb/action HUD is 15% smaller, independently of inventory scaling.
- Socket layouts are centered, including a single socket in a wide item. A small linked color diagram is shown by default. Holding Alt reveals full socket/gem icons. Carrying a gem also reveals sockets for placement. Socket overlays disappear from the source item while it is being moved.
- 62 native equipment sprite variants cover weapons, armor and accessories. A new item's visual choice is saved with the item; old items get a stable selection from their ID. Shape/footprint remains unchanged when moving between equipment, inventory and cursor.
- The hub is recomposed around the town hall, with the stash to its right, a native bounty board, a lower-right waypoint and separate shop positions. Foreground trees, the overlapping lamp and misplaced cliff ledges were cleared from the plaza. Torstein is retained; three other merchant sprites were replaced with supplied NPC assets. This is a reconstruction from screenshot references, not a verified pixel-exact export of the original town map.

Validation: production build; 33 Node tests; 28 browser integration checks. Manual browser checks verified left-clicking the waypoint with inventory open and choosing the E slot through the icon grid. Test saves remain isolated from the player's profile.
