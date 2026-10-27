'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Plus,X,Camera,MapPin,Loader2,Trash2,Check,Star,Search,ArrowUpRight} from 'lucide-react';
import {saveVisit,deleteVisit,uploadPhoto,searchRestaurants} from '../lib/journal-data';
import {isTourCity,tourCities} from '../lib/tour-cities';
import {Visit,Dish,Country,Place,MapRestaurant} from '../lib/types';
import DishSticker from './DishSticker';
import {knownDishSticker,dishSticker} from '../lib/dish-stickers';
import {createRestaurantSearch,normalizeRestaurantQuery,type RestaurantSearchState} from '../lib/restaurant-search';
function newId(){if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
export default function VisitEditor({country,countries,places,existing,onClose,onSave,onDelete}:{country:string;countries:Country[];places:Place[];existing?:Visit;onClose:()=>void;onSave:(v:Visit)=>void;onDelete:(id:string)=>void}){
 const [visit,setVisit]=useState<Visit & {nameOnly?:boolean}>(existing||{id:newId(),country,city:'New York',placeId:null,sourceUrl:'',status:'Visited',restaurant:'',address:'',neighborhood:'',lat:null,lng:null,date:'',rating:0,review:'',photos:[],dishes:[]});
 const nameOnly=visit.nameOnly??(!visit.placeId&&!!visit.restaurant);
 const [busy,setBusy]=useState('');const [err,setErr]=useState('');const [query,setQuery]=useState('');const [confirmDelete,setConfirmDelete]=useState(false);const form=useRef<HTMLFormElement>(null);
 const [searchState,setSearchState]=useState<RestaurantSearchState<MapRestaurant>>({query:'',results:[],searching:false,searched:false,error:''});
 const restaurantSearch=useMemo(()=>createRestaurantSearch(searchRestaurants,setSearchState),[]);
 const currentSearch=searchState.query===normalizeRestaurantQuery(query);
 const matches=currentSearch?searchState.results:[],searched=currentSearch&&searchState.searched,searching=currentSearch&&searchState.searching;
 useEffect(()=>{restaurantSearch.search(nameOnly||visit.placeId||visit.status==='No restaurant'?'':query);return restaurantSearch.cancel},[query,visit.placeId,visit.status,nameOnly,restaurantSearch]);
 const update=(x:Partial<Visit> & {nameOnly?:boolean})=>setVisit(v=>({...v,...x}));
 const dish=(id:string,x:Partial<Dish>)=>setVisit(v=>({...v,dishes:v.dishes.map(d=>d.id===id?{...d,...x}:d)}));
 const suggestions=places.filter(p=>p.country===visit.country&&p.placeId&&isTourCity(p.city));
 const needsRestaurant=visit.status==='Visited'||visit.status==='About to';
 const hasUnselectedQuery=!nameOnly&&!!query.trim()&&!visit.placeId;
 const hasRestaurant=!!visit.placeId||(nameOnly&&!!visit.restaurant.trim());
 const missingRestaurant=((needsRestaurant||nameOnly)&&!hasRestaurant)||hasUnselectedQuery;
 function choose(p:MapRestaurant){restaurantSearch.cancel();update({nameOnly:false,city:p.city,placeId:p.id,sourceUrl:p.source_url,websiteUrl:'',restaurant:p.name,address:p.address,neighborhood:p.borough,lat:p.latitude,lng:p.longitude});setQuery('');setErr('')}
 function clearRestaurant(){restaurantSearch.cancel();update({nameOnly:false,placeId:null,sourceUrl:'',websiteUrl:'',restaurant:'',address:'',neighborhood:'',lat:null,lng:null});setQuery('')}
 function addByName(){const restaurant=query.trim()||visit.restaurant;clearRestaurant();update({nameOnly:true,restaurant});setErr('')}
 function findListing(){const name=visit.restaurant;clearRestaurant();setQuery(name);setErr('')}
 async function upload(file:File){
  let blob:Blob=file;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Please choose JPG, PNG, or WebP photos. On iPhone, export HEIC photos as JPG first.');
  if(file.size>20*1024*1024)throw Error('Please use a photo under 20 MB.');
  try{const bitmap=await createImageBitmap(file);const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=bitmap.width*scale;canvas.height=bitmap.height*scale;canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not prepare this photo.')),'image/jpeg',.87));bitmap.close()}catch{if(file.size>6*1024*1024)throw Error('Please use a photo under 6 MB.');}
  return uploadPhoto(blob);
 }
 async function photos(files:FileList|null,dishId?:string){
  if(!files?.length)return;
  setBusy(dishId?'Making your dish sticker':'Uploading photos');setErr('');
  try{
   if(dishId){
    const file=files[0];
    const photo=await upload(file);
    const name=visit.dishes.find(d=>d.id===dishId)?.name||'';
    const sticker=dishSticker(name);
    dish(dishId,{photo,sticker});
   }else{
    const added:string[]=[];
    for(const file of Array.from(files).slice(0,12-visit.photos.length))added.push(await upload(file));
    setVisit(v=>({...v,photos:[...v.photos,...added]}));
   }
  }catch(e){setErr((e as Error).message)}finally{setBusy('')}
 }
 function search(){restaurantSearch.search(query,true)}
 async function save(e:React.FormEvent){e.preventDefault();setErr('');if(missingRestaurant){setErr(nameOnly?'Enter the restaurant name.':'Select a map result or choose Add by name.');return}setBusy('Saving your visit');try{onSave(await saveVisit(visit))}catch(e){setErr((e as Error).message)}finally{setBusy('')}}
 async function remove(){setBusy('Removing visit');try{await deleteVisit(visit.id);onDelete(visit.id)}catch(e){setErr((e as Error).message)}finally{setBusy('')}}
 return <div className="overlay editor-overlay" role="presentation" onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}><section role="dialog" aria-modal="true" aria-labelledby="editor-title" className="editor-panel"><div className="modal-top"><span className="eyebrow">A NEW CHAPTER</span><button className="icon-button" aria-label="Close visit editor" onClick={onClose} disabled={!!busy}><X/></button></div><h2 id="editor-title">{existing?'Edit your visit.':'A table worth remembering.'}</h2><p className="muted">The place, the plates, and the little things you don’t want to forget.</p>
 <form onSubmit={save} ref={form}><fieldset disabled={!!busy}>
 <label>Country<select value={visit.country} onChange={e=>update({country:e.target.value})}>{countries.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
 <div className="form-grid"><label>City<select value={visit.city} aria-label="City" disabled={!!visit.placeId} onChange={e=>update({city:e.target.value})}>{tourCities.map(city=><option key={city}>{city}</option>)}</select></label><label>Status<select aria-label="Status" value={visit.status} onChange={e=>{update({status:e.target.value as Visit["status"]});if(e.target.value==='No restaurant')clearRestaurant()}}>{["Visited","About to","No restaurant","Future"].map(x=><option key={x}>{x}</option>)}</select></label></div>
 {visit.status!=='No restaurant'&&<div className="restaurant-picker"><label htmlFor={nameOnly?'restaurant-name':'restaurant-search'}>{nameOnly?'Restaurant name':'Find a restaurant'}</label>
 {nameOnly?<div className="restaurant-name-only"><input id="restaurant-name" required maxLength={200} value={visit.restaurant} placeholder="Enter the restaurant name" autoFocus onChange={e=>update({restaurant:e.target.value})}/><p className="field-note">Save a closed or unlisted restaurant in your journal, without a map pin.</p><button type="button" className="text-button" onClick={findListing}><Search size={14}/> Search for a listing instead</button></div>:<><p className="field-note">Start typing a restaurant name, then choose a result. Add the street or borough to narrow your search.</p>
 {visit.placeId?<div className="verified-restaurant"><div className="verified-label"><Check size={15}/> Restaurant selected · {visit.city}</div><h3>{visit.restaurant}</h3><p><MapPin size={15}/>{visit.address}</p><div className="verified-links"><a href={visit.sourceUrl} target="_blank" rel="noreferrer">View source listing <ArrowUpRight size={13}/></a><button className="text-button" type="button" onClick={clearRestaurant}>Change restaurant</button></div><small>Address and map pin are saved from this listing.</small></div>:<>
 <div className="restaurant-search-row"><input id="restaurant-search" type="search" maxLength={120} placeholder="e.g. Mermeta Restaurant" value={query} autoComplete="off" aria-busy={searching} onChange={e=>{restaurantSearch.cancel();setQuery(e.target.value)}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search()}}}/><button type="button" className="small-button" disabled={searching||query.trim().length<3} onClick={search}>{searching?<Loader2 size={16} className="spin"/>:<Search size={16}/>} Search</button></div>
 <button type="button" className="text-button name-only-option" onClick={addByName}><Plus size={14}/> Closed or unlisted? Add by name</button>
 {searching&&<p className="field-note" role="status">Searching restaurants…</p>}
 {currentSearch&&searchState.error&&<p className="form-error" role="alert">{searchState.error}</p>}
 {!!matches.length&&<div className="restaurant-results" aria-label="Matching restaurants">{matches.map(p=><button type="button" key={p.id} onClick={()=>choose(p)}><MapPin size={18}/><span><strong>{p.name}</strong><small>{p.address}</small></span><Plus size={16}/></button>)}</div>}
 {searched&&!matches.length&&<p className="field-note" role="status">No matching restaurant was found. Try a shorter name or another spelling.</p>}
 {!!suggestions.length&&!query&&<div className="suggested-fill"><span>Verified places on your list</span>{suggestions.map(p=><button type="button" key={p.id} onClick={()=>choose({id:p.placeId!,name:p.name,address:p.address,city:p.city||'New York',borough:p.area,latitude:p.lat,longitude:p.lng,source_url:p.sourceUrl!,verified_at:''})}>{p.name} <Plus size={13}/></button>)}</div>}
 </>}<div className="source-link">Restaurant listings: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a> · <a href="https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j" target="_blank" rel="noreferrer">NYC Open Data</a></div></>}</div>}
 {visit.status==='No restaurant'&&<p className="field-note">Save your country notes now. Choose a map listing when you find a restaurant.</p>}
 <div className="form-section-heading"><h3>Restaurant photos</h3><span>First photo is the cover · up to 12</span></div><div className="upload-grid">{visit.photos.map(p=><div className="upload-thumb" key={p}><img src={p} alt="Visit photo"/><button aria-label="Remove photo" type="button" onClick={()=>update({photos:visit.photos.filter(x=>x!==p)})}><X size={14}/></button></div>)}{visit.photos.length<12&&<label className="upload-button"><Camera size={22}/><span>Add photos</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{photos(e.target.files);e.target.value=''}}/></label>}</div>
 <div className="form-section-heading"><h3>What we ordered</h3><button type="button" className="text-button" onClick={()=>update({dishes:[...visit.dishes,{id:newId(),name:'',description:'',rating:0,photo:''}]})}><Plus size={15}/> Add a dish</button></div>
 {!visit.dishes.length&&<p className="field-note">Each dish gets its own name, photo, notes, and rating.</p>}
 {visit.dishes.map((d,i)=><div className="dish-editor" key={d.id}><div className="dish-editor-top"><span className="eyebrow">Dish</span><button className="icon-button" type="button" aria-label={`Remove dish ${i+1}`} onClick={()=>update({dishes:visit.dishes.filter(x=>x.id!==d.id)})}><Trash2 size={15}/></button></div><label>Dish name<input required value={d.name} placeholder="e.g. Kabuli pulao" onChange={e=>dish(d.id,{name:e.target.value,...(d.sticker?.startsWith('/assets/dish-stickers/')?{sticker:knownDishSticker(e.target.value)}:{})})}/></label><label>A few words<textarea rows={2} value={d.description} placeholder="What made it memorable?" onChange={e=>dish(d.id,{description:e.target.value})}/></label><div className="dish-bottom"><Stars value={d.rating} onChange={v=>dish(d.id,{rating:v})}/><label className="dish-upload">{d.photo?<span className="dish-photo-preview"><img src={d.photo} alt={d.name||'Dish'}/><DishSticker name={d.name} src={d.sticker}/></span>:<span className="dish-sticker-preview"><DishSticker name={d.name} src={d.sticker}/></span>} {d.photo?'Replace photo':'Dish photo'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{photos(e.target.files,d.id);e.target.value=''}}/></label></div></div>)}
 <div className="form-section-heading"><h3>The little review</h3><Stars value={visit.rating} onChange={v=>update({rating:v})}/></div><label className="sr-only" htmlFor="review">Review</label><textarea id="review" rows={4} placeholder="The dish you’re still thinking about. The atmosphere. Would you go back?" value={visit.review} onChange={e=>update({review:e.target.value})}/>
 </fieldset>{err&&<p className="form-error" role="alert">{err}</p>}<div className="editor-footer">{existing?<button type="button" className="text-button danger" onClick={()=>setConfirmDelete(true)}>Remove visit</button>:<span className="field-note">Saved to your journal.</span>}<button className="button dark" disabled={!!busy||(!nameOnly&&searching)||missingRestaurant} type="submit">{busy?<><Loader2 className="spin" size={16}/>{busy}</>:<>Save this chapter <Check size={16}/></>}</button></div>{confirmDelete&&<div className="delete-confirm"><p>Remove this visit from your journal? Its country will reset if it has no other visits.</p><button type="button" className="small-button" onClick={()=>setConfirmDelete(false)}>Keep it</button><button type="button" className="small-button danger" onClick={remove}>Remove visit</button></div>}</form></section></div>
}
export function Stars({value,onChange}:{value:number;onChange?:(n:number)=>void}){return <div className="stars" aria-label={value?`${value} out of 5 stars`:'Not rated'}>{[1,2,3,4,5].map(n=>onChange?<button type="button" key={n} aria-label={`Rate ${n} out of 5`} aria-pressed={value===n} onClick={()=>onChange(value===n?0:n)}><Star size={17} fill={n<=value?'currentColor':'none'}/></button>:<Star key={n} size={14} fill={n<=value?'currentColor':'none'}/>)}</div>}
