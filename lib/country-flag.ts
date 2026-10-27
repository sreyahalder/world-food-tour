export function countryFlag(code:string):string {
 const normalized=code.toUpperCase();
 return /^[A-Z]{2}$/.test(normalized)
  ? String.fromCodePoint(...[...normalized].map(letter=>127397+letter.charCodeAt(0)))
  : '🌍';
}
