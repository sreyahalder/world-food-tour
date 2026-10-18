import {supabase} from './supabase';
import type {Country,Visit,Place,MapRestaurant} from './types';
export type Guide={kicker:string;description:string;image:string;dishes:{name:string;description:string;photo?:string}[];foodSource:string};
export type History={text:string;url:string;title:string;attribution?:string;image?:string;imageAlt?:string};
export function visitFromRow(row:any,code:string):Visit{return {id:row.entry_uuid,country:code,city:row.city,placeId:row.restaurant_place_id||null,sourceUrl:row.map_url||'',status:row.status||'Future',restaurant:row.restaurant_name||'',address:row.address||'',neighborhood:row.neighborhood||'',lat:row.latitude??null,lng:row.longitude??null,date:row.visit_date||'',rating:row.rating||0,review:row.notes||'',photos:row.photos||[],dishes:row.dish_objects||[]}}
export async function readJournal(){
 const db=supabase();const [cs,vs,ps]=await Promise.all([db.from('countries').select('id,name,iso_code,profile').order('name'),db.from('restaurant_visits').select('*').eq('city','New York').order('visit_date',{ascending:false,nullsFirst:false}).order('id'),db.from('food_tour_places').select('id,country_code,data,restaurant:food_tour_restaurants!inner(*)').eq('city','New York').eq('restaurant.active',true)]);
 for(const result of [cs,vs,ps])if(result.error)throw result.error;
 const histories:Record<string,History>={},guides:Record<string,Guide>={};
 const countries:Country[]=(cs.data||[]).filter(c=>c.profile?.code).map(c=>{if(c.profile.history)histories[c.iso_code]=c.profile.history;if(c.profile.guide)guides[c.iso_code]=c.profile.guide;return c.profile as Country}).sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base'}));
 const codeById=new Map((cs.data||[]).map(c=>[c.id,c.iso_code]));
 return {countries,histories,guides,places:(ps.data||[]).map((p:any)=>{const r=p.restaurant;return {...p.data,id:p.id,country:p.country_code,city:r.city,placeId:r.id,sourceUrl:r.source_url,name:r.name,address:r.address,area:r.borough,lat:r.latitude,lng:r.longitude}}) as Place[],visits:(vs.data||[]).map(v=>visitFromRow(v,codeById.get(v.country_id)||''))};
}
export async function ownerAccess(){const {data,error}=await supabase().rpc('food_tour_is_owner');return !error&&data===true}
export async function saveVisit(visit:Visit){const {data,error}=await supabase().rpc('food_tour_save_visit',{entry:visit});if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row?.entry_uuid)throw Error('The saved visit could not be loaded. Refresh the journal before retrying.');return visitFromRow(row,visit.country)}
export async function deleteVisit(id:string){const {data,error}=await supabase().from('restaurant_visits').delete().eq('entry_uuid',id).eq('city','New York').select('entry_uuid');if(error)throw error;if(!data?.length)throw Error('This visit could not be removed. Sign in again and retry.')}
export async function uploadPhoto(blob:Blob){const id=typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');const key=`${id}.${blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg'}`;const {error}=await supabase().storage.from('food-tour-photos').upload(key,blob,{contentType:blob.type,upsert:false});if(error)throw error;return supabase().storage.from('food-tour-photos').getPublicUrl(key).data.publicUrl}
export async function accessHeaders(){const {data}=await supabase().auth.getSession();if(!data.session)throw Error('Sign in to edit your journal.');return {Authorization:`Bearer ${data.session.access_token}`}}
export async function saveHistory(code:string,history:History){const db=supabase();const {data,error}=await db.from('countries').select('profile').eq('iso_code',code).single();if(error)throw error;const saved=await db.from('countries').update({profile:{...data.profile,history}}).eq('iso_code',code).select('iso_code');if(saved.error)throw saved.error;if(!saved.data?.length)throw Error('Sign in as the owner to edit this country.')}

export async function searchRestaurants(query:string):Promise<MapRestaurant[]>{
 const {data,error}=await supabase().functions.invoke('food-tour-places',{body:{query}});
 if(error){let message='The map search couldn’t load. Please try again.';try{const body=await error.context?.json();if(body?.error)message=body.error}catch{}throw Error(message)}
 if(data?.error)throw Error(data.error);return data.results||[];
}
