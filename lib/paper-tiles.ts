import {PAPER_PIXEL_SCALE,paperOutline,paperPath} from './paper-shape';

// A fixed game palette, applied once while reading the stored sheet.
export const PAPER_PALETTE = [
 [251,246,230], [244,236,213], [231,216,179],
 [211,189,145], [177,148,102], [86,70,47]
] as const;
export type PaperTiles=HTMLCanvasElement[];
const TILE_SIZE=32;
type PaperAtlas={image:string;tileSize:number;frames:[number,number,number,number][]};
let loading:Promise<PaperTiles>|undefined;

function pixelPalette(context:CanvasRenderingContext2D,width:number,height:number,removeGreen=false) {
 const image=context.getImageData(0,0,width,height);
 const data=image.data;
 for(let i=0;i<data.length;i+=4){
  const r=data[i],g=data[i+1],b=data[i+2];
  if(data[i+3]<128||(removeGreen&&g>r&&r<150)){data[i+3]=0;continue}
  const value=.299*r+.587*g+.114*b;
  const index=value<120?5:value<175?4:value<205?3:value<225?2:value<239?1:0;
  const color=PAPER_PALETTE[index];
  data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];data[i+3]=255;
 }
 context.putImageData(image,0,0);
}

export function loadPaperTiles():Promise<PaperTiles> {
 if(loading)return loading;
 loading=fetch('/assets/textures/pixel-paper-tiles-v1.json').then(async response=>{
  if(!response.ok)throw new Error('Paper tile map unavailable');
  const atlas=await response.json() as PaperAtlas;
  if(atlas.tileSize!==TILE_SIZE||atlas.frames.length!==16)throw new Error('Invalid paper tile map');
  return new Promise<PaperTiles>((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>{
   try{
    const tiles=atlas.frames.map(([x,y,width,height])=>{
     const tile=document.createElement('canvas');
     tile.width=tile.height=atlas.tileSize;
     const context=tile.getContext('2d');
     if(!context)throw new Error('Paper tile canvas unavailable');
     context.imageSmoothingEnabled=false;
     context.drawImage(image,x,y,width,height,0,0,tile.width,tile.height);
     pixelPalette(context,tile.width,tile.height,true);
     return tile;
    });
    resolve(tiles);
   }catch(error){reject(error)}
  };
  image.onerror=()=>reject(new Error('Paper tile sheet unavailable'));
  image.src=atlas.image;
  });
 }).catch(error=>{loading=undefined;throw error});
 return loading;
}

export function paintPaper(canvas:HTMLCanvasElement,width:number,height:number,tiles?:PaperTiles) {
 const scale=PAPER_PIXEL_SCALE,size=TILE_SIZE;
 canvas.width=Math.ceil(width/scale);canvas.height=Math.ceil(height/scale);
 canvas.style.width=`${canvas.width*scale}px`;canvas.style.height=`${canvas.height*scale}px`;
 const context=canvas.getContext('2d');
 if(!context)return;
 context.imageSmoothingEnabled=false;
 const path=new Path2D(paperPath(paperOutline(width,height).map(([x,y])=>[x/scale,y/scale])));
 context.save();context.clip(path);
 context.fillStyle='#fbf6e6';context.fillRect(0,0,canvas.width,canvas.height);
 if(tiles){
  const fills=[3,5,15,5,3,7,5,15,3,5,11,14];
  for(let y=0,row=0;y<canvas.height;y+=size,row++){
   for(let x=0,col=0;x<canvas.width;x+=size,col++){
    const variant=fills[(col*7+row*11+row*col*3)%fills.length];
    context.drawImage(tiles[variant],x,y);
   }
  }
  const right=canvas.width-size,bottom=canvas.height-size;
  for(let x=size;x<right;x+=size){
   const span=Math.min(size,right-x);
   context.drawImage(tiles[1],0,0,span,size,x,0,span,size);
   context.drawImage(tiles[9],0,0,span,size,x,bottom,span,size);
  }
  for(let y=size;y<bottom;y+=size){
   const span=Math.min(size,bottom-y);
   context.drawImage(tiles[4],0,0,size,span,0,y,size,span);
   context.drawImage(tiles[6],0,0,size,span,right,y,size,span);
  }
  context.drawImage(tiles[0],0,0);context.drawImage(tiles[2],right,0);
  context.drawImage(tiles[8],0,bottom);context.drawImage(tiles[10],right,bottom);
 }
 context.strokeStyle='#e7d8b3';context.lineWidth=3;context.stroke(path);
 context.strokeStyle='#56462f';context.lineWidth=1;context.stroke(path);
 context.restore();
 // Flatten partial edge pixels too, keeping the final material on the same palette.
 pixelPalette(context,canvas.width,canvas.height);
}
