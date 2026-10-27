import {dishSticker} from './dish-stickers.ts';

export const passportStorageKey='alphabet-city:passport:v1';
export const passportPageColumns=5;
export const passportPageRows=4;
export const dishesPerPage=passportPageColumns*passportPageRows;
export type PassportDish={id:string;country:string;name:string;sticker:string};
export type CollectedDish=PassportDish&{collectedAt:number};
export type StickerCollection={id:string;collected:boolean};

export function passportDish(country:string,entry:string,dish:{id?:string;name:string;sticker?:string}):PassportDish {
  const name=dish.name.trim();
  return {
    id:JSON.stringify([country.toUpperCase(),entry,dish.id||name.normalize('NFC').toLowerCase()]),
    country:country.toUpperCase(),name,sticker:dishSticker(name,dish.sticker),
  };
}

export function mergeCollectedDishes(...collections:readonly CollectedDish[][]):CollectedDish[] {
  const unique=new Map<string,CollectedDish>();
  for(const collection of collections)for(const dish of collection){
    const previous=unique.get(dish.id);
    if(!previous||dish.collectedAt<previous.collectedAt)unique.set(dish.id,dish);
  }
  return [...unique.values()].sort((a,b)=>a.collectedAt-b.collectedAt||a.id.localeCompare(b.id));
}

export function parsePassport(raw:string|null):CollectedDish[] {
  if(!raw)return [];
  try{
    const data:unknown=JSON.parse(raw);
    if(!data||typeof data!=='object'||!('version' in data)||data.version!==1||!('dishes' in data)||!Array.isArray(data.dishes))return [];
    const dishes:CollectedDish[]=[];
    for(const item of data.dishes){
      if(!item||typeof item!=='object'||typeof item.id!=='string'||!item.id||item.id.length>2048
        ||typeof item.name!=='string'||!item.name.trim()||item.name.length>500
        ||typeof item.country!=='string'||!/^[A-Z]{2}$/.test(item.country)
        ||typeof item.sticker!=='string'||item.sticker.length>4096
        ||typeof item.collectedAt!=='number'||!Number.isFinite(item.collectedAt)||item.collectedAt<0)continue;
      dishes.push({id:item.id,country:item.country,name:item.name.trim(),sticker:dishSticker(item.name,item.sticker),collectedAt:item.collectedAt});
    }
    return mergeCollectedDishes(dishes);
  }catch{return []}
}

export function serializePassport(dishes:CollectedDish[]):string {
  return JSON.stringify({version:1,dishes});
}

export function addPassportDish(dishes:CollectedDish[],dish:PassportDish,now=Date.now()):CollectedDish[] {
  return dishes.some(existing=>existing.id===dish.id)?dishes:mergeCollectedDishes(dishes,[{...dish,collectedAt:now}]);
}

export function passportSpreadCount(count:number):number {
  return Math.max(1,Math.ceil(count/(dishesPerPage*2)));
}
