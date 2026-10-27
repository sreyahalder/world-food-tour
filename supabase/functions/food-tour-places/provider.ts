import {findNYCRestaurants,normalizeRestaurantText} from './nyc-provider.ts';
export type MapRestaurant={id:string;provider:'openstreetmap'|'nyc-dohmh'|'cylex';name:string;address:string;city:'New York'|'Jersey City';borough:string;latitude:number;longitude:number;source_url:string;category:string;verified_at:string;active:boolean};
const boroughs=['Manhattan','Brooklyn','Queens','Bronx','Staten Island'];
const counties:Record<string,string>={'New York County':'Manhattan','Kings County':'Brooklyn','Queens County':'Queens','Bronx County':'Bronx','Richmond County':'Staten Island'};
const foodTypes=new Set(['restaurant','cafe','fast_food','food_court','ice_cream']);
/** Accept named food venues in New York or Jersey City, never address-only geocodes. */
export function restaurantFromMap(row:any,now=new Date().toISOString()):MapRestaurant|null{
 const a=row.address||{};const latitude=Number(row.lat),longitude=Number(row.lon);
 if(a.country_code!=='us')return null;
 const isNYC=['New York','New York City'].includes(a.city)&&(a.state==='New York'||a['ISO3166-2-lvl4']==='US-NY');
 const isJerseyCity=a.city==='Jersey City'&&(a.state==='New Jersey'||a['ISO3166-2-lvl4']==='US-NJ')&&latitude>=40.66&&latitude<=40.78&&longitude>=-74.13&&longitude<=-74.00;
 if(!isNYC&&!isJerseyCity)return null;
 const city=isJerseyCity?'Jersey City':'New York';
 const borough=isJerseyCity?'Jersey City':[a.borough,a.suburb,a.city_district,a.county].map(x=>boroughs.includes(x)?x:counties[x]).find(Boolean);
 if(!borough||!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<40.49||latitude>40.93||longitude< -74.26||longitude> -73.69)return null;
 if((row.category||row.class)!=='amenity'||!foodTypes.has(row.type)||!['node','way','relation'].includes(row.osm_type)||!/^\d+$/.test(String(row.osm_id)))return null;
 const name=(row.namedetails?.['name:en']||row.name||row.namedetails?.name||'').trim();if(!name||!a.road)return null;
 const tags=row.extratags||{};if(tags.disused==='yes'||tags.abandoned==='yes'||tags.closed==='yes'||tags['disused:amenity']||tags.end_date)return null;
 const street=[a.house_number,a.road].filter(Boolean).join(' ');
 const address=(isJerseyCity?[street,a.neighbourhood,'Jersey City, NJ',a.postcode]:[street,a.neighbourhood,borough,'New York, NY',a.postcode]).filter(Boolean).join(', ');
 return {id:`osm:${row.osm_type}:${row.osm_id}`,provider:'openstreetmap',name,address,city,borough,latitude,longitude,source_url:`https://www.openstreetmap.org/${row.osm_type}/${row.osm_id}`,category:row.type,verified_at:now,active:true};
}
/** Normalize Photon's OSM GeoJSON before applying the existing venue checks. */
export function restaurantFromPhoton(feature:any,now=new Date().toISOString()):MapRestaurant|null{
 const p=feature?.properties;const geometry=feature?.geometry;
 if(feature?.type!=='Feature'||!p||geometry?.type!=='Point'||!Array.isArray(geometry.coordinates)||geometry.coordinates.length!==2)return null;
 const [longitude,latitude]=geometry.coordinates;
 if(typeof longitude!=='number'||typeof latitude!=='number'||typeof p.name!=='string'||typeof p.street!=='string'||!p.street.trim()||typeof p.countrycode!=='string')return null;
 const osmTypes:Record<string,string>={N:'node',W:'way',R:'relation'};
 return restaurantFromMap({
  lat:latitude,lon:longitude,name:p.name,osm_type:osmTypes[p.osm_type],osm_id:p.osm_id,
  category:p.osm_key,type:p.osm_value,extratags:p.extra||{},
  address:{city:p.city,state:p.state,country_code:p.countrycode?.toLowerCase(),borough:p.district,county:p.county,suburb:p.locality,road:p.street,house_number:p.housenumber,neighbourhood:p.locality,postcode:p.postcode},
 },now);
}

