'use client';
import {useState} from 'react';
import {X,Check} from 'lucide-react';
import {History,saveHistory} from '../lib/journal-data';
export default function HistoryEditor({code,name,history,onClose,onSave}:{code:string;name:string;history?:History;onClose:()=>void;onSave:(history:History)=>void}){
 const [value,setValue]=useState<History>(history||{text:'',url:'',title:name,attribution:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await saveHistory(code,value);onSave(value)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className="overlay editor-overlay"><section className="editor-panel" role="dialog" aria-modal="true" aria-labelledby="history-editor-title"><div className="modal-top"><span className="eyebrow">History</span><button className="icon-button" aria-label="Close history editor" disabled={busy} onClick={onClose}><X/></button></div><h2 id="history-editor-title">{name}</h2><form onSubmit={save}><fieldset disabled={busy}>
 <label>Country history<textarea rows={12} required value={value.text} onChange={e=>setValue({...value,text:e.target.value})}/></label><label>Source URL<input type="url" value={value.url} onChange={e=>setValue({...value,url:e.target.value})} placeholder="https://…"/></label><label>Attribution<input value={value.attribution??'History excerpt: Wikipedia contributors, CC BY-SA 4.0.'} onChange={e=>setValue({...value,attribution:e.target.value})}/></label></fieldset>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button dark" disabled={busy}>{busy?'Saving…':'Save country history'}<Check size={16}/></button></form></section></div>
}
