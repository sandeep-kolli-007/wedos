"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleDollarSign, CreditCard, WalletCards, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Wedding = { id: string; title: string; budget: number; currency: string };
type Payment = { id: string; title: string; amount: number; due_date: string | null; status: string };
type Booking = { id: string; quoted_amount: number; final_amount: number | null; status: string };
type Detail = { wedding: Wedding; payments: Payment[]; vendor_bookings: Booking[] };
const money = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

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

  return <main className="min-h-screen bg-neutral-50 text-neutral-900">
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-8"><Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600"><ArrowLeft size={15}/> Overview</Link><span className="hidden text-[10px] font-semibold tracking-[.15em] text-neutral-400 sm:inline">WEDOS / FINANCE</span><Link href="/weddings" className="text-xs font-medium text-neutral-600 hover:text-neutral-900">All weddings ↗</Link></header>
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-8">
      <div className="mb-7"><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">Finance, connected to bookings</div><h1 className="text-3xl font-semibold tracking-[-1.2px]">Budget & payments</h1><p className="mt-2 text-sm text-neutral-500">Planned budgets, vendor commitments and payment milestones from wedding workspaces.</p></div>
      <section className="mb-5 grid gap-3 sm:grid-cols-3">{[{label:"Total planned budget",value:money(planned),note:"Across all weddings",icon:CircleDollarSign},{label:"Vendor commitments",value:money(committed),note:"Quoted or final booking values",icon:WalletCards},{label:"Payments recorded",value:money(paid),note:"Milestones marked paid",icon:CreditCard}].map(metric=>{const Icon=metric.icon;return <Card key={metric.label}><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-neutral-500">{metric.label}</p><span className="grid size-8 place-items-center rounded-lg bg-neutral-100 text-neutral-600"><Icon size={16}/></span></div><p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">{metric.value}</p><p className="mt-1 text-[11px] text-neutral-500">{metric.note}</p></CardContent></Card>})}</section>
      {error&&<div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"><span>{error}</span><Button variant="outline" size="sm" onClick={()=>window.location.reload()}><RefreshCw size={13}/> Retry</Button></div>}
      <Card className="mb-4"><CardHeader><div><CardTitle>Budget allocation</CardTitle><CardDescription>Committed vendor spend against each wedding’s planned budget.</CardDescription></div><Badge variant="outline">{rows.length} weddings</Badge></CardHeader><CardContent className="pt-0">
        {loading?<div className="space-y-4 py-3">{[1,2,3].map(i=><div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100"/>)}</div>:visible.length===0?<p className="py-7 text-center text-xs text-neutral-500">No wedding budgets match this search.</p>:visible.map(row=>{const booked=row.bookings.filter(item=>item.status!=="cancelled").reduce((sum,item)=>sum+Number(item.final_amount??item.quoted_amount??0),0);const ratio=row.wedding.budget>0?Math.min(100,booked/row.wedding.budget*100):0;return <div key={row.wedding.id} className="border-t border-neutral-100 py-4 first:border-0"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><Link href={"/weddings/"+row.wedding.id} className="text-xs font-medium hover:underline">{row.wedding.title} ↗</Link><p className="text-xs font-medium tabular-nums">{money(booked,row.wedding.currency)} <span className="font-normal text-neutral-400">/ {money(Number(row.wedding.budget),row.wedding.currency)}</span></p></div><div className="h-2 overflow-hidden rounded-full bg-neutral-100"><div className={`h-full rounded-full ${ratio>90?"bg-amber-600":"bg-neutral-800"}`} style={{width:ratio+"%"}}/></div><p className="mt-1.5 text-[11px] text-neutral-500">{Math.round(ratio)}% of planned budget committed</p></div>})}
      </CardContent></Card>
      <Card className="overflow-hidden"><CardHeader><div><CardTitle>Payment milestones</CardTitle><CardDescription>Due dates and payment status by celebration.</CardDescription></div><label className="relative hidden w-56 sm:block"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/><Input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Filter weddings" className="pl-8"/></label></CardHeader>
        {allPayments.length===0?<CardContent><div className="flex flex-col items-center py-10 text-center"><span className="grid size-10 place-items-center rounded-xl bg-neutral-100"><CreditCard size={18}/></span><p className="mt-3 text-sm font-medium">No payment milestones yet</p><p className="mt-1 max-w-sm text-xs leading-5 text-neutral-500">Add payment milestones inside a wedding workspace to track deposits and balances.</p><Button variant="outline" className="mt-4" onClick={()=>window.location.href="/weddings"}>Open weddings</Button></div></CardContent>:<div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="border-y border-neutral-100 bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500"><tr>{["Milestone","Wedding","Due date","Amount","Status"].map(label=><th key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-neutral-100">{allPayments.map(payment=><tr key={payment.id} className="hover:bg-neutral-50/70"><td className="px-5 py-4 font-medium">{payment.title}</td><td className="px-5 py-4"><Link href={"/weddings/"+payment.wedding.id} className="hover:underline">{payment.wedding.title} ↗</Link></td><td className="px-5 py-4 text-neutral-500">{payment.due_date?new Date(payment.due_date+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"Unscheduled"}</td><td className="px-5 py-4 font-medium tabular-nums">{money(Number(payment.amount),payment.wedding.currency)}</td><td className="px-5 py-4"><Badge variant={payment.status==="paid"?"success":payment.status==="overdue"?"danger":payment.status==="due"?"warning":"outline"} className="capitalize">{payment.status}</Badge></td></tr>)}</tbody></table></div>}
      </Card>
    </div>
  </main>;
}
