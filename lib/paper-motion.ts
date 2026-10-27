import {gsap} from 'gsap';
import {PAPER_PIXEL_SCALE,PAPER_SECTION_DURATION,paperSections,paperSectionPose} from './paper-shape';

export function animatePaper(stage:HTMLElement,rest:HTMLElement,source:HTMLCanvasElement,onFinish:()=>void) {
 const canvas=document.createElement('canvas');
 canvas.width=source.width;canvas.height=source.height;
 canvas.style.width=`${canvas.width*PAPER_PIXEL_SCALE}px`;
 canvas.style.height=`${canvas.height*PAPER_PIXEL_SCALE}px`;
 const context=canvas.getContext('2d');
 if(!context)throw new Error('Paper animation canvas unavailable');
 context.imageSmoothingEnabled=false;
 stage.appendChild(canvas);
 const sections=paperSections(canvas.width,canvas.height);
 let disposed=false;
 let timeline:gsap.core.Timeline|undefined;
 const cleanup=()=>{
  if(disposed)return;
  disposed=true;timeline?.kill();canvas.remove();
 };
 const render=()=>{
  if(disposed)return;
  context.clearRect(0,0,canvas.width,canvas.height);
  for(const section of sections){
   const p=section.open;
   if(!p)continue;
   const {x,y,width:w,height:h}=paperSectionPose(section,canvas.width,canvas.height);
   context.drawImage(source,section.x,section.y,section.width,section.height,x,y,w,h);
   if(p<1){
    const crease=Math.max(1,Math.round((1-p)*3));
    context.fillStyle='#d3bd91';
    if(section.vertical)context.fillRect(x,y+h-crease,w,crease);
    else context.fillRect(x+w-crease,y,crease,h);
   }
  }
 };
 try{
  timeline=gsap.timeline({onUpdate:render,onComplete:()=>{cleanup();onFinish()}});
  for(const section of sections){
   timeline.to(section,{open:1,duration:PAPER_SECTION_DURATION,ease:'steps(7)'},section.delay);
  }
  const end=Math.max(...sections.map(section=>section.delay))+PAPER_SECTION_DURATION;
  timeline.to(rest,{opacity:1,duration:.08,ease:'power1.out'},end)
   .to(stage,{opacity:0,duration:.08,ease:'power1.out'},end);
  return cleanup;
 }catch(error){cleanup();throw error}
}
