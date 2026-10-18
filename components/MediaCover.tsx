'use client';
import {useState} from 'react';
export default function MediaCover({src,alt,kind,variant=0,onOpen}:{src?:string;alt:string;kind:'restaurant'|'dish'|'history';variant?:number;onOpen?:(url:string)=>void}){
 const [failed,setFailed]=useState('');
 const photo=src&&src!==failed?src:'';
 const fallback=`/assets/placeholders/${kind==='dish'?`dish-${variant%3+1}`:kind}.svg`;
 const picture=<img src={photo||fallback} alt={photo?alt:`${alt} — image placeholder`} loading="lazy" onError={()=>{if(photo)setFailed(photo)}}/>;
 return photo&&onOpen?<button className={`media-cover media-${kind}`} aria-label={`View image: ${alt}`} onClick={()=>onOpen(photo)}>{picture}</button>:<div className={`media-cover media-${kind} ${photo?'':'is-placeholder'}`}>{picture}</div>
}
