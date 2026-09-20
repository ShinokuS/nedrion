export const ENEMY_MODS={
 swift:{name:'Стремительность',description:'+35% скорости передвижения',color:0x71d7ec},
 armored:{name:'Броня',description:'На 30% меньше входящего урона',color:0xe0c28b},
 regenerating:{name:'Регенерация',description:'Восстанавливает 1,5% здоровья в секунду',color:0x78d58a},
 furious:{name:'Ярость',description:'+35% урона',color:0xf18b78}
};
export function applyEnemyMods(e,mods){e.mods=[...new Set(mods)];e.elite=e.mods.length>0;e.maxHP*=1+e.mods.length*.65;e.hp=e.maxHP;if(e.mods.includes('swift'))e.speed*=1.35;e.damageReduction=e.mods.includes('armored')?.7:1;e.damageMultiplier=e.mods.includes('furious')?1.35:1;}
export function drawEnemyBadges(s,e){
 const root=s.add.container(0,0).setDepth(6502);e.buffIcons=root;
 e.mods.forEach((id,i)=>{const m=ENEMY_MODS[id],x=(i-(e.mods.length-1)/2)*18,g=s.add.graphics().fillStyle(0x0c0b10,.95).fillRoundedRect(x-8,-8,16,16,3).lineStyle(1,m.color).strokeRoundedRect(x-8,-8,16,16,3).lineStyle(2,m.color);root.add(g);
 if(id==='regenerating')g.lineBetween(x-4,0,x+4,0).lineBetween(x,-4,x,4);
 if(id==='swift')g.beginPath().moveTo(x+2,-5).lineTo(x-3,0).lineTo(x+2,0).lineTo(x-2,5).strokePath();
 if(id==='armored')g.beginPath().moveTo(x-4,-4).lineTo(x+4,-4).lineTo(x+3,2).lineTo(x,5).lineTo(x-3,2).closePath().strokePath();
 if(id==='furious')g.lineBetween(x-4,4,x+4,-4).lineBetween(x-4,0,x,4).lineBetween(x+1,-4,x+4,-4).lineBetween(x+4,-4,x+4,-1);
 const hit=s.add.zone(x,0,16,16).setInteractive();root.add(hit);hit.on('pointerover',()=>{e.buffTip?.destroy();e.buffTip=s.add.text(e.sprite.x,e.sprite.y-e.barHeight-45,m.name+'\n'+m.description,{fontFamily:'Arial',fontSize:13,resolution:3,color:'#eee2ca',backgroundColor:'#100d12',padding:{x:8,y:6}}).setOrigin(.5,1).setDepth(7000);}).on('pointerout',()=>{e.buffTip?.destroy();e.buffTip=null;});
 });return root;
}
