export type MapRestaurant={id:string;provider:'openstreetmap';name:string;address:string;city:'New York';borough:string;latitude:number;longitude:number;source_url:string;category:string;verified_at:string;active:boolean};
const boroughs=['Manhattan','Brooklyn','Queens','Bronx','Staten Island'];
const counties:Record<string,string>={'New York County':'Manhattan','Kings County':'Brooklyn','Queens County':'Queens','Bronx County':'Bronx','Richmond County':'Staten Island'};
const foodTypes=new Set(['restaurant','cafe','fast_food','food_court','ice_cream']);
/** Accept a named food venue in the provider's NYC administrative area, never an address-only geocode. */
export function restaurantFromMap(row:any,now=new Date().toISOString()):MapRestaurant|null{
 const a=row.address||{};const latitude=Number(row.lat),longitude=Number(row.lon);
 if(!['New York','New York City'].includes(a.city)||a.country_code!=='us'||(a.state!=='New York'&&a['ISO3166-2-lvl4']!=='US-NY'))return null;
 const borough=[a.borough,a.suburb,a.city_district,a.county].map(x=>boroughs.includes(x)?x:counties[x]).find(Boolean);
 if(!borough||!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<40.49||latitude>40.93||longitude< -74.26||longitude> -73.69)return null;
 if((row.category||row.class)!=='amenity'||!foodTypes.has(row.type)||!['node','way','relation'].includes(row.osm_type)||!/^\d+$/.test(String(row.osm_id)))return null;
 const name=(row.namedetails?.['name:en']||row.name||row.namedetails?.name||'').trim();if(!name||!a.road)return null;
 const tags=row.extratags||{};if(tags.disused==='yes'||tags.abandoned==='yes'||tags.closed==='yes'||tags['disused:amenity']||tags.end_date)return null;
 const street=[a.house_number,a.road].filter(Boolean).join(' ');
 const address=[street,a.neighbourhood,borough,'New York, NY',a.postcode].filter(Boolean).join(', ');
 return {id:`osm:${row.osm_type}:${row.osm_id}`,provider:'openstreetmap',name,address,city:'New York',borough,latitude,longitude,source_url:`https://www.openstreetmap.org/${row.osm_type}/${row.osm_id}`,category:row.type,verified_at:now,active:true};
}
export async function findRestaurants(query:string,fetcher:typeof fetch=fetch):Promise<MapRestaurant[]>{
 const url=new URL('https://nominatim.openstreetmap.org/search');url.search=new URLSearchParams({q:query,format:'jsonv2',addressdetails:'1',namedetails:'1',extratags:'1',limit:'12',countrycodes:'us',viewbox:'-74.26,40.49,-73.69,40.93',bounded:'1',layer:'poi','accept-language':'en'}).toString();
 const response=await fetcher(url,{headers:{'User-Agent':'AlphabetForTwo/1.0 (https://alphabet-for-two.haldersreya.chatgpt.site)','Accept':'application/json'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('The map search is temporarily unavailable. Please try again.');
 const rows=await response.json();if(!Array.isArray(rows))throw Error('The map search returned an unexpected result.');
 return [...new Map(rows.map(row=>restaurantFromMap(row)).filter((r):r is MapRestaurant=>r!==null).map(r=>[r.id,r])).values()];
}
