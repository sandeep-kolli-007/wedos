"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Plus, Search, Users, WalletCards, X } from "lucide-react";

type Wedding = {
  id: string; title: string; couple_names: string | null; status: string;
  start_date: string | null; end_date: string | null; venue_name: string | null;
  venue_city: string | null; guest_count: number | null; budget: number; currency: string;
};
const money = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const dateLabel = (value: string | null) => value ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Dates to be confirmed";

export default function WeddingsPage() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [couple, setCouple] = useState("");
  const [startDate, setStartDate] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("0");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/weddings", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load weddings");
      setWeddings(payload.weddings ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load weddings");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function createWedding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/weddings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, couple_names: couple, start_date: startDate || null, venue_name: venue, venue_city: city, budget: Number(budget) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create wedding");
      setWeddings(prev => [...prev, payload.wedding].sort((a,b) => (a.start_date || "9999").localeCompare(b.start_date || "9999")));
      setShowCreate(false); setTitle(""); setCouple(""); setStartDate(""); setVenue(""); setCity(""); setBudget("0");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create wedding"); }
    finally { setBusy(false); }
  }

  const filtered = weddings.filter(w => (w.title + " " + (w.couple_names || "") + " " + (w.venue_city || "")).toLowerCase().includes(query.toLowerCase()));
  return <main className="weddings-page">
    <header className="weddings-topbar"><a href="/" className="back-dashboard"><ArrowLeft size={16}/> Dashboard</a><div className="weddings-top-note">WEDOS / WEDDINGS</div><a className="weddings-avatar" href="/login" title="Account">AS</a></header>
    <section className="weddings-heading"><div><div className="eyebrow">YOUR CELEBRATIONS</div><h1>Weddings</h1><p>One workspace for every couple, ceremony, vendor and moving part.</p></div><button className="btn primary" onClick={()=>setShowCreate(true)}><Plus size={15}/> New wedding</button></section>
    <section className="weddings-toolbar"><div className="weddings-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search weddings, couples or cities"/></div><span>{weddings.length} {weddings.length===1?"celebration":"celebrations"}</span></section>
    {error&&<div className="weddings-error" role="alert"><strong>Could not load your workspace data.</strong><span>{error}</span><button onClick={()=>void load()}>Try again</button>{error.includes("Sign in")&&<a href="/login">Sign in to continue</a>}</div>}
    {loading?<div className="weddings-empty">Loading your celebrations…</div>:filtered.length===0&&!error?<div className="weddings-empty"><div className="weddings-empty-icon"><CalendarDays size={25}/></div><h2>{query?"No matching weddings":"Your first celebration starts here."}</h2><p>{query?"Try another search term.":"Create a wedding workspace to keep timelines, budgets and vendor details connected."}</p><button className="btn primary" onClick={()=>setShowCreate(true)}><Plus size={15}/> Create a wedding</button></div>:<section className="weddings-grid">{filtered.map((w,index)=><article className="wedding-card" key={w.id}><div className={"wedding-card-art art-"+(index%4)}><span>{w.status.replace("_"," ")}</span><div className="wedding-art-monogram">{(w.couple_names||w.title).split(/[ &+]/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()}</div><div className="wedding-art-label">A CELEBRATION IN THE MAKING</div></div><div className="wedding-card-body"><div className="wedding-card-date"><CalendarDays size={14}/>{dateLabel(w.start_date)}</div><h2>{w.title}</h2><p className="wedding-couple">{w.couple_names||"Couple details to be added"}</p><div className="wedding-card-details"><span><MapPin size={14}/>{[w.venue_city,w.venue_name].filter(Boolean).join(" · ")||"Venue to be confirmed"}</span><span><Users size={14}/>{w.guest_count===null?"Guest count TBD":w.guest_count+" guests"}</span></div><div className="wedding-card-footer"><div><small>PLANNED BUDGET</small><strong>{money(Number(w.budget||0),w.currency||"INR")}</strong></div><button aria-label={"Open "+w.title} onClick={()=>{window.location.href="/weddings/"+w.id}}><ArrowRight size={17}/></button></div></div></article>)}</section>}
    {showCreate&&<div className="wedding-modal-overlay" onClick={()=>setShowCreate(false)}><form className="wedding-modal" onSubmit={createWedding} onClick={e=>e.stopPropagation()}><div className="wedding-modal-head"><div><div className="eyebrow">NEW CELEBRATION</div><h2>Create a wedding</h2></div><button type="button" className="icon-btn" onClick={()=>setShowCreate(false)} aria-label="Close"><X size={17}/></button></div><label htmlFor="w-title">Wedding or project name *</label><input id="w-title" required minLength={2} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Mehra Wedding"/><label htmlFor="w-couple">Couple names</label><input id="w-couple" value={couple} onChange={e=>setCouple(e.target.value)} placeholder="e.g. Ananya & Rohan"/><div className="wedding-form-grid"><div><label htmlFor="w-date">Wedding date</label><input id="w-date" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div><div><label htmlFor="w-budget">Planned budget (₹)</label><input id="w-budget" type="number" min="0" step="1000" value={budget} onChange={e=>setBudget(e.target.value)}/></div></div><label htmlFor="w-venue">Venue</label><input id="w-venue" value={venue} onChange={e=>setVenue(e.target.value)} placeholder="Venue or resort name"/><label htmlFor="w-city">City</label><input id="w-city" value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Hyderabad"/>{error&&<div className="weddings-error">{error}</div>}<div className="wedding-modal-actions"><button type="button" className="btn" onClick={()=>setShowCreate(false)}>Cancel</button><button type="submit" className="btn primary" disabled={busy}>{busy?"Creating…":<>Create wedding <ArrowRight size={15}/></>}</button></div></form></div>}
  </main>;
}
