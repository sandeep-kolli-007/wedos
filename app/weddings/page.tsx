"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Plus, Search, Users, X, Heart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Wedding = { id: string; title: string; couple_names: string | null; status: string; start_date: string | null; end_date: string | null; venue_name: string | null; venue_city: string | null; guest_count: number | null; budget: number; currency: string };
const money = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const dateLabel = (value: string | null) => value ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date to be confirmed";

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
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load weddings"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function createWedding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/weddings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, couple_names: couple, start_date: startDate || null, venue_name: venue, venue_city: city, budget: Number(budget) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create wedding");
      setWeddings(prev => [...prev, payload.wedding].sort((a,b) => (a.start_date || "9999").localeCompare(b.start_date || "9999")));
      setShowCreate(false); setTitle(""); setCouple(""); setStartDate(""); setVenue(""); setCity(""); setBudget("0");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create wedding"); }
    finally { setBusy(false); }
  }
  const filtered = useMemo(() => weddings.filter(w => (w.title + " " + (w.couple_names || "") + " " + (w.venue_city || "")).toLowerCase().includes(query.toLowerCase())), [weddings, query]);

  return <main className="min-h-screen bg-neutral-50 text-neutral-900">
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"><ArrowLeft size={15}/> Back to overview</Link>
      <span className="hidden text-[10px] font-semibold tracking-[.15em] text-neutral-400 sm:inline">WEDOS / WEDDINGS</span>
      <Link href="/settings" className="grid size-8 place-items-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-700">AS</Link>
    </header>
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">Your celebrations</div><h1 className="text-3xl font-semibold tracking-[-1.2px]">Weddings</h1><p className="mt-2 text-sm text-neutral-500">One connected workspace for every couple, ceremony, vendor and decision.</p></div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16}/> New wedding</Button>
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search weddings, couples or cities" className="pl-9"/></label>
        <span className="text-xs text-neutral-500">{filtered.length} {filtered.length === 1 ? "wedding" : "weddings"}</span>
      </div>
      {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw size={13}/> Try again</Button></div>}
      {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-72 animate-pulse rounded-xl border border-neutral-200 bg-white p-4"><div className="h-28 rounded-lg bg-neutral-100"/><div className="mt-5 h-4 w-1/2 rounded bg-neutral-100"/><div className="mt-3 h-3 w-2/3 rounded bg-neutral-100"/></div>)}</div>
      : filtered.length === 0 ? <div className="flex min-h-[330px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 text-center"><span className="grid size-12 place-items-center rounded-xl bg-neutral-100"><Heart size={21} className="text-neutral-600"/></span><h2 className="mt-4 text-base font-semibold">{query ? "No matching weddings" : "Start with your first wedding"}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">{query ? "Try another name, couple or city." : "Create a workspace to connect timelines, budgets, guest lists and vendors."}</p>{!query && <Button className="mt-5" onClick={() => setShowCreate(true)}><Plus size={15}/> Create a wedding</Button>}</div>
      : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((w,index)=><Card key={w.id} className="overflow-hidden transition-shadow hover:shadow-md">
        <div className={`relative flex h-28 items-center justify-between overflow-hidden border-b border-neutral-100 px-5 ${["bg-neutral-100","bg-stone-100","bg-zinc-100"][index%3]}`}>
          <div className="absolute -right-8 -top-16 size-48 rounded-full border border-neutral-300/70"/><div className="absolute -right-2 -top-10 size-36 rounded-full border border-neutral-300/60"/>
          <div className="relative"><Badge variant="outline" className="capitalize">{(w.status || "planning").replaceAll("_"," ")}</Badge><p className="mt-3 text-[10px] font-semibold tracking-[.16em] text-neutral-500">WEDDING PROJECT</p></div>
          <div className="relative grid size-14 place-items-center rounded-xl border border-neutral-300/70 bg-white/80 text-lg font-medium tracking-tight text-neutral-700">{(w.couple_names||w.title).split(/[ &+]/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()}</div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-neutral-500"><CalendarDays size={14}/>{dateLabel(w.start_date)}</div>
          <h2 className="mt-3 truncate text-base font-semibold tracking-tight">{w.title}</h2><p className="mt-1 truncate text-xs text-neutral-500">{w.couple_names || "Couple details to be added"}</p>
          <div className="mt-4 space-y-2.5 border-y border-neutral-100 py-3 text-xs text-neutral-600"><p className="flex items-center gap-2"><MapPin size={14} className="shrink-0 text-neutral-400"/><span className="truncate">{[w.venue_city,w.venue_name].filter(Boolean).join(" · ") || "Venue to be confirmed"}</span></p><p className="flex items-center gap-2"><Users size={14} className="shrink-0 text-neutral-400"/>{w.guest_count == null ? "Guest count not set" : `${w.guest_count} guests`}</p></div>
          <div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Planned budget</p><p className="mt-1 text-base font-semibold tracking-tight">{money(Number(w.budget||0),w.currency||"INR")}</p></div><Button variant="outline" size="sm" onClick={()=>window.location.href="/weddings/"+w.id}>Open project <ArrowRight size={14}/></Button></div>
        </div>
      </Card>)}</div>}
    </div>
    {showCreate && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-neutral-950/30 p-4 backdrop-blur-[2px]" onMouseDown={event=>{if(event.target===event.currentTarget)setShowCreate(false);}}>
      <form onSubmit={createWedding} className="my-5 w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">New celebration</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Create a wedding</h2><p className="mt-1 text-xs text-neutral-500">You can add ceremonies, guests and vendors later.</p></div><Button variant="ghost" size="icon" aria-label="Close" onClick={()=>setShowCreate(false)}><X size={16}/></Button></div>
        <div className="space-y-4"><div><label htmlFor="w-title" className="mb-1.5 block text-xs font-medium">Wedding or project name *</label><Input id="w-title" required minLength={2} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Mehra Wedding"/></div>
        <div><label htmlFor="w-couple" className="mb-1.5 block text-xs font-medium">Couple names</label><Input id="w-couple" value={couple} onChange={e=>setCouple(e.target.value)} placeholder="e.g. Ananya & Rohan"/></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="w-date" className="mb-1.5 block text-xs font-medium">Wedding date</label><Input id="w-date" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div><div><label htmlFor="w-budget" className="mb-1.5 block text-xs font-medium">Planned budget (₹)</label><Input id="w-budget" type="number" min="0" step="1000" value={budget} onChange={e=>setBudget(e.target.value)}/></div></div>
        <div><label htmlFor="w-venue" className="mb-1.5 block text-xs font-medium">Venue</label><Input id="w-venue" value={venue} onChange={e=>setVenue(e.target.value)} placeholder="Venue or resort name"/></div>
        <div><label htmlFor="w-city" className="mb-1.5 block text-xs font-medium">City</label><Input id="w-city" value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Hyderabad"/></div></div>
        <div className="mt-6 flex justify-end gap-2 border-t border-neutral-100 pt-4"><Button variant="outline" onClick={()=>setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Creating…" : <>Create wedding <ArrowRight size={14}/></>}</Button></div>
      </form>
    </div>}
  </main>;
}
