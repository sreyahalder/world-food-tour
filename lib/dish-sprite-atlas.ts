export const dishSpriteAtlas = '/assets/dish-stickers/dish-sprites-v2.png';
export const dishSpriteAtlasSize = {width: 1448, height: 1086};

// Measured opaque bounds in the original, unmodified generated atlas.
export const dishSpriteFrames = {
  'kabuli-pulao': [42,86,326,237],
  mantu: [406,103,309,221],
  bolani: [751,113,303,214],
  byrek: [1100,107,317,217],
  'tave-kosi': [32,449,353,209],
  fergese: [409,451,306,207],
  couscous: [750,436,306,232],
  chakhchoukha: [1110,427,307,245],
  mhadjeb: [33,781,335,212],
  'mixed-grill': [387,764,368,236],
  'albanian-soup': [756,777,347,226],
  plate: [1136,800,288,184],
} as const;
export type DishSpriteKey = keyof typeof dishSpriteFrames;

export function dishSpriteUrl(key: DishSpriteKey) { return `${dishSpriteAtlas}#${key}`; }

export function dishSpriteKey(url: string): DishSpriteKey | undefined {
  if (!url.startsWith(`${dishSpriteAtlas}#`)) return undefined;
  const key = url.slice(dishSpriteAtlas.length + 1);
  return Object.hasOwn(dishSpriteFrames, key) ? key as DishSpriteKey : undefined;
}
