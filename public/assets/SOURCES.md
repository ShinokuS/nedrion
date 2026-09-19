# Prototype asset sources

User-provided Hero Siege assets, copied from D:/Temp/HERO_SIEGE. These are reference assets for this prototype; no redistribution license is granted by this repository.

The canvas UI and world pass use the curated files under `public/assets/hs/`. The exact copied filenames and their source directories are recorded in `public/assets/hs/manifest.json`.

- hero: Adventurer_Npc_spr
- trader: Brynjar_NPC_spr
- chest: Dungeon_Chest_Closed_spr
- stash: Stash_Act_01_spr
- skeleton: Skeleton_Crypt_Walk_Down_spr
- zombie: Zombie_Walk_Down_spr
- torch: Torch_Valhalla_Cave_spr
- staff: Weapon_Staff_Flame_of_Phoenix_spr
- sword: Weapon_Sword_Azurewrath_spr
- gem: Gem_Elemental_spr
- support: Gem_Moonstone_spr
- barrel: Prison_Barrel_spr
- armor: Armor_Leather_Muscle_Breastplate_spr
- bow: Weapon_Bow_Arrow_of_Niflheim_spr
- key: Ancient_Key_spr
- relic: Relic_Aarons_Staff_spr


Дополнительный набор: `original/manifest.json` содержит численно отсортированные кадры с точными путями исходного архива. Импортёр `scripts/import-assets.py` копирует оригинальные PNG без перерисовки. Для интерфейса и костра используются отдельные прямоугольные области оригинальных текстур. Анимации героя — Armored_Knight; врагов — Skeleton_Crypt, Zombie, Rat, Imp, Crypt_Skeleton_Archer.
