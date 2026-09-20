import {skillModifiers} from './skill-rules.js';
export const BASE_COOLDOWN={fire:1,arrow:.65,slash:1,nova:3,meteor:4,rain:6,juggernaut:7,healing:12,blink:5};
export function effectiveSkillStats(skill,upgrades={},damage=0,healingBonus=0){
 const b=skillModifiers(skill,upgrades),count=1+Math.min(7,b.multi);
 return {bonus:b,cooldown:(BASE_COOLDOWN[skill.type]||1)/(1+b.haste*.18),count,damage,
 duration:(skill.duration||1)*(1+b.duration*.25),projectileLife:1.5*(1+b.duration*.25),
 pierce:b.pierce+(skill.type==='arrow'?1:0),healing:35*(1+healingBonus)};
}
export function skillStatLines(skill,stats){
 const f=n=>Number(n.toFixed(2)).toLocaleString('ru-RU'),t=skill.type;
 const lines=[skill.activeOnly?'Активное умение':'Автоматическое умение',`Перезарядка: ${f(stats.cooldown)} с`];
 if(['fire','arrow','slash'].includes(t))lines.push(`Урон одного снаряда: ${f(stats.damage)}`,`Снарядов: ${stats.count}`,`Пробитий: ${stats.pierce}`,`Полёт: ${f(stats.projectileLife)} с · скорость 360`);
 if(t==='nova')lines.push(`Урон по области: ${f(stats.damage*1.5)}`,'Радиус: 155');
 if(t==='meteor')lines.push(`Метеоритов: ${stats.count}`,`Урон каждого: ${f(stats.damage*3)}`,'Радиус взрыва: 85','Падение: 0,8 с');
 if(t==='rain')lines.push(`Залпов стрел: ${stats.count}`,`Урон в области: ${f(stats.damage*.4*stats.count)} / 0,35 с`,`Длительность: ${f(stats.duration)} с`,'Радиус: 110');
 if(t==='juggernaut')lines.push(`Вращающихся мечей: ${stats.count}`,`Урон вокруг: ${f(stats.damage*.6*stats.count)} / 0,35 с`,`Длительность: ${f(stats.duration)} с`,'Радиус: 100');
 if(t==='healing')lines.push(`Восстановление: ${f(stats.healing)} здоровья`,'Мгновенное применение');
 if(t==='blink')lines.push('Дальность: до 200',`Неуязвимость: ${f(.35*stats.duration)} с`,'Останавливается перед препятствием');
 const names={multi:'Снаряды',haste:'Скорость',pierce:'Пробитие',duration:'Длительность'};
 const active=Object.entries(stats.bonus).filter(([,n])=>n>0).map(([k,n])=>`${names[k]} ×${n}`);
 lines.push(active.length?'Связанные усиления: '+active.join(', '):'Связанных усилений нет');return lines;
}
