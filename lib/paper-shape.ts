export type PaperPoint = [number, number];

export const PAPER_PIXEL_SCALE = 4;
export const PAPER_SECTION_DURATION = .28;

// Shared by the live page and its square-section opening animation.
export function paperOutline(width: number, height: number): PaperPoint[] {
 const x=(fraction:number)=>Math.round(width*fraction/6)*6;
 const y=(fraction:number)=>Math.round(height*fraction/6)*6;
 return [
  [24,4],[x(.22),4],[x(.22),7],[x(.22)+12,7],[x(.22)+12,4],
  [x(.66),4],[x(.66),10],[x(.66)+12,10],[x(.66)+12,4],
  [width-24,4],[width-24,8],[width-12,8],[width-12,14],
  [width-6,14],[width-6,y(.25)],[width-10,y(.25)],
  [width-10,y(.25)+18],[width-4,y(.25)+18],
  [width-4,y(.62)],[width-8,y(.62)],[width-8,y(.62)+12],
  [width-4,y(.62)+12],[width-4,height-30],[width-10,height-30],
  [width-10,height-18],[width-16,height-18],[width-16,height-12],
  [width-28,height-12],[width-28,height-6],
  [x(.72),height-6],[x(.72),height-10],[x(.72)-18,height-10],
  [x(.72)-18,height-4],[x(.33),height-4],[x(.33),height-8],
  [x(.33)-12,height-8],[x(.33)-12,height-4],
  [20,height-4],[20,height-8],[10,height-8],[10,height-18],
  [4,height-18],[4,y(.72)],[8,y(.72)],[8,y(.72)-18],
  [4,y(.72)-18],[4,y(.32)],[10,y(.32)],[10,y(.32)-12],
  [4,y(.32)-12],[4,26],[8,26],[8,14],[14,14],[14,8],[24,8]
 ].map(([px,py])=>[Math.round(px/4)*4,Math.round(py/4)*4] as PaperPoint);
}

export function paperPath(points: PaperPoint[]) {
 return `${points.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ')} Z`;
}

export function paperSections(width:number,height:number) {
 const sections=[];
 const size=32,columns=Math.ceil(width/size),rows=Math.ceil(height/size);
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const x=col*size,y=row*size;
  const w=Math.min(size,width-x),h=Math.min(size,height-y);
  const distance=(Math.abs(x+w/2-width/2)+Math.abs(y+h/2-height/2))/(width/2+height/2);
  sections.push({x,y,width:w,height:h,vertical:(row+col)%2===0,
   delay:Math.floor(distance*5)*.036+((row*3+col)%2)*.014,open:0});
 }
 return sections.sort((a,b)=>a.delay-b.delay);
}

export function paperSectionPose(section:ReturnType<typeof paperSections>[number],width:number,height:number) {
 const p=section.open;
 const fold=.18+.82*p,spread=.72+.28*p;
 const w=Math.max(1,Math.round(section.width*(section.vertical?spread:fold)));
 const h=Math.max(1,Math.round(section.height*(section.vertical?fold:spread)));
 const centerX=width/2+(section.x+section.width/2-width/2)*p;
 const centerY=height/2+(section.y+section.height/2-height/2)*p;
 return {x:Math.round(centerX-w/2),y:Math.round(centerY-h/2),width:w,height:h};
}
