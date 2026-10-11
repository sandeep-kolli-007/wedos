"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Search } from "lucide-react";

type Wedding = { id: string; title: string; currency: string };
type Event = { id: string; title: string; event_type?: string; starts_at?: string | null; venue_name?: string | null };
type Task = { id: string; title: string; status?: string; priority?: string; due_at?: string | null };
type Detail = { wedding: Wedding; events: Event[]; tasks: Task[] };
type Item = { id: string; title: string; wedding: Wedding; date: string | null; kind: "event" | "task"; meta: string; status: string };
const dateKey = (date: string | null) => date ? date.slice(0, 10) : "unscheduled";
const labelDate = (date: string | null) => date ? new Date(date).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Date to be confirmed";

export default function TimelinePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("Everything");
  const [range, setRange] = useState("All dates");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/weddings", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load timeline");
        const weddings: Wedding[] = payload.weddings || [];
        const groups = await Promise.all(weddings.map(async wedding => {
          const r = await fetch("/api/weddings/" + encodeURIComponent(wedding.id), { cache: "no-store" });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "Unable to load timeline");
          const detail = data as Detail;
          return [
            ...detail.events.map(event => ({ id: event.id, title: event.title, wedding, date: event.starts_at || null, kind: "event" as const, meta: [event.event_type, event.venue_name].filter(Boolean).join(" · "), status: "Scheduled" })),
            ...detail.tasks.map(task => ({ id: task.id, title: task.title, wedding, date: task.due_at || null, kind: "task" as const, meta: "Priority: " + (task.priority || "normal"), status: task.status || "todo" }))
          ];
        }));
        if (!cancelled) setItems(groups.flat().sort((a,b) => (a.date || "9999").localeCompare(b.date || "9999")));
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load timeline"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, []);
  const filtered = useMemo(() => items.filter(item => {
    const matchesQuery = (item.title + " " + item.wedding.title + " " + item.meta).toLowerCase().includes(query.toLowerCase());
    const matchesKind = kind === "Everything" || item.kind === kind.toLowerCase();
    const now = new Date(); const date = item.date ? new Date(item.date) : null;
    const matchesRange = range === "All dates" || (date && (range === "Next 7 days" ? date >= new Date(now.getFullYear(),now.getMonth(),now.getDate()) && date <= new Date(now.getFullYear(),now.getMonth(),now.getDate()+7) : range === "Overdue" ? date < new Date(now.getFullYear(),now.getMonth(),now.getDate()) && item.kind === "task" && item.status !== "done" : date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()));
    return matchesQuery && matchesKind && Boolean(matchesRange);
  }), [items, query, kind, range]);
  const groups = useMemo(() => filtered.reduce<Record<string, Item[]>>((result, item) => { const key = dateKey(item.date); (result[key] ||= []).push(item); return result; }, {}), [filtered]);
  return <main style={{ minHeight: "100vh", background: "#f8f8f5", color: "#202322", padding: "24px clamp(16px,4vw,56px) 60px", fontFamily: "DM Sans, sans-serif" }}>
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: "1px solid #e6e8e2", paddingBottom: 18 }}><Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}><ArrowLeft size={16}/> Dashboard</Link><span style={{ letterSpacing: 2, fontSize: 11, color: "#718075" }}>WEDOS / TIMELINE</span><Link href="/weddings" style={{ fontSize: 12, fontWeight: 700, color: "#244b3c" }}>All weddings ↗</Link></header>
    <section style={{ padding: "32px 0 24px" }}><div style={{ color: "#8b9189", fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>ONE CONNECTED SCHEDULE</div><h1 style={{ fontSize: "clamp(30px,4vw,44px)", letterSpacing: -1.5, margin: "8px 0" }}>Timeline</h1><p style={{ color: "#777e76", fontSize: 14, margin: 0 }}>Ceremonies, deadlines and planning tasks across every wedding.</p></section>
    <section style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}><label style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 240px", background: "white", border: "1px solid #e4e7e0", borderRadius: 10, padding: "0 12px" }}><Search size={16} color="#8b9189"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search timeline" style={{ border: 0, outline: 0, padding: 13, width: "100%", background: "transparent", fontSize: 13 }}/></label><select value={kind} onChange={event => setKind(event.target.value)} style={{ background: "white", border: "1px solid #e4e7e0", borderRadius: 10, padding: "0 12px", minHeight: 44 }}>{["Everything","Event","Task"].map(value => <option key={value}>{value}</option>)}</select><select value={range} onChange={event => setRange(event.target.value)} style={{ background: "white", border: "1px solid #e4e7e0", borderRadius: 10, padding: "0 12px", minHeight: 44 }}>{["All dates","This month","Next 7 days","Overdue"].map(value => <option key={value}>{value}</option>)}</select></section>
    {error && <div role="alert" style={{ background: "#f9e8e4", color: "#873d32", borderRadius: 10, padding: 14, marginBottom: 14 }}>{error} <Link href="/login" style={{ textDecoration: "underline" }}>Sign in</Link></div>}
    <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 14 }}>{loading ? <div style={{ padding: 24, background: "white", borderRadius: 12 }}>Loading events and tasks…</div> : filtered.length === 0 ? <div style={{ padding: "46px 20px", textAlign: "center", background: "white", border: "1px solid #e6e8e2", borderRadius: 14 }}><CalendarDays size={28} color="#64816e"/><h2 style={{ fontSize: 19 }}>Nothing on this timeline yet</h2><p style={{ color: "#777e76", fontSize: 13 }}>Add an event or task inside a wedding workspace and it will appear here.</p><Link href="/weddings" style={{ display: "inline-block", background: "#244b3c", color: "white", padding: "11px 15px", borderRadius: 8, fontSize: 12 }}>Open weddings</Link></div> : Object.entries(groups).map(([date, entries]) => <article key={date} style={{ background: "white", border: "1px solid #e6e8e2", borderRadius: 14, overflow: "hidden" }}><header style={{ padding: "13px 17px", background: "#fbfbf9", borderBottom: "1px solid #eff0ec", display: "flex", alignItems: "center", gap: 8, color: "#617667", fontSize: 12, fontWeight: 700 }}><CalendarDays size={15}/>{date === "unscheduled" ? "Unscheduled" : new Date(date + "T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}<span style={{ marginLeft: "auto", color: "#858b83", fontWeight: 500 }}>{entries.length} item{entries.length===1?"":"s"}</span></header>{entries.map(item => <div key={item.kind + item.id} style={{ padding: "16px 18px", borderBottom: "1px solid #f0f1ed", display: "grid", gridTemplateColumns: "34px minmax(0,1fr) auto", gap: 12, alignItems: "center" }}><div style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, background: item.kind === "event" ? "#f4e8dc" : "#e5eee8", color: "#244b3c" }}>{item.kind === "event" ? <CalendarDays size={16}/> : <Clock3 size={16}/>}</div><div><strong style={{ fontSize: 13 }}>{item.title}</strong><div style={{ color: "#777e76", fontSize: 11, marginTop: 5 }}>{labelDate(item.date)}{item.meta ? " · " + item.meta : ""}</div><Link href={"/weddings/" + item.wedding.id} style={{ display: "inline-block", color: "#244b3c", fontSize: 11, fontWeight: 700, marginTop: 6 }}>{item.wedding.title} ↗</Link></div><span style={{ fontSize: 10, padding: "5px 8px", borderRadius: 6, background: item.kind === "event" ? "#f5edcf" : item.status === "done" ? "#e3efe6" : "#eff0ec", textTransform: "capitalize" }}>{item.status.replace("_"," ")}</span></div>)}</article>)}</section>
  </main>;
}
