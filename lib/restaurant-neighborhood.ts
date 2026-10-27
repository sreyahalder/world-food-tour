type RestaurantArea={placeId?:string|null;lat?:number|null;lng?:number|null;address?:string;area?:string};

// Neighborhoods returned by NYC Planning GeoSearch for these verified coordinates.
// Keep the coordinates with each label so moved/corrected listings cannot reuse it.
const neighborhoods:Record<string,{name:string;lat:number;lng:number}>=
{
  "nyc:dohmh:40366879": {
    "name": "Elmhurst",
    "lat": 40.744706795371,
    "lng": -73.884569670655
  },
  "nyc:dohmh:41286452": {
    "name": "Lower East Side",
    "lat": 40.71768735712,
    "lng": -73.990465589601
  },
  "nyc:dohmh:41551354": {
    "name": "Jackson Heights",
    "lat": 40.748332216554,
    "lng": -73.892626068395
  },
  "nyc:dohmh:41699662": {
    "name": "Sheepshead Bay",
    "lat": 40.609062429727,
    "lng": -73.962212773171
  },
  "nyc:dohmh:50001330": {
    "name": "Greenpoint",
    "lat": 40.724456946287,
    "lng": -73.951197454634
  },
  "nyc:dohmh:50072405": {
    "name": "Belmont",
    "lat": 40.853808561184,
    "lng": -73.888037810481
  },
  "nyc:dohmh:50130126": {
    "name": "South Slope",
    "lat": 40.668854601704,
    "lng": -73.985645812023
  },
  "nyc:dohmh:50165267": {
    "name": "Financial District",
    "lat": 40.706069068284,
    "lng": -74.004201908708
  },
  "nyc:dohmh:50176955": {
    "name": "Bay Ridge",
    "lat": 40.631334841006,
    "lng": -74.022751265493
  },
  "osm:node:12470628924": {
    "name": "Midtown East",
    "lat": 40.7446861,
    "lng": -73.9818352
  },
  "osm:node:12662579801": {
    "name": "Midtown West",
    "lat": 40.7651093,
    "lng": -73.988016
  },
  "osm:node:2844921607": {
    "name": "Sunnyside",
    "lat": 40.7389693,
    "lng": -73.9266383
  },
  "osm:node:5782486184": {
    "name": "Astoria",
    "lat": 40.7742036,
    "lng": -73.9133194
  }
};
const broadAreas=new Set(['Manhattan','Brooklyn','Queens','Bronx','Staten Island','New York','New York City','Jersey City','NY','NJ','USA','United States']);

export function restaurantNeighborhood(place:RestaurantArea):string {
 const known=place.placeId?neighborhoods[place.placeId]:undefined;
 if(known&&typeof place.lat==='number'&&typeof place.lng==='number'&&Math.abs(place.lat-known.lat)<.001&&Math.abs(place.lng-known.lng)<.001)return known.name;
 const namedArea=place.address?.split(',').slice(1).map(part=>part.trim()).find(part=>part&&!broadAreas.has(part)&&! /^(?:NY|NJ)?\s*\d{5}(?:-\d{4})?$/.test(part));
 return namedArea||place.area?.trim()||'';
}
