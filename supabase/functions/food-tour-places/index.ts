import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {findRestaurants} from './provider.ts';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Use POST.'},405);
 const authorization=req.headers.get('Authorization');if(!authorization?.startsWith('Bearer '))return reply({error:'Sign in to search restaurants.'},401);
 try{
 const url=Deno.env.get('SUPABASE_URL')!;
 const user=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:identity,error:identityError}=await user.auth.getUser();if(identityError||!identity.user)return reply({error:'Sign in again to search restaurants.'},401);
 const {data:owner,error:ownerError}=await user.rpc('food_tour_is_owner');if(ownerError||owner!==true)return reply({error:'Only the journal owner can search and add restaurants.'},403);
 const input=await req.json();const query=String(input.query||'').trim().replace(/\s+/g,' ');if(query.length<3||query.length>120)return reply({error:'Enter a restaurant name between 3 and 120 characters.'},400);
 // Service credentials stay inside Supabase. Only provider responses are registered as trusted venues.
 const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const cacheKey=query.toLocaleLowerCase('en-US');
 const {data:cached,error:cacheError}=await admin.from('food_tour_geocoder_cache').select('results').eq('query',cacheKey).gt('expires_at',new Date().toISOString()).maybeSingle();if(cacheError)throw Error('Restaurant search could not load. Please retry.');
 if(cached)return reply({results:cached.results,provider:'OpenStreetMap'});
 const {data:slot,error:slotError}=await admin.rpc('food_tour_reserve_geocode');if(slotError)throw Error('Restaurant search could not start. Please retry.');if(!slot)return reply({error:'Please wait a moment before searching again.'},429);
 const results=await findRestaurants(query);
 if(results.length){const {error}=await admin.from('food_tour_restaurants').upsert(results,{onConflict:'id'});if(error)throw Error('The map results could not be validated. Please retry.');}
 const {error:saveError}=await admin.from('food_tour_geocoder_cache').upsert({query:cacheKey,results,expires_at:new Date(Date.now()+86400000).toISOString()});if(saveError)throw Error('The restaurant results could not be saved. Please retry.');
 return reply({results,provider:'OpenStreetMap'});
 }catch(e){return reply({error:e instanceof Error?e.message:'Restaurant search failed. Please try again.'},503)}
});
