import test from 'node:test';
import assert from 'node:assert/strict';
import {isTourCity} from '../lib/tour-cities.ts';
import {nycLatLng} from '../lib/restaurant-location.ts';
test('the public journal includes Jersey City and keeps archive cities outside its scope',()=>{
  for(const city of ['New York','Jersey City'])assert.equal(isTourCity(city),true);
  for(const city of ['Los Angeles','Solvang','Hoboken',''])assert.equal(isTourCity(city),false);
  assert.deepEqual(nycLatLng(40.7142322,-74.0759),[40.7142322,-74.0759]);
});
