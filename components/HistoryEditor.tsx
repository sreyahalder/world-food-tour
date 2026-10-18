'use client';
import {useState} from 'react';
import {X,Check} from 'lucide-react';
import {History,saveHistory,uploadPhoto} from '../lib/journal-data';
import PixelIcon from './PixelIcon';
import MediaCover from './MediaCover';
export default function HistoryEditor({code,name,history,onClose,onSave}:{code:string;name:string;history?:History;onClose:()=>void;onSave:(history:History)=>void}){
 const [value,setValue]=useState<History>(history||{text:'',url:'',title:name,attribution:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function image(file?:File){
  if(!file)return;setError('');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Choose a JPG, PNG, or WebP image.');return}
  if(file.size>6*1024*1024){setError('Choose an image under 6 MB.');return}
  setBusy(true);
  try{const url=await uploadPhoto(file);setValue(v=>({...v,image:url}))}catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await saveHistory(code,value);onSave(value)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className="overlay editor-overlay"><section className="editor-panel" role="dialog" aria-modal="true" aria-labelledby="history-editor-title"><div className="modal-top"><span className="eyebrow">History</span><button className="icon-button" aria-label="Close history editor" disabled={busy} onClick={onClose}><X/></button></div><h2 id="history-editor-title">{name}</h2><form onSubmit={save}><fieldset disabled={busy}>
 <div className="history-upload-preview"><MediaCover src={value.image} kind="history" alt={value.imageAlt||`${name} history`}/></div>
 <div className="history-image-controls"><label className="pixel-chip history-upload-label"><PixelIcon name="camera"/>{value.image?'Replace image':'Add history image'}<input aria-label="Upload history image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{image(e.target.files?.[0]);e.target.value=''}}/></label>{value.image&&<button className="text-button" type="button" onClick={()=>setValue({...value,image:'',imageAlt:''})}>Remove image</button>}</div>
 {value.image&&<label>Image description<input value={value.imageAlt||''} onChange={e=>setValue({...value,imageAlt:e.target.value})}/></label>}
 <label>Country history<textarea rows={12} required value={value.text} onChange={e=>setValue({...value,text:e.target.value})}/></label><label>Source URL<input type="url" value={value.url} onChange={e=>setValue({...value,url:e.target.value})} placeholder="https://…"/></label><label>Attribution<input value={value.attribution??'History excerpt: Wikipedia contributors, CC BY-SA 4.0.'} onChange={e=>setValue({...value,attribution:e.target.value})}/></label></fieldset>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button dark" disabled={busy}>{busy?'Saving…':'Save country history'}<Check size={16}/></button></form></section></div>
}
