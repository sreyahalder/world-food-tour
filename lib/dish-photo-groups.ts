export type DishPhotoGroup<T> = {photo:string;dishes:T[]};

export function groupDishesByPhoto<T extends {photo?:string}>(dishes:readonly T[]):DishPhotoGroup<T>[] {
 const groups:DishPhotoGroup<T>[]=[];
 const photos=new Map<string,DishPhotoGroup<T>>();
 for(const dish of dishes){
  const photo=dish.photo?.trim()||'';
  const existing=photo?photos.get(photo):undefined;
  if(existing){existing.dishes.push(dish);continue}
  const group={photo,dishes:[dish]};
  groups.push(group);
  // Missing photos are separate dishes, not a shared image.
  if(photo)photos.set(photo,group);
 }
 return groups;
}
