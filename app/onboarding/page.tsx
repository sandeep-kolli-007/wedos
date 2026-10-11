"use client";

import Link from "next/link";
import { ArrowRight, Heart, UsersRound, ShieldCheck } from "lucide-react";

export default function OnboardingPage() {
  return <main className="setup-shell">
    <header className="setup-topbar">
      <Link href="/login" className="setup-brand"><span className="setup-brand-mark">w.</span><span>wedos</span></Link>
      <span className="setup-secure"><ShieldCheck size={15}/> Private wedding workspace</span>
    </header>
    <section className="setup-content">
      <div className="setup-kicker">GETTING STARTED</div>
      <h1>How are you planning this wedding?</h1>
      <p className="setup-intro">We'll tailor your workspace to the way you work. You can invite your partner or collaborate with a planner later.</p>
      <div className="setup-choice-grid">
        <Link href="/onboarding/couple" className="setup-choice">
          <div className="setup-choice-icon"><Heart size={22}/></div>
          <div className="setup-choice-copy">
            <span className="setup-choice-label">FOR THE COUPLE</span>
            <h2>We're planning our own wedding</h2>
            <p>Create a shared space for you and your partner to manage ceremonies, budget, guests, vendors and every decision.</p>
          </div>
          <div className="setup-choice-footer"><span>Set up our wedding</span><ArrowRight size={17}/></div>
        </Link>
        <Link href="/onboarding/planner" className="setup-choice">
          <div className="setup-choice-icon"><UsersRound size={22}/></div>
          <div className="setup-choice-copy">
            <span className="setup-choice-label">FOR EVENT PLANNERS</span>
            <h2>I'm setting this up for a couple</h2>
            <p>Create a wedding workspace for your clients. The couple's planning details stay organised in one shared place.</p>
          </div>
          <div className="setup-choice-footer"><span>Create a couple's workspace</span><ArrowRight size={17}/></div>
        </Link>
      </div>
      <p className="setup-footnote">You can invite collaborators after setup. Access is limited to the people you choose.</p>
    </section>
  </main>;
}
