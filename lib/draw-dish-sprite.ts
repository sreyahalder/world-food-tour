import {dishSpriteAtlas,dishSpriteFrames,type DishSpriteKey} from './dish-sprite-atlas.ts';

let atlas: Promise<HTMLImageElement> | undefined;
function loadAtlas() {
  return atlas ??= new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { atlas = undefined; reject(Error('Could not load the dish icons.')); };
    image.src = dishSpriteAtlas;
  });
}

export async function drawDishSprite(canvas: HTMLCanvasElement, key: DishSpriteKey, isCurrent = () => true) {
  const image = await loadAtlas();
  if (!isCurrent()) return;
  const [x,y,width,height] = dishSpriteFrames[key];
  // Crop at the artwork's original resolution, preserving its color and transparency.
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw Error('Could not draw this dish icon.');
  context.drawImage(image, x, y, width, height, 0, 0, width, height);
}
