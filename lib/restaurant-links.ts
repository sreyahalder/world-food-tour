// Website destinations are separate from the OpenStreetMap verification URL.
export function restaurantWebsite(value:unknown):string {
 if(typeof value!=='string'||!value.trim())return '';
 try {
  const url=new URL(value.trim());
  if(!['https:','http:'].includes(url.protocol))return '';
  if(url.hostname==='openstreetmap.org'||url.hostname.endsWith('.openstreetmap.org'))return '';
  return url.href;
 }catch{return ''}
}
