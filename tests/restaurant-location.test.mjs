import test from 'node:test';
import assert from 'node:assert/strict';
import {nycLatLng,restaurantLocation} from '../lib/restaurant-location.ts';

const venue={name:'Balkh Shish Kabab House',address:'23-10 31st Street, Astoria, Queens, New York, NY, 11105',borough:'Queens',latitude:40.7742036,longitude:-73.9133194,source_url:'https://www.openstreetmap.org/node/5782486184'};

test('a corrected restaurant location replaces a visit’s old coordinate snapshot',()=>{
  const location=restaurantLocation({restaurant_name:'Old name',address:'Old address',neighborhood:'Old neighborhood',latitude:40.75,longitude:-73.99,map_url:'old',restaurant:venue});
  assert.deepEqual(location,{restaurant:venue.name,address:venue.address,neighborhood:venue.borough,lat:venue.latitude,lng:venue.longitude,sourceUrl:venue.source_url});
});

test('a just-saved RPC row can use its database-validated location before the join loads',()=>{
  const location=restaurantLocation({restaurant_name:venue.name,address:venue.address,latitude:venue.latitude,longitude:venue.longitude,map_url:venue.source_url});
  assert.equal(location.lat,venue.latitude);assert.equal(location.lng,venue.longitude);
});

test('incomplete current coordinates never combine with an old visit coordinate',()=>{
  const location=restaurantLocation({latitude:40.75,longitude:-73.99,restaurant:{...venue,longitude:null}});
  assert.equal(location.lat,null);assert.equal(location.lng,null);
  assert.deepEqual(nycLatLng(location.lat,location.lng),null);
});

test('all three verified restaurants retain their exact latitude-longitude order and precision',()=>{
  for(const coordinates of [[40.7742036,-73.9133194],[40.7446861,-73.9818352],[40.7389693,-73.9266383]]){
    assert.deepEqual(nycLatLng(...coordinates),coordinates);
    assert.equal(nycLatLng(coordinates[1],coordinates[0]),null);
  }
});

test('missing, invalid, or non-NYC positions cannot create misleading pins',()=>{
  for(const coordinates of [[null,null],[undefined,undefined],[NaN,-73.9],[40.7,Infinity],['40.7','-73.9'],[0,0],[51.5,-.12]])assert.equal(nycLatLng(...coordinates),null);
  const location=restaurantLocation({restaurant_name:'',latitude:null,longitude:null});
  assert.equal(location.lat,null);assert.equal(location.lng,null);
});
