import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// Native 40px game icons, matching the existing crisp SVG icon collection.
const path = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
const blocks = (points, color, width = 2, height = 1) => points.map(([x,y]) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}"/>`).join('');
const cream = '#fff9e9', ink = '#523b2e', gold = '#eab967', crust = '#b8773c', green = '#668147';
const cutline = path('M12 2h16v2h6v4h4v6h2v12h-2v6h-4v4h-6v2H12v-2H6v-4H2v-6H0V14h2V8h4V4h6z', cream);
const plate = path('M10 13h20v2h5v4h2v8h-3v4h-6v2H12v-2H6v-4H3v-8h2v-4h5z', '#526b5a') + path('M10 15h20v2h4v4h1v5h-3v3h-5v2H13v-2H8v-3H5v-5h1v-4h4z', '#abc3ad') + path('M12 16h16v2h4v4h1v4h-5v3H12v-3H7v-4h1v-4h4z', '#edf0d9');
const bowl = path('M7 15h26v3h3v8h-3v4h-5v3H12v-3H7v-4H4v-8h3z', ink) + path('M7 21h26v5h-3v3h-4v2H14v-2h-4v-3H7z', '#c77b50') + path('M8 22h23v2H8zM11 27h4v2h-4z', '#e8ab73');
const herbs = (points) => blocks(points, green, 2, 2) + blocks(points.map(([x,y]) => [x+1,y]), '#a0ae68');
const recipes = {
  'kabuli-pulao': plate
    + path('M9 22v-4h3v-4h4v-3h10v3h4v4h3v8H9z', crust)
    + path('M11 23v-5h3v-4h12v3h4v5h1v3H11z', gold)
    + blocks([[15,16],[20,14],[25,18],[12,21],[18,20],[23,23],[28,21],[16,24]], '#fff0b9', 3)
    + blocks([[16,18],[23,16],[26,22],[13,24]], '#dd7839', 4, 1)
    + blocks([[12,18],[20,23],[28,18],[21,18],[17,22]], '#654535', 2, 2)
    + path('M25 8h4v2h3v2h-3v3h-5v-2h-3V9h4z', ink)
    + path('M24 9h4v3h-2v2h-3v-3h1z', '#a6653c')
    + path('M30 7h3V5h3v3h-2v3h-3z', '#f0e3c0'),
  mantu: plate + [[10,14],[20,12],[15,21],[25,21]].map(([x,y]) =>
    path(`M${x+3} ${y}h3v2h3v2h2v5h-2v2H${x}v-2h-2v-5h2v-2h3z`, '#b38f63')
    + path(`M${x+3} ${y+1}h3v3h3v4h-2v2h-6v-2h-2v-3h2v-2h2z`, '#fff0c9')
    + blocks([[x+3,y+3],[x+5,y+5]], '#d4bb91', 1, 3)).join('')
    + blocks([[12,21],[22,18],[27,27]], '#b65839', 3, 2) + herbs([[15,18],[24,14],[20,26]]),
  bolani: plate
    + path('M8 25v-4h4v-4h4v-4h4v-4h3v4h3v4h3v4h3v6H8z', ink)
    + path('M10 24v-2h4v-4h4v-4h3v-2h1v4h3v4h3v3h2v2H10z', gold)
    + path('M10 25h20v2H10z', green)
    + blocks([[15,22],[19,17],[23,21]], crust, 3, 2)
    + path('M21 13v11h2V15z', '#fff0bb'),
  byrek: plate
    + path('M7 16h4v-3h17v3h4v11h-3v3H12v-3H7z', ink)
    + path('M9 17h4v-2h14v3h3v8H9z', gold)
    + path('M9 26h21v2H12v-1H9zM11 20h19v2H11z', crust)
    + path('M11 24h19v1H11z', '#6f7b3b')
    + path('M12 16h2v4h-2zM18 15h2v6h-2zM24 16h2v5h-2z', '#f8d994')
    + blocks([[14,18],[21,17],[26,19]], '#a66631'),
  'tave-kosi': bowl
    + path('M8 13h24v2h3v7h-3v3H8v-3H5v-7h3z', '#885839')
    + path('M9 14h21v2h3v5h-3v2H10v-2H7v-5h2z', '#edc779')
    + path('M12 14h16v2h3v4H10v-4h2z', '#f9e3a6')
    + blocks([[13,17],[24,16],[20,20],[29,19]], '#b97540', 3, 2)
    + blocks([[16,16],[25,20]], '#895737', 3, 2) + herbs([[17,19],[22,16]]),
  fergese: bowl
    + path('M8 13h24v2h3v7h-3v3H8v-3H5v-7h3z', '#833f2d')
    + path('M9 15h22v2h2v4h-3v2H9v-2H7v-4h2z', '#c85e3b')
    + blocks([[11,17],[19,16],[26,19],[17,21]], '#e88b49', 3, 2)
    + blocks([[15,16],[23,18],[11,21],[28,16],[20,22]], '#ffe3ab', 2, 2)
    + herbs([[11,15],[20,19],[28,22]]),
  couscous: plate
    + path('M8 24v-5h3v-4h5v-3h9v3h4v4h3v6H8z', '#b38e47')
    + path('M10 23v-4h3v-4h12v3h3v4h2v3H10z', '#ebcc7d')
    + blocks([[14,19],[19,14],[23,17],[27,22],[11,23],[18,22],[21,24]], '#fff0b1')
    + path('M13 17h3v7h-3zM21 16h3v7h-3z', '#dc763d')
    + path('M18 18h2v5h-2zM26 18h2v5h-2z', green)
    + blocks([[11,20],[24,24],[17,16]], '#976236', 2, 2),
  chakhchoukha: bowl
    + path('M9 13h21v2h4v6h-3v4H9v-3H6v-7h3z', '#a64f30')
    + [[10,16],[17,13],[24,16],[14,20],[23,21]].map(([x,y]) => path(`M${x} ${y}h6v2h-2v3h-3v-2h-2v-2h1z`, '#efc788')).join('')
    + blocks([[12,18],[20,15],[28,20],[18,22]], '#d98249', 3, 2)
    + herbs([[16,17],[26,14],[23,23]]),
  mhadjeb: plate
    + path('M8 12h21v3h3v12h-3v3H9v-3H6V15h2z', ink)
    + path('M9 14h19v3h2v9h-2v2H9v-3H8v-9h1z', '#d9954e')
    + path('M11 14h15v3h2v7H10v-8h1z', '#f1c477')
    + path('M8 25h20v2H10v-1H8z', '#b65332')
    + blocks([[12,16],[20,17],[16,21],[25,22]], '#b8793b', 3, 2)
    + path('M10 15h2v7h-2zM13 14h10v1H13z', '#ffe1a0'),
  plate: plate + path('M14 13h12v3h3v9H11v-9h3z', gold) + herbs([[16,18],[24,22],[21,15]]),
};

const output = fileURLToPath(new URL('../public/assets/dish-stickers/', import.meta.url));
mkdirSync(output, {recursive: true});
for (const [name, drawing] of Object.entries(recipes)) {
  writeFileSync(`${output}${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" shape-rendering="crispEdges">${cutline}${drawing}</svg>\n`);
}
console.log(`Saved ${Object.keys(recipes).length} dish stickers.`);
