import test from 'node:test';
import assert from 'node:assert/strict';
import {foodMarkersVisible,worldFoodMarkers,countryMapPoint} from '../lib/world-food-markers.ts';
import {defaultDishSticker} from '../lib/dish-stickers.ts';

test('food icons enter at 2.5x and stay stable around the threshold until zooming below 2.2x',()=>{
 assert.equal(foodMarkersVisible(2.49,false),false);
 assert.equal(foodMarkersVisible(2.5,false),true);
 assert.equal(foodMarkersVisible(2.35,true),true);
 assert.equal(foodMarkersVisible(2.2,true),false);
 assert.equal(foodMarkersVisible(2.35,false),false);
});

test('multiple restaurant stops produce one real food icon per visited country',()=>{
 const countries=[{code:'BD',name:'Bangladesh',lat:24,lng:90},{code:'AM',name:'Armenia',lat:40,lng:45},{code:'AO',name:'Angola',lat:-12,lng:18}];
 const visits=[
  {country:'BD',status:'Visited',dishes:[{name:'Unknown dish',sticker:defaultDishSticker}]},
  {country:'BD',status:'Visited',dishes:[{name:'Fuchka'},{name:'Goat biryani'}]},
  {country:'AM',status:'Future',dishes:[{name:'Mantu'}]},
  {country:'AO',status:'Visited',dishes:[]},
 ];
 const markers=worldFoodMarkers(countries,visits);
 assert.equal(markers.length,1);
 assert.equal(markers[0].name,'Fuchka');
 assert.equal(markers[0].sticker,'/assets/dish-stickers/fuchka-v1.png');
 assert.deepEqual({x:markers[0].x,y:markers[0].y},countryMapPoint(countries[0]));
});

test('invalid country coordinates and visits without illustrated dishes do not add placeholders',()=>{
 assert.deepEqual(worldFoodMarkers([{code:'XX',name:'Invalid',lat:NaN,lng:0}],[{country:'XX',status:'Visited',dishes:[{name:'Fuchka'}]}]),[]);
 assert.deepEqual(worldFoodMarkers([{code:'BD',name:'Bangladesh',lat:24,lng:90}],[{country:'BD',status:'Visited',dishes:[{name:'Unknown dish'}]}]),[]);
});
