import {createClient, SupabaseClient} from '@supabase/supabase-js';
import config from './supabase-config.json';
let client:SupabaseClient|undefined;
export function supabase(){return client??=createClient(config.url,config.publishableKey,{auth:{persistSession:typeof window!=='undefined',autoRefreshToken:typeof window!=='undefined',detectSessionInUrl:typeof window!=='undefined',flowType:'implicit'}})}
