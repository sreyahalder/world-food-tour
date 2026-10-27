// Standalone asset inspection only. This preview does not read or write game data.
const button=document.querySelector('#passport');
const canvas=document.querySelector('#icon');
const motion=matchMedia('(prefers-reduced-motion: reduce)');

try {
  const response=await fetch('./passport-assets-v1.json');
  if(!response.ok)throw new Error('The frame map could not load.');
  const {icon}=await response.json();
  const image=new Image();
  image.src=icon.image;
  await image.decode();
  const draw=(surface,index)=>{
    const context=surface.getContext('2d');
    const frame=icon.frames[index];
    context.clearRect(0,0,surface.width,surface.height);
    context.imageSmoothingEnabled=false;
    context.drawImage(image,frame.x,frame.y,frame.width,frame.height,0,0,surface.width,surface.height);
  };
  icon.frames.forEach((frame,index)=>{
    const figure=document.createElement('figure');
    const thumbnail=document.createElement('canvas');
    thumbnail.width=thumbnail.height=128;
    thumbnail.setAttribute('aria-hidden','true');
    draw(thumbnail,index);
    const caption=document.createElement('figcaption');
    caption.textContent=frame.name[0].toUpperCase()+frame.name.slice(1);
    figure.append(thumbnail,caption);
    document.querySelector('#frames').append(figure);
  });
  let frame=0,timer=0,hovered=false,focused=false,tapped=false;
  const wanted=()=>hovered||focused||tapped;
  const animate=()=>{
    clearTimeout(timer);
    if(motion.matches){frame=wanted()?4:0;draw(canvas,frame);return}
    if(wanted()){
      if(frame<4)frame++;
      else frame=frame===4?5:4;
    }else frame=Math.max(0,Math.min(frame,4)-1);
    draw(canvas,frame);
    if(wanted()||frame>0)timer=setTimeout(animate,frame>=4?360:110);
  };
  const update=()=>{clearTimeout(timer);timer=setTimeout(animate,40)};
  button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){hovered=true;update()}});
  button.addEventListener('pointerleave',()=>{hovered=false;update()});
  button.addEventListener('focus',()=>{focused=button.matches(':focus-visible');update()});
  button.addEventListener('blur',()=>{focused=false;tapped=false;update()});
  button.addEventListener('click',()=>{if(!hovered){tapped=!tapped;update()}});
  motion.addEventListener('change',update);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else update()});
  draw(canvas,0);
} catch(error) {
  const warning=document.querySelector('#error');
  warning.textContent=error instanceof Error?error.message:'The passport assets could not load.';
  warning.hidden=false;
}
