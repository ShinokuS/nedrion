import {REFUGE} from './refuge-layout.js';
import {grid,item,put} from './core.js';
export const MERCHANTS={
 cartographer:{title:'КАРТОГРАФ',sprite:'merchant-cartographer',x:REFUGE.merchants.cartographer[0],y:REFUGE.merchants.cartographer[1],stock:['forestmap','hauntedmap','ravagedmap']},
 blacksmith:{title:'КУЗНЕЦ',sprite:'merchant-smith',x:REFUGE.merchants.blacksmith[0],y:REFUGE.merchants.blacksmith[1],stock:['staff','sword','bow','warstaff','longsword','hunterbow']},
 tailor:{title:'ПОРТНОЙ',sprite:'merchant-tailor',x:REFUGE.merchants.tailor[0],y:REFUGE.merchants.tailor[1],stock:['armor','gloves','boots','belt','swiftboots']},
 armorer:{title:'БРОННИК',sprite:'merchant-armorer',x:REFUGE.merchants.armorer[0],y:REFUGE.merchants.armorer[1],stock:['helmet','shield','plate']},
 jeweler:{title:'ЮВЕЛИР',sprite:'merchant-jeweler',x:REFUGE.merchants.jeweler[0],y:REFUGE.merchants.jeweler[1],stock:['ring','amulet','lifering','fire','arrow','slash','nova','multi','haste','pierce','meteor','rain','juggernaut','healing','blink','duration']}
};
export function merchantStock(stocks,id='jeweler'){
 const spec=MERCHANTS[id]||MERCHANTS.jeweler,g=stocks[id] ||= grid(12,8);
 for(const type of spec.stock)if(!g.items.some(it=>it.type===type))put(g,item(type,1));
 return g;
}
