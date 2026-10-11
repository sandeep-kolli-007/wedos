"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, Heart, CalendarDays, WalletCards } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + "/auth/callback?next=/onboarding" } });
      if (authError) throw authError;
      setMessage("Magic link sent. Check your inbox to securely sign in.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send sign-in link."); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-screen bg-neutral-50 lg:grid-cols-[minmax(0,1.1fr)_minmax(400px,.9fr)]">
    <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-white lg:flex xl:p-16">
      <div className="absolute -right-40 top-24 size-[520px] rounded-full border border-white/[.08]"/><div className="absolute -right-16 top-48 size-[360px] rounded-full border border-white/[.08]"/>
      <Link href="/" className="relative flex items-center gap-2.5 text-lg font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-lg bg-white text-sm font-bold text-neutral-950">w.</span> wedos<span className="text-neutral-500">.</span></Link>
      <div className="relative max-w-xl py-12"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-neutral-300"><span className="size-1.5 rounded-full bg-emerald-400"/> THE PLANNER’S WORKSPACE</div><h1 className="text-5xl font-semibold leading-[1.08] tracking-[-2.6px] xl:text-6xl">The work behind<br/>the wonderful.</h1><p className="mt-6 max-w-md text-sm leading-7 text-neutral-400">Every celebration has a thousand moving parts. Keep the people, plans, budgets and creative details connected in one workspace.</p>
        <div className="mt-9 grid max-w-md grid-cols-3 gap-3">{[{icon:CalendarDays,label:"Operations"},{icon:WalletCards,label:"Budgets"},{icon:Heart,label:"Celebrations"}].map(item=>{const Icon=item.icon;return <div key={item.label} className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Icon size={17} className="text-neutral-300"/><p className="mt-5 text-[11px] font-medium text-neutral-300">{item.label}</p></div>})}</div>
      </div><p className="relative text-[11px] text-neutral-500">A calmer command centre for unforgettable celebrations.</p>
    </section>
    <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-12 flex items-center gap-2 text-lg font-semibold tracking-tight lg:hidden"><span className="grid size-8 place-items-center rounded-lg bg-neutral-900 text-sm text-white">w.</span> wedos<span className="text-neutral-400">.</span></Link>
        <div className="mb-6 grid size-11 place-items-center rounded-xl border border-neutral-200 bg-white shadow-sm"><ShieldCheck size={21} className="text-neutral-700"/></div>
        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">Welcome to WedOS</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.8px]">Sign in to your studio</h2><p className="mt-2 text-sm leading-6 text-neutral-500">Enter your work email. We’ll send a secure sign-in link—no password to remember.</p>
        <form onSubmit={submit} className="mt-7 space-y-4"><div><label htmlFor="email" className="mb-1.5 block text-xs font-medium">Work email</label><div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/><Input id="email" className="pl-9" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@yourstudio.com"/></div></div><Button className="w-full" size="lg" disabled={busy} type="submit">{busy?"Sending link…":<>Email me a sign-in link <ArrowRight size={15}/></>}</Button></form>
        {message&&<div role="status" className="mt-4 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0"/>{message}</div>}
        {error&&<div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</div>}
        <p className="mt-6 text-[11px] leading-5 text-neutral-500">Your studio data is private to your workspace. Access is controlled by your organisation’s membership.</p>
        <Link href="/" className="mt-5 inline-block text-xs font-medium text-neutral-600 hover:text-neutral-900">← Back to dashboard preview</Link>
      </div>
    </section>
  </main>;
}
