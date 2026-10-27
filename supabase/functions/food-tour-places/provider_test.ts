import {deepStrictEqual, equal, rejects} from 'node:assert/strict';
import {findPhotonRestaurants, restaurantFromPhoton} from './provider.ts';

// Shape of a real Photon NYC restaurant response.
const venue={
 type:'Feature',
 properties:{osm_type:'N',osm_id:12662579801,osm_key:'amenity',osm_value:'restaurant',type:'house',housenumber:'787',name:'Ariana Afghan Kebab',street:'9th Avenue',locality:"Hell's Kitchen",district:'Manhattan',city:'New York',state:'New York',country:'United States',postcode:'10019',countrycode:'US'},
 geometry:{type:'Point',coordinates:[-73.988016,40.7651093]},
};
const withProperties=(properties:Record<string,unknown>)=>({...venue,properties:{...venue.properties,...properties}});
const response=(features:unknown[])=>Response.json({type:'FeatureCollection',features});
const now='2026-10-18T15:00:00.000Z';

Deno.test('Photon venues retain canonical OSM IDs, addresses and coordinates',()=>{
 deepStrictEqual(restaurantFromPhoton(venue,now),{
  id:'osm:node:12662579801',provider:'openstreetmap',name:'Ariana Afghan Kebab',
  address:"787 9th Avenue, Hell's Kitchen, Manhattan, New York, NY, 10019",
  city:'New York',borough:'Manhattan',latitude:40.7651093,longitude:-73.988016,
  source_url:'https://www.openstreetmap.org/node/12662579801',category:'restaurant',verified_at:now,active:true,
 });
 equal(restaurantFromPhoton(withProperties({osm_type:'W'}))?.id,'osm:way:12662579801');
 equal(restaurantFromPhoton(withProperties({osm_type:'R'}))?.id,'osm:relation:12662579801');
});

Deno.test('unsupported cities, non-food places, streets and incomplete venues are rejected',()=>{
 for(const properties of [
  {city:'Jersey City',state:'New Jersey'}, {city:'Yonkers'}, {city:undefined},
  {countrycode:'CA'}, {state:'New Jersey'}, {district:'Hoboken'},
  {osm_key:'highway',osm_value:'residential'}, {osm_value:'pharmacy'},
  {name:''}, {name:12}, {street:''}, {street:undefined},
  {osm_type:'X'}, {osm_id:'bad'}, {osm_id:undefined},
  {extra:{disused:'yes'}}, {extra:{abandoned:'yes'}}, {extra:{closed:'yes'}},
  {extra:{'disused:amenity':'restaurant'}}, {extra:{end_date:'2025'}},
 ])equal(restaurantFromPhoton(withProperties(properties)),null,JSON.stringify(properties));
});

Deno.test('invalid geometry is rejected and NYC counties can supply boroughs',()=>{
 for(const coordinates of [[-74.5,40.7],[-73.9,41],['-73.9',40.7],[-73.9,null],[-73.9,NaN],[-73.9],[-73.9,40.7,0]]){
  equal(restaurantFromPhoton({...venue,geometry:{type:'Point',coordinates}}),null);
 }
 for(const feature of [null,{}, {...venue,geometry:null},{...venue,geometry:{type:'LineString',coordinates:[-73.9,40.7]}}])equal(restaurantFromPhoton(feature),null);
 equal(restaurantFromPhoton(withProperties({district:undefined,county:'Kings County'}))?.borough,'Brooklyn');
});

Deno.test('search uses Photon, bounds food queries to the local map and deduplicates valid results',async()=>{
 const fetcher:typeof fetch=async(input,init)=>{
  const url=new URL(String(input));
  equal(url.origin,'https://photon.komoot.io');
  equal(url.pathname,'/api/');
  equal(url.searchParams.get('q'),'Ariana Afghan Kebab');
  equal(url.searchParams.get('bbox'),'-74.26,40.49,-73.69,40.93');
  deepStrictEqual(url.searchParams.getAll('osm_tag'),['amenity:restaurant','amenity:cafe','amenity:fast_food','amenity:food_court','amenity:ice_cream']);
  equal(init?.signal instanceof AbortSignal,true);
  return response([venue,venue,withProperties({city:'Jersey City'}),null]);
 };
 const results=await findPhotonRestaurants('Ariana Afghan Kebab',fetcher);
 equal(results.length,1);equal(results[0].id,'osm:node:12662579801');
});

Deno.test('valid empty searches stay empty and a configured Photon host is used',async()=>{
 const fetcher:typeof fetch=async(input)=>{equal(new URL(String(input)).origin,'https://photon.example');return response([])};
 deepStrictEqual(await findPhotonRestaurants('No such restaurant',fetcher,'https://photon.example/api/'),[]);
});

Deno.test('provider outages, throttling, timeouts and bad payloads cannot become cached empty successes',async()=>{
 await rejects(()=>findPhotonRestaurants('Ariana',async()=>new Response('Forbidden',{status:403})),/temporarily unavailable/);
 await rejects(()=>findPhotonRestaurants('Ariana',async()=>new Response('Busy',{status:429})),/wait a minute/);
 await rejects(()=>findPhotonRestaurants('Ariana',async()=>{throw new DOMException('Timed out','TimeoutError')}),/could not connect/);
 await rejects(()=>findPhotonRestaurants('Ariana',async()=>new Response('<html>unavailable</html>')),/unexpected result/);
 await rejects(()=>findPhotonRestaurants('Ariana',async()=>Response.json({error:'unavailable'})),/unexpected result/);
});

Deno.test('Jersey City food venues retain their real city, source and coordinates',()=>{
 const jc={...withProperties({name:'A Jersey City Restaurant',city:'Jersey City',state:'New Jersey',district:undefined,county:'Hudson County',street:'Martin Luther King Drive',housenumber:'475',locality:undefined,postcode:'07304'}),geometry:{type:'Point',coordinates:[-74.0759,40.7142322]}};
 const result=restaurantFromPhoton(jc,now);
 equal(result?.city,'Jersey City');equal(result?.borough,'Jersey City');
 equal(result?.address,'475 Martin Luther King Drive, Jersey City, NJ, 07304');
 equal(result?.latitude,40.7142322);equal(result?.longitude,-74.0759);
 equal(result?.source_url,'https://www.openstreetmap.org/node/12662579801');
 for(const properties of [{city:'Hoboken'},{city:'Newark'},{state:'New York'},{countrycode:'CA'}])equal(restaurantFromPhoton({...jc,properties:{...jc.properties,...properties}}),null);
 equal(restaurantFromPhoton({...jc,geometry:{type:'Point',coordinates:[-73.98,40.75]}}),null);
});
