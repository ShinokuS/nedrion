from pathlib import Path
from PIL import Image
import json,shutil,argparse
parser=argparse.ArgumentParser()
parser.add_argument("source",type=Path,help="Directory containing extracted Hero Siege sprite folders")
args=parser.parse_args()
repo=Path(__file__).resolve().parent.parent
root=args.source; dest=repo/'public/assets/original';dest.mkdir(parents=True,exist_ok=True)
groups={
 'menu':'Context_Menu_Background_spr','socket-ring':'Socket_spr','inventory':'Inventory_Player_spr','hud':'Main_Hud_spr','health':'Player_HP_Bar_New_spr','cell':'Inventory_Grid_Normal_spr','stash':'Stash_Background_spr','button':'Hud_Button_spr','socket':'Jewel_Socket_Low_spr','ruby':'Ruby_spr','emerald':'Emerald_spr','sapphire':'Sapphire_spr','topaz':'Topaz_spr','moon':'Gem_Moonstone_spr',
 'floor':'Prison_Ground_2_tile','fall':'Fall_Ground_tile2','path':'Autotile_Prison_Path_tile','brick':'Autotile_Prison_Bricks_tile','wall':'Prison_Ruins_02_spr','arch':'Prison_Ruins_01_spr','bench':'Prison_Bench_01_spr','cage':'Prison_Cage_01_spr','rack':'Prison_Weapon_Shelf_Down_spr','rubble':'Prison_Stone_Debris_spr','body':'Prison_Prisoner_Rotting_spr','books':'Bad_Trip_Bookshelf_01_spr','table':'Cabin_Table_01_spr','chest':'Chest_spr','goldchest':'Golden_Chest_spr','openchest':'Dungeon_Chest_Open_spr','barrel':'Prison_Barrel_spr',
 'helmet':'Special_Hat_Iron_Legions_Helmet_Down_spr','helmet-left':'Special_Hat_Iron_Legions_Helmet_Left_spr','helmet-up':'Special_Hat_Iron_Legions_Helmet_Up_spr',
 'weapon':'Normal_Sword_Short_Sword_spr','staff':'Normal_Staff_Arcane_Fork_spr','bow':'Normal_Bow_Long_Bow_spr','armor':'Armor_Leather_Muscle_Breastplate_spr',
}
groups.update({'friendly-arrow':'Arrow_Proj_Windforce_spr','hostile-arrow':'Corrupted_Archer_Arrow_spr','spawn-rift':'Rift_Portal_spr','chapel-top':'Fall_Chapel_Top_01_spr','chapel-gate':'Fall_Chapel_Bottom_01_spr','house-tall':'Fall_Castle_Town_House_02_spr','merchant-wagon':'Traveling_Merchant_Carriage_spr','atlas-back':'Map_Screen_spr','atlas-node':'Mapscreen_Zone_Big_spr','atlas-town':'Mapscreen_Zone_Town_spr','atlas-selected':'Mapscreen_Chosen_Big_spr','atlas-link':'Mapscreen_Line_spr'})
for part in ['Weapon','Armor','Helmet','Gloves','Boots','Belt','Amulet','Ring','Shield']:
 groups['slot-'+part.lower()]=f'Inventory_Slot_{part}_spr'
for slot in ['Weapon','Armor','Helmet','Belt','Jewelry']:
 for quality in ['Normal','Rare','Satanic','Angelic']:
  groups[f'equip-{slot.lower()}-{quality.lower()}']=f'Inventory_Equipped_{slot}_{quality}_spr'
for direction in ['Down','Left','Up']:
 for part in ['Head','Torso','Pelvis','Left_Upper_Arm','Left_Lower_Arm','Right_Upper_Arm','Right_Lower_Arm','Left_Upper_Leg','Left_Lower_Leg','Right_Upper_Leg','Right_Lower_Leg','Left_Shoulder','Right_Shoulder']:
  groups[f'body-{part.lower()}-{direction.lower()}']=f'Paladin_{part}_{direction}_spr'
