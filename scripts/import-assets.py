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
 'weapon':'Weapon_Sword_Azurewrath_spr','staff':'Weapon_Staff_Flame_of_Phoenix_spr','bow':'Weapon_Bow_Arrow_of_Niflheim_spr','armor':'Armor_Leather_Muscle_Breastplate_spr',
}
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
