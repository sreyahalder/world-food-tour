export type RestaurantSearchState<T>={query:string;results:T[];searching:boolean;searched:boolean;error:string};
export const normalizeRestaurantQuery=(query:string)=>query.trim().replace(/\s+/g,' ');

/** Debounce typing, space upstream requests, and discard stale responses. */
export function createRestaurantSearch<T>(lookup:(query:string,signal:AbortSignal)=>Promise<T[]>,publish:(state:RestaurantSearchState<T>)=>void){
 let timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined,version=0,lastStarted=0;
 const cache=new Map<string,{results:T[];expires:number}>();
 function cancel(){version++;clearTimeout(timer);controller?.abort();controller=undefined}
 function search(input:string,immediate=false){
  cancel();
  const query=normalizeRestaurantQuery(input),id=version;
  const state={query,results:[] as T[],searching:false,searched:false,error:''};
  if(query.length<3){publish(state);return}
  const key=query.toLocaleLowerCase('en-US'),cached=cache.get(key);
  if(cached&&cached.expires>Date.now()&&!immediate){publish({...state,results:cached.results,searched:true});return}
  publish({...state,searching:true});
  timer=setTimeout(async()=>{
   const request=new AbortController();controller=request;lastStarted=Date.now();
   try{
    const results=await lookup(query,request.signal);
    if(id!==version||request.signal.aborted)return;
    cache.set(key,{results,expires:Date.now()+(results.length?60000:10000)});publish({...state,results,searched:true});
   }catch(error){
    if(id===version&&!request.signal.aborted)publish({...state,error:error instanceof Error?error.message:'Restaurant search could not load. Please retry.'});
   }
  },Math.max(immediate?0:400,lastStarted+1200-Date.now()));
 }
 return {search,cancel};
}
