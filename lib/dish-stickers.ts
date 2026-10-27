import {dishSpriteUrl,dishSpriteKey,type DishSpriteKey} from './dish-sprite-atlas.ts';

// Keep spelling variants together, including names already saved in the journal.
const recipes: [DishSpriteKey, string[]][] = [
  ['kabuli-pulao', ['kabuli pulao', 'kabuli palaw', 'qabili palau']],
  ['mantu', ['mantu', 'manto']],
  ['bolani', ['bolani']],
  ['byrek', ['byrek', 'burek', 'borek']],
  ['tave-kosi', ['tave kosi']],
  ['fergese', ['fergese']],
  ['couscous', ['couscous', 'cous cous']],
  ['chakhchoukha', ['chakhchoukha', 'chakhchouka']],
  ['mhadjeb', ['mhadjeb', 'mahjouba', 'mhajeb']],
  ['mixed-grill', ['mixed meat combination', 'mixed grill']],
  ['albanian-soup', ['cka ka qellu soup', 'cka ka qellue soup']],
];

export const defaultDishSticker = dishSpriteUrl('plate');
export const merguezSandwichSticker = '/assets/dish-stickers/merguez-sandwich-v2.png';
export const caneloDeCuaDeBouSticker = '/assets/dish-stickers/canelo-de-cua-de-bou-v1.png';
const individualDishStickers: [string, string[]][] = [
  ['/assets/dish-stickers/fuchka-v1.png', ['fuchka', 'fuska', 'phuchka']],
  ['/assets/dish-stickers/goat-biryani-v1.png', ['goat biryani', 'goat biriyani']],
  ['/assets/dish-stickers/ilish-v1.png', ['ilish', 'elish', 'hilsa']],
  ['/assets/dish-stickers/begun-v1.png', ['begun', 'bangan']],
  ['/assets/dish-stickers/mishti-doi-v1.png', ['mishti doi', 'misti doi']],
  ['/assets/dish-stickers/bobo-de-camarao-v1.png', ['bobo de camarao']],
  ['/assets/dish-stickers/pao-de-queijo-v1.png', ['pao de queijo']],
  ['/assets/dish-stickers/quiabo-v1.png', ['quiabo', 'okra']],
  ['/assets/dish-stickers/arroz-branco-v1.png', ['arroz branco', 'white rice']],
  ['/assets/dish-stickers/farofa-v1.png', ['farofa']],
  ['/assets/dish-stickers/argentine-beef-empanada-v1.png', ['beef empanada', 'empanada de carne']],
  ['/assets/dish-stickers/argentine-parrillada-v1.png', ['parrillada', 'argentine mixed grill', 'argentinian mixed grill']],
  ['/assets/dish-stickers/ensalada-rusa-v1.png', ['ensalada rusa']],
  ['/assets/dish-stickers/bread-chimichurri-v1.png', ['bread with chimichurri', 'bread and chimichurri', 'pan con chimichurri']],
  ['/assets/dish-stickers/argentine-red-wine-v1.png', ['argentine red wine', 'argentinian red wine']],
  ['/assets/dish-stickers/quilmes-beer-v1.png', ['quilmes']],
  ['/assets/dish-stickers/wadadli-stew-platter-v1.png', ['stewed meat platter']],
  ['/assets/dish-stickers/caribbean-patty-v1.png', ['caribbean patty']],
  ['/assets/dish-stickers/wadadli-fried-bites-v1.png', ['fried bites']],
  ['/assets/dish-stickers/australian-beer-v1.png', ['australian beer', 'australian lager']],
  ['/assets/dish-stickers/chicken-parma-v1.png', ['chicken parma', 'chicken parmigiana']],
  ['/assets/dish-stickers/australian-meat-pie-v1.png', ['meat pie', 'aussie beef pie']],
  ['/assets/dish-stickers/wiener-schnitzel-v1.png', ['wiener schnitzel', 'schnitzel']],
  ['/assets/dish-stickers/bratwurst-v1.png', ['bratwurst']],
  ['/assets/dish-stickers/buttered-spaetzle-v1.png', ['buttered spatzle', 'buttered spaetzle']],
  ['/assets/dish-stickers/austrian-white-wine-v1.png', ['austrian white wine']],
  ['/assets/dish-stickers/austrian-beer-v1.png', ['austrian beer', 'austrian lager']],
  ['/assets/dish-stickers/shekerbura-v1.png', ['shekerbura', 'shakarbura', 'shaker bura']],
  ['/assets/dish-stickers/azerbaijani-kebab-rice-v1.png', ['kebabs with rice', 'lulya kebab', 'lula kebab']],
  ['/assets/dish-stickers/meat-potato-skillet-v1.png', ['meat and potato skillet', 'djiz biz', 'jiz biz']],
  ['/assets/dish-stickers/qutab-v1.png', ['qutab', 'qutabs', 'kutab', 'kutaby']],
  ['/assets/dish-stickers/turkish-bread-v1.png', ['turkish bread']],
  ['/assets/dish-stickers/codfish-fritters-v1.png', ['codfish fritters', 'codfish fritter', 'cod fish fritters', 'saltfish fritters']],
  ['/assets/dish-stickers/whole-fish-plantains-v1.png', ['whole fish with plantains']],
  ['/assets/dish-stickers/rice-and-peas-v1.png', ['rice and peas', 'rice peas']],
  ['/assets/dish-stickers/red-stripe-beer-v1.png', ['red stripe']],
];

export function knownDishSticker(name: string): string | undefined {
  const normalized = ` ${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  if(['canelo de cua de bou','canelons de cua de bou','oxtail cannelloni'].some(alias=>normalized.includes(` ${alias} `)))return caneloDeCuaDeBouSticker;
  if(normalized.includes(' merguez ')&&(normalized.includes(' sandwich ')||normalized.trim()==='merguez'))return merguezSandwichSticker;
  const individualDish = individualDishStickers.find(([, aliases]) => aliases.some(alias => normalized.includes(` ${alias} `)));
  if (individualDish) return individualDish[0];
  const match = recipes.find(([, aliases]) => aliases.some(alias => normalized.includes(` ${alias} `)));
  return match ? dishSpriteUrl(match[0]) : undefined;
}

export function dishSticker(name: string, saved?: string): string {
  const illustrated = knownDishSticker(name);
  if (illustrated) return illustrated;
  if (saved==='/assets/dish-stickers/merguez-sandwich-v1.png')return merguezSandwichSticker;
  if (saved && (dishSpriteKey(saved) || saved===merguezSandwichSticker || saved===caneloDeCuaDeBouSticker || individualDishStickers.some(([path])=>path===saved) || /^https:\/\//.test(saved))) return saved;
  // Old SVG references resolve to the new set without breaking saved entries.
  return defaultDishSticker;
}
