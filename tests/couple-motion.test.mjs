import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {acceptsMovement,spawnCouple,stepWalker,walkingFrame,idleFrame,spriteFrame,grabWalker,dragWalker,releaseWalker,clampWalker,walkSpeed} from '../lib/couple-motion.ts';

const viewport={width:1200,height:800};

test('WASD and arrows independently move two characters at the same time',()=>{
  const [her,him]=spawnCouple(viewport);
  const pressed=new Set(['KeyW','ArrowRight']);
  const nextHer=stepWalker(her,pressed,.05,viewport);
  const nextHim=stepWalker(him,pressed,.05,viewport);
  assert.ok(nextHer.y<her.y);assert.equal(nextHer.x,her.x);assert.equal(nextHer.facing,'up');
  assert.ok(nextHim.x>him.x);assert.equal(nextHim.y,him.y);assert.equal(nextHim.facing,'right');
  assert.equal(stepWalker(her,new Set(['ArrowLeft']),.05,viewport).x,her.x);
  assert.equal(stepWalker(him,new Set(['KeyA']),.05,viewport).x,him.x);
});

test('diagonals keep normal speed and opposite keys cancel',()=>{
  const [her]=spawnCouple(viewport);
  const diagonal=stepWalker(her,new Set(['KeyD','KeyW']),.05,viewport);
  assert.ok(Math.abs(Math.hypot(diagonal.x-her.x,diagonal.y-her.y)-walkSpeed*.05)<1e-8);
  assert.equal(diagonal.facing,'up');
  const cancelled=stepWalker(her,new Set(['KeyA','KeyD']),.05,viewport);
  assert.equal(cancelled.x,her.x);assert.equal(cancelled.moving,false);
});

test('characters remain visible at all edges and after a resize',()=>{
  let [her]=spawnCouple(viewport);
  for(let i=0;i<1000;i++)her=stepWalker(her,new Set(['KeyA','KeyW']),.05,viewport);
  assert.equal(her.x,40);assert.equal(her.y,116);assert.equal(her.moving,false);
  for(let i=0;i<1000;i++)her=stepWalker(her,new Set(['KeyD','KeyS']),.05,viewport);
  assert.equal(her.x,1160);assert.equal(her.y,792);
  const small=clampWalker(her,{width:320,height:500});
  assert.equal(small.x,280);assert.equal(small.y,492);
});

test('frame rates do not change speed and returning from a hidden tab cannot teleport',()=>{
  const [her]=spawnCouple(viewport);const held=new Set(['KeyW']);
  let a=her,b=her;
  for(let i=0;i<30;i++)a=stepWalker(a,held,1/30,viewport);
  for(let i=0;i<60;i++)b=stepWalker(b,held,1/60,viewport);
  assert.ok(Math.abs(a.y-b.y)<1e-8);
  assert.ok(Math.abs(a.y-(her.y-walkSpeed))<1e-8);
  assert.equal(stepWalker(her,held,600,viewport).y,her.y-walkSpeed*.05);
});

test('walking cycles through both strides, then stops facing the last direction',()=>{
  let [her]=spawnCouple(viewport);const poses=new Set();
  for(let i=0;i<60;i++){her=stepWalker(her,new Set(['KeyD']),1/60,viewport);poses.add(walkingFrame(her))}
  assert.deepEqual(poses,new Set(['step-a','idle','step-b']));
  const stopped=stepWalker(her,new Set(),.05,viewport);
  assert.equal(walkingFrame(stopped),'idle');assert.equal(stopped.facing,'right');
  assert.equal(stopped.x,her.x);assert.ok(stopped.idleTime>0);
});

test('idles use dedicated breathing and blinking frames, with still reduced motion',()=>{
  const poses=new Set(Array.from({length:80},(_,i)=>idleFrame(i*.05)));
  assert.deepEqual(poses,new Set(['rest','breathe','blink']));
  let [her]=spawnCouple(viewport);
  for(const direction of ['down','left','right','up']){
    her={...her,facing:direction,idleTime:3.65};
    assert.equal(spriteFrame(her),`sreya/idle/${direction}/blink`);
    assert.equal(spriteFrame(her,true),`sreya/idle/${direction}/rest`);
  }
});

