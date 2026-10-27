'use client';
import {useState,type CSSProperties} from 'react';
import DishSticker from './DishSticker';
import {dishesPerPage,passportPageColumns,passportPageRows,passportSpreadCount,type CollectedDish} from '../lib/passport-collection';
import passportAssets from '../public/assets/passport/passport-assets-v1.json';

export default function PassportDialog({dishes,onClose}:{dishes:CollectedDish[];onClose:()=>void}){
  const spreads=passportSpreadCount(dishes.length);
  const [selectedSpread,setSelectedSpread]=useState(spreads-1);
  const spread=Math.min(selectedSpread,spreads-1);
  return <div className="passport-overlay" onClick={event=>{if(event.target===event.currentTarget)onClose()}}>
    <section id="food-passport" className="passport-dialog" role="dialog" aria-modal="true" aria-labelledby="passport-title">
      <header className="passport-toolbar">
        <div className="passport-heading"><h2 id="passport-title">Your passport</h2><span>{dishes.length} {dishes.length===1?'dish':'dishes'} collected</span></div>
        <button type="button" className="passport-close" aria-label="Close passport" data-dialog-autofocus onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true"><path d="M2 2h3v3h2v2h2V5h2V2h3v3h-3v2H9v2h2v2h3v3h-3v-3H9V9H7v2H5v3H2v-3h3V9h2V7H5V5H2Z"/></svg>
        </button>
      </header>
      <div className="passport-book" role="group" aria-label="Collected dish stickers">
        {(['left','right'] as const).map((side,index)=><div className={`passport-page passport-page-${side}`} key={side}>
          <img src={passportAssets.pages[side].image} width={passportAssets.pages[side].width} height={passportAssets.pages[side].height} alt="" draggable={false}/>
          <ul className="passport-stickers" style={{'--passport-columns':passportPageColumns,'--passport-rows':passportPageRows} as CSSProperties}>
            {dishes.slice((spread*2+index)*dishesPerPage,(spread*2+index+1)*dishesPerPage).map(dish=><li key={dish.id}>
              <figure className="passport-dish"><DishSticker name={dish.name} src={dish.sticker}/><figcaption>{dish.name}</figcaption></figure>
            </li>)}
          </ul>
          {!dishes.length&&index===0&&<p className="passport-empty">Your next discovery belongs here.</p>}
          <span className="passport-page-number" aria-hidden="true">{spread*2+index+1}</span>
        </div>)}
      </div>
      {spreads>1&&<nav className="passport-pagination" aria-label="Passport pages">
        <button type="button" disabled={spread===0} onClick={()=>setSelectedSpread(spread-1)} aria-label="Previous passport pages">← <span>Previous</span></button>
        <span role="status" aria-live="polite">Pages {spread*2+1}–{spread*2+2} of {spreads*2}</span>
        <button type="button" disabled={spread===spreads-1} onClick={()=>setSelectedSpread(spread+1)} aria-label="Next passport pages"><span>Next</span> →</button>
      </nav>}
    </section>
  </div>;
}
