"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search, Users, WalletCards, RefreshCw, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Wedding = { id: string; title: string; currency: string; budget: number };
type Booking = { id: string; title: string; service_description: string; quoted_amount: number; final_amount: number | null; status: string; vendors: { business_name: string; category: string } | null };
type Detail = { wedding: Wedding; vendor_bookings: Booking[] };
const money = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

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
          return ((data as Detail).vendor_bookings || []).map(booking => ({ ...booking, wedding }));
        }));
        if (!cancelled) setRows(details.flat());
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load vendors"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, []);
  const categories = useMemo(() => ["All categories", ...Array.from(new Set(rows.map(row => row.vendors?.category).filter((value): value is string => Boolean(value)))).sort()], [rows]);
  const filtered = rows.filter(row => ((row.vendors?.business_name || row.title) + " " + (row.vendors?.category || "") + " " + row.wedding.title).toLowerCase().includes(query.toLowerCase()) && (category === "All categories" || row.vendors?.category === category));
  const committed = rows.filter(row => row.status !== "cancelled").reduce((sum, row) => sum + Number(row.final_amount ?? row.quoted_amount ?? 0), 0);
  const confirmed = rows.filter(row => ["confirmed", "completed"].includes(row.status)).length;
  return <main className="min-h-screen bg-neutral-50 text-neutral-900">
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-8"><Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600"><ArrowLeft size={15}/> Overview</Link><span className="hidden text-[10px] font-semibold tracking-[.15em] text-neutral-400 sm:inline">WEDOS / VENDORS</span><Link href="/weddings" className="text-xs font-medium text-neutral-600 hover:text-neutral-900">Wedding workspaces ↗</Link></header>
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">Connected operations</div><h1 className="text-3xl font-semibold tracking-[-1.2px]">Vendor directory</h1><p className="mt-2 text-sm text-neutral-500">Bookings, quotes and commitments across your celebrations.</p></div><Button variant="outline" onClick={()=>window.location.href="/weddings"}>Add vendor from a wedding <ArrowUpRight size={15}/></Button></div>
      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        {[{label:"Vendor bookings",value:String(rows.length),note:"Across all weddings",icon:Users},{label:"Quoted / committed",value:money(committed),note:"Excludes cancelled bookings",icon:WalletCards},{label:"Confirmed services",value:String(confirmed),note:"Confirmed or completed",icon:ArrowUpRight}].map(metric=>{const Icon=metric.icon;return <Card key={metric.label}><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-neutral-500">{metric.label}</p><span className="grid size-8 place-items-center rounded-lg bg-neutral-100 text-neutral-600"><Icon size={16}/></span></div><p className="mt-4 text-2xl font-semibold tracking-tight">{metric.value}</p><p className="mt-1 text-[11px] text-neutral-500">{metric.note}</p></CardContent></Card>})}
      </section>
      <div className="mb-4 flex flex-wrap gap-2"><label className="relative min-w-[200px] flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/><Input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search vendor, category or wedding" className="pl-9"/></label><select aria-label="Filter by vendor category" value={category} onChange={event=>setCategory(event.target.value)} className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs">{categories.map(item=><option key={item}>{item}</option>)}</select></div>
      {error&&<div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"><span>{error}</span><Button variant="outline" size="sm" onClick={()=>window.location.reload()}><RefreshCw size={13}/> Retry</Button></div>}
      <Card className="overflow-hidden"><CardHeader><div><CardTitle>Bookings & commitments</CardTitle><CardDescription>Vendor services attached to wedding workspaces.</CardDescription></div><Badge variant="outline">{filtered.length} records</Badge></CardHeader>
        {loading?<CardContent><div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100"/>)}</div></CardContent>:filtered.length===0?<CardContent><div className="flex flex-col items-center py-12 text-center"><span className="grid size-11 place-items-center rounded-xl bg-neutral-100"><Building2 size={20}/></span><h2 className="mt-3 text-sm font-semibold">{query?"No matching vendors":"No vendor bookings yet"}</h2><p className="mt-1 max-w-sm text-xs leading-5 text-neutral-500">Open a wedding workspace to add vendors, compare quotes and record commitments.</p><Button variant="outline" className="mt-4" onClick={()=>window.location.href="/weddings"}>Open weddings <ArrowUpRight size={14}/></Button></div></CardContent>:
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="border-y border-neutral-100 bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500"><tr>{["Vendor / service","Wedding","Quote","Status",""].map(label=><th key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-neutral-100">{filtered.map(row=><tr key={row.id} className="hover:bg-neutral-50/70"><td className="px-5 py-4"><p className="font-medium text-neutral-900">{row.vendors?.business_name||row.title}</p><p className="mt-1 max-w-[320px] truncate text-[11px] text-neutral-500">{row.vendors?.category||"Service"} · {row.service_description||"No description"}</p></td><td className="px-5 py-4"><Link href={"/weddings/"+row.wedding.id} className="font-medium text-neutral-700 hover:underline">{row.wedding.title} ↗</Link></td><td className="px-5 py-4 font-medium tabular-nums">{money(Number(row.final_amount??row.quoted_amount??0),row.wedding.currency)}</td><td className="px-5 py-4"><Badge variant={["confirmed","completed"].includes(row.status)?"success":row.status==="cancelled"?"danger":row.status==="quoted"?"warning":"outline"} className="capitalize">{row.status.replaceAll("_"," ")}</Badge></td><td className="px-5 py-4"><Link href={"/weddings/"+row.wedding.id} className="font-medium text-neutral-700 hover:underline">Manage →</Link></td></tr>)}</tbody></table></div>}
      </Card>
    </div>
  </main>;
}