test('grabbing off-center keeps the same cursor offset and dropping preserves location',()=>{
  const [her]=spawnCouple(viewport),pointer={x:her.x+13,y:her.y-60};
  const grabbed=grabWalker(her,pointer);
  assert.equal(grabbed.walker.x,her.x);assert.equal(grabbed.walker.y,her.y);
  const held=dragWalker(grabbed.walker,{x:pointer.x+120,y:pointer.y-180},grabbed.offset,viewport);
  assert.equal(held.x,her.x+120);assert.equal(held.y,her.y-180);
  const dropped=releaseWalker(held);
  assert.equal(dropped.x,held.x);assert.equal(dropped.y,held.y);assert.equal(dropped.dragging,false);
  assert.equal(spriteFrame(dropped),'sreya/idle/down/rest');
  assert.ok(stepWalker(dropped,new Set(['KeyW']),.05,viewport).y<dropped.y);
});

test('a held character animates dangling and ignores walking while the other can walk',()=>{
  const [her,him]=spawnCouple(viewport);let held=grabWalker(her,{x:her.x,y:her.y-50}).walker;
  const frames=new Set();
  for(let i=0;i<60;i++){
    held=stepWalker(held,new Set(['KeyW','ArrowRight']),1/60,viewport);
    frames.add(spriteFrame(held));
  }
  assert.equal(held.x,her.x);assert.equal(held.y,her.y);assert.equal(held.moving,false);
  assert.deepEqual(frames,new Set(['sreya/drag/hold','sreya/drag/left','sreya/drag/right']));
  assert.equal(spriteFrame(held,true),'sreya/drag/hold');
  assert.ok(stepWalker(him,new Set(['KeyW','ArrowRight']),.05,viewport).x>him.x);
});

test('dragging can reach every screen edge while keeping the character visible',()=>{
  const [her]=spawnCouple(viewport),grabbed=grabWalker(her,{x:her.x,y:her.y});
  const topLeft=dragWalker(grabbed.walker,{x:-1000,y:-1000},grabbed.offset,viewport);
  const bottomRight=dragWalker(grabbed.walker,{x:5000,y:5000},grabbed.offset,viewport);
  assert.equal(topLeft.x,40);assert.equal(topLeft.y,116);
  assert.equal(bottomRight.x,1160);assert.equal(bottomRight.y,792);
  const stopped=releaseWalker(bottomRight);
  assert.equal(dragWalker(stopped,{x:500,y:400},grabbed.offset,viewport),stopped);
});

test('typing, dialogs, input composition, and system shortcuts retain their keys',()=>{
  const event={code:'KeyW',altKey:false,ctrlKey:false,metaKey:false};
  assert.equal(acceptsMovement(event,false,false),true);
  assert.equal(acceptsMovement(event,true,false),false);
  assert.equal(acceptsMovement(event,false,true),false);
  for(const modifier of ['altKey','ctrlKey','metaKey','isComposing'])assert.equal(acceptsMovement({...event,[modifier]:true},false,false),false);
  assert.equal(acceptsMovement({...event,code:'Escape'},false,false),false);
});

test('the saved atlas supplies valid anchored poses for every player and direction',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/assets/sprites/couple-v2.json',import.meta.url)));
  const previous=JSON.parse(readFileSync(new URL('../public/assets/sprites/couple-walk-v1.json',import.meta.url)));
  assert.equal(Object.keys(manifest.frames).length,54);
  for(const person of ['sreya','boyfriend'])for(const direction of ['down','left','right','up'])for(const pose of ['step-a','idle','step-b']){
    const key=`${person}/${direction}/${pose}`;
    assert.deepEqual(manifest.frames[key],previous.frames[key]);
  }
  for(const person of ['sreya','boyfriend']){
    for(const pose of ['left','hold','right'])assert.ok(manifest.frames[`${person}/drag/${pose}`]);
    for(const direction of ['down','left','right','up'])for(const pose of ['rest','breathe','blink'])assert.ok(manifest.frames[`${person}/idle/${direction}/${pose}`]);
  }
  for(const frame of Object.values(manifest.frames)){
    const {source:s,anchor:a}=frame;
    assert.ok(s.x>=0&&s.y>=0&&s.width>0&&s.height>0);
    assert.ok(s.x+s.width<=manifest.size.width&&s.y+s.height<=manifest.size.height);
    assert.ok(a.x>=0&&a.x<=s.width&&a.y>=0&&a.y<=s.height);
    const scale=frame.scale??.2;
    assert.ok(24-Math.round(a.x*scale)>=0);
    assert.ok(24-Math.round(a.x*scale)+Math.round(s.width*scale)<=48);
    assert.ok(60-Math.round(a.y*scale)>=0);
    assert.ok(60-Math.round(a.y*scale)+Math.round(s.height*scale)<=64);
  }
});