groups.update({'item-shield':'Shields_Normal_Buckler_spr','item-helmet':'Helmet_Normal_Basinet_spr','item-gloves':'Gloves_Normal_Leather_Gloves_spr','item-boots':'Boots_Normal_Boots_spr','item-belt':'Belts_Normal_Leather_Belt_spr','item-ring':'Rings_Normal_Iron_Ring_spr','item-amulet':'Amulet_Normal_Silver_Necklace_spr'})
groups.update({'fireball':'Pyromancer_Fire_Ball_spr','slash':'Pyromancer_Inferno_Slash_Projectile_spr','experience':'Experienceglobe_spr'})
for key,prefix in [('skeleton','Skeleton_Crypt'),('zombie','Zombie'),('imp','Imp'),('rat','Rat')]:
 for direction in ['Down','Left','Up']:
  groups[f'atk-{key}-{direction.lower()}']=f'{prefix}_Attack_{direction}_spr'
  groups[f'death-{key}-{direction.lower()}']=f'{prefix}_Dies_{direction}_spr' if key!='rat' else 'Rat_Dies_spr'
for motion in ['Idle','Walk','Attack']:
 for direction in ['Down','Left','Up']:
  groups[f'knight-{motion.lower()}-{direction.lower()}']=f'Armored_Knight_{motion}_{direction}_spr'
groups.update({'cobble':'Autotile_Fall_Bricks_tile','identify':'Identify_Bar_spr','pillar':'Graveyard_Pillar_01_spr','coffin':'Graveyard_Coffin_01_spr','bed':'Cabin_Bed_spr','carpet':'Cabin_Carpet_01_spr','chest-closed':'Dungeon_Chest_Closed_spr','prison-torch':'Prison_Torch_01_spr','pipe':'Prison_Pipe_01_spr','railing':'Prison_Railing_01_spr','archer-arrow':'Crypt_Skeleton_Archer_Projectile_spr'})
for key,prefix in [('archer','Crypt_Skeleton_Archer'),('imp','Imp'),('skeleton','Skeleton_Crypt'),('zombie','Zombie'),('rat','Rat')]:
 for motion in ['Walk','Idle','Attack','Dies']:
  for direction in ['Down','Left','Up']:
   name=f'{prefix}_{motion}_{direction}_spr'
   if (root/name).exists():groups[f'mob-{key}-{motion.lower()}-{direction.lower()}']=name