export async function findPhotonRestaurants(query:string,fetcher:typeof fetch=fetch,endpoint='https://photon.komoot.io/api/'):Promise<MapRestaurant[]>{
 // Photon permits moderate project use. Searches are debounced, rate limited
 // and cached by the handler. A server setting allows switching Photon hosts.
 const url=new URL(endpoint);url.search=new URLSearchParams({q:query,limit:'12',lang:'en',bbox:'-74.26,40.49,-73.69,40.93'}).toString();
 for(const type of foodTypes)url.searchParams.append('osm_tag',`amenity:${type}`);
 let response:Response;
 try{
  response=await fetcher(url,{headers:{'User-Agent':'AlphabetForTwo/1.0 (https://alphabet-for-two.haldersreya.chatgpt.site)','Accept':'application/json'},signal:AbortSignal.timeout(12000)});
 }catch(error){
  console.error('food-tour-places provider request failed',{provider:'photon',kind:error instanceof Error?error.name:'unknown'});
  throw Error('The map search could not connect. Please try again in a moment.');
 }
 if(!response.ok){
  console.error('food-tour-places provider response failed',{provider:'photon',status:response.status});
  if(response.status===429)throw Error('The map search is busy. Please wait a minute and try again.');
  throw Error('The map search is temporarily unavailable. Please try again.');
 }
 let data:any;
 try{data=await response.json()}catch{throw Error('The map search returned an unexpected result. Please try again.')}
 if(data?.type!=='FeatureCollection'||!Array.isArray(data.features))throw Error('The map search returned an unexpected result. Please try again.');
 const restaurants=(data.features as unknown[]).map(row=>restaurantFromPhoton(row)).filter((r):r is MapRestaurant=>r!==null);
 return [...new Map(restaurants.map(r=>[r.id,r])).values()];
}

export async function findRestaurants(query:string,fetcher:typeof fetch=fetch,endpoint?:string):Promise<MapRestaurant[]>{
 // A valid Photon result may still omit another branch of the same restaurant.
 const [map,registry]=await Promise.allSettled([findPhotonRestaurants(query,fetcher,endpoint),findNYCRestaurants(query,fetcher)]);
 const mapResults=map.status==='fulfilled'?map.value:[];
 const registryResults=registry.status==='fulfilled'?registry.value:[];
 const nameKey=(name:string)=>normalizeRestaurantText(name).replace(/[^\p{L}\p{N}]/gu,'');
 const sameVenue=(a:MapRestaurant,b:MapRestaurant)=>a.id===b.id||(
  a.borough===b.borough&&nameKey(a.name)===nameKey(b.name)&&
  a.address.match(/^\S+/)?.[0]===b.address.match(/^\S+/)?.[0]&&
  Math.hypot((a.latitude-b.latitude)*111320,(a.longitude-b.longitude)*84300)<40
 );
 // Exact registry matches lead; retain OSM IDs for shared listings so saved
 // places do not acquire duplicate identities. Separate branches remain separate.
 const results:MapRestaurant[]=[];
 for(const venue of [...registryResults.map(row=>mapResults.find(mapRow=>sameVenue(row,mapRow))||row),...mapResults]){
  if(!results.some(existing=>sameVenue(existing,venue)))results.push(venue);
 }
 if(!results.length){
  if(registry.status==='rejected')throw registry.reason;
  if(map.status==='rejected')throw map.reason;
 }
 return results.slice(0,12);
}
