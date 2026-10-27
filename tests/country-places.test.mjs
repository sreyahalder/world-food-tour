import test from 'node:test';
import assert from 'node:assert/strict';
import {countrySuggestions} from '../lib/country-places.ts';

const places=[
 {id:'ariana',country:'AF',name:'Ariana Afghan Kebab'},
 {id:'cka',country:'AL',name:'Çka ka Qellue'},
 {id:'kasbah',country:'DZ',name:'Kasbah Cafe'},
];

test('a saved Afghanistan restaurant replaces the different preloaded suggestion',()=>{
 const visits=[{country:'AF',restaurant:'Balkh Shish Kabab House',status:'Visited'}];
 assert.deepEqual(countrySuggestions(places,visits),places.slice(1));
 assert.equal(places.length,3);
});

test('a country with notes or a planned visit also has one entry',()=>{
 for(const status of ['No restaurant','Future','About to']){
  assert.deepEqual(countrySuggestions(places,[{country:'AF',restaurant:'',status}]),places.slice(1));
 }
});

test('unrecorded countries have at most one suggestion',()=>{
 assert.deepEqual(countrySuggestions([...places,{id:'another-afghan',country:'AF',name:'Another restaurant'}],[]),places);
});

test('choosing the same restaurant for another country does not hide that country’s suggestion',()=>{
 assert.deepEqual(countrySuggestions(places,[{country:'US',restaurant:'Ariana Afghan Kebab'}]),places);
});
