import {defaultDishSticker,dishSticker} from './dish-stickers.ts';
import type {Country,Visit} from './types.ts';

export const FOOD_SHOW_ZOOM=2.5;
export const FOOD_HIDE_ZOOM=2.2;
export type WorldFoodMarker={country:string;countryName:string;name:string;sticker:string;x:number;y:number};

// A small gap between thresholds prevents flickering during trackpad gestures.
export function foodMarkersVisible(scale:number,visible:boolean):boolean {
 return visible ? scale>FOOD_HIDE_ZOOM : scale>=FOOD_SHOW_ZOOM;
}

export function countryMapPoint(country:Pick<Country,'lat'|'lng'>) {
 return {x:(country.lng+180)*2.65,y:(85-country.lat)*3.05};
}

// One real dish per visited country keeps neighboring countries readable.
export function worldFoodMarkers(countries:Country[],visits:Visit[]):WorldFoodMarker[] {
 return countries.flatMap(country=>{
  if(!Number.isFinite(country.lat)||!Number.isFinite(country.lng))return [];
  const dishes=visits.filter(v=>v.country===country.code&&v.status==='Visited').flatMap(v=>v.dishes);
  const dish=dishes.find(d=>dishSticker(d.name,d.sticker)!==defaultDishSticker);
  return dish ? [{country:country.code,countryName:country.name,name:dish.name,sticker:dishSticker(dish.name,dish.sticker),...countryMapPoint(country)}] : [];
 });
}
