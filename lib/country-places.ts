import type {Place, Visit} from './types';

// A saved country entry replaces its planning suggestion, even when the owner
// picked a different restaurant or recorded that no restaurant is available.
export function countrySuggestions(places:Place[],visits:Visit[]):Place[]{
 const occupied=new Set(visits.map(visit=>visit.country));
 return places.filter(place=>{
  if(occupied.has(place.country))return false;
  occupied.add(place.country);
  return true;
 });
}
