"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Heart, UsersRound, ShieldCheck, CalendarDays, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  useEffect(() => {
    fetch("/api/workspace", { cache: "no-store" })
      .then(async response => response.ok ? response.json() : null)
      .then(async payload => {
        if (!payload?.membership) return;
        const weddingsResponse = await fetch("/api/weddings", { cache: "no-store" });
        const weddingsPayload = weddingsResponse.ok ? await weddingsResponse.json() : null;
        if (!weddingsPayload?.weddings?.length) return;
        const kind = payload.membership.workspaces?.workspace_kind;
        window.location.replace(kind === "couple" ? "/my-wedding" : "/weddings");
      }).catch(() => undefined);
  }, []);
  return <main className="min-h-screen bg-neutral-50">
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-5 sm:px-10"><Link href="/login" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"><span className="grid size-8 place-items-center rounded-lg bg-neutral-900 text-sm text-white">w.</span> wedos<span className="text-neutral-400">.</span></Link><span className="inline-flex items-center gap-2 text-[11px] text-neutral-500"><ShieldCheck size={15}/> Private wedding workspace</span></header>
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-12 sm:pt-16">
      <div className="mx-auto max-w-2xl text-center"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-neutral-500">Getting started</p><h1 className="mt-3 text-3xl font-semibold tracking-[-1.4px] sm:text-4xl">How are you planning this wedding?</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-neutral-500">We’ll tailor your workspace to the way you work. Invite your partner or collaborate with a professional planner later.</p></div>
      <div className="mt-9 grid gap-4 md:grid-cols-2">
        <Link href="/onboarding/couple" onClick={()=>localStorage.setItem("wedos-persona","couple")} className="group flex min-h-[300px] flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-400 hover:shadow-md sm:p-7">
          <div className="grid size-11 place-items-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700"><Heart size={20}/></div><p className="mt-6 text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">For the couple</p><h2 className="mt-2 text-xl font-semibold tracking-tight">We’re planning our own wedding</h2><p className="mt-3 flex-1 text-sm leading-6 text-neutral-500">Create a shared space to manage ceremonies, budget, guests, vendors and every decision together.</p><div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs font-medium"><span>Set up our wedding</span><ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/></div>
        </Link>
        <Link href="/onboarding/planner" onClick={()=>localStorage.setItem("wedos-persona","planner")} className="group flex min-h-[300px] flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-400 hover:shadow-md sm:p-7">
          <div className="grid size-11 place-items-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700"><UsersRound size={20}/></div><p className="mt-6 text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">For event planners</p><h2 className="mt-2 text-xl font-semibold tracking-tight">I’m setting this up for a couple</h2><p className="mt-3 flex-1 text-sm leading-6 text-neutral-500">Create a client wedding workspace. Plans, approvals, vendor commitments and budgets stay connected.</p><div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs font-medium"><span>Create a client workspace</span><ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/></div>
        </Link>
      </div>
      <p className="mt-7 flex items-center justify-center gap-2 text-center text-[11px] text-neutral-500"><CheckCircle2 size={14}/> Invite collaborators after setup. Access is limited to your workspace members.</p>
    </div>
  </main>;
}
