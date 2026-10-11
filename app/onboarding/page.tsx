"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Heart, UsersRound, ShieldCheck } from "lucide-react";

export default function OnboardingPage() {
  useEffect(() => {
    const persona = localStorage.getItem("wedos-persona");
    if (!persona) return;
    fetch("/api/workspace", { cache: "no-store" })
      .then(async response => response.ok ? response.json() : null)
      .then(payload => {
        if (!payload?.membership) return;
        window.location.replace(persona === "couple" ? "/my-wedding" : "/weddings");
      })
      .catch(() => undefined);
  }, []);
  return <main className="setup-shell">
    <header className="setup-topbar">
      <Link href="/login" className="setup-brand"><span className="setup-brand-mark">w.</span><span>wedos</span></Link>
      <span className="setup-secure"><ShieldCheck size={15}/> Private wedding workspace</span>
    </header>
    <section className="setup-content">
      <div className="setup-kicker">GETTING STARTED</div>
      <h1>How are you planning this wedding?</h1>
      <p className="setup-intro">We&apos;ll tailor your workspace to the way you work. You can invite your partner or collaborate with a planner later.</p>
      <div className="setup-choice-grid">
        <Link href="/onboarding/couple" className="setup-choice" onClick={() => localStorage.setItem("wedos-persona", "couple")}>
          <div className="setup-choice-icon"><Heart size={22}/></div>
          <div className="setup-choice-copy">
            <span className="setup-choice-label">FOR THE COUPLE</span>
            <h2>We&apos;re planning our own wedding</h2>
            <p>Create a shared space for you and your partner to manage ceremonies, budget, guests, vendors and every decision.</p>
          </div>
          <div className="setup-choice-footer"><span>Set up our wedding</span><ArrowRight size={17}/></div>
        </Link>
        <Link href="/onboarding/planner" className="setup-choice" onClick={() => localStorage.setItem("wedos-persona", "planner")}>
          <div className="setup-choice-icon"><UsersRound size={22}/></div>
          <div className="setup-choice-copy">
            <span className="setup-choice-label">FOR EVENT PLANNERS</span>
            <h2>I&apos;m setting this up for a couple</h2>
            <p>Create a wedding workspace for your clients. The couple&apos;s planning details stay organised in one shared place.</p>
          </div>
          <div className="setup-choice-footer"><span>Create a couple&apos;s workspace</span><ArrowRight size={17}/></div>
        </Link>
      </div>
      <p className="setup-footnote">You can invite collaborators after setup. Access is limited to the people you choose.</p>
    </section>
  </main>;
}
