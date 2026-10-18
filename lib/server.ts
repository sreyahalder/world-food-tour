import {createClient} from '@supabase/supabase-js';
import config from './supabase-config.json';
export function error(message:string,status=400){return Response.json({error:message},{status})}
export async function authorize(req:Request){const bearer=req.headers.get('Authorization');if(!bearer?.startsWith('Bearer '))return false;const client=createClient(config.url,config.publishableKey,{global:{headers:{Authorization:bearer}},auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await client.rpc('food_tour_is_owner');return !error&&data===true}
