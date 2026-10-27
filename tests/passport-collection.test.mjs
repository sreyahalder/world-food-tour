import test from 'node:test';
import assert from 'node:assert/strict';
import {passportDish,addPassportDish,mergeCollectedDishes,parsePassport,serializePassport,passportSpreadCount,dishesPerPage} from '../lib/passport-collection.ts';
import {dishSticker} from '../lib/dish-stickers.ts';

const dish=passportDish('al','visit-one',{id:'dish-one',name:'Byrek'});

test('a pickup keeps the same sticker and survives leaving and reloading',()=>{
  const picked=addPassportDish([],dish,123);
  assert.deepEqual(parsePassport(serializePassport(picked)),[{...dish,collectedAt:123}]);
  assert.equal(picked[0].sticker,dishSticker('Byrek'));
  assert.equal(picked[0].name,'Byrek');
  assert.equal(picked[0].country,'AL');
});

test('repeat pickups by either character never add another copy or change collection time',()=>{
  const picked=addPassportDish([],dish,123);
  assert.equal(addPassportDish(picked,dish,456),picked);
  assert.equal(addPassportDish(picked,{...dish,name:'Updated name'},789),picked);
  assert.equal(picked.length,1);
});

test('dish ids survive renames and shared photos, with separate entries and countries kept distinct',()=>{
  const renamed=passportDish('AL','visit-one',{id:'dish-one',name:'Byrek with spinach'});
  assert.equal(renamed.id,dish.id);
  assert.notEqual(passportDish('AL','visit-one',{id:'dish-two',name:'Byrek'}).id,dish.id);
  assert.notEqual(passportDish('AL','visit-two',{id:'dish-one',name:'Byrek'}).id,dish.id);
  assert.notEqual(passportDish('DZ','visit-one',{id:'dish-one',name:'Byrek'}).id,dish.id);
  assert.equal(passportDish('AL','guide',{name:'  Byrek  '}).id,passportDish('al','guide',{name:'byrek'}).id);
});

test('merging pickups from tabs keeps both collections and the original pickup time',()=>{
  const second=passportDish('AL','visit-one',{id:'dish-two',name:'Tavë kosi'});
  const merged=mergeCollectedDishes(addPassportDish([],second,200),addPassportDish([],dish,100),addPassportDish([],dish,300));
  assert.deepEqual(merged.map(item=>[item.id,item.collectedAt]),[[dish.id,100],[second.id,200]]);
  assert.deepEqual(parsePassport(serializePassport(merged)),merged);
});

test('bad storage and unsupported versions cannot break the passport',()=>{
  for(const raw of [null,'','{','null','[]','42',JSON.stringify({version:2,dishes:[]}),JSON.stringify({version:1,dishes:{}})]){
    assert.deepEqual(parsePassport(raw),[]);
  }
  const good={...dish,collectedAt:100};
  const bad=[null,{}, {...good,name:''},{...good,country:'INVALID'},{...good,id:17},{...good,collectedAt:-1},{...good,sticker:17}];
  assert.deepEqual(parsePassport(JSON.stringify({version:1,dishes:[...bad,good,good]})),[good]);
});

test('unsafe stored sticker URLs fall back to known artwork',()=>{
  const unknown={...dish,name:'Unknown dish',sticker:'javascript:alert(1)',collectedAt:100};
  assert.equal(parsePassport(JSON.stringify({version:1,dishes:[unknown]}))[0].sticker,dishSticker('Unknown dish'));
});

test('every sticker has a page as collections grow past a spread',()=>{
  assert.equal(passportSpreadCount(0),1);
  assert.equal(passportSpreadCount(40),1);
  assert.equal(passportSpreadCount(41),2);
  assert.equal(passportSpreadCount(81),3);
  const many=Array.from({length:93},(_,i)=>({...dish,id:String(i),collectedAt:i}));
  const pages=Array.from({length:passportSpreadCount(many.length)*2},(_,page)=>many.slice(page*dishesPerPage,(page+1)*dishesPerPage));
  assert.deepEqual(pages.flat(),many);
  assert.ok(pages.every(page=>page.length<=dishesPerPage));
});
