'use client';
import {useEffect,useRef,useState} from 'react';
import {acceptsMovement,clampWalker,dragWalker,grabWalker,releaseWalker,spawnCouple,stepWalker,type DragPoint,type Walker} from '../lib/couple-motion';
import {drawCouple,loadCoupleSprites,prepareCoupleFrames,type CoupleFrames} from '../lib/couple-renderer';
import {findMapEncounter,type MapEncounter} from '../lib/map-encounter';
import {findDishEncounter,type DishEncounter} from '../lib/dish-encounter';

type Encounter=(MapEncounter&{kind:'country'})|DishEncounter;

function isTyping(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="slider"],[role="spinbutton"]');
}

export default function CoupleWalkers({suspended=false,mapActive=false,dishesActive=false,onVisit,onCollect}:{suspended?:boolean;mapActive?:boolean;dishesActive?:boolean;onVisit?:(country:string)=>void;onCollect?:(id:string)=>void}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const grabTargets=useRef<(HTMLButtonElement|null)[]>([]);
  const walkers=useRef<Walker[]|null>(null);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [encounter,setEncounter]=useState<Encounter|null>(null);
  const encounterRef=useRef<Encounter|null>(null);
  const prompt=useRef<HTMLButtonElement>(null);
  const interact=useRef<()=>boolean>(()=>false);
  const options=useRef({mapActive,dishesActive,onVisit,onCollect});
  options.current={mapActive,dishesActive,onVisit,onCollect};

  useEffect(()=>{
    const surface=canvas.current;
    const context=surface?.getContext('2d');
    if(!surface||!context) return;
    let disposed=false,animation=0,previous=0,lastEncounterCheck=0;
    let frames:CoupleFrames|undefined;
    const pressed=new Set<string>();
    const targets=grabTargets.current.filter((target):target is HTMLButtonElement=>!!target);
    const drags=new Map<number,{index:number;offset:DragPoint;target:HTMLButtonElement}>();
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let viewport={width:window.innerWidth,height:window.innerHeight};
    const updateEncounter=()=>{
      let next:Encounter|null=null;
      if(!suspended&&!document.hidden&&!isTyping(document.activeElement)&&walkers.current){
        if(options.current.dishesActive)next=findDishEncounter(walkers.current,encounterRef.current?.kind==='dish'?encounterRef.current:null);
        else if(options.current.mapActive){
          const location=findMapEncounter(walkers.current,encounterRef.current?.kind==='country'?encounterRef.current:null);
          if(location)next={...location,kind:'country'};
        }
      }
      const current=encounterRef.current;
      encounterRef.current=next;
      if(!disposed&&(next?.kind!==current?.kind||next?.id!==current?.id||next?.character!==current?.character||next?.label!==current?.label))setEncounter(next);
      return next;
    };
    interact.current=()=>{
      const current=encounterRef.current,next=updateEncounter();
      if(!next||!current||next.kind!==current.kind||next.id!==current.id||next.character!==current.character)return false;
      const activate=next.kind==='dish'?options.current.onCollect:options.current.onVisit;
      if(!activate)return false;
      pressed.clear();
      encounterRef.current=null;setEncounter(null);
      activate(next.kind==='dish'?next.id:next.country);
      return true;
    };
    const paint=()=>{
      if(!frames||!walkers.current)return;
      drawCouple(context,frames,walkers.current,motion.matches||suspended);
      const order=[...walkers.current].sort((a,b)=>Number(a.dragging)-Number(b.dragging)||a.y-b.y);
      walkers.current.forEach((walker,index)=>{
        const target=targets[index];if(!target)return;
        target.style.transform=`translate(${Math.round(walker.x/2)*2-40}px,${Math.round(walker.y/2)*2-112}px)`;
        target.style.zIndex=String(order.indexOf(walker));
        target.dataset.dragging=String(walker.dragging);
      });
      const bubble=prompt.current,visitor=walkers.current.find(walker=>walker.character===encounterRef.current?.character);
      if(bubble&&visitor){
        const width=bubble.offsetWidth,height=bubble.offsetHeight;
        const left=Math.max(10,Math.min(viewport.width-width-10,visitor.x-width/2));
        const above=visitor.y-124-height;
        const top=above>=10?above:Math.min(viewport.height-height-10,visitor.y+14);
        bubble.style.transform=`translate(${Math.round(left)}px,${Math.round(top)}px)`;
        bubble.style.setProperty('--visit-pointer-x',`${Math.max(16,Math.min(width-24,visitor.x-left-6))}px`);
        bubble.dataset.below=String(above<10);
        bubble.style.visibility='visible';
      }
    };
    const release=(pointerId:number)=>{
      const drag=drags.get(pointerId);if(!drag)return;
      drags.delete(pointerId);
      if(walkers.current)walkers.current=walkers.current.map((walker,index)=>index===drag.index?releaseWalker(walker):walker);
      if(drag.target.hasPointerCapture(pointerId))drag.target.releasePointerCapture(pointerId);
      paint();
    };
    const clear=()=>{
      pressed.clear();
      for(const pointerId of [...drags.keys()])release(pointerId);
      if(walkers.current)walkers.current=walkers.current.map(w=>({...w,moving:false,distance:0}));
      paint();
    };
    const resize=()=>{
      clear();
      viewport={width:window.visualViewport?.width||window.innerWidth,height:window.visualViewport?.height||window.innerHeight};
      surface.width=Math.ceil(viewport.width/2);surface.height=Math.ceil(viewport.height/2);
      surface.style.width=`${surface.width*2}px`;surface.style.height=`${surface.height*2}px`;
      walkers.current=walkers.current ? walkers.current.map(w=>clampWalker(w,viewport)) : spawnCouple(viewport);
      paint();
    };
    const tick=(now:number)=>{
      if(disposed||document.hidden||suspended)return;
      const dt=previous ? (now-previous)/1000 : 0;previous=now;
      if(walkers.current)walkers.current=walkers.current.map(w=>stepWalker(w,pressed,dt,viewport));
      // Also scan while idle: scrolling or moving the map changes the location
      // under a character without changing that character's screen position.
      if(now-lastEncounterCheck>=50){updateEncounter();lastEncounterCheck=now}
      paint();animation=requestAnimationFrame(tick);
    };
    const start=()=>{
      cancelAnimationFrame(animation);previous=0;
      if(!disposed&&!document.hidden&&!suspended&&frames)animation=requestAnimationFrame(tick);
      else paint();
    };
    const visibility=()=>{clear();start()};
    const keyDown=(event:KeyboardEvent)=>{
      for(const target of targets)delete target.dataset.pointerFocus;
      if(event.key==='Enter'&&!event.repeat&&!event.isComposing&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!isTyping(event.target)){
        const control=event.target instanceof Element?event.target.closest('button,a[href],[role="button"],[role="link"],summary'):null;
        if((!control||control.matches('.couple-grab-target,.map-visit-prompt'))&&interact.current()){
          event.preventDefault();event.stopPropagation();return;
        }
      }
      if(!frames||!acceptsMovement(event,isTyping(event.target),suspended))return;
      // Walking hands keyboard focus to that player. Enter can then visit even
      // after clicking a map tab, without stealing Enter from other controls.
      targets[event.code.startsWith('Arrow')?1:0]?.focus({preventScroll:true});
      event.preventDefault();event.stopPropagation();pressed.add(event.code);
    };
    const keyUp=(event:KeyboardEvent)=>{pressed.delete(event.code)};
    const focus=(event:FocusEvent)=>{if(isTyping(event.target))clear()};
    const pointerDown=(event:PointerEvent)=>{
      if(!frames||!walkers.current||suspended||event.button!==0)return;
      const target=event.currentTarget as HTMLButtonElement,index=Number(target.dataset.player);
      if([...drags.values()].some(drag=>drag.index===index))return;
      event.preventDefault();event.stopPropagation();
      const grabbed=grabWalker(walkers.current[index],{x:event.clientX,y:event.clientY});
      walkers.current=walkers.current.map((walker,i)=>i===index?grabbed.walker:walker);
      drags.set(event.pointerId,{index,offset:grabbed.offset,target});
      target.dataset.pointerFocus='true';
      target.setPointerCapture(event.pointerId);target.focus({preventScroll:true});paint();
    };
    const pointerMove=(event:PointerEvent)=>{
      const drag=drags.get(event.pointerId);if(!drag||!walkers.current)return;
      event.preventDefault();event.stopPropagation();
      walkers.current=walkers.current.map((walker,index)=>index===drag.index?dragWalker(walker,{x:event.clientX,y:event.clientY},drag.offset,viewport):walker);
      paint();
    };
    const pointerEnd=(event:PointerEvent)=>{
      if(!drags.has(event.pointerId))return;
      if(event.type==='pointerup')pointerMove(event);
      event.preventDefault();event.stopPropagation();release(event.pointerId);
    };
    resize();clear();
    void loadCoupleSprites().then(({image,manifest})=>{
      if(disposed)return;
      frames=prepareCoupleFrames(image,manifest);setStatus('ready');paint();start();
    }).catch(()=>{if(!disposed)setStatus('error')});
    window.addEventListener('keydown',keyDown,true);
    window.addEventListener('keyup',keyUp,true);
    window.addEventListener('blur',clear);
    window.addEventListener('focusin',focus);
    window.addEventListener('resize',resize);
    window.visualViewport?.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',visibility);
    motion.addEventListener('change',paint);
    for(const target of targets){
      target.addEventListener('pointerdown',pointerDown);
      target.addEventListener('pointermove',pointerMove);
      target.addEventListener('pointerup',pointerEnd);
      target.addEventListener('pointercancel',pointerEnd);
      target.addEventListener('lostpointercapture',pointerEnd);
    }
    return()=>{
      disposed=true;cancelAnimationFrame(animation);clear();
      interact.current=()=>false;encounterRef.current=null;setEncounter(null);
      for(const target of targets){
        target.removeEventListener('pointerdown',pointerDown);
        target.removeEventListener('pointermove',pointerMove);
        target.removeEventListener('pointerup',pointerEnd);
        target.removeEventListener('pointercancel',pointerEnd);
        target.removeEventListener('lostpointercapture',pointerEnd);
      }
      window.removeEventListener('keydown',keyDown,true);
      window.removeEventListener('keyup',keyUp,true);
      window.removeEventListener('blur',clear);
      window.removeEventListener('focusin',focus);
      window.removeEventListener('resize',resize);
      window.visualViewport?.removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange',visibility);
      motion.removeEventListener('change',paint);
    };
  },[suspended]);

  return <div id="couple-characters" className="couple-walkers" hidden={suspended} role="group" aria-label="Playable characters">
    <canvas className="couple-stage" ref={canvas} aria-hidden="true" hidden={status!=='ready'}/>
    <div className="couple-grab-layer" hidden={status!=='ready'}>
      {['Sreya','Boyfriend'].map((name,index)=><button key={name} ref={target=>{grabTargets.current[index]=target}} type="button" className="couple-grab-target" data-player={index} aria-label={`Move ${name}. Drag or use ${index?'arrow keys':'W A S D'}.`} aria-keyshortcuts={index?'ArrowUp ArrowLeft ArrowDown ArrowRight':'W A S D'} title={`Drag to move, ${index?'arrow keys':'WASD'} to walk`} onClick={event=>{event.preventDefault();event.stopPropagation()}}/>)}
    </div>
    {encounter&&!suspended&&(encounter.kind==='dish'?dishesActive:mapActive)&&<button ref={prompt} type="button" className="map-visit-prompt" aria-label={`${encounter.kind==='dish'?'Collect':'Visit'} ${encounter.label}`} data-encounter-kind={encounter.kind} aria-keyshortcuts="Enter" onClick={()=>interact.current()}>
      <span className="map-visit-copy" role="status" aria-live="polite" aria-atomic="true"><strong>{encounter.label}</strong><span>Press <kbd>Enter</kbd> to {encounter.kind==='dish'?'collect':'visit'}</span></span>
      <span className="map-visit-cursor" aria-hidden="true">▶</span>
    </button>}
  </div>;
}
