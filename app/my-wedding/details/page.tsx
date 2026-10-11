"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LoaderCircle, Save, ShieldCheck } from "lucide-react";

type Wedding = {
  id: string;
  title: string;
  couple_names: string | null;
  start_date: string | null;
  venue_city: string | null;
  guest_count: number | null;
  budget: number | null;
};

export default function CoupleWeddingDetailsPage() {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [names, setNames] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [guests, setGuests] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weddings", { cache: "no-store" }).then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load wedding details");
      return payload;
    }).then(payload => {
      if (cancelled) return;
      const record = (payload.weddings || [])[0] as Wedding | undefined;
      if (!record) throw new Error("No wedding record found. Finish wedding setup first.");
      setWedding(record);
      setNames(record.couple_names || record.title);
      setDate(record.start_date || "");
      setCity(record.venue_city || "");
      setGuests(record.guest_count === null ? "" : String(record.guest_count));
      setBudget(record.budget === null ? "" : String(record.budget));
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load wedding details");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!wedding) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      const cleanNames = names.trim();
      const response = await fetch("/api/weddings/" + encodeURIComponent(wedding.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanNames + " Wedding",
          couple_names: cleanNames,
          start_date: date || null,
          venue_city: city.trim() || null,
          guest_count: guests === "" ? null : Number(guests),
          budget: budget === "" ? 0 : Number(budget),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save wedding details");
      setWedding(payload.wedding);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save wedding details");
    } finally {
      setSaving(false);
    }
  }

  return <main className="setup-shell">
    <header className="setup-topbar">
      <Link href="/my-wedding" className="setup-back"><ArrowLeft size={16}/> My wedding</Link>
      <Link href="/my-wedding" className="setup-brand"><span className="setup-brand-mark">w.</span><span>wedos</span></Link>
      <span className="setup-secure"><ShieldCheck size={15}/> Private wedding workspace</span>
    </header>
    <section className="setup-form-layout">
      <div className="setup-form-aside">
        <div className="setup-kicker">YOUR WEDDING</div>
        <h1>Keep your details up to date.</h1>
        <p>Update the essentials here. Your couple workspace stays separate from the planner’s operations dashboard.</p>
        <div className="setup-aside-note"><span className="setup-note-check">✓</span><span>Changes are saved to your wedding record</span></div>
        <div className="setup-aside-note"><span className="setup-note-check">✓</span><span>Budget and guest count update across your workspace</span></div>
      </div>
      <form className="setup-form-card" onSubmit={save}>
        <div className="setup-kicker">WEDDING DETAILS</div>
        <h2>Edit your wedding</h2>
        <p className="setup-form-description">You can return and update these details whenever plans change.</p>
        {loading ? <p>Loading wedding details…</p> : <>
          <label className="setup-field"><span>Couple names</span><input required minLength={2} maxLength={160} value={names} onChange={e => setNames(e.target.value)} placeholder="e.g. Ananya & Rahul"/></label>
          <label className="setup-field"><span>Wedding date <em>Optional</em></span><input type="date" value={date} onChange={e => setDate(e.target.value)}/></label>
          <label className="setup-field"><span>Wedding city <em>Optional</em></span><input maxLength={100} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Hyderabad"/></label>
          <label className="setup-field"><span>Estimated guest count <em>Optional</em></span><input type="number" min="0" step="1" value={guests} onChange={e => setGuests(e.target.value)} placeholder="e.g. 350"/></label>
          <label className="setup-field"><span>Estimated total budget (₹)</span><input type="number" min="0" step="1000" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 1500000"/></label>
        </>}
        {error && <div role="alert" className="setup-error">{error}</div>}
        {saved && <div role="status" className="login-success"><CheckCircle2 size={17}/> Wedding details saved.</div>}
        <button className="setup-submit" type="submit" disabled={loading || saving || !wedding}>{saving ? <><LoaderCircle size={16} className="setup-spinner"/> Saving…</> : <>Save wedding details <Save size={16}/></>}</button>
        <p className="setup-privacy"><ShieldCheck size={14}/> Only authorised workspace members can access this data.</p>
      </form>
    </section>
  </main>;
}
