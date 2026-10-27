import test from 'node:test';
import assert from 'node:assert/strict';
import {findMapEncounter} from '../lib/map-encounter.ts';
import {spawnCouple} from '../lib/couple-motion.ts';

const players=spawnCouple({width:1200,height:800});
function location({country='US',label='United States',kind='world',id,visited=true,covers=false,hidden=false,inert=false,panning=false}={}){
  const map={
    closest:selector=>selector==='[inert]'&&inert?{}:null,
    contains:()=>true,
    classList:{contains:()=>panning},
    getAttribute:()=>kind,
  };
  const attributes={'data-country':country,'data-country-label':label,'data-walk-id':id,'data-walk-visited':String(visited)};
  const element={
    closest:selector=>selector==='#couple-characters'?null:selector==='[data-walk-map]'?(covers?null:map):selector==='[data-country]'?element:selector==='[aria-hidden="true"]'&&hidden?{}:null,
    getAttribute:name=>attributes[name]||null,
  };
  return element;
}
function hits(t,resolve){
  const previous=globalThis.document;
  globalThis.document={elementsFromPoint:resolve};
  t.after(()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous});
}

test('either player can encounter a country at their feet, ignoring their own overlay',t=>{
  const land=location(),character={closest:selector=>selector==='#couple-characters'?{}:null};
  let active=players[0];
  hits(t,(x,y)=>x===active.x&&y===active.y-4?[character,land]:[]);
  for(const player of players){
    active=player;
    const encounter=findMapEncounter(players,null);
    assert.equal(encounter?.country,'US');
    assert.equal(encounter?.character,player.character);
  }
});

test('the local map uses the restaurant name and keeps same-country stops distinct',t=>{
  let pin=location({kind:'local',country:'AL',label:'Mermeta Restaurant',id:'first'});
  hits(t,()=>[pin]);
  const first=findMapEncounter([players[0]],null);
  assert.equal(first.label,'Mermeta Restaurant');
  assert.equal(first.country,'AL');
  pin=location({kind:'local',country:'AL',label:'Another restaurant',id:'second'});
  assert.notEqual(findMapEncounter([players[0]],first).id,first.id);
});

test('unvisited places on either map, ocean, hidden locations and maps under dialogs do not trigger visits',t=>{
  let stack=[];
  hits(t,()=>stack);
  const land=location();
  for(const next of [[],[location({visited:false})],[location({kind:'local',visited:false})],[location({covers:true}),land],[location({hidden:true})],[location({inert:true})],[location({panning:true})]]){
    stack=next;
    assert.equal(findMapEncounter(players,null),null);
  }
});

test('map movement is resolved again even when the characters are idle',t=>{
  let stack=[location()];
  hits(t,()=>stack);
  const first=findMapEncounter(players,null);
  stack=[];
  assert.equal(findMapEncounter(players,first),null);
  stack=[location({country:'CA',label:'Canada'})];
  assert.equal(findMapEncounter(players,first).country,'CA');
});

test('walking takes priority over an idle partner and simultaneous walking stays stable',t=>{
  hits(t,x=>[location(x<600?{country:'CA',label:'Canada'}:{country:'US',label:'United States'})]);
  const first=findMapEncounter(players,null);
  const second=findMapEncounter([players[0],{...players[1],moving:true}],first);
  assert.equal(second.character,'boyfriend');
  assert.equal(second.country,'US');
  assert.equal(findMapEncounter(players.map(player=>({...player,moving:true})),second).character,'boyfriend');
});

test('a held character cannot visit until dropped, while the partner still can',t=>{
  hits(t,()=>[location()]);
  const held={...players[0],dragging:true};
  assert.equal(findMapEncounter([held],null),null);
  assert.equal(findMapEncounter([held,players[1]],null).character,'boyfriend');
  assert.equal(findMapEncounter([{...held,dragging:false}],null).character,'sreya');
});
