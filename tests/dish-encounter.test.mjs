import test from 'node:test';
import assert from 'node:assert/strict';
import {findDishEncounter} from '../lib/dish-encounter.ts';
import {spawnCouple} from '../lib/couple-motion.ts';

const players=spawnCouple({width:1200,height:800});
function stickerAt(player,id='dish-one'){
  const panel={};
  const photo={closest:selector=>selector==='.country-panel'?panel:null,contains:()=>false};
  const surface={contains:element=>element===photo};
  const state={blocked:false,hidden:false,rect:{left:player.x-32,right:player.x+32,top:player.y-36,bottom:player.y+28,width:64,height:64}};
  const sticker={
    dataset:{collectDish:id,dishName:id,collected:'false'},
    closest:selector=>selector==='[inert],[hidden],[data-opening]'?(state.blocked?{}:null):selector==='.country-panel'?panel:selector==='.media-cover'?surface:null,
    getClientRects:()=>state.hidden?[]:[state.rect],
    getBoundingClientRect:()=>state.rect,
  };
  return {sticker,photo,panel,surface,state};
}
function scene(t,items,hit){
  const previous=globalThis.document;
  globalThis.document={querySelectorAll:()=>items.map(item=>item.sticker),elementsFromPoint:hit};
  t.after(()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous});
}

test('either character can collect a pointer-transparent sticker at their feet',t=>{
  const item=stickerAt(players[0]),character={closest:selector=>selector==='#couple-characters'?{}:null};
  scene(t,[item],()=>[character,item.photo]);
  for(const player of players){
    item.state.rect={...item.state.rect,left:player.x-32,right:player.x+32};
    assert.equal(findDishEncounter([player],null)?.character,player.character);
    assert.equal(findDishEncounter([player],null)?.kind,'dish');
  }
});

test('collected, hidden, opening and inert stickers do not trigger again',t=>{
  const item=stickerAt(players[0]);
  scene(t,[item],()=>[item.photo]);
  item.sticker.dataset.collected='true';
  assert.equal(findDishEncounter(players,null),null);
  item.sticker.dataset.collected='false';
  item.state.hidden=true;
  assert.equal(findDishEncounter(players,null),null);
  item.state.hidden=false;item.state.blocked=true;
  assert.equal(findDishEncounter(players,null),null);
  item.state.blocked=false;item.state.rect.width=0;
  assert.equal(findDishEncounter(players,null),null);
});

test('scrolling or moving away removes a prompt before Enter can collect',t=>{
  const item=stickerAt(players[0]);
  scene(t,[item],()=>[item.photo]);
  const encounter=findDishEncounter([players[0]],null);
  assert.ok(encounter);
  item.state.rect={...item.state.rect,top:100,bottom:164};
  assert.equal(findDishEncounter([players[0]],encounter),null);
});

test('clipped stickers and stickers covered by a modal or toolbar are not collectible',t=>{
  const item=stickerAt(players[0]);
  let top=item.photo;
  scene(t,[item],()=>[top,item.photo]);
  assert.ok(findDishEncounter([players[0]],null));
  top={closest:()=>null,contains:()=>false};
  assert.equal(findDishEncounter([players[0]],null),null);
  top={closest:selector=>selector==='.country-panel'?item.panel:null,contains:()=>false};
  assert.equal(findDishEncounter([players[0]],null),null);
});

test('a visible overhanging sticker can be collected outside the photo bounds',t=>{
  const item=stickerAt(players[0]);
  const parent={closest:selector=>selector==='.country-panel'?item.panel:null,contains:element=>element===item.sticker};
  scene(t,[item],()=>[parent]);
  assert.equal(findDishEncounter([players[0]],null)?.id,'dish-one');
});

test('walking partner wins over idle partner, and two walking players keep a stable prompt',t=>{
  const one=stickerAt(players[0],'one'),two=stickerAt(players[1],'two');
  scene(t,[one,two],x=>[x<600?one.photo:two.photo]);
  const first=findDishEncounter(players,null);
  const second=findDishEncounter([players[0],{...players[1],moving:true}],first);
  assert.equal(second.id,'two');
  assert.equal(second.character,'boyfriend');
  assert.equal(findDishEncounter(players.map(player=>({...player,moving:true})),second).id,'two');
});

test('dragging cannot collect until the character is dropped',t=>{
  const item=stickerAt(players[0]);
  scene(t,[item],()=>[item.photo]);
  assert.equal(findDishEncounter([{...players[0],dragging:true}],null),null);
  assert.ok(findDishEncounter([{...players[0],dragging:false}],null));
});

test('two stickers sharing a photo stay separate pickups',t=>{
  const one=stickerAt(players[0],'one'),two=stickerAt({...players[0],x:players[0].x+64},'two');
  two.sticker.closest=selector=>selector==='.country-panel'?one.panel:selector==='.media-cover'?one.surface:null;
  scene(t,[one,two],()=>[one.photo]);
  assert.equal(findDishEncounter([players[0]],null)?.id,'one');
  one.sticker.dataset.collected='true';
  assert.equal(findDishEncounter([players[0]],null),null);
  assert.equal(findDishEncounter([{...players[0],x:players[0].x+64}],null)?.id,'two');
});
