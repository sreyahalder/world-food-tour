import type {Metadata} from 'next';
import './globals.css';
import './expedition.css';
export const metadata:Metadata={title:'Alphabet for Two — A world of food, one letter at a time',description:'Two people, 195 countries, one city. A food journal exploring the world in alphabetical order, from New York.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Pixelify+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet"/><link rel="stylesheet" href="/vendor/leaflet.css"/></head><body>{children}</body></html>}
