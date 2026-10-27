import test from 'node:test';
import assert from 'node:assert/strict';
import {groupDishesByPhoto} from '../lib/dish-photo-groups.ts';

test('shared table photos keep every dish, sticker, note and rating together',()=>{
 const dishes=[
  {id:'stew',name:'Bobó de camarão',photo:'meal.jpg',sticker:'stew.png',description:'Shrimp stew',rating:5},
  {id:'bread',name:'Pão de queijo',photo:'bread.jpg'},
  {id:'okra',name:'Quiabo',photo:'meal.jpg',sticker:'okra.png',description:'Okra',rating:4},
  {id:'rice',name:'Arroz branco',photo:'meal.jpg',sticker:'rice.png'},
 ];
 const original=structuredClone(dishes);
 const groups=groupDishesByPhoto(dishes);
 assert.equal(groups.length,2);
 assert.deepEqual(groups[0],{photo:'meal.jpg',dishes:[dishes[0],dishes[2],dishes[3]]});
 assert.deepEqual(groups[1],{photo:'bread.jpg',dishes:[dishes[1]]});
 assert.deepEqual(dishes,original);
});

test('missing photos stay separate and distinct photos of a dish are not combined',()=>{
 const dishes=[{name:'Beer',photo:''},{name:'Parma'},{name:'Pie',photo:'  '},{name:'Plate',photo:'plate.jpg'},{name:'Plate',photo:'plate-closeup.jpg'}];
 assert.equal(groupDishesByPhoto(dishes).length,dishes.length);
 assert.deepEqual(groupDishesByPhoto([]),[]);
});

test('Antigua shows one card for its patty and fried bites without dropping either sticker',()=>{
 const groups=groupDishesByPhoto([
  {name:'Stewed meat platter',photo:'platter.jpeg',sticker:'platter.png'},
  {name:'Caribbean patty',photo:'patty-bites.jpeg',sticker:'patty.png'},
  {name:'Fried bites',photo:'patty-bites.jpeg',sticker:'bites.png'},
 ]);
 assert.equal(groups.length,2);
 assert.deepEqual(groups[1].dishes.map(d=>d.sticker),['patty.png','bites.png']);
});
