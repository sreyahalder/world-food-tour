'use client';
import {useLayoutEffect,useRef,type ReactNode} from 'react';
import {paperOutline} from '../lib/paper-shape';
import {loadPaperTiles,paintPaper,type PaperTiles} from '../lib/paper-tiles';

export default function CountrySheet({children}:{children:ReactNode}) {
 const sheet=useRef<HTMLDivElement>(null);
 const rest=useRef<HTMLDivElement>(null);
 const stage=useRef<HTMLDivElement>(null);
 const texture=useRef<HTMLCanvasElement>(null);

 useLayoutEffect(()=>{
  const root=sheet.current!,page=rest.current!,canvas=stage.current!,paper=texture.current!;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let closed=false,settled=false;
  let stop:(()=>void)|undefined;
  let safetyTimer:number|undefined;
  let tiles:PaperTiles|undefined;
  const reveal=()=>{
   settled=true;
   window.clearTimeout(safetyTimer);
   root.removeAttribute('data-opening');
   page.style.opacity='1';
   canvas.style.opacity='0';
  };
  const finish=()=>{stop?.();reveal()};
  const fit=()=>{
   const {width,height}=root.getBoundingClientRect();
   const points=paperOutline(width,height);
   root.style.setProperty('--paper-edge',`polygon(${points.map(([x,y])=>`${x}px ${y}px`).join(',')})`);
   paintPaper(paper,width,height,tiles);
   return {width,height};
  };
  const size=fit();
  // Resize never replays an entrance, and interrupts it safely if still active.
  const observer=new ResizeObserver(()=>{
   const next=fit();
   if(Math.abs(next.width-size.width)>1||Math.abs(next.height-size.height)>1)finish();
  });
  observer.observe(root);
  const motionChanged=()=>{if(reducedMotion.matches)finish()};
  reducedMotion.addEventListener('change',motionChanged);
  const material=loadPaperTiles().then(loaded=>{
   if(closed)return;
   tiles=loaded;fit();
  }).catch(()=>{});
  if(!reducedMotion.matches){
   root.dataset.opening='true';
   page.style.opacity='0';
   canvas.style.opacity='1';
   // Slow downloads must never leave the journal hidden.
   safetyTimer=window.setTimeout(finish,1500);
   Promise.all([import('../lib/paper-motion'),material]).then(([{animatePaper}])=>{
    if(closed||settled)return;
    stop=animatePaper(canvas,page,paper,reveal);
   }).catch(()=>{if(!closed)finish()});
  }else reveal();
  return ()=>{
   closed=true;
   window.clearTimeout(safetyTimer);
   observer.disconnect();
   reducedMotion.removeEventListener('change',motionChanged);
   stop?.();
  };
 },[]);

 return <div className="country-sheet" ref={sheet}>
  <div className="country-paper-rest" ref={rest}>
   <div className="country-paper-surface">
    <canvas className="country-paper-texture" ref={texture} aria-hidden="true"/>
    {children}
   </div>
  </div>
  <div className="paper-uncrumple-stage" ref={stage} aria-hidden="true"/>
 </div>;
}
