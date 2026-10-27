'use client';
import {useEffect,useRef,useState} from 'react';
import {dishSticker, knownDishSticker, defaultDishSticker} from '../lib/dish-stickers';
import {dishSpriteKey,dishSpriteFrames} from '../lib/dish-sprite-atlas';
import {drawDishSprite} from '../lib/draw-dish-sprite';
import type {StickerCollection} from '../lib/passport-collection';

export default function DishSticker({name,src,collectible}:{name:string;src?:string;collectible?:StickerCollection}) {
  const [failed, setFailed] = useState<string[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const candidates = [dishSticker(name, src), knownDishSticker(name), defaultDishSticker];
  const image = candidates.find(candidate => candidate && !failed.includes(candidate));
  const key = image ? dishSpriteKey(image) : undefined;
  const frame = key ? dishSpriteFrames[key] : undefined;
  useEffect(() => {
    if (!key || !canvas.current || !image) return;
    let current = true;
    void drawDishSprite(canvas.current, key, () => current).catch(() => {
      if (current) setFailed(previous => [...previous, image]);
    });
    return () => { current = false; };
  }, [key, image]);
  if (!image) return null;
  return <span className="dish-sticker" aria-hidden="true" data-collect-dish={collectible?.id} data-dish-name={collectible?name:undefined} data-collected={collectible?String(collectible.collected):undefined}>{key
    ? <canvas ref={canvas} width={frame?.[2]} height={frame?.[3]}/>
    : <img
    src={image} alt="" width={64} height={64} draggable={false}
    onError={() => setFailed(previous => [...previous, image])}
  />}{collectible?.collected&&<span className="dish-collected-check">✓</span>}</span>;
}
