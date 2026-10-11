"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart, LoaderCircle, ShieldCheck } from "lucide-react";

export default function CoupleSetupPage() {
  const [bride, setBride] = useState("");
  const [groom, setGroom] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/workspace", { cache: "no-store" })
      .then(async response => response.ok ? response.json() : null)
      .then(payload => { if (payload?.membership) window.location.replace("/my-wedding"); })
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const names = [bride.trim(), groom.trim()].filter(Boolean).join(" & ");
      const workspaceResponse = await fetch("/api/workspace", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:names + " Wedding"}) });
      const workspacePayload = await workspaceResponse.json();
      if (!workspaceResponse.ok) throw new Error(workspacePayload.error || "Unable to create your wedding space");
      const weddingResponse = await fetch("/api/weddings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({title:names + " Wedding", couple_names:names, start_date:date || undefined, venue_city:city.trim() || undefined, budget:budget ? Number(budget) : 0}) });
      const weddingPayload = await weddingResponse.json();
      if (!weddingResponse.ok) throw new Error(weddingPayload.error || "Your wedding space was created, but the wedding details could not be saved. Please continue from Weddings.");
      localStorage.setItem("wedos-persona", "couple");
      window.location.assign("/my-wedding");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to finish setup. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="setup-shell">
    <header className="setup-topbar">
      <Link href="/onboarding" className="setup-back"><ArrowLeft size={16}/> Back</Link>
      <Link href="/login" className="setup-brand"><span className="setup-brand-mark">w.</span><span>wedos</span></Link>
      <span className="setup-secure"><ShieldCheck size={15}/> Private by design</span>
    </header>
    <section className="setup-form-layout">
      <div className="setup-form-aside">
        <div className="setup-choice-icon"><Heart size={22}/></div>
        <div className="setup-kicker">YOUR WEDDING · STEP 1 OF 2</div>
        <h1>Start with the two of you.</h1>
        <p>We&apos;ll create one shared wedding space. You can add ceremonies, guests, budget details and invite your partner next.</p>
        <div className="setup-aside-note"><span className="setup-note-check">✓</span><span>One place for plans, decisions and details</span></div>
        <div className="setup-aside-note"><span className="setup-note-check">✓</span><span>Invite family when you&apos;re ready</span></div>
        <div className="setup-aside-note"><span className="setup-note-check">✓</span><span>Keep control of who can access your wedding</span></div>
      </div>
      <form className="setup-form-card" onSubmit={submit}>
        <div className="setup-kicker">WEDDING DETAILS</div>
        <h2>Tell us about your wedding</h2>
        <p className="setup-form-description">You can change these details any time.</p>
        <div className="setup-two-fields">
          <label className="setup-field"><span>Bride&apos;s name</span><input required maxLength={80} value={bride} onChange={e=>setBride(e.target.value)} placeholder="e.g. Ananya"/></label>
          <label className="setup-field"><span>Groom&apos;s name</span><input required maxLength={80} value={groom} onChange={e=>setGroom(e.target.value)} placeholder="e.g. Rahul"/></label>
        </div>
        <label className="setup-field"><span>Wedding date <em>Optional</em></span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
        <label className="setup-field"><span>Wedding city <em>Optional</em></span><input maxLength={100} value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Hyderabad"/></label>
        <label className="setup-field"><span>Estimated total budget (₹) <em>Optional</em></span><input type="number" min="0" step="1000" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. 1500000"/></label>
        {error&&<div role="alert" className="setup-error">{error}</div>}
        <button className="setup-submit" type="submit" disabled={busy}>{busy?<><LoaderCircle size={16} className="setup-spinner"/> Creating your wedding…</>:<>Create our wedding space <ArrowRight size={16}/></>}</button>
        <p className="setup-privacy"><ShieldCheck size={14}/> Your wedding details are private to your workspace.</p>
      </form>
    </section>
  </main>;
}
