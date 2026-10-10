"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + "/auth/callback?next=/onboarding" },
      });
      if (authError) throw authError;
      setMessage("Magic link sent. Check your inbox to securely sign in.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send sign-in link.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-layout">
    <section className="login-brand-panel">
      <div className="login-brand"><span className="login-mark">w.</span> wedos</div>
      <div className="login-brand-copy">
        <div className="login-eyebrow">THE PLANNER'S WORKSPACE</div>
        <h1>Make room<br/>for the magic.</h1>
        <p>Every celebration has a thousand moving parts. Keep the people, plans, budgets and creative details moving together.</p>
        <div className="login-features"><span>✓ Wedding operations</span><span>✓ Vendor coordination</span><span>✓ Design approvals</span></div>
      </div>
      <div className="login-footer">A calmer command centre for unforgettable celebrations.</div>
    </section>
    <section className="login-form-panel"><div className="login-form-wrap">
      <div className="login-shield"><ShieldCheck size={22}/></div>
      <div className="login-form-eyebrow">WELCOME TO WEDOS</div>
      <h2>Sign in to your studio</h2>
      <p className="login-intro">Enter your work email. We'll send you a secure sign-in link—no password to remember.</p>
      <form onSubmit={submit}>
        <label htmlFor="email">Work email</label>
        <div className="login-input-wrap"><Mail size={17}/><input id="email" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@yourstudio.com"/></div>
        <button className="login-submit" disabled={busy} type="submit">{busy?"Sending link…":<>Email me a sign-in link <ArrowRight size={15}/></>}</button>
      </form>
      {message&&<div role="status" className="login-success"><CheckCircle2 size={17}/>{message}</div>}
      {error&&<div role="alert" className="login-error">{error}</div>}
      <p className="login-privacy">Your studio data is private to your workspace. Access is controlled by your organisation's membership.</p>
      <a className="login-back" href="/">← Back to dashboard preview</a>
    </div></section>
  </main>;
}
