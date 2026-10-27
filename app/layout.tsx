import type {Metadata} from 'next';
import './globals.css';
import './expedition.css';
import './country-paper.css';
import './map-places.css';
import './dish-stickers.css';
import './world-food.css';
import './couple-walkers.css';
import './passport.css';
import './quest.css';
export const metadata:Metadata={title:'Alphabet City',icons:{icon:'/favicon.svg?v=globe'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preload" href="/fonts/dm-sans/dm-sans-latin-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" href="/fonts/bricolage-grotesque/bricolage-grotesque-latin-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="stylesheet" href="/vendor/leaflet.css"/></head><body>{children}</body></html>}