groups.update({
 'forest-ground':'Fall_Ground_tile3','forest-dark':'Fall_Ground_tile4','forest-leaves':'Fall_Ground_tile5','forest-road':'Autotile_Fall_Path_tile',
 'tree-a':'Fall_Dead_Tree_01_spr','tree-b':'Fall_Dead_Tree_02_spr','tree-c':'Fall_Dead_Tree_03_spr','tree-leaves':'Fall_Dead_Tree_Leaves_01_spr',
 'cliff-a':'Fall_Cliff_01_spr','cliff-b':'Fall_Cliff_02_spr','cliff-stairs':'Fall_Cliff_03_spr','well':'Fall_Well_01_spr','cart':'Fall_Cart_01_spr','hay':'Fall_Haystacks_01_spr','logs':'Fall_Logs_Stack_spr','town-barrel':'Fall_Barrel_spr','town-house':'Fall_Castle_Town_House_01_spr','stone-fence':'Fall_Stone_Fence_Horizontal_01_spr',
 'map-frame':'Minimap_Frames_spr','cursor':'Cursor_spr','hud-inventory':'Hud_Action_Button_Inventory_spr','hud-stats':'Hud_Action_Button_Stats_spr','hud-teleport':'Hud_Action_Button_Teleport_spr','hud-coin':'Hud_Coin_New_spr',
 'slot-background':'Inventory_Slot_Background_Normal_spr','town-portal':'Town_Portal_New_spr','waypoint':'Prison_Way_Point_spr','waypoint-glow':'Way_Point_Glow_spr',
 'rune-stone':'Helheim_Rune_Stone_01_spr','ruins-wide':'Prison_Ruins_04_spr','ruins-corner':'Prison_Ruins_03_spr','prison-pages':'Autotile_Prison_Pages_tile','prison-bones':'Autotile_Prison_Bones_tile','prison-hay':'Autotile_Prison_Hay_tile','prison-grate':'Autotile_Prison_Ornament_tile',
})
groups.update({
 'health-single':'Player_HP_Bar_No_Mana_spr','vitals-fill':'Enemy_HP_Fill_spr','enemy-bar-back':'Enemy_HP_Bar_Background_spr','autumn-road-ground':'Fall_Ground_tile2','camp':'Fall_Campment_spr','tent':'Fall_Tent_spr',
 'grave':'Fall_Grave_spr','wood-coffin':'Fall_Coffin_01_spr','handcart':'Fall_Cart_spr',
 'wood-fence':'Fall_Wood_Fence_Horizontal_01_spr','wood-fence-side':'Fall_Wood_Fence_Vertical_01_spr',
 'rock-large':'Fall_Rock_01_spr','rock-small':'Fall_Rock_02_spr','wood-debris':'Fall_Wood_Debris_spr',
 'stone-debris':'Fall_Stone_Fence_Debris_spr','haybale':'Fall_Haybale_01_spr','scarecrow':'Fall_Scarecrow_01_spr',
 'corpse-pile':'Fall_Corpse_Pile_01_spr','scaffold':'Fall_Execution_Scaffold_spr','fountain':'Fall_Fountain_01_spr',
 'ruined-house':'Fall_Building_Ruins_Top_01_spr','autumn-bush':'Fall_Bush_01_spr',
 'bucket':'Fall_Bucket_01_spr','fall-branch':'Fall_Branch_01_spr',
})
for motion in ['Idle','Walk','Attack']:
 for direction in ['Down','Left','Up']:
  action={'Walk':'Run_','Idle':'Idle_','Attack':'Punch_'}[motion]
  groups[f'hero-{motion.lower()}-{direction.lower()}']=f'Tarot_Bard_Pit_Fighter_01_{action}{direction}_spr'
for type,key in [('sword','weapon'),('staff','staff'),('bow','bow'),('armor','armor'),('helmet','item-helmet'),('shield','item-shield'),('gloves','item-gloves'),('boots','item-boots'),('ring','item-ring'),('amulet','item-amulet'),('belt','item-belt'),('fire','ruby'),('arrow','emerald'),('slash','topaz'),('nova','sapphire'),('multi','moon'),('haste','emerald'),('pierce','topaz')]:
 source='Pickup_'+groups[key]
 if (root/source).exists():groups['ground-'+type]=source
for key,prefix in [('ent','Ent'),('mushroom','Bog_Mushroom'),('scarecrow','Scarecrow'),('archer','Corrupted_Archer')]:
 for motion in ['Idle','Walk','Attack','Dies']:
  for direction in ['Down','Left','Up']:
   name=f'{prefix}_{motion}_{direction}_spr'
   if (root/name).exists():groups[f'mob-{key}-{motion.lower()}-{direction.lower()}']=name
