'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {addPassportDish,mergeCollectedDishes,parsePassport,passportStorageKey,serializePassport,type CollectedDish,type PassportDish} from './passport-collection';

export function usePassportCollection(){
  const [dishes,setDishes]=useState<CollectedDish[]>([]);
  const [ready,setReady]=useState(false);
  const current=useRef<CollectedDish[]>([]);

  useEffect(()=>{
    const update=(incoming:CollectedDish[])=>{
      current.current=mergeCollectedDishes(current.current,incoming);
      setDishes(current.current);
    };
    try{update(parsePassport(localStorage.getItem(passportStorageKey)))}catch{/* Keep playing if storage is unavailable. */}
    setReady(true);
    const sync=(event:StorageEvent)=>{
      if(event.key!==passportStorageKey)return;
      if(event.newValue===null){current.current=[];setDishes([]);return}
      const incoming=parsePassport(event.newValue);
      update(incoming);
      // Merge simultaneous pickups from two tabs without erasing either one.
      if(current.current.length>incoming.length){
        try{localStorage.setItem(passportStorageKey,serializePassport(current.current))}catch{}
      }
    };
    window.addEventListener('storage',sync);
    return()=>window.removeEventListener('storage',sync);
  },[]);

  function collect(dish:PassportDish):'collected'|'duplicate'|'unsaved'|'loading' {
    if(!ready)return 'loading';
    let stored:CollectedDish[]=[];
    try{stored=parsePassport(localStorage.getItem(passportStorageKey))}catch{}
    const previous=mergeCollectedDishes(current.current,stored);
    const next=addPassportDish(previous,dish);
    current.current=next;
    setDishes(next);
    if(next===previous)return 'duplicate';
    try{localStorage.setItem(passportStorageKey,serializePassport(next));return 'collected'}catch{return 'unsaved'}
  }

  const collectedIds=useMemo(()=>new Set(dishes.map(dish=>dish.id)),[dishes]);
  return {dishes,ready,collectedIds,collect};
}
