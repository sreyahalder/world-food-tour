export type PixelIconName='book'|'restaurant'|'menu'|'directions'|'globe'|'capital'|'pin'|'camera';
export default function PixelIcon({name}:{name:PixelIconName}){return <img className="pixel-icon" src={`/assets/pixel-icons/${name}.svg`} width={20} height={20} alt="" aria-hidden="true"/>}
