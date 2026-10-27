type Coordinates = {latitude?:number|null;longitude?:number|null};
type RestaurantLocation = Coordinates & {name?:string;address?:string;borough?:string;source_url?:string};
type VisitLocationRow = Coordinates & {
  restaurant_name?:string|null;
  address?:string|null;
  neighborhood?:string|null;
  map_url?:string|null;
  restaurant?:RestaurantLocation|null;
};

// The New York metro map bounds include Jersey City.
export function nycLatLng(latitude:unknown,longitude:unknown):[number,number]|null {
  if(typeof latitude!=='number'||typeof longitude!=='number'||!Number.isFinite(latitude)||!Number.isFinite(longitude))return null;
  if(latitude<40.49||latitude>40.93||longitude< -74.26||longitude> -73.69)return null;
  return [latitude,longitude];
}

// Visits keep a location snapshot, but a corrected venue record must take
// precedence whenever it is joined. Never mix coordinates from two sources.
export function restaurantLocation(row:VisitLocationRow){
  const venue=row.restaurant;
  const coordinates=nycLatLng(venue?venue.latitude:row.latitude,venue?venue.longitude:row.longitude);
  return {
    restaurant:venue?.name??row.restaurant_name??'',
    address:venue?.address??row.address??'',
    neighborhood:venue?.borough??row.neighborhood??'',
    sourceUrl:venue?.source_url??row.map_url??'',
    lat:coordinates?.[0]??null,
    lng:coordinates?.[1]??null,
  };
}
