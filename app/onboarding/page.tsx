"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Building2, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create your workspace");
      setDone(true);
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create your workspace");
    } finally {
      setBusy(false);
    }
  }

  return <main className="onboarding-shell"><div className="onboarding-card">
    <div className="onboarding-icon"><Building2 size={24}/></div>
    <div className="login-form-eyebrow">LET'S SET UP YOUR STUDIO</div>
    <h1>Create your workspace</h1>
    <p>Start with your planning studio name. You can invite your team and organise weddings next.</p>
    <form onSubmit={submit}><label htmlFor="studio-name">Studio or company name</label><input id="studio-name" required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Atelier Celebrations"/><button disabled={busy||done} type="submit">{busy?"Creating workspace…":done?"Workspace created":<>Create workspace <ArrowRight size={16}/></>}</button></form>
    {error&&<div role="alert" className="login-error">{error}</div>}
    {done&&<div className="login-success"><CheckCircle2 size={17}/>Workspace created. Opening your dashboard…</div>}
    <div className="onboarding-note">Your workspace is private. Only invited members can access its planning data.</div>
  </div></main>;
}
