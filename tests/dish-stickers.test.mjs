import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dishSticker,knownDishSticker,defaultDishSticker,merguezSandwichSticker} from '../lib/dish-stickers.ts';
import {dishSpriteAtlas,dishSpriteAtlasSize,dishSpriteFrames,dishSpriteKey} from '../lib/dish-sprite-atlas.ts';

test('all eleven dishes resolve to distinct illustrations, including accented saved names', () => {
  const dishes = ['Kabuli Pulao + Lamb Shing','Manto','Bolani','Byrek','Tavë kosi','Fërgesë','Couscous','Chakhchoukha','Mhadjeb','Çka Ka Qëllu Mixed Meat Combination','Çka ka Qellu Soup'];
  const paths = dishes.map(knownDishSticker);
  assert.equal(new Set(paths).size, 11);
  for (const path of paths) assert.ok(dishSpriteKey(path));
  assert.equal(knownDishSticker('MANTU'), knownDishSticker('Manto'));
  assert.equal(knownDishSticker('Mantucket pie'), undefined);
  assert.equal(knownDishSticker('Merguez sandwich'),merguezSandwichSticker);
  assert.equal(knownDishSticker('Sandwich aux merguez'),merguezSandwichSticker);
  assert.equal(knownDishSticker('Merguez'),merguezSandwichSticker);
  assert.equal(knownDishSticker('Couscous with merguez'),knownDishSticker('Couscous'));
});

test('legacy badge and photo-pixel references resolve to the new illustrations', () => {
  assert.equal(dishSticker('Manto','/assets/dish-stickers/mantu.svg'), knownDishSticker('Mantu'));
  assert.equal(dishSticker('Çka ka Qellu Soup','https://example.com/old-photo-icon.png'), knownDishSticker('Çka ka Qellu Soup'));
  assert.equal(dishSticker('New dish','javascript:alert(1)'), defaultDishSticker);
  assert.equal(dishSpriteKey(defaultDishSticker), 'plate');
  assert.equal(dishSpriteKey(`${dishSpriteAtlas}#toString`), undefined);
  assert.equal(dishSticker('Merguez sandwich',defaultDishSticker),merguezSandwichSticker);
  assert.equal(dishSticker('Custom sandwich',merguezSandwichSticker),merguezSandwichSticker);
  assert.equal(dishSticker('Custom sandwich','/assets/dish-stickers/merguez-sandwich-v1.png'),merguezSandwichSticker);
});

test('the atlas is RGBA, and every crop stays inside its bounds', () => {
  const png = readFileSync(new URL(`../public${dishSpriteAtlas}`, import.meta.url));
  assert.equal(png.subarray(1,4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), dishSpriteAtlasSize.width);
  assert.equal(png.readUInt32BE(20), dishSpriteAtlasSize.height);
  assert.equal(png[25], 6);
  const sandwich=readFileSync(new URL(`../public${merguezSandwichSticker}`,import.meta.url));
  assert.equal(sandwich.subarray(1,4).toString(),'PNG');
  assert.equal(sandwich[25],6);
  assert.equal(Object.keys(dishSpriteFrames).length, 12);
  for (const [x,y,w,h] of Object.values(dishSpriteFrames)) {
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0);
    assert.ok(x+w <= dishSpriteAtlasSize.width && y+h <= dishSpriteAtlasSize.height);
  }
});
