import {deepStrictEqual,equal,ok,rejects} from 'node:assert/strict';
import {findNYCRestaurants,nycRestaurantQuery,restaurantFromNYC} from './nyc-provider.ts';
import {findRestaurants} from './provider.ts';

const mermeta={camis:'50176955',dba:'MERMETA',boro:'Brooklyn',building:'479',street:'73 STREET',zipcode:'11209',latitude:'40.631334841006',longitude:'-74.022751265493',inspection_date:'1900-01-01T00:00:00.000'};
const belmont={camis:'50072405',dba:'CKA KA QELLU',boro:'Bronx',building:'2321',street:'HUGHES AVENUE',zipcode:'10458',latitude:'40.853808561184',longitude:'-73.888037810481',inspection_date:'2025-05-08T00:00:00.000'};
const manhattan={...belmont,camis:'50105982',dba:'CKA KA QELLUE',boro:'Manhattan',building:'118',street:'EAST 31 STREET',zipcode:'10016',latitude:'40.744782634132',longitude:'-73.9818183993'};
const manhattanMap={type:'Feature',properties:{osm_type:'N',osm_id:12470628924,osm_key:'amenity',osm_value:'restaurant',name:'Çka ka Qellue',street:'East 31st Street',housenumber:'118',district:'Manhattan',city:'New York',state:'New York',countrycode:'US',postcode:'10016'},geometry:{type:'Point',coordinates:[-73.9818352,40.7446861]}};

Deno.test('official Mermeta record preserves the registered address, source and coordinates',()=>{
 const venue=restaurantFromNYC(mermeta,'2026-10-21T00:00:00Z');
 equal(venue?.id,'nyc:dohmh:50176955');equal(venue?.provider,'nyc-dohmh');
 equal(venue?.address,'479 73 STREET, Brooklyn, New York, NY, 11209');
 equal(venue?.latitude,40.631334841006);equal(venue?.longitude,-74.022751265493);
 equal(venue?.source_url,'https://data.cityofnewyork.us/resource/43nn-pn8j.json?camis=50176955');
});

Deno.test('incomplete, closed, non-NYC and invalid-coordinate records cannot be selected',()=>{
 for(const fields of [{camis:'1'},{camis:'osm:node:1'},{dba:''},{boro:'Yonkers'},{building:''},{street:''},{zipcode:''},{latitude:null},{latitude:'0'},{longitude:'NaN'},{longitude:-80},{action:'Establishment Closed by DOHMH.'}])equal(restaurantFromNYC({...mermeta,...fields}),null);
 equal(restaurantFromNYC(null),null);
});

Deno.test('name search accepts Restaurant suffix and treats punctuation as text',()=>{
 equal(nycRestaurantQuery('Mermeta Restaurant'),nycRestaurantQuery('Mermeta'));
 const where=nycRestaurantQuery("Joe's 100%_Restaurant");
 ok(where.includes("'%JOE%'"));ok(where.includes("'%100%'"));
 ok(!where.includes("Joe's"));ok(!where.includes('%_%'));
});

Deno.test('NYC search deduplicates inspection rows and never revives an older closed venue',async()=>{
 const fetcher:typeof fetch=async input=>{
  const url=new URL(String(input));equal(url.origin,'https://data.cityofnewyork.us');
  ok(url.searchParams.get('$where')?.includes("'%MERMETA%'"));
  equal(url.searchParams.get('$order'),'inspection_date DESC,camis ASC');
  return Response.json([mermeta,mermeta,{...mermeta,camis:'50111111',action:'Establishment Closed by DOHMH.'},{...mermeta,camis:'50111111'}]);
 };
 equal((await findNYCRestaurants('Mermeta Restaurant',fetcher)).length,1);
});

Deno.test('Mermeta is found through NYC when Photon has no listing, including typed prefixes',async()=>{
 for(const query of ['Merm','Mermeta','Mermeta Restaurant']){
  const fetcher:typeof fetch=async input=>new URL(String(input)).hostname==='photon.komoot.io'?Response.json({type:'FeatureCollection',features:[]}):Response.json([mermeta]);
  equal((await findRestaurants(query,fetcher))[0].id,'nyc:dohmh:50176955');
 }
});

Deno.test('fallback can survive a Photon outage, but outages cannot become cached empty results',async()=>{
 const fallback:typeof fetch=async input=>new URL(String(input)).hostname==='photon.komoot.io'?new Response('Unavailable',{status:503}):Response.json([mermeta]);
 equal((await findRestaurants('Mermeta',fallback))[0].id,'nyc:dohmh:50176955');
 await rejects(()=>findRestaurants('Mermeta',async input=>new URL(String(input)).hostname==='photon.komoot.io'?Response.json({type:'FeatureCollection',features:[]}):new Response('Unavailable',{status:503})),/NYC restaurant search is temporarily unavailable/);
 await rejects(()=>findNYCRestaurants('Mermeta',async()=>Response.json({error:'invalid'})),/unexpected result/);
 deepStrictEqual(await findNYCRestaurants('Mermeta',async()=>Response.json([])),[]);
});

Deno.test('accented searches match ASCII registrations and Belmont searches use the official neighborhood code',()=>{
 const where=nycRestaurantQuery('Çka Ka Qëllu Belmont');
 for(const word of ['ÇKA','CKA','QËLLU','QELLU'])ok(where.includes(`'%${word}%'`));
 ok(where.includes("nta = 'BX06'"));
 // A restaurant named Belmont is still searchable by name.
 ok(where.includes("upper(dba) like '%BELMONT%'"));
});

Deno.test('Belmont appears first even when Photon returns only the Manhattan branch',async()=>{
 const fetcher:typeof fetch=async input=>{
  const url=new URL(String(input));
  if(url.hostname==='photon.komoot.io')return Response.json({type:'FeatureCollection',features:[manhattanMap]});
  ok(url.searchParams.get('$where')?.includes("nta = 'BX06'"));
  return Response.json([belmont]);
 };
 const results=await findRestaurants('Çka Ka Qëllu Belmont',fetcher);
 equal(results[0].id,'nyc:dohmh:50072405');
 equal(results[0].address,'2321 HUGHES AVENUE, Bronx, New York, NY, 10458');
 equal(results[0].latitude,40.853808561184);equal(results[0].longitude,-73.888037810481);
});

Deno.test('search combines branches while keeping the existing OSM identity for duplicate listings',async()=>{
 const fetcher:typeof fetch=async input=>new URL(String(input)).hostname==='photon.komoot.io'?Response.json({type:'FeatureCollection',features:[manhattanMap]}):Response.json([manhattan,belmont]);
 deepStrictEqual((await findRestaurants('Çka Ka Qëllu',fetcher)).map(row=>row.id),['osm:node:12470628924','nyc:dohmh:50072405']);
});

Deno.test('same-name nearby branches with different street numbers remain distinct',async()=>{
 const nearby={...manhattan,camis:'50111111',building:'120'};
 const fetcher:typeof fetch=async input=>new URL(String(input)).hostname==='photon.komoot.io'?Response.json({type:'FeatureCollection',features:[manhattanMap]}):Response.json([manhattan,nearby]);
 equal((await findRestaurants('Çka Ka Qëllu',fetcher)).length,2);
});

Deno.test('valid map results remain available during a NYC dataset outage',async()=>{
 const fetcher:typeof fetch=async input=>new URL(String(input)).hostname==='photon.komoot.io'?Response.json({type:'FeatureCollection',features:[manhattanMap]}):new Response('Unavailable',{status:503});
 equal((await findRestaurants('Çka Ka Qëllu',fetcher))[0].id,'osm:node:12470628924');
});
