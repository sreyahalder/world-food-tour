import type {Character,Walker} from './couple-motion';

export type MapEncounter = {id:string;country:string;label:string;character:Character};

function locationAtFeet(walker:Walker):Omit<MapEncounter,'character'>|null {
  // Hit the rendered map at the feet, so country coastlines, zoom, pan and
  // clipped restaurant pins all use exactly what is visible on screen.
  for(const [dx,dy] of [[0,-4],[-8,-4],[8,-4],[0,-10]]){
    const top=document.elementsFromPoint(walker.x+dx,walker.y+dy)
      .find(element=>!element.closest('#couple-characters'));
    const map=top?.closest('[data-walk-map]');
    if(!map||map.closest('[inert]')||map.classList.contains('is-dragging'))continue;
    const location=top?.closest('[data-country]');
    if(!location||!map.contains(location)||location.closest('[aria-hidden="true"]'))continue;
    if(location.getAttribute('data-walk-visited')!=='true')continue;
    const country=location.getAttribute('data-country');
    const label=location.getAttribute('data-country-label');
    if(country&&label)return {id:`${map.getAttribute('data-walk-map')}:${location.getAttribute('data-walk-id')||country}`,country,label};
  }
  return null;
}

export function findMapEncounter(walkers:Walker[],previous:MapEncounter|null):MapEncounter|null {
  const candidates=walkers.filter(walker=>!walker.dragging).flatMap(walker=>{
    const location=locationAtFeet(walker);
    return location?[{...location,character:walker.character,moving:walker.moving}]:[];
  });
  // Follow the walking player before an idle partner, keeping the same player
  // when both are walking so a single Enter key always has a clear destination.
  return candidates.find(candidate=>candidate.moving&&candidate.character===previous?.character)
    ||candidates.find(candidate=>candidate.moving)
    ||candidates.find(candidate=>candidate.character===previous?.character)
    ||candidates[0]||null;
}
