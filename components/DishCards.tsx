'use client';
import {groupDishesByPhoto} from '../lib/dish-photo-groups';
import MediaCover from './MediaCover';
import {Stars} from './VisitEditor';
import {passportDish} from '../lib/passport-collection';

type DishCardItem={id?:string;name:string;description?:string;rating?:number;photo?:string;sticker?:string};

export default function DishCards({dishes,onOpen,collection}:{dishes:DishCardItem[];onOpen:(photo:string)=>void;collection?:{country:string;entry:string;collectedIds:ReadonlySet<string>;ready:boolean}}){
 return groupDishesByPhoto(dishes).map((group,index)=>{
  const shared=group.dishes.length>1;
  const details=(dish:DishCardItem)=><><h3>{dish.name}</h3>{dish.description&&<p>{dish.description}</p>}{!!dish.rating&&dish.rating>0&&<Stars value={dish.rating}/>}</>;
  return <article className={`dish-card${shared?' dish-card-shared':''}`} key={group.dishes[0].id||group.photo||`${group.dishes[0].name}-${index}`}>
   <MediaCover src={group.photo} stickers={group.dishes.map(dish=>{
    const item=collection?.ready?passportDish(collection.country,collection.entry,dish):null;
    return {name:dish.name,src:dish.sticker,collectible:item&&collection?{id:item.id,collected:collection.collectedIds.has(item.id)}:undefined};
   })} kind="dish" variant={index} alt={group.dishes.map(dish=>dish.name).join(', ')} onOpen={onOpen}/>
   <div className="dish-copy">{shared?<ul className="shared-dish-list">{group.dishes.map((dish,dishIndex)=><li key={dish.id||`${dish.name}-${dishIndex}`}>{details(dish)}</li>)}</ul>:details(group.dishes[0])}</div>
  </article>;
 });
}
