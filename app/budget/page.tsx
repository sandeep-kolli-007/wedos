"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleDollarSign, CreditCard, WalletCards } from "lucide-react";

type Wedding = { id: string; title: string; budget: number; currency: string };
type Payment = { id: string; title: string; amount: number; due_date: string | null; status: string };
type Booking = { id: string; quoted_amount: number; final_amount: number | null; status: string };
type Detail = { wedding: Wedding; payments: Payment[]; vendor_bookings: Booking[] };
const money = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const tone: Record<string, string> = { paid: "#e3efe6", due: "#f6eddb", overdue: "#f6e5e2", planned: "#eff0ec", cancelled: "#f1eff5" };

export default function BudgetPage() {
  const [rows, setRows] = useState<Array<{ wedding: Wedding; payments: Payment[]; bookings: Booking[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/weddings", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load budgets");
        const weddings: Wedding[] = payload.weddings || [];
        const details = await Promise.all(weddings.map(async wedding => {
          const result = await fetch("/api/weddings/" + encodeURIComponent(wedding.id), { cache: "no-store" });
          const data = await result.json();
          if (!result.ok) throw new Error(data.error || "Unable to load payments");
          const detail = data as Detail;
          return { wedding, payments: detail.payments || [], bookings: detail.vendor_bookings || [] };
        }));
        if (!cancelled) setRows(details);
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load budgets"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, []);
  const visible = rows.filter(row => row.wedding.title.toLowerCase().includes(query.toLowerCase()));
  const planned = rows.reduce((sum, row) => sum + Number(row.wedding.budget || 0), 0);
  const committed = rows.reduce((sum, row) => sum + row.bookings.filter(booking => booking.status !== "cancelled").reduce((total, booking) => total + Number(booking.final_amount ?? booking.quoted_amount ?? 0), 0), 0);
  const paid = rows.reduce((sum, row) => sum + row.payments.filter(payment => payment.status === "paid").reduce((total, payment) => total + Number(payment.amount || 0), 0), 0);
  const allPayments = useMemo(() => visible.flatMap(row => row.payments.map(payment => ({ ...payment, wedding: row.wedding }))).sort((a,b) => (a.due_date || "9999").localeCompare(b.due_date || "9999")), [visible]);
  return <main style={{ minHeight: "100vh", background: "#f8f8f5", color: "#202322", padding: "24px clamp(16px,4vw,56px) 60px", fontFamily: "DM Sans, sans-serif" }}>
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: "1px solid #e6e8e2", paddingBottom: 18 }}><Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}><ArrowLeft size={16}/> Dashboard</Link><span style={{ letterSpacing: 2, fontSize: 11, color: "#718075" }}>WEDOS / FINANCE</span><Link href="/weddings" style={{ fontSize: 12, fontWeight: 700, color: "#244b3c" }}>All weddings ↗</Link></header>
    <section style={{ padding: "32px 0 24px" }}><div style={{ color: "#8b9189", fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>FINANCE, CONNECTED TO BOOKINGS</div><h1 style={{ fontSize: "clamp(30px,4vw,44px)", letterSpacing: -1.5, margin: "8px 0" }}>Budget & payments</h1><p style={{ color: "#777e76", fontSize: 14, margin: 0 }}>Planned budgets, vendor commitments and payment milestones from live wedding workspaces.</p></section>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 22 }}><Metric icon={<CircleDollarSign size={17}/>} label="Total planned budget" value={money(planned)} note="Across all weddings"/><Metric icon={<WalletCards size={17}/>} label="Vendor commitments" value={money(committed)} note="Quoted or final booking values"/><Metric icon={<CreditCard size={17}/>} label="Payments recorded" value={money(paid)} note="Milestones marked paid"/></section>
    {error && <div role="alert" style={{ background: "#f9e8e4", color: "#873d32", borderRadius: 10, padding: 14, marginBottom: 14 }}>{error} <Link href="/login" style={{ textDecoration: "underline" }}>Sign in</Link></div>}
    <section style={{ background: "white", border: "1px solid #e6e8e2", borderRadius: 14, padding: 18, marginBottom: 18 }}><h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Wedding budget allocation</h2>{loading ? <p style={{ color: "#777e76" }}>Loading finance data…</p> : visible.length === 0 ? <p style={{ color: "#777e76", fontSize: 13 }}>No wedding budgets match this search.</p> : visible.map(row => { const booked = row.bookings.filter(item => item.status !== "cancelled").reduce((sum,item)=>sum+Number(item.final_amount ?? item.quoted_amount ?? 0),0); const ratio = row.wedding.budget > 0 ? Math.min(100, booked / row.wedding.budget * 100) : 0; return <div key={row.wedding.id} style={{ padding: "14px 0", borderTop: "1px solid #eff0ec" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 9 }}><Link href={"/weddings/" + row.wedding.id} style={{ fontWeight: 700, fontSize: 13, color: "#244b3c" }}>{row.wedding.title} ↗</Link><span style={{ fontSize: 12 }}>{money(booked,row.wedding.currency)} <span style={{ color: "#858b83" }}>/ {money(Number(row.wedding.budget),row.wedding.currency)}</span></span></div><div style={{ height: 7, background: "#eef0eb", borderRadius: 20, overflow: "hidden" }}><div style={{ width: ratio + "%", height: "100%", background: ratio > 90 ? "#bd765b" : "#47765b", borderRadius: 20 }}/></div><small style={{ display: "block", marginTop: 6, color: "#858b83" }}>{Math.round(ratio)}% of planned budget committed</small></div> })}</section>
    <section style={{ background: "white", border: "1px solid #e6e8e2", borderRadius: 14, overflow: "hidden" }}><div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 18, borderBottom: "1px solid #eff0ec" }}><div><h2 style={{ fontSize: 16, margin: 0 }}>Payment milestones</h2><p style={{ color: "#858b83", fontSize: 11, margin: "5px 0 0" }}>Due dates and payment status by celebration</p></div><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter weddings" style={{ border: "1px solid #e4e7e0", borderRadius: 9, padding: 10, fontSize: 12 }}/></div>{allPayments.length === 0 ? <div style={{ padding: 32, textAlign: "center" }}><p style={{ color: "#777e76", fontSize: 13 }}>No payment milestones yet. Add one inside a wedding workspace to track deposits and balances.</p><Link href="/weddings" style={{ color: "#244b3c", fontSize: 12, fontWeight: 700 }}>Open weddings →</Link></div> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 12 }}><thead><tr style={{ background: "#fbfbf9", color: "#858b83", textAlign: "left" }}>{["MILESTONE","WEDDING","DUE DATE","AMOUNT","STATUS"].map(label => <th key={label} style={{ padding: 14, fontSize: 10, letterSpacing: 1 }}>{label}</th>)}</tr></thead><tbody>{allPayments.map(payment => <tr key={payment.id} style={{ borderTop: "1px solid #eff0ec" }}><td style={{ padding: 14, fontWeight: 700 }}>{payment.title}</td><td style={{ padding: 14 }}><Link href={"/weddings/" + payment.wedding.id} style={{ color: "#244b3c" }}>{payment.wedding.title} ↗</Link></td><td style={{ padding: 14 }}>{payment.due_date ? new Date(payment.due_date + "T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "Unscheduled"}</td><td style={{ padding: 14, fontWeight: 700 }}>{money(Number(payment.amount),payment.wedding.currency)}</td><td style={{ padding: 14 }}><span style={{ display: "inline-block", padding: "5px 8px", borderRadius: 20, background: tone[payment.status] || "#eff0ec", textTransform: "capitalize" }}>{payment.status}</span></td></tr>)}</tbody></table></div>}</section>
  </main>;
}
function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <article style={{ background: "white", border: "1px solid #e6e8e2", borderRadius: 13, padding: 17 }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: "#617667", fontSize: 12 }}>{icon}{label}</div><strong style={{ display: "block", fontSize: 24, margin: "14px 0 5px", letterSpacing: -0.7 }}>{value}</strong><small style={{ color: "#858b83" }}>{note}</small></article> }
