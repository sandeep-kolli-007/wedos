"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search, Users, WalletCards } from "lucide-react";

type Wedding = { id: string; title: string; currency: string; budget: number };
type Booking = { id: string; title: string; service_description: string; quoted_amount: number; final_amount: number | null; status: string; vendors: { business_name: string; category: string } | null };
type Detail = { wedding: Wedding; vendor_bookings: Booking[] };
const money = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const pill: Record<string, string> = { proposed: "#f6eddb", quoted: "#e9e5f5", confirmed: "#e3efe6", completed: "#e3efe6", cancelled: "#f6e5e2" };

export default function VendorsPage() {
  const [rows, setRows] = useState<Array<Booking & { wedding: Wedding }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/weddings", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load weddings");
        const weddings: Wedding[] = payload.weddings || [];
        const details = await Promise.all(weddings.map(async wedding => {
          const result = await fetch("/api/weddings/" + encodeURIComponent(wedding.id), { cache: "no-store" });
          const data = await result.json();
          if (!result.ok) throw new Error(data.error || "Unable to load vendor bookings");
          return (data as Detail).vendor_bookings.map(booking => ({ ...booking, wedding }));
        }));
        if (!cancelled) setRows(details.flat());
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load vendors"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, []);
  const categories = useMemo(() => ["All categories", ...Array.from(new Set(rows.map(row => row.vendors?.category).filter((value): value is string => Boolean(value)))).sort()], [rows]);
  const filtered = rows.filter(row => ((row.vendors?.business_name || row.title) + " " + (row.vendors?.category || "") + " " + row.wedding.title).toLowerCase().includes(query.toLowerCase()) && (category === "All categories" || row.vendors?.category === category));
  const committed = rows.filter(row => !["cancelled"].includes(row.status)).reduce((sum, row) => sum + Number(row.final_amount ?? row.quoted_amount ?? 0), 0);
  const confirmed = rows.filter(row => ["confirmed", "completed"].includes(row.status)).length;
  return <main style={{ minHeight: "100vh", background: "#f8f8f5", color: "#202322", padding: "24px clamp(16px,4vw,56px) 60px", fontFamily: "DM Sans, sans-serif" }}>
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: "1px solid #e6e8e2", paddingBottom: 18 }}><Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}><ArrowLeft size={16}/> Dashboard</Link><span style={{ letterSpacing: 2, fontSize: 11, color: "#718075" }}>WEDOS / VENDORS</span><Link href="/weddings" style={{ fontSize: 12, fontWeight: 700, color: "#244b3c" }}>Wedding workspaces ↗</Link></header>
    <section style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 18, padding: "32px 0 24px" }}><div><div style={{ color: "#8b9189", fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>CONNECTED OPERATIONS</div><h1 style={{ fontSize: "clamp(30px,4vw,44px)", letterSpacing: -1.5, margin: "8px 0" }}>Vendor directory</h1><p style={{ color: "#777e76", fontSize: 14, margin: 0 }}>Every booking, quote and commitment across your celebrations.</p></div><Link href="/weddings" style={{ background: "#244b3c", color: "white", borderRadius: 9, padding: "12px 15px", fontSize: 12, fontWeight: 700 }}>Add vendor from a wedding</Link></section>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 22 }}><Metric icon={<Users size={17}/>} label="Vendor bookings" value={String(rows.length)} note="Across all weddings"/><Metric icon={<WalletCards size={17}/>} label="Quoted / committed" value={money(committed)} note="Excludes cancelled bookings"/><Metric icon={<ArrowUpRight size={17}/>} label="Confirmed services" value={String(confirmed)} note="Confirmed or completed"/></section>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}><label style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 260px", background: "white", border: "1px solid #e4e7e0", borderRadius: 10, padding: "0 12px" }}><Search size={16} color="#8b9189"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search vendor, category or wedding" style={{ border: 0, outline: 0, padding: 13, width: "100%", background: "transparent", fontSize: 13 }}/></label><select value={category} onChange={event => setCategory(event.target.value)} style={{ background: "white", border: "1px solid #e4e7e0", borderRadius: 10, padding: "0 12px", minHeight: 44 }}>{categories.map(item => <option key={item}>{item}</option>)}</select></div>
    {error && <div role="alert" style={{ background: "#f9e8e4", color: "#873d32", borderRadius: 10, padding: 14, marginBottom: 14 }}>{error} <a href="/login" style={{ textDecoration: "underline" }}>Sign in</a></div>}
    <section style={{ background: "white", border: "1px solid #e6e8e2", borderRadius: 14, overflow: "hidden" }}>{loading ? <p style={{ padding: 24, color: "#777e76" }}>Loading vendor bookings…</p> : filtered.length === 0 ? <div style={{ padding: "48px 24px", textAlign: "center" }}><Users size={28} color="#64816e"/><h2 style={{ fontSize: 19, marginBottom: 8 }}>{query ? "No matching vendors" : "Your vendor network starts with a booking"}</h2><p style={{ color: "#777e76", fontSize: 13 }}>Open a wedding workspace to add vendors, compare quotes and record commitments.</p><Link href="/weddings" style={{ display: "inline-block", marginTop: 8, background: "#244b3c", color: "white", padding: "11px 15px", borderRadius: 8, fontSize: 12 }}>Open weddings</Link></div> : <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", width: "100%", minWidth: 700, fontSize: 12 }}><thead><tr style={{ textAlign: "left", color: "#858b83", background: "#fbfbf9" }}>{["VENDOR / SERVICE","WEDDING","QUOTE","STATUS",""].map(label => <th key={label} style={{ padding: 15, fontSize: 10, letterSpacing: 1, fontWeight: 700 }}>{label}</th>)}</tr></thead><tbody>{filtered.map(row => <tr key={row.id} style={{ borderTop: "1px solid #eff0ec" }}><td style={{ padding: 15 }}><strong style={{ display: "block", fontSize: 13 }}>{row.vendors?.business_name || row.title}</strong><span style={{ display: "block", color: "#777e76", marginTop: 4 }}>{row.vendors?.category || "Service"} · {row.service_description}</span></td><td style={{ padding: 15 }}><Link href={"/weddings/" + row.wedding.id} style={{ color: "#244b3c", fontWeight: 700 }}>{row.wedding.title} ↗</Link></td><td style={{ padding: 15, fontWeight: 700 }}>{money(Number(row.final_amount ?? row.quoted_amount ?? 0), row.wedding.currency)}</td><td style={{ padding: 15 }}><span style={{ display: "inline-block", borderRadius: 20, padding: "6px 9px", textTransform: "capitalize", background: pill[row.status] || "#eef0ec" }}>{row.status.replace("_", " ")}</span></td><td style={{ padding: 15 }}><Link href={"/weddings/" + row.wedding.id} style={{ color: "#244b3c", fontWeight: 700 }}>Manage →</Link></td></tr>)}</tbody></table></div>}</section>
  </main>;
}
function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <article style={{ background: "white", border: "1px solid #e6e8e2", borderRadius: 13, padding: 17 }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: "#617667", fontSize: 12 }}>{icon}{label}</div><strong style={{ display: "block", fontSize: 24, margin: "14px 0 5px", letterSpacing: -0.7 }}>{value}</strong><small style={{ color: "#858b83" }}>{note}</small></article> }
