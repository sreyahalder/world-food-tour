'use client';
import {useEffect,useRef} from 'react';
import {loadCoupleSprites,prepareCoupleFrames} from '../lib/couple-renderer';

export default function UnvisitedCountry() {
 const canvas=useRef<HTMLCanvasElement>(null);

 useEffect(()=>{
  let disposed=false;
  void loadCoupleSprites().then(({image,manifest})=>{
   const context=canvas.current?.getContext('2d');
   if(disposed||!context)return;
   const frames=prepareCoupleFrames(image,manifest);
   context.clearRect(0,0,104,64);
   context.imageSmoothingEnabled=false;
   ['sreya','boyfriend'].forEach((character,index)=>{
    const frame=frames.get(`${character}/idle/down/blink`);
    if(frame)context.drawImage(frame,index*56,0);
   });
  }).catch(()=>{});
  return()=>{disposed=true};
 },[]);

 return <section className="country-unvisited" aria-label="Not visited yet">
  <canvas ref={canvas} className="country-unvisited-avatars" width={104} height={64} role="img" aria-label="Our avatars in gray, with their eyes closed"/>
  <p>We haven't visited this country yet!</p>
 </section>;
}
