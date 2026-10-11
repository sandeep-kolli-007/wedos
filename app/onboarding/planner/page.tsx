"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck, UsersRound } from "lucide-react";

export default function PlannerSetupPage() {
  const [studio, setStudio] = useState("");
  const [bride, setBride] = useState("");
  const [groom, setGroom] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/workspace", { cache: "no-store" })
      .then(async response => response.ok ? response.json() : null)
      .then(payload => { if (payload?.membership) window.location.replace("/weddings"); })
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const names = [bride.trim(), groom.trim()].filter(Boolean).join(" & ");
      const workspaceResponse = await fetch("/api/workspace", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:studio.trim()}) });
      const workspacePayload = await workspaceResponse.json();
      if (!workspaceResponse.ok) throw new Error(workspacePayload.error || "Unable to create your workspace");
      const weddingResponse = await fetch("/api/weddings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({title:names + " Wedding", couple_names:names, start_date:date || undefined, venue_city:city.trim() || undefined}) });
      const weddingPayload = await weddingResponse.json();
      if (!weddingResponse.ok) throw new Error(weddingPayload.error || "Your workspace was created, but the wedding details could not be saved. Please continue from Weddings.");
      localStorage.setItem("wedos-persona", "planner");
      window.location.assign("/weddings");
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
        <div className="setup-choice-icon"><UsersRound size={22}/></div>
        <div className="setup-kicker">FOR EVENT PLANNERS · STEP 1 OF 2</div>
        <h1>Create a wedding space for your clients.</h1>
        <p>Set up the couple&apos;s wedding record first. The couple-facing experience can be shared with them as collaboration and access controls are enabled.</p>
        <div className="setup-aside-note"><span className="setup-note-check">✓</span><span>Keep this wedding&apos;s details together</span></div>
        <div className="setup-aside-note"><span className="setup-note-check">✓</span><span>Add ceremonies, vendors and schedules later</span></div>
        <div className="setup-aside-note"><span className="setup-note-check">✓</span><span>Manage client weddings in your workspace</span></div>
      </div>
      <form className="setup-form-card" onSubmit={submit}>
        <div className="setup-kicker">PLANNER & COUPLE DETAILS</div>
        <h2>Set up your first wedding</h2>
        <p className="setup-form-description">Your studio workspace and this wedding are created separately.</p>
        <label className="setup-field"><span>Studio or business name</span><input required minLength={2} maxLength={80} value={studio} onChange={e=>setStudio(e.target.value)} placeholder="e.g. Atelier Celebrations"/></label>
        <div className="setup-two-fields">
          <label className="setup-field"><span>Bride&apos;s name</span><input required maxLength={80} value={bride} onChange={e=>setBride(e.target.value)} placeholder="e.g. Ananya"/></label>
          <label className="setup-field"><span>Groom&apos;s name</span><input required maxLength={80} value={groom} onChange={e=>setGroom(e.target.value)} placeholder="e.g. Rahul"/></label>
        </div>
        <label className="setup-field"><span>Wedding date <em>Optional</em></span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
        <label className="setup-field"><span>Wedding city <em>Optional</em></span><input maxLength={100} value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Hyderabad"/></label>
        {error&&<div role="alert" className="setup-error">{error}</div>}
        <button className="setup-submit" type="submit" disabled={busy}>{busy?<><LoaderCircle size={16} className="setup-spinner"/> Creating wedding…</>:<>Create wedding workspace <ArrowRight size={16}/></>}</button>
        <p className="setup-privacy"><ShieldCheck size={14}/> Only authorised workspace members can access this data.</p>
      </form>
    </section>
  </main>;
}
