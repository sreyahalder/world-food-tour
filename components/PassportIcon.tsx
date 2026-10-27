'use client';
import {useEffect,useRef} from 'react';
import {preload} from 'react-dom';
import passportAssets from '../public/assets/passport/passport-assets-v1.json';

const {icon}=passportAssets;

function preloadPages(){
  preload(passportAssets.pages.left.image,{as:'image'});
  preload(passportAssets.pages.right.image,{as:'image'});
}

export default function PassportIcon({onOpen,count=0}:{onOpen:()=>void;count?:number}){
  const button=useRef<HTMLButtonElement>(null);
  const sprite=useRef<HTMLSpanElement>(null);

  useEffect(()=>{
    const target=button.current,image=sprite.current;
    if(!target||!image)return;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,timer=0,hovered=false,focused=false;
    const draw=(index:number)=>{
      frame=index;
      const source=icon.frames[index];
      image.style.backgroundPosition=`${source.x/(icon.width-source.width)*100}% ${source.y/(icon.height-source.height)*100}%`;
    };
    const update=()=>{
      window.clearTimeout(timer);
      if(document.hidden)return;
      const open=hovered||focused;
      if(motion.matches){
        draw(open?icon.animations.reducedMotion.hover:icon.animations.reducedMotion.idle);
        return;
      }
      if(open)draw(frame<4?frame+1:frame===4?5:4);
      else draw(Math.max(0,Math.min(frame,4)-1));
      if(open||frame>0)timer=window.setTimeout(update,open?(frame>=4?360:55):110);
    };
    const enter=(event:PointerEvent)=>{if(event.pointerType!=='touch'){hovered=true;update()}};
    const leave=()=>{hovered=false;update()};
    const focus=()=>{focused=target.matches(':focus-visible');update()};
    const blur=()=>{focused=false;update()};
    const visibility=()=>{
      if(document.hidden){window.clearTimeout(timer);hovered=false;focused=false;draw(0)}
      else{hovered=target.matches(':hover');focused=target.matches(':focus-visible');update()}
    };
    target.addEventListener('pointerenter',enter);
    target.addEventListener('pointerleave',leave);
    target.addEventListener('focus',focus);
    target.addEventListener('blur',blur);
    motion.addEventListener('change',update);
    document.addEventListener('visibilitychange',visibility);
    return()=>{
      window.clearTimeout(timer);
      target.removeEventListener('pointerenter',enter);
      target.removeEventListener('pointerleave',leave);
      target.removeEventListener('focus',focus);
      target.removeEventListener('blur',blur);
      motion.removeEventListener('change',update);
      document.removeEventListener('visibilitychange',visibility);
    };
  },[]);

  return <button ref={button} id="passport-launcher" type="button" className="passport-icon-button" aria-label={`Open passport, ${count} collected ${count===1?'dish':'dishes'}`} aria-haspopup="dialog" title="Passport" onPointerEnter={preloadPages} onPointerDown={preloadPages} onFocus={preloadPages} onClick={onOpen}>
    <span ref={sprite} className="passport-icon-sprite" aria-hidden="true" style={{backgroundImage:`url(${icon.image})`,backgroundSize:`${icon.columns*100}% ${icon.rows*100}%`}}/>
    {count>0&&<span key={count} className="passport-icon-count" aria-hidden="true">{count}</span>}
  </button>;
}
