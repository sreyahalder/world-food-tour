export type Point = {x:number; y:number};
export type MapView = Point & {scale:number};
export type Viewport = Point & {width:number; height:number};
export const MAP_WIDTH=954, MAP_HEIGHT=445, MIN_ZOOM=1, MAX_ZOOM=8;
export const INITIAL_VIEW:MapView={x:0,y:0,scale:1};

export function fitViewport(width:number,height:number):Viewport {
  const w=Math.max(MAP_WIDTH,MAP_HEIGHT*width/height);
  const h=Math.max(MAP_HEIGHT,MAP_WIDTH*height/width);
  return {x:(MAP_WIDTH-w)/2,y:(MAP_HEIGHT-h)/2,width:w,height:h};
}

export function constrainView(view:MapView,viewport:Viewport):MapView {
  const scale=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,view.scale));
  const width=MAP_WIDTH*scale,height=MAP_HEIGHT*scale;
  return {
    scale,
    x:width<=viewport.width?(MAP_WIDTH-width)/2:Math.min(viewport.x,Math.max(viewport.x+viewport.width-width,view.x)),
    y:height<=viewport.height?(MAP_HEIGHT-height)/2:Math.min(viewport.y,Math.max(viewport.y+viewport.height-height,view.y)),
  };
}

// Keep the same geographic point beneath the cursor or pinch midpoint.
export function zoomView(view:MapView,factor:number,anchor:Point,viewport:Viewport,destination:Point=anchor):MapView {
  const scale=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,view.scale*factor));
  const ratio=scale/view.scale;
  return constrainView({scale,x:destination.x-(anchor.x-view.x)*ratio,y:destination.y-(anchor.y-view.y)*ratio},viewport);
}
