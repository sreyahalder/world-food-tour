'use client';
import {useState} from 'react';
import DishSticker from './DishSticker';
import type {StickerCollection} from '../lib/passport-collection';
export default function MediaCover({src,alt,kind,variant=0,sticker,stickers,onOpen}:{src?:string;alt:string;kind:'restaurant'|'dish'|'history';variant?:number;sticker?:string;stickers?:{name:string;src?:string;collectible?:StickerCollection}[];onOpen?:(url:string)=>void}){
 const [failed,setFailed]=useState('');
 const photo=src&&src!==failed?src:'';
 const fallback=`/assets/placeholders/${kind==='dish'?`dish-${variant%3+1}`:kind}.svg`;
 const badges:{name:string;src?:string;collectible?:StickerCollection}[]=stickers?.length?stickers:[{name:alt,src:sticker}];
 const picture=<><img src={photo||fallback} alt={photo?alt:`${alt}, image placeholder`} loading="lazy" onError={()=>{if(photo)setFailed(photo)}}/>{kind==='dish'&&(badges.length>1?<span className="dish-stickers">{badges.map((badge,index)=><DishSticker key={badge.collectible?.id||`${badge.name}-${index}`} name={badge.name} src={badge.src} collectible={badge.collectible}/>)}</span>:<DishSticker name={badges[0].name} src={badges[0].src} collectible={badges[0].collectible}/>)}</>;
 return photo&&onOpen?<button className={`media-cover media-${kind}`} aria-label={`View image: ${alt}`} onClick={()=>onOpen(photo)}>{picture}</button>:<div className={`media-cover media-${kind} ${photo?'':'is-placeholder'}`}>{picture}</div>
}