for n in range(2,8):groups[f'coffin-{n}']=f'Fall_Coffin_0{n}_spr'
for n in range(1,7):groups[f'corpse-{n}']=f'Fall_Corpse_0{n}_spr'
groups['ice-nova']='Cosmos_Pyromancer_Nova_Effect_spr'
groups.update({'wood-crate':'Wooden_Box_spr','supply-crate':'Helheim_Box_spr','cargo-crate':'Town_Ship_Box_01_spr'})
groups.update({'boss-shadow':'Shadow_Reaper_Down_spr','boss-shadow-cast':'Shadow_Reaper_Casting_spr','boss-scythe':'Shadow_Reaper_Scythe_spr','boss-fill':'Boss_Health_Fill_spr','meteor-fx':'Pyromancer_Meteor_spr','meteor-impact':'Pyromancer_Meteor_Shred_spr','heal-fx':'Flash_Heal_spr','boss-reaper':'Reaper_Down_spr','boss-reaper-cast':'Reaper_Casting_spr','boss-gurag':'Gurag_Down_spr','boss-gurag-cast':'Gurag_Attack_Down_spr','boss-frame':'Boss_Health_Frame_spr'})
groups.update({'impact-fire':'Pyromancer_Explosion_spr','impact-ring':'Pyromancer_Explosion_Circle_spr','shadow-bolt':'Shadow_Ball_spr','boss-rock':'Gurag_Rock_spr'})
for key,source in {'fire':'Fireball','arrow':'Piercingshot','slash':'Inferno_Slash','nova':'Arcane_Nova','meteor':'Meteor','rain':'Arrow_Rain','juggernaut':'Whirlwind','healing':'Flash_Heal','blink':'Teleport','multi':'Multishot','haste':'Rapidfire','pierce':'Piercing_Sand','duration':'Time_Deceleration'}.items():groups['skill-icon-'+key]='Talent_'+source+'_spr'
groups.update({'merchant-smith':'Torstein_New_spr','merchant-tailor':'Abigail_NPC_spr','merchant-armorer':'Brynjar_NPC_spr','merchant-jeweler':'Land_Lord_Kukkonen_New_spr','reaper-flame':'Reaper_Flames_01_spr','shadow-impact':'Dark_Mage_Shadow_Bolt_Explosion_spr','ground-crack':'Universal_Shockwave_Effect_spr'})
groups.update({'gear-staff-0': 'Normal_Staff_Ancient_Staff_spr', 'gear-staff-1': 'Normal_Staff_Arcane_Fork_spr', 'gear-staff-2': 'Normal_Staff_Elder_Staff_spr', 'gear-staff-3': 'Normal_Staff_Gnarled_Staff_spr', 'gear-staff-4': 'Normal_Staff_Spectral_Tristaff_spr', 'gear-staff-5': 'Normal_Staff_Stygian_Fork_spr', 'gear-sword-0': 'Normal_Sword_Broad_Sword_spr', 'gear-sword-1': 'Normal_Sword_Claymore_spr', 'gear-sword-2': 'Normal_Sword_Falchion_spr', 'gear-sword-3': 'Normal_Sword_Flamberge_spr', 'gear-sword-4': 'Normal_Sword_Giant_Sword_spr', 'gear-sword-5': 'Normal_Sword_Katana_spr', 'gear-bow-0': 'Normal_Bow_Crossbow_spr', 'gear-bow-1': 'Normal_Bow_Long_Bow_spr', 'gear-bow-2': 'Normal_Bow_Razor_Bow_spr', 'gear-bow-3': 'Normal_Bow_Short_War_Bow_spr', 'gear-helmet-0': 'Helmet_Normal_Basilisk_Skull_spr', 'gear-helmet-1': 'Helmet_Normal_Basinet_spr', 'gear-helmet-2': 'Helmet_Normal_Cap_spr', 'gear-helmet-3': 'Helmet_Normal_Casque_spr', 'gear-helmet-4': 'Helmet_Normal_Geat_Helm_spr', 'gear-helmet-5': 'Helmet_Normal_Horned_Helm_spr', 'gear-boots-0': 'Boots_Normal_Battle_Boots_spr', 'gear-boots-1': 'Boots_Normal_Boneweave_Boots_spr', 'gear-boots-2': 'Boots_Normal_Boots_spr', 'gear-boots-3': 'Boots_Normal_Chain_Boots_spr', 'gear-boots-4': 'Boots_Normal_Crusader_Marchers_spr', 'gear-boots-5': 'Boots_Normal_Demonplate_Boots_spr', 'gear-gloves-0': 'Gloves_Normal_Archmage_Wraps_spr', 'gear-gloves-1': 'Gloves_Normal_Chain_Gloves_spr', 'gear-gloves-2': 'Gloves_Normal_Demonbraces_spr', 'gear-gloves-3': 'Gloves_Normal_Devilhide_Gloves_spr', 'gear-gloves-4': 'Gloves_Normal_Gauntlets_spr', 'gear-gloves-5': 'Gloves_Normal_Heavy_Braces_spr', 'gear-ring-0': 'Rings_Normal_Bronze_Ring_spr', 'gear-ring-1': 'Rings_Normal_Golden_Ring_spr', 'gear-ring-2': 'Rings_Normal_Iron_Ring_spr', 'gear-ring-3': 'Rings_Normal_Primal_Ring_spr', 'gear-ring-4': 'Rings_Normal_Ring_spr', 'gear-ring-5': 'Rings_Normal_Socketed_Ring_spr', 'gear-amulet-0': 'Amulet_Normal_Elven_Necklace_spr', 'gear-amulet-1': 'Amulet_Normal_Golden_Amulet_spr', 'gear-amulet-2': 'Amulet_Normal_Hawks_Claw_Amulet_spr', 'gear-amulet-3': 'Amulet_Normal_Jade_Stone_spr', 'gear-amulet-4': 'Amulet_Normal_Silver_Necklace_spr', 'gear-amulet-5': 'Amulet_Normal_Skull_Trophy_spr', 'gear-belt-0': 'Belts_Normal_Battle_Belt_spr', 'gear-belt-1': 'Belts_Normal_Devilhide_Sash_spr', 'gear-belt-2': 'Belts_Normal_Heavy_Belt_spr', 'gear-belt-3': 'Belts_Normal_Leather_Belt_spr', 'gear-belt-4': 'Belts_Normal_Mithril_Coil_spr', 'gear-belt-5': 'Belts_Normal_Sash_spr', 'gear-shield-0': 'Shields_Normal_Aegis_spr', 'gear-shield-1': 'Shields_Normal_Bone_Shield_spr', 'gear-shield-2': 'Shields_Normal_Buckler_spr', 'gear-shield-3': 'Shields_Normal_Kite_Shield_spr', 'gear-shield-4': 'Shields_Normal_Luna_spr', 'gear-shield-5': 'Shields_Normal_Monarch_spr'})
groups.update({'bounty-board':'Fall_Bounty_Board_spr','gear-armor-0':'Armor_Leather_Muscle_Breastplate_spr','gear-armor-1':'Armor_Arcane_Robes_of_Authority_spr','gear-armor-2':'Armor_Black_Knights_Carapace_spr','gear-armor-3':'Armor_Captains_Attire_spr'})
groups.update({'map-item':'Charms_Travelers_Map_Journal_spr','merchant-cartographer':'Isaac_NPC_spr','jewel-table':'Jewel_Crafting_Table_spr','work-table':'Cabin_Table_02_spr','weapon-shelf':'Cabin_Weapon_Shelf_Left_spr','clothesline':'Helheim_Clothesline_spr','camp-cloth':'Camp_Cloth_spr','camp-chair':'Cabin_Chair_01_spr'})
manifest={}
for key,name in groups.items():
 fs=sorted((root/name).glob('*.png'),key=lambda p:int(p.stem.split('_')[-1]))
 if not fs:print('MISSING',name);continue
 frames=[]
 for n,f in enumerate(fs):
  output=f'{key}-{n}.png';shutil.copyfile(f,dest/output)
  im=Image.open(f);frames.append({'file':output,'source':str(f.relative_to(root)).replace('\\','/'),'width':im.width,'height':im.height})
 manifest[key]=frames
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(repo/'src/original-assets.json').write_text(json.dumps(manifest,separators=(',',':')),encoding='utf-8')
print('Imported',sum(map(len,manifest.values())),'original frames with provenance')
