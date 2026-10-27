import type {MapRestaurant} from './provider.ts';

const endpoint='https://data.cityofnewyork.us/resource/43nn-pn8j.json';
const boroughs=['Manhattan','Brooklyn','Queens','Bronx','Staten Island'];
// DOHMH uses 2010 NTA codes. BX06 is Belmont, not a restaurant-name alias.
const neighborhoodCodes:Record<string,string>={BELMONT:'BX06'};

export function normalizeRestaurantText(text:string):string {
 return text.normalize('NFD').replace(/\p{M}/gu,'').toUpperCase();
}

/** NYC DOHMH records include registered restaurants not yet present in OSM. */
export function restaurantFromNYC(row:any,now=new Date().toISOString()):MapRestaurant|null {
 if(!row||!/^\d{8}$/.test(String(row.camis))||typeof row.dba!=='string'||!row.dba.trim()||!boroughs.includes(row.boro))return null;
 if(typeof row.building!=='string'||!row.building.trim()||typeof row.street!=='string'||!row.street.trim()||!/^\d{5}$/.test(row.zipcode||''))return null;
 if(!row.latitude||!row.longitude||/closed|out of business/i.test(row.action||''))return null;
 const latitude=Number(row.latitude),longitude=Number(row.longitude);
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<40.49||latitude>40.93||longitude< -74.26||longitude> -73.69)return null;
 return {id:`nyc:dohmh:${row.camis}`,provider:'nyc-dohmh',name:row.dba.trim(),
  address:`${row.building.trim()} ${row.street.trim()}, ${row.boro}, New York, NY, ${row.zipcode}`,
  city:'New York',borough:row.boro,latitude,longitude,source_url:`${endpoint}?camis=${row.camis}`,
  category:'restaurant',verified_at:now,active:true};
}

export function nycRestaurantQuery(query:string):string {
 const words=query.toUpperCase().match(/[\p{L}\p{N}]+/gu)||[];
 const specific=words.filter(word=>!['RESTAURANT','RESTAURANTS'].includes(word));
 return (specific.length?specific:words).slice(0,8).map(word=>{
  const folded=normalizeRestaurantText(word);
  const alternatives=[...new Set([word,folded])].flatMap(value=>['dba','boro','street'].map(field=>`upper(${field}) like '%${value}%'`));
  if(neighborhoodCodes[folded])alternatives.push(`nta = '${neighborhoodCodes[folded]}'`);
  return `(${alternatives.join(' OR ')})`;
 }).join(' AND ');
}

export async function findNYCRestaurants(query:string,fetcher:typeof fetch=fetch):Promise<MapRestaurant[]> {
 const where=nycRestaurantQuery(query);if(!where)return [];
 const columns='camis,dba,boro,building,street,zipcode,latitude,longitude,inspection_date,action';
 const url=new URL(endpoint);
 url.search=new URLSearchParams({'$select':columns,'$group':columns,'$where':where,'$order':'inspection_date DESC,camis ASC','$limit':'100'}).toString();
 let response:Response;
 try{response=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)})}
 catch{throw Error('The NYC restaurant search could not connect. Please try again.')}
 if(!response.ok)throw Error('The NYC restaurant search is temporarily unavailable. Please try again.');
 let rows:unknown;
 try{rows=await response.json()}catch{throw Error('The NYC restaurant search returned an unexpected result. Please try again.')}
 if(!Array.isArray(rows))throw Error('The NYC restaurant search returned an unexpected result. Please try again.');
 const seen=new Set<string>(),results:MapRestaurant[]=[];
 // The newest record wins, including when it says a restaurant is closed.
 for(const row of rows){
  if(!row||seen.has(String(row.camis)))continue;
  seen.add(String(row.camis));
  const venue=restaurantFromNYC(row);if(venue)results.push(venue);
 }
 return results.slice(0,12);
}
