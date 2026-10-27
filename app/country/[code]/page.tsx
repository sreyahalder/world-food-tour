import Journal from '../../../components/Journal';
import countries from '../../../lib/countries.json';
import {notFound} from 'next/navigation';
export async function generateMetadata({params}:{params:Promise<{code:string}>}){const {code}=await params;const c=countries.find(x=>x.code===code.toUpperCase());return {title:`${c?.name||'Country'} | Alphabet City`}}
export default async function Page({params}:{params:Promise<{code:string}>}){const {code}=await params;if(!countries.some(x=>x.code===code.toUpperCase()))notFound();return <Journal initialCountry={code.toUpperCase()}/>}
