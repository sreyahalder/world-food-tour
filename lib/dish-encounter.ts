import type {Character,Walker} from './couple-motion';

export type DishEncounter={kind:'dish';id:string;label:string;character:Character};

export function findDishEncounter(walkers:Walker[],previous:DishEncounter|null):DishEncounter|null {
  // Stickers ignore pointer events so clicking the photo still works. Measure
  // their visible bounds, then check the hit stack for clipping and overlays.
  const stickers=Array.from(document.querySelectorAll<HTMLElement>('.country-panel [data-collect-dish]'))
    .filter(sticker=>sticker.dataset.collected!=='true'&&!sticker.closest('[inert],[hidden],[data-opening]')&&sticker.getClientRects().length>0)
    .map(sticker=>({sticker,rect:sticker.getBoundingClientRect(),panel:sticker.closest('.country-panel'),surface:sticker.closest('.media-cover')}));
  const candidates=walkers.filter(walker=>!walker.dragging).flatMap(walker=>{
    const nearby=stickers.filter(({sticker,rect,panel,surface})=>{
      if(!panel||rect.width<=0||rect.height<=0)return false;
      return [[0,-4],[-8,-4],[8,-4],[0,-10]].some(([dx,dy])=>{
        const x=walker.x+dx,y=walker.y+dy;
        if(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return false;
        const top=document.elementsFromPoint(x,y).find(element=>!element.closest('#couple-characters'));
        return !!top&&top.closest('.country-panel')===panel&&(top.contains(sticker)||!!surface?.contains(top));
      });
    }).sort((a,b)=>Math.hypot(walker.x-(a.rect.left+a.rect.width/2),walker.y-(a.rect.top+a.rect.height/2))-Math.hypot(walker.x-(b.rect.left+b.rect.width/2),walker.y-(b.rect.top+b.rect.height/2)));
    const sticker=nearby[0]?.sticker;
    const id=sticker?.dataset.collectDish,label=sticker?.dataset.dishName;
    return id&&label?[{kind:'dish' as const,id,label,character:walker.character,moving:walker.moving}]:[];
  });
  return candidates.find(candidate=>candidate.moving&&candidate.character===previous?.character)
    ||candidates.find(candidate=>candidate.moving)
    ||candidates.find(candidate=>candidate.character===previous?.character)
    ||candidates[0]||null;
}
