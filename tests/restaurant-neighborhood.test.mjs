import test from 'node:test';
import assert from 'node:assert/strict';
import {restaurantNeighborhood} from '../lib/restaurant-neighborhood.ts';

test('a verified restaurant uses its neighborhood instead of just the borough',()=>{
 assert.equal(restaurantNeighborhood({placeId:'osm:node:5782486184',lat:40.7742036,lng:-73.9133194,area:'Queens'}),'Astoria');
 assert.equal(restaurantNeighborhood({placeId:'nyc:dohmh:41286452',lat:40.71768735712,lng:-73.990465589601,area:'Manhattan'}),'Lower East Side');
});

test('a changed location cannot reuse a stale neighborhood',()=>{
 assert.equal(restaurantNeighborhood({placeId:'osm:node:5782486184',lat:40.7,lng:-74,area:'Brooklyn',address:'123 Example Street, Brooklyn, NY 11201'}),'Brooklyn');
});

test('new listings retain explicit neighborhoods and safe area fallbacks',()=>{
 assert.equal(restaurantNeighborhood({address:'37-14 73rd Street, Jackson Heights, NY 11372',area:'Queens'}),'Jackson Heights');
 assert.equal(restaurantNeighborhood({address:'475 Martin Luther King Drive, Jersey City, NJ 07304',area:'Jersey City'}),'Jersey City');
 assert.equal(restaurantNeighborhood({}), '');
});
