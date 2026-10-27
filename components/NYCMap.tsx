'use client';
import {useEffect,useRef,useState} from 'react';
import {nycLatLng} from '../lib/restaurant-location';
import {countryFlag} from '../lib/country-flag';
export type Pin={id:string;name:string;lat:number;lng:number;visited:boolean;country:string;countryName:string;photo?:string;area?:string;address?:string};
export default function NYCMap({pins,selected,onSelect}:{pins:Pin[];selected?:string;onSelect:(id:string)=>void}){
 const container=useRef<HTMLDivElement>(null);const map=useRef<any>(null);const layer=useRef<any>(null);const markers=useRef(new Map<string,any>());const [ready,setReady]=useState(false);const [failed,setFailed]=useState(false);const select=useRef(onSelect);select.current=onSelect;
 useEffect(()=>{let dead=false;const init=()=>{if(dead||!container.current||map.current)return;const L=(window as any).L;if(!L)return;map.current=L.map(container.current,{
   scrollWheelZoom:true,
   touchZoom:true,
   dragging:true,
   doubleClickZoom:true,
   boxZoom:true,
   zoomControl:true,
   zoomSnap:0.25,
   zoomDelta:0.5,
   wheelPxPerZoomLevel:100,
  }).setView([40.747,-73.968],12);let failures=0;L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).on('tileerror',()=>{failures++;if(failures>8)setFailed(true)}).addTo(map.current);layer.current=L.layerGroup().addTo(map.current);setReady(true)};if((window as any).L)init();else{let s=document.querySelector<HTMLScriptElement>('script[data-leaflet]');if(!s){s=document.createElement('script');s.src='/vendor/leaflet.js';s.dataset.leaflet='1';document.head.appendChild(s)}s.addEventListener('load',init);s.addEventListener('error',()=>setFailed(true))}return()=>{dead=true;if(map.current){map.current.remove();map.current=null;setReady(false)}}},[]);
 useEffect(()=>{
  if(!ready||!layer.current)return;
  const L=(window as any).L;
  layer.current.clearLayers();
  markers.current.clear();
  const cleanups:(()=>void)[]=[];
  pins.forEach(p=>{
   const coordinates=nycLatLng(p.lat,p.lng);
   if(!coordinates)return;
   const thumbnail=document.createElement('div');
   thumbnail.className=`map-photo-pin${p.visited?' is-visited':''}`;
   const svgNS='http://www.w3.org/2000/svg';
   const frame=document.createElementNS(svgNS,'svg');
   frame.setAttribute('viewBox','0 0 64 76');
   frame.setAttribute('class','map-photo-pin-frame');
   frame.setAttribute('aria-hidden','true');
   const shell=document.createElementNS(svgNS,'path');
   shell.setAttribute('class','map-photo-pin-shell');
   shell.setAttribute('d','M32 3C16 3 3 16 3 32C3 44 10.5 54.3 21.1 58.5L29.6 71Q32 74.8 34.4 71L42.9 58.5C53.5 54.3 61 44 61 32C61 16 48 3 32 3Z');
   const inset=document.createElementNS(svgNS,'path');
   inset.setAttribute('class','map-photo-pin-inset');
   inset.setAttribute('d','M32 8C18.7 8 8 18.7 8 32C8 42.5 14.8 51.5 24.3 54.7L32 66.3L39.7 54.7C49.2 51.5 56 42.5 56 32C56 18.7 45.3 8 32 8Z');
   frame.appendChild(shell);
   frame.appendChild(inset);
   thumbnail.appendChild(frame);
   const photo=document.createElement('img');
   const fallback='/assets/placeholders/restaurant.svg';
   photo.src=p.photo||fallback;
   photo.alt='';
   photo.draggable=false;
   photo.decoding='async';
   photo.onerror=()=>{photo.onerror=null;photo.src=fallback};
   thumbnail.appendChild(photo);

   const content=document.createElement('div');
   content.className='map-place-card';
   const country=document.createElement('strong');
   country.className='map-place-country';
   const flag=document.createElement('span');
   flag.className='map-place-flag';
   flag.setAttribute('aria-hidden','true');
   flag.textContent=countryFlag(p.country);
   const countryName=document.createElement('span');
   countryName.textContent=p.countryName;
   country.appendChild(flag);
   country.appendChild(countryName);
   content.appendChild(country);
   const title=document.createElement('p');
   title.className='map-place-title';
   const locationIcon=document.createElement('img');
   locationIcon.className='map-place-location-icon';
   locationIcon.src='/assets/pixel-icons/pin.svg';
   locationIcon.alt='';
   locationIcon.setAttribute('aria-hidden','true');
   locationIcon.width=16;
   locationIcon.height=16;
   const locationText=document.createElement('span');
   locationText.textContent=p.area?.trim()?`${p.name}, ${p.area.trim()}`:p.name;
   title.appendChild(locationIcon);
   title.appendChild(locationText);
   content.appendChild(title);
   const button=document.createElement('button');
   button.type='button';
   button.textContent='View restaurant';
   button.className='map-place-link';
   button.setAttribute('aria-label',`View restaurant: ${p.name}`);
   button.onclick=()=>select.current(p.id);
   const arrow=document.createElement('span');
   arrow.textContent='→';
   arrow.setAttribute('aria-hidden','true');
   button.appendChild(arrow);
   content.appendChild(button);

   // The dot and the photo pin's tip share the same geographic coordinate.
   // Keeping the dot separate makes the exact location visible at any zoom.
   L.circleMarker(coordinates,{radius:2,weight:1,color:'#493e32',fillColor:'#fff3d5',fillOpacity:1,interactive:false}).addTo(layer.current);
   const marker=L.marker(coordinates,{
    icon:L.divIcon({
     className:'photo-map-marker',html:thumbnail,
     iconSize:[48,57],iconAnchor:[24,55.5],popupAnchor:[0,-58.5]
    }),
    title:p.name,keyboard:true,riseOnHover:true
   }).addTo(layer.current).bindPopup(content,{
    className:'map-place-popup',minWidth:176,maxWidth:208,
    offset:[0,0],autoPanPadding:[24,24]
   });
   const markerElement=marker.getElement();
   markerElement?.setAttribute('data-country',p.country);
   markerElement?.setAttribute('data-country-label',p.name);
   markerElement?.setAttribute('data-walk-id',p.id);
   markerElement?.setAttribute('data-walk-visited',String(p.visited));
   markerElement?.setAttribute('aria-label',p.name);
   markerElement?.setAttribute('aria-expanded','false');
   let closeTimer:number|undefined;
   let overMarker=false,overPopup=false;
   let popupElement:HTMLElement|undefined;
   const cancelClose=()=>window.clearTimeout(closeTimer);
   const scheduleClose=()=>{
    cancelClose();
    // Allow the pointer to cross the gap between the pin and its popup.
    closeTimer=window.setTimeout(()=>{
     if(!overMarker&&!overPopup&&!markerElement?.contains(document.activeElement)&&!popupElement?.contains(document.activeElement))marker.closePopup();
    },200);
   };
   const enterMarker=(event:PointerEvent)=>{
    if(event.pointerType==='touch')return;
    overMarker=true;cancelClose();marker.openPopup();
   };
   const leaveMarker=(event:PointerEvent)=>{
    if(event.pointerType==='touch')return;
    overMarker=false;scheduleClose();
   };
   const enterPopup=(event:PointerEvent)=>{
    if(event.pointerType==='touch')return;
    overPopup=true;cancelClose();
   };
   const leavePopup=(event:PointerEvent)=>{
    if(event.pointerType==='touch')return;
    overPopup=false;scheduleClose();
   };
   const focusMarker=()=>{
    cancelClose();
    if(markerElement?.matches(':focus-visible'))marker.openPopup();
   };
   const detachPopup=()=>{
    popupElement?.removeEventListener('pointerenter',enterPopup);
    popupElement?.removeEventListener('pointerleave',leavePopup);
    popupElement?.removeEventListener('focusin',cancelClose);
    popupElement?.removeEventListener('focusout',scheduleClose);
    popupElement=undefined;overPopup=false;
   };
   markerElement?.addEventListener('pointerenter',enterMarker);
   markerElement?.addEventListener('pointerleave',leaveMarker);
   markerElement?.addEventListener('focusin',focusMarker);
   markerElement?.addEventListener('focusout',scheduleClose);
   marker.on('popupopen',()=>{
    detachPopup();
    popupElement=marker.getPopup().getElement();
    popupElement?.addEventListener('pointerenter',enterPopup);
    popupElement?.addEventListener('pointerleave',leavePopup);
    popupElement?.addEventListener('focusin',cancelClose);
    popupElement?.addEventListener('focusout',scheduleClose);
    thumbnail.classList.add('is-open');
    markerElement?.setAttribute('aria-expanded','true');
    marker.setZIndexOffset(1000);
   });
   marker.on('popupclose',()=>{
    cancelClose();detachPopup();
    thumbnail.classList.remove('is-open');
    markerElement?.setAttribute('aria-expanded','false');
    marker.setZIndexOffset(0);
   });
   cleanups.push(()=>{
    cancelClose();detachPopup();
    markerElement?.removeEventListener('pointerenter',enterMarker);
    markerElement?.removeEventListener('pointerleave',leaveMarker);
    markerElement?.removeEventListener('focusin',focusMarker);
    markerElement?.removeEventListener('focusout',scheduleClose);
   });
   markers.current.set(p.id,marker);
  });
  return()=>cleanups.forEach(cleanup=>cleanup());
 },[pins,ready]);
 useEffect(()=>{
  if(!ready||!selected)return;
  const marker=markers.current.get(selected);
  if(!marker)return;
  // Center first so Leaflet can then keep the entire popup above its photo pin.
  map.current.setView(marker.getLatLng(),Math.max(13,map.current.getZoom()),{animate:false});
  marker.openPopup();
 },[pins,selected,ready]);
 return <div className="nyc-map-wrap"><div className="nyc-map" data-walk-map="local" ref={container} aria-label="Interactive New York and Jersey City restaurant map"/>{failed&&<div className="map-warning">The basemap couldn’t load. Restaurant details and directions are still available below.</div>}</div>
}
