'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {KeyboardEvent,PointerEvent} from 'react';
import {Minus,Plus,RotateCcw} from 'lucide-react';
import {Country} from '../lib/types';
import {constrainView,fitViewport,INITIAL_VIEW,MAP_HEIGHT,MAP_WIDTH,MAX_ZOOM,MIN_ZOOM,zoomView} from '../lib/map-view';
import type {MapView,Point} from '../lib/map-view';

type MapPath={code:string;name:string;d:string};
const midpoint=(a:Point,b:Point):Point=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);

export default function WorldMap({countries,visited,onSelect,next}:{countries:Country[];visited:Set<string>;onSelect:(c:string)=>void;next?:string}){
  const [paths,setPaths]=useState<MapPath[]>([]);
  const [hover,setHover]=useState('');
  const [error,setError]=useState(false);
  const [view,setView]=useState<MapView>(INITIAL_VIEW);
  const [viewport,setViewport]=useState(()=>fitViewport(MAP_WIDTH,MAP_HEIGHT));
  const [dragging,setDragging]=useState(false);
  const svgRef=useRef<SVGSVGElement>(null);
  const frameRef=useRef<HTMLDivElement>(null);
  const viewRef=useRef(view),viewportRef=useRef(viewport);
  const pointers=useRef(new Map<number,Point>());
  const gesture=useRef({origin:{x:0,y:0},moved:false,code:''});
  const codes=new Set(countries.map(c=>c.code));

  const commit=useCallback((value:MapView)=>{
    const bounded=constrainView(value,viewportRef.current);
    viewRef.current=bounded;
    setView(bounded);
  },[]);

  const toMapPoint=useCallback((client:Point):Point=>{
    const svg=svgRef.current;
    const matrix=svg?.getScreenCTM();
    if(!svg||!matrix)return {x:MAP_WIDTH/2,y:MAP_HEIGHT/2};
    const point=svg.createSVGPoint();
    point.x=client.x;point.y=client.y;
    return point.matrixTransform(matrix.inverse());
  },[]);

  useEffect(()=>{
    const controller=new AbortController();
    fetch('/world-paths.json',{signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error('Map unavailable');return r.json() as Promise<MapPath[]>})
      .then(setPaths).catch(()=>{if(!controller.signal.aborted)setError(true)});
    return()=>controller.abort();
  },[]);

  useEffect(()=>{
    const frame=frameRef.current;
    if(!frame)return;
    const observer=new ResizeObserver(([entry])=>{
      const {width,height}=entry.contentRect;
      if(!width||!height)return;
      const nextViewport=fitViewport(width,height);
      viewportRef.current=nextViewport;
      setViewport(nextViewport);
      commit(viewRef.current);
    });
    observer.observe(frame);
    return()=>observer.disconnect();
  },[commit]);

  useEffect(()=>{
    const svg=svgRef.current;
    if(!svg)return;
    const wheel=(event:WheelEvent)=>{
      event.preventDefault();
      const unit=event.deltaMode===1?16:event.deltaMode===2?svg.clientHeight:1;
      const factor=Math.exp(-Math.max(-100,Math.min(100,event.deltaY*unit))*.003);
      commit(zoomView(viewRef.current,factor,toMapPoint({x:event.clientX,y:event.clientY}),viewportRef.current));
    };
    svg.addEventListener('wheel',wheel,{passive:false});
    return()=>svg.removeEventListener('wheel',wheel);
  },[commit,toMapPoint]);

  function zoom(factor:number){
    commit(zoomView(viewRef.current,factor,{x:MAP_WIDTH/2,y:MAP_HEIGHT/2},viewportRef.current));
  }

  function pointerDown(event:PointerEvent<SVGSVGElement>){
    if(event.button!==0)return;
    const point={x:event.clientX,y:event.clientY};
    if(!pointers.current.size){
      const code=(event.target as Element).closest('[data-country]')?.getAttribute('data-country')||'';
      gesture.current={origin:point,moved:false,code};
    }else{
      gesture.current.moved=true;
      setDragging(true);
      setHover('');
    }
    pointers.current.set(event.pointerId,point);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event:PointerEvent<SVGSVGElement>){
    const previous=pointers.current.get(event.pointerId);
    if(!previous)return;
    const point={x:event.clientX,y:event.clientY};
    const before=[...pointers.current.values()];
    pointers.current.set(event.pointerId,point);
    if(pointers.current.size>=2){
      const after=[...pointers.current.values()];
      const oldDistance=distance(before[0],before[1]);
      if(oldDistance>0)commit(zoomView(viewRef.current,distance(after[0],after[1])/oldDistance,toMapPoint(midpoint(before[0],before[1])),viewportRef.current,toMapPoint(midpoint(after[0],after[1]))));
    }else{
      if(!gesture.current.moved&&distance(gesture.current.origin,point)<5)return;
      gesture.current.moved=true;
      const from=toMapPoint(previous),to=toMapPoint(point);
      commit({...viewRef.current,x:viewRef.current.x+to.x-from.x,y:viewRef.current.y+to.y-from.y});
    }
    setDragging(true);
    setHover('');
  }

  function pointerEnd(event:PointerEvent<SVGSVGElement>,cancel=false){
    if(!pointers.current.has(event.pointerId))return;
    const select=!cancel&&pointers.current.size===1&&!gesture.current.moved&&distance(gesture.current.origin,{x:event.clientX,y:event.clientY})<5;
    pointers.current.delete(event.pointerId);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(!pointers.current.size)setDragging(false);
    if(select&&codes.has(gesture.current.code))onSelect(gesture.current.code);
  }

  function keyboard(event:KeyboardEvent<SVGSVGElement>){
    if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.4)}
    else if(event.key==='-'){event.preventDefault();zoom(1/1.4)}
    else if(event.key==='Home'||event.key==='0'){event.preventDefault();commit(INITIAL_VIEW)}
    else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();
      const step=viewportRef.current.width*.08;
      commit({...viewRef.current,x:viewRef.current.x+(event.key==='ArrowLeft'?step:event.key==='ArrowRight'?-step:0),y:viewRef.current.y+(event.key==='ArrowUp'?step:event.key==='ArrowDown'?-step:0)});
    }
  }

  function countryKey(event:KeyboardEvent<SVGElement>,code:string){
    if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();onSelect(code)}
  }

  return <div ref={frameRef} className={`world-svg${dragging?' is-dragging':''}`}>
    <svg ref={svgRef} viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`} aria-label="World food tour map. Drag to pan, scroll or pinch to zoom. Use plus and minus to zoom, arrow keys to pan, and Home to reset." role="group" tabIndex={0} onKeyDown={keyboard} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={e=>pointerEnd(e)} onPointerCancel={e=>pointerEnd(e,true)} onLostPointerCapture={e=>pointerEnd(e,true)} onPointerLeave={()=>setHover('')}>
      <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
        {paths.map((p,i)=><path key={`${p.code}-${i}`} d={p.d} fill={visited.has(p.code)?'#e2bc6f':p.code===next?'#c8db79':'#6f9c4c'} stroke="#284b38" strokeWidth=".65" vectorEffect="non-scaling-stroke" role={codes.has(p.code)?'button':undefined} tabIndex={codes.has(p.code)?0:undefined} data-country={codes.has(p.code)?p.code:undefined} aria-label={`${p.name}${codes.has(p.code)?`: ${visited.has(p.code)?'visited':'to explore'}`:''}`} className={codes.has(p.code)?'map-country':''} onPointerEnter={()=>{if(!pointers.current.size)setHover(p.name)}} onFocus={()=>setHover(p.name)} onBlur={()=>setHover('')} onClick={e=>{if(e.detail===0&&codes.has(p.code))onSelect(p.code)}} onKeyDown={e=>{if(codes.has(p.code))countryKey(e,p.code)}}><title>{p.name}{codes.has(p.code)?` · ${visited.has(p.code)?'Visited':'To explore'}`:''}</title></path>)}
        {countries.filter(c=>!paths.some(p=>p.code===c.code&&p.d.length>0)).map(c=><circle key={c.code} cx={(c.lng+180)*2.65} cy={(85-c.lat)*3.05} r={Math.max(1,2.4/Math.sqrt(view.scale))} fill={visited.has(c.code)?'#e2bc6f':c.code===next?'#c8db79':'#6f9c4c'} stroke="#284b38" strokeWidth=".65" vectorEffect="non-scaling-stroke" className="map-country" role="button" tabIndex={0} data-country={c.code} aria-label={c.name} onPointerEnter={()=>{if(!pointers.current.size)setHover(c.name)}} onFocus={()=>setHover(c.name)} onBlur={()=>setHover('')} onClick={e=>{if(e.detail===0)onSelect(c.code)}} onKeyDown={e=>countryKey(e,c.code)}><title>{c.name}</title></circle>)}
      </g>
    </svg>
    <div className="world-zoom" role="group" aria-label="Map zoom controls">
      <button aria-label="Zoom in" title="Zoom in" disabled={view.scale>=MAX_ZOOM} onClick={()=>zoom(1.4)}><Plus size={18}/></button>
      <button aria-label="Zoom out" title="Zoom out" disabled={view.scale<=MIN_ZOOM} onClick={()=>zoom(1/1.4)}><Minus size={18}/></button>
      <button aria-label="Reset map view" title="Reset map view" onClick={()=>commit(INITIAL_VIEW)}><RotateCcw size={16}/></button>
    </div>
    {(error||hover)&&<div className="world-hint" role="status">{error?'Map unavailable. Use the country list.':hover}</div>}
  </div>;
}
