'use client';
import {useEffect,useRef} from 'react';
import CountrySheet from './CountrySheet';
import {loadCoupleSprites,prepareCoupleFrames} from '../lib/couple-renderer';
import passportAssets from '../public/assets/passport/passport-assets-v1.json';

function QuestArtwork(){
 const canvas=useRef<HTMLCanvasElement>(null);

 useEffect(()=>{
  let disposed=false;
  const passport=new Image();
  passport.src=passportAssets.icon.image;
  const loadPassport=passport.decode().then(()=>passport).catch(()=>null);
  void Promise.all([loadCoupleSprites(),loadPassport]).then(([{image,manifest},book])=>{
   const context=canvas.current?.getContext('2d');
   if(disposed||!context)return;
   const frames=prepareCoupleFrames(image,manifest);
   context.clearRect(0,0,248,84);
   context.imageSmoothingEnabled=false;
   // Every shape lands on a whole game pixel, then displays at 2x.
   context.fillStyle='#b19466';
   context.fillRect(24,77,75,2);
   context.fillRect(178,77,46,2);
   context.fillStyle='#d3bd91';
   context.fillRect(30,79,63,2);
   context.fillRect(183,79,36,2);
   ['sreya','boyfriend'].forEach((character,index)=>{
    const frame=frames.get(`${character}/idle/down/rest`);
    if(frame)context.drawImage(frame,14+index*44,16);
   });
   context.fillStyle='#b19466';
   for(const x of [116,130,144])context.fillRect(x,54,4,4);
   if(book){
    const frame=passportAssets.icon.frames[0];
    context.drawImage(book,frame.x,frame.y,frame.width,frame.height,154,-5,96,96);
   }
   context.fillStyle='#b58c3c';
   for(const [x,y] of [[172,17],[231,34]]){
    context.fillRect(x,y-4,2,10);context.fillRect(x-4,y,10,2);
   }
  }).catch(()=>{});
  return()=>{disposed=true};
 },[]);

 return <canvas ref={canvas} className="quest-artwork" width={248} height={84} aria-hidden="true"/>;
}

export default function QuestDialog({onClose}:{onClose:()=>void}){
 return <div className="overlay quest-overlay" onClick={event=>{if(event.target===event.currentTarget)onClose()}}>
  <CountrySheet>
   <section className="quest-panel" role="dialog" aria-modal="true" aria-labelledby="quest-title" aria-describedby="quest-objective">
    <button type="button" className="quest-close" aria-label="Close quest" onClick={onClose}>
     <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true"><path d="M2 2h3v3h2v2h2V5h2V2h3v3h-3v2H9v2h2v2h3v3h-3v-3H9V9H7v2H5v3H2v-3h3V9h2V7H5V5H2Z"/></svg>
    </button>
    <QuestArtwork/>
    <h1 id="quest-title">Welcome to Alphabet City</h1>
    <p id="quest-objective">Your quest is to visit every country and collect all the dishes to fill your passport</p>
    <div className="quest-controls" aria-label="How to explore">
     <p><span className="quest-key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>Move Sreya</span></p>
     <p><span className="quest-key-group" aria-label="Arrow keys"><kbd aria-hidden="true">↑</kbd><kbd aria-hidden="true">←</kbd><kbd aria-hidden="true">↓</kbd><kbd aria-hidden="true">→</kbd></span><span>Move Anthony</span></p>
     <p className="quest-visit-instruction"><kbd>Enter</kbd><span>Visit locations or collect dish stickers when a prompt appears.</span></p>
    </div>
    <button type="button" className="quest-start" data-dialog-autofocus onClick={onClose}><span className="quest-start-cursor" aria-hidden="true"/>Let’s explore</button>
   </section>
  </CountrySheet>
 </div>;
}
