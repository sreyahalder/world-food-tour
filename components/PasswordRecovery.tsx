'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,Loader2,LockKeyhole} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {ownerAccess} from '../lib/journal-data';

export default function PasswordRecovery(){
 const [state,setState]=useState<'checking'|'ready'|'invalid'|'done'>('checking');
 const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  async function check(){
   try{
    const params=new URLSearchParams(window.location.hash.slice(1));
    if(params.has('error'))throw Error('This reset link has expired or has already been used. Request a new link from Owner login.');
    const {data,error}=await supabase().auth.getUser();
    if(error||!data.user)throw Error('Open the newest password reset link from your email. You can request another from Owner login.');
    if(!await ownerAccess())throw Error('This account doesn’t have editing access to the journal.');
    if(active)setState('ready');
   }catch(e){if(active){setError((e as Error).message);setState('invalid')}}
  }
  check();return()=>{active=false};
 },[]);
 async function save(e:React.FormEvent){
  e.preventDefault();setError('');
  if(password!==confirmation){setError('Your passwords don’t match. Please try again.');return}
  setBusy(true);
  try{
   const {error}=await supabase().auth.updateUser({password});
   if(error)throw error;
   setPassword('');setConfirmation('');setState('done');
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <main className="recovery-page"><section className="login-panel" aria-labelledby="recovery-title">
  <a className="logo" href="/"><span className="logo-mark">a.</span><span>alphabet <i>for</i> two</span></a>
  <p className="eyebrow recovery-eyebrow"><LockKeyhole size={13}/> THE OWNER’S CORNER</p>
  <h2 id="recovery-title">{state==='done'?'You’re all set.':'Choose a new password.'}</h2>
  {state==='checking'&&<p role="status"><Loader2 size={16} className="spin"/> Checking your reset link…</p>}
  {state==='ready'&&<form onSubmit={save}><p className="muted">Use at least 8 characters for your food journal password.</p><fieldset disabled={busy}>
   <label>New password<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <label>Confirm password<input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>
  </fieldset>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button dark" disabled={busy}>{busy?<Loader2 size={16} className="spin"/>:<>Save new password <ArrowRight size={16}/></>}</button></form>}
  {state==='invalid'&&<><p className="form-error" role="alert">{error}</p><a className="button dark" href="/?owner=login">Go to owner login <ArrowRight size={16}/></a></>}
  {state==='done'&&<><p role="status">Your password has been updated. You’re signed in and ready to edit.</p><a className="button dark" href="/">Back to the journal <ArrowRight size={16}/></a></>}
 </section></main>
}
