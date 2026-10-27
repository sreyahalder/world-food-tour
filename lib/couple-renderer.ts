import {spriteFrame,type Walker} from './couple-motion.ts';

export type SpriteFrame = {source:{x:number;y:number;width:number;height:number};anchor:{x:number;y:number};scale?:number};
export type CoupleManifest = {image:string;size:{width:number;height:number};frames:Record<string,SpriteFrame>};
export type CoupleFrames = Map<string,HTMLCanvasElement>;
export const frameWidth=48, frameHeight=64, footX=24, footY=60;

export function prepareCoupleFrames(image: CanvasImageSource, manifest: CoupleManifest, makeCanvas=()=>document.createElement('canvas')): CoupleFrames {
  const frames: CoupleFrames = new Map();
  for (const [name,frame] of Object.entries(manifest.frames)) {
    const canvas=makeCanvas();canvas.width=frameWidth;canvas.height=frameHeight;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if (!context) throw Error('Could not prepare the characters.');
    const {source,anchor}=frame;const scale=frame.scale??.2;
    context.imageSmoothingEnabled=false;
    context.drawImage(image,source.x,source.y,source.width,source.height,
      footX-Math.round(anchor.x*scale),footY-Math.round(anchor.y*scale),Math.round(source.width*scale),Math.round(source.height*scale));
    const pixels=context.getImageData(0,0,frameWidth,frameHeight);
    for(let i=0;i<pixels.data.length;i+=4) {
      if(pixels.data[i+3]<128) pixels.data.fill(0,i,i+4);
      else pixels.data[i+3]=255;
    }
    context.putImageData(pixels,0,0);frames.set(name,canvas);
  }
  return frames;
}

export function drawCouple(context: CanvasRenderingContext2D, frames: CoupleFrames, walkers: Walker[], reducedMotion: boolean) {
  context.clearRect(0,0,context.canvas.width,context.canvas.height);
  context.imageSmoothingEnabled=false;
  for(const walker of [...walkers].sort((a,b)=>Number(a.dragging)-Number(b.dragging)||a.y-b.y)) {
    const frame=frames.get(spriteFrame(walker,reducedMotion));
    if(!frame) continue;
    const x=Math.round(walker.x/2),y=Math.round(walker.y/2);
    if(!walker.dragging){context.fillStyle='#18201835';context.fillRect(x-10,y-2,20,3);context.fillRect(x-7,y-3,14,5)}
    context.drawImage(frame,x-footX,y-footY);
  }
}

let assets: Promise<{image:HTMLImageElement;manifest:CoupleManifest}> | undefined;
export function loadCoupleSprites() {
  return assets ??= fetch('/assets/sprites/couple-v2.json').then(async response=>{
    if(!response.ok) throw Error('Could not load the character frames.');
    const manifest=await response.json() as CoupleManifest;
    const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Could not load the characters.'));image.src=manifest.image;
    });
    return {image,manifest};
  }).catch(error=>{assets=undefined;throw error});
}
