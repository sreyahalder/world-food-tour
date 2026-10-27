export type Character = 'sreya' | 'boyfriend';
export type Direction = 'down' | 'left' | 'right' | 'up';
export type WalkFrame = 'step-a' | 'idle' | 'step-b';
export type Walker = {character: Character; x: number; y: number; facing: Direction; moving: boolean; distance: number; idleTime: number; dragging:boolean; dragTime:number};
export type Viewport = {width: number; height: number};
export type DragPoint = {x:number;y:number};
export const walkKeys = {
  sreya: {up:'KeyW',left:'KeyA',down:'KeyS',right:'KeyD'},
  boyfriend: {up:'ArrowUp',left:'ArrowLeft',down:'ArrowDown',right:'ArrowRight'},
} as const;
export const movementKeys = new Set<string>(Object.values(walkKeys).flatMap(keys => Object.values(keys)));
export const walkSpeed = 172;
const sequence: WalkFrame[] = ['step-a','idle','step-b','idle'];

export function clampWalker(walker: Walker, viewport: Viewport): Walker {
  const left = Math.min(40, viewport.width / 2);
  const top = Math.min(116, viewport.height / 2);
  const right = Math.max(left, viewport.width - 40);
  const bottom = Math.max(top, viewport.height - 8);
  return {...walker,x:Math.max(left,Math.min(right,walker.x)),y:Math.max(top,Math.min(bottom,walker.y))};
}

export function spawnCouple(viewport: Viewport): Walker[] {
  return (['sreya','boyfriend'] as const).map((character,index) => clampWalker({
    character,x:viewport.width/2 + (index ? 48 : -48),y:viewport.height-100,
    facing:'down',moving:false,distance:0,idleTime:index*0.9,dragging:false,dragTime:0,
  },viewport));
}

export function stepWalker(walker: Walker, pressed: ReadonlySet<string>, seconds: number, viewport: Viewport): Walker {
  const dt = Math.min(Math.max(seconds,0),0.05);
  if(walker.dragging)return {...walker,moving:false,distance:0,dragTime:walker.dragTime+dt};
  const keys = walkKeys[walker.character];
  const dx = Number(pressed.has(keys.right)) - Number(pressed.has(keys.left));
  const dy = Number(pressed.has(keys.down)) - Number(pressed.has(keys.up));
  const length = Math.hypot(dx,dy);
  let facing = walker.facing;
  if (dx || dy) {
    // The most recently held direction leads a diagonal, without faster movement.
    for (const code of pressed) {
      if (dx && code === keys.left) facing='left';
      if (dx && code === keys.right) facing='right';
      if (dy && code === keys.up) facing='up';
      if (dy && code === keys.down) facing='down';
    }
  }
  const next = clampWalker({...walker,facing,
    x:walker.x+(length ? dx/length*walkSpeed*dt : 0),
    y:walker.y+(length ? dy/length*walkSpeed*dt : 0),
  },viewport);
  const distance = Math.hypot(next.x-walker.x,next.y-walker.y);
  const moving = distance > 0.001;
  return {...next,moving,distance:moving ? walker.distance+distance : 0,idleTime:moving ? 0 : walker.idleTime+dt};
}

export function walkingFrame(walker: Walker): WalkFrame {
  return walker.moving ? sequence[Math.floor(walker.distance/18)%sequence.length] : 'idle';
}

export function idleFrame(seconds:number,reducedMotion=false):'rest'|'breathe'|'blink' {
  if(reducedMotion)return 'rest';
  const phase=seconds%4;
  return phase>=3.6&&phase<3.78?'blink':phase>=1.4&&phase<2.4?'breathe':'rest';
}

export function spriteFrame(walker:Walker,reducedMotion=false){
  if(walker.dragging){
    const pose=reducedMotion?'hold':['hold','left','hold','right'][Math.floor(walker.dragTime/.18)%4];
    return `${walker.character}/drag/${pose}`;
  }
  return walker.moving?`${walker.character}/${walker.facing}/${walkingFrame(walker)}`:`${walker.character}/idle/${walker.facing}/${idleFrame(walker.idleTime,reducedMotion)}`;
}

export function grabWalker(walker:Walker,pointer:DragPoint){
  return {walker:{...walker,dragging:true,dragTime:0,moving:false,distance:0,idleTime:0},offset:{x:pointer.x-walker.x,y:pointer.y-walker.y}};
}

export function dragWalker(walker:Walker,pointer:DragPoint,offset:DragPoint,viewport:Viewport):Walker{
  if(!walker.dragging)return walker;
  return clampWalker({...walker,x:pointer.x-offset.x,y:pointer.y-offset.y},viewport);
}

export function releaseWalker(walker:Walker):Walker{
  return {...walker,dragging:false,dragTime:0,moving:false,distance:0,idleTime:0};
}

export function acceptsMovement(event: {code:string;altKey:boolean;ctrlKey:boolean;metaKey:boolean;isComposing?:boolean}, typing: boolean, suspended: boolean) {
  return !suspended && !typing && !event.isComposing && !event.altKey && !event.ctrlKey && !event.metaKey && movementKeys.has(event.code);
}
