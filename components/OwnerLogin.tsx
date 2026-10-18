'use client';
import {useState} from 'react';
import {X,ArrowRight,Loader2,LockKeyhole} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {ownerAccess} from '../lib/journal-data';

export default function OwnerLogin({onClose,onLogin}:{onClose:()=>void;onLogin:()=>void}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [reset,setReset]=useState(false),[sent,setSent]=useState(false);
 function changeMode(value:boolean){setReset(value);setSent(false);setError('');setPassword('')}
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   if(reset){
    const {error}=await supabase().auth.resetPasswordForEmail(email.trim(),{redirectTo:new URL('/account/recovery',window.location.origin).href});
    if(error)throw error;
    setSent(true);
   }else{
    const {error}=await supabase().auth.signInWithPassword({email:email.trim(),password});
    if(error)throw error;
    if(!await ownerAccess()){await supabase().auth.signOut();throw Error('This account doesn’t have editing access to the journal.')}
    setPassword('');onLogin();
   }
  }catch(e){const message=(e as Error).message;setError(message==='Invalid login credentials'?'That email and password didn’t match. Use “Forgot password?” to set a new password.':message)}
  finally{setBusy(false)}
 }
 return <div className="overlay login-overlay" onClick={e=>e.target===e.currentTarget&&!busy&&onClose()}>
  <section className="login-panel" role="dialog" aria-modal="true" aria-labelledby="login-title">
   <div className="modal-top"><span className="eyebrow"><LockKeyhole size={13}/> THE OWNER’S CORNER</span><button className="icon-button" aria-label="Close sign in" onClick={onClose} disabled={busy}><X/></button></div>
   <h2 id="login-title">{reset?'A fresh start.':'Welcome back.'}</h2>
   {sent?<p role="status">If there’s an account for {email.trim()}, a password reset link is on its way. Check your inbox and spam folder, then open the newest link to choose a new password.</p>:<>
    <p className="muted">{reset?'Enter your account email and we’ll send a link to choose a new password.':'Sign in to add a chapter, upload photos, or polish your tasting notes.'}</p>
    <form onSubmit={submit}>
     <fieldset disabled={busy}>
      <label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      {!reset&&<label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>}
     </fieldset>
     {error&&<p className="form-error" role="alert">{error}</p>}
     <button className="button dark" disabled={busy}>{busy?<Loader2 size={16} className="spin"/>:<>{reset?'Send reset link':'Sign in'} <ArrowRight size={16}/></>}</button>
    </form>
   </>}
   <button className="text-button auth-mode-button" disabled={busy} onClick={()=>changeMode(!reset)}>{reset?'Back to sign in':'Forgot password?'}</button>
   <p className="field-note">This is your food journal account. It has its own password, separate from your Supabase dashboard login.</p>
  </section>
 </div>
}
